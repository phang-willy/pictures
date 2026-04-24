import type { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { CountryRepository } from '@/domain/country/repositories/country.repository';
import { CountryEntity } from '@/domain/country/entities/country.entity';
import { ContinentEntity } from '@/domain/continent/entities/continent.entity';
import { ContinentCodeVo } from '@/domain/continent/value-objects/continent-code.vo';
import { CountrySlugVo } from '@/domain/country/value-objects/country-slug.vo';
import { Iso2CodeVo } from '@/domain/country/value-objects/iso2-code.vo';
import { Iso3CodeVo } from '@/domain/country/value-objects/iso3-code.vo';
import { PrismaService } from '@/infrastructure/database/config/prisma.service';

@Injectable()
export class PrismaCountryRepository implements CountryRepository {
  private static readonly NULL_UUID = '00000000-0000-0000-0000-000000000000';

  constructor(private readonly prisma: PrismaService) {}

  private continentRowToDomain(row: {
    id: string;
    code: string;
    name: string;
    deactivatedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): ContinentEntity {
    return new ContinentEntity({
      id: row.id,
      code: new ContinentCodeVo(row.code),
      name: row.name,
      deactivatedAt: row.deactivatedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toDomain(row: {
    id: string;
    name: string;
    iso2: string;
    iso3: string | null;
    slug: string;
    continentId: string;
    continent: {
      id: string;
      code: string;
      name: string;
      deactivatedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    };
    deactivatedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    geometry?: {
      type: string;
      coordinate: unknown;
    } | null;
  }): CountryEntity {
    return new CountryEntity({
      id: row.id,
      name: row.name,
      iso2: new Iso2CodeVo(row.iso2),
      iso3: row.iso3 ? new Iso3CodeVo(row.iso3) : null,
      slug: new CountrySlugVo(row.slug),
      continent: this.continentRowToDomain(row.continent),
      geometry: row.geometry
        ? {
            type:
              row.geometry.type === 'MultiPolygon'
                ? 'MultiPolygon'
                : 'Polygon',
            coordinate: row.geometry.coordinate,
          }
        : null,
      deactivatedAt: row.deactivatedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async create(country: CountryEntity): Promise<CountryEntity> {
    const data = country.toPrimitives();
    const row = await this.prisma.country.create({
      data: {
        id: data.id,
        name: data.name,
        iso2: data.iso2,
        iso3: data.iso3,
        slug: data.slug,
        continentId: data.continent.id,
        ...(data.geometry
          ? {
              geometry: {
                create: {
                  type: data.geometry.type,
                  coordinate: data.geometry.coordinate as any,
                },
              },
            }
          : {}),
      },
      include: {
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
        geometry: {
          select: { type: true, coordinate: true },
        },
      },
    });
    return this.toDomain(row);
  }

  async update(country: CountryEntity): Promise<CountryEntity> {
    const data = country.toPrimitives();
    const row = await this.prisma.country.update({
      where: { id: data.id },
      data: {
        name: data.name,
        iso2: data.iso2,
        iso3: data.iso3,
        slug: data.slug,
        continentId: data.continent.id,
        deactivatedAt: data.deactivatedAt,
        ...(data.geometry === null
          ? { geometry: { deleteMany: {} } }
          : data.geometry
            ? {
                geometry: {
                  upsert: {
                    create: {
                      type: data.geometry.type,
                      coordinate: data.geometry.coordinate as any,
                    },
                    update: {
                      type: data.geometry.type,
                      coordinate: data.geometry.coordinate as any,
                    },
                  },
                },
              }
            : {}),
      },
      include: {
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
        geometry: {
          select: { type: true, coordinate: true },
        },
      },
    });
    return this.toDomain(row);
  }

  async findById(id: string) {
    if (id === PrismaCountryRepository.NULL_UUID) {
      return null;
    }
    const row = await this.prisma.country.findUnique({
      where: { id },
      include: {
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
        geometry: {
          select: { type: true, coordinate: true },
        },
      },
    });
    return row ? this.toDomain(row) : null;
  }

  async findContinentById(id: string) {
    const row = await this.prisma.continent.findUnique({
      where: { id },
    });
    return row ? this.continentRowToDomain(row) : null;
  }

  async findByIso2(iso2: string) {
    const row = await this.prisma.country.findUnique({
      where: { iso2: iso2.trim().toUpperCase() },
      include: {
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
    });
    if (!row || row.id === PrismaCountryRepository.NULL_UUID) {
      return null;
    }
    return this.toDomain(row);
  }

  async findByIso3(iso3: string) {
    const row = await this.prisma.country.findFirst({
      where: {
        id: { not: PrismaCountryRepository.NULL_UUID },
        iso3: iso3.trim().toUpperCase(),
      },
      include: {
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
    });
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string) {
    const row = await this.prisma.country.findUnique({
      where: { slug: slug.trim().toLowerCase() },
      include: {
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
    });
    if (!row || row.id === PrismaCountryRepository.NULL_UUID) {
      return null;
    }
    return this.toDomain(row);
  }

  async findByNameInsensitive(name: string) {
    const row = await this.prisma.country.findFirst({
      where: {
        id: { not: PrismaCountryRepository.NULL_UUID },
        name: { equals: name.trim(), mode: 'insensitive' },
      },
      include: {
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
    });
    return row ? this.toDomain(row) : null;
  }

  async deleteById(id: string): Promise<void> {
    const nullId = PrismaCountryRepository.NULL_UUID;
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

      await tx.city.updateMany({
        where: { countryId: id },
        data: { countryId: nullId },
      });

      await tx.country.delete({ where: { id } });
    });
  }

  async list(
    mode: 'active' | 'inactive' | 'all',
    includeGeometry: boolean,
    q?: string,
  ) {
    const modeWhere =
      mode === 'active'
        ? { deactivatedAt: null }
        : mode === 'inactive'
          ? { deactivatedAt: { not: null } }
          : null;

    const trimmed = q?.trim();
    const searchWhere =
      trimmed && trimmed.length > 0
        ? {
            OR: [
              {
                name: { contains: trimmed, mode: 'insensitive' as const },
              },
              {
                iso2: { contains: trimmed, mode: 'insensitive' as const },
              },
              {
                slug: { contains: trimmed, mode: 'insensitive' as const },
              },
              {
                iso3: {
                  not: null,
                  contains: trimmed,
                  mode: 'insensitive' as const,
                },
              },
              {
                continent: {
                  name: { contains: trimmed, mode: 'insensitive' as const },
                },
              },
            ],
          }
        : null;

    const parts = [modeWhere, searchWhere].filter(
      (p): p is NonNullable<typeof p> => p != null,
    );
    const where: Prisma.CountryWhereInput = {
      AND: [{ id: { not: PrismaCountryRepository.NULL_UUID } }, ...parts],
    };
    const rows = await this.prisma.country.findMany({
      where,
      orderBy: { name: 'asc' },
      ...(includeGeometry
        ? {
            include: {
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
              geometry: {
                select: { type: true, coordinate: true },
              },
            },
          }
        : {
            include: {
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
          }),
    });
    return rows.map((row: Parameters<typeof this.toDomain>[0]) => this.toDomain(row));
  }

  async listContinentsForSelect() {
    return this.prisma.continent.findMany({
      where: {
        id: { not: PrismaCountryRepository.NULL_UUID },
        deactivatedAt: null,
      },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true },
    });
  }
}
