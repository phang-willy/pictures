import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { CheckCityDuplicateUseCase } from '@/application/city/use-cases/check-city-duplicate.use-case';
import { CreateCityUseCase } from '@/application/city/use-cases/create-city.use-case';
import { GetCityByIdUseCase } from '@/application/city/use-cases/get-city-by-id.use-case';
import { ListCitiesUseCase } from '@/application/city/use-cases/list-cities.use-case';
import { UpdateCityUseCase } from '@/application/city/use-cases/update-city.use-case';
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
  ) {}

  @Post()
  async create(
    @Body()
    body: {
      countryId: string;
      name: string;
      slug?: string;
      latitude: number;
      longitude: number;
    },
  ) {
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
        ? items.filter((city) => city.deletedAt !== null)
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
    @Param('id') id: string,
    @Body()
    body: {
      countryId?: string;
      name?: string;
      slug?: string;
      latitude?: number;
      longitude?: number;
      deletedAt?: string | null;
    },
  ) {
    try {
      const city = await this.updateCityUseCase.execute({
        id,
        countryId: body.countryId,
        name: body.name,
        slug: body.slug,
        latitude: body.latitude,
        longitude: body.longitude,
        deletedAt: body.deletedAt,
      });
      return success({ item: toCityListItemHttp(city) });
    } catch (error) {
      toHttpError(error);
    }
  }
}
