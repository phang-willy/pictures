import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '@/app.module';

function isSwaggerEnabled(): boolean {
  if (process.env.SWAGGER === 'false' || process.env.SWAGGER === '0') {
    return false;
  }
  const env = (process.env.NODE_ENV ?? '').toLowerCase();
  if (env === 'production') {
    return false;
  }
  return (
    env === 'development' ||
    env === 'dev' ||
    env === 'test' ||
    env === '' ||
    process.env.SWAGGER === 'true' ||
    process.env.SWAGGER === '1'
  );
}

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

  if (isSwaggerEnabled()) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Pictures API')
      .setDescription('Documentation OpenAPI (environnement hors production).')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, swaggerDocument, {
      useGlobalPrefix: true,
    });
  }

  const port = Number(process.env.BACKEND_PORT ?? process.env.PORT ?? 3001);
  await app.listen(port);
}
void bootstrap();
