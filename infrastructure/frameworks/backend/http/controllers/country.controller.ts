import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { CheckCountryDuplicateUseCase } from '@application/country/use-cases/check-country-duplicate.use-case';
import { CreateCountryUseCase } from '@application/country/use-cases/create-country.use-case';
import { GetCountryByIdUseCase } from '@application/country/use-cases/get-country-by-id.use-case';
import { ListCountriesUseCase } from '@application/country/use-cases/list-countries.use-case';
import { UpdateCountryUseCase } from '@application/country/use-cases/update-country.use-case';
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
  ) {}

  @Post()
  async create(
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
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      iso2?: string;
      iso3?: string | null;
      slug?: string;
      continentId?: string;
      deletedAt?: string | null;
      geometry?: {
        type: 'Polygon' | 'MultiPolygon';
        coordinate: unknown;
      } | null;
    },
  ) {
    try {
      return await this.updateCountryUseCase.execute({
        id,
        name: body.name,
        iso2: body.iso2,
        iso3: body.iso3,
        slug: body.slug,
        continentId: body.continentId,
        deletedAt: body.deletedAt,
        geometry: body.geometry,
      });
    } catch (error) {
      toHttpError(error);
    }
  }
}
