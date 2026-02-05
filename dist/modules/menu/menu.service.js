"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const crypto_1 = require("crypto");
let MenuService = class MenuService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listMenu() {
        const rows = await this.prisma.menuItem.findMany({
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });
        return rows.map(this.toResponse);
    }
    async getMenuItem(id) {
        const item = await this.prisma.menuItem.findUnique({ where: { id } });
        return item ? this.toResponse(item) : null;
    }
    async createMenuItem(dto) {
        const id = (0, crypto_1.randomUUID)();
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
    async updateMenuItem(id, dto) {
        const existing = await this.prisma.menuItem.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Item not found');
        const updateData = {};
        if (dto.name !== undefined)
            updateData.name = dto.name;
        if (dto.description !== undefined)
            updateData.description = dto.description;
        if (dto.price !== undefined)
            updateData.price = dto.price;
        if (dto.category !== undefined)
            updateData.category = dto.category;
        if (dto.image !== undefined)
            updateData.image = dto.image;
        if (dto.dietary !== undefined)
            updateData.dietary = dto.dietary;
        if (dto.popular !== undefined)
            updateData.popular = dto.popular;
        if (dto.variations !== undefined)
            updateData.variations = dto.variations;
        if (dto.optionGroups !== undefined)
            updateData.optionGroups = dto.optionGroups;
        if (dto.includes !== undefined)
            updateData.includes = dto.includes;
        if (dto.notes !== undefined)
            updateData.notes = dto.notes;
        const item = await this.prisma.menuItem.update({
            where: { id },
            data: updateData,
        });
        return this.toResponse(item);
    }
    async deleteMenuItem(id) {
        const existing = await this.prisma.menuItem.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Item not found');
        await this.prisma.menuItem.delete({ where: { id } });
        await this.prisma.inventoryItem.deleteMany({ where: { itemId: id } });
        return { message: 'Item deleted successfully' };
    }
    toResponse(item) {
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
};
exports.MenuService = MenuService;
exports.MenuService = MenuService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MenuService);
