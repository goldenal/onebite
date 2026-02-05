import { Controller, Headers, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { KitchenService } from '../kitchen/kitchen.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  private stripe: Stripe;

  constructor(
    private readonly config: ConfigService,
    private readonly kitchen: KitchenService,
    private readonly prisma: PrismaService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
  }

  @Post('stripe')
  async stripeWebhook(@Req() req: Request, @Res() res: Response, @Headers('stripe-signature') sig?: string) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      return res.status(500).json({ error: 'server_not_configured', message: 'STRIPE_WEBHOOK_SECRET required' });
    }

    let event: Stripe.Event;
    try {
      const rawBody = (req as any).rawBody as Buffer | undefined;
      if (!rawBody) {
        return res.status(400).json({ error: 'invalid_signature' });
      }
      event = this.stripe.webhooks.constructEvent(rawBody, sig || '', webhookSecret);
    } catch {
      return res.status(400).json({ error: 'invalid_signature' });
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi: any = event.data.object;
      const metadata = pi.metadata || {};
      const channel = (metadata.channel || 'web') as any;
      const fulfillment = (metadata.fulfillment || 'pickup') as any;
      const now = new Date().toISOString();
      const id = this.kitchen.normalizeOrderId(metadata.order_id || metadata.cart_id || pi.id);

      const pickupCode =
        fulfillment === 'pickup' && (channel === 'web' || channel === 'phone')
          ? this.kitchen.generatePickupCode()
          : undefined;

      const items = metadata.items ? this.safeJson(metadata.items, []) : [];

      const order = {
        id,
        channel,
        fulfillment,
        source_label:
          channel === 'web'
            ? `Web ${fulfillment === 'pickup' ? 'Pickup' : 'Delivery'}`
            : channel === 'phone'
              ? `Phone ${fulfillment === 'pickup' ? 'Pickup' : 'Delivery'}`
              : 'In-Store Tablet',
        status: 'queued',
        arrival_status:
          fulfillment === 'pickup'
            ? channel === 'tablet'
              ? 'not_required'
              : 'waiting'
            : 'not_required',
        pickup_code: pickupCode,
        paid_at: now,
        created_at: now,
        items,
        audit: [
          { ts: now, actor: 'system', action: 'paid', details: { payment_intent: pi.id } },
          pickupCode
            ? { ts: now, actor: 'system', action: 'pickup_code_generated', details: { pickupCode } }
            : { ts: now, actor: 'system', action: 'order_created' },
        ],
      } as any;

      await this.prisma.$transaction(async (tx) => {
        await tx.paymentLink.updateMany({ where: { orderId: id }, data: { state: 'PAID', updatedAt: new Date() } });
        let created = false;
        try {
          await tx.processedEvent.create({ data: { eventId: event.id, source: 'stripe' } });
          created = true;
        } catch (err) {
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            created = false;
          } else {
            throw err;
          }
        }
        if (!created) return;
        await this.kitchen.upsertOrderWithItemsTx(tx, order);
      });
    }

    return res.json({ received: true });
  }

  @Post('delivery')
  async deliveryWebhook(@Req() req: Request, @Res() res: Response) {
    const token = this.config.get<string>('DELIVERY_WEBHOOK_TOKEN');
    if (token && req.headers.authorization !== `Bearer ${token}`) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const payload = req.body as {
      provider?: string;
      event?: string;
      order_ref?: string;
      driver_status?: { name?: string; eta_minutes?: number; external_id?: string };
    };

    if (!payload?.order_ref || !payload?.event) {
      return res.status(400).json({ error: 'bad_request' });
    }

    await this.kitchen.updateDelivery(payload.order_ref, payload.event, payload.driver_status);
    return res.json({ ok: true });
  }

  private safeJson(value: string, fallback: any) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
}
