import { DomainError } from '@/shared/domain/domain-error';

export class UserEmailVo {
  public readonly value: string;

  constructor(input: string) {
    const normalized = input.trim().toLowerCase();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
    if (!isValid) {
      throw new DomainError('USER_INVALID_EMAIL', 'Email is invalid.');
    }
    this.value = normalized;
  }
}
