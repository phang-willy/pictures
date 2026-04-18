import type { CityRepository } from '@/domain/city/repositories/city.repository';

export class ListCitiesUseCase {
  constructor(private readonly cityRepository: CityRepository) {}

  execute(options: { activeOnly?: boolean; countryId?: string } = {}) {
    const activeOnly = options.activeOnly ?? false;
    if (options.countryId) {
      return this.cityRepository.findByCountryId(options.countryId, activeOnly);
    }
    return this.cityRepository.list(activeOnly);
  }
}
