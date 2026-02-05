import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
      if (payload) (req as any).user = payload;
    } catch {
      // Ignore invalid token for optional auth
    }
    return true;
  }
}

@Injectable()
export class KitchenAccessGuard implements CanActivate {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token =
      getBearerToken(req) || (typeof req.query.token === 'string' ? req.query.token : null);

    if (token) {
      try {
        const payload = toAuthPayload(this.auth.verifyToken(token));
        if (payload && (payload.role === 'admin' || payload.role === 'kitchen')) {
          (req as any).user = payload;
          return true;
        }
      } catch {
        // fall through to legacy token
      }
    }

    const kitchenToken = this.config.get<string>('KITCHEN_API_TOKEN');
    if (kitchenToken) {
      const provided = (req.headers.authorization || '').replace('Bearer ', '');
      const providedQuery = typeof req.query.token === 'string' ? req.query.token : '';
      if (provided === kitchenToken || providedQuery === kitchenToken) return true;
    }

    throw new UnauthorizedException('Unauthorized');
  }
}

export class RoleGuard implements CanActivate {
  constructor(private readonly role: 'admin' | 'kitchen') {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const user = (req as any).user as AuthPayload | undefined;
    if (!user) throw new UnauthorizedException('Unauthorized');
    if (user.role === 'admin') return true;
    if (user.role !== this.role) throw new UnauthorizedException('Unauthorized');
    return true;
  }
}

export const AdminGuard = () => new RoleGuard('admin');
export const KitchenGuard = () => new RoleGuard('kitchen');
