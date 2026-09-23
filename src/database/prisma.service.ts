import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { AppLogger } from '../common/logger';
import { type AppConfig, LogLevel } from '../config';

/**
 * The application's single Prisma client (PostgreSQL via the `pg` driver
 * adapter). Connects on startup and disconnects on shutdown.
 *
 * A database that is unreachable at startup is logged but does not crash the
 * process: `/api/health` reports it as down so the operator can see it.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(
    config: ConfigService<AppConfig, true>,
    private readonly logger: AppLogger,
  ) {
    super({
      adapter: new PrismaPg({ connectionString: config.get('database.url', { infer: true }) }),
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.write(LogLevel.Info, 'Database connection established', {}, PrismaService.name);
    } catch (error) {
      // Only the error class is logged — driver messages can contain host details.
      this.logger.write(
        LogLevel.Error,
        'Database connection failed at startup',
        { error: error instanceof Error ? error.name : 'UnknownError' },
        PrismaService.name,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.write(LogLevel.Info, 'Database connection closed', {}, PrismaService.name);
  }

  /** Lightweight connectivity probe used by the health check. */
  async ping(): Promise<void> {
    await this.$queryRaw`SELECT 1`;
  }
}
