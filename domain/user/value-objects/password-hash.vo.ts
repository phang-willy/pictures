import { DomainError } from '@/shared/domain/domain-error';

export class PasswordHashVo {
  public readonly value: string;

  constructor(input: string) {
    const normalized = input.trim();
    if (!normalized || normalized.length < 20) {
      throw new DomainError('USER_INVALID_PASSWORD_HASH', 'Password hash is invalid.');
    }
    this.value = normalized;
  }
}
