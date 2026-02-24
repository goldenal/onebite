import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  private inventoryStatus(current: number, min: number) {
    if (current <= 0) return 'out-of-stock';
    if (current <= min) return 'low-stock';
    return 'in-stock';
  }

  async list(tenantId: string) {
    const rows = await this.prisma.inventoryItem.findMany({ where: { tenantId }, orderBy: { itemName: 'asc' } });
    return rows.map((item) => ({
      itemId: item.itemId,
      itemName: item.itemName,
      currentStock: item.currentStock,
      minStock: item.minStock,
      maxStock: item.maxStock,
      unit: item.unit,
      status: this.inventoryStatus(item.currentStock ?? 0, item.minStock ?? 5),
      autoReorder: item.autoReorder === true,
      lastRestocked: item.lastRestocked ? item.lastRestocked.toISOString() : null,
    }));
  }

  async get(tenantId: string, itemId: string) {
    const item = await this.prisma.inventoryItem.findFirst({ where: { itemId, tenantId } });
    if (!item) throw new NotFoundException('Inventory item not found');
    return {
      itemId: item.itemId,
      itemName: item.itemName,
      currentStock: item.currentStock,
      minStock: item.minStock,
      maxStock: item.maxStock,
      unit: item.unit,
      status: this.inventoryStatus(item.currentStock ?? 0, item.minStock ?? 5),
      autoReorder: item.autoReorder === true,
      lastRestocked: item.lastRestocked ? item.lastRestocked.toISOString() : null,
    };
  }

  async create(tenantId: string, dto: CreateInventoryDto) {
    const status = this.inventoryStatus(dto.currentStock ?? 0, dto.minStock ?? 5);
    const lastRestocked = new Date();
    await this.prisma.inventoryItem.create({
      data: {
        itemId: dto.itemId,
        tenantId,
        itemName: dto.itemName,
        currentStock: dto.currentStock ?? 0,
        minStock: dto.minStock ?? 5,
        maxStock: dto.maxStock ?? 50,
        unit: dto.unit ?? 'servings',
        status,
        autoReorder: dto.autoReorder ?? false,
        lastRestocked,
      },
    });
    return {
      itemId: dto.itemId,
      itemName: dto.itemName,
      currentStock: dto.currentStock ?? 0,
      minStock: dto.minStock ?? 5,
      maxStock: dto.maxStock ?? 50,
      unit: dto.unit ?? 'servings',
      status,
      autoReorder: dto.autoReorder ?? false,
      lastRestocked: lastRestocked.toISOString(),
    };
  }

  async update(tenantId: string, itemId: string, dto: UpdateInventoryDto) {
    const existing = await this.prisma.inventoryItem.findFirst({ where: { itemId, tenantId } });
    if (!existing) throw new NotFoundException('Inventory item not found');

    const newCurrent = dto.currentStock ?? existing.currentStock ?? 0;
    const newMin = dto.minStock ?? existing.minStock ?? 5;
    const status = this.inventoryStatus(newCurrent, newMin);
    const lastRestocked =
      dto.currentStock !== undefined && dto.currentStock !== existing.currentStock
        ? new Date()
        : existing.lastRestocked;

    await this.prisma.inventoryItem.updateMany({
      where: { itemId, tenantId },
      data: {
        currentStock: newCurrent,
        minStock: newMin,
        maxStock: dto.maxStock ?? existing.maxStock,
        unit: dto.unit ?? existing.unit,
        status,
        autoReorder: dto.autoReorder !== undefined ? dto.autoReorder : existing.autoReorder,
        lastRestocked,
      },
    });

    return {
      itemId,
      itemName: existing.itemName,
      currentStock: newCurrent,
      minStock: newMin,
      maxStock: dto.maxStock ?? existing.maxStock,
      unit: dto.unit ?? existing.unit,
      status,
      autoReorder: dto.autoReorder !== undefined ? dto.autoReorder : existing.autoReorder,
      lastRestocked: lastRestocked ? new Date(lastRestocked).toISOString() : null,
    };
  }

  async remove(tenantId: string, itemId: string) {
    const existing = await this.prisma.inventoryItem.findFirst({ where: { itemId, tenantId } });
    if (!existing) throw new NotFoundException('Inventory item not found');
    await this.prisma.inventoryItem.deleteMany({ where: { itemId, tenantId } });
    return { message: 'Inventory item deleted successfully' };
  }
}
