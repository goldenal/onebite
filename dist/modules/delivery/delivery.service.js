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
const uber_direct_service_1 = require("./uber-direct.service");
let DeliveryService = class DeliveryService {
    constructor(prisma, uber) {
        this.prisma = prisma;
        this.uber = uber;
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
    async quote(dto) {
        const provider = dto.provider || 'uber_direct';
        if (provider !== 'uber_direct')
            throw new common_1.BadRequestException('unsupported_provider');
        const payment = await this.prisma.paymentLink.findUnique({ where: { orderId: dto.order_id } });
        if (!payment)
            throw new common_1.NotFoundException('order_not_found');
        if (payment.fulfillment !== 'delivery')
            throw new common_1.BadRequestException('not_delivery');
        const location = await this.prisma.location.findUnique({ where: { id: dto.location_id } });
        if (!location)
            throw new common_1.NotFoundException('location_not_found');
        const pickup = this.uber.toUberAddress({
            address_line1: location.addressLine1,
            address_line2: location.addressLine2 || undefined,
            city: location.city,
            state: location.state,
            postal_code: location.postalCode,
            country: location.country,
        });
        const dropoff = this.uber.toUberAddress(dto.dropoff_address);
        const quote = await this.uber.createQuote({ pickup, dropoff });
        const quoteId = String(quote.id || quote.quote_id || '');
        const feeAmount = Number(quote.fee?.amount ?? quote.fee?.value ?? quote.fee ?? 0);
        const currency = String(quote.fee?.currency_code || quote.fee?.currency || quote.currency || 'USD');
        const eta = quote.dropoff_eta || quote.eta || null;
        const expiresAt = quote.expires_at ? new Date(quote.expires_at) : null;
        if (!quoteId)
            throw new common_1.BadRequestException('quote_failed');
        await this.prisma.$transaction(async (tx) => {
            await tx.deliveryAddress.upsert({
                where: { orderId: dto.order_id },
                update: {
                    locationId: dto.location_id,
                    name: dto.dropoff_name ?? null,
                    phone: dto.dropoff_phone ?? null,
                    addressLine1: dto.dropoff_address.address_line1,
                    addressLine2: dto.dropoff_address.address_line2 ?? null,
                    city: dto.dropoff_address.city,
                    state: dto.dropoff_address.state,
                    postalCode: dto.dropoff_address.postal_code,
                    country: dto.dropoff_address.country,
                    instructions: dto.dropoff_instructions ?? null,
                    updatedAt: new Date(),
                },
                create: {
                    orderId: dto.order_id,
                    locationId: dto.location_id,
                    name: dto.dropoff_name ?? null,
                    phone: dto.dropoff_phone ?? null,
                    addressLine1: dto.dropoff_address.address_line1,
                    addressLine2: dto.dropoff_address.address_line2 ?? null,
                    city: dto.dropoff_address.city,
                    state: dto.dropoff_address.state,
                    postalCode: dto.dropoff_address.postal_code,
                    country: dto.dropoff_address.country,
                    instructions: dto.dropoff_instructions ?? null,
                },
            });
            await tx.deliveryQuote.upsert({
                where: { orderId: dto.order_id },
                update: {
                    provider,
                    locationId: dto.location_id,
                    quoteId,
                    feeCents: Math.max(0, Math.round(feeAmount)),
                    currency,
                    eta,
                    expiresAt: expiresAt ?? null,
                    raw: quote ?? {},
                    updatedAt: new Date(),
                },
                create: {
                    orderId: dto.order_id,
                    provider,
                    locationId: dto.location_id,
                    quoteId,
                    feeCents: Math.max(0, Math.round(feeAmount)),
                    currency,
                    eta,
                    expiresAt: expiresAt ?? null,
                    raw: quote ?? {},
                },
            });
        });
        return {
            order_id: dto.order_id,
            quote_id: quoteId,
            fee_cents: Math.max(0, Math.round(feeAmount)),
            currency,
            eta,
            expires_at: expiresAt ? expiresAt.toISOString() : null,
            provider,
        };
    }
    async createDeliveryAfterPayment(orderId) {
        const payment = await this.prisma.paymentLink.findUnique({ where: { orderId } });
        if (!payment)
            throw new common_1.NotFoundException('order_not_found');
        if (payment.fulfillment !== 'delivery')
            return null;
        const quote = await this.prisma.deliveryQuote.findUnique({ where: { orderId } });
        const address = await this.prisma.deliveryAddress.findUnique({ where: { orderId } });
        if (!quote || !address)
            throw new common_1.NotFoundException('delivery_quote_not_found');
        if (quote.provider !== 'uber_direct')
            return null;
        const location = await this.prisma.location.findUnique({ where: { id: quote.locationId } });
        if (!location)
            throw new common_1.NotFoundException('location_not_found');
        const dropoffName = address.name || payment.customerName || 'Customer';
        const dropoffPhone = address.phone || payment.customerPhone || '';
        if (!dropoffPhone)
            throw new common_1.BadRequestException('dropoff_phone_required');
        const pickup = this.uber.toUberAddress({
            address_line1: location.addressLine1,
            address_line2: location.addressLine2 || undefined,
            city: location.city,
            state: location.state,
            postal_code: location.postalCode,
            country: location.country,
        });
        const dropoff = this.uber.toUberAddress({
            address_line1: address.addressLine1,
            address_line2: address.addressLine2 || undefined,
            city: address.city,
            state: address.state,
            postal_code: address.postalCode,
            country: address.country,
        });
        const manifestItems = Array.isArray(payment.items)
            ? payment.items.map((item) => ({
                name: item?.menuItem?.name || item?.name || 'Item',
                quantity: Number(item?.quantity || item?.qty || 1),
                size: 'M',
                price: item?.menuItem?.price ? Math.round(Number(item.menuItem.price) * 100) : undefined,
            }))
            : [{ name: 'Order', quantity: 1, size: 'M' }];
        const delivery = await this.uber.createDelivery({
            quote_id: quote.quoteId,
            pickup_name: location.name,
            pickup_phone_number: location.phone,
            pickup_address: pickup,
            dropoff_name: dropoffName,
            dropoff_phone_number: dropoffPhone,
            dropoff_address: dropoff,
            manifest_items: manifestItems,
            dropoff_notes: address.instructions || undefined,
        });
        const deliveryId = String(delivery.id || delivery.delivery_id || '');
        const status = String(delivery.status || 'pending');
        const eta = delivery.dropoff_eta || delivery.eta || null;
        await this.prisma.deliveryRequest.upsert({
            where: { orderId },
            update: {
                provider: 'uber_direct',
                deliveryId: deliveryId || null,
                status,
                eta,
                updatedAt: new Date(),
            },
            create: {
                orderId,
                provider: 'uber_direct',
                deliveryId: deliveryId || null,
                status,
                eta,
            },
        });
        return { delivery_id: deliveryId, status, eta };
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, uber_direct_service_1.UberDirectService])
], DeliveryService);
