import test from 'node:test';
import assert from 'node:assert/strict';
import { OrderTrackingController } from '../src/modules/legacy-orders/order-tracking.controller';

test('order tracking returns safe payload with timeline', async () => {
  const controller = new OrderTrackingController({
    order: {
      findFirst: async () => ({
        id: 'ord_1',
        status: 'in_prep',
        arrivalStatus: 'waiting',
        fulfillment: 'pickup',
        prepEstimateMinutes: 20,
        paidAt: new Date('2026-02-20T00:00:00.000Z'),
      }),
    },
    auditEntry: {
      findMany: async () => [
        { ts: new Date('2026-02-20T00:00:00.000Z'), actor: 'system', action: 'paid' },
        { ts: new Date('2026-02-20T00:05:00.000Z'), actor: 'kitchen', action: 'in_prep' },
      ],
    },
  } as any);

  const payload = await controller.track({ id: 'tenant_a', slug: 'a', name: 'A', status: 'active' }, 'ord_1');

  assert.equal(payload.orderId, 'ord_1');
  assert.equal(payload.status, 'in_prep');
  assert.equal(payload.timeline.length, 2);
});
