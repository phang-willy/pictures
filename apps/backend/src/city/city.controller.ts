import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminMutationGuard } from '@/auth/guards/admin-mutation.guard';
import { CityService } from '@/city/city.service';

@ApiTags('city')
@Controller('city')
@UseGuards(AdminMutationGuard)
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get()
  @ApiQuery({
    name: 'countryId',
    required: false,
    description: 'Identifiant du pays pour filtrer les villes.',
  })
  @ApiQuery({
    name: 'countrySlug',
    required: false,
    description: 'Slug du pays pour filtrer les villes.',
  })
  @ApiOperation({
    summary: 'Liste des villes pour un pays',
    description: 'Retourne les villes liées au pays sélectionné.',
  })
  async list(
    @Query('countryId') countryId?: string,
    @Query('countrySlug') countrySlug?: string,
  ) {
    if (!countryId && !countrySlug) {
      throw new BadRequestException(
        'countryId or countrySlug query param is required',
      );
    }
    const cities = countryId
      ? await this.cityService.listByCountry(countryId)
      : await this.cityService.listByCountrySlug(countrySlug as string);
    return cities;
  }
}
