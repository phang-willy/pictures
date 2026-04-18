import { ContinentEntity } from '@/domain/continent/entities/continent.entity';

export interface ContinentRepository {
  create(continent: ContinentEntity): Promise<ContinentEntity>;
  update(continent: ContinentEntity): Promise<ContinentEntity>;
  findById(id: string): Promise<ContinentEntity | null>;
  findByCode(code: string): Promise<ContinentEntity | null>;
  findByNameInsensitive(name: string): Promise<ContinentEntity | null>;
  list(activeOnly: boolean): Promise<ContinentEntity[]>;
}
