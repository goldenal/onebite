import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async listMenu() {
    const rows = await this.prisma.menuItem.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return rows.map(this.toResponse);
  }

  async getMenuItem(id: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    return item ? this.toResponse(item) : null;
  }

  async createMenuItem(dto: CreateMenuItemDto) {
    const id = randomUUID();
    const item = await this.prisma.menuItem.create({
      data: {
        id,
        name: dto.name,
        description: dto.description ?? '',
        price: dto.price,
        category: dto.category,
        image: dto.image ?? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
        dietary: dto.dietary ?? [],
        popular: dto.popular ?? false,
        variations: dto.variations ?? [],
        optionGroups: dto.optionGroups ?? [],
        includes: dto.includes ?? [],
        notes: dto.notes ?? '',
      },
    });
    return this.toResponse(item);
  }

  async updateMenuItem(id: string, dto: UpdateMenuItemDto) {
    const existing = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Item not found');

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.image !== undefined) updateData.image = dto.image;
    if (dto.dietary !== undefined) updateData.dietary = dto.dietary;
    if (dto.popular !== undefined) updateData.popular = dto.popular;
    if (dto.variations !== undefined) updateData.variations = dto.variations;
    if (dto.optionGroups !== undefined) updateData.optionGroups = dto.optionGroups;
    if (dto.includes !== undefined) updateData.includes = dto.includes;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const item = await this.prisma.menuItem.update({
      where: { id },
      data: updateData,
    });
    return this.toResponse(item);
  }

  async deleteMenuItem(id: string) {
    const existing = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Item not found');
    await this.prisma.menuItem.delete({ where: { id } });
    await this.prisma.inventoryItem.deleteMany({ where: { itemId: id } });
    return { message: 'Item deleted successfully' };
  }

  private toResponse(item: any) {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      category: item.category,
      image: item.image,
      dietary: item.dietary ?? [],
      popular: item.popular === true,
      variations: item.variations ?? [],
      optionGroups: item.optionGroups ?? [],
      includes: item.includes ?? [],
      notes: item.notes || '',
    };
  }
}
