import { Body, Controller, Get, type INestApplication, Module, Post } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { IsInt, IsString, Min } from 'class-validator';
import request from 'supertest';
import type { App } from 'supertest/types';
import type { OpenAPIObject } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import type { ApiErrorResponse } from '../src/common/types';
import { PrismaService } from '../src/database/prisma.service';

// A throwaway endpoint used only to exercise the global pipe/interceptor.
class EchoDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(1)
  count: number;
}

@Controller('test-echo')
class EchoController {
  @Post()
  echo(@Body() dto: EchoDto): EchoDto {
    return dto;
  }

  @Get('boom')
  boom(): never {
    throw new Error('SELECT * FROM secret_table WHERE password = hunter2');
  }
}

@Module({ controllers: [EchoController] })
class EchoModule {}

describe('WardSetu backend (HTTP)', () => {
  let app: INestApplication<App>;
  const prisma = { ping: jest.fn<Promise<void>, []>() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule, EchoModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    const nestApp = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    configureApp(nestApp);
    await nestApp.init();
    app = nestApp;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => prisma.ping.mockReset());

  describe('GET /api/health', () => {
    it('returns 200 when the database is up', async () => {
      prisma.ping.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer()).get('/api/health').expect(200);

      expect(res.body).toMatchObject({ status: 'ok', service: 'wardsetu-backend', database: 'up' });
    });

    it('returns 503 when the database is down', async () => {
      prisma.ping.mockRejectedValue(new Error('down'));

      const res = await request(app.getHttpServer()).get('/api/health').expect(503);

      expect(res.body).toMatchObject({ status: 'error', database: 'down' });
    });

    it('is only served under the /api prefix', async () => {
      await request(app.getHttpServer()).get('/health').expect(404);
    });
  });

  describe('security', () => {
    it('sets Helmet security headers and hides X-Powered-By', async () => {
      prisma.ping.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer()).get('/api/health');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['content-security-policy']).toBeDefined();
      expect(res.headers['strict-transport-security']).toBeDefined();
      expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('allows configured CORS origins', async () => {
      const res = await request(app.getHttpServer())
        .options('/api/health')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('does not allow unknown CORS origins', async () => {
      const res = await request(app.getHttpServer())
        .options('/api/health')
        .set('Origin', 'https://evil.example')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('rejects request bodies over the configured limit', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/test-echo')
        .send({ name: 'x'.repeat(4096), count: 1 })
        .expect(413);

      expect(res.body).toMatchObject({ error: { code: 'PAYLOAD_TOO_LARGE' } });
    });
  });

  describe('request IDs', () => {
    it('generates a request ID when none is supplied', async () => {
      prisma.ping.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer()).get('/api/health');

      expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('propagates a safe incoming request ID and replaces an unsafe one', async () => {
      prisma.ping.mockResolvedValue(undefined);
      const server = app.getHttpServer();

      const safe = await request(server).get('/api/health').set('x-request-id', 'trace-123');
      const unsafe = await request(server).get('/api/health').set('x-request-id', 'bad id<>');

      expect(safe.headers['x-request-id']).toBe('trace-123');
      expect(unsafe.headers['x-request-id']).not.toBe('bad id<>');
    });
  });

  describe('response contract', () => {
    it('wraps successful responses', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/test-echo')
        .send({ name: 'ward', count: 2 })
        .expect(201);

      expect(res.body).toEqual({ data: { name: 'ward', count: 2 } });
    });

    it('returns validation failures in the error format', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/test-echo')
        .send({ name: 'ward', count: 0 })
        .expect(400);

      expect(res.body).toMatchObject({
        error: { code: 'VALIDATION_FAILED', message: 'Validation failed' },
      });
      const body = res.body as ApiErrorResponse;
      expect(body.error.details).toEqual([{ field: 'count', errors: [expect.any(String)] }]);
      expect(typeof body.requestId).toBe('string');
    });

    it('rejects properties that are not in the DTO', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/test-echo')
        .send({ name: 'ward', count: 1, isAdmin: true })
        .expect(400);

      expect((res.body as ApiErrorResponse).error.details).toEqual([
        { field: 'isAdmin', errors: [expect.any(String)] },
      ]);
    });

    it('returns 404 in the error format', async () => {
      const res = await request(app.getHttpServer()).get('/api/does-not-exist').expect(404);

      expect(res.body).toMatchObject({ error: { code: 'NOT_FOUND' } });
    });

    it('hides internal error details', async () => {
      const res = await request(app.getHttpServer()).get('/api/test-echo/boom').expect(500);

      expect(res.body).toMatchObject({
        error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' },
      });
      expect(JSON.stringify(res.body)).not.toMatch(/secret_table|hunter2|stack|\.ts/);
    });
  });

  describe('Swagger', () => {
    it('serves the OpenAPI document with bearer auth prepared', async () => {
      const res = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
      const document = res.body as OpenAPIObject;

      expect(document.info).toMatchObject({
        title: 'WardSetu Backend API',
        description: 'WardSetu civic and election management platform API.',
        version: '1.0',
      });
      expect(document.components?.securitySchemes?.bearer).toMatchObject({
        type: 'http',
        scheme: 'bearer',
      });
      expect(document.paths['/api/health']).toBeDefined();
    });

    it('serves the Swagger UI', async () => {
      await request(app.getHttpServer()).get('/api/docs').expect(200);
    });
  });
});
