import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { streamHub } from '../../common/stream/stream-hub';
import { randomInt, randomUUID } from 'crypto';
import type { Order, OrderItem, Status } from './kitchen.types';

@Injectable()
export class KitchenService {
  constructor(private readonly prisma: PrismaService) {}

  async broadcastOrdersSnapshot() {
    try {
      const orders = await this.listOrders();
      streamHub.broadcast({ type: 'orders.snapshot', orders });
    } catch {
      // Snapshot broadcast should never break order workflows.
    }
  }

  generatePickupCode() {
    return String(randomInt(1000, 9999));
  }

  async listOrders(filter: Partial<Pick<Order, 'status' | 'channel' | 'fulfillment'>> = {}) {
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
    const byOrder = new Map<string, OrderItem[]>();
    items.forEach((i) => {
      if (!i.orderId) return;
      const list = byOrder.get(i.orderId) || [];
      list.push({
        name: i.name || '',
        qty: i.qty || 0,
        modifiers: (i.modifiers as any) || [],
        allergies: (i.allergies as any) || [],
        station: i.station || undefined,
        notes: i.notes || undefined,
      });
      byOrder.set(i.orderId, list);
    });

    return orders.map((o) => this.decorateTiming(this.toOrder(o, byOrder.get(o.id) || [])));
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) return null;
    const items = await this.prisma.orderItem.findMany({ where: { orderId: id } });
    return this.toOrder(order, items.map((i) => ({
      name: i.name || '',
      qty: i.qty || 0,
      modifiers: (i.modifiers as any) || [],
      allergies: (i.allergies as any) || [],
      station: i.station || undefined,
      notes: i.notes || undefined,
    })));
  }

  async updateStatus(id: string, requested: Status) {
    const order = await this.getOrder(id);
    if (!order) throw new NotFoundException('not_found');

    const target = this.computeNextStatus(order.status, requested, order.fulfillment, order.arrival_status);
    if (!target) throw new NotFoundException('conflict');

    if (
      target === 'served' &&
      order.fulfillment === 'pickup' &&
      order.channel !== 'tablet' &&
      order.arrival_status !== 'arrived'
    ) {
      throw new NotFoundException('conflict');
    }

    const ts = new Date().toISOString();
    const data: any = { status: target };
    if (target === 'in_prep') data.startedAt = new Date(ts);
    if (target === 'ready_waiting_arrival' || target === 'ready_for_handoff') data.readyAt = new Date(ts);
    if (target === 'served') data.servedAt = new Date(ts);
    if (target === 'delivered') data.deliveredAt = new Date(ts);

    await this.prisma.order.update({ where: { id }, data });
    await this.appendAudit(id, 'kitchen', target);

    const updated = await this.getOrder(id);
    if (updated) {
      streamHub.broadcast({ type: 'order.updated', order: updated });
      void this.broadcastOrdersSnapshot();
    }
    return updated;
  }

  async updateArrival(id: string) {
    const order = await this.getOrder(id);
    if (!order) throw new NotFoundException('not_found');
    if (order.arrival_status !== 'waiting') throw new NotFoundException('conflict');

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
      streamHub.broadcast({ type: 'order.arrival', order_id: updated.id, arrival_status: 'arrived' });
      streamHub.broadcast({ type: 'order.updated', order: updated });
      void this.broadcastOrdersSnapshot();
    }
    return updated;
  }

  async updateDelivery(orderId: string, event: string, driver_status?: any) {
    const order = await this.getOrder(orderId);
    if (!order) throw new NotFoundException('not_found');

    if (event === 'picked_up') {
      await this.prisma.order.update({ where: { id: orderId }, data: { status: 'out_for_delivery' } });
    } else if (event === 'delivered') {
      await this.prisma.order.update({ where: { id: orderId }, data: { status: 'delivered', deliveredAt: new Date() } });
    } else if (event === 'canceled') {
      await this.prisma.order.update({ where: { id: orderId }, data: { status: 'canceled' } });
    }
    await this.appendAudit(orderId, 'delivery', event);
    streamHub.broadcast({ type: 'order.delivery_update', order_id: orderId, driver_status });

    const updated = await this.getOrder(orderId);
    if (updated) {
      streamHub.broadcast({ type: 'order.updated', order: updated });
      void this.broadcastOrdersSnapshot();
    }
    return updated;
  }

  async refire(id: string, items?: string[], reason?: string) {
    await this.appendAudit(id, 'kitchen', 'refire', { items, reason });
    streamHub.broadcast({ type: 'order.refire', order_id: id, items });
    return { ok: true };
  }

  async generatePickup(orderId: string) {
    const order = await this.getOrder(orderId);
    if (!order) throw new NotFoundException('not_found');
    if (order.fulfillment !== 'pickup') throw new NotFoundException('conflict');
    const code = this.generatePickupCode();
    await this.prisma.order.update({ where: { id: orderId }, data: { pickupCode: code } });
    await this.appendAudit(orderId, 'system', 'pickup_code_generated', { pickupCode: code });
    const updated = await this.getOrder(orderId);
    if (updated) {
      streamHub.broadcast({ type: 'order.updated', order: updated });
      void this.broadcastOrdersSnapshot();
    }
    return { pickup_code: code, order_id: orderId };
  }

  async manualCreate(body: any) {
    const now = new Date().toISOString();
    const id = this.normalizeOrderId(body.id);
    const channel = (body.channel || 'phone') as Order['channel'];
    const fulfillment = (body.fulfillment || 'pickup') as Order['fulfillment'];
    const items = Array.isArray(body.items) && body.items.length ? body.items : [{ name: 'Jambalaya', qty: 1, station: 'line' }];

    const pickupCode =
      fulfillment === 'pickup' && (channel === 'web' || channel === 'phone' || channel === 'ai')
        ? this.generatePickupCode()
        : undefined;

    const order: Order = {
      id,
      channel,
      fulfillment,
      source_label:
        channel === 'web'
          ? `Web ${fulfillment === 'pickup' ? 'Pickup' : 'Delivery'}`
          : channel === 'phone'
            ? `Phone ${fulfillment === 'pickup' ? 'Pickup' : 'Delivery'}`
            : channel === 'ai'
              ? `AI ${fulfillment === 'pickup' ? 'Pickup' : 'Delivery'}`
              : 'In-Store Tablet',
      status: 'queued',
      arrival_status:
        fulfillment === 'pickup'
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
    streamHub.broadcast({ type: 'order.created', order });
    void this.broadcastOrdersSnapshot();
    return { ok: true, order };
  }

  async editItems(id: string, items: OrderItem[], opts: { priority_flag?: boolean; prep_estimate_minutes?: number | null }) {
    const order = await this.getOrder(id);
    if (!order) throw new NotFoundException('not_found');
    if (['served', 'delivered'].includes(order.status)) throw new NotFoundException('conflict');

    await this.prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      if (items.length) {
        await tx.orderItem.createMany({
          data: items.map((item) => ({
            orderId: id,
            name: item.name,
            qty: item.qty,
            modifiers: item.modifiers ?? [],
            allergies: item.allergies ?? [],
            station: item.station ?? null,
            notes: item.notes ?? null,
          })),
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
    if (updated) {
      streamHub.broadcast({ type: 'order.updated', order: updated });
      void this.broadcastOrdersSnapshot();
    }
    return updated;
  }

  async demoSeed() {
    const now = new Date().toISOString();
    const demoOrders: Order[] = [
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

    demoOrders.forEach((o) => streamHub.broadcast({ type: 'order.created', order: o }));
    void this.broadcastOrdersSnapshot();
    return { ok: true, seeded: demoOrders.length };
  }

  async appendAudit(orderId: string, actor: string, action: string, details?: any) {
    await this.prisma.auditEntry.create({
      data: { orderId, ts: new Date(), actor, action, details: details ?? {} },
    });
  }

  async upsertOrderWithItems(order: Order) {
    await this.prisma.$transaction(async (tx) => {
      await this.upsertOrderWithItemsTx(tx, order);
    });
  }

  async upsertOrderWithItemsTx(tx: any, order: Order) {
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
    if (order.items.length) {
      await tx.orderItem.createMany({
        data: order.items.map((item) => ({
          orderId: order.id,
          name: item.name,
          qty: item.qty,
          modifiers: item.modifiers ?? [],
          allergies: item.allergies ?? [],
          station: item.station ?? null,
          notes: item.notes ?? null,
        })),
      });
    }

    const audits = order.audit || [];
    if (audits.length) {
      await tx.auditEntry.createMany({
        data: audits.map((audit) => ({
          orderId: order.id,
          ts: new Date(audit.ts),
          actor: audit.actor,
          action: audit.action,
          details: audit.details ?? {},
        })),
      });
    }
  }

  computeNextStatus(current: Status, requested: Status, fulfillment: Order['fulfillment'], arrival: Order['arrival_status']) {
    if (requested === 'ready_waiting_arrival') {
      if (fulfillment === 'delivery') return 'out_for_delivery';
      if (fulfillment === 'pickup') {
        if (arrival === 'arrived' || arrival === 'not_required' || current === 'ready_for_handoff') return 'ready_for_handoff';
        return 'ready_waiting_arrival';
      }
      return 'ready_for_handoff';
    }
    if (requested === 'ready_for_handoff') return 'ready_for_handoff';
    if (requested === 'delivered' && fulfillment !== 'delivery') return null;
    if (requested === 'served' && fulfillment === 'delivery') return null;

    const allowed: Record<Status, Status[]> = {
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
    if (!transitions.includes(requested)) return null;
    return requested;
  }

  decorateTiming(order: Order) {
    const elapsedSeconds =
      order.paid_at && !Number.isNaN(Date.parse(order.paid_at))
        ? Math.floor((Date.now() - new Date(order.paid_at).getTime()) / 1000)
        : undefined;
    if (elapsedSeconds !== undefined) order.elapsed_seconds = elapsedSeconds;
    if (order.prep_estimate_minutes !== undefined && elapsedSeconds !== undefined) {
      order.late_flag = elapsedSeconds > order.prep_estimate_minutes * 60;
    }
    return order;
  }

  normalizeOrderId(raw?: string) {
    if (!raw) return `ord_${randomUUID()}`;
    return raw.startsWith('ord_') ? raw : `ord_${raw}`;
  }

  toOrder(row: any, items: OrderItem[]): Order {
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
}
