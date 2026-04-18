import type { CountryRepository } from '@/domain/country/repositories/country.repository';

export class GetCountryByIdUseCase {
  constructor(private readonly countryRepository: CountryRepository) {}

  execute(id: string) {
    return this.countryRepository.findById(id);
  }
}
