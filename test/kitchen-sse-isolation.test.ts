import test from 'node:test';
import assert from 'node:assert/strict';
import { StreamHub } from '../src/common/stream/stream-hub';

function makeResponse() {
  const writes: string[] = [];
  return {
    writes,
    write: (chunk: string) => {
      writes.push(chunk);
    },
  } as any;
}

test('StreamHub filter isolates tenant messages', () => {
  const hub = new StreamHub();

  const resA = makeResponse();
  const resB = makeResponse();

  hub.register(resA, (message) => message.tenantId === 'tenant_a');
  hub.register(resB, (message) => message.tenantId === 'tenant_b');

  hub.broadcast({ type: 'orders.snapshot', tenantId: 'tenant_a', orders: [] });

  assert.equal(resA.writes.length, 1);
  assert.equal(resB.writes.length, 0);
});
