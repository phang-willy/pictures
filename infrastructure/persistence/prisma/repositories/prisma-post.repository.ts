import { Injectable } from '@nestjs/common';
import { CityEntity } from '@/domain/city/entities/city.entity';
import { CitySlugVo } from '@/domain/city/value-objects/city-slug.vo';
import { ContinentEntity } from '@/domain/continent/entities/continent.entity';
import { ContinentCodeVo } from '@/domain/continent/value-objects/continent-code.vo';
import { CountryEntity } from '@/domain/country/entities/country.entity';
import { CountrySlugVo } from '@/domain/country/value-objects/country-slug.vo';
import { Iso2CodeVo } from '@/domain/country/value-objects/iso2-code.vo';
import { Iso3CodeVo } from '@/domain/country/value-objects/iso3-code.vo';
import { PostEntity } from '@/domain/post/entities/post.entity';
import type { PostRepository } from '@/domain/post/repositories/post.repository';
import { PostSlugVo } from '@/domain/post/value-objects/post-slug.vo';
import { PrismaService } from '@/infrastructure/database/config/prisma.service';

type CityNestedRow = {
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

type PostRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  content: string | null;
  latitude: number;
  longitude: number;
  deactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  city: CityNestedRow;
};

@Injectable()
export class PrismaPostRepository implements PostRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapCity(row: CityNestedRow): CityEntity {
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

  private toDomain(row: PostRow): PostEntity {
    return new PostEntity({
      id: row.id,
      city: this.mapCity(row.city),
      name: row.name,
      slug: new PostSlugVo(row.slug),
      description: row.description,
      content: row.content,
      latitude: row.latitude,
      longitude: row.longitude,
      deactivatedAt: row.deactivatedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private readonly baseSelect = {
    id: true,
    name: true,
    slug: true,
    description: true,
    content: true,
    latitude: true,
    longitude: true,
    deactivatedAt: true,
    createdAt: true,
    updatedAt: true,
    city: {
      select: {
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
      },
    },
  } as const;

  async create(_post: PostEntity): Promise<PostEntity> {
    const p = _post.toPrimitives();
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.post.create({
        data: {
          id: p.id,
          cityId: p.city.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          content: p.content,
          latitude: p.latitude,
          longitude: p.longitude,
          deactivatedAt: p.deactivatedAt,
        },
      });
      await tx.$executeRaw`
        UPDATE "Post"
        SET "location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography
        WHERE "id" = ${p.id}
      `;
      return tx.post.findUnique({
        where: { id: p.id },
        select: this.baseSelect,
      });
    });
    if (!row) {
      throw new Error('Post creation failed.');
    }
    return this.toDomain(row as PostRow);
  }

  async update(_post: PostEntity): Promise<PostEntity> {
    const p = _post.toPrimitives();
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id: p.id },
        data: {
          cityId: p.city.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          content: p.content,
          latitude: p.latitude,
          longitude: p.longitude,
          deactivatedAt: p.deactivatedAt,
        },
      });
      await tx.$executeRaw`
        UPDATE "Post"
        SET "location" = ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography
        WHERE "id" = ${p.id}
      `;
      return tx.post.findUnique({
        where: { id: p.id },
        select: this.baseSelect,
      });
    });
    if (!row) {
      throw new Error('Post update failed.');
    }
    return this.toDomain(row as PostRow);
  }

  async findById(id: string): Promise<PostEntity | null> {
    const row = await this.prisma.post.findUnique({
      where: { id },
      select: this.baseSelect,
    });
    return row ? this.toDomain(row as PostRow) : null;
  }

  async list(activeOnly: boolean): Promise<PostEntity[]> {
    const rows = await this.prisma.post.findMany({
      where: {
        ...(activeOnly ? { deactivatedAt: null } : {}),
      },
      orderBy: { name: 'asc' },
      select: this.baseSelect,
    });
    return rows.map((row: PostRow) => this.toDomain(row));
  }

  async findByCityId(cityId: string, activeOnly: boolean): Promise<PostEntity[]> {
    const rows = await this.prisma.post.findMany({
      where: {
        cityId,
        ...(activeOnly ? { deactivatedAt: null } : {}),
      },
      orderBy: { name: 'asc' },
      select: this.baseSelect,
    });
    return rows.map((row: PostRow) => this.toDomain(row));
  }

  async findByCountryId(countryId: string, activeOnly: boolean): Promise<PostEntity[]> {
    const rows = await this.prisma.post.findMany({
      where: {
        city: { countryId },
        ...(activeOnly ? { deactivatedAt: null } : {}),
      },
      orderBy: { name: 'asc' },
      select: this.baseSelect,
    });
    return rows.map((row: PostRow) => this.toDomain(row));
  }

  async findByNameInsensitive(cityId: string, name: string): Promise<PostEntity | null> {
    const row = await this.prisma.post.findFirst({
      where: {
        cityId,
        name: { equals: name.trim(), mode: 'insensitive' },
      },
      select: this.baseSelect,
    });
    return row ? this.toDomain(row as PostRow) : null;
  }

  async findBySlug(cityId: string, slug: string): Promise<PostEntity | null> {
    const row = await this.prisma.post.findFirst({
      where: {
        cityId,
        slug: slug.trim().toLowerCase(),
      },
      select: this.baseSelect,
    });
    return row ? this.toDomain(row as PostRow) : null;
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const count = await tx.photo.count({ where: { postId: id } });
      if (count > 0) {
        throw new Error('Post cannot be deleted while it still has photos.');
      }
      await tx.post.delete({ where: { id } });
    });
  }
}
