import { CountryEntity } from '@/domain/country/entities/country.entity';
import { CountrySlugVo } from '@/domain/country/value-objects/country-slug.vo';
import { Iso2CodeVo } from '@/domain/country/value-objects/iso2-code.vo';
import { Iso3CodeVo } from '@/domain/country/value-objects/iso3-code.vo';
import type { CountryRepository } from '@/domain/country/repositories/country.repository';
import { UpdateCountryInput } from '@/application/country/dto/update-country.input';
import { CheckCountryDuplicateUseCase } from '@/application/country/use-cases/check-country-duplicate.use-case';

export class UpdateCountryUseCase {
  constructor(
    private readonly countryRepository: CountryRepository,
    private readonly checkCountryDuplicateUseCase: CheckCountryDuplicateUseCase,
  ) {}

  async execute(input: UpdateCountryInput): Promise<CountryEntity> {
    const existing = await this.countryRepository.findById(input.id);
    if (!existing) {
      throw new Error('Country not found.');
    }

    const nextContinentId = input.continentId ?? existing.continent.id;
    let continent = existing.continent;
    if (nextContinentId !== existing.continent.id) {
      const next = await this.countryRepository.findContinentById(
        nextContinentId,
      );
      if (!next) {
        throw new Error('Continent not found.');
      }
      continent = next;
    }

    const persisted = existing.toPrimitives();

    const nextName = input.name !== undefined ? input.name.trim() : existing.name;
    const nextIso2Str =
      input.iso2 !== undefined
        ? input.iso2.trim().toUpperCase()
        : existing.iso2.value;
    let nextIso3ForCheck: string;
    if (input.iso3 === undefined) {
      nextIso3ForCheck = existing.iso3?.value ?? '';
    } else if (input.iso3 === null || input.iso3 === '') {
      nextIso3ForCheck = '';
    } else {
      nextIso3ForCheck = input.iso3.trim().toUpperCase();
    }
    const nextSlugStr =
      input.slug !== undefined
        ? input.slug.trim().toLowerCase()
        : existing.slug.value;

    const duplicate = await this.checkCountryDuplicateUseCase.execute({
      name: nextName,
      iso2: nextIso2Str,
      iso3: nextIso3ForCheck || undefined,
      slug: nextSlugStr,
      excludeCountryId: input.id,
    });
    if (duplicate.exists) {
      const fields = duplicate.conflicts.join(', ');
      throw new Error(
        `Country already exists (conflicting ${fields}).`,
      );
    }

    const nextDeletedAt =
      input.deletedAt === undefined
        ? persisted.deletedAt
        : input.deletedAt === null
          ? null
          : new Date(input.deletedAt);

    const updated = new CountryEntity({
      id: existing.id,
      name: nextName,
      iso2: input.iso2 !== undefined ? new Iso2CodeVo(input.iso2) : existing.iso2,
      iso3:
        input.iso3 === undefined
          ? existing.iso3
          : input.iso3
            ? new Iso3CodeVo(input.iso3)
            : null,
      slug: input.slug !== undefined ? new CountrySlugVo(input.slug) : existing.slug,
      continent,
      geometry:
        input.geometry === undefined ? existing.geometry : input.geometry,
      deletedAt: nextDeletedAt,
      createdAt: persisted.createdAt,
      updatedAt: new Date(),
    });

    return this.countryRepository.update(updated);
  }
}
