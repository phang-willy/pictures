import type { PostExistsOutput } from '@/application/post/dto/post-exists.output';
import type { PostRepository } from '@/domain/post/repositories/post.repository';

type Input = {
  cityId: string;
  name: string;
  slug?: string;
  excludePostId?: string;
};

export class CheckPostDuplicateUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(input: Input): Promise<PostExistsOutput> {
    const excludeId = input.excludePostId?.trim();
    const cityId = input.cityId.trim();
    const conflicts: PostExistsOutput['conflicts'] = [];
    let match: PostExistsOutput['match'] | undefined;
    const isOtherPost = (id: string) => !excludeId || id !== excludeId;

    const name = input.name.trim();
    if (name) {
      const byName = await this.postRepository.findByNameInsensitive(cityId, name);
      if (byName && isOtherPost(byName.id)) {
        conflicts.push('name');
        const p = byName.toPrimitives();
        match = { id: p.id, name: p.name, slug: p.slug };
      }
    }

    const slug = input.slug?.trim().toLowerCase();
    if (slug) {
      const bySlug = await this.postRepository.findBySlug(cityId, slug);
      if (bySlug && isOtherPost(bySlug.id)) {
        conflicts.push('slug');
        if (!match) {
          const p = bySlug.toPrimitives();
          match = { id: p.id, name: p.name, slug: p.slug };
        }
      }
    }

    return {
      exists: conflicts.length > 0,
      conflicts,
      match,
    };
  }
}
