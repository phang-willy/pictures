import { Injectable, NotFoundException } from '@nestjs/common';
import type { CountryRepository } from '@/domain/country/repositories/country.repository';

@Injectable()
export class DeleteCountryUseCase {
  constructor(private readonly countryRepository: CountryRepository) {}

  async execute(id: string): Promise<void> {
    const country = await this.countryRepository.findById(id);
    if (!country) {
      throw new NotFoundException('Country not found.');
    }
    await this.countryRepository.deleteById(id);
  }
}
