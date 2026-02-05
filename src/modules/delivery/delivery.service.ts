import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DeliveryRequestDto } from './dto/delivery-request.dto';
import { DeliveryWebhookDto } from './dto/delivery-webhook.dto';

@Injectable()
export class DeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  async request(dto: DeliveryRequestDto) {
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
  }

  async webhook(dto: DeliveryWebhookDto) {
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
  }

  async status(orderId: string) {
    const row = await this.prisma.deliveryRequest.findUnique({ where: { orderId } });
    if (!row) throw new NotFoundException('delivery_not_found');
    return {
      order_id: row.orderId,
      status: row.status,
      eta: row.eta,
      delivery_id: row.deliveryId,
      provider: row.provider,
    };
  }
}
