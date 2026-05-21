import { describe, expect, it, vi } from 'vitest';

import { ChangePasswordUseCase } from './change-password.use-case';

function makeUseCase() {
  const tokenSigner = {
    verify: vi.fn(() => ({ sub: 'u1', role: 'USER' })),
  };
  const passwordHasher = {
    verify: vi.fn(async (plain: string, hash: string) => {
      return plain === 'OldPassword1!' && hash === 'current-hash';
    }),
    hash: vi.fn(async () => 'new-hash'),
  };
  const mailSender = { send: vi.fn(async () => undefined) };
  const clientLocation = { resolveLabelForIp: vi.fn(async () => 'Testville') };
  const userRepository = {
    findById: vi.fn(async () => ({
      id: 'u1',
      toPrimitives: () => ({
        email: 'john@example.com',
      }),
    })),
    getRecentPasswordHashes: vi.fn(async () => ['current-hash', 'older-hash']),
    appendPasswordHash: vi.fn(async () => undefined),
  };
  const twoFactorCodeRepository = {
    deleteAllActiveByUserId: vi.fn(async () => undefined),
  };

  const useCase = new ChangePasswordUseCase(
    tokenSigner as any,
    passwordHasher as any,
    mailSender as any,
    clientLocation as any,
    userRepository as any,
    twoFactorCodeRepository as any,
  );

  return {
    useCase,
    tokenSigner,
    passwordHasher,
    mailSender,
    userRepository,
    twoFactorCodeRepository,
  };
}

describe('ChangePasswordUseCase', () => {
  it('allows an authenticated USER to change their own password', async () => {
    const { useCase, userRepository, twoFactorCodeRepository, mailSender } = makeUseCase();

    const result = await useCase.execute(
      {
        oldPassword: 'OldPassword1!',
        newPassword: 'NewPassword1!',
        confirmPassword: 'NewPassword1!',
      },
      undefined,
      '127.0.0.1',
      'pictures_at=valid-token',
    );

    expect(result.ok).toBe(true);
    expect(userRepository.appendPasswordHash).toHaveBeenCalledWith('u1', 'new-hash');
    expect(twoFactorCodeRepository.deleteAllActiveByUserId).toHaveBeenCalledWith('u1');
    expect(mailSender.send).toHaveBeenCalledTimes(1);
  });

  it('rejects weak new passwords before writing anything', async () => {
    const { useCase, userRepository } = makeUseCase();

    const result = await useCase.execute(
      {
        oldPassword: 'OldPassword1!',
        newPassword: 'weak',
        confirmPassword: 'weak',
      },
      undefined,
      '127.0.0.1',
      'pictures_at=valid-token',
    );

    expect(result.ok).toBe(false);
    expect((result as { field?: string }).field).toBe('newPassword');
    expect(userRepository.appendPasswordHash).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated requests', async () => {
    const { useCase, userRepository } = makeUseCase();

    const result = await useCase.execute(
      {
        oldPassword: 'OldPassword1!',
        newPassword: 'NewPassword1!',
        confirmPassword: 'NewPassword1!',
      },
      undefined,
      '127.0.0.1',
    );

    expect(result.ok).toBe(false);
    expect(userRepository.appendPasswordHash).not.toHaveBeenCalled();
  });
});
