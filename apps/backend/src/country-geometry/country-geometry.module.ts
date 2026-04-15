import { Module } from '@nestjs/common';
import { CountryGeometryController } from '@/country-geometry/country-geometry.controller';
import { CountryGeometryService } from '@/country-geometry/country-geometry.service';

@Module({
  controllers: [CountryGeometryController],
  providers: [CountryGeometryService],
})
export class CountryGeometryModule {}
