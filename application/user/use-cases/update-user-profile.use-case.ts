import { UserEmailVo } from '@/domain/user/value-objects/user-email.vo';
import type { UserRepository } from '@/domain/user/repositories/user.repository';

export type UpdateUserProfileInput = {
  id: string;
  email?: string;
};

export class UpdateUserProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateUserProfileInput) {
    const user = await this.userRepository.findById(input.id);
    if (!user) {
      throw new Error('User not found.');
    }

    if (!input.email) {
      return user;
    }

    return this.userRepository.update(user.withEmail(new UserEmailVo(input.email)));
  }
}
