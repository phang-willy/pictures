import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { AdminMutationGuard } from '@/auth/guards/admin-mutation.guard';
import { CountryGeometryController } from '@/country-geometry/country-geometry.controller';
import { CountryGeometryService } from '@/country-geometry/country-geometry.service';

@Module({
  imports: [AuthModule],
  controllers: [CountryGeometryController],
  providers: [CountryGeometryService, AdminMutationGuard],
})
export class CountryGeometryModule {}
