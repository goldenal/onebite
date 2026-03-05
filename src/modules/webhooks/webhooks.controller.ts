import { Controller, Headers, HttpStatus, Logger, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { KitchenService } from '../kitchen/kitchen.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { createHmac, randomUUID } from 'crypto';
import { DeliveryService } from '../delivery/delivery.service';
import { createErrorEnvelope } from '../../common/errors/error-response';
import { PlatformService } from '../platform/platform.service';
import { NotificationsService } from '../notifications/notifications.service';

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
    private readonly platform: PlatformService,
    private readonly notifications: NotificationsService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
  }

  private async markProcessed(provider: string, eventId: string, tenantId?: string | null) {
    try {
      await this.prisma.processedWebhookEvent.create({
        data: {
          id: `pwe_${randomUUID()}`,
          provider,
          eventId,
          tenantId: tenantId || null,
        },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return false;
      }
      throw error;
    }
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

      const payment = await this.prisma.paymentLink.findFirst({ where: { orderId: id } });
      if (!payment) return res.json({ received: true, ignored: 'payment_not_found' });

      const tenantId = payment.tenantId;
      const channel = (payment.channel || metadata.channel || 'web') as any;
      const fulfillment = (payment.fulfillment || metadata.fulfillment || 'pickup') as any;

      const firstLocation = await this.prisma.location.findFirst({ where: { tenantId }, orderBy: { createdAt: 'asc' } });
      const pickupCode =
        fulfillment === 'pickup' && (channel === 'web' || channel === 'phone' || channel === 'ai')
          ? this.kitchen.generatePickupCode()
          : undefined;

      const rawItems =
        payment && Array.isArray(payment.items)
          ? (payment.items as any[])
          : metadata.items
            ? this.safeJson(metadata.items, [])
            : [];
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
        arrival_status: fulfillment === 'pickup' ? (channel === 'tablet' ? 'not_required' : 'waiting') : 'not_required',
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

      const createdEvent = await this.markProcessed('stripe', event.id, tenantId);
      if (!createdEvent) return res.json({ received: true, duplicate: true });

      await this.prisma.$transaction(async (tx) => {
        await tx.paymentLink.updateMany({
          where: { orderId: id, tenantId },
          data: {
            state: 'PAID',
            updatedAt: new Date(),
          },
        });

        await this.kitchen.upsertOrderWithItemsTx(tx, tenantId, {
          ...order,
          location_id: firstLocation?.id ?? null,
        });
      });

      const customerContact = await this.resolveCustomerContact({
        tenantId,
        userId: payment.userId,
        fallbackEmail: metadata.customer_email || null,
        fallbackName: payment.customerName || metadata.customer_name || null,
      });
      if (customerContact.email) {
        await this.notifications.sendOrderPaymentReceipt({
          tenantId,
          to: customerContact.email,
          customerName: customerContact.name,
          orderId: id,
          amountCents: this.toCents(payment.amount),
          subtotalCents: payment.subtotalCents || 0,
          taxCents: payment.taxCents || 0,
          deliveryFeeCents: payment.deliveryFeeCents || 0,
          fulfillment: payment.fulfillment || fulfillment,
          items: this.toReceiptItems(rawItems),
        });
      }

      void this.kitchen.broadcastOrdersSnapshot(tenantId);
      if (fulfillment === 'delivery') {
        this.enqueueDeliveryCreation(tenantId, id);
      }
    }

    return res.json({ received: true });
  }

  @Post('stripe-connect')
  async stripeConnectWebhook(@Req() req: Request, @Res() res: Response, @Headers('stripe-signature') sig?: string) {
    const webhookSecret = this.config.get<string>('STRIPE_CONNECT_WEBHOOK_SECRET') || this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(createErrorEnvelope({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, code: 'server_not_configured', path: req.url }));
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

    const createdEvent = await this.markProcessed('stripe_connect', event.id, null);
    if (!createdEvent) return res.json({ received: true, duplicate: true });

    if (event.type === 'account.updated') {
      const account = event.data.object as Stripe.Account;
      await this.platform.handleConnectWebhook(account.id);
    }

    return res.json({ received: true });
  }

  @Post('delivery')
  async deliveryWebhook(@Req() req: Request, @Res() res: Response) {
    const providerSignature = (req.headers['x-nash-signature'] as string | undefined) || undefined;

    if (providerSignature) {
      const secret = this.config.get<string>('NASH_WEBHOOK_SECRET');
      if (!secret) {
        return res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json(
            createErrorEnvelope({
              statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
              code: 'server_not_configured',
              message: 'nash_webhook_secret_required',
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
      if (computed !== providerSignature) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(createErrorEnvelope({ statusCode: HttpStatus.BAD_REQUEST, code: 'invalid_signature', path: req.url }));
      }

      const payload: any = req.body || {};
      const data = payload.data || payload;
      const deliveryId = data.deliveryId || data.delivery_id || data.id || payload.deliveryId || payload.delivery_id;
      let orderId =
        data.externalId ||
        data.external_id ||
        data.orderId ||
        data.order_id ||
        payload.orderId ||
        payload.order_id ||
        payload.order_ref;
      const status = data.status || data.delivery_status || data.event || payload.status || payload.event;
      const eta = data.dropoffEta || data.dropoff_eta || data.eta || payload.eta || null;

      let tenantId: string | undefined;
      if (!orderId && deliveryId) {
        const row = await this.prisma.deliveryRequest.findFirst({ where: { deliveryId } });
        orderId = row?.orderId;
        tenantId = row?.tenantId;
      }

      if (orderId && !tenantId) {
        const payment = await this.prisma.paymentLink.findFirst({ where: { orderId } });
        tenantId = payment?.tenantId;
      }

      if (!orderId || !status || !tenantId) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(createErrorEnvelope({ statusCode: HttpStatus.BAD_REQUEST, code: 'bad_request', path: req.url }));
      }

      const previous = await this.prisma.deliveryRequest.findFirst({ where: { orderId }, select: { status: true } });
      await this.prisma.deliveryRequest.upsert({
        where: { orderId },
        update: {
          tenantId,
          provider: 'nash',
          deliveryId: deliveryId || null,
          status,
          eta,
          updatedAt: new Date(),
        },
        create: {
          orderId,
          tenantId,
          provider: 'nash',
          deliveryId: deliveryId || null,
          status,
          eta,
        },
      });

      const event = this.mapDeliveryStatusToEvent(status);
      if (event) {
        await this.kitchen.updateDelivery(tenantId, orderId, event, {
          status,
          eta,
          courier: data.courier || null,
        });
      }

      if ((previous?.status || null) !== status) {
        await this.sendDeliveryStatusEmail(tenantId, orderId, status, eta);
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

    const payment = await this.prisma.paymentLink.findFirst({ where: { orderId: payload.order_ref } });
    if (!payment?.tenantId) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(createErrorEnvelope({ statusCode: HttpStatus.BAD_REQUEST, code: 'bad_request', path: req.url }));
    }

    const currentStatus = payload.driver_status?.name || payload.event;
    const previous = await this.prisma.deliveryRequest.findFirst({
      where: { orderId: payload.order_ref },
      select: { status: true },
    });
    await this.prisma.deliveryRequest.upsert({
      where: { orderId: payload.order_ref },
      update: {
        tenantId: payment.tenantId,
        provider: payload.provider || 'generic',
        deliveryId: payload.driver_status?.external_id || null,
        status: currentStatus,
        eta: payload.driver_status?.eta_minutes ? `${payload.driver_status.eta_minutes} minutes` : null,
        updatedAt: new Date(),
      },
      create: {
        orderId: payload.order_ref,
        tenantId: payment.tenantId,
        provider: payload.provider || 'generic',
        deliveryId: payload.driver_status?.external_id || null,
        status: currentStatus,
        eta: payload.driver_status?.eta_minutes ? `${payload.driver_status.eta_minutes} minutes` : null,
      },
    });

    await this.kitchen.updateDelivery(payment.tenantId, payload.order_ref, payload.event, payload.driver_status);
    if ((previous?.status || null) !== currentStatus) {
      await this.sendDeliveryStatusEmail(
        payment.tenantId,
        payload.order_ref,
        currentStatus,
        payload.driver_status?.eta_minutes ? `${payload.driver_status.eta_minutes} minutes` : null,
      );
    }
    return res.json({ ok: true });
  }

  private mapDeliveryStatusToEvent(status: string) {
    const normalized = status.toLowerCase();
    if (
      [
        'pickup',
        'pickup_complete',
        'courier_picked_up',
        'enroute_to_dropoff',
        'on_the_way',
        'in_transit',
        'dropoff',
      ].includes(normalized)
    ) {
      return 'picked_up';
    }
    if (['delivered', 'dropoff_complete', 'complete', 'completed'].includes(normalized)) return 'delivered';
    if (['canceled', 'cancelled', 'returned', 'failed', 'undeliverable'].includes(normalized)) return 'canceled';
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

  private toCents(value: unknown) {
    const numeric = Number(value || 0);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.round(numeric * 100));
  }

  private toReceiptItems(items: any[]) {
    if (!Array.isArray(items)) return [];
    return items
      .map((item: any) => {
        const name = String(item?.menuItem?.name || item?.name || '').trim();
        const quantity = Number(item?.quantity ?? item?.qty ?? 1);
        if (!name || !Number.isFinite(quantity) || quantity <= 0) return null;
        const unitPrice = Number(item?.menuItem?.price ?? item?.price);
        return {
          name,
          quantity: Math.floor(quantity),
          unitPriceCents: Number.isFinite(unitPrice) ? Math.round(unitPrice * 100) : null,
        };
      })
      .filter(Boolean) as Array<{ name: string; quantity: number; unitPriceCents?: number | null }>;
  }

  private async resolveCustomerContact(input: {
    tenantId: string;
    userId?: string | null;
    fallbackEmail?: string | null;
    fallbackName?: string | null;
  }) {
    const fallbackEmail = input.fallbackEmail?.toLowerCase().trim();
    if (fallbackEmail && fallbackEmail.includes('@')) {
      return { email: fallbackEmail, name: input.fallbackName || null };
    }
    if (!input.userId) return { email: null, name: input.fallbackName || null };

    const account = await this.prisma.customerAccount.findFirst({
      where: { id: input.userId, tenantId: input.tenantId },
      select: { email: true, firstName: true, lastName: true },
    });
    if (!account?.email) return { email: null, name: input.fallbackName || null };

    const name = [account.firstName, account.lastName].filter(Boolean).join(' ').trim() || input.fallbackName || null;
    return { email: account.email.toLowerCase().trim(), name };
  }

  private async sendDeliveryStatusEmail(tenantId: string, orderId: string, status: string, eta?: string | null) {
    const payment = await this.prisma.paymentLink.findFirst({
      where: { orderId, tenantId },
      select: { userId: true, customerName: true },
    });
    if (!payment) return;

    const contact = await this.resolveCustomerContact({
      tenantId,
      userId: payment.userId,
      fallbackName: payment.customerName || null,
    });
    if (!contact.email) return;

    await this.notifications.sendDeliveryStatusUpdated({
      tenantId,
      to: contact.email,
      customerName: contact.name,
      orderId,
      status,
      eta: eta || null,
    });
  }

  private enqueueDeliveryCreation(tenantId: string, orderId: string) {
    setImmediate(() => {
      void this.delivery.createDeliveryAfterPayment(tenantId, orderId).catch((error: any) => {
        this.logger.error(`Failed async delivery creation for orderId=${orderId}`, error?.stack || String(error));
      });
    });
  }
}
