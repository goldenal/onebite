import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DeliveryRequestDto } from './dto/delivery-request.dto';
import { DeliveryWebhookDto } from './dto/delivery-webhook.dto';
import { DeliveryQuoteDto } from './dto/delivery-quote.dto';
import { NashService } from './nash.service';
import { mapPrismaError } from '../../common/errors/prisma-error';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(private readonly prisma: PrismaService, private readonly nash: NashService) {}

  private handleError(error: unknown, context: string, fallbackMessage: string): never {
    if (error instanceof HttpException) throw error;
    const prismaError = mapPrismaError(error);
    if (prismaError) {
      throw new HttpException(
        {
          code: prismaError.code,
          message: prismaError.message,
          details: prismaError.details,
        },
        prismaError.statusCode,
      );
    }

    this.logger.error(
      `${context} failed: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error.stack : undefined,
    );
    throw new InternalServerErrorException({
      code: HttpStatus[HttpStatus.INTERNAL_SERVER_ERROR],
      message: fallbackMessage,
    });
  }

  async request(tenantId: string, dto: DeliveryRequestDto) {
    try {
      const eta = '25 minutes';
      await this.prisma.deliveryRequest.upsert({
        where: { orderId: dto.order_id },
        update: {
          tenantId,
          provider: dto.provider || 'manual',
          deliveryId: null,
          status: 'Preparing',
          eta,
          updatedAt: new Date(),
        },
        create: {
          orderId: dto.order_id,
          tenantId,
          provider: dto.provider || 'manual',
          deliveryId: null,
          status: 'Preparing',
          eta,
        },
      });

      return { order_id: dto.order_id, status: 'Preparing', eta };
    } catch (error) {
      this.handleError(error, 'request', 'delivery_request_failed');
    }
  }

  async quote(tenantId: string, dto: DeliveryQuoteDto) {
    try {
      const orderId = dto.order_id?.trim() || null;
      const provider = 'nash';
      let payment: { subtotalCents?: number | null; amount?: unknown; customerPhone?: string | null; fulfillment?: string | null } | null = null;
      if (dto.provider && dto.provider !== 'nash') {
        this.logger.warn(`Ignoring unsupported delivery provider "${dto.provider}" and defaulting to nash`);
      }

      if (orderId) {
        payment = await this.prisma.paymentLink.findFirst({
          where: { orderId, tenantId },
          select: { subtotalCents: true, amount: true, customerPhone: true, fulfillment: true },
        });
        if (!payment) throw new NotFoundException('order_not_found');
        if (payment.fulfillment !== 'delivery') throw new BadRequestException('not_delivery');
      }

      const location = await this.prisma.location.findFirst({ where: { id: dto.location_id, tenantId } });
      if (!location) throw new NotFoundException('location_not_found');
      const pickupPhoneNumber = String(location.phone || '').trim();
      if (!pickupPhoneNumber) throw new BadRequestException('pickup_phone_required');

      const dropoffPhoneNumber = String(dto.dropoff_phone || payment?.customerPhone || '').trim();
      if (!dropoffPhoneNumber) throw new BadRequestException('dropoff_phone_required');

      const subtotalCents = Number(payment?.subtotalCents);
      const amountCents = Math.round(Number(payment?.amount || 0) * 100);
      const valueCents = Number.isFinite(subtotalCents) && subtotalCents > 0 ? subtotalCents : amountCents > 0 ? amountCents : undefined;

      let quoteResponse: any;
      let cheapest: { quote: any; quoteId: string; feeCents: number; currency: string; eta: string | null; expiresAt: Date | null };
      try {
        quoteResponse = await this.nash.createQuote({
          externalId: orderId || undefined,
          pickupAddress: {
            address_line1: location.addressLine1,
            address_line2: location.addressLine2 || undefined,
            city: location.city,
            state: location.state,
            postal_code: location.postalCode,
            country: location.country,
          },
          dropoffAddress: dto.dropoff_address,
          pickupBusinessName: location.name,
          pickupPhoneNumber,
          dropoffName: dto.dropoff_name,
          dropoffPhoneNumber,
          dropoffInstructions: dto.dropoff_instructions,
          valueCents,
        });
        cheapest = this.nash.selectCheapestQuote(quoteResponse);
      } catch (error) {
        const providerMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`quote provider error: ${providerMessage}`, error instanceof Error ? error.stack : undefined);
        throw new BadGatewayException({
          code: 'nash_quote_failed',
          message: 'quote_failed',
          details: {
            provider: 'nash',
            provider_error: providerMessage,
          },
        });
      }

      const quoteId = cheapest.quoteId;
      const feeCents = Math.max(0, Math.round(cheapest.feeCents));
      const currency = cheapest.currency;
      const eta = cheapest.eta;
      const expiresAt = cheapest.expiresAt;
      if (!quoteId) throw new BadRequestException('quote_failed');

      if (orderId) {
        await this.prisma.$transaction(async (tx) => {
          await tx.deliveryAddress.upsert({
            where: { orderId },
            update: {
              tenantId,
              locationId: dto.location_id,
              name: dto.dropoff_name ?? null,
              phone: dto.dropoff_phone ?? null,
              addressLine1: dto.dropoff_address.address_line1,
              addressLine2: dto.dropoff_address.address_line2 ?? null,
              city: dto.dropoff_address.city,
              state: dto.dropoff_address.state,
              postalCode: dto.dropoff_address.postal_code,
              country: dto.dropoff_address.country,
              instructions: dto.dropoff_instructions ?? null,
              updatedAt: new Date(),
            },
            create: {
              orderId,
              tenantId,
              locationId: dto.location_id,
              name: dto.dropoff_name ?? null,
              phone: dto.dropoff_phone ?? null,
              addressLine1: dto.dropoff_address.address_line1,
              addressLine2: dto.dropoff_address.address_line2 ?? null,
              city: dto.dropoff_address.city,
              state: dto.dropoff_address.state,
              postalCode: dto.dropoff_address.postal_code,
              country: dto.dropoff_address.country,
              instructions: dto.dropoff_instructions ?? null,
            },
          });

          await tx.deliveryQuote.upsert({
            where: { orderId },
            update: {
              tenantId,
              provider,
              locationId: dto.location_id,
              quoteId,
              feeCents,
              currency,
              eta,
              expiresAt: expiresAt ?? null,
              raw: {
                quote_response: quoteResponse ?? {},
                selected_quote: cheapest.quote ?? {},
              },
              updatedAt: new Date(),
            },
            create: {
              orderId,
              tenantId,
              provider,
              locationId: dto.location_id,
              quoteId,
              feeCents,
              currency,
              eta,
              expiresAt: expiresAt ?? null,
              raw: {
                quote_response: quoteResponse ?? {},
                selected_quote: cheapest.quote ?? {},
              },
            },
          });
        });
      }

      return {
        order_id: orderId,
        quote_id: quoteId,
        fee_cents: feeCents,
        currency,
        eta,
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        provider,
      };
    } catch (error) {
      this.handleError(error, 'quote', 'delivery_quote_failed');
    }
  }

  async createDeliveryAfterPayment(tenantId: string, orderId: string) {
    try {
      const payment = await this.prisma.paymentLink.findFirst({ where: { orderId, tenantId } });
      if (!payment) throw new NotFoundException('order_not_found');
      if (payment.fulfillment !== 'delivery') return null;

      const quote = await this.prisma.deliveryQuote.findFirst({ where: { orderId, tenantId } });
      const address = await this.prisma.deliveryAddress.findFirst({ where: { orderId, tenantId } });
      if (!quote || !address) throw new NotFoundException('delivery_quote_not_found');
      if (quote.provider !== 'nash') return null;

      const location = await this.prisma.location.findFirst({ where: { id: quote.locationId, tenantId } });
      if (!location) throw new NotFoundException('location_not_found');

      const dropoffPhone = address.phone || payment.customerPhone || '';
      if (!dropoffPhone) throw new BadRequestException('dropoff_phone_required');

      const quoteRaw = (quote.raw as Record<string, any> | null) || {};
      const quoteResponse = quoteRaw.quote_response || quoteRaw;
      const nashOrderId = this.nash.extractOrderId(quoteResponse) || undefined;

      const delivery = await this.nash.selectQuote({
        quoteId: quote.quoteId,
        orderId: nashOrderId,
      });

      const normalized = this.nash.extractDeliveryResult(delivery);
      const deliveryId = normalized.deliveryId;
      const status = normalized.status;
      const eta = normalized.eta;

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

      return { delivery_id: deliveryId, status, eta };
    } catch (error) {
      this.handleError(error, 'createDeliveryAfterPayment', 'delivery_create_failed');
    }
  }

  async webhook(tenantId: string, dto: DeliveryWebhookDto) {
    try {
      await this.prisma.deliveryRequest.upsert({
        where: { orderId: dto.order_id },
        update: {
          tenantId,
          provider: 'external',
          deliveryId: dto.delivery_id || null,
          status: dto.status,
          eta: dto.eta || null,
          updatedAt: new Date(),
        },
        create: {
          orderId: dto.order_id,
          tenantId,
          provider: 'external',
          deliveryId: dto.delivery_id || null,
          status: dto.status,
          eta: dto.eta || null,
        },
      });
      return { ok: true };
    } catch (error) {
      this.handleError(error, 'webhook', 'delivery_webhook_failed');
    }
  }

  async status(tenantId: string, orderId: string) {
    try {
      const row = await this.prisma.deliveryRequest.findFirst({ where: { orderId, tenantId } });
      if (!row) throw new NotFoundException('delivery_not_found');
      return {
        order_id: row.orderId,
        status: row.status,
        eta: row.eta,
        delivery_id: row.deliveryId,
        provider: row.provider,
      };
    } catch (error) {
      this.handleError(error, 'status', 'delivery_status_failed');
    }
  }
}
