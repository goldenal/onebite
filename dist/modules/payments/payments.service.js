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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
let PaymentsService = class PaymentsService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async createCart(dto) {
        const order_id = `ord_${(0, crypto_1.randomUUID)()}`;
        await this.prisma.paymentLink.upsert({
            where: { orderId: order_id },
            update: {
                amount: dto.amount,
                fulfillment: dto.fulfillment,
                channel: dto.channel || 'web',
                items: dto.items ?? [],
                customerName: dto.customerName ?? null,
                customerPhone: dto.customerPhone ?? null,
                state: 'AWAITING_PAYMENT',
                updatedAt: new Date(),
            },
            create: {
                orderId: order_id,
                userId: dto.user_id ?? null,
                amount: dto.amount,
                state: 'AWAITING_PAYMENT',
                fulfillment: dto.fulfillment,
                channel: dto.channel || 'web',
                items: dto.items ?? [],
                customerName: dto.customerName ?? null,
                customerPhone: dto.customerPhone ?? null,
            },
        });
        return { order_id, state: 'AWAITING_PAYMENT' };
    }
    async createPaymentLink(dto) {
        const existing = await this.prisma.paymentLink.findUnique({ where: { orderId: dto.order_id } });
        if (!existing)
            throw new common_1.NotFoundException('order_not_found');
        let payment_link = `https://pay.example/${dto.order_id}`;
        const makeUrl = this.config.get('MAKE_WEBHOOK_URL');
        if (makeUrl) {
            try {
                const resp = await fetch(makeUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: dto.user_id, order_id: dto.order_id, amount: dto.amount }),
                });
                const body = await resp.json().catch(() => ({}));
                if (body.payment_link)
                    payment_link = body.payment_link;
            }
            catch {
                // ignore webhook errors
            }
        }
        await this.prisma.paymentLink.update({
            where: { orderId: dto.order_id },
            data: { amount: dto.amount, state: 'AWAITING_PAYMENT', paymentLink: payment_link, updatedAt: new Date() },
        });
        return { payment_link, state: 'AWAITING_PAYMENT' };
    }
    async getPayment(orderId) {
        const row = await this.prisma.paymentLink.findUnique({ where: { orderId } });
        if (!row)
            throw new common_1.NotFoundException('order_not_found');
        return row;
    }
    async phonePaymentLink(dto) {
        const order_id = `ord_${(0, crypto_1.randomUUID)()}`;
        await this.prisma.paymentLink.upsert({
            where: { orderId: order_id },
            update: {
                amount: dto.amount,
                fulfillment: dto.fulfillment || 'pickup',
                channel: 'phone',
                items: dto.items ?? [],
                customerName: dto.customerName ?? null,
                customerPhone: dto.customerPhone ?? null,
                state: 'AWAITING_PAYMENT',
                updatedAt: new Date(),
            },
            create: {
                orderId: order_id,
                amount: dto.amount,
                state: 'AWAITING_PAYMENT',
                fulfillment: dto.fulfillment || 'pickup',
                channel: 'phone',
                items: dto.items ?? [],
                customerName: dto.customerName ?? null,
                customerPhone: dto.customerPhone ?? null,
            },
        });
        let payment_link = `https://pay.example/${order_id}`;
        const makeUrl = this.config.get('MAKE_WEBHOOK_URL');
        if (makeUrl) {
            try {
                const resp = await fetch(makeUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ order_id, amount: dto.amount }),
                });
                const body = await resp.json().catch(() => ({}));
                if (body.payment_link)
                    payment_link = body.payment_link;
            }
            catch {
                // ignore webhook errors
            }
        }
        await this.prisma.paymentLink.update({
            where: { orderId: order_id },
            data: { paymentLink: payment_link, updatedAt: new Date() },
        });
        return { order_id, payment_link, state: 'AWAITING_PAYMENT' };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, config_1.ConfigService])
], PaymentsService);
