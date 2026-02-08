import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CartCreateDto } from './dto/cart-create.dto';
import { PaymentLinkDto } from './dto/payment-link.dto';
import { PhonePaymentLinkDto } from './dto/phone-payment-link.dto';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import Stripe from 'stripe';
import { CheckoutSessionDto } from './dto/checkout-session.dto';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
  }

  async createCart(dto: CartCreateDto) {
    const order_id = `ord_${randomUUID()}`;
    await this.prisma.paymentLink.upsert({
      where: { orderId: order_id },
      update: {
        amount: dto.amount,
        fulfillment: dto.fulfillment,
        channel: dto.channel || 'web',
        items: (dto.items as any) ?? [],
        customerName: dto.customerName ?? null,
        customerPhone: dto.customerPhone ?? null,
        state: 'AWAITING_PAYMENT',
        updatedAt: new Date(),
      },
      create: {
        orderId: order_id,
        userId: dto.user_id ?? null,
        amount: dto.amount,
        state: 'AWAITING_PAYMENT',
        fulfillment: dto.fulfillment,
        channel: dto.channel || 'web',
        items: (dto.items as any) ?? [],
        customerName: dto.customerName ?? null,
        customerPhone: dto.customerPhone ?? null,
      },
    });
    return { order_id, state: 'AWAITING_PAYMENT' };
  }

  async createPaymentLink(dto: PaymentLinkDto) {
    const existing = await this.prisma.paymentLink.findUnique({ where: { orderId: dto.order_id } });
    if (!existing) throw new NotFoundException('order_not_found');

    let payment_link = `https://pay.example/${dto.order_id}`;
    const makeUrl = this.config.get<string>('MAKE_WEBHOOK_URL');
    if (makeUrl) {
      try {
        const resp = await fetch(makeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: dto.user_id, order_id: dto.order_id, amount: dto.amount }),
        });
        const body = await resp.json().catch(() => ({}));
        if (body.payment_link) payment_link = body.payment_link;
      } catch {
        // ignore webhook errors
      }
    }

    await this.prisma.paymentLink.update({
      where: { orderId: dto.order_id },
      data: { amount: dto.amount, state: 'AWAITING_PAYMENT', paymentLink: payment_link, updatedAt: new Date() },
    });

    return { payment_link, state: 'AWAITING_PAYMENT' };
  }

  async getPayment(orderId: string) {
    const row = await this.prisma.paymentLink.findUnique({ where: { orderId } });
    if (!row) throw new NotFoundException('order_not_found');
    return row;
  }

  async phonePaymentLink(dto: PhonePaymentLinkDto) {
    const order_id = `ord_${randomUUID()}`;
    await this.prisma.paymentLink.upsert({
      where: { orderId: order_id },
      update: {
        amount: dto.amount,
        fulfillment: dto.fulfillment || 'pickup',
        channel: 'phone',
        items: (dto.items as any) ?? [],
        customerName: dto.customerName ?? null,
        customerPhone: dto.customerPhone ?? null,
        state: 'AWAITING_PAYMENT',
        updatedAt: new Date(),
      },
      create: {
        orderId: order_id,
        amount: dto.amount,
        state: 'AWAITING_PAYMENT',
        fulfillment: dto.fulfillment || 'pickup',
        channel: 'phone',
        items: (dto.items as any) ?? [],
        customerName: dto.customerName ?? null,
        customerPhone: dto.customerPhone ?? null,
      },
    });

    let payment_link = `https://pay.example/${order_id}`;
    const makeUrl = this.config.get<string>('MAKE_WEBHOOK_URL');
    if (makeUrl) {
      try {
        const resp = await fetch(makeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id, amount: dto.amount }),
        });
        const body = await resp.json().catch(() => ({}));
        if (body.payment_link) payment_link = body.payment_link;
      } catch {
        // ignore webhook errors
      }
    }

    await this.prisma.paymentLink.update({
      where: { orderId: order_id },
      data: { paymentLink: payment_link, updatedAt: new Date() },
    });

    return { order_id, payment_link, state: 'AWAITING_PAYMENT' };
  }

  async createCheckoutSession(dto: CheckoutSessionDto) {
    const payment = await this.prisma.paymentLink.findUnique({ where: { orderId: dto.order_id } });
    if (!payment) throw new NotFoundException('order_not_found');

    const items = Array.isArray(payment.items) ? (payment.items as any[]) : [];
    let currency = 'usd';
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (items.length) {
      lineItems = items
        .map((item) => {
          const name = item?.menuItem?.name || item?.name || 'Item';
          const unitAmount = Math.round(Number(item?.menuItem?.price ?? item?.price ?? 0) * 100);
          const quantity = Number(item?.quantity || item?.qty || 1);
          if (!unitAmount || unitAmount <= 0) return null;
          return {
            price_data: {
              currency,
              product_data: { name },
              unit_amount: unitAmount,
            },
            quantity,
          };
        })
        .filter(Boolean) as Stripe.Checkout.SessionCreateParams.LineItem[];
    }

    if (!lineItems.length) {
      const fallbackAmount = Number(payment.amount || 0);
      if (!fallbackAmount) throw new BadRequestException('amount_required');
      lineItems = [
        {
          price_data: {
            currency,
            product_data: { name: 'Order' },
            unit_amount: Math.round(fallbackAmount * 100),
          },
          quantity: 1,
        },
      ];
    }

    if (payment.fulfillment === 'delivery') {
      const quote = await (this.prisma as any).deliveryQuote.findUnique({ where: { orderId: dto.order_id } });
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

      const subtotal = lineItems.reduce((sum, li) => sum + (li.price_data?.unit_amount || 0) * (li.quantity || 1), 0);
      await this.prisma.paymentLink.update({
        where: { orderId: dto.order_id },
        data: { amount: subtotal / 100, updatedAt: new Date() },
      });
    }

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
          items: JSON.stringify(payment.items ?? []),
          customer_name: payment.customerName || '',
          customer_phone: payment.customerPhone || '',
          quote_id: dto.quote_id || '',
        },
      },
    });

    await this.prisma.paymentLink.update({
      where: { orderId: dto.order_id },
      data: { paymentLink: session.url || null, state: 'AWAITING_PAYMENT', updatedAt: new Date() },
    });

    return { order_id: dto.order_id, session_id: session.id, payment_link: session.url, state: 'AWAITING_PAYMENT' };
  }
}
