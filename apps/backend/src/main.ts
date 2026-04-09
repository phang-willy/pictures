import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '@/app.module';

function resolveCorsOrigins(): boolean | string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (raw) {
    const list = raw
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    if (list.length > 0) {
      return list;
    }
  }
  if (process.env.NODE_ENV !== 'production') {
    return ['http://localhost:3000'];
  }
  return false;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');

  if (process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1') {
    app.set('trust proxy', 1);
  }

  const corsOrigins = resolveCorsOrigins();
  app.enableCors({
    origin: corsOrigins === false ? false : corsOrigins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Starter Fullstack API')
      .setDescription('API documentation')
      .setVersion('1.0')
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, swaggerDocument);
  }

  const port = Number(process.env.BACKEND_PORT ?? process.env.PORT ?? 3001);
  await app.listen(port);
}
void bootstrap();
