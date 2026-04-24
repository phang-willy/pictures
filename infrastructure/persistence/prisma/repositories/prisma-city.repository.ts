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
  deactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  country: {
    id: string;
    name: string;
    iso2: string;
    iso3: string | null;
    slug: string;
    deactivatedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    continent: {
      id: string;
      code: string;
      name: string;
      deactivatedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    };
  };
};

@Injectable()
export class PrismaCityRepository implements CityRepository {
  private static readonly NULL_UUID = '00000000-0000-0000-0000-000000000000';

  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: CityRow): CityEntity {
    const continent = new ContinentEntity({
      id: row.country.continent.id,
      code: new ContinentCodeVo(row.country.continent.code),
      name: row.country.continent.name,
      deactivatedAt: row.country.continent.deactivatedAt,
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
      deactivatedAt: row.country.deactivatedAt,
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
      deactivatedAt: row.deactivatedAt,
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
    deactivatedAt: true,
    createdAt: true,
    updatedAt: true,
    country: {
      select: {
        id: true,
        name: true,
        iso2: true,
        iso3: true,
        slug: true,
        deactivatedAt: true,
        createdAt: true,
        updatedAt: true,
        continent: {
          select: {
            id: true,
            code: true,
            name: true,
            deactivatedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    },
  } as const;

  async create(_city: CityEntity): Promise<CityEntity> {
    const p = _city.toPrimitives();
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.city.create({
        data: {
          id: p.id,
          countryId: p.country.id,
          name: p.name,
          slug: p.slug,
          latitude: p.latitude,
          longitude: p.longitude,
          deactivatedAt: p.deactivatedAt,
        },
      });
      await tx.$executeRaw`
        UPDATE "City"
        SET "location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography
        WHERE "id" = ${p.id}
      `;
      return tx.city.findUnique({
        where: { id: p.id },
        select: this.baseSelect,
      });
    });
    if (!row) {
      throw new Error('City creation failed.');
    }
    return this.toDomain(row as CityRow);
  }

  async update(_city: CityEntity): Promise<CityEntity> {
    const p = _city.toPrimitives();
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.city.update({
        where: { id: p.id },
        data: {
          countryId: p.country.id,
          name: p.name,
          slug: p.slug,
          latitude: p.latitude,
          longitude: p.longitude,
          deactivatedAt: p.deactivatedAt,
        },
      });
      await tx.$executeRaw`
        UPDATE "City"
        SET "location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography
        WHERE "id" = ${p.id}
      `;
      return tx.city.findUnique({
        where: { id: p.id },
        select: this.baseSelect,
      });
    });
    if (!row) {
      throw new Error('City update failed.');
    }
    return this.toDomain(row as CityRow);
  }

  async findById(id: string): Promise<CityEntity | null> {
    if (id === PrismaCityRepository.NULL_UUID) {
      return null;
    }
    const row = await this.prisma.city.findUnique({
      where: { id },
      select: this.baseSelect,
    });
    return row ? this.toDomain(row as CityRow) : null;
  }

  async list(activeOnly: boolean): Promise<CityEntity[]> {
    const rows = await this.prisma.city.findMany({
      where: {
        id: { not: PrismaCityRepository.NULL_UUID },
        ...(activeOnly ? { deactivatedAt: null } : {}),
      },
      orderBy: { name: 'asc' },
      select: this.baseSelect,
    });
    return rows.map((row) => this.toDomain(row as CityRow));
  }

  async findByCountryId(countryId: string, activeOnly: boolean): Promise<CityEntity[]> {
    const rows = await this.prisma.city.findMany({
      where: {
        id: { not: PrismaCityRepository.NULL_UUID },
        countryId,
        ...(activeOnly ? { deactivatedAt: null } : {}),
      },
      orderBy: { name: 'asc' },
      select: this.baseSelect,
    });
    return rows.map((row) => this.toDomain(row as CityRow));
  }

  async findByNameInsensitive(countryId: string, name: string): Promise<CityEntity | null> {
    const row = await this.prisma.city.findFirst({
      where: {
        id: { not: PrismaCityRepository.NULL_UUID },
        countryId,
        name: { equals: name.trim(), mode: 'insensitive' },
      },
      select: this.baseSelect,
    });
    return row ? this.toDomain(row as CityRow) : null;
  }

  async findBySlug(countryId: string, slug: string): Promise<CityEntity | null> {
    const row = await this.prisma.city.findFirst({
      where: {
        id: { not: PrismaCityRepository.NULL_UUID },
        countryId,
        slug: slug.trim().toLowerCase(),
      },
      select: this.baseSelect,
    });
    return row ? this.toDomain(row as CityRow) : null;
  }

  async deleteById(id: string): Promise<void> {
    const nullId = PrismaCityRepository.NULL_UUID;
    if (id === nullId) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.continent.upsert({
        where: { id: nullId },
        create: {
          id: nullId,
          code: 'NONE',
          name: 'Aucun continent',
        },
        update: {},
      });

      await tx.country.upsert({
        where: { id: nullId },
        create: {
          id: nullId,
          continentId: nullId,
          iso2: 'ZZ',
          iso3: 'ZZZ',
          name: 'Aucun pays',
          slug: 'no-country',
        },
        update: {},
      });

      await tx.city.upsert({
        where: { id: nullId },
        create: {
          id: nullId,
          countryId: nullId,
          name: 'Aucune ville',
          slug: 'no-city',
          latitude: 0,
          longitude: 0,
        },
        update: {},
      });

      const postsToRelink = await tx.post.findMany({
        where: { cityId: id },
        select: { id: true },
      });

      for (const post of postsToRelink) {
        await tx.post.update({
          where: { id: post.id },
          data: {
            cityId: nullId,
            // Evite les collisions sur la contrainte unique (cityId, slug)
            // quand plusieurs villes supprimées contiennent le meme slug.
            slug: `orphan-${post.id}`,
          },
        });
      }

      await tx.city.delete({ where: { id } });
    });
  }
}
