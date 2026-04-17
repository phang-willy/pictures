import type { CookieOptions, Response } from 'express';

/**
 * Nom du cookie HttpOnly contenant l’access token (même valeur que l’ancien Bearer JSON).
 * Ne jamais lire ce secret côté client : le navigateur l’envoie seul avec credentials: 'include'.
 */
export const ACCESS_TOKEN_COOKIE_NAME = 'pictures_at';

export { ACCESS_TOKEN_TTL_MS } from '@/auth/access-token-ttl.const';

/**
 * Lit un cookie par nom depuis l’en-tête brut `Cookie:` (sans dépendre de cookie-parser).
 */
export function getCookieValue(
  cookieHeader: string | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader?.trim()) {
    return undefined;
  }
  for (const segment of cookieHeader.split(';')) {
    const part = segment.trim();
    const eq = part.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = part.slice(0, eq).trim();
    if (key !== name) {
      continue;
    }
    const raw = part.slice(eq + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return undefined;
}

function cookieSecureDefault(): boolean {
  if (process.env.AUTH_COOKIE_SECURE === 'true') {
    return true;
  }
  if (process.env.AUTH_COOKIE_SECURE === 'false') {
    return false;
  }
  return (process.env.NODE_ENV ?? '').toLowerCase() === 'production';
}

/**
 * Options Set-Cookie alignées OWASP : HttpOnly, Secure en prod (ou si forcé), SameSite.
 * Le domaine peut être fixé via AUTH_COOKIE_DOMAIN (sous-domaines partagés).
 */
export function accessTokenCookieOptions(maxAgeMs: number): CookieOptions {
  const secure = cookieSecureDefault();
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    /** Express attend `maxAge` en millisecondes. */
    maxAge: maxAgeMs,
    ...(process.env.AUTH_COOKIE_DOMAIN?.trim()
      ? { domain: process.env.AUTH_COOKIE_DOMAIN.trim() }
      : {}),
  };
}

export function clearedAccessTokenCookieOptions(): CookieOptions {
  const base = accessTokenCookieOptions(0);
  return {
    ...base,
    maxAge: 0,
  };
}

/** Supprime le cookie d’accès côté navigateur (logout). */
export function clearAccessTokenCookie(res: Response): void {
  const secure = cookieSecureDefault();
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, {
    path: '/',
    httpOnly: true,
    secure,
    sameSite: 'lax',
    ...(process.env.AUTH_COOKIE_DOMAIN?.trim()
      ? { domain: process.env.AUTH_COOKIE_DOMAIN.trim() }
      : {}),
  });
}
