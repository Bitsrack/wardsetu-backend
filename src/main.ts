import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { AppLogger } from './common/logger';
import type { AppConfig } from './config';
import { LogLevel } from './config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const logger = app.get(AppLogger);
  app.useLogger(logger);

  configureApp(app);

  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);
  const { host, port } = config.get('app', { infer: true });

  // Always bind to the loopback interface — never 0.0.0.0 or a public IP.
  await app.listen(port, host);
  logger.write(LogLevel.Info, 'Application started');
  logger.write(LogLevel.Info, `Listening on ${host}:${port}`);
}

bootstrap().catch((error: unknown) => {
  // The logger may not exist yet (e.g. invalid configuration), so write directly.
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`FATAL [wardsetu-backend] Failed to start: ${message}\n`);
  process.exit(1);
});
