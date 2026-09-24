# WardSetu Backend

REST API for **WardSetu**, a civic and election management platform. This repository holds
the backend foundation: configuration, security, logging, health checks, OpenAPI docs,
database access and the migration workflow. Business modules (wards, voters, candidates,
campaigns, …) are built on top of it in `src/modules/`.

| Item           | Value                                |
| -------------- | ------------------------------------ |
| Production API | `https://api.wardsetu.in/api`        |
| Internal bind  | `127.0.0.1:2010` (behind Nginx)      |
| Health         | `GET /api/health`                    |
| Swagger UI     | `/api/docs` (JSON: `/api/docs-json`) |

## Technology stack

| Technology         | Version                   |
| ------------------ | ------------------------- |
| Node.js            | 24.21.0 LTS               |
| npm                | 11.19.0                   |
| NestJS             | 12.0.4                    |
| TypeScript         | 7.0.2 + 6.0.3 (see below) |
| Prisma / Client    | 7.10.0                    |
| PostgreSQL adapter | @prisma/adapter-pg 7.10.0 |
| @nestjs/config     | 12.0.1                    |
| @nestjs/swagger    | 12.0.1                    |
| @nestjs/terminus   | 12.1.0                    |
| Helmet             | 8.3.0                     |
| class-validator    | 0.15.1                    |
| class-transformer  | 0.5.1                     |
| RxJS               | 7.8.2                     |
| Jest               | 30.5.2                    |
| ESLint             | 10.11.0                   |
| Prettier           | 3.9.8                     |

All versions are pinned exactly in `package.json`; installs are reproducible with `npm ci`.

## Server topology

| Service           | Internal address | Public URL                |
| ----------------- | ---------------- | ------------------------- |
| WardSetu frontend | `127.0.0.1:2020` | `https://wardsetu.in`     |
| WardSetu backend  | `127.0.0.1:2010` | `https://api.wardsetu.in` |

```text
Internet
├── wardsetu.in      → Nginx → 127.0.0.1:2020 → WardSetu Next.js frontend
└── api.wardsetu.in  → Nginx → 127.0.0.1:2010 → WardSetu NestJS backend
```

Port `2020` belongs to the frontend; the backend never binds to it.

**TypeScript:** TypeScript 7 is the native compiler and has no JavaScript API, which
typescript-eslint, ts-jest and the NestJS CLI still need. `typescript` is therefore 6.0.3
(build, lint, tests), and TypeScript 7.0.2 is installed as the `typescript7` alias.
`npm run typecheck` checks the code with both compilers.

## Runtime requirements

The project requires **Node.js 24.21.0** and **npm 11.19.0** (`engines` in `package.json`,
`.nvmrc`). The server also hosts other applications, so **do not upgrade the server-wide
Node.js**. Use an isolated runtime instead, for example:

```bash
nvm install    # reads .nvmrc
nvm use
node -v        # v24.21.0
npm -v         # 11.19.0
```

## Architecture

```text
HTTP → Controller → DTO / ValidationPipe → Service → Data access → Prisma → PostgreSQL
```

- Controllers are thin; business logic lives in services.
- DTOs are separate from Prisma models; responses never expose Prisma models directly.
- Cross-cutting concerns are global: validation pipe, exception filter, response envelope,
  request IDs, access logging.

### Folder structure

```text
src/
├── main.ts                  # bootstrap only
├── app.module.ts            # root module + global pipe/filter/interceptor
├── app.setup.ts             # HTTP setup shared by main.ts and e2e tests
├── config/                  # typed configuration, env validation, Swagger setup
├── common/
│   ├── constants/           # service name, header names
│   ├── decorators/          # @SkipResponseWrap()
│   ├── filters/             # AllExceptionsFilter (error contract)
│   ├── interceptors/        # ResponseInterceptor (success envelope)
│   ├── logger/              # AppLogger (structured logging)
│   ├── middleware/          # request ID, access log
│   ├── pipes/               # global ValidationPipe factory
│   ├── types/               # shared types
│   └── utils/               # redaction helper
├── database/                # DatabaseModule, PrismaService
├── health/                  # GET /api/health (Terminus)
├── generated/prisma/        # generated Prisma Client (git-ignored)
└── modules/                 # future business modules
prisma/
├── schema.prisma
└── migrations/
prisma.config.ts             # Prisma CLI config (schema, migrations, DATABASE_URL)
test/                        # HTTP tests and migration-framework tests
```

New business modules follow:

```text
src/modules/<name>/
├── <name>.module.ts
├── <name>.controller.ts
├── <name>.service.ts
├── dto/
├── entities/
├── interfaces/
└── types/
```

## Environment configuration

Copy `.env.example` to `.env` and fill in real values. `.env` is git-ignored and must never
be committed. Configuration is validated at startup; the app refuses to start when it is
invalid.

| Variable             | Required | Notes                                                  |
| -------------------- | -------- | ------------------------------------------------------ |
| `NODE_ENV`           | yes      | `development`, `production` or `test`                  |
| `HOST`               | yes      | must be `127.0.0.1`                                    |
| `PORT`               | yes      | must be `2010`                                         |
| `API_PREFIX`         | yes      | `api`                                                  |
| `DATABASE_URL`       | yes      | PostgreSQL URL                                         |
| `JWT_SECRET`         | yes      | in production: at least 32 characters, not `CHANGE_ME` |
| `JWT_EXPIRES_IN`     | no       | default `1d`                                           |
| `CORS_ORIGINS`       | no       | comma-separated; `*` is rejected in production         |
| `SWAGGER_ENABLED`    | no       | default `true`                                         |
| `LOG_LEVEL`          | no       | `error`, `warn`, `info` (default), `debug`             |
| `REQUEST_BODY_LIMIT` | no       | default `1mb`                                          |

## Database

| Setting  | Value       |
| -------- | ----------- |
| Database | `wardsetu`  |
| User     | `warduser`  |
| Host     | `127.0.0.1` |
| Port     | `5432`      |

Connection format: `postgresql://warduser:<PASSWORD>@127.0.0.1:5432/wardsetu`. The
password exists only on the server.

> **Production database access is restricted to the server and its authorized operator.**
> Developers and Claude Code do not connect to it. Never run `prisma migrate dev`,
> `prisma db pull`, `prisma db push` or `prisma migrate reset` against production.

For local development, use a **separate** local database (e.g. `wardsetu_dev`) and point
`DATABASE_URL` at it. Check the target before running any migration command.

### Target data model

The authoritative database design is documented in
[`docs/DATABASE_ARCHITECTURE.md`](docs/DATABASE_ARCHITECTURE.md), based on the WardConnect
Backend Schema & API Specification v6.0 (Consolidated Edition). It covers 48 tables:

- the State → District → City/ULB → Ward → Locality hierarchy;
- election terms and representative office users;
- `user_ward_roles` (location-scoped, nine roles including the State/District/ULB admin tiers,
  with `view_analytics` cascading down the hierarchy and `manage_*` staying exact-tier) and the
  roles/permissions catalog (`roles`, `permissions`, `role_permissions`,
  `ward_role_permission_overrides`, `user_permission_overrides`);
- issues and their state machine;
- the consent, deletion, device and feature-flag models.

It is a reference only; none of it is implemented yet.

### API contract

The API contract shared with the WardSetu frontend team is documented in
[`docs/API_SPECIFICATION.md`](docs/API_SPECIFICATION.md), covering every endpoint group from the
same v6.0 specification (auth/profile, location, ward representatives/elections/office users,
issues and their state machine, content/community, team/roles/permissions, location-tiered
administration, reports/audit/feature-flags/health), the global response/error/pagination
conventions, the full authorization resolution rules, and the OpenAPI/Swagger-as-source-of-truth
policy. It is documentation only; no endpoints are implemented yet, and it is not the OpenAPI
specification itself — once implementation begins, the OpenAPI spec is authoritative for exact
request/response shapes.

### Architecture and product overview

[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) connects the above into one technical picture —
layering, module boundaries, the authorization/issue/election architecture, and the security and
infrastructure boundaries — without duplicating their detail.
[`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) is the high-level product overview (identity,
MVP scope, future phases) for a new developer or agent to orient quickly before going deeper.

### Current schema status

`prisma/schema.prisma` defines no models yet. The existing `wardsetu` database schema is not
known to this repository. Before the first model is added, the operator provides a
schema-only dump:

```bash
pg_dump --schema-only -d wardsetu > wardsetu-schema.sql   # review for secrets before sharing
```

The Prisma migration baseline is then created from the actual structure. No destructive
baseline is ever generated.

## Migration workflow

Database changes are delivered as version-controlled Prisma migrations:

1. Update `prisma/schema.prisma`.
2. Create the migration SQL in `prisma/migrations/<YYYYMMDDHHMMSS>_<snake_case_name>/migration.sql`.
   This works **without any database** by diffing the previous schema against the new one:

   ```bash
   git show HEAD:prisma/schema.prisma > /tmp/previous.prisma
   mkdir -p prisma/migrations/20260923120000_add_example
   npx prisma migrate diff \
     --from-schema /tmp/previous.prisma \
     --to-schema prisma/schema.prisma \
     --script -o prisma/migrations/20260923120000_add_example/migration.sql
   ```

   (Use `--from-empty` for the very first migration only when the target database is empty.)

3. Review the SQL and commit it together with the schema change.
4. **On the server**, the authorized operator applies it:

   ```bash
   npm run prisma:migrate:status   # inspect pending migrations
   npm run prisma:migrate:deploy   # apply them
   ```

5. The operator reports the result. A migration is only considered applied once the
   operator confirms it.

### Prisma commands

| Script                          | Needs DB? | Purpose                                   |
| ------------------------------- | --------- | ----------------------------------------- |
| `npm run prisma:generate`       | no        | generate the client into `src/generated/` |
| `npm run prisma:validate`       | no        | validate `schema.prisma`                  |
| `npm run prisma:format`         | no        | format `schema.prisma`                    |
| `npm run prisma:migrate:status` | yes       | operator: show migration state            |
| `npm run prisma:migrate:deploy` | yes       | operator: apply pending migrations        |

`npm ci` runs `prisma generate` automatically (`postinstall`).

## Local development

```bash
nvm use
npm ci
cp .env.example .env         # then edit values (local database only)
npm run start:dev            # watch mode on http://127.0.0.1:2010
curl http://127.0.0.1:2010/api/health
```

## Production build

```bash
npm ci
npm run build
npm run start:prod           # node dist/main.js, binds 127.0.0.1:2010
```

Process management (PM2), Nginx, TLS and DNS are managed by the server operator and are out
of scope for this repository. The process handles `SIGTERM`/`SIGINT` gracefully: it stops
accepting requests, closes the Prisma connection and exits.

## Quality checks

```bash
npm run prisma:validate
npm run typecheck            # TypeScript 6 and TypeScript 7
npm run lint
npm run format:check
npm run build
npm test                     # unit + HTTP tests, no database required
npm run test:cov
```

## API conventions

Matches `docs/API_SPECIFICATION.md` §2 (the v6.0 spec's documented contract — an earlier
`{success, message, data}` shape was implemented first and has since been migrated to this one;
see `plan.md` §3.5/§7 for that decision).

Success:

```json
{ "data": {} }
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed",
    "details": [{ "field": "count", "errors": ["count must not be less than 1"] }]
  },
  "requestId": "…"
}
```

Stack traces, SQL and internal messages are never returned to clients. Every response
carries an `x-request-id` header, which also appears in the logs.

`GET /api/health` returns `200` when healthy and `503` when the database is down:

```json
{ "status": "ok", "service": "wardsetu-backend", "database": "up", "timestamp": "…" }
```
