import type { CreatePostInput } from '@/application/post/dto/create-post.input';
import { assertPostShortDescriptionLength } from '@/application/post/post-short-description.policy';
import { CheckPostDuplicateUseCase } from '@/application/post/use-cases/check-post-duplicate.use-case';
import type { CityRepository } from '@/domain/city/repositories/city.repository';
import { PostEntity } from '@/domain/post/entities/post.entity';
import type { PostRepository } from '@/domain/post/repositories/post.repository';
import { PostSlugVo } from '@/domain/post/value-objects/post-slug.vo';
import { slugify } from '@/domain/utils/slugify';

export class CreatePostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly cityRepository: CityRepository,
    private readonly checkPostDuplicateUseCase: CheckPostDuplicateUseCase,
  ) {}

  async execute(input: CreatePostInput): Promise<PostEntity> {
    const cityId = input.cityId.trim();
    const city = await this.cityRepository.findById(cityId);
    if (!city) {
      throw new Error('City not found.');
    }
    const name = input.name.trim();
    const candidateSlug = slugify(input.slug?.trim() || name);
    const duplicate = await this.checkPostDuplicateUseCase.execute({
      cityId,
      name,
      slug: candidateSlug,
    });
    if (duplicate.exists) {
      throw new Error(`Post already exists (conflicting ${duplicate.conflicts.join(', ')}).`);
    }

    if (input.description === undefined || input.description === null) {
      throw new Error(
        'La description est obligatoire (120 à 160 caractères).',
      );
    }
    const description = assertPostShortDescriptionLength(
      String(input.description),
    );

    const content =
      input.content === undefined
        ? null
        : input.content === null
          ? null
          : String(input.content).trim() || null;

    const now = new Date();
    const entity = new PostEntity({
      id: crypto.randomUUID(),
      city,
      name,
      slug: new PostSlugVo(candidateSlug),
      description,
      content,
      latitude: input.latitude,
      longitude: input.longitude,
      deactivatedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    return this.postRepository.create(entity);
  }
}
