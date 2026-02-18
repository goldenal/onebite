import { HttpStatus } from '@nestjs/common';

export type ErrorEnvelope = {
  success: false;
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  path: string;
  timestamp: string;
};

function normalizeToken(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || 'unknown_error';
}

function statusCodeToken(status: number) {
  const label = (HttpStatus as Record<number, string>)[status];
  if (typeof label === 'string' && label) return normalizeToken(label);
  return 'internal_server_error';
}

function hasDetails(value: unknown) {
  return value !== undefined && value !== null && !(typeof value === 'string' && !value.trim());
}

export function createErrorEnvelope(input: {
  statusCode: number;
  path: string;
  code?: string;
  message?: string;
  details?: unknown;
}): ErrorEnvelope {
  const fallback = statusCodeToken(input.statusCode);
  const code = normalizeToken(input.code || input.message || fallback);
  const message = normalizeToken(input.message || input.code || fallback);
  const envelope: ErrorEnvelope = {
    success: false,
    statusCode: input.statusCode,
    code,
    message,
    path: input.path,
    timestamp: new Date().toISOString(),
  };
  if (hasDetails(input.details)) envelope.details = input.details;
  return envelope;
}
