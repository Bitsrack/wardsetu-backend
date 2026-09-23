import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, type Observable } from 'rxjs';
import { SKIP_RESPONSE_WRAP } from '../decorators';
import type { ApiSuccessResponse } from '../types';

export const DEFAULT_SUCCESS_MESSAGE = 'Request successful';

/** Wraps successful responses in `{ success: true, message, data }`. */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T> | T> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T> | T> {
    const skip = this.reflector.getAllAndOverride<boolean | undefined>(SKIP_RESPONSE_WRAP, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return next.handle();

    return next
      .handle()
      .pipe(map((data) => ({ success: true as const, message: DEFAULT_SUCCESS_MESSAGE, data })));
  }
}
