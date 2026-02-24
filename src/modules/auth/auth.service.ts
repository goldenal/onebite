import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt, { type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

export type AuthRole = 'admin' | 'kitchen' | 'customer' | 'platform';
export type AuthPayload = {
  sub: string;
  role: AuthRole;
  tenantId?: string;
  username?: string;
  email?: string;
  locationIds?: string[] | null;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  signToken(payload: AuthPayload) {
    return jwt.sign(payload, this.getJwtSecret(), {
      expiresIn: this.getAuthTokenTtl() as SignOptions['expiresIn'],
    });
  }

  verifyToken(token: string) {
    return jwt.verify(token, this.getJwtSecret()) as AuthPayload;
  }

  private allowedMembershipRoles(role: 'admin' | 'kitchen'): string[] {
    if (role === 'admin') return ['owner', 'admin'];
    return ['owner', 'admin', 'kitchen', 'staff'];
  }

  async loginWithRole(
    role: 'admin' | 'kitchen',
    username: string,
    password: string,
    tenantIdHint?: string,
  ) {
    const identity = username.trim();
    const normalizedEmail = identity.toLowerCase();
    const allowedRoles = this.allowedMembershipRoles(role);
    const normalizedTenantIdHint = typeof tenantIdHint === 'string' ? tenantIdHint.trim() : '';

    const memberships = await this.prisma.tenantMembership.findMany({
      where: {
        user: { email: normalizedEmail },
        role: { in: allowedRoles },
        tenant: { status: 'active' },
        ...(normalizedTenantIdHint ? { tenantId: normalizedTenantIdHint } : {}),
      },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
      take: normalizedTenantIdHint ? 1 : 2,
    });

    if (!memberships.length) throw new UnauthorizedException('Invalid username or password');
    if (!normalizedTenantIdHint && memberships.length > 1) {
      throw new UnauthorizedException('multiple_tenants_for_credentials');
    }

    const membership = memberships[0];
    const ok = await bcrypt.compare(password, membership.user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid username or password');

    return {
      id: membership.user.id,
      username: membership.user.email,
      role,
      tenantId: membership.tenantId,
      locationIds: this.toLocationIds(membership.locationIds),
    };
  }

  private getJwtSecret() {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is required');
    return secret;
  }

  private getAuthTokenTtl() {
    return this.config.get<string>('AUTH_TOKEN_TTL') || '24h';
  }

  private toLocationIds(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is string => typeof entry === 'string');
  }
}
