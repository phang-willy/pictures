import type { CityRepository } from '@/domain/city/repositories/city.repository';

export class GetCityByIdUseCase {
  constructor(private readonly cityRepository: CityRepository) {}

  execute(id: string) {
    return this.cityRepository.findById(id);
  }
}
