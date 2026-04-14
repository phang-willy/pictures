import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { verifyAccessToken } from '@/auth/auth.utils';
import { extractClientIp } from '@/auth/client-ip.util';

const ADMIN_LIMIT = 500;
const DEFAULT_LIMIT = 100;
const WINDOW_MS = 60_000;

function authSecret(): string | null {
  const s =
    process.env.AUTH_SECRET?.trim() ||
    process.env.AUTH_CONFIRM_SECRET?.trim() ||
    process.env.AUTH_HMAC_SECRET?.trim();
  return s && s.length >= 16 ? s : null;
}

function bearerToken(req: Record<string, unknown>): string {
  const headers = req.headers as Record<string, unknown> | undefined;
  const auth = headers?.authorization;
  return typeof auth === 'string' && auth.startsWith('Bearer ')
    ? auth.slice(7).trim()
    : '';
}

export function throttleWindowMs(): number {
  return WINDOW_MS;
}

export function resolveThrottleLimit(context: ExecutionContext): number {
  const req = context.switchToHttp().getRequest<Request>();
  const secret = authSecret();
  const raw = bearerToken(req as unknown as Record<string, unknown>);
  if (raw && secret) {
    const payload = verifyAccessToken(raw, secret);
    if (payload?.role === 'ADMIN') {
      return ADMIN_LIMIT;
    }
  }
  return DEFAULT_LIMIT;
}

export function resolveThrottleTracker(req: Record<string, unknown>): string {
  const secret = authSecret();
  const raw = bearerToken(req);
  const request = req as unknown as Request;
  if (raw && secret) {
    const payload = verifyAccessToken(raw, secret);
    if (payload) {
      return `user:${payload.sub}`;
    }
  }
  return `ip:${extractClientIp(request)}`;
}
