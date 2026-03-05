import test from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { WebhooksController } from '../src/modules/webhooks/webhooks.controller';

function makeP2002Error() {
  const err = Object.create(Prisma.PrismaClientKnownRequestError.prototype) as Prisma.PrismaClientKnownRequestError;
  (err as any).code = 'P2002';
  return err;
}

test('webhook idempotency returns false on duplicate provider+event_id', async () => {
  let calls = 0;
  const prisma = {
    processedWebhookEvent: {
      create: async () => {
        calls += 1;
        if (calls > 1) throw makeP2002Error();
        return { id: '1' };
      },
    },
  } as any;

  const controller = new WebhooksController(
    { get: () => undefined } as any,
    {} as any,
    prisma,
    {} as any,
    {} as any,
    {} as any,
  );

  const first = await (controller as any).markProcessed('stripe', 'evt_1', 'tenant_a');
  const second = await (controller as any).markProcessed('stripe', 'evt_1', 'tenant_a');

  assert.equal(first, true);
  assert.equal(second, false);
});
