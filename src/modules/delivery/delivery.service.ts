import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DeliveryRequestDto } from './dto/delivery-request.dto';
import { DeliveryWebhookDto } from './dto/delivery-webhook.dto';
import { DeliveryQuoteDto } from './dto/delivery-quote.dto';
import { UberDirectService } from './uber-direct.service';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(private readonly prisma: PrismaService, private readonly uber: UberDirectService) {}

  private handleError(error: unknown, context: string, fallbackMessage: string): never {
    if (error instanceof HttpException) throw error;

    this.logger.error(
      `${context} failed: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error.stack : undefined,
    );
    throw new InternalServerErrorException(fallbackMessage);
  }

  async request(dto: DeliveryRequestDto) {
    try {
      const eta = '25 minutes';
      await this.prisma.deliveryRequest.upsert({
        where: { orderId: dto.order_id },
        update: {
          provider: dto.provider || 'manual',
          deliveryId: null,
          status: 'Preparing',
          eta,
          updatedAt: new Date(),
        },
        create: {
          orderId: dto.order_id,
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

  async quote(dto: DeliveryQuoteDto) {
    try {
      const orderId = dto.order_id?.trim() || null;
      const provider = dto.provider || 'uber_direct';
      if (provider !== 'uber_direct') throw new BadRequestException('unsupported_provider');

      if (orderId) {
        const payment = await this.prisma.paymentLink.findUnique({ where: { orderId } });
        if (!payment) throw new NotFoundException('order_not_found');
        if (payment.fulfillment !== 'delivery') throw new BadRequestException('not_delivery');
      }

      const location = await this.prisma.location.findUnique({ where: { id: dto.location_id } });
      if (!location) throw new NotFoundException('location_not_found');

      const pickup = this.uber.toUberAddress({
        address_line1: location.addressLine1,
        address_line2: location.addressLine2 || undefined,
        city: location.city,
        state: location.state,
        postal_code: location.postalCode,
        country: location.country,
      });
      const dropoff = this.uber.toUberAddress(dto.dropoff_address);
      let quote: any;
      try {
        quote = await this.uber.createQuote({ pickup, dropoff });
      } catch (error) {
        const providerMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `quote provider error: ${providerMessage}`,
          error instanceof Error ? error.stack : undefined,
        );
        throw new BadGatewayException({
          code: 'uber_quote_failed',
          message: 'quote_failed',
          details: {
            provider: 'uber_direct',
            provider_error: providerMessage,
          },
        });
      }
      //

      const quoteId = String(quote.id || quote.quote_id || '');
      const feeAmount = Number(quote.fee?.amount ?? quote.fee?.value ?? quote.fee ?? 0);
      const currency = String(quote.fee?.currency_code || quote.fee?.currency || quote.currency || 'USD');
      const eta = quote.dropoff_eta || quote.eta || null;
      const expiresAt = quote.expires_at ? new Date(quote.expires_at) : null;

      if (!quoteId) throw new BadRequestException('quote_failed');

      if (orderId) {
        await this.prisma.$transaction(async (tx) => {
          await tx.deliveryAddress.upsert({
            where: { orderId },
            update: {
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
              provider,
              locationId: dto.location_id,
              quoteId,
              feeCents: Math.max(0, Math.round(feeAmount)),
              currency,
              eta,
              expiresAt: expiresAt ?? null,
              raw: quote ?? {},
              updatedAt: new Date(),
            },
            create: {
              orderId,
              provider,
              locationId: dto.location_id,
              quoteId,
              feeCents: Math.max(0, Math.round(feeAmount)),
              currency,
              eta,
              expiresAt: expiresAt ?? null,
              raw: quote ?? {},
            },
          });
        });
      }

      return {
        order_id: orderId,
        quote_id: quoteId,
        fee_cents: Math.max(0, Math.round(feeAmount)),
        currency,
        eta,
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        provider,
      };
    } catch (error) {
      this.handleError(error, 'quote', 'delivery_quote_failed');
    }
  }

  async createDeliveryAfterPayment(orderId: string) {
    try {
      const payment = await this.prisma.paymentLink.findUnique({ where: { orderId } });
      if (!payment) throw new NotFoundException('order_not_found');
      if (payment.fulfillment !== 'delivery') return null;

      const quote = await this.prisma.deliveryQuote.findUnique({ where: { orderId } });
      const address = await this.prisma.deliveryAddress.findUnique({ where: { orderId } });
      if (!quote || !address) throw new NotFoundException('delivery_quote_not_found');
      if (quote.provider !== 'uber_direct') return null;

      const location = await this.prisma.location.findUnique({ where: { id: quote.locationId } });
      if (!location) throw new NotFoundException('location_not_found');

      const dropoffName = address.name || payment.customerName || 'Customer';
      const dropoffPhone = address.phone || payment.customerPhone || '';
      if (!dropoffPhone) throw new BadRequestException('dropoff_phone_required');

      const pickup = this.uber.toUberAddress({
        address_line1: location.addressLine1,
        address_line2: location.addressLine2 || undefined,
        city: location.city,
        state: location.state,
        postal_code: location.postalCode,
        country: location.country,
      });
      const dropoff = this.uber.toUberAddress({
        address_line1: address.addressLine1,
        address_line2: address.addressLine2 || undefined,
        city: address.city,
        state: address.state,
        postal_code: address.postalCode,
        country: address.country,
      });

      const manifestItems = Array.isArray(payment.items)
        ? (payment.items as any).map((item: any) => ({
            name: item?.menuItem?.name || item?.name || 'Item',
            quantity: Number(item?.quantity || item?.qty || 1),
            size: 'M',
            price: item?.menuItem?.price ? Math.round(Number(item.menuItem.price) * 100) : undefined,
          }))
        : [{ name: 'Order', quantity: 1, size: 'M' }];

      const delivery = await this.uber.createDelivery({
        quote_id: quote.quoteId,
        pickup_name: location.name,
        pickup_phone_number: location.phone,
        pickup_address: pickup,
        dropoff_name: dropoffName,
        dropoff_phone_number: dropoffPhone,
        dropoff_address: dropoff,
        manifest_items: manifestItems,
        dropoff_notes: address.instructions || undefined,
      });

      const deliveryId = String(delivery.id || delivery.delivery_id || '');
      const status = String(delivery.status || 'pending');
      const eta = delivery.dropoff_eta || delivery.eta || null;

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
      });

      return { delivery_id: deliveryId, status, eta };
    } catch (error) {
      this.handleError(error, 'createDeliveryAfterPayment', 'delivery_create_failed');
    }
  }

  async webhook(dto: DeliveryWebhookDto) {
    try {
      await this.prisma.deliveryRequest.upsert({
        where: { orderId: dto.order_id },
        update: {
          provider: 'external',
          deliveryId: dto.delivery_id || null,
          status: dto.status,
          eta: dto.eta || null,
          updatedAt: new Date(),
        },
        create: {
          orderId: dto.order_id,
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

  async status(orderId: string) {
    try {
      const row = await this.prisma.deliveryRequest.findUnique({ where: { orderId } });
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
