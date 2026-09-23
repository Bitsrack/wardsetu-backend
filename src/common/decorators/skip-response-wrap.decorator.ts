import { SetMetadata } from '@nestjs/common';

export const SKIP_RESPONSE_WRAP = 'wardsetu:skip-response-wrap';

/**
 * Return the handler's value as-is instead of wrapping it in the standard
 * `{ success, message, data }` envelope (e.g. for health probes).
 */
export const SkipResponseWrap = (): MethodDecorator & ClassDecorator =>
  SetMetadata(SKIP_RESPONSE_WRAP, true);
