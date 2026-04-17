import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminMutationGuard } from '@/auth/guards/admin-mutation.guard';
import {
  CountryService,
  type CountryDetailDto,
  type CountryExistsResultDto,
  type CreateCountryDto,
  type UpdateCountryDto,
} from '@/country/country.service';

@ApiTags('country')
@Controller('country')
@UseGuards(AdminMutationGuard)
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Get()
  @ApiQuery({
    name: 'include_geometry',
    required: false,
    description:
      'Inclure la géométrie (type + coordinate) depuis CountryGeometry.',
  })
  @ApiQuery({
    name: 'active_only',
    required: false,
    description:
      'Si true : uniquement les pays non désactivés (deletedAt null).',
  })
  @ApiOperation({
    summary: 'Liste des pays disponibles',
    description:
      'Retourne les pays présents en base pour alimenter la carte et la navigation.',
  })
  async list(
    @Query('include_geometry') includeGeometrySnake?: string,
    @Query('includeGeometry') includeGeometryCamel?: string,
    @Query('active_only') activeOnlySnake?: string,
    @Query('activeOnly') activeOnlyCamel?: string,
  ) {
    const includeGeometry = includeGeometrySnake ?? includeGeometryCamel;
    const withGeometry =
      includeGeometry === 'true' ||
      includeGeometry === '1' ||
      includeGeometry === 'yes';
    const activeOnlyParam = activeOnlySnake ?? activeOnlyCamel;
    const activeOnly =
      activeOnlyParam === 'true' ||
      activeOnlyParam === '1' ||
      activeOnlyParam === 'yes';
    const countries = await this.countryService.list(withGeometry, activeOnly);
    return countries;
  }

  @Get('continents')
  @ApiOperation({
    summary: 'Continents pour formulaires admin',
    description:
      'Liste id / code / nom des continents actifs (non supprimés), triés par nom.',
  })
  async listContinents() {
    return this.countryService.listContinentsForSelect();
  }

  @Get('exists')
  @ApiQuery({ name: 'code_iso2', required: false })
  @ApiQuery({ name: 'codeIso2', required: false })
  @ApiQuery({ name: 'code_iso3', required: false })
  @ApiQuery({ name: 'codeIso3', required: false })
  @ApiQuery({ name: 'name', required: true })
  @ApiQuery({ name: 'slug', required: false })
  @ApiOperation({
    summary: 'Vérifier doublon pays (iso2, iso3, nom, slug)',
    description:
      'Pour le formulaire admin : indique si un pays existe déjà avec le même iso2, iso3 (si fourni), nom (casse ignorée) ou slug (si fourni ; sinon slug dérivé du nom).',
  })
  async exists(
    @Query('code_iso2') codeIso2Snake?: string,
    @Query('codeIso2') codeIso2Camel?: string,
    @Query('code_iso3') codeIso3Snake?: string,
    @Query('codeIso3') codeIso3Camel?: string,
    @Query('name') name?: string,
    @Query('slug') slug?: string,
  ): Promise<CountryExistsResultDto> {
    const codeIso2 = codeIso2Snake ?? codeIso2Camel ?? '';
    const codeIso3 = codeIso3Snake ?? codeIso3Camel;
    return await this.countryService.existsDuplicate(
      codeIso2,
      name ?? '',
      codeIso3,
      slug,
    );
  }

  @Post()
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'codeIso2', 'continentId'],
      properties: {
        name: { type: 'string' },
        codeIso2: { type: 'string' },
        codeIso3: { type: 'string', nullable: true },
        continentId: { type: 'string' },
        slug: { type: 'string', nullable: true },
        geometry: {
          type: 'object',
          nullable: true,
          properties: {
            type: { type: 'string' },
            coordinate: {},
          },
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Créer un pays',
    description:
      'Crée un pays ; slug optionnel (sinon dérivé du nom, avec suffixe si besoin). Géométrie optionnelle (Polygon / MultiPolygon).',
  })
  async create(@Body() body: CreateCountryDto): Promise<CountryDetailDto> {
    return await this.countryService.create(body);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mettre à jour un pays',
    description:
      'Met à jour les champs fournis ; geometry null supprime la géométrie. deletedAt ISO8601 = soft delete, deletedAt null = réactivation.',
  })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateCountryDto,
  ): Promise<CountryDetailDto> {
    return await this.countryService.update(id, body);
  }

  @Get(':id')
  @ApiOperation({
    summary: "Détail léger d'un pays",
    description:
      "Retourne l'identifiant et le nom pour l'UI (métadonnées, fil d'Ariane).",
  })
  async getById(@Param('id') id: string) {
    const country = await this.countryService.getById(id);
    if (!country) {
      throw new NotFoundException();
    }
    return country;
  }
}
