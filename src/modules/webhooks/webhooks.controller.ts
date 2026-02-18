import { Controller, Headers, HttpStatus, Logger, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { KitchenService } from '../kitchen/kitchen.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { createHmac } from 'crypto';
import { DeliveryService } from '../delivery/delivery.service';
import { createErrorEnvelope } from '../../common/errors/error-response';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  private stripe: Stripe;
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly kitchen: KitchenService,
    private readonly prisma: PrismaService,
    private readonly delivery: DeliveryService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
  }

  @Post('stripe')
  async stripeWebhook(@Req() req: Request, @Res() res: Response, @Headers('stripe-signature') sig?: string) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorEnvelope({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            code: 'server_not_configured',
            message: 'stripe_webhook_secret_required',
            path: req.url,
          }),
        );
    }

    let event: Stripe.Event;
    try {
      const rawBody = (req as any).rawBody as Buffer | undefined;
      if (!rawBody) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(createErrorEnvelope({ statusCode: HttpStatus.BAD_REQUEST, code: 'invalid_signature', path: req.url }));
      }
      event = this.stripe.webhooks.constructEvent(rawBody, sig || '', webhookSecret);
    } catch {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(createErrorEnvelope({ statusCode: HttpStatus.BAD_REQUEST, code: 'invalid_signature', path: req.url }));
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi: any = event.data.object;
      const metadata = pi.metadata || {};
      const now = new Date().toISOString();
      const id = this.kitchen.normalizeOrderId(metadata.order_id || metadata.cart_id || pi.id);
      const payment = await this.prisma.paymentLink.findUnique({ where: { orderId: id } });
      const channel = (payment?.channel || metadata.channel || 'web') as any;
      const fulfillment = (payment?.fulfillment || metadata.fulfillment || 'pickup') as any;

      const pickupCode =
        fulfillment === 'pickup' && (channel === 'web' || channel === 'phone' || channel === 'ai')
          ? this.kitchen.generatePickupCode()
          : undefined;

      const rawItems =
        payment && Array.isArray(payment.items) ? (payment.items as any[]) : metadata.items ? this.safeJson(metadata.items, []) : [];
      const items = this.normalizeOrderItems(rawItems);

      const order = {
        id,
        channel,
        fulfillment,
        source_label:
          channel === 'web'
            ? `Web ${fulfillment === 'pickup' ? 'Pickup' : 'Delivery'}`
            : channel === 'phone'
              ? `Phone ${fulfillment === 'pickup' ? 'Pickup' : 'Delivery'}`
              : channel === 'ai'
                ? `AI ${fulfillment === 'pickup' ? 'Pickup' : 'Delivery'}`
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

      let createdEvent = false;
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
        createdEvent = true;
        await this.kitchen.upsertOrderWithItemsTx(tx, order);
      });

      if (createdEvent) {
        void this.kitchen.broadcastOrdersSnapshot();
      }

      if (createdEvent && fulfillment === 'delivery') {
     //   this.enqueueDeliveryCreation(id);
      }
    }

    return res.json({ received: true });
  }

  @Post('delivery')
  async deliveryWebhook(@Req() req: Request, @Res() res: Response) {
    const uberSignature =
      (req.headers['x-uber-signature'] as string | undefined) ||
      (req.headers['x-postmates-signature'] as string | undefined) ||
      undefined;
    if (uberSignature) {
      const secret = this.config.get<string>('UBER_DIRECT_WEBHOOK_SECRET');
      if (!secret) {
        return res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json(
            createErrorEnvelope({
              statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
              code: 'server_not_configured',
              message: 'uber_direct_webhook_secret_required',
              path: req.url,
            }),
          );
      }
      const rawBody = (req as any).rawBody as Buffer | undefined;
      if (!rawBody) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(createErrorEnvelope({ statusCode: HttpStatus.BAD_REQUEST, code: 'invalid_signature', path: req.url }));
      }
      const computed = createHmac('sha256', secret).update(rawBody).digest('hex');
      if (computed !== uberSignature) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(createErrorEnvelope({ statusCode: HttpStatus.BAD_REQUEST, code: 'invalid_signature', path: req.url }));
      }

      const payload: any = req.body || {};
      const data = payload.data || payload;
      const deliveryId = data.delivery_id || data.id || payload.delivery_id;
      let orderId = data.external_id || data.order_id || payload.order_id || payload.order_ref;
      const status = data.status || payload.status;
      const eta = data.dropoff_eta || data.eta || null;

      if (!orderId && deliveryId) {
        const row = await this.prisma.deliveryRequest.findFirst({ where: { deliveryId } });
        orderId = row?.orderId;
      }
      if (!orderId || !status) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(createErrorEnvelope({ statusCode: HttpStatus.BAD_REQUEST, code: 'bad_request', path: req.url }));
      }

      await this.prisma.deliveryRequest.upsert({
        where: { orderId },
        update: {
          provider: 'uber_direct',
          deliveryId: deliveryId || null,
          status,
          eta,
          updatedAt: new Date(),
        },
        create: {
          orderId,
          provider: 'uber_direct',
          deliveryId: deliveryId || null,
          status,
          eta,
        },
      });//

      const event = this.mapUberStatusToEvent(status);
      if (event) {
        await this.kitchen.updateDelivery(orderId, event, {
          status,
          eta,
          courier: data.courier || null,
        });
      }
      return res.json({ ok: true });
    }

    const token = this.config.get<string>('DELIVERY_WEBHOOK_TOKEN');
    if (token && req.headers.authorization !== `Bearer ${token}`) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json(createErrorEnvelope({ statusCode: HttpStatus.UNAUTHORIZED, code: 'unauthorized', path: req.url }));
    }
    const payload = req.body as {
      provider?: string;
      event?: string;
      order_ref?: string;
      driver_status?: { name?: string; eta_minutes?: number; external_id?: string };
    };

    if (!payload?.order_ref || !payload?.event) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(createErrorEnvelope({ statusCode: HttpStatus.BAD_REQUEST, code: 'bad_request', path: req.url }));
    }

    await this.kitchen.updateDelivery(payload.order_ref, payload.event, payload.driver_status);
    return res.json({ ok: true });
  }

  private mapUberStatusToEvent(status: string) {
    const normalized = status.toLowerCase();
    if (['pickup', 'pickup_complete', 'enroute_to_dropoff', 'dropoff'].includes(normalized)) return 'picked_up';
    if (['delivered', 'dropoff_complete'].includes(normalized)) return 'delivered';
    if (['canceled', 'cancelled', 'returned'].includes(normalized)) return 'canceled';
    return null;
  }

  private safeJson(value: string, fallback: any) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  private normalizeOrderItems(items: any[]) {
    if (!Array.isArray(items)) return [];
    return items
      .map((item: any) => {
        const name = String(item?.menuItem?.name || item?.name || '').trim();
        const qty = Number(item?.qty ?? item?.quantity ?? 1);
        if (!name || !Number.isFinite(qty) || qty <= 0) return null;
        return {
          name,
          qty: Math.floor(qty),
          modifiers: Array.isArray(item?.modifiers) ? item.modifiers : [],
          allergies: Array.isArray(item?.allergies) ? item.allergies : [],
          station: item?.station ? String(item.station) : undefined,
          notes: item?.notes ? String(item.notes) : undefined,
        };
      })
      .filter(Boolean);
  }

  private enqueueDeliveryCreation(orderId: string) {
    setImmediate(() => {
      void this.delivery.createDeliveryAfterPayment(orderId).catch((error: any) => {
        this.logger.error(
          `Failed async delivery creation for orderId=${orderId}`,
          error?.stack || String(error),
        );
      });
    });
  }
}
