import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { PrismaService } from '../../prisma/prisma.service';
import {
  deliveryStatusUpdatedTemplate,
  OrderReceiptItem,
  orderPaymentReceiptTemplate,
  ownerWelcomeTemplate,
  reservationCreatedTemplate,
  reservationStatusUpdatedTemplate,
  reviewAccessLinkTemplate,
  reviewAdminReplyTemplate,
} from './templates/email-templates';

export type NotificationDeliveryResult = {
  delivered: boolean;
  reason?: string;
  id?: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string | null;
  private readonly replyTo: string | null;
  private readonly enabled: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.config.get<string>('RESEND_API_KEY') || null;
    this.fromEmail = this.config.get<string>('EMAIL_FROM') || null;
    this.replyTo = this.config.get<string>('EMAIL_REPLY_TO') || null;
    this.enabled = this.config.get<string>('EMAIL_ENABLED') !== 'false';
    this.resend = apiKey ? new Resend(apiKey) : null;

    if (this.enabled && (!this.resend || !this.fromEmail)) {
      this.logger.warn('Email sending disabled: RESEND_API_KEY or EMAIL_FROM missing');
    }
  }

  private customerUrl() {
    return this.config.get<string>('CUSTOMER_URL') || this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  }

  private platformUrl() {
    return this.config.get<string>('PLATFORM_URL') || this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  }

  private normalizeEmail(value: string) {
    return value.toLowerCase().trim();
  }

  private async tenantMeta(tenantId?: string | null) {
    if (!tenantId) {
      return {
        restaurantName: 'Bite Creole Kitchen',
        tenantSlug: 'default',
        tenantDomain: null as string | null,
      };
    }

    const [tenant, domain] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, slug: true } }),
      this.prisma.tenantDomain.findFirst({ where: { tenantId, isPrimary: true }, select: { domain: true } }),
    ]);

    return {
      restaurantName: tenant?.name || 'Bite Creole Kitchen',
      tenantSlug: tenant?.slug || 'default',
      tenantDomain: domain?.domain || null,
    };
  }

  private async sendEmail(input: {
    tenantId?: string | null;
    to: string;
    subject: string;
    html: string;
    text: string;
    template: string;
    tags?: Array<{ name: string; value: string }>;
  }): Promise<NotificationDeliveryResult> {
    const to = this.normalizeEmail(input.to);
    if (!to || !to.includes('@')) return { delivered: false, reason: 'invalid_recipient' };
    if (!this.enabled) return { delivered: false, reason: 'email_disabled' };
    if (!this.resend || !this.fromEmail) return { delivered: false, reason: 'resend_not_configured' };

    try {
      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        replyTo: this.replyTo || undefined,
        tags: [
          { name: 'template', value: input.template },
          ...(input.tenantId ? [{ name: 'tenant_id', value: input.tenantId }] : []),
          ...(input.tags || []),
        ],
      });

      if (response.error) {
        this.logger.warn(`Resend rejected email template=${input.template} to=${to}: ${response.error.message}`);
        return { delivered: false, reason: 'provider_error' };
      }

      return { delivered: true, id: response.data?.id || undefined };
    } catch (error: any) {
      this.logger.error(`Failed to send email template=${input.template} to=${to}: ${error?.message || String(error)}`);
      return { delivered: false, reason: 'send_failed' };
    }
  }

  async sendReservationCreated(input: {
    tenantId: string;
    to: string;
    customerName: string;
    guests: string;
    date: string;
    time: string;
    specialRequests?: string | null;
  }) {
    const tenant = await this.tenantMeta(input.tenantId);
    const rendered = reservationCreatedTemplate({
      restaurantName: tenant.restaurantName,
      customerName: input.customerName,
      guests: input.guests,
      date: input.date,
      time: input.time,
      specialRequests: input.specialRequests,
    });

    return this.sendEmail({
      tenantId: input.tenantId,
      to: input.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      template: 'reservation_created',
    });
  }

  async sendReservationStatusUpdated(input: {
    tenantId: string;
    to: string;
    customerName: string;
    guests: string;
    date: string;
    time: string;
    status: string;
    notes?: string | null;
  }) {
    const tenant = await this.tenantMeta(input.tenantId);
    const rendered = reservationStatusUpdatedTemplate({
      restaurantName: tenant.restaurantName,
      customerName: input.customerName,
      guests: input.guests,
      date: input.date,
      time: input.time,
      status: input.status,
      notes: input.notes,
    });

    return this.sendEmail({
      tenantId: input.tenantId,
      to: input.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      template: 'reservation_status_updated',
    });
  }

  async sendOwnerWelcome(input: {
    tenantId: string;
    to: string;
    ownerEmail: string;
  }) {
    const tenant = await this.tenantMeta(input.tenantId);
    const rendered = ownerWelcomeTemplate({
      restaurantName: tenant.restaurantName,
      ownerEmail: input.ownerEmail,
      tenantSlug: tenant.tenantSlug,
      tenantDomain: tenant.tenantDomain,
      loginUrl: `${this.platformUrl().replace(/\/$/, '')}/platform`,
    });

    return this.sendEmail({
      tenantId: input.tenantId,
      to: input.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      template: 'owner_welcome',
    });
  }

  async sendOrderPaymentReceipt(input: {
    tenantId: string;
    to: string;
    customerName?: string | null;
    orderId: string;
    amountCents: number;
    subtotalCents?: number | null;
    taxCents?: number | null;
    deliveryFeeCents?: number | null;
    fulfillment?: string | null;
    items?: OrderReceiptItem[];
  }) {
    const tenant = await this.tenantMeta(input.tenantId);
    const rendered = orderPaymentReceiptTemplate({
      restaurantName: tenant.restaurantName,
      customerName: input.customerName,
      orderId: input.orderId,
      amountCents: input.amountCents,
      subtotalCents: input.subtotalCents,
      taxCents: input.taxCents,
      deliveryFeeCents: input.deliveryFeeCents,
      fulfillment: input.fulfillment,
      items: input.items || [],
      trackingUrl: `${this.customerUrl().replace(/\/$/, '')}/orders/track/${encodeURIComponent(input.orderId)}`,
    });

    return this.sendEmail({
      tenantId: input.tenantId,
      to: input.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      template: 'order_payment_receipt',
    });
  }

  async sendDeliveryStatusUpdated(input: {
    tenantId: string;
    to: string;
    customerName?: string | null;
    orderId: string;
    status: string;
    eta?: string | null;
  }) {
    const tenant = await this.tenantMeta(input.tenantId);
    const rendered = deliveryStatusUpdatedTemplate({
      restaurantName: tenant.restaurantName,
      customerName: input.customerName,
      orderId: input.orderId,
      status: input.status,
      eta: input.eta,
      trackingUrl: `${this.customerUrl().replace(/\/$/, '')}/orders/track/${encodeURIComponent(input.orderId)}`,
    });

    return this.sendEmail({
      tenantId: input.tenantId,
      to: input.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      template: 'delivery_status_updated',
    });
  }

  async sendReviewAccessLink(input: {
    tenantId: string;
    to: string;
    conversationLink: string;
  }) {
    const tenant = await this.tenantMeta(input.tenantId);
    const rendered = reviewAccessLinkTemplate({
      restaurantName: tenant.restaurantName,
      conversationLink: input.conversationLink,
    });

    return this.sendEmail({
      tenantId: input.tenantId,
      to: input.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      template: 'review_access_link',
    });
  }

  async sendReviewAdminReply(input: {
    tenantId: string;
    to: string;
    customerName: string;
    adminMessage: string;
    conversationLink: string;
  }) {
    const tenant = await this.tenantMeta(input.tenantId);
    const rendered = reviewAdminReplyTemplate({
      restaurantName: tenant.restaurantName,
      customerName: input.customerName,
      adminMessage: input.adminMessage,
      conversationLink: input.conversationLink,
    });

    return this.sendEmail({
      tenantId: input.tenantId,
      to: input.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      template: 'review_admin_reply',
    });
  }
}
