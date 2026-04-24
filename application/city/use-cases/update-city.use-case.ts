import type { UpdateCityInput } from '@/application/city/dto/update-city.input';
import { CheckCityDuplicateUseCase } from '@/application/city/use-cases/check-city-duplicate.use-case';
import { CityEntity } from '@/domain/city/entities/city.entity';
import type { CityRepository } from '@/domain/city/repositories/city.repository';
import { CitySlugVo } from '@/domain/city/value-objects/city-slug.vo';
import type { CountryRepository } from '@/domain/country/repositories/country.repository';

export class UpdateCityUseCase {
  constructor(
    private readonly cityRepository: CityRepository,
    private readonly countryRepository: CountryRepository,
    private readonly checkCityDuplicateUseCase: CheckCityDuplicateUseCase,
  ) {}

  async execute(input: UpdateCityInput): Promise<CityEntity> {
    const existing = await this.cityRepository.findById(input.id);
    if (!existing) {
      throw new Error('City not found.');
    }

    const nextCountryId = input.countryId?.trim() || existing.country.id;
    const country =
      nextCountryId === existing.country.id
        ? existing.country
        : await this.countryRepository.findById(nextCountryId);
    if (!country) {
      throw new Error('Country not found.');
    }

    const nextName = input.name?.trim() || existing.name;
    const nextSlug = input.slug?.trim().toLowerCase() || existing.slug.value;

    const duplicate = await this.checkCityDuplicateUseCase.execute({
      countryId: nextCountryId,
      name: nextName,
      slug: nextSlug,
      excludeCityId: existing.id,
    });
    if (duplicate.exists) {
      throw new Error(`City already exists (conflicting ${duplicate.conflicts.join(', ')}).`);
    }

    const nextdeactivatedAt =
      input.deactivatedAt === undefined
        ? existing.deactivatedAt
        : input.deactivatedAt === null
          ? null
          : new Date(input.deactivatedAt);

    const nextLatitude =
      input.latitude === undefined ? existing.latitude : input.latitude;
    const nextLongitude =
      input.longitude === undefined ? existing.longitude : input.longitude;

    const updated = new CityEntity({
      id: existing.id,
      country,
      name: nextName,
      slug: new CitySlugVo(nextSlug),
      latitude: nextLatitude,
      longitude: nextLongitude,
      deactivatedAt: nextdeactivatedAt,
      createdAt: existing.toPrimitives().createdAt,
      updatedAt: new Date(),
    });
    return this.cityRepository.update(updated);
  }
}
