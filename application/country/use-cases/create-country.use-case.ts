import { CountryEntity } from '@/domain/country/entities/country.entity';
import { CountrySlugVo } from '@/domain/country/value-objects/country-slug.vo';
import { Iso2CodeVo } from '@/domain/country/value-objects/iso2-code.vo';
import { Iso3CodeVo } from '@/domain/country/value-objects/iso3-code.vo';
import type { CountryRepository } from '@/domain/country/repositories/country.repository';
import { CreateCountryInput } from '@/application/country/dto/create-country.input';
import { slugify } from '@/domain/utils/slugify';

export class CreateCountryUseCase {
  constructor(private readonly countryRepository: CountryRepository) {}

  async execute(input: CreateCountryInput): Promise<CountryEntity> {
    const name = input.name.trim();
    const candidateSlug = slugify(input.slug?.trim() || name);

    const existingIso2 = await this.countryRepository.findByIso2(input.iso2);
    if (existingIso2) {
      throw new Error('Country with same ISO2 already exists.');
    }
    if (input.iso3) {
      const existingIso3 = await this.countryRepository.findByIso3(input.iso3);
      if (existingIso3) {
        throw new Error('Country with same ISO3 already exists.');
      }
    }
    const existingName = await this.countryRepository.findByNameInsensitive(name);
    if (existingName) {
      throw new Error('Country with same name already exists.');
    }
    const existingSlug = await this.countryRepository.findBySlug(candidateSlug);
    if (existingSlug) {
      throw new Error('Country with same slug already exists.');
    }

    const continent = await this.countryRepository.findContinentById(
      input.continentId,
    );
    if (!continent) {
      throw new Error('Continent not found.');
    }

    const now = new Date();
    const entity = new CountryEntity({
      id: crypto.randomUUID(),
      name,
      iso2: new Iso2CodeVo(input.iso2),
      iso3: input.iso3 ? new Iso3CodeVo(input.iso3) : null,
      slug: new CountrySlugVo(candidateSlug),
      continent,
      geometry: input.geometry ?? null,
      desactivatedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    return this.countryRepository.create(entity);
  }
}
