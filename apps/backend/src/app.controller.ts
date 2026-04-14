import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from '@/app.service';

@ApiTags('health')
@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: "Vérification que l'API répond",
    description: 'Aucun corps ni en-tête requis.',
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
