import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { AdminMutationGuard } from '@/auth/guards/admin-mutation.guard';
import { CityController } from '@/city/city.controller';
import { CityService } from '@/city/city.service';

@Module({
  imports: [AuthModule],
  controllers: [CityController],
  providers: [CityService, AdminMutationGuard],
})
export class CityModule {}
