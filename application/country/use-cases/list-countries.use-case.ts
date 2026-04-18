import type { CountryRepository } from '@/domain/country/repositories/country.repository';

export class ListCountriesUseCase {
  constructor(private readonly countryRepository: CountryRepository) {}

  execute(
    mode: 'active' | 'inactive' | 'all' = 'active',
    includeGeometry = false,
    search?: string,
  ) {
    return this.countryRepository.list(mode, includeGeometry, search);
  }
}
