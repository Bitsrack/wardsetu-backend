import { Injectable } from '@nestjs/common';
import { HealthCheckService, HealthIndicatorService } from '@nestjs/terminus';
import { SERVICE_NAME } from '../common/constants';
import { PrismaService } from '../database/prisma.service';

const DATABASE_PING_TIMEOUT_MS = 3000;

export type ComponentStatus = 'up' | 'down';

export interface HealthReport {
  status: 'ok' | 'error';
  service: string;
  database: ComponentStatus;
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly indicator: HealthIndicatorService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Runs the Terminus checks and reduces them to a minimal public report.
   * Error details from failing indicators are deliberately not exposed.
   */
  async check(): Promise<HealthReport> {
    let database: ComponentStatus;
    try {
      const result = await this.health.check([
        () =>
          this.indicator
            .check('database')
            .attempt(() => this.prisma.ping())
            .withTimeout(DATABASE_PING_TIMEOUT_MS),
      ]);
      database = result.details.database?.status === 'up' ? 'up' : 'down';
    } catch {
      // HealthCheckService throws ServiceUnavailableException when any check is down.
      database = 'down';
    }

    return {
      status: database === 'up' ? 'ok' : 'error',
      service: SERVICE_NAME,
      database,
      timestamp: new Date().toISOString(),
    };
  }
}
