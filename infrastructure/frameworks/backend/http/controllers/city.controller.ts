import { Controller, Get, Inject, Query } from '@nestjs/common';
import { COUNTRY_REPOSITORY } from '@/application/country/ports/country.tokens';
import { ListCitiesUseCase } from '@/application/city/use-cases/list-cities.use-case';
import type { CountryRepository } from '@/domain/country/repositories/country.repository';
import { success } from '@/infrastructure/frameworks/backend/nest/response.presenter';
import { toCityListItemHttp } from '@/infrastructure/frameworks/backend/http/mappers';
import { parsePage, parsePerPage, toPagination } from '@/infrastructure/frameworks/backend/http/pagination';

@Controller('city')
export class CityController {
  constructor(
    private readonly listCitiesUseCase: ListCitiesUseCase,
    @Inject(COUNTRY_REPOSITORY) private readonly countryRepository: CountryRepository,
  ) {}

  @Get()
  async list(
    @Query('activate') activate?: string,
    @Query('country_id') countryIdRaw?: string,
    @Query('country_slug') countrySlug?: string,
    @Query('page') pageRaw?: string,
    @Query('per_page') perPageRaw?: string,
  ) {
    const activeOnly = activate !== 'false';
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
      activeOnly,
      ...(countryId ? { countryId } : {}),
    });
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * perPage;
    const payload = items
      .slice(start, start + perPage)
      .map((city) => toCityListItemHttp(city));
    return success({
      items: payload,
      pagination: toPagination(safePage, perPage, total),
    });
  }
}
