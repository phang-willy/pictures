import type { PostRepository } from '@/domain/post/repositories/post.repository';

export class GetPostByIdUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  execute(id: string) {
    return this.postRepository.findById(id);
  }
}
