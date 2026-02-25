import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { AuthService } from '../src/modules/auth/auth.service';

test('AuthService loginWithRole auto-discovers tenant membership from email/password for admin and kitchen routes', async () => {
  const hash = await bcrypt.hash('Password123!', 4);

  const prisma = {
    tenantMembership: {
      findMany: async () => [
        {
          tenantId: 'tenant_alpha',
          role: 'owner',
          locationIds: null,
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
          user: {
            id: 'usr_1',
            email: 'owner@alpha.com',
            passwordHash: hash,
          },
        },
      ],
    },
  } as any;

  const config = {
    get: (key: string) => {
      if (key === 'JWT_SECRET') return 'test_secret';
      if (key === 'AUTH_TOKEN_TTL') return '24h';
      return undefined;
    },
  } as any;

  const service = new AuthService(prisma, config);

  const adminLogin = await service.loginWithRole('admin', 'owner@alpha.com', 'Password123!');
  const kitchenLogin = await service.loginWithRole('kitchen', 'owner@alpha.com', 'Password123!');

  assert.equal(adminLogin.id, 'usr_1');
  assert.equal(adminLogin.tenantId, 'tenant_alpha');
  assert.equal(adminLogin.username, 'owner@alpha.com');

  assert.equal(kitchenLogin.id, 'usr_1');
  assert.equal(kitchenLogin.tenantId, 'tenant_alpha');
  assert.equal(kitchenLogin.username, 'owner@alpha.com');
});

test('AuthService loginWithRole rejects ambiguous email/password across multiple tenants without tenant hint', async () => {
  const hash = await bcrypt.hash('Password123!', 4);

  const prisma = {
    tenantMembership: {
      findMany: async () => [
        {
          tenantId: 'tenant_alpha',
          role: 'owner',
          locationIds: null,
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
          user: {
            id: 'usr_1',
            email: 'owner@alpha.com',
            passwordHash: hash,
          },
        },
        {
          tenantId: 'tenant_beta',
          role: 'owner',
          locationIds: null,
          createdAt: new Date('2026-02-02T00:00:00.000Z'),
          user: {
            id: 'usr_1',
            email: 'owner@alpha.com',
            passwordHash: hash,
          },
        },
      ],
    },
  } as any;

  const config = {
    get: (key: string) => {
      if (key === 'JWT_SECRET') return 'test_secret';
      if (key === 'AUTH_TOKEN_TTL') return '24h';
      return undefined;
    },
  } as any;

  const service = new AuthService(prisma, config);
  await assert.rejects(() => service.loginWithRole('admin', 'owner@alpha.com', 'Password123!'));
});

test('AuthService loginWithRole accepts optional tenant hint for ambiguous credentials', async () => {
  const hash = await bcrypt.hash('Password123!', 4);

  const prisma = {
    tenantMembership: {
      findMany: async ({ where }: any) =>
        where?.tenantId === 'tenant_beta'
          ? [
              {
                tenantId: 'tenant_beta',
                role: 'owner',
                locationIds: null,
                createdAt: new Date('2026-02-02T00:00:00.000Z'),
                user: {
                  id: 'usr_1',
                  email: 'owner@alpha.com',
                  passwordHash: hash,
                },
              },
            ]
          : [],
    },
  } as any;

  const config = {
    get: (key: string) => {
      if (key === 'JWT_SECRET') return 'test_secret';
      if (key === 'AUTH_TOKEN_TTL') return '24h';
      return undefined;
    },
  } as any;

  const service = new AuthService(prisma, config);
  const login = await service.loginWithRole('admin', 'owner@alpha.com', 'Password123!', 'tenant_beta');
  assert.equal(login.tenantId, 'tenant_beta');
});
