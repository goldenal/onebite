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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const stripe_1 = __importDefault(require("stripe"));
const config_1 = require("@nestjs/config");
const kitchen_service_1 = require("../kitchen/kitchen.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let WebhooksController = class WebhooksController {
    constructor(config, kitchen, prisma) {
        this.config = config;
        this.kitchen = kitchen;
        this.prisma = prisma;
        this.stripe = new stripe_1.default(this.config.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
        });
    }
    async stripeWebhook(req, res, sig) {
        const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
            return res.status(500).json({ error: 'server_not_configured', message: 'STRIPE_WEBHOOK_SECRET required' });
        }
        let event;
        try {
            const rawBody = req.rawBody;
            if (!rawBody) {
                return res.status(400).json({ error: 'invalid_signature' });
            }
            event = this.stripe.webhooks.constructEvent(rawBody, sig || '', webhookSecret);
        }
        catch {
            return res.status(400).json({ error: 'invalid_signature' });
        }
        if (event.type === 'payment_intent.succeeded') {
            const pi = event.data.object;
            const metadata = pi.metadata || {};
            const channel = (metadata.channel || 'web');
            const fulfillment = (metadata.fulfillment || 'pickup');
            const now = new Date().toISOString();
            const id = this.kitchen.normalizeOrderId(metadata.order_id || metadata.cart_id || pi.id);
            const pickupCode = fulfillment === 'pickup' && (channel === 'web' || channel === 'phone')
                ? this.kitchen.generatePickupCode()
                : undefined;
            const items = metadata.items ? this.safeJson(metadata.items, []) : [];
            const order = {
                id,
                channel,
                fulfillment,
                source_label: channel === 'web'
                    ? `Web ${fulfillment === 'pickup' ? 'Pickup' : 'Delivery'}`
                    : channel === 'phone'
                        ? `Phone ${fulfillment === 'pickup' ? 'Pickup' : 'Delivery'}`
                        : 'In-Store Tablet',
                status: 'queued',
                arrival_status: fulfillment === 'pickup'
                    ? channel === 'tablet'
                        ? 'not_required'
                        : 'waiting'
                    : 'not_required',
                pickup_code: pickupCode,
                paid_at: now,
                created_at: now,
                items,
                audit: [
                    { ts: now, actor: 'system', action: 'paid', details: { payment_intent: pi.id } },
                    pickupCode
                        ? { ts: now, actor: 'system', action: 'pickup_code_generated', details: { pickupCode } }
                        : { ts: now, actor: 'system', action: 'order_created' },
                ],
            };
            await this.prisma.$transaction(async (tx) => {
                await tx.paymentLink.updateMany({ where: { orderId: id }, data: { state: 'PAID', updatedAt: new Date() } });
                let created = false;
                try {
                    await tx.processedEvent.create({ data: { eventId: event.id, source: 'stripe' } });
                    created = true;
                }
                catch (err) {
                    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                        created = false;
                    }
                    else {
                        throw err;
                    }
                }
                if (!created)
                    return;
                await this.kitchen.upsertOrderWithItemsTx(tx, order);
            });
        }
        return res.json({ received: true });
    }
    async deliveryWebhook(req, res) {
        const token = this.config.get('DELIVERY_WEBHOOK_TOKEN');
        if (token && req.headers.authorization !== `Bearer ${token}`) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        const payload = req.body;
        if (!payload?.order_ref || !payload?.event) {
            return res.status(400).json({ error: 'bad_request' });
        }
        await this.kitchen.updateDelivery(payload.order_ref, payload.event, payload.driver_status);
        return res.json({ ok: true });
    }
    safeJson(value, fallback) {
        try {
            return JSON.parse(value);
        }
        catch {
            return fallback;
        }
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Post)('stripe'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "stripeWebhook", null);
__decorate([
    (0, common_1.Post)('delivery'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "deliveryWebhook", null);
exports.WebhooksController = WebhooksController = __decorate([
    (0, swagger_1.ApiTags)('webhooks'),
    (0, common_1.Controller)('webhooks'),
    __metadata("design:paramtypes", [config_1.ConfigService,
        kitchen_service_1.KitchenService,
        prisma_service_1.PrismaService])
], WebhooksController);
