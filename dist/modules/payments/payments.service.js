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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const stripe_1 = __importDefault(require("stripe"));
let PaymentsService = class PaymentsService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.stripe = new stripe_1.default(this.config.get('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2023-10-16',
        });
    }
    makeWebhookTimeoutMs() {
        return Number(this.config.get('MAKE_WEBHOOK_TIMEOUT_MS') || 5000);
    }
    async fetchWithTimeout(url, init, timeoutMs) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));
        try {
            return await fetch(url, { ...init, signal: controller.signal });
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async requestMakePaymentLink(payload) {
        const makeUrl = this.config.get('MAKE_WEBHOOK_URL');
        if (!makeUrl)
            return null;
        try {
            const resp = await this.fetchWithTimeout(makeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }, this.makeWebhookTimeoutMs());
            const body = await resp.json().catch(() => ({}));
            return body.payment_link || null;
        }
        catch {
            return null;
        }
    }
    toCents(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric <= 0)
            return 0;
        return Math.round(numeric * 100);
    }
    normalizeRawItems(value) {
        return Array.isArray(value) ? value : [];
    }
    async resolveMenuPricedItems(items) {
        if (!items.length)
            return [];
        const parsed = items.map((raw, index) => {
            const id = String(raw?.menuItem?.id ?? raw?.menuItemId ?? raw?.id ?? '').trim();
            if (!id)
                throw new common_1.BadRequestException(`menu_item_id_required_at_index_${index}`);
            const quantity = Number(raw?.quantity ?? raw?.qty ?? 1);
            if (!Number.isInteger(quantity) || quantity <= 0) {
                throw new common_1.BadRequestException(`invalid_quantity_at_index_${index}`);
            }
            return { raw, menuItemId: id, quantity };
        });
        const menuItems = await this.prisma.menuItem.findMany({
            where: { id: { in: Array.from(new Set(parsed.map((item) => item.menuItemId))) } },
            select: { id: true, name: true, price: true },
        });
        const byId = new Map(menuItems.map((row) => [row.id, row]));
        return parsed.map((item) => {
            const menuItem = byId.get(item.menuItemId);
            if (!menuItem)
                throw new common_1.BadRequestException(`menu_item_not_found:${item.menuItemId}`);
            const unitAmountCents = this.toCents(menuItem.price);
            if (unitAmountCents <= 0)
                throw new common_1.BadRequestException(`invalid_menu_item_price:${item.menuItemId}`);
            return {
                raw: item.raw,
                menuItemId: item.menuItemId,
                name: menuItem.name || 'Item',
                quantity: item.quantity,
                unitAmountCents,
            };
        });
    }
    totalFromResolvedItems(resolvedItems) {
        return resolvedItems.reduce((sum, item) => sum + item.unitAmountCents * item.quantity, 0);
    }
    toPersistedItems(resolvedItems) {
        return resolvedItems.map((item) => {
            const raw = item.raw && typeof item.raw === 'object' ? item.raw : {};
            const existingMenuItem = raw.menuItem && typeof raw.menuItem === 'object' ? raw.menuItem : {};
            return {
                ...raw,
                id: item.menuItemId,
                menuItemId: item.menuItemId,
                name: item.name,
                price: item.unitAmountCents / 100,
                quantity: item.quantity,
                menuItem: {
                    ...existingMenuItem,
                    id: item.menuItemId,
                    name: item.name,
                    price: item.unitAmountCents / 100,
                },
            };
        });
    }
    toStripeLineItems(resolvedItems, currency) {
        return resolvedItems.map((item) => ({
            price_data: {
                currency,
                product_data: { name: item.name },
                unit_amount: item.unitAmountCents,
            },
            quantity: item.quantity,
        }));
    }
    async createCart(dto) {
        const order_id = `ord_${(0, crypto_1.randomUUID)()}`;
        const rawItems = this.normalizeRawItems(dto.items);
        const resolvedItems = await this.resolveMenuPricedItems(rawItems);
        if (!resolvedItems.length)
            throw new common_1.BadRequestException('items_required');
        const itemsTotalCents = this.totalFromResolvedItems(resolvedItems);
        const amount = itemsTotalCents / 100;
        if (!Number.isFinite(amount) || amount <= 0)
            throw new common_1.BadRequestException('amount_required');
        const items = resolvedItems.length ? this.toPersistedItems(resolvedItems) : rawItems;
        await this.prisma.paymentLink.upsert({
            where: { orderId: order_id },
            update: {
                amount,
                fulfillment: dto.fulfillment,
                channel: dto.channel || 'web',
                items,
                customerName: dto.customerName ?? null,
                customerPhone: dto.customerPhone ?? null,
                state: 'AWAITING_PAYMENT',
                updatedAt: new Date(),
            },
            create: {
                orderId: order_id,
                userId: dto.user_id ?? null,
                amount,
                state: 'AWAITING_PAYMENT',
                fulfillment: dto.fulfillment,
                channel: dto.channel || 'web',
                items,
                customerName: dto.customerName ?? null,
                customerPhone: dto.customerPhone ?? null,
            },
        });
        return { order_id, amount, state: 'AWAITING_PAYMENT' };
    }
    async createPaymentLink(dto) {
        const existing = await this.prisma.paymentLink.findUnique({ where: { orderId: dto.order_id } });
        if (!existing)
            throw new common_1.NotFoundException('order_not_found');
        const rawItems = this.normalizeRawItems(existing.items);
        const resolvedItems = await this.resolveMenuPricedItems(rawItems);
        if (!resolvedItems.length)
            throw new common_1.BadRequestException('items_required');
        const itemsTotalCents = this.totalFromResolvedItems(resolvedItems);
        const amount = itemsTotalCents / 100;
        if (!Number.isFinite(amount) || amount <= 0)
            throw new common_1.BadRequestException('amount_required');
        const items = resolvedItems.length ? this.toPersistedItems(resolvedItems) : rawItems;
        let payment_link = `https://pay.example/${dto.order_id}`;
        const makePaymentLink = await this.requestMakePaymentLink({
            user_id: dto.user_id,
            order_id: dto.order_id,
            amount,
        });
        if (makePaymentLink)
            payment_link = makePaymentLink;
        await this.prisma.paymentLink.update({
            where: { orderId: dto.order_id },
            data: { amount, items, state: 'AWAITING_PAYMENT', paymentLink: payment_link, updatedAt: new Date() },
        });
        return { payment_link, amount, state: 'AWAITING_PAYMENT' };
    }
    async getPayment(orderId) {
        const row = await this.prisma.paymentLink.findUnique({ where: { orderId } });
        if (!row)
            throw new common_1.NotFoundException('order_not_found');
        return row;
    }
    async phonePaymentLink(dto) {
        const order_id = `ord_${(0, crypto_1.randomUUID)()}`;
        const rawItems = this.normalizeRawItems(dto.items);
        const resolvedItems = await this.resolveMenuPricedItems(rawItems);
        if (!resolvedItems.length)
            throw new common_1.BadRequestException('items_required');
        const itemsTotalCents = this.totalFromResolvedItems(resolvedItems);
        const amount = itemsTotalCents / 100;
        if (!Number.isFinite(amount) || amount <= 0)
            throw new common_1.BadRequestException('amount_required');
        const items = resolvedItems.length ? this.toPersistedItems(resolvedItems) : rawItems;
        await this.prisma.paymentLink.upsert({
            where: { orderId: order_id },
            update: {
                amount,
                fulfillment: dto.fulfillment || 'pickup',
                channel: 'phone',
                items,
                customerName: dto.customerName ?? null,
                customerPhone: dto.customerPhone ?? null,
                state: 'AWAITING_PAYMENT',
                updatedAt: new Date(),
            },
            create: {
                orderId: order_id,
                amount,
                state: 'AWAITING_PAYMENT',
                fulfillment: dto.fulfillment || 'pickup',
                channel: 'phone',
                items,
                customerName: dto.customerName ?? null,
                customerPhone: dto.customerPhone ?? null,
            },
        });
        let payment_link = `https://pay.example/${order_id}`;
        const makePaymentLink = await this.requestMakePaymentLink({ order_id, amount });
        if (makePaymentLink)
            payment_link = makePaymentLink;
        await this.prisma.paymentLink.update({
            where: { orderId: order_id },
            data: { paymentLink: payment_link, updatedAt: new Date() },
        });
        return { order_id, payment_link, amount, state: 'AWAITING_PAYMENT' };
    }
    async createCheckoutSession(dto) {
        const payment = await this.prisma.paymentLink.findUnique({ where: { orderId: dto.order_id } });
        if (!payment)
            throw new common_1.NotFoundException('order_not_found');
        const rawItems = this.normalizeRawItems(payment.items);
        const resolvedItems = await this.resolveMenuPricedItems(rawItems);
        if (!resolvedItems.length)
            throw new common_1.BadRequestException('items_required');
        const items = resolvedItems.length ? this.toPersistedItems(resolvedItems) : rawItems;
        let currency = 'usd';
        let lineItems = [];
        if (resolvedItems.length)
            lineItems = this.toStripeLineItems(resolvedItems, currency);
        if (payment.fulfillment === 'delivery') {
            const quote = await this.prisma.deliveryQuote.findUnique({ where: { orderId: dto.order_id } });
            if (!quote)
                throw new common_1.BadRequestException('delivery_quote_required');
            if (dto.quote_id && dto.quote_id !== quote.quoteId)
                throw new common_1.BadRequestException('quote_mismatch');
            if (quote.expiresAt && quote.expiresAt.getTime() < Date.now())
                throw new common_1.BadRequestException('quote_expired');
            currency = quote.currency ? quote.currency.toLowerCase() : currency;
            lineItems = lineItems.map((li) => ({
                ...li,
                price_data: li.price_data ? { ...li.price_data, currency } : li.price_data,
            }));
            lineItems.push({
                price_data: {
                    currency,
                    product_data: { name: 'Delivery Fee' },
                    unit_amount: Math.max(0, quote.feeCents || 0),
                },
                quantity: 1,
            });
        }
        const totalCents = lineItems.reduce((sum, li) => sum + (li.price_data?.unit_amount || 0) * (li.quantity || 1), 0);
        const amount = totalCents / 100;
        if (!Number.isFinite(amount) || amount <= 0)
            throw new common_1.BadRequestException('amount_required');
        const customerUrl = this.config.get('CUSTOMER_URL') || this.config.get('FRONTEND_URL') || 'http://localhost:5173';
        const successUrl = `${customerUrl}/success?order_id=${dto.order_id}`;
        const cancelUrl = `${customerUrl}/cancel?order_id=${dto.order_id}`;
        const session = await this.stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: lineItems,
            success_url: successUrl,
            cancel_url: cancelUrl,
            client_reference_id: dto.order_id,
            payment_intent_data: {
                metadata: {
                    order_id: dto.order_id,
                    channel: payment.channel || 'web',
                    fulfillment: payment.fulfillment || 'pickup',
                    customer_name: payment.customerName || '',
                    customer_phone: payment.customerPhone || '',
                    quote_id: dto.quote_id || '',
                },
            },
        });
        await this.prisma.paymentLink.update({
            where: { orderId: dto.order_id },
            data: { amount, items, paymentLink: session.url || null, state: 'AWAITING_PAYMENT', updatedAt: new Date() },
        });
        return { order_id: dto.order_id, session_id: session.id, payment_link: session.url, amount, state: 'AWAITING_PAYMENT' };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, config_1.ConfigService])
], PaymentsService);
