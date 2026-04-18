import type { CountryRepository } from '@/domain/country/repositories/country.repository';
import { CountryExistsOutput } from '@/application/country/dto/country-exists.output';

type Input = {
  iso2?: string;
  iso3?: string;
  name: string;
  slug?: string;
  /** Si défini, les enregistrements avec cet ID ne comptent pas comme doublon (édition d’un pays existant). */
  excludeCountryId?: string;
};

export class CheckCountryDuplicateUseCase {
  constructor(private readonly countryRepository: CountryRepository) {}

  async execute(input: Input): Promise<CountryExistsOutput> {
    const excludeId = input.excludeCountryId?.trim();
    const iso2 = (input.iso2 ?? '').trim().toUpperCase();
    const iso3 = (input.iso3 ?? '').trim().toUpperCase();
    const conflicts: CountryExistsOutput['conflicts'] = [];
    let match: CountryExistsOutput['match'] | undefined;

    const isOtherCountry = (id: string) => !excludeId || id !== excludeId;

    if (iso2.length === 2) {
      const byIso2 = await this.countryRepository.findByIso2(iso2);
      if (byIso2 && isOtherCountry(byIso2.id)) {
        conflicts.push('iso2');
        const p = byIso2.toPrimitives();
        match = { id: p.id, name: p.name, iso2: p.iso2, iso3: p.iso3 };
      }
    }

    if (iso3.length === 3) {
      const byIso3 = await this.countryRepository.findByIso3(iso3);
      if (byIso3 && isOtherCountry(byIso3.id)) {
        conflicts.push('iso3');
        if (!match) {
          const p = byIso3.toPrimitives();
          match = { id: p.id, name: p.name, iso2: p.iso2, iso3: p.iso3 };
        }
      }
    }

    const nameTrimmed = input.name.trim();
    if (nameTrimmed) {
      const byName = await this.countryRepository.findByNameInsensitive(nameTrimmed);
      if (byName && isOtherCountry(byName.id)) {
        conflicts.push('name');
        if (!match) {
          const p = byName.toPrimitives();
          match = { id: p.id, name: p.name, iso2: p.iso2, iso3: p.iso3 };
        }
      }
    }

    const slugNorm = input.slug?.trim().toLowerCase();
    if (slugNorm) {
      const bySlug = await this.countryRepository.findBySlug(slugNorm);
      if (bySlug && isOtherCountry(bySlug.id)) {
        conflicts.push('slug');
        if (!match) {
          const p = bySlug.toPrimitives();
          match = { id: p.id, name: p.name, iso2: p.iso2, iso3: p.iso3 };
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
