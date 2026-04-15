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
  const origins = new Set<string>();
  const addOrigin = (origin: string) => {
    const trimmed = origin.trim();
    if (!trimmed) {
      return;
    }
    if (/^https?:\/\//i.test(trimmed)) {
      origins.add(trimmed);
      return;
    }
    // Supporte des valeurs de type "192.168.1.2" dans ALLOWED_DEV_ORIGINS.
    origins.add(`http://${trimmed}`);
  };

  const rawCorsOrigin = process.env.CORS_ORIGIN?.trim();
  if (rawCorsOrigin) {
    rawCorsOrigin
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
      .forEach(addOrigin);
  }

  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:3000');
    const rawAllowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS?.trim();
    if (rawAllowedDevOrigins) {
      rawAllowedDevOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
        .forEach((origin) => {
          addOrigin(origin);
          // Si ALLOWED_DEV_ORIGINS ne contient que l'hôte, on autorise aussi :3000.
          if (!/^https?:\/\//i.test(origin) && !origin.includes(':')) {
            addOrigin(`${origin}:3000`);
          }
        });
    }
  }

  if (origins.size > 0) {
    return Array.from(origins);
  }
  return process.env.NODE_ENV !== 'production' ? true : false;
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
