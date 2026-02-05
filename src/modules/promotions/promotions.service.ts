import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  private toPromotion(p: any) {
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      type: p.type,
      value: Number(p.value),
      applicableItems: p.applicableItems ?? [],
      applicableCategories: p.applicableCategories ?? [],
      startDate: p.startDate,
      endDate: p.endDate,
      active: p.active === true,
      code: p.code,
      minimumPurchase: p.minimumPurchase,
      maxUses: p.maxUses,
      currentUses: p.currentUses,
      daysOfWeek: p.daysOfWeek ?? [],
      timeStart: p.timeStart,
      timeEnd: p.timeEnd,
      createdAt: p.createdAt ? Number(p.createdAt) : null,
    };
  }

  async list() {
    const rows = await this.prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((p) => this.toPromotion(p));
  }

  async listActive() {
    const today = new Date().toISOString().split('T')[0];
    const rows = await this.prisma.promotion.findMany({
      where: {
        active: true,
        AND: [
          {
            OR: [{ startDate: null }, { startDate: '' }, { startDate: { lte: today } }],
          },
          {
            OR: [{ endDate: null }, { endDate: '' }, { endDate: { gte: today } }],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((p) => this.toPromotion(p));
  }

  async get(id: string) {
    const promo = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promotion not found');
    return this.toPromotion(promo);
  }

  async create(dto: CreatePromotionDto) {
    const id = randomUUID();
    const createdAt = BigInt(Date.now());
    const promo = await this.prisma.promotion.create({
      data: {
        id,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        value: dto.value,
        applicableItems: dto.applicableItems ?? [],
        applicableCategories: dto.applicableCategories ?? [],
        startDate: dto.startDate ?? null,
        endDate: dto.endDate ?? null,
        active: dto.active ?? true,
        code: dto.code ?? null,
        minimumPurchase: dto.minimumPurchase ?? null,
        maxUses: dto.maxUses ?? null,
        currentUses: 0,
        daysOfWeek: dto.daysOfWeek ?? [],
        timeStart: dto.timeStart ?? null,
        timeEnd: dto.timeEnd ?? null,
        createdAt,
      },
    });
    return this.toPromotion(promo);
  }

  async update(id: string, dto: UpdatePromotionDto) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Promotion not found');

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.value !== undefined) updateData.value = dto.value;
    if (dto.applicableItems !== undefined) updateData.applicableItems = dto.applicableItems;
    if (dto.applicableCategories !== undefined) updateData.applicableCategories = dto.applicableCategories;
    if (dto.startDate !== undefined) updateData.startDate = dto.startDate;
    if (dto.endDate !== undefined) updateData.endDate = dto.endDate;
    if (dto.active !== undefined) updateData.active = dto.active;
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.minimumPurchase !== undefined) updateData.minimumPurchase = dto.minimumPurchase;
    if (dto.maxUses !== undefined) updateData.maxUses = dto.maxUses;
    if (dto.currentUses !== undefined) updateData.currentUses = dto.currentUses;
    if (dto.daysOfWeek !== undefined) updateData.daysOfWeek = dto.daysOfWeek;
    if (dto.timeStart !== undefined) updateData.timeStart = dto.timeStart;
    if (dto.timeEnd !== undefined) updateData.timeEnd = dto.timeEnd;

    const promo = await this.prisma.promotion.update({
      where: { id },
      data: updateData,
    });
    return this.toPromotion(promo);
  }

  async remove(id: string) {
    const existing = await this.prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Promotion not found');
    await this.prisma.promotion.delete({ where: { id } });
    return { message: 'Promotion deleted successfully' };
  }
}
