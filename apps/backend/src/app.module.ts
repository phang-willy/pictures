import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@/auth/auth.module';
import {
  resolveThrottleLimit,
  resolveThrottleTracker,
  throttleWindowMs,
} from '@/common/throttle-policy';
import { CountryModule } from '@/country/country.module';
import { CityModule } from '@/city/city.module';
import { CountryGeometryModule } from '@/country-geometry/country-geometry.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: throttleWindowMs(),
          limit: (ctx) => resolveThrottleLimit(ctx),
          getTracker: (req) => resolveThrottleTracker(req),
        },
      ],
      errorMessage: () =>
        'Trop de requêtes pour cette fenêtre. Réessayez dans une minute.',
    }),
    PrismaModule,
    AuthModule,
    CountryModule,
    CityModule,
    CountryGeometryModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
