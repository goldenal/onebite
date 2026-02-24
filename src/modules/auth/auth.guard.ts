import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, type AuthPayload } from './auth.service';
import { getBearerToken, toAuthPayload } from './auth.util';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = getBearerToken(req);
    if (!token) throw new UnauthorizedException('Unauthorized');

    try {
      const payload = toAuthPayload(this.auth.verifyToken(token));
      if (!payload) throw new UnauthorizedException('Unauthorized');
      const reqTenantId = (req as any).tenant?.id as string | undefined;
      if (reqTenantId && payload.tenantId && payload.tenantId !== reqTenantId) {
        throw new UnauthorizedException('tenant_scope_mismatch');
      }
      if (reqTenantId && ['admin', 'kitchen', 'customer'].includes(payload.role) && !payload.tenantId) {
        throw new UnauthorizedException('tenant_required_in_token');
      }
      (req as any).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }
  }
}

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = getBearerToken(req);
    if (!token) return true;

    try {
      const payload = toAuthPayload(this.auth.verifyToken(token));
      if (payload) {
        const reqTenantId = (req as any).tenant?.id as string | undefined;
        if (reqTenantId && payload.tenantId && payload.tenantId !== reqTenantId) return true;
        (req as any).user = payload;
      }
    } catch {
      // Ignore invalid token for optional auth
    }
    return true;
  }
}

@Injectable()
export class KitchenAccessGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const reqTenantId = (req as any).tenant?.id as string | undefined;
    const token =
      getBearerToken(req) || (typeof req.query.token === 'string' ? req.query.token : null);

    if (token) {
      try {
        const payload = toAuthPayload(this.auth.verifyToken(token));
        if (
          payload &&
          (payload.role === 'admin' || payload.role === 'kitchen') &&
          payload.tenantId &&
          (!reqTenantId || payload.tenantId === reqTenantId)
        ) {
          (req as any).user = payload;
          return true;
        }
      } catch {
        // keep unauthorized flow below
      }
    }

    throw new UnauthorizedException('Unauthorized');
  }
}

export class RoleGuard implements CanActivate {
  constructor(private readonly role: 'admin' | 'kitchen' | 'customer' | 'platform') {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const user = (req as any).user as AuthPayload | undefined;
    if (!user) throw new UnauthorizedException('Unauthorized');
    if (this.role !== 'platform' && user.role === 'admin') return true;
    if (user.role !== this.role) throw new UnauthorizedException('Unauthorized');
    return true;
  }
}

export const AdminGuard = () => new RoleGuard('admin');
export const KitchenGuard = () => new RoleGuard('kitchen');
export const CustomerGuard = () => new RoleGuard('customer');
export const PlatformGuard = () => new RoleGuard('platform');
