import { CountryEntity } from '@/domain/country/entities/country.entity';
import { ContinentEntity } from '@/domain/continent/entities/continent.entity';

export interface CountryRepository {
  create(country: CountryEntity): Promise<CountryEntity>;
  update(country: CountryEntity): Promise<CountryEntity>;
  findById(id: string): Promise<CountryEntity | null>;
  findContinentById(id: string): Promise<ContinentEntity | null>;
  findByIso2(iso2: string): Promise<CountryEntity | null>;
  findByIso3(iso3: string): Promise<CountryEntity | null>;
  findBySlug(slug: string): Promise<CountryEntity | null>;
  findByNameInsensitive(name: string): Promise<CountryEntity | null>;
  deleteById(id: string): Promise<void>;
  list(
    mode: 'active' | 'inactive' | 'all',
    includeGeometry: boolean,
    search?: string,
  ): Promise<CountryEntity[]>;
  listContinentsForSelect(): Promise<Array<{ id: string; code: string; name: string }>>;
}
