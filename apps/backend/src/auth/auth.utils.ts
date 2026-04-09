import {
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';
import bcrypt from 'bcrypt';

/** Stockage des secrets (mots de passe, codes 2FA) : uniquement bcrypt. */
const PASSWORD_BCRYPT_ROUNDS = 12;
const TWO_FA_BCRYPT_ROUNDS = 10;

const TOKEN_VERSION = 1 as const;

export type TwoFaLoginTokenPayload = {
  v: typeof TOKEN_VERSION;
  email: string;
  exp: number;
};

export type AccessTokenPayload = {
  v: typeof TOKEN_VERSION;
  sub: string;
  email: string;
  typ: 'access';
  exp: number;
};

async function bcryptHash(plain: string, rounds: number): Promise<string> {
  return bcrypt.hash(plain, rounds);
}

async function bcryptVerify(
  plain: string,
  storedHash: string,
): Promise<boolean> {
  if (!storedHash.startsWith('$2')) {
    return false;
  }
  try {
    return await bcrypt.compare(plain, storedHash);
  } catch {
    return false;
  }
}

function signPayload(payload: Record<string, unknown>, secret: string): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString(
    'base64url',
  );
  const sig = createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${sig}`;
}

function verifySignedToken<T extends Record<string, unknown>>(
  token: string,
  secret: string,
  guard: (o: Record<string, unknown>) => o is T,
): T | null {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) {
    return null;
  }
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expectedSig = createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');
  try {
    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null;
    }
  } catch {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }
  const o = parsed as Record<string, unknown>;
  if (!guard(o)) {
    return null;
  }
  if (typeof o.exp !== 'number' || Date.now() > o.exp) {
    return null;
  }
  return o;
}

export function signTwoFaLoginToken(
  email: string,
  expiresAtMs: number,
  secret: string,
): string {
  const payload: TwoFaLoginTokenPayload = {
    v: TOKEN_VERSION,
    email,
    exp: expiresAtMs,
  };
  return signPayload(payload as unknown as Record<string, unknown>, secret);
}

export function verifyTwoFaLoginToken(
  token: string,
  secret: string,
): TwoFaLoginTokenPayload | null {
  return verifySignedToken(token, secret, (o): o is TwoFaLoginTokenPayload => {
    return (
      o.v === TOKEN_VERSION &&
      typeof o.email === 'string' &&
      typeof o.exp === 'number' &&
      o.email.length > 0
    );
  });
}

export function signAccessToken(
  userId: string,
  email: string,
  expiresAtMs: number,
  secret: string,
): string {
  const payload: AccessTokenPayload = {
    v: TOKEN_VERSION,
    sub: userId,
    email,
    typ: 'access',
    exp: expiresAtMs,
  };
  return signPayload(payload as unknown as Record<string, unknown>, secret);
}

export function verifyAccessToken(
  token: string,
  secret: string,
): AccessTokenPayload | null {
  return verifySignedToken(token, secret, (o): o is AccessTokenPayload => {
    return (
      o.v === TOKEN_VERSION &&
      typeof o.sub === 'string' &&
      typeof o.email === 'string' &&
      o.typ === 'access' &&
      typeof o.exp === 'number'
    );
  });
}

export function generateSixDigitCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptHash(password, PASSWORD_BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  return bcryptVerify(password, storedHash);
}

export async function hashTwoFactorCode(plain: string): Promise<string> {
  return bcryptHash(plain, TWO_FA_BCRYPT_ROUNDS);
}

export async function verifyTwoFactorCode(
  plain: string,
  storedHash: string,
): Promise<boolean> {
  return bcryptVerify(plain, storedHash);
}

export function generateAccountConfirmationToken(): string {
  return randomBytes(32).toString('hex');
}
