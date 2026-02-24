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
    platformFeeBps() {
        return Number(this.config.get('PLATFORM_FEE_BPS') || 500);
    }
    checkoutTaxBps() {
        return Number(this.config.get('CHECKOUT_TAX_BPS') || 0);
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
    async resolveMenuPricedItems(tenantId, items) {
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
            where: {
                tenantId,
                id: { in: Array.from(new Set(parsed.map((item) => item.menuItemId))) },
            },
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
    async paymentSummary(tenantId, filters) {
        const createdAt = filters?.from || filters?.to
            ? {
                gte: filters?.from,
                lte: filters?.to,
            }
            : undefined;
        const rows = await this.prisma.paymentLink.findMany({
            where: { tenantId, createdAt },
            select: {
                orderId: true,
                state: true,
                amount: true,
                subtotalCents: true,
                taxCents: true,
                deliveryFeeCents: true,
                applicationFeeCents: true,
                connectedAccountId: true,
                createdAt: true,
            },
        });
        const totals = rows.reduce((acc, row) => {
            const amountCents = Math.round(Number(row.amount || 0) * 100);
            acc.grossCents += amountCents;
            acc.subtotalCents += Math.max(0, row.subtotalCents || 0);
            acc.taxCents += Math.max(0, row.taxCents || 0);
            acc.deliveryFeeCents += Math.max(0, row.deliveryFeeCents || 0);
            acc.applicationFeeCents += Math.max(0, row.applicationFeeCents || 0);
            const state = (row.state || '').toUpperCase();
            if (state === 'PAID')
                acc.paidCount += 1;
            if (state === 'AWAITING_PAYMENT')
                acc.awaitingCount += 1;
            if (state === 'FAILED')
                acc.failedCount += 1;
            if (row.connectedAccountId)
                acc.connectedAccountOrders += 1;
            return acc;
        }, {
            grossCents: 0,
            subtotalCents: 0,
            taxCents: 0,
            deliveryFeeCents: 0,
            applicationFeeCents: 0,
            paidCount: 0,
            awaitingCount: 0,
            failedCount: 0,
            connectedAccountOrders: 0,
        });
        const stripeAccount = await this.prisma.tenantStripeAccount.findUnique({
            where: { tenantId },
            select: {
                connectAccountId: true,
                onboardingComplete: true,
                chargesEnabled: true,
                payoutsEnabled: true,
            },
        });
        return {
            tenantId,
            period: {
                from: filters?.from?.toISOString() || null,
                to: filters?.to?.toISOString() || null,
            },
            counts: {
                total: rows.length,
                paid: totals.paidCount,
                awaitingPayment: totals.awaitingCount,
                failed: totals.failedCount,
            },
            amounts: {
                grossCents: totals.grossCents,
                subtotalCents: totals.subtotalCents,
                taxCents: totals.taxCents,
                deliveryFeeCents: totals.deliveryFeeCents,
                applicationFeeCents: totals.applicationFeeCents,
                estimatedNetToRestaurantCents: totals.grossCents - totals.applicationFeeCents,
            },
            stripeConnect: {
                configured: Boolean(stripeAccount?.connectAccountId),
                onboardingComplete: Boolean(stripeAccount?.onboardingComplete),
                chargesEnabled: Boolean(stripeAccount?.chargesEnabled),
                payoutsEnabled: Boolean(stripeAccount?.payoutsEnabled),
            },
        };
    }
    async paymentTransactions(tenantId, filters) {
        const page = Math.max(1, Number(filters?.page || 1));
        const limit = Math.min(100, Math.max(1, Number(filters?.limit || 20)));
        const createdAt = filters?.from || filters?.to
            ? {
                gte: filters?.from,
                lte: filters?.to,
            }
            : undefined;
        const state = filters?.state ? filters.state : undefined;
        const [total, rows] = await this.prisma.$transaction([
            this.prisma.paymentLink.count({ where: { tenantId, createdAt, state } }),
            this.prisma.paymentLink.findMany({
                where: { tenantId, createdAt, state },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    orderId: true,
                    state: true,
                    amount: true,
                    subtotalCents: true,
                    taxCents: true,
                    deliveryFeeCents: true,
                    applicationFeeCents: true,
                    connectedAccountId: true,
                    paymentLink: true,
                    fulfillment: true,
                    channel: true,
                    customerName: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
        ]);
        return {
            tenantId,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
            items: rows.map((row) => ({
                orderId: row.orderId,
                state: row.state,
                amountCents: Math.round(Number(row.amount || 0) * 100),
                subtotalCents: row.subtotalCents || 0,
                taxCents: row.taxCents || 0,
                deliveryFeeCents: row.deliveryFeeCents || 0,
                applicationFeeCents: row.applicationFeeCents || 0,
                estimatedNetToRestaurantCents: Math.round(Number(row.amount || 0) * 100) - (row.applicationFeeCents || 0),
                connectedAccountId: row.connectedAccountId,
                paymentLink: row.paymentLink,
                fulfillment: row.fulfillment,
                channel: row.channel,
                customerName: row.customerName,
                createdAt: row.createdAt?.toISOString() || null,
                updatedAt: row.updatedAt?.toISOString() || null,
            })),
        };
    }
    async createCart(tenantId, dto) {
        const order_id = `ord_${(0, crypto_1.randomUUID)()}`;
        const rawItems = this.normalizeRawItems(dto.items);
        const resolvedItems = await this.resolveMenuPricedItems(tenantId, rawItems);
        if (!resolvedItems.length)
            throw new common_1.BadRequestException('items_required');
        const subtotalCents = this.totalFromResolvedItems(resolvedItems);
        const amount = subtotalCents / 100;
        if (!Number.isFinite(amount) || amount <= 0)
            throw new common_1.BadRequestException('amount_required');
        const items = resolvedItems.length ? this.toPersistedItems(resolvedItems) : rawItems;
        await this.prisma.paymentLink.upsert({
            where: { orderId: order_id },
            update: {
                tenantId,
                amount,
                subtotalCents,
                taxCents: 0,
                deliveryFeeCents: 0,
                applicationFeeCents: 0,
                connectedAccountId: null,
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
                tenantId,
                userId: dto.user_id ?? null,
                amount,
                subtotalCents,
                taxCents: 0,
                deliveryFeeCents: 0,
                applicationFeeCents: 0,
                connectedAccountId: null,
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
    async createPaymentLink(tenantId, dto) {
        const existing = await this.prisma.paymentLink.findFirst({ where: { orderId: dto.order_id, tenantId } });
        if (!existing)
            throw new common_1.NotFoundException('order_not_found');
        const rawItems = this.normalizeRawItems(existing.items);
        const resolvedItems = await this.resolveMenuPricedItems(tenantId, rawItems);
        if (!resolvedItems.length)
            throw new common_1.BadRequestException('items_required');
        const subtotalCents = this.totalFromResolvedItems(resolvedItems);
        const amount = subtotalCents / 100;
        if (!Number.isFinite(amount) || amount <= 0)
            throw new common_1.BadRequestException('amount_required');
        const items = resolvedItems.length ? this.toPersistedItems(resolvedItems) : rawItems;
        let payment_link = `https://pay.example/${dto.order_id}`;
        const makePaymentLink = await this.requestMakePaymentLink({
            user_id: dto.user_id,
            tenant_id: tenantId,
            order_id: dto.order_id,
            amount,
        });
        if (makePaymentLink)
            payment_link = makePaymentLink;
        await this.prisma.paymentLink.updateMany({
            where: { orderId: dto.order_id, tenantId },
            data: {
                amount,
                subtotalCents,
                items,
                state: 'AWAITING_PAYMENT',
                paymentLink: payment_link,
                updatedAt: new Date(),
            },
        });
        return { payment_link, amount, state: 'AWAITING_PAYMENT' };
    }
    async getPayment(tenantId, orderId) {
        const row = await this.prisma.paymentLink.findFirst({ where: { orderId, tenantId } });
        if (!row)
            throw new common_1.NotFoundException('order_not_found');
        return row;
    }
    async phonePaymentLink(tenantId, dto) {
        const order_id = `ord_${(0, crypto_1.randomUUID)()}`;
        const rawItems = this.normalizeRawItems(dto.items);
        const resolvedItems = await this.resolveMenuPricedItems(tenantId, rawItems);
        if (!resolvedItems.length)
            throw new common_1.BadRequestException('items_required');
        const subtotalCents = this.totalFromResolvedItems(resolvedItems);
        const amount = subtotalCents / 100;
        if (!Number.isFinite(amount) || amount <= 0)
            throw new common_1.BadRequestException('amount_required');
        const items = resolvedItems.length ? this.toPersistedItems(resolvedItems) : rawItems;
        await this.prisma.paymentLink.upsert({
            where: { orderId: order_id },
            update: {
                tenantId,
                amount,
                subtotalCents,
                taxCents: 0,
                deliveryFeeCents: 0,
                applicationFeeCents: 0,
                connectedAccountId: null,
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
                tenantId,
                amount,
                subtotalCents,
                taxCents: 0,
                deliveryFeeCents: 0,
                applicationFeeCents: 0,
                connectedAccountId: null,
                state: 'AWAITING_PAYMENT',
                fulfillment: dto.fulfillment || 'pickup',
                channel: 'phone',
                items,
                customerName: dto.customerName ?? null,
                customerPhone: dto.customerPhone ?? null,
            },
        });
        let payment_link = `https://pay.example/${order_id}`;
        const makePaymentLink = await this.requestMakePaymentLink({ tenant_id: tenantId, order_id, amount });
        if (makePaymentLink)
            payment_link = makePaymentLink;
        await this.prisma.paymentLink.updateMany({
            where: { orderId: order_id, tenantId },
            data: { paymentLink: payment_link, updatedAt: new Date() },
        });
        return { order_id, payment_link, amount, state: 'AWAITING_PAYMENT' };
    }
    async createCheckoutSession(tenantId, dto) {
        const payment = await this.prisma.paymentLink.findFirst({ where: { orderId: dto.order_id, tenantId } });
        if (!payment)
            throw new common_1.NotFoundException('order_not_found');
        const stripeAccount = await this.prisma.tenantStripeAccount.findUnique({
            where: { tenantId },
            select: {
                connectAccountId: true,
                chargesEnabled: true,
                onboardingComplete: true,
            },
        });
        if (!stripeAccount?.connectAccountId)
            throw new common_1.ForbiddenException('stripe_connect_not_configured');
        if (!stripeAccount.onboardingComplete || !stripeAccount.chargesEnabled) {
            throw new common_1.ForbiddenException('stripe_connect_not_ready');
        }
        const rawItems = this.normalizeRawItems(payment.items);
        const resolvedItems = await this.resolveMenuPricedItems(tenantId, rawItems);
        if (!resolvedItems.length)
            throw new common_1.BadRequestException('items_required');
        const items = resolvedItems.length ? this.toPersistedItems(resolvedItems) : rawItems;
        const subtotalCents = this.totalFromResolvedItems(resolvedItems);
        let currency = 'usd';
        let lineItems = [];
        if (resolvedItems.length)
            lineItems = this.toStripeLineItems(resolvedItems, currency);
        let deliveryFeeCents = 0;
        if (payment.fulfillment === 'delivery') {
            const quote = await this.prisma.deliveryQuote.findFirst({ where: { orderId: dto.order_id, tenantId } });
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
            deliveryFeeCents = Math.max(0, quote.feeCents || 0);
            lineItems.push({
                price_data: {
                    currency,
                    product_data: { name: 'Delivery Fee' },
                    unit_amount: deliveryFeeCents,
                },
                quantity: 1,
            });
        }
        const taxCents = Math.max(0, Math.round((subtotalCents * this.checkoutTaxBps()) / 10000));
        if (taxCents > 0) {
            lineItems.push({
                price_data: {
                    currency,
                    product_data: { name: 'Tax' },
                    unit_amount: taxCents,
                },
                quantity: 1,
            });
        }
        const platformFeeCents = Math.max(0, Math.round((subtotalCents * this.platformFeeBps()) / 10000));
        const applicationFeeCents = platformFeeCents + (payment.fulfillment === 'delivery' ? deliveryFeeCents : 0);
        const totalCents = subtotalCents + taxCents + deliveryFeeCents;
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
                transfer_data: {
                    destination: stripeAccount.connectAccountId,
                },
                application_fee_amount: applicationFeeCents,
                metadata: {
                    order_id: dto.order_id,
                    tenant_id: tenantId,
                    channel: payment.channel || 'web',
                    fulfillment: payment.fulfillment || 'pickup',
                    customer_name: payment.customerName || '',
                    customer_phone: payment.customerPhone || '',
                    quote_id: dto.quote_id || '',
                    connected_account_id: stripeAccount.connectAccountId,
                },
            },
        });
        await this.prisma.paymentLink.updateMany({
            where: { orderId: dto.order_id, tenantId },
            data: {
                amount,
                subtotalCents,
                taxCents,
                deliveryFeeCents,
                applicationFeeCents,
                connectedAccountId: stripeAccount.connectAccountId,
                items,
                paymentLink: session.url || null,
                state: 'AWAITING_PAYMENT',
                updatedAt: new Date(),
            },
        });
        return {
            order_id: dto.order_id,
            session_id: session.id,
            payment_link: session.url,
            amount,
            subtotal_cents: subtotalCents,
            tax_cents: taxCents,
            delivery_fee_cents: deliveryFeeCents,
            application_fee_cents: applicationFeeCents,
            connected_account_id: stripeAccount.connectAccountId,
            state: 'AWAITING_PAYMENT',
        };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, config_1.ConfigService])
], PaymentsService);
