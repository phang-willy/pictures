import { describe, expect, it, vi } from 'vitest';

import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  it('returns twoFactorToken when credentials are valid', async () => {
    const tokenSigner = { sign: vi.fn(() => 'tf-token') };
    const otpGenerator = { generate: vi.fn(() => '123456') };
    const passwordHasher = {
      verify: vi.fn(async () => true),
      hash: vi.fn(async () => 'hash-code'),
    };
    const mailSender = { send: vi.fn(async () => undefined) };
    const clientLocation = { resolveLabelForIp: vi.fn(async () => 'Testville') };
    const userRepository = {
      findByEmail: vi.fn(async () => ({
        id: 'u1',
        toPrimitives: () => ({
          email: 'john@example.com',
          verifiedAt: new Date(),
          isActive: true,
        }),
      })),
      getRecentPasswordHashes: vi.fn(async () => ['hash-password']),
    };
    const twoFactorCodeRepository = {
      deleteAllActiveByUserId: vi.fn(async () => undefined),
      create: vi.fn(async () => undefined),
    };

    const useCase = new LoginUseCase(
      tokenSigner as any,
      otpGenerator as any,
      passwordHasher as any,
      mailSender as any,
      clientLocation as any,
      userRepository as any,
      twoFactorCodeRepository as any,
    );

    const result = await useCase.execute(
      { email: 'john@example.com', password: 'StrongPass123!' },
      '127.0.0.1',
    );

    expect(result.ok).toBe(true);
    expect((result as { twoFactorToken: string }).twoFactorToken).toBe('tf-token');
    expect(mailSender.send).toHaveBeenCalledTimes(1);
  });
});
