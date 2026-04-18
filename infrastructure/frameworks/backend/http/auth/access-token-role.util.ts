import type { TokenSignerPort } from '@/application/auth/ports/token-signer.port';
import { ACCESS_TOKEN_COOKIE_NAME } from '@/infrastructure/frameworks/backend/http/auth/auth-cookie.config';

function getCookieValue(cookieHeader: string | undefined, key: string): string {
  if (!cookieHeader) {
    return '';
  }
  const parts = cookieHeader.split(';').map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${key}=`));
  if (!found) {
    return '';
  }
  return found.slice(key.length + 1).trim();
}

export type RequestRole = 'ADMIN' | 'USER' | 'anon';

export function getRoleFromRequest(
  tokenSigner: Pick<TokenSignerPort, 'verify'>,
  req: {
    headers?: { cookie?: string; authorization?: string };
  },
): RequestRole {
  const authz = req.headers?.authorization;
  const cookie = req.headers?.cookie;
  const fromBearer =
    typeof authz === 'string' && authz.startsWith('Bearer ') ? authz.slice(7).trim() : '';
  const token = fromBearer || getCookieValue(cookie, ACCESS_TOKEN_COOKIE_NAME);
  if (!token) {
    return 'anon';
  }
  const payload = tokenSigner.verify<{ role?: string }>(token);
  if (!payload?.role || typeof payload.role !== 'string') {
    return 'anon';
  }
  return payload.role === 'ADMIN' ? 'ADMIN' : 'USER';
}
