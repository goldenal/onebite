import test from 'node:test';
import assert from 'node:assert/strict';
import { TenantRequiredGuard } from '../src/common/tenant/tenant-required.guard';

test('TenantRequiredGuard resolves tenant from x-tenant-id header', async () => {
  const guard = new TenantRequiredGuard(
    {
      resolveById: async (tenantId?: string) =>
        tenantId === 'tenant_a' ? { id: 'tenant_a', slug: 'a', name: 'A', status: 'active' } : null,
    } as any,
    { verifyToken: () => ({}) } as any,
  );

  const req: any = {
    headers: { 'x-tenant-id': 'tenant_a' },
    query: {},
    params: {},
    body: {},
  };
  const ctx: any = {
    switchToHttp: () => ({ getRequest: () => req }),
  };

  const allowed = await guard.canActivate(ctx);
  assert.equal(allowed, true);
  assert.equal(req.tenant?.id, 'tenant_a');
});

test('TenantRequiredGuard rejects tenant mismatch between token and request tenant', async () => {
  const guard = new TenantRequiredGuard(
    {
      resolveById: async () => ({ id: 'tenant_a', slug: 'a', name: 'A', status: 'active' }),
    } as any,
    { verifyToken: () => ({ sub: 'user_1', role: 'admin', tenantId: 'tenant_b' }) } as any,
  );

  const req: any = {
    headers: {
      authorization: 'Bearer token',
      'x-tenant-id': 'tenant_a',
    },
    query: {},
    params: {},
    body: {},
  };
  const ctx: any = {
    switchToHttp: () => ({ getRequest: () => req }),
  };

  await assert.rejects(() => guard.canActivate(ctx));
});
