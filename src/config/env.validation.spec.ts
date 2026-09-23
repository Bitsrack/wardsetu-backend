import { buildConfiguration } from './configuration';
import { LogLevel, NodeEnvironment, validateEnv } from './env.validation';

const validEnv = (): Record<string, string> => ({
  NODE_ENV: 'development',
  HOST: '127.0.0.1',
  PORT: '2010',
  API_PREFIX: 'api',
  DATABASE_URL: 'postgresql://user:pass@127.0.0.1:5432/wardsetu_dev',
  JWT_SECRET: 'dev-secret',
});

const productionEnv = (): Record<string, string> => ({
  ...validEnv(),
  NODE_ENV: 'production',
  JWT_SECRET: 'x'.repeat(48),
  CORS_ORIGINS: 'https://wardsetu.in,https://www.wardsetu.in',
});

describe('validateEnv', () => {
  it('accepts a valid environment and applies defaults', () => {
    const env = validateEnv(validEnv());

    expect(env.PORT).toBe(2010);
    expect(env.NODE_ENV).toBe(NodeEnvironment.Development);
    expect(env.SWAGGER_ENABLED).toBe(true);
    expect(env.LOG_LEVEL).toBe(LogLevel.Info);
    expect(env.JWT_EXPIRES_IN).toBe('1d');
    expect(env.REQUEST_BODY_LIMIT).toBe('1mb');
  });

  it.each(['NODE_ENV', 'HOST', 'PORT', 'API_PREFIX', 'DATABASE_URL', 'JWT_SECRET'])(
    'fails fast when %s is missing',
    (key) => {
      const env = validEnv();
      delete env[key];
      expect(() => validateEnv(env)).toThrow(/Invalid environment configuration/);
    },
  );

  it.each(['0.0.0.0', 'localhost', '10.0.0.5'])('rejects HOST=%s', (host) => {
    expect(() => validateEnv({ ...validEnv(), HOST: host })).toThrow(/HOST must be 127\.0\.0\.1/);
  });

  it.each(['3000', '2011', 'abc'])('rejects PORT=%s', (port) => {
    expect(() => validateEnv({ ...validEnv(), PORT: port })).toThrow(/PORT must be 2010/);
  });

  it('rejects a non-PostgreSQL DATABASE_URL', () => {
    expect(() => validateEnv({ ...validEnv(), DATABASE_URL: 'mysql://x@y/z' })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('parses SWAGGER_ENABLED=false', () => {
    expect(validateEnv({ ...validEnv(), SWAGGER_ENABLED: 'false' }).SWAGGER_ENABLED).toBe(false);
  });

  it('never echoes secret values in error messages', () => {
    const secret = 'super-secret-value-123';
    try {
      validateEnv({
        ...productionEnv(),
        JWT_SECRET: secret,
        DATABASE_URL: `postgresql://u:${secret}@h/db`,
        PORT: '1',
      });
      throw new Error('expected validation to fail');
    } catch (error) {
      expect((error as Error).message).not.toContain(secret);
    }
  });

  describe('production rules', () => {
    it('accepts a production environment with real values', () => {
      expect(() => validateEnv(productionEnv())).not.toThrow();
    });

    it.each(['CHANGE_ME', 'too-short'])('rejects JWT_SECRET=%s', (secret) => {
      expect(() => validateEnv({ ...productionEnv(), JWT_SECRET: secret })).toThrow(/JWT_SECRET/);
    });

    it('rejects placeholder database credentials', () => {
      expect(() =>
        validateEnv({
          ...productionEnv(),
          DATABASE_URL: 'postgresql://warduser:CHANGE_ME@127.0.0.1:5432/wardsetu',
        }),
      ).toThrow(/DATABASE_URL/);
    });

    it('rejects a wildcard CORS origin', () => {
      expect(() => validateEnv({ ...productionEnv(), CORS_ORIGINS: '*' })).toThrow(/CORS_ORIGINS/);
    });
  });
});

describe('buildConfiguration', () => {
  it('maps variables into the typed configuration', () => {
    const config = buildConfiguration(
      validateEnv({ ...validEnv(), CORS_ORIGINS: ' https://a.test , ,https://b.test ' }),
    );

    expect(config.app).toMatchObject({ host: '127.0.0.1', port: 2010, apiPrefix: 'api' });
    expect(config.app.isProduction).toBe(false);
    expect(config.cors.origins).toEqual(['https://a.test', 'https://b.test']);
  });
});
