import { Controller, Get } from '@nestjs/common';
import { ListContinentsUseCase } from '@/application/country/use-cases/list-continents.use-case';
import { success } from '@/infrastructure/frameworks/backend/nest/response.presenter';
import { toContinentListItemHttp } from '@/infrastructure/frameworks/backend/http/mappers';
import { DEFAULT_PAGE, DEFAULT_PER_PAGE, toPagination } from '@/infrastructure/frameworks/backend/http/pagination';

@Controller('continent')
export class ContinentController {
  constructor(private readonly listContinentsUseCase: ListContinentsUseCase) {}

  @Get()
  list() {
    return this.listContinentsUseCase.execute().then((items) => {
      const total = items.length;
      const page = DEFAULT_PAGE;
      const perPage = DEFAULT_PER_PAGE;
      const payload = items.slice(0, perPage).map(toContinentListItemHttp);
      return success({
        items: payload,
        pagination: toPagination(page, perPage, total),
      });
    });
  }
}
