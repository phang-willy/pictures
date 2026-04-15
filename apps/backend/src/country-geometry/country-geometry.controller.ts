import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CountryGeometryService } from '@/country-geometry/country-geometry.service';

@ApiTags('country-geometry')
@Controller('country-geometry')
export class CountryGeometryController {
  constructor(
    private readonly countryGeometryService: CountryGeometryService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Liste des géométries de pays',
    description:
      'Retourne les géométries (type + coordinate) liées aux pays en base.',
  })
  async list() {
    return this.countryGeometryService.list();
  }
}
