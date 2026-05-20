import type { CountryRepository } from '@/domain/country/repositories/country.repository';

/** Paramètre `GET /country/:id` : UUID ou slug stocké en base. */
const UUID_PARAM_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class GetCountryByIdUseCase {
  constructor(private readonly countryRepository: CountryRepository) {}

  execute(idOrSlug: string) {
    const key = idOrSlug.trim();
    if (!key) {
      return Promise.resolve(null);
    }
    if (UUID_PARAM_RE.test(key)) {
      return this.countryRepository.findById(key);
    }
    return this.countryRepository.findBySlug(key);
  }
}
