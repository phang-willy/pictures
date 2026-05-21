import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import path from 'node:path';
import dotenv from 'dotenv';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from '@/infrastructure/frameworks/backend/nest/filters/all-exceptions.filter';
import { ensureUploadsDirectory } from '@/infrastructure/adapters/storage/uploads-directory';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function parseOriginList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => origin.replace(/\/$/, ''));
}

function normalizeDevOrigin(origin: string): string[] {
  if (/^https?:\/\//i.test(origin)) {
    return [origin.replace(/\/$/, '')];
  }
  return [`http://${origin}`, `https://${origin}`];
}

function requestOrigin(req: Request): string | null {
  const origin = req.headers.origin;
  if (typeof origin === 'string' && origin.trim()) {
    return origin.replace(/\/$/, '');
  }
  const referer = req.headers.referer;
  if (typeof referer !== 'string' || !referer.trim()) {
    return null;
  }
  try {
    const parsed = new URL(referer);
    return parsed.origin;
  } catch {
    return null;
  }
}

function isUnsafeMethod(method: string): boolean {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

function applySecurityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  );
  next();
}

type CorsOriginCallback = (error: Error | null, allow?: boolean) => void;

export async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  if (process.env.TRUST_PROXY === 'true') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  const uploadsDir = await ensureUploadsDirectory();
  app.use('/uploads', express.static(uploadsDir, { fallthrough: false }));
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(applySecurityHeaders);
  const corsOrigins = parseOriginList(process.env.CORS_ORIGIN ?? 'http://localhost:3000');
  const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';
  const defaultDevOrigins = isDev
    ? ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://[::1]:3000']
    : [];
  const devOrigins = isDev
    ? parseOriginList(process.env.ALLOWED_DEV_ORIGINS).flatMap(normalizeDevOrigin)
    : [];
  const corsOriginsSet = new Set([...defaultDevOrigins, ...corsOrigins, ...devOrigins]);
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = requestOrigin(req);
    if (isUnsafeMethod(req.method) && origin && !corsOriginsSet.has(origin)) {
      res.status(403).json({
        success: false,
        message: 'Origin not allowed.',
      });
      return;
    }
    next();
  });
  app.enableCors({
    origin: (origin: string | undefined, callback: CorsOriginCallback) => {
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
        callback(null, false);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  });
  const port = Number(process.env.BACKEND_PORT ?? process.env.PORT ?? 3001);
  await app.listen(port);
  logger.log(`Listening on ${await app.getUrl()} (prefix /api)`);
}
