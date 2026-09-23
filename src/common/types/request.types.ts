import type { Request } from 'express';

/** Express request augmented by `RequestIdMiddleware`. */
export interface RequestWithId extends Request {
  requestId?: string;
}
