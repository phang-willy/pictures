import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CountryService } from '@/country/country.service';

@ApiTags('country')
@Controller('country')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Get()
  @ApiQuery({
    name: 'include_geometry',
    required: false,
    description:
      'Inclure la géométrie (type + coordinate) depuis CountryGeometry.',
  })
  @ApiOperation({
    summary: 'Liste des pays disponibles',
    description:
      'Retourne les pays présents en base pour alimenter la carte et la navigation.',
  })
  async list(
    @Query('include_geometry') includeGeometrySnake?: string,
    @Query('includeGeometry') includeGeometryCamel?: string,
  ) {
    const includeGeometry = includeGeometrySnake ?? includeGeometryCamel;
    const withGeometry =
      includeGeometry === 'true' ||
      includeGeometry === '1' ||
      includeGeometry === 'yes';
    const countries = await this.countryService.list(withGeometry);
    return countries;
  }
}
