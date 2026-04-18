import { Injectable } from '@nestjs/common';
import { TokenSignerPort } from '@/application/auth/ports/token-signer.port';

@Injectable()
export class JwtTokenSignerAdapter implements TokenSignerPort {
  sign(payload: Record<string, unknown>, expiresInSeconds: number): string {
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  }

  verify<T>(token: string): T | null {
    try {
      const parsed = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as {
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
}
