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
exports.DeliveryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let DeliveryService = class DeliveryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async request(dto) {
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
    async webhook(dto) {
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
    async status(orderId) {
        const row = await this.prisma.deliveryRequest.findUnique({ where: { orderId } });
        if (!row)
            throw new common_1.NotFoundException('delivery_not_found');
        return {
            order_id: row.orderId,
            status: row.status,
            eta: row.eta,
            delivery_id: row.deliveryId,
            provider: row.provider,
        };
    }
};
exports.DeliveryService = DeliveryService;
exports.DeliveryService = DeliveryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DeliveryService);
