// Deterministic, non-secret configuration for the test suite. These values
// take precedence over any local `.env`, and no test talks to a real database.
Object.assign(process.env, {
  NODE_ENV: 'test',
  HOST: '127.0.0.1',
  PORT: '2010',
  API_PREFIX: 'api',
  DATABASE_URL: 'postgresql://test_user:test_password@127.0.0.1:5432/wardsetu_test',
  JWT_SECRET: 'test-only-secret',
  JWT_EXPIRES_IN: '1d',
  CORS_ORIGINS: 'https://wardsetu.in,http://localhost:5173',
  SWAGGER_ENABLED: 'true',
  LOG_LEVEL: 'error',
  REQUEST_BODY_LIMIT: '1kb',
});
