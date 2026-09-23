const SENSITIVE_KEY_PATTERN =
  /pass(word)?|secret|token|authorization|cookie|api[-_]?key|database[-_]?url|connection[-_]?string|session/i;

export const REDACTED = '[REDACTED]';

/**
 * Returns a copy of `value` with every property whose key looks sensitive
 * replaced by `[REDACTED]`. Used for anything that is about to be logged.
 */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 5 || value === null || typeof value !== 'object') return value;
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : redact(item, depth + 1),
    ]),
  );
}
