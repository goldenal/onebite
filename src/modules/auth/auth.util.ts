import type { Request, Response } from 'express';
import type { AuthPayload } from './auth.service';
import jwt from 'jsonwebtoken';

export function parseCookie(header: string | undefined, name: string) {
  if (!header) return null;
  const parts = header.split(';').map((part) => part.trim());
  for (const part of parts) {
    if (part.startsWith(`${name}=`)) {
      return decodeURIComponent(part.slice(name.length + 1));
    }
  }
  return null;
}

export function getBearerToken(req: Request) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

export function setCookie(
  res: Response,
  name: string,
  token: string,
  opts: { maxAge: number; sameSite: string; secure: boolean; domain?: string },
) {
  const parts = [
    `${name}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    `Max-Age=${opts.maxAge}`,
    `SameSite=${opts.sameSite}`,
  ];
  if (opts.secure) parts.push('Secure');
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearCookie(
  res: Response,
  name: string,
  opts: { sameSite: string; secure: boolean; domain?: string },
) {
  const parts = [
    `${name}=`,
    'HttpOnly',
    'Path=/',
    'Max-Age=0',
    `SameSite=${opts.sameSite}`,
  ];
  if (opts.secure) parts.push('Secure');
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  res.setHeader('Set-Cookie', parts.join('; '));
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
