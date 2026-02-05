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
exports.LegacyOrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
let LegacyOrdersService = class LegacyOrdersService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    allowLegacyOrders() {
        return this.config.get('ALLOW_LEGACY_ORDERS') === 'true';
    }
    async list() {
        const rows = await this.prisma.legacyOrder.findMany({ orderBy: { timestamp: 'desc' } });
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
    async get(id) {
        const order = await this.prisma.legacyOrder.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
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
    async create(dto) {
        if (!this.allowLegacyOrders()) {
            throw new common_1.ForbiddenException('Legacy order creation disabled. Use Stripe payment flow.');
        }
        const id = (0, crypto_1.randomUUID)();
        const timestamp = Date.now();
        const estimatedTime = 25 + Math.floor(Math.random() * 15);
        await this.prisma.legacyOrder.create({
            data: {
                id,
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
    async update(id, dto) {
        const existing = await this.prisma.legacyOrder.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Order not found');
        const updated = await this.prisma.legacyOrder.update({
            where: { id },
            data: {
                status: dto.status ?? existing.status,
                customerName: dto.customerName ?? existing.customerName,
                customerPhone: dto.customerPhone ?? existing.customerPhone,
            },
        });
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
    async remove(id) {
        const existing = await this.prisma.legacyOrder.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Order not found');
        await this.prisma.legacyOrder.delete({ where: { id } });
        return { message: 'Order deleted successfully' };
    }
};
exports.LegacyOrdersService = LegacyOrdersService;
exports.LegacyOrdersService = LegacyOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, config_1.ConfigService])
], LegacyOrdersService);
