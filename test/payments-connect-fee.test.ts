import test from 'node:test';
import assert from 'node:assert/strict';
import { PaymentsService } from '../src/modules/payments/payments.service';

function makeConfig(values: Record<string, string>) {
  return {
    get: (key: string) => values[key],
  } as any;
}

test('checkout session includes transfer_data destination and application_fee_amount with delivery fee', async () => {
  const prisma = {
    menuItem: {
      findMany: async () => [{ id: 'menu_1', name: 'Jambalaya', price: 20 }],
    },
    paymentLink: {
      findFirst: async ({ where }: any) =>
        where.orderId === 'ord_1'
          ? {
              orderId: 'ord_1',
              tenantId: 'tenant_a',
              fulfillment: 'delivery',
              channel: 'web',
              items: [{ menuItem: { id: 'menu_1' }, quantity: 1 }],
              customerName: 'Chris',
              customerPhone: '+14155550199',
            }
          : null,
      updateMany: async () => ({ count: 1 }),
    },
    tenantStripeAccount: {
      findUnique: async () => ({
        connectAccountId: 'acct_123',
        chargesEnabled: true,
        onboardingComplete: true,
      }),
    },
    deliveryQuote: {
      findFirst: async () => ({
        quoteId: 'q_1',
        feeCents: 500,
        currency: 'USD',
        expiresAt: new Date(Date.now() + 60_000),
      }),
    },
  } as any;

  const config = makeConfig({
    STRIPE_SECRET_KEY: 'sk_test_x',
    PLATFORM_FEE_BPS: '500',
    CHECKOUT_TAX_BPS: '0',
    CUSTOMER_URL: 'http://localhost:5173',
  });

  const service = new PaymentsService(prisma, config);

  let captured: any = null;
  (service as any).stripe = {
    checkout: {
      sessions: {
        create: async (params: any) => {
          captured = params;
          return { id: 'cs_test_1', url: 'https://checkout.test/session/1' };
        },
      },
    },
  };

  await service.createCheckoutSession('tenant_a', { order_id: 'ord_1', quote_id: 'q_1' });

  assert.equal(captured.payment_intent_data.transfer_data.destination, 'acct_123');
  // subtotal=2000, platform fee(5%)=100, delivery fee=500 => app fee=600
  assert.equal(captured.payment_intent_data.application_fee_amount, 600);
});
