import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Response } from 'express';
import { AppLogger } from '../logger';
import type { RequestWithId } from '../types';
import { LogLevel } from '../../config';

/**
 * Logs one line per completed request. Deliberately omits headers, query
 * strings and bodies, which may carry tokens or personal data.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}

  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const responseTime = Number(process.hrtime.bigint() - start) / 1e6;
      const level =
        res.statusCode >= 500
          ? LogLevel.Error
          : res.statusCode >= 400
            ? LogLevel.Warn
            : LogLevel.Info;
      this.logger.write(
        level,
        'HTTP request completed',
        {
          requestId: req.requestId,
          method: req.method,
          url: req.originalUrl.split('?')[0],
          statusCode: res.statusCode,
          responseTime: Math.round(responseTime * 100) / 100,
        },
        'HTTP',
      );
    });
    next();
  }
}
