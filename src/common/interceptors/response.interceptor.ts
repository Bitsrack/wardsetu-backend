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

/** Wraps successful responses in `{ data, meta? }` (`docs/API_SPECIFICATION.md` §2). */
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

    return next.handle().pipe(map((data) => ({ data })));
  }
}
