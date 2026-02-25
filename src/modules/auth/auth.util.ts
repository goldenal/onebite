import type { Request } from 'express';
import type { AuthPayload } from './auth.service';

export function getBearerToken(req: Request) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

export function toAuthPayload(input: unknown): AuthPayload | null {
  if (!input || typeof input !== 'object') return null;
  const p = input as Record<string, unknown>;
  const role = typeof p.role === 'string' ? p.role : null;
  if (!role) return null;

  const sub =
    typeof p.sub === 'string'
      ? p.sub
      : typeof p.username === 'string'
        ? p.username
        : typeof p.email === 'string'
          ? p.email
          : null;
  if (!sub) return null;

  const locationIds = Array.isArray(p.locationIds)
    ? p.locationIds.filter((value): value is string => typeof value === 'string')
    : null;

  return {
    sub,
    role: role as AuthPayload['role'],
    tenantId: typeof p.tenantId === 'string' ? p.tenantId : undefined,
    username: typeof p.username === 'string' ? p.username : undefined,
    email: typeof p.email === 'string' ? p.email : undefined,
    locationIds,
  };
}
