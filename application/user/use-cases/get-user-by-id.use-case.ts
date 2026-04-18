import type { UserRepository } from '@/domain/user/repositories/user.repository';

export class GetUserByIdUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  execute(id: string) {
    return this.userRepository.findById(id);
  }
}
