import test from 'node:test';
import assert from 'node:assert/strict';
import { PlatformService } from '../src/modules/platform/platform.service';

test('PlatformService.connectStatus refreshes Stripe status and updates DB', async () => {
  const existingRow = {
    tenantId: 'tenant_alpha',
    connectAccountId: 'acct_123',
    chargesEnabled: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
    onboardingComplete: false,
  };

  const prisma = {
    tenantStripeAccount: {
      findUnique: async () => existingRow,
      update: async ({ data }: any) => ({ ...existingRow, ...data }),
    },
  } as any;

  const config = {
    get: (key: string) => (key === 'STRIPE_SECRET_KEY' ? 'sk_test_123' : undefined),
  } as any;

  const service = new PlatformService(prisma, config, {} as any);
  (service as any).stripe = {
    accounts: {
      retrieve: async () => ({
        id: 'acct_123',
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
      }),
    },
  };

  const row = await service.connectStatus('tenant_alpha');
  assert.equal(row.chargesEnabled, true);
  assert.equal(row.payoutsEnabled, true);
  assert.equal(row.detailsSubmitted, true);
  assert.equal(row.onboardingComplete, true);
});

test('PlatformService.connectStatus falls back to DB row when Stripe refresh fails', async () => {
  const existingRow = {
    tenantId: 'tenant_beta',
    connectAccountId: 'acct_456',
    chargesEnabled: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
    onboardingComplete: false,
  };

  const prisma = {
    tenantStripeAccount: {
      findUnique: async () => existingRow,
      update: async ({ data }: any) => ({ ...existingRow, ...data }),
    },
  } as any;

  const config = {
    get: (key: string) => (key === 'STRIPE_SECRET_KEY' ? 'sk_test_123' : undefined),
  } as any;

  const service = new PlatformService(prisma, config, {} as any);
  (service as any).stripe = {
    accounts: {
      retrieve: async () => {
        throw new Error('stripe_unreachable');
      },
    },
  };

  const row = await service.connectStatus('tenant_beta');
  assert.equal(row.chargesEnabled, false);
  assert.equal(row.payoutsEnabled, false);
  assert.equal(row.detailsSubmitted, false);
  assert.equal(row.onboardingComplete, false);
});
