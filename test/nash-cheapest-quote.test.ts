import test from 'node:test';
import assert from 'node:assert/strict';
import { NashService } from '../src/modules/delivery/nash.service';

function makeService() {
  return new NashService({ get: () => undefined } as any);
}

test('selectCheapestQuote auto-selects the lowest priced quote', () => {
  const service = makeService();
  const now = Date.now();
  const result = service.selectCheapestQuote({
    id: 'ord_100',
    quotes: [
      { id: 'q_high', totalPriceCents: 1425, currency: 'USD', expiresAt: new Date(now + 5 * 60_000).toISOString() },
      { id: 'q_low', totalPriceCents: 925, currency: 'USD', dropoffEta: '2026-03-03T20:00:00.000Z' },
      { id: 'q_mid', priceCents: 1000, currency: 'USD' },
    ],
  });

  assert.equal(result.quoteId, 'q_low');
  assert.equal(result.feeCents, 925);
  assert.equal(result.currency, 'USD');
  assert.equal(result.eta, '2026-03-03T20:00:00.000Z');
});

test('selectCheapestQuote ignores expired quotes and picks cheapest active quote', () => {
  const service = makeService();
  const now = Date.now();
  const result = service.selectCheapestQuote({
    quotes: [
      { id: 'q_expired', totalPriceCents: 100, expiresAt: new Date(now - 60_000).toISOString() },
      { id: 'q_active', totalPriceCents: 250, expiresAt: new Date(now + 60_000).toISOString() },
      { id: 'q_active_2', totalPriceCents: 300 },
    ],
  });

  assert.equal(result.quoteId, 'q_active');
  assert.equal(result.feeCents, 250);
});

test('selectCheapestQuote throws when all quotes are expired', () => {
  const service = makeService();
  const now = Date.now();
  assert.throws(
    () =>
      service.selectCheapestQuote({
        quotes: [
          { id: 'q1', totalPriceCents: 100, expiresAt: new Date(now - 120_000).toISOString() },
          { id: 'q2', totalPriceCents: 90, expireTime: new Date(now - 30_000).toISOString() },
        ],
      }),
    /only expired quotes/i,
  );
});

test('extractOrderId resolves top-level or nested order ids', () => {
  const service = makeService();
  assert.equal(service.extractOrderId({ id: 'ord_top' }), 'ord_top');
  assert.equal(service.extractOrderId({ order: { id: 'ord_nested' } }), 'ord_nested');
  assert.equal(service.extractOrderId({ data: { orderId: 'ord_data' } }), 'ord_data');
});
