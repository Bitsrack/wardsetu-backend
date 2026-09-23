import { defineConfig } from 'prisma/config';

// Prisma 7 does not load `.env` automatically. Load it when present; on the
// server the environment may be provided by the process manager instead.
try {
  process.loadEnvFile();
} catch {
  // No .env file — rely on the existing process environment.
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Only commands that talk to the database (migrate deploy/status) need a
    // real URL. generate/validate/format work without one.
    url: process.env.DATABASE_URL ?? '',
  },
});
