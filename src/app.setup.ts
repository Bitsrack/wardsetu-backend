import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppLogger } from './common/logger';
import { RequestIdMiddleware, RequestLoggerMiddleware } from './common/middleware';
import type { AppConfig } from './config';
import { setupSwagger } from './config/swagger.config';

/**
 * Applies the HTTP-level configuration shared by `main.ts` and the e2e tests:
 * proxy trust, request IDs and access logs, body limits, security headers, CORS, API prefix, Swagger and
 * graceful shutdown. Validation, error handling and the response envelope
 * are registered as global providers in `AppModule`.
 */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);
  const { apiPrefix, requestBodyLimit } = config.get('app', { infer: true });

  // Nginx on the same host terminates TLS and proxies to 127.0.0.1:2010.
  app.set('trust proxy', 'loopback');
  app.disable('x-powered-by');

  // Registered before the body parsers so that every request — including one
  // rejected for a malformed or oversized body — gets an ID and a log line.
  const requestId = new RequestIdMiddleware();
  const requestLogger = new RequestLoggerMiddleware(app.get(AppLogger));
  app.use(requestId.use.bind(requestId));
  app.use(requestLogger.use.bind(requestLogger));

  app.useBodyParser('json', { limit: requestBodyLimit });
  app.useBodyParser('urlencoded', { limit: requestBodyLimit, extended: true });

  app.use(helmet());
  app.enableCors({
    origin: config.get('cors.origins', { infer: true }),
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.setGlobalPrefix(apiPrefix);

  if (config.get('swagger.enabled', { infer: true })) {
    setupSwagger(app, apiPrefix);
  }

  app.enableShutdownHooks(['SIGTERM', 'SIGINT']);
}
