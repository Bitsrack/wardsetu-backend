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
  WardConnect Backend Schema & API Specification v4.0, read with v3.1 and v3.0). Do not add,
  rename or redesign tables that contradict it; resolve its §17 open questions before
  implementing affected tables.
- Authorization: role grants live in `user_ward_roles` (term-scoped for `ward_representative` /
  `ward_rep_office`); what a role may do lives in `roles` / `permissions` / `role_permissions`
  (plus optional `user_permission_overrides`). Never hardcode role capabilities in application
  code; enforce in middleware + service/repository queries.
- Schema changes = `prisma/schema.prisma` + a committed migration in `prisma/migrations/`;
  the operator applies them with `npm run prisma:migrate:deploy`.
- Pin exact stable versions; the `prisma` npm `latest` tag is a release candidate.
- Validate with: `npm ci`, `npm run prisma:validate`, `npm run typecheck`, `npm run lint`,
  `npm run format:check`, `npm run build`, `npm test`.
