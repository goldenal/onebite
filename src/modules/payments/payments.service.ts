import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CartCreateDto } from './dto/cart-create.dto';
import { PaymentLinkDto } from './dto/payment-link.dto';
import { PhonePaymentLinkDto } from './dto/phone-payment-link.dto';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async createCart(dto: CartCreateDto) {
    const order_id = `ord_${randomUUID()}`;
    await this.prisma.paymentLink.upsert({
      where: { orderId: order_id },
      update: {
        amount: dto.amount,
        fulfillment: dto.fulfillment,
        channel: dto.channel || 'web',
        items: dto.items ?? [],
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
        items: dto.items ?? [],
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
        items: dto.items ?? [],
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
        items: dto.items ?? [],
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
}
