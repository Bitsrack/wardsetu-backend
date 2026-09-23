import { REDACTED, redact } from './redact.util';

describe('redact', () => {
  it('masks sensitive keys at any depth', () => {
    const result = redact({
      requestId: 'abc',
      password: 'p',
      nested: { authorization: 'Bearer x', apiKey: 'k', DATABASE_URL: 'postgresql://...' },
      list: [{ refreshToken: 't', ok: 1 }],
      cookie: 'c',
    });

    expect(result).toEqual({
      requestId: 'abc',
      password: REDACTED,
      nested: { authorization: REDACTED, apiKey: REDACTED, DATABASE_URL: REDACTED },
      list: [{ refreshToken: REDACTED, ok: 1 }],
      cookie: REDACTED,
    });
  });

  it('leaves primitives untouched', () => {
    expect(redact('text')).toBe('text');
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBeNull();
  });
});
