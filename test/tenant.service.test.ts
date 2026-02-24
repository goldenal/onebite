import test from 'node:test';
import assert from 'node:assert/strict';
import { TenantService } from '../src/common/tenant/tenant.service';

test('TenantService resolves active tenant by tenant id', async () => {
  const prisma = {
    tenant: {
      findFirst: async ({ where }: any) =>
        where.id === 'tenant_1'
          ? {
              id: 'tenant_1',
              slug: 'alpha',
              name: 'Alpha',
              status: 'active',
            }
          : null,
    },
  } as any;

  const service = new TenantService(prisma);
  const tenant = await service.resolveById('tenant_1');

  assert.equal(tenant?.id, 'tenant_1');
  assert.equal(tenant?.slug, 'alpha');
});

test('TenantService returns null for missing tenant id', async () => {
  const prisma = {
    tenant: {
      findFirst: async () => null,
    },
  } as any;

  const service = new TenantService(prisma);
  const tenant = await service.resolveById(undefined);

  assert.equal(tenant, null);
});
