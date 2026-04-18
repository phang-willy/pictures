import { LoginUseCase } from './login.use-case';

describe('LoginUseCase', () => {
  it('returns twoFactorToken when credentials are valid', async () => {
    const tokenSigner = { sign: jest.fn(() => 'tf-token') };
    const otpGenerator = { generate: jest.fn(() => '123456') };
    const passwordHasher = {
      verify: jest.fn(async () => true),
      hash: jest.fn(async () => 'hash-code'),
    };
    const mailSender = { send: jest.fn(async () => undefined) };
    const clientLocation = { resolveLabelForIp: jest.fn(async () => 'Testville') };
    const userRepository = {
      findByEmail: jest.fn(async () => ({
        id: 'u1',
        toPrimitives: () => ({
          email: 'john@example.com',
          verifiedAt: new Date(),
          isActive: true,
        }),
      })),
      getRecentPasswordHashes: jest.fn(async () => ['hash-password']),
    };
    const twoFactorCodeRepository = {
      deleteAllActiveByUserId: jest.fn(async () => undefined),
      create: jest.fn(async () => undefined),
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
