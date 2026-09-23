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

function normalise(exception: unknown): NormalisedError {
  if (exception instanceof HttpException) {
    const statusCode = exception.getStatus();
    const body = exception.getResponse();
    if (typeof body === 'string') return { statusCode, message: body };

    const { message, details } = body as { message?: unknown; details?: unknown };
    if (Array.isArray(message)) {
      return { statusCode, message: 'Validation failed', details: message };
    }
    return {
      statusCode,
      message: typeof message === 'string' ? message : exception.message,
      ...(Array.isArray(details) ? { details } : {}),
    };
  }
  if (isHttpLikeError(exception) && exception.status < 500) {
    return { statusCode: exception.status, message: exception.message };
  }
  return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: INTERNAL_ERROR_MESSAGE };
}

function reasonPhrase(statusCode: number): string {
  const name = HttpStatus[statusCode] as string | undefined;
  if (!name) return 'Error';
  return name
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
    const { statusCode, message, details } = normalise(exception);

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
      success: false,
      statusCode,
      message,
      error: reasonPhrase(statusCode),
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.originalUrl.split('?')[0],
      ...(request.requestId ? { requestId: request.requestId } : {}),
    };
    response.status(statusCode).json(body);
  }
}
