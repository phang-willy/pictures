import { describe, expect, it, vi } from 'vitest';

import { CreateCountryUseCase } from './create-country.use-case';
import { ContinentEntity } from '@/domain/continent/entities/continent.entity';
import { ContinentCodeVo } from '@/domain/continent/value-objects/continent-code.vo';

describe('CreateCountryUseCase', () => {
  it('creates country with generated slug when slug is missing', async () => {
    const created = { id: 'c1' };
    const continent = new ContinentEntity({
      id: 'cont-1',
      code: new ContinentCodeVo('AF'),
      name: 'Africa',
      deactivatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const repository = {
      findByIso2: vi.fn(async () => null),
      findByIso3: vi.fn(async () => null),
      findByNameInsensitive: vi.fn(async () => null),
      findBySlug: vi.fn(async () => null),
      findContinentById: vi.fn(async () => continent),
      create: vi.fn(async () => created),
    };

    const useCase = new CreateCountryUseCase(repository as any);
    const result = await useCase.execute({
      name: 'Cote d Ivoire',
      iso2: 'ci',
      continentId: 'cont-1',
    });

    expect(result).toBe(created);
    expect(repository.create).toHaveBeenCalledTimes(1);
    const passedEntity = (repository as any).create.mock.calls[0][0] as {
      toPrimitives: () => { slug: string };
    };
    expect(passedEntity.toPrimitives().slug).toBe('cote-d-ivoire');
  });
});
