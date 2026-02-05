import type { Request } from 'express';
import type { AuthPayload } from './auth.service';
import jwt from 'jsonwebtoken';

export function getBearerToken(req: Request) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

export function verifyStaffToken(token: string, secret: string): boolean {
  const payload = jwt.verify(token, secret) as { type?: string };
  return payload?.type === 'staff';
}

export function signStaffToken(secret: string, ttl: string | number) {
  return jwt.sign({ type: 'staff' }, secret, { expiresIn: ttl as any });
}

export function toAuthPayload(input: unknown): AuthPayload | null {
  if (!input || typeof input !== 'object') return null;
  const p = input as AuthPayload;
  if (!p.username || !p.role) return null;
  return p;
}
