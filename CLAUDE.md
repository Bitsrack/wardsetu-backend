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
  WardConnect Backend Schema & API Specification **v6.0 Consolidated Edition**). Do not add,
  rename or redesign tables that contradict it; resolve its §17 open questions before
  implementing affected tables.
- The authoritative API contract (shared with the frontend team) is `docs/API_SPECIFICATION.md`,
  from the same v6.0 spec. **OpenAPI/Swagger is the executable source of truth**: every new or
  modified endpoint must be added to the OpenAPI spec, request/response schemas and auth
  requirements must stay synchronized with it, and generated client types must be regenerated
  from it — an API change is not complete if its Swagger/OpenAPI documentation is missing or
  outdated.
- Authorization (v6.0): every user has `user_ward_roles` rows. A `citizen` row is auto-created at
  first OTP verify (existing users need a one-off backfill, §8.1). Rows are scoped by exactly one
  of ward/city/district/state, enforced by a CHECK, and are term-scoped for
  `ward_representative` / `ward_rep_office`. There are nine roles, including `ulb_admin`,
  `district_admin` and `state_admin`. Permissions resolve in three tiers, most specific first:
  user override, then ward-role override (`ward_role_permission_overrides`), then platform
  default (`role_permissions`). `view_analytics` permissions cascade down the location hierarchy;
  `manage_*` permissions never do (§13.6). `ward_rep_office` has a narrower set than
  `ward_representative` — no team/access-management or election-recording powers (§13.5.3). Ward
  admins may only manage ward-scoped escalation rules; only `platform_admin` may edit the
  platform-wide default (`escalation_rules:manage_platform_defaults`). Never hardcode role
  capabilities in application code; enforce in middleware + service/repository queries.
- Nullable columns inside unique keys use `UNIQUE NULLS NOT DISTINCT`. Confirmed compatible with
  the operator's server: **PostgreSQL 16.15** (needs 15+).
- Schema changes = `prisma/schema.prisma` + a committed migration in `prisma/migrations/`;
  the operator applies them with `npm run prisma:migrate:deploy`.
- Pin exact stable versions; the `prisma` npm `latest` tag is a release candidate.
- Validate with: `npm ci`, `npm run prisma:validate`, `npm run typecheck`, `npm run lint`,
  `npm run format:check`, `npm run build`, `npm test`.
