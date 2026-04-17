import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { AdminMutationGuard } from '@/auth/guards/admin-mutation.guard';
import { CountryController } from '@/country/country.controller';
import { CountryService } from '@/country/country.service';

@Module({
  imports: [AuthModule],
  controllers: [CountryController],
  providers: [CountryService, AdminMutationGuard],
})
export class CountryModule {}
