import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JwtTokenSignerAdapter } from '@/infrastructure/adapters/security/jwt-token-signer.adapter';

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

describe('JwtTokenSignerAdapter', () => {
  beforeEach(() => {
    vi.stubEnv('AUTH_SECRET', 'test-secret-with-at-least-thirty-two-characters');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('verifies tokens it signs', () => {
    const signer = new JwtTokenSignerAdapter();

    const token = signer.sign({ sub: 'user-id', role: 'ADMIN' }, 60);

    expect(signer.verify<{ sub: string; role: string }>(token)).toMatchObject({
      sub: 'user-id',
      role: 'ADMIN',
    });
  });

  it('rejects unsigned legacy base64 tokens', () => {
    const signer = new JwtTokenSignerAdapter();
    const legacyToken = base64UrlJson({
      sub: 'user-id',
      role: 'ADMIN',
      exp: 4_102_444_800,
    });

    expect(signer.verify(legacyToken)).toBeNull();
  });

  it('rejects tokens whose payload was modified', () => {
    const signer = new JwtTokenSignerAdapter();
    const [header, , signature] = signer.sign({ sub: 'user-id', role: 'USER' }, 60).split('.');
    const tamperedBody = base64UrlJson({
      sub: 'user-id',
      role: 'ADMIN',
      exp: 4_102_444_800,
    });

    expect(signer.verify(`${header}.${tamperedBody}.${signature}`)).toBeNull();
  });
});
