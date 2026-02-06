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
exports.KitchenService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const stream_hub_1 = require("../../common/stream/stream-hub");
const crypto_1 = require("crypto");
let KitchenService = class KitchenService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    generatePickupCode() {
        return String((0, crypto_1.randomInt)(1000, 9999));
    }
    async listOrders(filter = {}) {
        const orders = await this.prisma.order.findMany({
            where: {
                status: filter.status,
                channel: filter.channel,
                fulfillment: filter.fulfillment,
            },
            orderBy: { createdAt: 'asc' },
        });
        const ids = orders.map((o) => o.id);
        const items = ids.length
            ? await this.prisma.orderItem.findMany({ where: { orderId: { in: ids } } })
            : [];
        const byOrder = new Map();
        items.forEach((i) => {
            if (!i.orderId)
                return;
            const list = byOrder.get(i.orderId) || [];
            list.push({
                name: i.name || '',
                qty: i.qty || 0,
                modifiers: i.modifiers || [],
                allergies: i.allergies || [],
                station: i.station || undefined,
                notes: i.notes || undefined,
            });
            byOrder.set(i.orderId, list);
        });
        return orders.map((o) => this.decorateTiming(this.toOrder(o, byOrder.get(o.id) || [])));
    }
    async getOrder(id) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order)
            return null;
        const items = await this.prisma.orderItem.findMany({ where: { orderId: id } });
        return this.toOrder(order, items.map((i) => ({
            name: i.name || '',
            qty: i.qty || 0,
            modifiers: i.modifiers || [],
            allergies: i.allergies || [],
            station: i.station || undefined,
            notes: i.notes || undefined,
        })));
    }
    async updateStatus(id, requested) {
        const order = await this.getOrder(id);
        if (!order)
            throw new common_1.NotFoundException('not_found');
        const target = this.computeNextStatus(order.status, requested, order.fulfillment, order.arrival_status);
        if (!target)
            throw new common_1.NotFoundException('conflict');
        if (target === 'served' &&
            order.fulfillment === 'pickup' &&
            order.channel !== 'tablet' &&
            order.arrival_status !== 'arrived') {
            throw new common_1.NotFoundException('conflict');
        }
        const ts = new Date().toISOString();
        const data = { status: target };
        if (target === 'in_prep')
            data.startedAt = new Date(ts);
        if (target === 'ready_waiting_arrival' || target === 'ready_for_handoff')
            data.readyAt = new Date(ts);
        if (target === 'served')
            data.servedAt = new Date(ts);
        if (target === 'delivered')
            data.deliveredAt = new Date(ts);
        await this.prisma.order.update({ where: { id }, data });
        await this.appendAudit(id, 'kitchen', target);
        const updated = await this.getOrder(id);
        if (updated)
            stream_hub_1.streamHub.broadcast({ type: 'order.updated', order: updated });
        return updated;
    }
    async updateArrival(id) {
        const order = await this.getOrder(id);
        if (!order)
            throw new common_1.NotFoundException('not_found');
        if (order.arrival_status !== 'waiting')
            throw new common_1.NotFoundException('conflict');
        await this.prisma.order.update({
            where: { id },
            data: {
                arrivalStatus: 'arrived',
                status: order.status === 'ready_waiting_arrival' ? 'ready_for_handoff' : order.status,
            },
        });
        await this.appendAudit(id, 'customer', 'arrival');
        const updated = await this.getOrder(id);
        if (updated) {
            stream_hub_1.streamHub.broadcast({ type: 'order.arrival', order_id: updated.id, arrival_status: 'arrived' });
            stream_hub_1.streamHub.broadcast({ type: 'order.updated', order: updated });
        }
        return updated;
    }
    async updateDelivery(orderId, event, driver_status) {
        const order = await this.getOrder(orderId);
        if (!order)
            throw new common_1.NotFoundException('not_found');
        if (event === 'picked_up') {
            await this.prisma.order.update({ where: { id: orderId }, data: { status: 'out_for_delivery' } });
        }
        else if (event === 'delivered') {
            await this.prisma.order.update({ where: { id: orderId }, data: { status: 'delivered', deliveredAt: new Date() } });
        }
        else if (event === 'canceled') {
            await this.prisma.order.update({ where: { id: orderId }, data: { status: 'canceled' } });
        }
        await this.appendAudit(orderId, 'delivery', event);
        stream_hub_1.streamHub.broadcast({ type: 'order.delivery_update', order_id: orderId, driver_status });
        return this.getOrder(orderId);
    }
    async refire(id, items, reason) {
        await this.appendAudit(id, 'kitchen', 'refire', { items, reason });
        stream_hub_1.streamHub.broadcast({ type: 'order.refire', order_id: id, items });
        return { ok: true };
    }
    async generatePickup(orderId) {
        const order = await this.getOrder(orderId);
        if (!order)
            throw new common_1.NotFoundException('not_found');
        if (order.fulfillment !== 'pickup')
            throw new common_1.NotFoundException('conflict');
        const code = this.generatePickupCode();
        await this.prisma.order.update({ where: { id: orderId }, data: { pickupCode: code } });
        await this.appendAudit(orderId, 'system', 'pickup_code_generated', { pickupCode: code });
        const updated = await this.getOrder(orderId);
        if (updated)
            stream_hub_1.streamHub.broadcast({ type: 'order.updated', order: updated });
        return { pickup_code: code, order_id: orderId };
    }
    async manualCreate(body) {
        const now = new Date().toISOString();
        const id = this.normalizeOrderId(body.id);
        const channel = (body.channel || 'phone');
        const fulfillment = (body.fulfillment || 'pickup');
        const items = Array.isArray(body.items) && body.items.length ? body.items : [{ name: 'Jambalaya', qty: 1, station: 'line' }];
        const pickupCode = fulfillment === 'pickup' && (channel === 'web' || channel === 'phone') ? this.generatePickupCode() : undefined;
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
            audit: [{ ts: now, actor: 'system', action: 'paid' }],
            priority_flag: !!body.priority_flag,
        };
        await this.upsertOrderWithItems(order);
        stream_hub_1.streamHub.broadcast({ type: 'order.created', order });
        return { ok: true, order };
    }
    async editItems(id, items, opts) {
        const order = await this.getOrder(id);
        if (!order)
            throw new common_1.NotFoundException('not_found');
        if (['served', 'delivered'].includes(order.status))
            throw new common_1.NotFoundException('conflict');
        await this.prisma.$transaction(async (tx) => {
            await tx.orderItem.deleteMany({ where: { orderId: id } });
            for (const item of items) {
                await tx.orderItem.create({
                    data: {
                        orderId: id,
                        name: item.name,
                        qty: item.qty,
                        modifiers: item.modifiers ?? [],
                        allergies: item.allergies ?? [],
                        station: item.station ?? null,
                        notes: item.notes ?? null,
                    },
                });
            }
            if (opts.priority_flag !== undefined || opts.prep_estimate_minutes !== undefined) {
                await tx.order.update({
                    where: { id },
                    data: {
                        priorityFlag: opts.priority_flag ?? undefined,
                        prepEstimateMinutes: opts.prep_estimate_minutes ?? undefined,
                    },
                });
            }
            await tx.auditEntry.create({
                data: {
                    orderId: id,
                    ts: new Date(),
                    actor: 'kitchen',
                    action: 'edit_items',
                    details: { items: items.map(i => ({ ...i })), ...opts },
                },
            });
        });
        const updated = await this.getOrder(id);
        if (updated)
            stream_hub_1.streamHub.broadcast({ type: 'order.updated', order: updated });
        return updated;
    }
    async demoSeed() {
        const now = new Date().toISOString();
        const demoOrders = [
            {
                id: 'ord_demo_1',
                channel: 'web',
                fulfillment: 'pickup',
                source_label: 'Web Pickup',
                status: 'queued',
                arrival_status: 'waiting',
                pickup_code: this.generatePickupCode(),
                paid_at: now,
                created_at: now,
                prep_estimate_minutes: 10,
                items: [
                    { name: "Shrimp Po' Boy", qty: 2, modifiers: ['extra remoulade'], allergies: ['shellfish'], station: 'grill' },
                    { name: 'Gumbo', qty: 1, modifiers: ['spicy'], station: 'sauce' },
                    { name: 'Crawfish Étouffée', qty: 1, modifiers: ['add rice'], station: 'line' },
                ],
                audit: [{ ts: now, actor: 'system', action: 'paid' }],
                priority_flag: false,
            },
            {
                id: 'ord_demo_2',
                channel: 'tablet',
                fulfillment: 'pickup',
                source_label: 'In-Store Tablet',
                status: 'in_prep',
                arrival_status: 'not_required',
                paid_at: now,
                created_at: now,
                started_at: now,
                prep_estimate_minutes: 8,
                items: [
                    { name: 'Jambalaya', qty: 1, modifiers: ['no shellfish'], station: 'line' },
                    { name: 'Shrimp & Grits', qty: 1, modifiers: ['crispy bacon'], station: 'grill' },
                ],
                audit: [{ ts: now, actor: 'system', action: 'paid' }],
                priority_flag: true,
            },
            {
                id: 'ord_demo_3',
                channel: 'phone',
                fulfillment: 'delivery',
                source_label: 'Phone Delivery',
                status: 'out_for_delivery',
                arrival_status: 'not_required',
                paid_at: now,
                created_at: now,
                ready_at: now,
                prep_estimate_minutes: 12,
                items: [
                    { name: 'Beignets', qty: 3, modifiers: ['powdered sugar'], station: 'pastry' },
                    { name: 'Bananas Foster Bread Pudding', qty: 1, station: 'pastry' },
                ],
                audit: [{ ts: now, actor: 'system', action: 'paid' }],
                priority_flag: false,
            },
        ];
        await this.prisma.$transaction(async (tx) => {
            for (const order of demoOrders) {
                await this.upsertOrderWithItemsTx(tx, order);
            }
        });
        demoOrders.forEach((o) => stream_hub_1.streamHub.broadcast({ type: 'order.created', order: o }));
        return { ok: true, seeded: demoOrders.length };
    }
    async appendAudit(orderId, actor, action, details) {
        await this.prisma.auditEntry.create({
            data: { orderId, ts: new Date(), actor, action, details: details ?? {} },
        });
    }
    async upsertOrderWithItems(order) {
        await this.prisma.$transaction(async (tx) => {
            await this.upsertOrderWithItemsTx(tx, order);
        });
    }
    async upsertOrderWithItemsTx(tx, order) {
        await tx.order.upsert({
            where: { id: order.id },
            update: {
                channel: order.channel,
                fulfillment: order.fulfillment,
                sourceLabel: order.source_label,
                status: order.status,
                arrivalStatus: order.arrival_status,
                pickupCode: order.pickup_code ?? null,
                paidAt: new Date(order.paid_at),
                createdAt: new Date(order.created_at),
                startedAt: order.started_at ? new Date(order.started_at) : null,
                readyAt: order.ready_at ? new Date(order.ready_at) : null,
                servedAt: order.served_at ? new Date(order.served_at) : null,
                deliveredAt: order.delivered_at ? new Date(order.delivered_at) : null,
                prepEstimateMinutes: order.prep_estimate_minutes ?? null,
                priorityFlag: order.priority_flag ?? false,
            },
            create: {
                id: order.id,
                channel: order.channel,
                fulfillment: order.fulfillment,
                sourceLabel: order.source_label,
                status: order.status,
                arrivalStatus: order.arrival_status,
                pickupCode: order.pickup_code ?? null,
                paidAt: new Date(order.paid_at),
                createdAt: new Date(order.created_at),
                startedAt: order.started_at ? new Date(order.started_at) : null,
                readyAt: order.ready_at ? new Date(order.ready_at) : null,
                servedAt: order.served_at ? new Date(order.served_at) : null,
                deliveredAt: order.delivered_at ? new Date(order.delivered_at) : null,
                prepEstimateMinutes: order.prep_estimate_minutes ?? null,
                priorityFlag: order.priority_flag ?? false,
            },
        });
        await tx.orderItem.deleteMany({ where: { orderId: order.id } });
        for (const item of order.items) {
            await tx.orderItem.create({
                data: {
                    orderId: order.id,
                    name: item.name,
                    qty: item.qty,
                    modifiers: item.modifiers ?? [],
                    allergies: item.allergies ?? [],
                    station: item.station ?? null,
                    notes: item.notes ?? null,
                },
            });
        }
        for (const audit of order.audit || []) {
            await tx.auditEntry.create({
                data: {
                    orderId: order.id,
                    ts: new Date(audit.ts),
                    actor: audit.actor,
                    action: audit.action,
                    details: audit.details ?? {},
                },
            });
        }
    }
    computeNextStatus(current, requested, fulfillment, arrival) {
        if (requested === 'ready_waiting_arrival') {
            if (fulfillment === 'delivery')
                return 'out_for_delivery';
            if (fulfillment === 'pickup') {
                if (arrival === 'arrived' || arrival === 'not_required' || current === 'ready_for_handoff')
                    return 'ready_for_handoff';
                return 'ready_waiting_arrival';
            }
            return 'ready_for_handoff';
        }
        if (requested === 'ready_for_handoff')
            return 'ready_for_handoff';
        if (requested === 'delivered' && fulfillment !== 'delivery')
            return null;
        if (requested === 'served' && fulfillment === 'delivery')
            return null;
        const allowed = {
            queued: ['in_prep', 'ready_waiting_arrival', 'out_for_delivery', 'canceled'],
            in_prep: ['ready_waiting_arrival', 'on_hold', 'out_for_delivery', 'canceled'],
            ready_waiting_arrival: ['ready_for_handoff', 'served', 'canceled'],
            ready_for_handoff: ['served', 'canceled'],
            on_hold: ['in_prep', 'canceled'],
            out_for_delivery: ['delivered'],
            delivered: [],
            served: [],
            canceled: [],
            failed_payment: [],
        };
        const transitions = allowed[current] || [];
        if (!transitions.includes(requested))
            return null;
        return requested;
    }
    decorateTiming(order) {
        const elapsedSeconds = order.paid_at && !Number.isNaN(Date.parse(order.paid_at))
            ? Math.floor((Date.now() - new Date(order.paid_at).getTime()) / 1000)
            : undefined;
        if (elapsedSeconds !== undefined)
            order.elapsed_seconds = elapsedSeconds;
        if (order.prep_estimate_minutes !== undefined && elapsedSeconds !== undefined) {
            order.late_flag = elapsedSeconds > order.prep_estimate_minutes * 60;
        }
        return order;
    }
    normalizeOrderId(raw) {
        if (!raw)
            return `ord_${(0, crypto_1.randomUUID)()}`;
        return raw.startsWith('ord_') ? raw : `ord_${raw}`;
    }
    toOrder(row, items) {
        return {
            id: row.id,
            channel: row.channel,
            fulfillment: row.fulfillment,
            source_label: row.sourceLabel || row.channel,
            status: row.status,
            arrival_status: row.arrivalStatus,
            pickup_code: row.pickupCode || undefined,
            paid_at: row.paidAt.toISOString(),
            created_at: row.createdAt.toISOString(),
            started_at: row.startedAt ? row.startedAt.toISOString() : undefined,
            ready_at: row.readyAt ? row.readyAt.toISOString() : undefined,
            served_at: row.servedAt ? row.servedAt.toISOString() : undefined,
            delivered_at: row.deliveredAt ? row.deliveredAt.toISOString() : undefined,
            prep_estimate_minutes: row.prepEstimateMinutes ?? undefined,
            priority_flag: row.priorityFlag ?? false,
            items,
            audit: [],
        };
    }
};
exports.KitchenService = KitchenService;
exports.KitchenService = KitchenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KitchenService);
