import type { CountryRepository } from '@/domain/country/repositories/country.repository';

export class ListContinentsUseCase {
  constructor(private readonly countryRepository: CountryRepository) {}

  execute() {
    return this.countryRepository.listContinentsForSelect();
  }
}
