import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CartCreateDto } from './dto/cart-create.dto';
import { PaymentLinkDto } from './dto/payment-link.dto';
import { PhonePaymentLinkDto } from './dto/phone-payment-link.dto';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import Stripe from 'stripe';
import { CheckoutSessionDto } from './dto/checkout-session.dto';

type ResolvedMenuPriceItem = {
  raw: any;
  menuItemId: string;
  name: string;
  quantity: number;
  unitAmountCents: number;
};

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
  }

  private makeWebhookTimeoutMs() {
    return Number(this.config.get<string>('MAKE_WEBHOOK_TIMEOUT_MS') || 5000);
  }

  private async fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  private async requestMakePaymentLink(payload: Record<string, any>) {
    const makeUrl = this.config.get<string>('MAKE_WEBHOOK_URL');
    if (!makeUrl) return null;
    try {
      const resp = await this.fetchWithTimeout(
        makeUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        this.makeWebhookTimeoutMs(),
      );
      const body = await resp.json().catch(() => ({}));
      return body.payment_link || null;
    } catch {
      return null;
    }
  }

  private toCents(value: unknown) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return 0;
    return Math.round(numeric * 100);
  }

  private normalizeRawItems(value: unknown) {
    return Array.isArray(value) ? (value as any[]) : [];
  }

  private async resolveMenuPricedItems(items: any[]): Promise<ResolvedMenuPriceItem[]> {
    if (!items.length) return [];

    const parsed = items.map((raw, index) => {
      const id = String(raw?.menuItem?.id ?? raw?.menuItemId ?? raw?.id ?? '').trim();
      if (!id) throw new BadRequestException(`menu_item_id_required_at_index_${index}`);

      const quantity = Number(raw?.quantity ?? raw?.qty ?? 1);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new BadRequestException(`invalid_quantity_at_index_${index}`);
      }

      return { raw, menuItemId: id, quantity };
    });

    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: Array.from(new Set(parsed.map((item) => item.menuItemId))) } },
      select: { id: true, name: true, price: true },
    });
    const byId = new Map(menuItems.map((row) => [row.id, row]));

    return parsed.map((item) => {
      const menuItem = byId.get(item.menuItemId);
      if (!menuItem) throw new BadRequestException(`menu_item_not_found:${item.menuItemId}`);

      const unitAmountCents = this.toCents(menuItem.price);
      if (unitAmountCents <= 0) throw new BadRequestException(`invalid_menu_item_price:${item.menuItemId}`);

      return {
        raw: item.raw,
        menuItemId: item.menuItemId,
        name: menuItem.name || 'Item',
        quantity: item.quantity,
        unitAmountCents,
      };
    });
  }

  private totalFromResolvedItems(resolvedItems: ResolvedMenuPriceItem[]) {
    return resolvedItems.reduce((sum, item) => sum + item.unitAmountCents * item.quantity, 0);
  }

  private toPersistedItems(resolvedItems: ResolvedMenuPriceItem[]) {
    return resolvedItems.map((item) => {
      const raw = item.raw && typeof item.raw === 'object' ? item.raw : {};
      const existingMenuItem = raw.menuItem && typeof raw.menuItem === 'object' ? raw.menuItem : {};
      return {
        ...raw,
        id: item.menuItemId,
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.unitAmountCents / 100,
        quantity: item.quantity,
        menuItem: {
          ...existingMenuItem,
          id: item.menuItemId,
          name: item.name,
          price: item.unitAmountCents / 100,
        },
      };
    });
  }

  private toStripeLineItems(resolvedItems: ResolvedMenuPriceItem[], currency: string) {
    return resolvedItems.map((item) => ({
      price_data: {
        currency,
        product_data: { name: item.name },
        unit_amount: item.unitAmountCents,
      },
      quantity: item.quantity,
    }));
  }

  async createCart(dto: CartCreateDto) {
    const order_id = `ord_${randomUUID()}`;
    const rawItems = this.normalizeRawItems(dto.items);
    const resolvedItems = await this.resolveMenuPricedItems(rawItems);
    if (!resolvedItems.length) throw new BadRequestException('items_required');
    const itemsTotalCents = this.totalFromResolvedItems(resolvedItems);
    const amount = itemsTotalCents / 100;
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('amount_required');
    const items = resolvedItems.length ? this.toPersistedItems(resolvedItems) : rawItems;

    await this.prisma.paymentLink.upsert({
      where: { orderId: order_id },
      update: {
        amount,
        fulfillment: dto.fulfillment,
        channel: dto.channel || 'web',
        items,
        customerName: dto.customerName ?? null,
        customerPhone: dto.customerPhone ?? null,
        state: 'AWAITING_PAYMENT',
        updatedAt: new Date(),
      },
      create: {
        orderId: order_id,
        userId: dto.user_id ?? null,
        amount,
        state: 'AWAITING_PAYMENT',
        fulfillment: dto.fulfillment,
        channel: dto.channel || 'web',
        items,
        customerName: dto.customerName ?? null,
        customerPhone: dto.customerPhone ?? null,
      },
    });
    return { order_id, amount, state: 'AWAITING_PAYMENT' };
  }

  async createPaymentLink(dto: PaymentLinkDto) {
    const existing = await this.prisma.paymentLink.findUnique({ where: { orderId: dto.order_id } });
    if (!existing) throw new NotFoundException('order_not_found');
    const rawItems = this.normalizeRawItems(existing.items);
    const resolvedItems = await this.resolveMenuPricedItems(rawItems);
    if (!resolvedItems.length) throw new BadRequestException('items_required');
    const itemsTotalCents = this.totalFromResolvedItems(resolvedItems);
    const amount = itemsTotalCents / 100;
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('amount_required');
    const items = resolvedItems.length ? this.toPersistedItems(resolvedItems) : rawItems;

    let payment_link = `https://pay.example/${dto.order_id}`;
    const makePaymentLink = await this.requestMakePaymentLink({
      user_id: dto.user_id,
      order_id: dto.order_id,
      amount,
    });
    if (makePaymentLink) payment_link = makePaymentLink;

    await this.prisma.paymentLink.update({
      where: { orderId: dto.order_id },
      data: { amount, items, state: 'AWAITING_PAYMENT', paymentLink: payment_link, updatedAt: new Date() },
    });

    return { payment_link, amount, state: 'AWAITING_PAYMENT' };
  }

  async getPayment(orderId: string) {
    const row = await this.prisma.paymentLink.findUnique({ where: { orderId } });
    if (!row) throw new NotFoundException('order_not_found');
    return row;
  }

  async phonePaymentLink(dto: PhonePaymentLinkDto) {
    const order_id = `ord_${randomUUID()}`;
    const rawItems = this.normalizeRawItems(dto.items);
    const resolvedItems = await this.resolveMenuPricedItems(rawItems);
    if (!resolvedItems.length) throw new BadRequestException('items_required');
    const itemsTotalCents = this.totalFromResolvedItems(resolvedItems);
    const amount = itemsTotalCents / 100;
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('amount_required');
    const items = resolvedItems.length ? this.toPersistedItems(resolvedItems) : rawItems;

    await this.prisma.paymentLink.upsert({
      where: { orderId: order_id },
      update: {
        amount,
        fulfillment: dto.fulfillment || 'pickup',
        channel: 'phone',
        items,
        customerName: dto.customerName ?? null,
        customerPhone: dto.customerPhone ?? null,
        state: 'AWAITING_PAYMENT',
        updatedAt: new Date(),
      },
      create: {
        orderId: order_id,
        amount,
        state: 'AWAITING_PAYMENT',
        fulfillment: dto.fulfillment || 'pickup',
        channel: 'phone',
        items,
        customerName: dto.customerName ?? null,
        customerPhone: dto.customerPhone ?? null,
      },
    });

    let payment_link = `https://pay.example/${order_id}`;
    const makePaymentLink = await this.requestMakePaymentLink({ order_id, amount });
    if (makePaymentLink) payment_link = makePaymentLink;

    await this.prisma.paymentLink.update({
      where: { orderId: order_id },
      data: { paymentLink: payment_link, updatedAt: new Date() },
    });

    return { order_id, payment_link, amount, state: 'AWAITING_PAYMENT' };
  }

  async createCheckoutSession(dto: CheckoutSessionDto) {
    const payment = await this.prisma.paymentLink.findUnique({ where: { orderId: dto.order_id } });
    if (!payment) throw new NotFoundException('order_not_found');

    const rawItems = this.normalizeRawItems(payment.items);
    const resolvedItems = await this.resolveMenuPricedItems(rawItems);
    if (!resolvedItems.length) throw new BadRequestException('items_required');
    const items = resolvedItems.length ? this.toPersistedItems(resolvedItems) : rawItems;
    let currency = 'usd';
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (resolvedItems.length) lineItems = this.toStripeLineItems(resolvedItems, currency);

    if (payment.fulfillment === 'delivery') {
      const quote = await (this.prisma as any).deliveryQuote.findUnique({ where: { quote_id: dto.quote_id } });
      if (!quote) throw new BadRequestException('delivery_quote_required');
      if (dto.quote_id && dto.quote_id !== quote.quoteId) throw new BadRequestException('quote_mismatch');
      if (quote.expiresAt && quote.expiresAt.getTime() < Date.now()) throw new BadRequestException('quote_expired');

      currency = quote.currency ? quote.currency.toLowerCase() : currency;
      lineItems = lineItems.map((li) => ({
        ...li,
        price_data: li.price_data ? { ...li.price_data, currency } : li.price_data,
      }));
      lineItems.push({
        price_data: {
          currency,
          product_data: { name: 'Delivery Fee' },
          unit_amount: Math.max(0, quote.feeCents || 0),
        },
        quantity: 1,
      });
    }

    const totalCents = lineItems.reduce((sum, li) => sum + (li.price_data?.unit_amount || 0) * (li.quantity || 1), 0);
    const amount = totalCents / 100;
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('amount_required');
    const customerUrl =
      this.config.get<string>('CUSTOMER_URL') || this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const successUrl = `${customerUrl}/success?order_id=${dto.order_id}`;
    const cancelUrl = `${customerUrl}/cancel?order_id=${dto.order_id}`;

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: dto.order_id,
      payment_intent_data: {
        metadata: {
          order_id: dto.order_id,
          channel: payment.channel || 'web',
          fulfillment: payment.fulfillment || 'pickup',
          customer_name: payment.customerName || '',
          customer_phone: payment.customerPhone || '',
          quote_id: dto.quote_id || '',
        },
      },
    });

    await this.prisma.paymentLink.update({
      where: { orderId: dto.order_id },
      data: { amount, items, paymentLink: session.url || null, state: 'AWAITING_PAYMENT', updatedAt: new Date() },
    });

    return { order_id: dto.order_id, session_id: session.id, payment_link: session.url, amount, state: 'AWAITING_PAYMENT' };
  }
}
