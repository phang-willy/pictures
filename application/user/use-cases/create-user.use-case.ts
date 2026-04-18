import { UserEntity } from '@/domain/user/entities/user.entity';
import { PasswordHashVo } from '@/domain/user/value-objects/password-hash.vo';
import { UserEmailVo } from '@/domain/user/value-objects/user-email.vo';
import { UserRoleVo } from '@/domain/user/value-objects/user-role.vo';
import type { UserRepository } from '@/domain/user/repositories/user.repository';

export type CreateUserInput = {
  email: string;
  passwordHash: string;
  role?: 'ADMIN' | 'USER';
};

export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: CreateUserInput): Promise<UserEntity> {
    const now = new Date();
    const entity = new UserEntity({
      id: crypto.randomUUID(),
      email: new UserEmailVo(input.email),
      role: new UserRoleVo(input.role ?? 'USER'),
      passwordHash: new PasswordHashVo(input.passwordHash),
      isActive: true,
      verifiedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    return this.userRepository.create(entity);
  }
}
