# WardSetu backend — Claude Code instructions

Always load and follow the project skill before working in this repository:
`.claude/skills/wardsetu-backend/SKILL.md` (skill name `wardsetu-backend`).

Key rules (the skill is authoritative):

- Runtime: Node.js 24.21.0 / npm 11.19.0 (`.nvmrc`). Never change the system-wide Node.js.
- The app binds only to `127.0.0.1:2010`; the API prefix is `/api`. Port `2020` is reserved
  for the WardSetu frontend — never use or modify it.
- Claude Code has **no** production database access. Never run `psql`, `prisma db pull`,
  `prisma migrate dev`, `prisma migrate reset` or `prisma db push` against it.
- The authoritative data-model reference is `docs/DATABASE_ARCHITECTURE.md` (from the
  WardConnect Backend Schema & API Specification **v5.0 Consolidated Edition**). Do not add,
  rename or redesign tables that contradict it; resolve its §17 open questions before
  implementing affected tables.
- Authorization (v5.0): every user has `user_ward_roles` rows. A `citizen` row is auto-created at
  first OTP verify. Rows are scoped by exactly one of ward/city/district/state, enforced by a
  CHECK, and are term-scoped for `ward_representative` / `ward_rep_office`. There are nine roles,
  including `ulb_admin`, `district_admin` and `state_admin`. Permissions resolve in three tiers,
  most specific first: user override, then ward-role override
  (`ward_role_permission_overrides`), then platform default (`role_permissions`). Never hardcode
  role capabilities in application code; enforce in middleware + service/repository queries.
- Nullable columns inside unique keys use `UNIQUE NULLS NOT DISTINCT` (PostgreSQL 15+; the spec
  targets 16.x).
- Schema changes = `prisma/schema.prisma` + a committed migration in `prisma/migrations/`;
  the operator applies them with `npm run prisma:migrate:deploy`.
- Pin exact stable versions; the `prisma` npm `latest` tag is a release candidate.
- Validate with: `npm ci`, `npm run prisma:validate`, `npm run typecheck`, `npm run lint`,
  `npm run format:check`, `npm run build`, `npm test`.
