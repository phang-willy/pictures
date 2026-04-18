import { CityEntity } from '@/domain/city/entities/city.entity';

export interface CityRepository {
  create(city: CityEntity): Promise<CityEntity>;
  update(city: CityEntity): Promise<CityEntity>;
  findById(id: string): Promise<CityEntity | null>;
  list(activeOnly: boolean): Promise<CityEntity[]>;
  findByCountryId(countryId: string, activeOnly: boolean): Promise<CityEntity[]>;
  findBySlug(countryId: string, slug: string): Promise<CityEntity | null>;
}
