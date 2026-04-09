import type { Request } from 'express';

/** IP du client (proxy : premier hop de `X-Forwarded-For`). */
export function extractClientIp(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  if (Array.isArray(xff) && xff[0]) {
    return xff[0].split(',')[0].trim();
  }
  const raw = req.socket?.remoteAddress ?? req.ip;
  return raw && raw.length > 0 ? raw : 'inconnu';
}
