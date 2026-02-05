import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt, { type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

export type AuthRole = 'admin' | 'kitchen';
export type AuthPayload = { username: string; role: AuthRole };

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

  async loginWithRole(role: AuthRole, username: string, password: string) {
    const user = await this.prisma.staffUser.findUnique({ where: { username } });
    if (!user || user.role !== role) throw new UnauthorizedException('Invalid username or password');

    const ok = bcrypt.compareSync(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid username or password');

    return { username: user.username, role };
  }

  async createKitchenUser(username: string, password: string) {
    const hash = bcrypt.hashSync(password, 10);
    const user = await this.prisma.staffUser.upsert({
      where: { username },
      update: { passwordHash: hash, role: 'kitchen' },
      create: { username, passwordHash: hash, role: 'kitchen' },
    });
    return { username: user.username, role: 'kitchen' as const };
  }

  async createAdminUser(username: string, password: string) {
    const hash = bcrypt.hashSync(password, 10);
    const user = await this.prisma.staffUser.upsert({
      where: { username },
      update: { passwordHash: hash, role: 'admin' },
      create: { username, passwordHash: hash, role: 'admin' },
    });
    return { username: user.username, role: 'admin' as const };
  }

  getAuthCookieName() {
    return this.config.get<string>('AUTH_COOKIE_NAME') || 'bck_auth';
  }

  getAuthCookieMaxAge() {
    const raw = this.config.get<string>('AUTH_COOKIE_MAX_AGE');
    return raw ? Number(raw) : 60 * 60 * 24;
  }

  getStaffCookieName() {
    return this.config.get<string>('STAFF_COOKIE_NAME') || 'bck_staff';
  }

  getStaffCookieMaxAge() {
    const raw = this.config.get<string>('STAFF_COOKIE_MAX_AGE');
    return raw ? Number(raw) : 60 * 60 * 8;
  }

  getCookieSameSite() {
    return (this.config.get<string>('COOKIE_SAMESITE') || 'Lax').trim();
  }

  getCookieSecure() {
    return this.config.get<string>('COOKIE_SECURE') === 'true';
  }

  getCookieDomain() {
    return (this.config.get<string>('COOKIE_DOMAIN') || '').trim();
  }

  getStaffPortalCode() {
    return (this.config.get<string>('STAFF_PORTAL_CODE') || '').trim();
  }

  private getJwtSecret() {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is required');
    return secret;
  }

  private getAuthTokenTtl() {
    return this.config.get<string>('AUTH_TOKEN_TTL') || '24h';
  }
}
