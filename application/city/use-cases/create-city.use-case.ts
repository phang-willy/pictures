import type { CreateCityInput } from '@/application/city/dto/create-city.input';
import { CheckCityDuplicateUseCase } from '@/application/city/use-cases/check-city-duplicate.use-case';
import { CityEntity } from '@/domain/city/entities/city.entity';
import type { CityRepository } from '@/domain/city/repositories/city.repository';
import { CitySlugVo } from '@/domain/city/value-objects/city-slug.vo';
import type { CountryRepository } from '@/domain/country/repositories/country.repository';
import { slugify } from '@/domain/utils/slugify';

export class CreateCityUseCase {
  constructor(
    private readonly cityRepository: CityRepository,
    private readonly countryRepository: CountryRepository,
    private readonly checkCityDuplicateUseCase: CheckCityDuplicateUseCase,
  ) {}

  async execute(input: CreateCityInput): Promise<CityEntity> {
    const countryId = input.countryId.trim();
    const country = await this.countryRepository.findById(countryId);
    if (!country) {
      throw new Error('Country not found.');
    }
    const name = input.name.trim();
    const candidateSlug = slugify(input.slug?.trim() || name);
    const duplicate = await this.checkCityDuplicateUseCase.execute({
      countryId,
      name,
      slug: candidateSlug,
    });
    if (duplicate.exists) {
      throw new Error(`City already exists (conflicting ${duplicate.conflicts.join(', ')}).`);
    }

    const now = new Date();
    const entity = new CityEntity({
      id: crypto.randomUUID(),
      country,
      name,
      slug: new CitySlugVo(candidateSlug),
      latitude: input.latitude,
      longitude: input.longitude,
      deactivatedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    return this.cityRepository.create(entity);
  }
}
