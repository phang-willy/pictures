import type { UserRepository } from '@/domain/user/repositories/user.repository';
import { UserRoleVo } from '@/domain/user/value-objects/user-role.vo';

export class ChangeUserRoleUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string, role: 'ADMIN' | 'USER') {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found.');
    }
    return this.userRepository.update(user.withRole(new UserRoleVo(role)));
  }
}
