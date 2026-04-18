import { Injectable } from '@nestjs/common';
import { CityRepository } from '@/domain/city/repositories/city.repository';
import { CityEntity } from '@/domain/city/entities/city.entity';
import { CitySlugVo } from '@/domain/city/value-objects/city-slug.vo';
import { CountryEntity } from '@/domain/country/entities/country.entity';
import { CountrySlugVo } from '@/domain/country/value-objects/country-slug.vo';
import { Iso2CodeVo } from '@/domain/country/value-objects/iso2-code.vo';
import { Iso3CodeVo } from '@/domain/country/value-objects/iso3-code.vo';
import { ContinentEntity } from '@/domain/continent/entities/continent.entity';
import { ContinentCodeVo } from '@/domain/continent/value-objects/continent-code.vo';
import { PrismaService } from '@/infrastructure/database/config/prisma.service';

type CityRow = {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  country: {
    id: string;
    name: string;
    iso2: string;
    iso3: string | null;
    slug: string;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    continent: {
      id: string;
      code: string;
      name: string;
      deletedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    };
  };
};

@Injectable()
export class PrismaCityRepository implements CityRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: CityRow): CityEntity {
    const continent = new ContinentEntity({
      id: row.country.continent.id,
      code: new ContinentCodeVo(row.country.continent.code),
      name: row.country.continent.name,
      deletedAt: row.country.continent.deletedAt,
      createdAt: row.country.continent.createdAt,
      updatedAt: row.country.continent.updatedAt,
    });
    const country = new CountryEntity({
      id: row.country.id,
      name: row.country.name,
      iso2: new Iso2CodeVo(row.country.iso2),
      iso3: row.country.iso3 ? new Iso3CodeVo(row.country.iso3) : null,
      slug: new CountrySlugVo(row.country.slug),
      continent,
      geometry: null,
      deletedAt: row.country.deletedAt,
      createdAt: row.country.createdAt,
      updatedAt: row.country.updatedAt,
    });
    return new CityEntity({
      id: row.id,
      country,
      name: row.name,
      slug: new CitySlugVo(row.slug),
      latitude: row.latitude,
      longitude: row.longitude,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private baseSelect = {
    id: true,
    name: true,
    slug: true,
    latitude: true,
    longitude: true,
    deletedAt: true,
    createdAt: true,
    updatedAt: true,
    country: {
      select: {
        id: true,
        name: true,
        iso2: true,
        iso3: true,
        slug: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        continent: {
          select: {
            id: true,
            code: true,
            name: true,
            deletedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    },
  } as const;

  async create(_city: CityEntity): Promise<CityEntity> {
    throw new Error('Not implemented');
  }

  async update(_city: CityEntity): Promise<CityEntity> {
    throw new Error('Not implemented');
  }

  async findById(id: string): Promise<CityEntity | null> {
    const row = await this.prisma.city.findUnique({
      where: { id },
      select: this.baseSelect,
    });
    return row ? this.toDomain(row as CityRow) : null;
  }

  async list(activeOnly: boolean): Promise<CityEntity[]> {
    const rows = await this.prisma.city.findMany({
      where: activeOnly ? { deletedAt: null } : undefined,
      orderBy: { name: 'asc' },
      select: this.baseSelect,
    });
    return rows.map((row) => this.toDomain(row as CityRow));
  }

  async findByCountryId(countryId: string, activeOnly: boolean): Promise<CityEntity[]> {
    const rows = await this.prisma.city.findMany({
      where: {
        countryId,
        ...(activeOnly ? { deletedAt: null } : {}),
      },
      orderBy: { name: 'asc' },
      select: this.baseSelect,
    });
    return rows.map((row) => this.toDomain(row as CityRow));
  }

  async findBySlug(countryId: string, slug: string): Promise<CityEntity | null> {
    const row = await this.prisma.city.findFirst({
      where: {
        countryId,
        slug: slug.trim().toLowerCase(),
      },
      select: this.baseSelect,
    });
    return row ? this.toDomain(row as CityRow) : null;
  }
}
