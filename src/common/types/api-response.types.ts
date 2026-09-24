/**
 * The WardSetu API success envelope, per `docs/API_SPECIFICATION.md` §2
 * (the v6.0 spec's documented contract, adopted here in place of the
 * earlier `{success, message, data}` shape).
 */
export interface ApiSuccessResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorBody {
  /** Stable, machine-readable code (e.g. `BAD_REQUEST`, `VALIDATION_FAILED`). */
  code: string;
  message: string;
  details?: unknown[];
}

/** The WardSetu API error envelope, per `docs/API_SPECIFICATION.md` §2. */
export interface ApiErrorResponse {
  error: ApiErrorBody;
  requestId?: string;
}
