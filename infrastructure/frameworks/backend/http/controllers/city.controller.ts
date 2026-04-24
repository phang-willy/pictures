import { Body, Controller, Delete, ForbiddenException, Get, Inject, NotFoundException, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { TOKEN_SIGNER_PORT } from '@/application/auth/ports/di-tokens';
import type { TokenSignerPort } from '@/application/auth/ports/token-signer.port';
import { CheckCityDuplicateUseCase } from '@/application/city/use-cases/check-city-duplicate.use-case';
import { CreateCityUseCase } from '@/application/city/use-cases/create-city.use-case';
import { DeleteCityUseCase } from '@/application/city/use-cases/delete-city.use-case';
import { GetCityByIdUseCase } from '@/application/city/use-cases/get-city-by-id.use-case';
import { ListCitiesUseCase } from '@/application/city/use-cases/list-cities.use-case';
import { UpdateCityUseCase } from '@/application/city/use-cases/update-city.use-case';
import { COUNTRY_REPOSITORY } from '@/application/country/ports/country.tokens';
import type { CountryRepository } from '@/domain/country/repositories/country.repository';
import { getRoleFromRequest } from '@/infrastructure/frameworks/backend/http/auth/access-token-role.util';
import { success } from '@/infrastructure/frameworks/backend/nest/response.presenter';
import { toCityListItemHttp } from '@/infrastructure/frameworks/backend/http/mappers';
import { toHttpError } from '@/infrastructure/frameworks/backend/http/errors';
import { parsePage, parsePerPage, toPagination } from '@/infrastructure/frameworks/backend/http/pagination';

@Controller('city')
export class CityController {
  constructor(
    private readonly createCityUseCase: CreateCityUseCase,
    private readonly getCityByIdUseCase: GetCityByIdUseCase,
    private readonly listCitiesUseCase: ListCitiesUseCase,
    private readonly checkCityDuplicateUseCase: CheckCityDuplicateUseCase,
    private readonly updateCityUseCase: UpdateCityUseCase,
    private readonly deleteCityUseCase: DeleteCityUseCase,
    @Inject(COUNTRY_REPOSITORY)
    private readonly countryRepository: CountryRepository,
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
      countryId: string;
      name: string;
      slug?: string;
      latitude: number;
      longitude: number;
    },
  ) {
    this.assertAdmin(req);
    try {
      const city = await this.createCityUseCase.execute(body);
      return success({
        id: city.id,
        item: toCityListItemHttp(city),
      });
    } catch (error) {
      toHttpError(error);
    }
  }

  @Get()
  async list(
    @Query('activate') activate?: string,
    @Query('inactive_only') inactiveOnly?: string,
    @Query('country_id') countryIdRaw?: string,
    @Query('country_slug') countrySlug?: string,
    @Query('page') pageRaw?: string,
    @Query('per_page') perPageRaw?: string,
  ) {
    const mode: 'active' | 'inactive' | 'all' =
      inactiveOnly === 'true'
        ? 'inactive'
        : activate === 'false'
          ? 'all'
          : 'active';
    const page = parsePage(pageRaw);
    const perPage = parsePerPage(perPageRaw);

    const idTrimmed = countryIdRaw?.trim();
    const slugTrimmed = countrySlug?.trim();

    let countryId: string | undefined;
    if (idTrimmed) {
      countryId = idTrimmed;
    } else if (slugTrimmed) {
      const country = await this.countryRepository.findBySlug(slugTrimmed);
      countryId = country?.id;
      if (!countryId) {
        return success({
          items: [],
          pagination: toPagination(1, perPage, 0),
        });
      }
    }

    const items = await this.listCitiesUseCase.execute({
      activeOnly: mode === 'active',
      ...(countryId ? { countryId } : {}),
    });
    const filteredItems =
      mode === 'inactive'
        ? items.filter((city) => city.deactivatedAt !== null)
        : items;
    const total = filteredItems.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * perPage;
    const payload = filteredItems
      .slice(start, start + perPage)
      .map((city) => toCityListItemHttp(city));
    return success({
      items: payload,
      pagination: toPagination(safePage, perPage, total),
    });
  }

  @Get('exists')
  exists(
    @Query('country_id') countryId?: string,
    @Query('name') name?: string,
    @Query('slug') slug?: string,
    @Query('exclude_city_id') excludeCityId?: string,
  ) {
    return this.checkCityDuplicateUseCase
      .execute({
        countryId: countryId ?? '',
        name: name ?? '',
        slug,
        excludeCityId: excludeCityId?.trim() || undefined,
      })
      .then((result) => success(result));
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const city = await this.getCityByIdUseCase.execute(id);
    if (!city) {
      throw new NotFoundException('City not found.');
    }
    return success({ item: toCityListItemHttp(city) });
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    body: {
      countryId?: string;
      name?: string;
      slug?: string;
      latitude?: number;
      longitude?: number;
      deactivatedAt?: string | null;
    },
  ) {
    this.assertAdmin(req);
    try {
      const city = await this.updateCityUseCase.execute({
        id,
        countryId: body.countryId,
        name: body.name,
        slug: body.slug,
        latitude: body.latitude,
        longitude: body.longitude,
        deactivatedAt: body.deactivatedAt,
      });
      return success({ item: toCityListItemHttp(city) });
    } catch (error) {
      toHttpError(error);
    }
  }

  @Delete(':id')
  async delete(@Req() req: Request, @Param('id') id: string) {
    this.assertAdmin(req);
    try {
      await this.deleteCityUseCase.execute(id);
      return success({ id });
    } catch (error) {
      toHttpError(error);
    }
  }
}
