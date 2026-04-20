import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import path from 'node:path';
import dotenv from 'dotenv';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@/infrastructure/frameworks/backend/nest/filters/all-exceptions.filter';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function isPrivateNetworkHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower === '127.0.0.1' || lower === '::1') {
    return true;
  }

  // IPv4 privées usuelles (LAN local).
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(lower)) {
    return true;
  }
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(lower)) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(lower)) {
    return true;
  }

  // Link-local (souvent utilisés sur certains réseaux locaux).
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(lower)) {
    return true;
  }

  return false;
}

export async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());
  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';
  const corsOriginsSet = new Set(corsOrigins);
  app.enableCors({
    origin: (origin, callback) => {
      // Requêtes serveur-à-serveur / outils sans Origin.
      if (!origin) {
        callback(null, true);
        return;
      }
      if (corsOriginsSet.has(origin)) {
        callback(null, true);
        return;
      }
      if (!isDev) {
        callback(new Error(`CORS origin refusée: ${origin}`), false);
        return;
      }
      try {
        const parsed = new URL(origin);
        if (isPrivateNetworkHostname(parsed.hostname)) {
          callback(null, true);
          return;
        }
      } catch {
        // Ignore les origins invalides et refuse juste après.
      }
      callback(new Error(`CORS origin refusée: ${origin}`), false);
    },
    credentials: true,
  });
  const port = Number(process.env.BACKEND_PORT ?? process.env.PORT ?? 3001);
  await app.listen(port);
  logger.log(`Listening on ${await app.getUrl()} (prefix /api)`);
}
