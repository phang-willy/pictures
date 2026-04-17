import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type CountryListItem = {
  id: string;
  continent: {
    name: string;
  };
  codeIso2: string;
  codeIso3: string | null;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  geometry?: {
    type: string;
    coordinate: unknown;
  } | null;
};

export type CountryDetailDto = {
  id: string;
  continentId: string;
  name: string;
  codeIso2: string;
  codeIso3: string | null;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  continent: {
    code: string;
    name: string;
  };
  geometry: {
    type: string;
    coordinate: unknown;
  } | null;
};

export type ContinentOptionDto = {
  id: string;
  code: string;
  name: string;
};

export type UpdateCountryDto = {
  name?: string;
  codeIso2?: string;
  codeIso3?: string | null;
  slug?: string;
  continentId?: string;
  geometry?: { type: string; coordinate: unknown } | null;
  /** ISO 8601 : désactivation (soft delete). `null` ou chaîne vide : réactivation. */
  deletedAt?: string | null;
};

export type CreateCountryDto = {
  name: string;
  codeIso2: string;
  codeIso3?: string | null;
  continentId: string;
  /** Si absent : dérivé du nom (unicité garantie côté serveur). */
  slug?: string;
  geometry?: { type: string; coordinate: unknown } | null;
};

export type CountryExistsResultDto = {
  exists: boolean;
  /** Champs en conflit avec un enregistrement existant (iso2 / iso3 / nom / slug). */
  conflicts: Array<'codeIso2' | 'codeIso3' | 'name' | 'slug'>;
  match?: {
    id: string;
    name: string;
    codeIso2: string;
    codeIso3: string | null;
  };
};

function slugifyCountryName(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (base === 'viet-nam') {
    return 'vietnam';
  }
  return base || 'country';
}

@Injectable()
export class CountryService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string): Promise<CountryDetailDto | null> {
    return this.prisma.country.findUnique({
      where: { id },
      select: {
        id: true,
        continentId: true,
        name: true,
        codeIso2: true,
        codeIso3: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        continent: {
          select: {
            code: true,
            name: true,
          },
        },
        geometry: {
          select: {
            type: true,
            coordinate: true,
          },
        },
      },
    });
  }

  async listContinentsForSelect(): Promise<ContinentOptionDto[]> {
    return this.prisma.continent.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });
  }

  /**
   * Détecte les conflits avec la base (iso2, iso3 si fourni, nom insensible à la casse, slug).
   * Si `slug` est fourni, il est utilisé pour le conflit sur `Country.slug` ; sinon dérivation depuis `name`.
   */
  async existsDuplicate(
    codeIso2: string,
    name: string,
    codeIso3?: string | null,
    slug?: string | null,
  ): Promise<CountryExistsResultDto> {
    const iso2 = codeIso2.trim().toUpperCase();
    const nameTrim = name.trim();
    const iso3 =
      codeIso3 === undefined || codeIso3 === null
        ? ''
        : String(codeIso3).trim().toUpperCase();

    if (iso2.length !== 2) {
      throw new BadRequestException('codeIso2 doit faire 2 caractères.');
    }
    if (!nameTrim) {
      throw new BadRequestException('name est requis.');
    }
    if (iso3.length > 0 && iso3.length !== 3) {
      throw new BadRequestException(
        'codeIso3 doit faire 3 caractères ou être vide.',
      );
    }

    const conflicts: CountryExistsResultDto['conflicts'] = [];
    let match: CountryExistsResultDto['match'];

    const byIso2 = await this.prisma.country.findUnique({
      where: { codeIso2: iso2 },
      select: { id: true, name: true, codeIso2: true, codeIso3: true },
    });
    if (byIso2) {
      conflicts.push('codeIso2');
      match = byIso2;
    }

    if (iso3.length === 3) {
      const byIso3 = await this.prisma.country.findFirst({
        where: { codeIso3: iso3 },
        select: { id: true, name: true, codeIso2: true, codeIso3: true },
      });
      if (byIso3) {
        if (!conflicts.includes('codeIso3')) {
          conflicts.push('codeIso3');
        }
        match = match ?? byIso3;
      }
    }

    const byName = await this.prisma.country.findFirst({
      where: {
        name: { equals: nameTrim, mode: 'insensitive' },
      },
      select: { id: true, name: true, codeIso2: true, codeIso3: true },
    });
    if (byName) {
      if (!conflicts.includes('name')) {
        conflicts.push('name');
      }
      match = match ?? byName;
    }

    const slugParam =
      slug === undefined || slug === null
        ? ''
        : String(slug).trim().toLowerCase();
    const slugBase =
      slugParam.length > 0
        ? slugParam.slice(0, 150)
        : slugifyCountryName(nameTrim);
    const bySlug = await this.prisma.country.findUnique({
      where: { slug: slugBase },
      select: { id: true, name: true, codeIso2: true, codeIso3: true },
    });
    if (bySlug) {
      if (!conflicts.includes('slug')) {
        conflicts.push('slug');
      }
      match = match ?? bySlug;
    }

    return {
      exists: conflicts.length > 0,
      conflicts,
      match,
    };
  }

  private async allocateUniqueSlug(
    tx: Prisma.TransactionClient,
    base: string,
  ): Promise<string> {
    const root = base.slice(0, 150) || 'country';
    for (let n = 0; n < 10_000; n += 1) {
      const suffix = n === 0 ? '' : `-${n}`;
      const slug = (root + suffix).slice(0, 150);
      const clash = await tx.country.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!clash) {
        return slug;
      }
    }
    throw new BadRequestException('Impossible de générer un slug unique.');
  }

  async create(dto: CreateCountryDto): Promise<CountryDetailDto> {
    const name = dto.name.trim();
    const codeIso2 = dto.codeIso2.trim().toUpperCase();
    if (codeIso2.length !== 2) {
      throw new BadRequestException('codeIso2 doit faire 2 caractères.');
    }
    let codeIso3: string | null = null;
    if (
      dto.codeIso3 !== undefined &&
      dto.codeIso3 !== null &&
      String(dto.codeIso3).trim() !== ''
    ) {
      const v = String(dto.codeIso3).trim().toUpperCase();
      if (v.length !== 3) {
        throw new BadRequestException(
          'codeIso3 doit faire 3 caractères ou être vide.',
        );
      }
      codeIso3 = v;
    }

    const continent = await this.prisma.continent.findFirst({
      where: { id: dto.continentId, deletedAt: null },
      select: { id: true },
    });
    if (!continent) {
      throw new BadRequestException('Continent introuvable ou désactivé.');
    }

    const { geometry } = dto;
    if (geometry !== undefined && geometry !== null) {
      const type = geometry.type?.trim();
      if (type !== 'Polygon' && type !== 'MultiPolygon') {
        throw new BadRequestException(
          'geometry.type doit être Polygon ou MultiPolygon.',
        );
      }
      if (geometry.coordinate === undefined) {
        throw new BadRequestException('geometry.coordinate est requis.');
      }
    }

    const dup = await this.existsDuplicate(codeIso2, name, codeIso3, dto.slug);
    if (dup.exists) {
      throw new ConflictException(
        `Pays déjà présent (conflits : ${dup.conflicts.join(', ')}).`,
      );
    }

    const slugInput = dto.slug?.trim();
    const slugFromName = slugifyCountryName(name);

    try {
      const createdId = await this.prisma.$transaction(async (tx) => {
        let slug: string;
        if (slugInput) {
          const clash = await tx.country.findUnique({
            where: { slug: slugInput },
            select: { id: true },
          });
          if (clash) {
            throw new ConflictException('Ce slug est déjà utilisé.');
          }
          slug = slugInput.slice(0, 150);
        } else {
          slug = await this.allocateUniqueSlug(tx, slugFromName);
        }

        const country = await tx.country.create({
          data: {
            continentId: dto.continentId,
            codeIso2,
            codeIso3,
            name: name.slice(0, 120),
            slug,
            ...(geometry !== undefined && geometry !== null
              ? {
                  geometry: {
                    create: {
                      type: geometry.type.trim(),
                      coordinate: geometry.coordinate as Prisma.InputJsonValue,
                    },
                  },
                }
              : {}),
          },
          select: { id: true },
        });

        return country.id;
      });

      const detail = await this.getById(createdId);
      if (!detail) {
        throw new NotFoundException();
      }
      return detail;
    } catch (e: unknown) {
      if (
        e instanceof BadRequestException ||
        e instanceof NotFoundException ||
        e instanceof ConflictException
      ) {
        throw e;
      }
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException(
          'Contrainte unique (iso2, iso3 ou slug) : valeur déjà utilisée.',
        );
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateCountryDto): Promise<CountryDetailDto> {
    const existing = await this.prisma.country.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException();
    }

    const { geometry, deletedAt, ...rest } = dto;
    const countryData: Prisma.CountryUpdateInput = {};

    if (deletedAt !== undefined) {
      if (deletedAt === null || deletedAt === '') {
        countryData.deletedAt = null;
      } else {
        const d = new Date(deletedAt);
        if (Number.isNaN(d.getTime())) {
          throw new BadRequestException(
            'deletedAt doit être une date ISO valide.',
          );
        }
        countryData.deletedAt = d;
      }
    }

    if (rest.name !== undefined) {
      countryData.name = rest.name.trim();
    }
    if (rest.codeIso2 !== undefined) {
      const v = rest.codeIso2.trim().toUpperCase();
      if (v.length !== 2) {
        throw new BadRequestException('codeIso2 doit faire 2 caractères.');
      }
      countryData.codeIso2 = v;
    }
    if (rest.codeIso3 !== undefined) {
      if (rest.codeIso3 === null || rest.codeIso3 === '') {
        countryData.codeIso3 = null;
      } else {
        const v = rest.codeIso3.trim().toUpperCase();
        if (v.length !== 3) {
          throw new BadRequestException(
            'codeIso3 doit faire 3 caractères ou être vide.',
          );
        }
        countryData.codeIso3 = v;
      }
    }
    if (rest.slug !== undefined) {
      countryData.slug = rest.slug.trim();
    }
    if (rest.continentId !== undefined) {
      countryData.continent = { connect: { id: rest.continentId } };
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        if (Object.keys(countryData).length > 0) {
          await tx.country.update({
            where: { id },
            data: countryData,
          });
        }

        if (geometry === null) {
          await tx.countryGeometry.deleteMany({ where: { countryId: id } });
        } else if (geometry !== undefined) {
          const type = geometry.type?.trim();
          if (type !== 'Polygon' && type !== 'MultiPolygon') {
            throw new BadRequestException(
              'geometry.type doit être Polygon ou MultiPolygon.',
            );
          }
          const coordinate = geometry.coordinate;
          if (coordinate === undefined) {
            throw new BadRequestException('geometry.coordinate est requis.');
          }
          await tx.countryGeometry.upsert({
            where: { countryId: id },
            create: {
              countryId: id,
              type,
              coordinate: coordinate as Prisma.InputJsonValue,
            },
            update: {
              type,
              coordinate: coordinate as Prisma.InputJsonValue,
            },
          });
        }
      });
    } catch (e: unknown) {
      if (e instanceof BadRequestException || e instanceof NotFoundException) {
        throw e;
      }
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code: string }).code === 'P2002'
      ) {
        throw new ConflictException(
          'Contrainte unique (iso2, iso3 ou slug) : valeur déjà utilisée.',
        );
      }
      throw e;
    }

    const updated = await this.getById(id);
    if (!updated) {
      throw new NotFoundException();
    }
    return updated;
  }

  async list(
    includeGeometry = false,
    activeOnly = false,
  ): Promise<CountryListItem[]> {
    return this.prisma.country.findMany({
      where: activeOnly ? { deletedAt: null } : undefined,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        continent: {
          select: {
            name: true,
          },
        },
        codeIso2: true,
        codeIso3: true,
        name: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        ...(includeGeometry
          ? {
              geometry: {
                select: {
                  type: true,
                  coordinate: true,
                },
              },
            }
          : {}),
      },
    });
  }
}
