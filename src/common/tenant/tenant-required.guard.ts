import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { getBearerToken, toAuthPayload } from '../../modules/auth/auth.util';
import { AuthService } from '../../modules/auth/auth.service';
import { TenantService } from './tenant.service';

@Injectable()
export class TenantRequiredGuard implements CanActivate {
  constructor(
    private readonly tenants: TenantService,
    private readonly auth: AuthService,
  ) {}

  private coerceTenantId(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized || null;
  }

  private tenantIdFromQuery(req: Request): string | null {
    const raw = (req.query as Record<string, unknown>)?.tenantId;
    if (Array.isArray(raw)) return this.coerceTenantId(raw[0]);
    return this.coerceTenantId(raw);
  }

  private tenantIdFromParams(req: Request): string | null {
    const raw = (req.params as Record<string, unknown>)?.tenantId;
    return this.coerceTenantId(raw);
  }

  private tenantIdFromBody(req: Request): string | null {
    const body = (req as any).body as Record<string, unknown> | undefined;
    if (!body) return null;
    return this.coerceTenantId(body.tenantId);
  }

  private tenantIdFromHeader(req: Request): string | null {
    const raw = req.headers['x-tenant-id'];
    if (Array.isArray(raw)) return this.coerceTenantId(raw[0]);
    return this.coerceTenantId(raw);
  }

  private tenantIdFromBearerToken(req: Request): string | null {
    const token = getBearerToken(req);
    if (!token) return null;
    try {
      const payload = toAuthPayload(this.auth.verifyToken(token));
      return this.coerceTenantId(payload?.tenantId);
    } catch {
      return null;
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const existingTenant = (req as any).tenant as { id?: string } | null | undefined;
    if (existingTenant?.id) return true;

    const userTenantId = this.coerceTenantId((req as any).user?.tenantId);
    const bearerTenantId = this.tenantIdFromBearerToken(req);
    const explicitTenantId =
      this.tenantIdFromHeader(req) ||
      this.tenantIdFromQuery(req) ||
      this.tenantIdFromParams(req) ||
      this.tenantIdFromBody(req);

    const tenantId = userTenantId || bearerTenantId || explicitTenantId;
    if (!tenantId) throw new NotFoundException('tenant_not_resolved');

    const tenant = await this.tenants.resolveById(tenantId);
    if (!tenant) throw new NotFoundException('tenant_not_found');

    const authTenantId = userTenantId || bearerTenantId;
    if (authTenantId && authTenantId !== tenant.id) {
      throw new UnauthorizedException('tenant_scope_mismatch');
    }

    (req as any).tenant = tenant;
    return true;
  }
}
