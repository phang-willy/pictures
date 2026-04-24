import { describe, expect, it, vi } from 'vitest';

import { CheckPostDuplicateUseCase } from './check-post-duplicate.use-case';

describe('CheckPostDuplicateUseCase', () => {
  it('returns exists false when no conflicts', async () => {
    const postRepository = {
      findByNameInsensitive: vi.fn(async () => null),
      findBySlug: vi.fn(async () => null),
    };

    const useCase = new CheckPostDuplicateUseCase(postRepository as any);
    const result = await useCase.execute({
      cityId: 'city-1',
      name: 'My Post',
      slug: 'my-post',
    });

    expect(result).toEqual({ exists: false, conflicts: [], match: undefined });
  });

  it('detects name conflict', async () => {
    const postRepository = {
      findByNameInsensitive: vi.fn(async () => ({
        id: 'p1',
        toPrimitives: () => ({ id: 'p1', name: 'My Post', slug: 'other-slug' }),
      })),
      findBySlug: vi.fn(async () => null),
    };

    const useCase = new CheckPostDuplicateUseCase(postRepository as any);
    const result = await useCase.execute({
      cityId: 'city-1',
      name: 'My Post',
      slug: 'unique-slug',
    });

    expect(result.exists).toBe(true);
    expect(result.conflicts).toContain('name');
    expect(result.match).toEqual({ id: 'p1', name: 'My Post', slug: 'other-slug' });
  });

  it('ignores excluded post id', async () => {
    const postRepository = {
      findByNameInsensitive: vi.fn(async () => ({
        id: 'p1',
        toPrimitives: () => ({ id: 'p1', name: 'Same', slug: 'same' }),
      })),
      findBySlug: vi.fn(async () => null),
    };

    const useCase = new CheckPostDuplicateUseCase(postRepository as any);
    const result = await useCase.execute({
      cityId: 'city-1',
      name: 'Same',
      slug: 'same',
      excludePostId: 'p1',
    });

    expect(result.exists).toBe(false);
  });
});
