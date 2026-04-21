import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { CityRepository } from '@/domain/city/repositories/city.repository';

@Injectable()
export class DeleteCityUseCase {
  constructor(private readonly cityRepository: CityRepository) {}

  async execute(id: string): Promise<void> {
    const city = await this.cityRepository.findById(id);
    if (!city) {
      throw new NotFoundException('City not found.');
    }
    await this.cityRepository.deleteById(id);
    const stillExists = await this.cityRepository.findById(id);
    if (stillExists) {
      throw new InternalServerErrorException('City hard delete failed.');
    }
  }
}
