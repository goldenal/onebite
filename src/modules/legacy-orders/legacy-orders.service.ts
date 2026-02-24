import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLegacyOrderDto } from './dto/create-legacy-order.dto';
import { UpdateLegacyOrderDto } from './dto/update-legacy-order.dto';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class LegacyOrdersService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  private allowLegacyOrders() {
    return this.config.get<string>('ALLOW_LEGACY_ORDERS') === 'true';
  }

  async list(tenantId: string) {
    const rows = await this.prisma.legacyOrder.findMany({ where: { tenantId }, orderBy: { timestamp: 'desc' } });
    return rows.map((o) => ({
      id: o.id,
      items: o.items ?? [],
      total: o.total ? Number(o.total) : null,
      status: o.status,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      estimatedTime: o.estimatedTime,
      timestamp: o.timestamp ? Number(o.timestamp) : null,
    }));
  }

  async get(tenantId: string, id: string) {
    const order = await this.prisma.legacyOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Order not found');
    return {
      id: order.id,
      items: order.items ?? [],
      total: order.total ? Number(order.total) : null,
      status: order.status,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      estimatedTime: order.estimatedTime,
      timestamp: order.timestamp ? Number(order.timestamp) : null,
    };
  }

  async create(tenantId: string, dto: CreateLegacyOrderDto) {
    if (!this.allowLegacyOrders()) {
      throw new ForbiddenException('Legacy order creation disabled. Use Stripe payment flow.');
    }
    const id = randomUUID();
    const timestamp = Date.now();
    const estimatedTime = 25 + Math.floor(Math.random() * 15);
    await this.prisma.legacyOrder.create({
      data: {
        id,
        tenantId,
        items: dto.items ?? [],
        total: dto.total,
        status: 'pending',
        customerName: dto.customerName || 'Guest',
        customerPhone: dto.customerPhone || '',
        estimatedTime,
        timestamp: BigInt(timestamp),
      },
    });
    return {
      id,
      items: dto.items,
      total: dto.total,
      status: 'pending',
      customerName: dto.customerName || 'Guest',
      customerPhone: dto.customerPhone || '',
      estimatedTime,
      timestamp,
    };
  }

  async update(tenantId: string, id: string, dto: UpdateLegacyOrderDto) {
    const existing = await this.prisma.legacyOrder.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Order not found');

    const updatedRows = await this.prisma.legacyOrder.updateMany({
      where: { id, tenantId },
      data: {
        status: dto.status ?? existing.status,
        customerName: dto.customerName ?? existing.customerName,
        customerPhone: dto.customerPhone ?? existing.customerPhone,
      },
    });
    if (!updatedRows.count) throw new NotFoundException('Order not found');
    const updated = await this.prisma.legacyOrder.findFirst({ where: { id, tenantId } });
    if (!updated) throw new NotFoundException('Order not found');

    return {
      id: updated.id,
      items: updated.items ?? [],
      total: updated.total ? Number(updated.total) : null,
      status: updated.status,
      customerName: updated.customerName,
      customerPhone: updated.customerPhone,
      estimatedTime: updated.estimatedTime,
      timestamp: updated.timestamp ? Number(updated.timestamp) : null,
    };
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.legacyOrder.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Order not found');
    await this.prisma.legacyOrder.deleteMany({ where: { id, tenantId } });
    return { message: 'Order deleted successfully' };
  }
}
