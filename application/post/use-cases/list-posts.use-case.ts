import type { PostRepository } from '@/domain/post/repositories/post.repository';

export class ListPostsUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  execute(options: { activeOnly?: boolean; cityId?: string } = {}) {
    const activeOnly = options.activeOnly ?? false;
    if (options.cityId) {
      return this.postRepository.findByCityId(options.cityId, activeOnly);
    }
    return this.postRepository.list(activeOnly);
  }
}
