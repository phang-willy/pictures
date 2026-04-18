import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import path from 'node:path';
import dotenv from 'dotenv';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@/infrastructure/frameworks/backend/nest/filters/all-exceptions.filter';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());
  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  const port = Number(process.env.BACKEND_PORT ?? process.env.PORT ?? 3001);
  await app.listen(port);
  logger.log(`Listening on ${await app.getUrl()} (prefix /api)`);
}
