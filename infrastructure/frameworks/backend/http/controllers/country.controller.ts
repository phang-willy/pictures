import { Body, Controller, Delete, ForbiddenException, Get, Inject, NotFoundException, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { TOKEN_SIGNER_PORT } from '@/application/auth/ports/di-tokens';
import type { TokenSignerPort } from '@/application/auth/ports/token-signer.port';
import { CheckCountryDuplicateUseCase } from '@application/country/use-cases/check-country-duplicate.use-case';
import { CreateCountryUseCase } from '@application/country/use-cases/create-country.use-case';
import { DeleteCountryUseCase } from '@application/country/use-cases/delete-country.use-case';
import { GetCountryByIdUseCase } from '@application/country/use-cases/get-country-by-id.use-case';
import { ListCountriesUseCase } from '@application/country/use-cases/list-countries.use-case';
import { UpdateCountryUseCase } from '@application/country/use-cases/update-country.use-case';
import { getRoleFromRequest } from '@/infrastructure/frameworks/backend/http/auth/access-token-role.util';
import { success } from '@/infrastructure/frameworks/backend/nest/response.presenter';
import { toHttpError } from '@/infrastructure/frameworks/backend/http/errors';
import {
  toCountryDetailHttp,
  toCountryListItemHttp,
} from '@/infrastructure/frameworks/backend/http/mappers';
import { parsePage, parsePerPage, toPagination } from '@/infrastructure/frameworks/backend/http/pagination';

@Controller('country')
export class CountryController {
  constructor(
    private readonly createCountryUseCase: CreateCountryUseCase,
    private readonly getCountryByIdUseCase: GetCountryByIdUseCase,
    private readonly listCountriesUseCase: ListCountriesUseCase,
    private readonly checkCountryDuplicateUseCase: CheckCountryDuplicateUseCase,
    private readonly updateCountryUseCase: UpdateCountryUseCase,
    private readonly deleteCountryUseCase: DeleteCountryUseCase,
    @Inject(TOKEN_SIGNER_PORT)
    private readonly tokenSigner: TokenSignerPort,
  ) {}

  private assertAdmin(req: Request): void {
    if (getRoleFromRequest(this.tokenSigner, req) !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can mutate data.');
    }
  }

  @Post()
  async create(
    @Req() req: Request,
    @Body()
    body: {
      name: string;
      iso2: string;
      iso3?: string | null;
      slug?: string;
      continentId: string;
      geometry?: {
        type: 'Polygon' | 'MultiPolygon';
        coordinate: unknown;
      } | null;
    },
  ) {
    this.assertAdmin(req);
    try {
      const country = await this.createCountryUseCase.execute({
        name: body.name,
        iso2: body.iso2,
        iso3: body.iso3,
        slug: body.slug,
        continentId: body.continentId,
        geometry: body.geometry,
      });
      return success({
        id: country.id,
        item: toCountryDetailHttp(country, true),
      });
    } catch (error) {
      toHttpError(error);
    }
  }

  @Get()
  list(
    @Query('activate') activate?: string,
    @Query('inactive_only') inactiveOnly?: string,
    @Query('geometry') geometry?: string,
    @Query('page') pageRaw?: string,
    @Query('per_page') perPageRaw?: string,
    @Query('q') q?: string,
  ) {
    const includeGeometry = geometry === 'true';
    const page = parsePage(pageRaw);
    const perPage = parsePerPage(perPageRaw);
    const search = q?.trim() || undefined;
    const mode: 'active' | 'inactive' | 'all' =
      inactiveOnly === 'true'
        ? 'inactive'
        : activate === 'false'
          ? 'all'
          : 'active';
    return this.listCountriesUseCase.execute(mode, includeGeometry, search).then((items) => {
      const total = items.length;
      const totalPages = Math.max(1, Math.ceil(total / perPage));
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * perPage;
      const payload = items
        .slice(start, start + perPage)
        .map((country) => toCountryListItemHttp(country, includeGeometry));
      return success({
        items: payload,
        pagination: toPagination(safePage, perPage, total),
      });
    });
  }

  @Get('exists')
  exists(
    @Query('iso2') iso2?: string,
    @Query('iso3') iso3?: string,
    @Query('name') name?: string,
    @Query('slug') slug?: string,
    @Query('exclude_country_id') excludeCountryId?: string,
  ) {
    return this.checkCountryDuplicateUseCase
      .execute({
        iso2: iso2 ?? '',
        iso3: iso3,
        name: name ?? '',
        slug,
        excludeCountryId: excludeCountryId?.trim() || undefined,
      })
      .then((result) => success(result));
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Query('geometry') geometry?: string,
  ) {
    const includeGeometry = geometry === 'true';
    const country = await this.getCountryByIdUseCase.execute(id);
    if (!country) {
      throw new NotFoundException('Country not found.');
    }
    return success({ item: toCountryDetailHttp(country, includeGeometry) });
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      iso2?: string;
      iso3?: string | null;
      slug?: string;
      continentId?: string;
      desactivatedAt?: string | null;
      geometry?: {
        type: 'Polygon' | 'MultiPolygon';
        coordinate: unknown;
      } | null;
    },
  ) {
    this.assertAdmin(req);
    try {
      return await this.updateCountryUseCase.execute({
        id,
        name: body.name,
        iso2: body.iso2,
        iso3: body.iso3,
        slug: body.slug,
        continentId: body.continentId,
        desactivatedAt: body.desactivatedAt,
        geometry: body.geometry,
      });
    } catch (error) {
      toHttpError(error);
    }
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string) {
    this.assertAdmin(req);
    try {
      await this.deleteCountryUseCase.execute(id);
      return success({ id });
    } catch (error) {
      toHttpError(error);
    }
  }
}
