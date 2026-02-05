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
exports.GroupOrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
let GroupOrdersService = class GroupOrdersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    generateGroupCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++)
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        return code;
    }
    async listAdmin() {
        const rows = await this.prisma.groupOrder.findMany({ orderBy: { createdAt: 'desc' } });
        return rows.map((o) => ({
            id: o.id,
            initiatorName: o.initiatorName,
            status: o.status,
            createdAt: o.createdAt ? Number(o.createdAt) : null,
            expiresAt: o.expiresAt ? Number(o.expiresAt) : null,
        }));
    }
    async get(id) {
        const order = await this.prisma.groupOrder.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Group order not found');
        const items = await this.prisma.groupOrderItem.findMany({
            where: { groupOrderId: id },
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
        const participantMap = {};
        formattedItems.forEach((item) => {
            if (!item.participantName)
                return;
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
    async create(dto) {
        const id = this.generateGroupCode();
        const createdAt = BigInt(Date.now());
        const expiresAt = createdAt + BigInt(24 * 60 * 60 * 1000);
        await this.prisma.groupOrder.create({
            data: {
                id,
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
    async addItem(id, dto) {
        const order = await this.prisma.groupOrder.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Group order not found');
        if (order.status !== 'active')
            throw new common_1.NotFoundException('Group order is no longer active');
        if (order.expiresAt && Date.now() > Number(order.expiresAt)) {
            await this.prisma.groupOrder.update({ where: { id }, data: { status: 'expired' } });
            throw new common_1.NotFoundException('Group order has expired');
        }
        const itemId = (0, crypto_1.randomUUID)();
        const createdAt = BigInt(Date.now());
        const price = dto.selectedVariation ? dto.selectedVariation.price : dto.menuItem.price;
        await this.prisma.groupOrderItem.create({
            data: {
                id: itemId,
                groupOrderId: id,
                participantName: dto.participantName.trim(),
                menuItemId: dto.menuItem.id,
                menuItemName: dto.menuItem.name,
                menuItemPrice: price,
                menuItemImage: dto.menuItem.image || '',
                quantity: dto.quantity ?? 1,
                selectedVariation: dto.selectedVariation ? JSON.stringify(dto.selectedVariation) : client_1.Prisma.JsonNull,
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
    async removeItem(id, itemId) {
        const order = await this.prisma.groupOrder.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Group order not found');
        if (order.status !== 'active')
            throw new common_1.NotFoundException('Group order is no longer active');
        const deleted = await this.prisma.groupOrderItem.deleteMany({ where: { id: itemId, groupOrderId: id } });
        if (deleted.count === 0)
            throw new common_1.NotFoundException('Item not found in group order');
        return { message: 'Item removed from group order' };
    }
    async updateStatus(id, dto) {
        const order = await this.prisma.groupOrder.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Group order not found');
        const updated = await this.prisma.groupOrder.update({
            where: { id },
            data: { status: dto.status },
        });
        return {
            id: updated.id,
            initiatorName: updated.initiatorName,
            status: updated.status,
            createdAt: updated.createdAt ? Number(updated.createdAt) : null,
            expiresAt: updated.expiresAt ? Number(updated.expiresAt) : null,
        };
    }
    async participantItems(id, participantName) {
        const order = await this.prisma.groupOrder.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Group order not found');
        const items = await this.prisma.groupOrderItem.findMany({
            where: { groupOrderId: id, participantName },
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
};
exports.GroupOrdersService = GroupOrdersService;
exports.GroupOrdersService = GroupOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GroupOrdersService);
