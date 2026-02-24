import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGroupOrderDto } from './dto/create-group-order.dto';
import { AddGroupItemDto } from './dto/add-group-item.dto';
import { UpdateGroupStatusDto } from './dto/update-group-status.dto';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GroupOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private generateGroupCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  }

  async listAdmin(tenantId: string) {
    const rows = await this.prisma.groupOrder.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    return rows.map((o) => ({
      id: o.id,
      initiatorName: o.initiatorName,
      status: o.status,
      createdAt: o.createdAt ? Number(o.createdAt) : null,
      expiresAt: o.expiresAt ? Number(o.expiresAt) : null,
    }));
  }

  async get(tenantId: string, id: string) {
    const order = await this.prisma.groupOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Group order not found');

    const items = await this.prisma.groupOrderItem.findMany({
      where: { groupOrderId: id, tenantId },
      orderBy: { createdAt: 'desc' },
    });

    const formattedItems = items.map((item) => ({
      id: item.id,
      participantName: item.participantName,
      menuItemId: item.menuItemId,
      menuItemName: item.menuItemName,
      menuItemPrice: item.menuItemPrice ? Number(item.menuItemPrice) : null,
      menuItemImage: item.menuItemImage,
      quantity: item.quantity,
      selectedVariation: item.selectedVariation,
      selectedOptions: item.selectedOptions ?? [],
      specialInstructions: item.specialInstructions,
      createdAt: item.createdAt ? Number(item.createdAt) : null,
    }));

    const participantMap: Record<string, any[]> = {};
    formattedItems.forEach((item) => {
      if (!item.participantName) return;
      participantMap[item.participantName] = participantMap[item.participantName] || [];
      participantMap[item.participantName].push(item);
    });

    return {
      id: order.id,
      initiatorName: order.initiatorName,
      status: order.status,
      createdAt: order.createdAt ? Number(order.createdAt) : null,
      expiresAt: order.expiresAt ? Number(order.expiresAt) : null,
      items: formattedItems,
      participantOrders: participantMap,
      participantCount: Object.keys(participantMap).length,
    };
  }

  async create(tenantId: string, dto: CreateGroupOrderDto) {
    const id = this.generateGroupCode();
    const createdAt = BigInt(Date.now());
    const expiresAt = createdAt + BigInt(24 * 60 * 60 * 1000);

    await this.prisma.groupOrder.create({
      data: {
        id,
        tenantId,
        initiatorName: dto.initiatorName.trim(),
        status: 'active',
        createdAt,
        expiresAt,
      },
    });

    return {
      id,
      initiatorName: dto.initiatorName.trim(),
      status: 'active',
      createdAt: Number(createdAt),
      expiresAt: Number(expiresAt),
      shareLink: `/group-order/${id}`,
    };
  }

  async addItem(tenantId: string, id: string, dto: AddGroupItemDto) {
    const order = await this.prisma.groupOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Group order not found');
    if (order.status !== 'active') throw new NotFoundException('Group order is no longer active');
    if (order.expiresAt && Date.now() > Number(order.expiresAt)) {
      await this.prisma.groupOrder.updateMany({ where: { id, tenantId }, data: { status: 'expired' } });
      throw new NotFoundException('Group order has expired');
    }

    const itemId = randomUUID();
    const createdAt = BigInt(Date.now());
    const price = dto.selectedVariation ? (dto.selectedVariation as any).price : dto.menuItem.price;

    await this.prisma.groupOrderItem.create({
      data: {
        id: itemId,
        tenantId,
        groupOrderId: id,
        participantName: dto.participantName.trim(),
        menuItemId: dto.menuItem.id,
        menuItemName: dto.menuItem.name,
        menuItemPrice: price,
        menuItemImage: dto.menuItem.image || '',
        quantity: dto.quantity ?? 1,
        selectedVariation: dto.selectedVariation ? JSON.stringify(dto.selectedVariation) : Prisma.JsonNull,
        selectedOptions: dto.selectedOptions ?? [],
        specialInstructions: dto.specialInstructions ?? null,
        createdAt,
      },
    });

    return {
      id: itemId,
      groupOrderId: id,
      participantName: dto.participantName.trim(),
      menuItemId: dto.menuItem.id,
      menuItemName: dto.menuItem.name,
      menuItemPrice: price,
      menuItemImage: dto.menuItem.image,
      quantity: dto.quantity ?? 1,
      selectedVariation: dto.selectedVariation,
      selectedOptions: dto.selectedOptions ?? [],
      specialInstructions: dto.specialInstructions,
      createdAt: Number(createdAt),
    };
  }

  async removeItem(tenantId: string, id: string, itemId: string) {
    const order = await this.prisma.groupOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Group order not found');
    if (order.status !== 'active') throw new NotFoundException('Group order is no longer active');

    const deleted = await this.prisma.groupOrderItem.deleteMany({ where: { id: itemId, groupOrderId: id, tenantId } });
    if (deleted.count === 0) throw new NotFoundException('Item not found in group order');
    return { message: 'Item removed from group order' };
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateGroupStatusDto) {
    const order = await this.prisma.groupOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Group order not found');

    const updatedRows = await this.prisma.groupOrder.updateMany({
      where: { id, tenantId },
      data: { status: dto.status },
    });
    if (!updatedRows.count) throw new NotFoundException('Group order not found');
    const updated = await this.prisma.groupOrder.findFirst({ where: { id, tenantId } });
    if (!updated) throw new NotFoundException('Group order not found');

    return {
      id: updated.id,
      initiatorName: updated.initiatorName,
      status: updated.status,
      createdAt: updated.createdAt ? Number(updated.createdAt) : null,
      expiresAt: updated.expiresAt ? Number(updated.expiresAt) : null,
    };
  }

  async participantItems(tenantId: string, id: string, participantName: string) {
    const order = await this.prisma.groupOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('Group order not found');

    const items = await this.prisma.groupOrderItem.findMany({
      where: { groupOrderId: id, participantName, tenantId },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = items.map((item) => ({
      id: item.id,
      participantName: item.participantName,
      menuItemId: item.menuItemId,
      menuItemName: item.menuItemName,
      menuItemPrice: item.menuItemPrice ? Number(item.menuItemPrice) : null,
      menuItemImage: item.menuItemImage,
      quantity: item.quantity,
      selectedVariation: item.selectedVariation,
      selectedOptions: item.selectedOptions ?? [],
      specialInstructions: item.specialInstructions,
      createdAt: item.createdAt ? Number(item.createdAt) : null,
    }));

    return { participantName, groupOrderId: id, items: formatted };
  }
}
