import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppLogger } from '../logger';
import type { ApiErrorResponse, RequestWithId } from '../types';
import { LogLevel } from '../../config';

const INTERNAL_ERROR_MESSAGE = 'Internal server error';

interface NormalisedError {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown[];
}

/** Errors raised by Express middleware (e.g. body-parser) carry a status. */
type HttpLikeError = Error & { status: number };

function isHttpLikeError(error: unknown): error is HttpLikeError {
  if (!(error instanceof Error)) return false;
  const { status } = error as Error & { status?: unknown };
  return typeof status === 'number' && status >= 400 && status < 600;
}

/** Stable, machine-readable code for a status (e.g. `BAD_REQUEST`, `NOT_FOUND`). */
function errorCode(status: number): string {
  return HttpStatus[status] ?? 'ERROR';
}

function normalise(exception: unknown): NormalisedError {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const body = exception.getResponse();
    if (typeof body === 'string')
      return { statusCode: status, code: errorCode(status), message: body };

    const { message, details } = body as { message?: unknown; details?: unknown };
    if (Array.isArray(message)) {
      return {
        statusCode: status,
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        details: message,
      };
    }
    return {
      statusCode: status,
      code: errorCode(status),
      message: typeof message === 'string' ? message : exception.message,
      ...(Array.isArray(details) ? { details } : {}),
    };
  }
  if (isHttpLikeError(exception) && exception.status < 500) {
    return {
      statusCode: exception.status,
      code: errorCode(exception.status),
      message: exception.message,
    };
  }
  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    code: errorCode(HttpStatus.INTERNAL_SERVER_ERROR),
    message: INTERNAL_ERROR_MESSAGE,
  };
}

/**
 * Converts every error into the WardSetu error contract. Internal details
 * (stack traces, SQL, file paths, env values) are logged server-side only
 * and never sent to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<RequestWithId>();
    const response = ctx.getResponse<Response>();
    const { statusCode, code, message, details } = normalise(exception);

    if (statusCode >= 500) {
      this.logger.write(
        LogLevel.Error,
        'Unhandled exception',
        {
          requestId: request.requestId,
          method: request.method,
          url: request.originalUrl.split('?')[0],
          error: exception instanceof Error ? exception.name : typeof exception,
          stack: exception instanceof Error ? exception.stack : undefined,
        },
        AllExceptionsFilter.name,
      );
    }

    const body: ApiErrorResponse = {
      error: { code, message, ...(details ? { details } : {}) },
      ...(request.requestId ? { requestId: request.requestId } : {}),
    };
    response.status(statusCode).json(body);
  }
}
