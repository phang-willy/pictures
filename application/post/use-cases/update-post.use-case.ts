import type { UpdatePostInput } from '@/application/post/dto/update-post.input';
import { assertPostShortDescriptionLength } from '@/application/post/post-short-description.policy';
import { CheckPostDuplicateUseCase } from '@/application/post/use-cases/check-post-duplicate.use-case';
import type { CityRepository } from '@/domain/city/repositories/city.repository';
import { PostEntity } from '@/domain/post/entities/post.entity';
import type { PostRepository } from '@/domain/post/repositories/post.repository';
import { PostSlugVo } from '@/domain/post/value-objects/post-slug.vo';

export class UpdatePostUseCase {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly cityRepository: CityRepository,
    private readonly checkPostDuplicateUseCase: CheckPostDuplicateUseCase,
  ) {}

  async execute(input: UpdatePostInput): Promise<PostEntity> {
    const existing = await this.postRepository.findById(input.id);
    if (!existing) {
      throw new Error('Post not found.');
    }

    const nextCityId = input.cityId?.trim() || existing.city.id;
    const city =
      nextCityId === existing.city.id
        ? existing.city
        : await this.cityRepository.findById(nextCityId);
    if (!city) {
      throw new Error('City not found.');
    }

    const nextName = input.name?.trim() || existing.name;
    const nextSlug = input.slug?.trim().toLowerCase() || existing.slug.value;

    const duplicate = await this.checkPostDuplicateUseCase.execute({
      cityId: nextCityId,
      name: nextName,
      slug: nextSlug,
      excludePostId: existing.id,
    });
    if (duplicate.exists) {
      throw new Error(`Post already exists (conflicting ${duplicate.conflicts.join(', ')}).`);
    }

    const nextDeactivatedAt =
      input.deactivatedAt === undefined
        ? existing.deactivatedAt
        : input.deactivatedAt === null
          ? null
          : new Date(input.deactivatedAt);

    const nextLatitude =
      input.latitude === undefined ? existing.latitude : input.latitude;
    const nextLongitude =
      input.longitude === undefined ? existing.longitude : input.longitude;

    const nextDescription =
      input.description === undefined
        ? existing.description
        : input.description === null
          ? null
          : (() => {
              const t = String(input.description).trim();
              if (!t) {
                return null;
              }
              return assertPostShortDescriptionLength(t);
            })();

    const nextContent =
      input.content === undefined
        ? existing.content
        : input.content === null
          ? null
          : String(input.content).trim() || null;

    const updated = new PostEntity({
      id: existing.id,
      city,
      name: nextName,
      slug: new PostSlugVo(nextSlug),
      description: nextDescription,
      content: nextContent,
      latitude: nextLatitude,
      longitude: nextLongitude,
      deactivatedAt: nextDeactivatedAt,
      createdAt: existing.toPrimitives().createdAt,
      updatedAt: new Date(),
    });
    return this.postRepository.update(updated);
  }
}
