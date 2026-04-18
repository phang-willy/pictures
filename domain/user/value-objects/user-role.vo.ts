import { DomainError } from '@/shared/domain/domain-error';

export type UserRole = 'ADMIN' | 'USER';

export class UserRoleVo {
  public readonly value: UserRole;

  constructor(input: string) {
    if (input !== 'ADMIN' && input !== 'USER') {
      throw new DomainError('USER_INVALID_ROLE', 'Role must be ADMIN or USER.');
    }
    this.value = input;
  }
}
