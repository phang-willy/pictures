import { VerifyTwoFactorUseCase } from './verify-two-factor.use-case';

describe('VerifyTwoFactorUseCase', () => {
  it('returns access token when code is valid', async () => {
    const tokenSigner = {
      verify: jest.fn(() => ({ email: 'john@example.com' })),
      sign: jest.fn(() => 'access-token'),
    };
    const passwordHasher = { verify: jest.fn(async () => true) };
    const mailSender = { send: jest.fn(async () => undefined) };
    const clientLocation = { resolveLabelForIp: jest.fn(async () => 'Testville') };
    const userRepository = {
      findByEmail: jest.fn(async () => ({
        id: 'u1',
        email: { value: 'john@example.com' },
        role: { value: 'USER' },
      })),
    };
    const twoFactorCodeRepository = {
      findLatestActiveByUserId: jest.fn(async () => ({
        toPrimitives: () => ({
          id: 'c1',
          attempts: 0,
          codeHash: 'hash-code',
        }),
      })),
      markAsUsed: jest.fn(async () => undefined),
      incrementAttempts: jest.fn(async () => undefined),
      deleteAllActiveByUserId: jest.fn(async () => undefined),
    };
    const authSessionRepository = {
      create: jest.fn(async (session) => session),
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
