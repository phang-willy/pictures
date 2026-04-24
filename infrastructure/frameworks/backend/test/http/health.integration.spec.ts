import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { HealthController } from '@/infrastructure/frameworks/backend/http/controllers/health.controller';

describe('HealthController (HTTP)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns ok payload', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);

    expect(res.body).toEqual({ success: true, status: 'ok' });
  });
});
