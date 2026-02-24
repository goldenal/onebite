import type { TenantContext } from '../common/tenant/tenant.types';
import type { AuthPayload } from '../modules/auth/auth.service';

declare module 'express-serve-static-core' {
  interface Request {
    tenant?: TenantContext | null;
    user?: AuthPayload;
  }
}
