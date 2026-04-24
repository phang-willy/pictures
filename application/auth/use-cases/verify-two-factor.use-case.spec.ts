import { describe, expect, it, vi } from 'vitest';

import { VerifyTwoFactorUseCase } from './verify-two-factor.use-case';

describe('VerifyTwoFactorUseCase', () => {
  it('returns access token when code is valid', async () => {
    const tokenSigner = {
      verify: vi.fn(() => ({ email: 'john@example.com' })),
      sign: vi.fn(() => 'access-token'),
    };
    const passwordHasher = { verify: vi.fn(async () => true) };
    const mailSender = { send: vi.fn(async () => undefined) };
    const clientLocation = { resolveLabelForIp: vi.fn(async () => 'Testville') };
    const userRepository = {
      findByEmail: vi.fn(async () => ({
        id: 'u1',
        email: { value: 'john@example.com' },
        role: { value: 'USER' },
      })),
    };
    const twoFactorCodeRepository = {
      findLatestActiveByUserId: vi.fn(async () => ({
        toPrimitives: () => ({
          id: 'c1',
          attempts: 0,
          codeHash: 'hash-code',
        }),
      })),
      markAsUsed: vi.fn(async () => undefined),
      incrementAttempts: vi.fn(async () => undefined),
      deleteAllActiveByUserId: vi.fn(async () => undefined),
    };
    const authSessionRepository = {
      create: vi.fn(async (session) => session),
    };

    const useCase = new VerifyTwoFactorUseCase(
      tokenSigner as any,
      passwordHasher as any,
      mailSender as any,
      clientLocation as any,
      userRepository as any,
      twoFactorCodeRepository as any,
      authSessionRepository as any,
    );

    const result = await useCase.execute(
      { twoFactorToken: 'tf-token', code: '123456' },
      '127.0.0.1',
    );

    expect(result.ok).toBe(true);
    expect((result as { accessToken: string }).accessToken).toBe('access-token');
    expect(twoFactorCodeRepository.markAsUsed).toHaveBeenCalledTimes(1);
    expect(mailSender.send).toHaveBeenCalledTimes(1);
  });
});
