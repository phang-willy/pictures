import type { CityRepository } from '@/domain/city/repositories/city.repository';
import type { CityExistsOutput } from '@/application/city/dto/city-exists.output';

type Input = {
  countryId: string;
  name: string;
  slug?: string;
  excludeCityId?: string;
};

export class CheckCityDuplicateUseCase {
  constructor(private readonly cityRepository: CityRepository) {}

  async execute(input: Input): Promise<CityExistsOutput> {
    const excludeId = input.excludeCityId?.trim();
    const countryId = input.countryId.trim();
    const conflicts: CityExistsOutput['conflicts'] = [];
    let match: CityExistsOutput['match'] | undefined;
    const isOtherCity = (id: string) => !excludeId || id !== excludeId;

    const name = input.name.trim();
    if (name) {
      const byName = await this.cityRepository.findByNameInsensitive(countryId, name);
      if (byName && isOtherCity(byName.id)) {
        conflicts.push('name');
        const p = byName.toPrimitives();
        match = { id: p.id, name: p.name, slug: p.slug };
      }
    }

    const slug = input.slug?.trim().toLowerCase();
    if (slug) {
      const bySlug = await this.cityRepository.findBySlug(countryId, slug);
      if (bySlug && isOtherCity(bySlug.id)) {
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
