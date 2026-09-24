# WardSetu backend — Claude Code instructions

Always load and follow the project skill before working in this repository:
`.claude/skills/wardsetu-backend/SKILL.md` (skill name `wardsetu-backend`).

Documentation layering (avoid restating facts owned elsewhere): `SKILL.md` is authoritative for
engineering/style rules, `ARCHITECTURE.md` for system architecture, `docs/DATABASE_ARCHITECTURE.md`
for the database design, `docs/API_SPECIFICATION.md` for the API contract, and
`docs/PROJECT_OVERVIEW.md` for product-level scope. This file only points to them.

Key rules (the skill is authoritative):

- Runtime: Node.js 24.21.0 / npm 11.19.0 (`.nvmrc`). Never change the system-wide Node.js.
- The app binds only to `127.0.0.1:2010`; the API prefix is `/api`. Port `2020` is reserved
  for the WardSetu frontend — never use or modify it.
- Claude Code has **no** production database access. Never run `psql`, `prisma db pull`,
  `prisma migrate dev`, `prisma migrate reset` or `prisma db push` against it.
- The authoritative data-model reference is `docs/DATABASE_ARCHITECTURE.md` (from the
  WardConnect Backend Schema & API Specification **v6.0 Consolidated Edition**). Do not add,
  rename or redesign tables that contradict it; resolve its §17 open questions before
  implementing affected tables.
- The authoritative API contract (shared with the frontend team) is `docs/API_SPECIFICATION.md`,
  from the same v6.0 spec. **OpenAPI/Swagger is the executable source of truth**: every new or
  modified endpoint must be added to the OpenAPI spec, request/response schemas and auth
  requirements must stay synchronized with it, and generated client types must be regenerated
  from it — an API change is not complete if its Swagger/OpenAPI documentation is missing or
  outdated.
- Authorization (v6.0): the full role/scope model, permission catalog, and three-tier precedence
  are authoritative in `docs/DATABASE_ARCHITECTURE.md` §13 and `docs/API_SPECIFICATION.md` §6/§11
  — do not restate them here or re-derive them independently. Never hardcode role capabilities in
  application code; enforce in middleware + service/repository queries, evaluated server-side only.
- Nullable columns inside unique keys use `UNIQUE NULLS NOT DISTINCT`. Confirmed compatible with
  the operator's server: **PostgreSQL 16.15** (needs 15+).
- Schema changes = `prisma/schema.prisma` + a committed migration in `prisma/migrations/`;
  the operator applies them with `npm run prisma:migrate:deploy`.
- Pin exact stable versions; the `prisma` npm `latest` tag is a release candidate.
- Validate with: `npm ci`, `npm run prisma:validate`, `npm run typecheck`, `npm run lint`,
  `npm run format:check`, `npm run build`, `npm test`.
