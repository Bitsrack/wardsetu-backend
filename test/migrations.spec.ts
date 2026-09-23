import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Validates the migration framework without any database access: migration
 * artifacts must be well-formed and the npm scripts must never include
 * destructive commands.
 */
const root = join(__dirname, '..');
const migrationsDir = join(root, 'prisma', 'migrations');

interface PackageJson {
  engines: Record<string, string>;
  scripts: Record<string, string>;
}
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as PackageJson;

const migrationDirs = (): string[] =>
  readdirSync(migrationsDir).filter((entry) => statSync(join(migrationsDir, entry)).isDirectory());

describe('Prisma migration framework', () => {
  it('has a schema and a migrations directory', () => {
    expect(existsSync(join(root, 'prisma', 'schema.prisma'))).toBe(true);
    expect(existsSync(migrationsDir)).toBe(true);
  });

  it('locks migrations to PostgreSQL', () => {
    const lock = readFileSync(join(migrationsDir, 'migration_lock.toml'), 'utf8');
    expect(lock).toMatch(/provider\s*=\s*"postgresql"/);
  });

  it('names every migration <14-digit timestamp>_<snake_case> with a migration.sql', () => {
    for (const dir of migrationDirs()) {
      expect(dir).toMatch(/^\d{14}_[a-z0-9_]+$/);
      const sql = join(migrationsDir, dir, 'migration.sql');
      expect(existsSync(sql)).toBe(true);
      expect(readFileSync(sql, 'utf8').trim().length).toBeGreaterThan(0);
    }
  });

  it('keeps migrations in chronological order with unique timestamps', () => {
    const stamps = migrationDirs().map((dir) => dir.slice(0, 14));
    expect(new Set(stamps).size).toBe(stamps.length);
    expect([...stamps].sort()).toEqual(stamps);
  });

  it('exposes the operator migration scripts', () => {
    expect(pkg.scripts).toMatchObject({
      'prisma:generate': 'prisma generate',
      'prisma:validate': 'prisma validate',
      'prisma:format': 'prisma format',
      'prisma:migrate:deploy': 'prisma migrate deploy',
      'prisma:migrate:status': 'prisma migrate status',
    });
  });

  it('contains no destructive database scripts', () => {
    const all = Object.values(pkg.scripts).join('\n');
    expect(all).not.toMatch(/migrate\s+reset|db\s+push|force-reset|migrate\s+dev/);
  });
});

describe('runtime requirements', () => {
  it('pins Node.js 24.21.0 and npm 11.19.0', () => {
    expect(pkg.engines).toEqual({ node: '24.21.0', npm: '11.19.0' });
    expect(readFileSync(join(root, '.nvmrc'), 'utf8').trim()).toBe('24.21.0');
  });
});
