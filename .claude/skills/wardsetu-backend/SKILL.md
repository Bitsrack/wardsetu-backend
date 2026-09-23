---
name: wardsetu-backend
description: >
  Build and maintain the WardSetu Node.js backend using Node.js 24.21.0 LTS,
  npm 11.19.0, NestJS, TypeScript, PostgreSQL, Prisma ORM, REST APIs,
  security middleware, structured logging, health checks, Swagger/OpenAPI,
  validation, testing, database migrations and modular architecture.
  Use this skill whenever working on the WardSetu backend repository.
  The production database is accessible only from the server and is NOT
  directly accessible to Claude Code. Infrastructure is strictly isolated.
---

# WardSetu Backend Engineering Skill

## Purpose

You are working on the **WardSetu backend**.

Your responsibility is to build and maintain a clean, secure, scalable, production-ready backend application.

The backend will eventually support a large civic technology platform containing areas such as:

* Authentication
* Users
* Roles
* Permissions
* Organizations
* Wards
* Locations
* Electoral Rolls
* Voters
* Polling Stations
* Candidates
* Campaigns
* Issues
* Volunteers
* Notifications
* GIS
* Reports
* Analytics
* AI

Unless the current task explicitly requests a business module, do not implement those business domains.

The current priority is to establish and maintain a robust backend foundation.

---

# 1. Non-Negotiable Infrastructure Boundary

The WardSetu backend runs on a server that hosts other applications.

**Protect existing infrastructure at all times.**

The following are READ-ONLY unless the user explicitly requests a specific infrastructure change:

* Git configuration
* Git remote
* Git branch
* Nginx
* DNS
* SSL/Certbot
* Firewall
* Existing PM2 applications
* Existing LMS applications
* Existing PostgreSQL databases
* Existing PostgreSQL users
* PostgreSQL server configuration
* Existing application ports
* Other applications on the server

Do not modify infrastructure merely to make WardSetu work.

If an infrastructure problem is discovered:

1. Diagnose it if possible.
2. Explain the problem.
3. Report the problem.
4. Stop before modifying unrelated infrastructure.

Do not use infrastructure changes as a workaround.

---

# 2. Node.js Installation Boundary

The WardSetu backend requires:

```text
Node.js: 24.21.0 LTS
npm: 11.19.0
```

Node.js 24.21.0 is the required LTS runtime for this project, and the official Node.js distribution for that release includes npm 11.19.0.

The current server may still have an older Node.js installation.

Therefore:

**Do NOT upgrade the server-wide Node.js installation automatically.**

This is critical because the server hosts existing LMS applications.

If the server's current global Node.js version is not 24.21.0:

* do not replace the global Node.js installation
* do not run a system-wide Node upgrade
* do not modify existing applications
* report the discrepancy
* use an isolated Node.js 24.21.0 environment if one has already been provided
* otherwise ask the user/operator to provide or install the isolated runtime

Preferred isolation mechanisms may include:

```text
nvm
asdf
mise
containerized build/runtime
```

but do not install or modify system-wide tooling unless explicitly authorized.

The application itself must declare the runtime requirement.

Recommended:

```json
{
  "engines": {
    "node": "24.21.0",
    "npm": "11.19.0"
  }
}
```

Also create:

```text
.nvmrc
```

containing:

```text
24.21.0
```

Do not silently downgrade to Node 18.

---

# 3. npm Requirements

The required npm version is:

```text
11.19.0
```

Use npm as the package manager.

The repository must contain:

```text
package-lock.json
```

Use reproducible installs in CI/deployment:

```bash
npm ci
```

Do not switch the project to:

* Yarn
* pnpm
* Bun

unless explicitly requested.

Do not install global npm packages.

Do not run:

```bash
npm install -g ...
```

as part of normal project setup.

---

# 4. Latest Stable Technology Policy

Use the **latest stable production release** of each major technology at the time the project is initialized or upgraded.

Do NOT use:

* alpha
* beta
* release candidate
* nightly
* canary
* dev
* experimental

versions unless the user explicitly requests them.

As of the current project setup, the verified stable baseline includes:

| Technology        |         Version |
| ----------------- | --------------: |
| Node.js           | **24.21.0 LTS** |
| npm               |     **11.19.0** |
| NestJS            |      **12.0.4** |
| TypeScript        |       **7.0.2** |
| Prisma            |      **7.10.0** |
| @prisma/client    |      **7.10.0** |
| Jest              |      **30.5.2** |
| ESLint            |     **10.11.0** |
| Prettier          |       **3.9.8** |
| Helmet            |       **8.3.0** |
| @nestjs/swagger   |      **12.0.1** |
| @nestjs/terminus  |      **12.1.0** |
| @nestjs/config    |      **12.0.1** |
| RxJS              |       **7.8.2** |
| class-transformer |       **0.5.1** |

These versions should be treated as the baseline, not as an instruction to blindly downgrade an already newer compatible stable version.

For example, Prisma currently publishes 8.0.0 release candidates, but those are **not stable releases**. Use Prisma 7.10.0 until Prisma 8 reaches stable status.

NestJS 12.0.4 is currently the stable `latest` release.

TypeScript 7.0.2 is currently the npm `latest` release.

Jest 30.5.2 is currently the stable `latest` release.

ESLint 10.11.0 and Prettier 3.9.8 are current stable releases.

When starting a new project, verify package versions before installation.

See **§63** for how TypeScript 7 is used alongside TypeScript 6 in this repository, and why the `prisma` npm `latest` tag must not be trusted.

---

# 5. Technology Stack

Use:

* Node.js 24.21.0 LTS
* npm 11.19.0
* NestJS
* TypeScript
* PostgreSQL
* Prisma ORM
* REST API
* JWT-ready authentication architecture
* class-validator
* class-transformer
* Helmet
* Swagger/OpenAPI
* NestJS Terminus
* structured application logging
* environment-based configuration
* ESLint
* Prettier
* Jest

Do not install unnecessary dependencies.

Before adding a dependency, determine whether the required capability is already provided by:

* NestJS
* Node.js
* Prisma
* an existing dependency

Avoid duplicate frameworks.

---

# 6. Project Identity

Project:

```text
WardSetu
```

Repository:

```text
git@github.com:Bitsrack/wardsetu-backend.git
```

Branch:

```text
develop
```

Working directory:

```text
/home/Wardsetu/wardsetu-backend
```

API domain:

```text
https://api.wardsetu.in
```

Internal application address:

```text
127.0.0.1:2010
```

---

# 7. Network Binding

The application MUST bind exclusively to:

```text
127.0.0.1
```

and:

```text
2010
```

The application must never bind to:

```text
0.0.0.0
```

or:

```text
public server IP
```

Never use:

```text
3000
```

Never use a port already occupied by another application.

Port `2020` is reserved for the WardSetu frontend (Next.js). The backend must never bind to, proxy to or modify it.

Server topology:

```text
Frontend (Next.js):  127.0.0.1:2020   → public https://wardsetu.in
Backend  (NestJS):   127.0.0.1:2010   → public https://api.wardsetu.in
```

```text
Internet
│
├── wardsetu.in
│     ↓
│   Nginx
│     ↓
│   127.0.0.1:2020
│     ↓
│   WardSetu Next.js Frontend
│
└── api.wardsetu.in
      ↓
    Nginx
      ↓
    127.0.0.1:2010
      ↓
    WardSetu NestJS Backend
```

Production `CORS_ORIGINS` must include the public frontend origins (`https://wardsetu.in`, `https://www.wardsetu.in`), never the internal `127.0.0.1:2020` address.

Use:

```typescript
await app.listen(port, host);
```

with:

```text
host = 127.0.0.1
port = 2010
```

---

# 8. Forbidden Infrastructure Operations

Never execute:

```bash
pm2 restart all
pm2 reload all
pm2 delete all
systemctl restart nginx
systemctl restart postgresql
```

Do not restart existing services.

Do not modify unrelated PM2 processes.

Do not modify existing LMS applications.

Do not modify unrelated databases.

Do not modify PostgreSQL configuration.

Do not replace system-wide Node.js.

Do not install global npm packages.

---

# 9. Existing Server Inspection

When working on the server, inspect only what is necessary.

Useful commands:

```bash
node -v
npm -v
git status
git branch --show-current
ss -lntp
```

Do not assume that the system runtime is already correct.

Expected application runtime:

```text
Node.js 24.21.0
npm 11.19.0
```

If those versions are unavailable in the isolated project environment, stop and report the issue rather than changing the system installation.

---

# 10. Architecture

Use:

```text
Node.js
TypeScript
NestJS
PostgreSQL
Prisma
REST API
```

Architecture principles:

```text
HTTP
 ↓
Controller
 ↓
DTO / Validation
 ↓
Service
 ↓
Repository/Data Access
 ↓
Prisma
 ↓
PostgreSQL
```

Controllers must remain thin.

Business logic belongs in services.

Database access belongs behind a controlled persistence layer.

Use dependency injection.

Avoid tightly coupling HTTP controllers to Prisma models.

---

# 11. Folder Architecture

Use an enterprise-grade structure:

```text
wardsetu-backend/
│
├── src/
│   ├── main.ts
│   ├── app.module.ts
│
│   ├── config/
│   │   ├── configuration.ts
│   │   ├── env.validation.ts
│   │   └── index.ts
│
│   ├── common/
│   │   ├── constants/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── enums/
│   │   ├── exceptions/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── middleware/
│   │   ├── pipes/
│   │   ├── types/
│   │   └── utils/
│
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── prisma.service.ts
│   │   └── prisma.extension.ts
│
│   ├── health/
│   │   ├── health.module.ts
│   │   ├── health.controller.ts
│   │   └── health.service.ts
│
│   └── modules/
│       ├── auth/
│       ├── users/
│       ├── roles/
│       ├── permissions/
│       ├── organizations/
│       ├── wards/
│       ├── locations/
│       ├── electoral-roll/
│       ├── voters/
│       ├── polling-stations/
│       ├── candidates/
│       ├── campaigns/
│       ├── issues/
│       ├── volunteers/
│       ├── notifications/
│       ├── reports/
│       ├── analytics/
│       ├── gis/
│       └── ai/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── test/
│
├── .env
├── .env.example
├── .gitignore
├── .nvmrc
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── eslint.config.*
├── prettier.config.*
├── package.json
├── package-lock.json
└── README.md
```

Do not create large numbers of meaningless empty files.

---

# 12. Future Module Convention

Future modules should follow:

```text
modules/
└── users/
    ├── users.module.ts
    ├── users.controller.ts
    ├── users.service.ts
    ├── dto/
    ├── entities/
    ├── interfaces/
    └── types/
```

Use consistent conventions.

DTOs must remain separate from database models.

---

# 13. API Configuration

Default:

```env
NODE_ENV=development
HOST=127.0.0.1
PORT=2010
API_PREFIX=api
```

API prefix:

```text
/api
```

Health:

```text
GET /api/health
```

Production base URL:

```text
https://api.wardsetu.in/api
```

Never hard-code production URLs throughout source code.

---

# 14. Environment Configuration

Use:

```text
@nestjs/config
```

with centralized typed configuration.

Required:

```text
.env
.env.example
```

`.env` must never be committed.

`.env.example` must contain placeholders only.

Recommended:

```env
NODE_ENV=development

HOST=127.0.0.1
PORT=2010

API_PREFIX=api

DATABASE_URL=postgresql://warduser:CHANGE_ME@127.0.0.1:5432/wardsetu

JWT_SECRET=CHANGE_ME
JWT_EXPIRES_IN=1d

CORS_ORIGINS=https://wardsetu.in,https://www.wardsetu.in,http://localhost:3000,http://localhost:5173

SWAGGER_ENABLED=true

LOG_LEVEL=info
```

Never expose secrets in:

* source code
* Git
* `.env.example`
* README
* logs
* API responses
* Swagger
* terminal output

---

# 15. Environment Validation

Fail fast when required configuration is missing or invalid.

Validate:

```text
NODE_ENV
HOST
PORT
DATABASE_URL
JWT_SECRET
API_PREFIX
```

Enforce:

```text
HOST = 127.0.0.1
PORT = 2010
```

Use typed configuration.

Do not scatter:

```typescript
process.env.X
```

throughout the application.

---

# 16. Database Access Boundary — CRITICAL

## Claude Code does NOT have database access

The WardSetu PostgreSQL database is accessible only from the server.

Claude Code must assume that direct database connectivity is unavailable unless the user explicitly provides a safe database-access mechanism.

Do NOT attempt:

```bash
psql ...
```

against the production/server database.

Do NOT attempt:

```bash
npx prisma db pull
```

against the server database.

Do NOT attempt:

```bash
npx prisma migrate dev
```

against the production/server database.

Do NOT attempt to discover the database password.

Do NOT attempt to bypass this restriction.

Do NOT expose the database publicly.

---

# 17. Database Information

WardSetu database:

```text
Database: wardsetu
User: warduser
Host: 127.0.0.1
Port: 5432
```

Connection format:

```text
postgresql://warduser:<PASSWORD>@127.0.0.1:5432/wardsetu
```

The actual password is server-side and secret.

Claude Code must not request the production password merely to perform source-code work.

If database access is genuinely required, STOP and ask the user/operator to perform the database operation on the server and provide the non-secret result/output required for the next step.

---

# 18. Database Development Strategy

Because Claude Code does not have database access, the project must use a **migration-first workflow**.

The source of truth for database structure is:

```text
prisma/schema.prisma
```

and version-controlled migration files:

```text
prisma/migrations/
```

Database changes must be represented as migration artifacts in Git.

Never make undocumented manual production database changes.

---

# 19. Prisma Migration Framework

Use **Prisma Migrate** with Prisma 7.10.0 stable.

Prisma Client is also:

```text
7.10.0
```

Prisma 8 release candidates must not be used because they are not stable releases.

Required structure:

```text
prisma/
├── schema.prisma
└── migrations/
    ├── <timestamp>_<migration_name>/
    │   └── migration.sql
    └── ...
```

---

# 20. Migration Workflow

The migration workflow must separate:

### Development schema design

Claude Code can modify:

```text
prisma/schema.prisma
```

and create migration artifacts.

### Database execution

Migration application must be performed by the authorized operator on a machine/server that has database access.

Production migration command:

```bash
npx prisma migrate deploy
```

This command must be executed only where the production database is accessible.

Claude Code must not execute it without database access.

---

# 21. Migration Generation When Database Is Inaccessible

Do not assume `prisma migrate dev` can be used when no database connection exists.

`prisma migrate dev` normally relies on database access for migration development and validation.

When Claude Code does not have database access:

1. Design/update `schema.prisma`.
2. Review the schema carefully.
3. Generate migration SQL using a database-independent approach where practical.
4. Store migration files under `prisma/migrations/`.
5. Review the SQL.
6. Commit the migration artifacts.
7. Ask the authorized operator to apply the migration on the server.
8. The operator runs:

   ```bash
   npx prisma migrate deploy
   ```
9. The operator reports the migration result.
10. Claude Code continues only after receiving the result if further database-dependent work is required.

Never claim that a migration has been successfully applied when Claude Code could not access the database.

---

# 22. Migration Scripts

Provide explicit scripts such as:

```json
{
  "prisma:generate": "prisma generate",
  "prisma:validate": "prisma validate",
  "prisma:format": "prisma format",
  "prisma:migrate:deploy": "prisma migrate deploy",
  "prisma:migrate:status": "prisma migrate status"
}
```

The deployment scripts are intended for execution by the authorized server operator.

Do not automatically run production migration commands.

---

# 23. Migration Safety

Never run:

```bash
npx prisma migrate reset
```

Never run:

```bash
npx prisma db push --force-reset
```

Never:

* drop production tables
* truncate production tables
* reset production database
* overwrite production schema
* modify unrelated databases
* modify unrelated users
* change PostgreSQL configuration

Do not use:

```bash
prisma db push
```

as the normal production deployment mechanism.

Use version-controlled migrations.

---

# 24. Existing Database / Baseline

If the `wardsetu` database already contains tables that were created outside the current Prisma migration history, Claude Code must NOT assume the database schema.

Because direct database access is unavailable:

1. Ask the user/operator to provide a schema dump or Prisma schema representation.
2. Do not run `prisma db pull` against production.
3. Do not invent existing tables.
4. Do not create destructive baseline migrations.
5. Establish the Prisma migration baseline only after the actual database structure is known.

Acceptable operator-provided artifacts may include:

```text
pg_dump --schema-only
```

or an equivalent schema-only export.

Do not request production credentials if a schema-only export is sufficient.

---

# 25. Local Database Development

If local database access is desired, use a separate local PostgreSQL database.

It must NOT be the production WardSetu database.

Example:

```text
wardsetu_dev
```

Local development may use:

```text
DATABASE_URL=postgresql://.../wardsetu_dev
```

Never point local migration development commands at production accidentally.

Before executing migration commands, verify the database target.

---

# 26. Prisma Service

Create a dedicated Prisma service responsible for:

* Prisma initialization
* database connection
* lifecycle integration
* graceful disconnection
* connection management

Integrate it with NestJS lifecycle hooks.

Never expose database credentials.

---

# 27. Database Health Check

Use NestJS Terminus where appropriate.

Health checks should verify:

```text
Application
Database
```

Endpoint:

```text
GET /api/health
```

Safe example:

```json
{
  "status": "ok",
  "service": "wardsetu-backend",
  "database": "up"
}
```

Do not expose:

* credentials
* connection strings
* internal infrastructure details
* stack traces
* environment variables

If the database is unavailable to Claude Code during development, the health-check implementation can be tested structurally/unit-wise, but a real database health result must be reported as **not verified**.

---

# 28. CORS

Production:

```text
https://wardsetu.in
https://www.wardsetu.in
```

Development:

```text
http://localhost:3000
http://localhost:5173
```

Never use:

```text
*
```

for production.

CORS must be environment-configurable.

---

# 29. Security Baseline

Implement:

### Helmet

Use the latest stable Helmet release compatible with the project.

### Validation

Use:

```text
class-validator
class-transformer
```

Global validation:

```text
whitelist: true
transform: true
```

Use:

```text
forbidNonWhitelisted
```

where appropriate.

### Secrets

Never log:

* passwords
* JWT tokens
* Authorization headers
* API keys
* DATABASE_URL
* cookies
* session secrets

### Authentication readiness

Prepare for:

```text
JWT
Refresh Tokens
RBAC
Permissions
```

Do not implement complete authentication unless requested.

---

# 30. Global Validation

Configure one global `ValidationPipe`.

It must:

* transform DTOs
* whitelist accepted properties
* reject unexpected properties where appropriate
* produce consistent validation errors
* avoid leaking implementation details

---

# 31. Error Handling

Use centralized exception handling.

Preferred error structure:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2026-09-18T00:00:00.000Z",
  "path": "/api/example"
}
```

Never expose in production:

* stack traces
* SQL queries
* credentials
* filesystem paths
* environment variables

---

# 32. API Response Convention

Success:

```json
{
  "success": true,
  "message": "Request successful",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Something went wrong",
  "error": "ERROR_CODE"
}
```

Do not over-engineer the response wrapper.

---

# 33. Structured Logging

Implement structured application logging.

Service identifier:

```text
wardsetu-backend
```

Useful fields:

```text
timestamp
level
service
message
requestId
HTTP method
URL
statusCode
responseTime
```

Example:

```text
INFO [wardsetu-backend] Application started
INFO [wardsetu-backend] Listening on 127.0.0.1:2010
```

Never log:

```text
passwords
JWT tokens
Authorization headers
DATABASE_URL
API keys
cookies
session secrets
```

Do not log complete request bodies by default.

Use request/correlation IDs.

---

# 34. Logging Levels

Support:

```text
error
warn
info
debug
```

Configured through:

```env
LOG_LEVEL=info
```

Development may use:

```text
debug
```

Production default:

```text
info
```

---

# 35. Swagger / OpenAPI

Use:

```text
@nestjs/swagger
```

Current stable baseline:

```text
12.0.1
```

Swagger endpoint:

```text
/api/docs
```

Production:

```text
https://api.wardsetu.in/api/docs
```

Title:

```text
WardSetu Backend API
```

Description:

```text
WardSetu civic and election management platform API.
```

Version:

```text
1.0
```

Prepare:

```text
Bearer Authentication
```

but do not implement authentication until requested.

Control through:

```env
SWAGGER_ENABLED=true
```

Swagger must be disableable.

Never expose secrets through Swagger.

---

# 36. main.ts

`main.ts` is responsible only for bootstrapping:

1. Load configuration
2. Create NestJS application
3. Configure Helmet
4. Configure CORS
5. Configure global validation
6. Configure exception handling
7. Configure API prefix
8. Configure Swagger
9. Configure graceful shutdown
10. Start server

No business logic belongs in `main.ts`.

---

# 37. Graceful Shutdown

Handle:

```text
SIGTERM
SIGINT
```

Shutdown sequence:

1. Stop accepting new requests.
2. Complete active requests where possible.
3. Close Prisma connections.
4. Shut down cleanly.

---

# 38. TypeScript

Use strict TypeScript.

Avoid:

```typescript
any
```

unless genuinely necessary.

Use:

* interfaces
* types
* DTOs
* enums
* generics

Keep DTOs separate from Prisma models.

---

# 39. ESLint

Use the latest stable ESLint compatible with the selected NestJS/TypeScript stack.

Current baseline:

```text
ESLint 10.11.0
```

The project must pass:

```bash
npm run lint
```

Do not globally disable lint rules.

---

# 40. Prettier

Use the latest stable Prettier.

Current baseline:

```text
Prettier 3.9.8
```

Required:

```bash
npm run format:check
```

Maintain one project-wide formatting configuration.

---

# 41. Testing

Use the latest stable Jest.

Current baseline:

```text
Jest 30.5.2
```

Test:

### Application

Application bootstrapping.

### Health

```text
GET /api/health
```

### Configuration

Required environment validation.

### Security

Basic middleware configuration.

### Migration framework

Validate migration file structure and migration-related scripts without requiring production DB access.

Do not create large business-domain tests until business modules exist.

---

# 42. Package Scripts

Maintain:

```json
{
  "start": "node dist/main.js",
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "build": "nest build",
  "start:prod": "node dist/main.js",

  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",

  "lint": "eslint .",

  "format": "prettier --write .",
  "format:check": "prettier --check .",

  "prisma:generate": "prisma generate",
  "prisma:validate": "prisma validate",
  "prisma:format": "prisma format",
  "prisma:migrate:deploy": "prisma migrate deploy",
  "prisma:migrate:status": "prisma migrate status"
}
```

Do not blindly overwrite existing valid scripts.

---

# 43. Git Hygiene

`.gitignore` must include:

```gitignore
node_modules/
dist/
coverage/

.env
.env.*
!.env.example

*.log
.DS_Store
```

Never commit:

* production `.env`
* database passwords
* JWT secrets
* API keys
* private keys
* certificates

Do not change:

* Git remote
* Git branch

Do not push automatically unless explicitly requested.

---

# 44. README

Document:

```text
Project purpose
Technology stack
Node.js version
npm version
Architecture
Folder structure
Environment configuration
Database configuration
Migration workflow
Local development
Development server
Production build
Testing
Prisma commands
API prefix
Health endpoint
Swagger endpoint
Deployment migration procedure
```

Clearly document that production database access is restricted to the server/operator.

Never put real credentials in README.

---

# 45. Business Logic Boundary

Unless explicitly requested, do NOT implement:

```text
Voter CRUD
Candidate CRUD
Ward CRUD
Campaign CRUD
Volunteer CRUD
Electoral Roll import
Polling Station management
GIS
Maps
Notifications
AI
Payments
Reports
Analytics
```

The foundation must only support future development.

---

# 46. Development Workflow

Before changing the repository:

1. Inspect repository.
2. Inspect `package.json`.
3. Inspect source.
4. Inspect Prisma schema.
5. Inspect existing migrations.
6. Inspect TypeScript configuration.
7. Inspect environment examples.
8. Inspect Git status.
9. Inspect runtime versions.
10. Determine whether the requested change requires database access.

If database access is required and unavailable:

**STOP and ask for the appropriate operator-provided artifact or action.**

Do not bypass the restriction.

---

# 47. Database-Aware Development Workflow

Whenever a task changes database structure:

### Step 1

Modify:

```text
prisma/schema.prisma
```

### Step 2

Review the resulting schema.

### Step 3

Create the appropriate migration artifact.

### Step 4

Review generated SQL.

### Step 5

Commit migration files together with the schema change.

### Step 6

Do NOT apply the migration to production.

### Step 7

Tell the operator to run:

```bash
npm run prisma:migrate:deploy
```

on the server.

### Step 8

The operator reports:

```text
migration successful
```

or provides the error output.

### Step 9

Continue database-dependent work only after receiving the result.

---

# 48. Database Access Requests

If you need database information that Claude Code cannot obtain:

Ask the user/operator for one of these, depending on the requirement:

### Schema inspection

A schema-only PostgreSQL dump.

Example operator command:

```bash
pg_dump --schema-only -d wardsetu > wardsetu-schema.sql
```

The operator should review the output for secrets before sharing it.

### Current migration state

Operator can run:

```bash
npx prisma migrate status
```

and provide the output.

### Migration application

Operator runs:

```bash
npx prisma migrate deploy
```

and provides success/failure output.

Never ask the user to expose the database publicly.

Never ask for the production database password when an operator-run command or schema-only artifact is sufficient.

---

# 49. Migration Verification Boundary

Because Claude Code does not have production database access:

Claude Code may verify:

```text
schema syntax
Prisma schema validation
migration directory structure
migration SQL presence
migration naming
TypeScript integration
Prisma client generation
application build
unit tests
```

Claude Code cannot independently claim:

```text
production database migration succeeded
production database schema matches Prisma
production database health is OK
production data is intact
```

unless the operator provides evidence.

Always distinguish:

```text
Code verified
```

from:

```text
Production database verified
```

---

# 50. Safe Change Procedure

For meaningful changes:

### Step 1 — Understand

Determine:

* what exists
* why the change is required
* files affected
* database impact
* infrastructure impact

### Step 2 — Plan

Keep changes focused.

### Step 3 — Implement

Modify only required application files.

### Step 4 — Validate

Run appropriate local checks.

### Step 5 — Inspect

Run:

```bash
git diff
git status
```

### Step 6 — Report

Report:

* files changed
* commands executed
* validation results
* database actions required from operator
* unresolved issues

---

# 51. Validation Sequence

For code-only foundation work:

```bash
npm ci
```

Then:

```bash
npm run prisma:generate
npm run prisma:validate
```

Then:

```bash
npm run lint
```

Then:

```bash
npm run format:check
```

Then:

```bash
npm run build
```

Then:

```bash
npm test
```

Do not require production database access for these checks unless a specific test genuinely requires it.

---

# 52. Health Check Verification

If a local database is available:

```bash
npm run start:dev
```

Then:

```bash
curl http://127.0.0.1:2010/api/health
```

Verify:

```bash
ss -lntp | grep 2010
```

Expected:

```text
127.0.0.1:2010
```

Never accept:

```text
0.0.0.0:2010
```

If the only database is server-side and inaccessible to Claude Code:

do not fabricate a database health result.

Report:

```text
Application health implementation: verified
Production database connectivity: not verified from Claude Code
```

---

# 53. Production Deployment Boundary

The production deployment environment is responsible for:

```text
Node.js 24.21.0
npm 11.19.0
environment variables
database connectivity
Prisma migration deployment
process management
```

Claude Code must not modify:

```text
Nginx
DNS
SSL
Firewall
PM2
system services
PostgreSQL configuration
```

unless explicitly instructed.

---

# 54. Security Rules

Never:

* reveal secrets
* print passwords
* print JWT secrets
* expose `.env`
* commit credentials
* expose database connection strings
* disable CORS globally
* disable Helmet without documented reason
* expose stack traces in production
* expose SQL errors directly
* expose unnecessary filesystem paths
* bypass database access restrictions

Use DTO validation.

Use Prisma parameterized queries.

Never construct unsafe raw SQL from user input.

---

# 55. API Design

Use correct HTTP semantics:

```text
GET     read
POST    create
PUT     replace
PATCH   update
DELETE  remove
```

Use appropriate status codes.

Do not return HTTP 200 for errors.

Keep APIs modular and versionable.

Do not couple API responses directly to Prisma models.

---

# 56. Maintainability

Prefer:

* small services
* clear modules
* reusable utilities
* explicit types
* descriptive names
* centralized configuration
* centralized errors
* testable code
* predictable architecture

Avoid:

* giant controllers
* giant services
* circular dependencies
* duplicated configuration
* duplicated utilities
* unnecessary abstractions
* premature microservices

WardSetu is currently one backend application.

Do not convert it into microservices unless explicitly requested.

---

# 57. Dependency Upgrade Policy

When upgrading dependencies:

1. Check the latest stable version.
2. Check Node.js 24 compatibility.
3. Check NestJS compatibility.
4. Check Prisma compatibility.
5. Check for breaking changes.
6. Update related packages consistently.
7. Run tests.
8. Run lint.
9. Run build.
10. Review package-lock changes.

Never upgrade to a prerelease merely because it has a higher version number.

---

# 58. Requirements Conflict Priority

Priority:

1. User's current explicit instruction
2. Repository's existing valid implementation
3. This skill
4. Framework defaults

Never let framework defaults override explicit WardSetu requirements.

Example:

If NestJS defaults to:

```text
0.0.0.0
```

WardSetu must still use:

```text
127.0.0.1:2010
```

---

# 59. Stop Conditions

STOP and ask/report if:

* Node.js 24.21.0 is unavailable
* npm 11.19.0 is unavailable
* a dependency requires an incompatible runtime
* database access is required but unavailable
* the required port is occupied
* infrastructure must be changed
* production database migration requires direct access
* an existing application would need restarting
* credentials are missing
* an existing database schema is unknown
* a destructive migration appears necessary
* an existing configuration conflicts with the requested implementation

Never solve these problems by modifying unrelated systems.

---

# 60. Final Completion Checklist

Before declaring foundation work complete:

### Runtime

* [ ] Node.js 24.21.0 LTS
* [ ] npm 11.19.0
* [ ] `.nvmrc`
* [ ] package engines configured

### Framework

* [ ] NestJS latest stable
* [ ] TypeScript latest stable
* [ ] Prisma latest stable
* [ ] @prisma/client latest stable
* [ ] ESLint latest stable
* [ ] Prettier latest stable
* [ ] Jest latest stable

### Architecture

* [ ] Modular architecture
* [ ] Central configuration
* [ ] Strict TypeScript
* [ ] Thin controllers
* [ ] Service layer
* [ ] Prisma service

### Security

* [ ] Helmet
* [ ] Explicit CORS
* [ ] ValidationPipe
* [ ] DTO validation
* [ ] Centralized errors
* [ ] Secrets protected
* [ ] Request limits
* [ ] Security headers

### API

* [ ] `/api` prefix
* [ ] `/api/health`
* [ ] `/api/docs`
* [ ] Swagger
* [ ] JWT-ready Swagger
* [ ] Consistent response contract

### Database

* [ ] Prisma schema
* [ ] Prisma Client generation
* [ ] Prisma validation
* [ ] Migration directory
* [ ] Migration framework
* [ ] Migration deployment script
* [ ] No destructive migration
* [ ] Production database NOT accessed by Claude Code
* [ ] Operator migration workflow documented

### Operations

* [ ] Graceful shutdown
* [ ] Structured logging
* [ ] Request/correlation ID
* [ ] Production build
* [ ] Tests
* [ ] Lint
* [ ] Formatting

### Network

* [ ] `127.0.0.1:2010`
* [ ] Never `0.0.0.0:2010`
* [ ] Never public IP
* [ ] Existing ports untouched

### Infrastructure

* [ ] Nginx untouched
* [ ] DNS untouched
* [ ] SSL untouched
* [ ] Firewall untouched
* [ ] Existing PM2 untouched
* [ ] Existing LMS applications untouched
* [ ] PostgreSQL server configuration untouched
* [ ] Unrelated databases untouched

---

# 61. Final Report Format

When completing a task, report:

## Project

```text
Project: WardSetu
Repository: git@github.com:Bitsrack/wardsetu-backend.git
Branch: develop
Path: /home/Wardsetu/wardsetu-backend
```

## Runtime

```text
Node.js: 24.21.0
npm: 11.19.0
NestJS: <installed version>
Prisma: <installed version>
@prisma/client: <installed version>
TypeScript: <installed version>
Jest: <installed version>
ESLint: <installed version>
Prettier: <installed version>
```

## API

```text
Host: 127.0.0.1
Port: 2010
Prefix: /api
Health: /api/health
Swagger: /api/docs
```

## Database

Report only:

```text
Database: wardsetu
User: warduser
Host: 127.0.0.1
Port: 5432
```

Never report the password.

## Database Access Status

Clearly state:

```text
Production database access from Claude Code: NOT AVAILABLE
```

If applicable:

```text
Production database migration application: NOT PERFORMED
```

and:

```text
Migration requires execution by the authorized server operator.
```

## Verification

Report:

```text
npm ci
Prisma validation
Prisma generation
lint
format check
tests
production build
local application health check
migration artifact validation
```

For database-dependent verification, distinguish:

```text
Verified locally
```

from:

```text
Not verified — production database is server-only
```

## Migration

If migrations were created:

```text
Schema changed: Yes/No
Migration created: Yes/No
Migration name: <name>
Production migration applied: Yes/No
```

Never claim production migration success without operator evidence.

## Infrastructure Safety

Explicitly confirm:

```text
No Nginx, DNS, SSL, Git configuration, existing PM2 application,
existing LMS application, PostgreSQL server configuration, or unrelated
database was modified.
```

---

# 62. Core Principle

**WardSetu backend development must be application-first, migration-controlled, secure and infrastructure-safe.**

Use the latest stable technology.

Use Node.js 24.21.0 LTS and npm 11.19.0.

Never use prerelease framework versions without explicit authorization.

Keep production database access restricted to the server/operator.

Maintain database changes through version-controlled Prisma migrations.

Never pretend that a production database operation succeeded when Claude Code could not access the database.

Do not expose secrets.

Do not destroy existing data.

Do not modify unrelated infrastructure.

Do not prematurely implement business modules.

Every future WardSetu backend module must be able to build on this foundation without requiring a major architectural rewrite.

---

# 63. Repository Implementation Notes

Facts established while initializing this repository. Keep them in mind
when upgrading or extending the foundation.

### TypeScript 6 + TypeScript 7

TypeScript 7.0.2 is the native (Go) compiler and ships **no JavaScript
compiler API**. Tooling that loads `require('typescript')` cannot use it:

* `typescript-eslint` 8.x requires `typescript >=4.8.4 <6.1.0`
* `ts-jest` 29.x requires `typescript <7`
* `@nestjs/cli` 12 bundles `typescript ~6.0.2`, and the official NestJS 12
  application template uses TypeScript 6

The repository therefore installs:

| Package name  | Version | Used by                                            |
| ------------- | ------: | -------------------------------------------------- |
| `typescript`  |   6.0.3 | `nest build`, ESLint, Jest, editors                 |
| `typescript7` |   7.0.2 | `npm run typecheck` (npm alias for `typescript@7`)  |

`npm run typecheck` type-checks the project with both compilers, so code
stays TypeScript 7 compatible. When typescript-eslint, ts-jest and the Nest
CLI support TypeScript 7, collapse this into a single `typescript@7`
dependency.

### Prisma 7

* The npm `latest` dist-tag of `prisma` currently points to an 8.0.0
  **release candidate**. Always install with an explicit version
  (`prisma@7.10.0`), never `prisma@latest`.
* Prisma 7 uses the `prisma-client` generator. The client is generated to
  `src/generated/prisma` (git-ignored; created by `postinstall` and
  `npm run prisma:generate`).
* The database URL is configured in `prisma.config.ts`, not in
  `schema.prisma`. Prisma 7 does not auto-load `.env`; `prisma.config.ts`
  loads it with Node's built-in `process.loadEnvFile()` when present.
* PostgreSQL is reached through the `@prisma/adapter-pg` driver adapter.
* Migration SQL can be generated with **no database** (§21) by diffing two
  schema files:
  `npx prisma migrate diff --from-schema <previous.prisma> --to-schema prisma/schema.prisma --script -o prisma/migrations/<timestamp>_<name>/migration.sql`
  (get the previous schema with `git show HEAD:prisma/schema.prisma`).
* `prisma/schema.prisma` contains **no models yet**. The production schema
  is unknown to the repository — obtain a schema-only dump from the operator
  (§24, §48) before creating the baseline migration.

### Application layout

* `src/app.setup.ts` — HTTP configuration shared by `main.ts` and the e2e
  tests (trust proxy, request IDs, access log, body limits, Helmet, CORS,
  API prefix, Swagger, shutdown hooks).
* Global `ValidationPipe`, `AllExceptionsFilter` and `ResponseInterceptor`
  are registered as `APP_PIPE` / `APP_FILTER` / `APP_INTERCEPTOR` providers
  in `AppModule`.
* `@SkipResponseWrap()` opts a handler out of the `{ success, message, data }`
  envelope (used by `/api/health`).
* `AppLogger` (`src/common/logger`) is the structured logger: JSON lines in
  production, readable lines elsewhere, with sensitive keys redacted.
* `PrismaService` does not crash the process when the database is
  unreachable at startup; `/api/health` returns 503 with `database: "down"`.

### Authoritative data model

`docs/DATABASE_ARCHITECTURE.md` documents the target schema from the _WardConnect — Backend
Schema & API Specification v3.0_ (42 tables, hierarchy, election terms, representative office
users, issue state machine, auth/roles, audit/consent/deletion/device/feature-flag models).

* Treat it as the authoritative database reference. Preserve its table, column, enum and role
  names exactly.
* It is a design reference, not an implementation. Nothing in it exists in the database yet.
* Resolve the relevant §17 "Source gaps and open questions" (e.g. the undefined
  `user_ward_roles` table, unstated column types) with a recorded decision before implementing
  the affected tables.
* Items marked RECOMMENDED / FUTURE (PostGIS geometry, content translations, outbox,
  term-end reminder, moving `reservation_category` to `election_terms`) are not part of the
  current schema.

### Cloud (Claude Code on the web) sessions

Cloud sessions run in an ephemeral container, **not** on the WardSetu
server. They may use an isolated Node.js 24.21.0 via nvm and a throwaway
local PostgreSQL for verification. They never have access to the production
database. Push to the branch the session designates.
