import { createHmac, timingSafeEqual } from 'node:crypto';
import { TokenSignerPort } from '@/application/auth/ports/token-signer.port';

const DEFAULT_DEV_SECRET = 'dev-only-change-me-auth-secret';
const MIN_SECRET_LENGTH = 32;

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function resolveAuthSecret(): string {
  const secret =
    process.env.AUTH_SECRET?.trim() ||
    process.env.AUTH_HMAC_SECRET?.trim() ||
    process.env.AUTH_CONFIRM_SECRET?.trim();

  if (secret && secret.length >= MIN_SECRET_LENGTH && !secret.startsWith('change-me')) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `AUTH_SECRET must be set to a random value of at least ${MIN_SECRET_LENGTH} characters.`,
    );
  }

  return secret || DEFAULT_DEV_SECRET;
}

export class JwtTokenSignerAdapter implements TokenSignerPort {
  private readonly secret = resolveAuthSecret();

  sign(payload: Record<string, unknown>, expiresInSeconds: number): string {
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const header = base64UrlJson({ alg: 'HS256', typ: 'JWT' });
    const body = base64UrlJson({ ...payload, exp });
    const signature = this.signSegments(header, body);
    return `${header}.${body}.${signature}`;
  }

  verify<T>(token: string): T | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const [header, body, signature] = parts;
      if (!header || !body || !signature) {
        return null;
      }

      const expected = this.signSegments(header, body);
      const actualBuffer = Buffer.from(signature, 'base64url');
      const expectedBuffer = Buffer.from(expected, 'base64url');
      if (
        actualBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(actualBuffer, expectedBuffer)
      ) {
        return null;
      }

      const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
        exp?: number;
      };
      if (typeof parsed.exp !== 'number' || parsed.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      return parsed as T;
    } catch {
      return null;
    }
  }

  private signSegments(header: string, body: string): string {
    return createHmac('sha256', this.secret)
      .update(`${header}.${body}`)
      .digest('base64url');
  }
}
