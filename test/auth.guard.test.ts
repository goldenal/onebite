import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthGuard } from '../src/modules/auth/auth.guard';

test('AuthGuard allows matching tenant token', () => {
  const guard = new AuthGuard({ verifyToken: () => ({ sub: '1', role: 'admin', tenantId: 'tenant_a' }) } as any);
  const req: any = {
    headers: { authorization: 'Bearer abc' },
    tenant: { id: 'tenant_a' },
  };
  const ctx: any = {
    switchToHttp: () => ({ getRequest: () => req }),
  };

  const allowed = guard.canActivate(ctx);
  assert.equal(allowed, true);
  assert.equal(req.user?.tenantId, 'tenant_a');
});

test('AuthGuard rejects tenant mismatch token', () => {
  const guard = new AuthGuard({ verifyToken: () => ({ sub: '1', role: 'admin', tenantId: 'tenant_b' }) } as any);
  const req: any = {
    headers: { authorization: 'Bearer abc' },
    tenant: { id: 'tenant_a' },
  };
  const ctx: any = {
    switchToHttp: () => ({ getRequest: () => req }),
  };

  assert.throws(() => guard.canActivate(ctx));
});
