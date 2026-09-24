# WardSetu Backend — Architecture

## Document control

| Field                               | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Status                              | Documentation only. No application source code, database schema, Prisma models, API implementation, migrations, infrastructure, environment files, or deployment configuration changed to produce this document.                                                                                                                                                                                                                                                                           |
| Scope                               | Technical architecture — how the backend is layered, where each responsibility belongs, and the rules that keep it maintainable as it scales. Not a database schema document, an API reference, or a security manual.                                                                                                                                                                                                                                                                      |
| Authoritative implementation source | `.claude/skills/wardsetu-backend/SKILL.md` — this document connects that spec into a coherent architecture; it does not restate its detailed rules.                                                                                                                                                                                                                                                                                                                                        |
| Related documents                   | `CLAUDE.md` (project instructions), `README.md` (setup/scripts), `docs/DATABASE_ARCHITECTURE.md` (authoritative database design), `docs/API_SPECIFICATION.md` (authoritative API contract), `docs/PROJECT_OVERVIEW.md` (product-level context), the WardSetu frontend repository's `docs/ARCHITECTURE.md`.                                                                                                                                                                                 |
| Source spec note                    | This document's task instructions refer to "WardConnect / WardSetu Backend Schema & API Specification v5.0." The version already authoritative for `docs/DATABASE_ARCHITECTURE.md` and `docs/API_SPECIFICATION.md` in this repository is **Version 6.0 (Consolidated Edition), 17 Sep 2026**. This document follows that same v6.0 content for internal consistency, per the standing instruction not to rely on outdated documentation when a newer one defines the current architecture. |
| Current state                       | `prisma/schema.prisma` defines no models yet; `src/modules/` contains no business modules yet. This document describes the architecture that implementation must follow, not a description of already-built modules.                                                                                                                                                                                                                                                                       |

---

## 1. Architecture Goals

- Keep controllers thin and business logic in services, so behavior stays testable and independent of the HTTP framework.
- Make the backend the single, authoritative point of authorization — the frontend's UI-level checks are never trusted as security.
- Treat OpenAPI/Swagger as the executable contract, kept in lockstep with every endpoint change.
- Keep ward civic data structurally independent of any single election term or representative (§9).
- Keep modules isolated by business capability, so new capabilities (tiered administration, GIS, i18n content) can be added without restructuring existing ones.
- Preserve strict infrastructure isolation: bind only to `127.0.0.1:2010`, never touch the frontend's port, database, or the server's other applications.

## 2. Layered/Modular Architecture

```text
HTTP / REST
     ↓
Controllers
     ↓
Guards / Authentication / Authorization
     ↓
Application / Domain Services
     ↓
Business Rules
     ↓
Repositories / Data Access
     ↓
Prisma ORM
     ↓
PostgreSQL
```

Supporting infrastructure, applied globally rather than per module:

```text
Validation
Logging
Exception Handling
Audit
Health Checks
Configuration
OpenAPI
Testing
```

**Controllers** parse and route HTTP requests; they hold no business logic. **Guards** decide, before a handler runs, whether the caller is authenticated and (once implemented) authorized for the requested scope/permission. **Services** hold business rules — the issue state machine, election-term lifecycle, permission resolution — independent of HTTP concerns. **Repositories/data access** isolate Prisma usage so services depend on a data-access interface, not directly on generated Prisma types, keeping business logic portable if the persistence layer's shape changes. **Prisma → PostgreSQL** is the only path to the database; nothing bypasses it with raw, unparameterized SQL. This mirrors the current `README.md` "Architecture" section and `SKILL.md` §10 exactly; it does not introduce a stricter pattern than those documents require (`SKILL.md` §56).

## 3. NestJS Module Architecture

Business capability is organized into isolated NestJS modules under `src/modules/`, each owning its controller(s), service(s), DTOs, and (once persistence exists) its slice of the Prisma schema. Per the current API and database specifications (`docs/API_SPECIFICATION.md`, `docs/DATABASE_ARCHITECTURE.md`), the conceptual module areas are:

```text
auth
users              (profile, devices, notification preferences, consent, data-deletion)
roles / permissions
locations          (states, districts, cities, wards, localities)
representatives    (election terms, representative profiles, office users)
issues             (issues, categories, media, links, escalation rules)
content            (updates, events, schemes, library, opportunities)
community          (ideas, polls)
team               (invites, ward role assignment)
administration     (location-tiered admin: state/district/ULB/ward admins)
reports            (monthly reports, CSV export)
audit
feature-flags
health
```

This list reflects the current, spec-driven module boundaries (matching `docs/API_SPECIFICATION.md` §3–§10) rather than the illustrative module list in `SKILL.md` §11, which predates the WardConnect specification and names capabilities (`electoral-roll`, `voters`, `polling-stations`, `candidates`, `campaigns`, `volunteers`, `gis`, `ai`) not present in the current authoritative spec. Per the standing instruction not to rely on outdated documentation, new module scaffolding should follow the list above; `SKILL.md` §11's folder skeleton (`modules/<name>/{*.module.ts, *.controller.ts, *.service.ts, dto/, entities/, interfaces/, types/}`) remains the correct per-module file convention.

A module does not reach into another module's internals (its Prisma access, private services, or entities) — cross-module interaction happens through a module's exported service/provider surface. This keeps, for example, the `issues` module's escalation logic independent of exactly how the `administration` module resolves a tiered admin's scope.

## 4. Database Architecture

```text
Business/Application Logic
          ↓
Data Access
          ↓
Prisma
          ↓
PostgreSQL
```

PostgreSQL is the sole persistence layer; Prisma is the sole ORM/data-access mechanism, generating a typed client from `prisma/schema.prisma` and applying changes exclusively through version-controlled migrations (`README.md` "Migration workflow"). The backend never exposes PostgreSQL directly to the frontend or any other consumer — every read and write goes through the REST API.

The concepts a backend engineer must hold in mind when touching this layer — normalized State→District→City/ULB→Ward→Locality hierarchy, ward continuity across elections, election terms, representative profiles, term-scoped representative access, `user_ward_roles` (roles + scope), the permissions/override precedence chain, the issue lifecycle, and auditability — are architectural concepts this document names but does not define. **`docs/DATABASE_ARCHITECTURE.md` is authoritative for every table, column, constraint, and relationship**; this document does not reproduce them.

## 5. Authorization Architecture

```text
Users
   ↓
Roles
   ↓
Scope
   ↓
Permissions
   ↓
Permission Overrides
```

Authorization is resolved server-side, on every request, with no reliance on anything the frontend reports about itself. Precedence, most specific first:

```text
User-level override
        ↓
Ward-role override
        ↓
Platform default
```

An expired user-level override (`expires_at` in the past) is treated as inactive and never contributes a grant. This precedence and the location-hierarchy cascade rule for `view_analytics`-shaped vs. `manage_*`-shaped permissions are architectural facts this document names so the reason for the layering (guards → services, §2) makes sense; the exact rule set, role table, and permission catalog are authoritative in `docs/DATABASE_ARCHITECTURE.md` §13 and `docs/API_SPECIFICATION.md` §6/§11, not here.

## 6. Role and Scope Model

The current authoritative role set:

```text
citizen
ward_staff
ward_representative
ward_rep_office
ward_admin
ulb_admin
district_admin
state_admin
platform_admin
```

Each role, other than `citizen` and `platform_admin`, is scoped to exactly one of Ward / City (ULB) / District / State — never more than one, and the applicable scope per role is fixed, not a free choice made per assignment. This document does not redefine which role takes which scope, nor the exact `user_ward_roles` constraints — see `docs/DATABASE_ARCHITECTURE.md` §4/§13 and `docs/API_SPECIFICATION.md` §6/§11 for those rules, including the cascade behavior of tiered-admin `view_analytics` permissions versus the exact-tier behavior of `manage_*` permissions.

## 7. Issue Workflow Architecture

The issue system is an explicit state machine:

```text
submitted
    ↓
verified
    ↓
assigned
    ↓
in_progress
    ↓
resolved
    ↓
reopened
```

with documented rejection (`submitted → rejected`, `rejected → reopened`) and reopen paths (`resolved → reopened`; `reopened → verified | assigned | in_progress`). No additional states exist, and this document does not introduce any.

Architecturally, every state transition is a single unit of business consistency: the new `issues.status`, the corresponding `issue_events` row, and an `audit_logs` row are written together. This is why the service layer (§2), not the controller, owns transition logic — a transition is a business operation with side effects, not a bare field update. `issue_ratings` and `issue_escalations` are side records, not states, and do not participate in this transition. The exact status set, transition table, and transactional requirement are defined in `docs/API_SPECIFICATION.md` §7 and `docs/DATABASE_ARCHITECTURE.md` §12 — this document does not alter or restate them beyond what is needed to explain why the service/transaction boundary is drawn where it is.

## 8. Election/Term Architecture

```text
Ward
  │
  ├── Election Term 1
  │      └── Representative
  │
  ├── Election Term 2
  │      └── Representative
  │
  └── Election Term N
         └── Representative
```

The governing architectural rule: **ward civic data belongs to the ward, not to an election term or representative.** Consequently:

- Election terms are historical records — an outgoing term is never deleted, only marked no longer current.
- Representatives are associated with terms (not the other way around); a representative profile may persist and be reused across multiple terms if the same person is re-elected.
- Representative office access (`representative_office_users`) is term-scoped and is revoked, together with the corresponding `user_ward_roles` rows, in the same transaction that closes a term.
- Closing a term never archives, migrates, or otherwise touches ward-owned civic data (issues, updates, events, schemes, library items, opportunities, localities).
- Historical representatives remain queryable indefinitely.
- New-term identity selection is always explicit — the caller supplies either an existing representative profile's ID or creates a new one; the platform never infers identity by matching name or mobile number, and a likely-duplicate contact match is rejected (409) rather than silently merged.

This is a core architectural boundary because it determines where transactional consistency is required (§10) and why the `representative_office_users` grant lifecycle is coupled to term closure rather than to the representative's own record. The exact tables and API endpoints implementing this are authoritative in `docs/DATABASE_ARCHITECTURE.md` §3 and `docs/API_SPECIFICATION.md` §5 — not reproduced here.

## 9. API Architecture

The backend exposes a REST API with a consistent contract. Conceptually:

```json
{
  "data": {},
  "meta": {}
}
```

```json
{
  "error": {
    "code": "...",
    "message": "...",
    "details": {}
  },
  "requestId": "..."
}
```

**Implementation note (resolved — see `plan.md` §3.5/§7):** the response envelope was originally implemented by the bootstrap infrastructure (`ResponseInterceptor`/`AllExceptionsFilter`) as `{ success, message, data }` / `{ success: false, statusCode, message, error, details?, timestamp, path, requestId }`, which did not match this document. That envelope has been migrated to the `{data, meta?}` / `{error:{code,message,details?}, requestId}` shape `docs/API_SPECIFICATION.md` §2 documents as the v6.0 spec's target contract — confirmed as the correct direction rather than the other way around, since the frontend and the OpenAPI-as-source-of-truth policy are both built around it. Any future business module should assume this shape is already in place.

No new endpoint, request/response field, or status code is defined here — `docs/API_SPECIFICATION.md` is the authoritative API contract.

## 10. OpenAPI / Swagger

OpenAPI/Swagger is the **machine-readable, executable** API contract. Every API endpoint and every API change must remain synchronized with it:

```text
Implementation
     +
Validation
     +
OpenAPI/Swagger
     +
Tests
```

must all move together. Generated frontend client types, where the frontend chooses to generate them, are regenerated from the OpenAPI specification whenever it changes — they are never hand-maintained against a stale contract. An API change is not complete if its Swagger/OpenAPI documentation is missing or outdated (this restates, at the architecture level, the same rule `docs/API_SPECIFICATION.md` §1 and `CLAUDE.md` state as policy). `@nestjs/swagger` generates the spec from the same decorators/DTOs the controllers use, served at `/api/docs` (`/api/docs-json` for the raw document) once implemented — see `SKILL.md` §35.

## 11. Validation and Error Handling

Request validation, DTO validation, authentication failures, authorization failures, business-rule failures, not-found conditions, conflicts, and unexpected errors are all handled through the same centralized mechanisms already defined in `SKILL.md` §30–§31: a single global `ValidationPipe` (whitelisting, transforming, rejecting unexpected properties) and a single global exception filter producing a consistent error shape. No second, parallel error-handling framework is introduced for any module — a `409` on a duplicate election-result identity match (§8) or a `404` on a missing issue both flow through the same filter as a DTO validation failure.

## 12. Logging and Audit

Two logs are kept conceptually distinct:

- **Application logging** — diagnostic: request IDs, HTTP method/URL/status/response time, structured JSON in production. Exists to answer "what is the system doing," not "who did what."
- **Business audit logging** (`audit_logs`) — exists to answer "who did what, to what, and when" for privileged or business-significant operations: issue state transitions, election-term changes, permission-override grants, role assignments, and any other privileged write the specification calls out.

Neither log ever records secrets, tokens, passwords, OTPs, or full request/response bodies containing sensitive citizen data (`SKILL.md` §33, §54). A privileged write that is not paired with an audit entry is an architectural defect, not a stylistic omission — this is why §7's issue-transition transaction and §8's term-closure transaction both explicitly include the audit write.

## 13. Transactions

Operations that must remain atomically consistent use a database transaction; not every request needs one. Documented cases requiring a transaction:

- An issue state transition, together with its `issue_events` row and its `audit_logs` entry (§7).
- Election-term transitions: closing the outgoing term, revoking its office-user grants and their `user_ward_roles` rows, and (where a new term is being opened in the same operation) creating the new term — coordinated so the ward is never left in an inconsistent intermediate state (§8).
- The one-off `user_ward_roles` citizen-row backfill migration, which must be idempotent and safe to run more than once (`docs/DATABASE_ARCHITECTURE.md` §4.1/§17).

A plain read, a single-row create with no dependent side effects, or a request that only needs Prisma's own single-statement atomicity does not require an explicit application-level transaction.

## 14. Security Architecture

- Authorization is evaluated server-side on every request; nothing about a client's own claims is trusted (§5).
- Authentication/session security (token issuance, refresh, revocation) follows the backend's documented session architecture — not repeated here.
- Every request is validated at the DTO boundary (§11); Prisma's parameterized queries are the only way data reaches PostgreSQL — no raw SQL built from user input.
- Secure headers (Helmet) are applied globally; CORS is explicitly configured, never disabled wholesale.
- Rate limiting, where defined, sits alongside these global concerns rather than per-controller.
- Secrets (`JWT_SECRET`, `DATABASE_URL`, etc.) live only in environment configuration, validated at startup, never logged, never committed (`.env` is git-ignored; only `.env.example` is committed).
- Least privilege applies to the authorization model itself (§5–§6) — a role's default permission set is deliberately the more conservative option unless a ward opts in to widen it (e.g. `content:publish`).
- Audit logging (§12) is a security control as much as an operational one — it is what makes a privileged action reviewable after the fact.
- Database access isolation: the backend is the only thing that ever talks to PostgreSQL; the frontend never receives a database credential or connection string, and production database access is restricted to the server and its authorized operator — Claude Code and developers do not connect to it directly (`README.md`, `CLAUDE.md`).

## 15. Infrastructure Boundary

```text
WardSetu backend:   127.0.0.1:2010
WardSetu frontend:  127.0.0.1:2020
```

```text
Internet
├── wardsetu.in       → Nginx → 127.0.0.1:2020 → WardSetu Next.js frontend
└── api.wardsetu.in   → Nginx → 127.0.0.1:2010 → WardSetu NestJS backend
```

The backend binds only to `127.0.0.1:2010` — never `0.0.0.0`, never the public IP, and never port `2020` (reserved exclusively for the frontend). Nginx is the only public entry point, terminating `https://api.wardsetu.in`. The server hosts other applications; this boundary, along with Nginx, DNS, SSL, the firewall, PM2 process management, any existing LMS applications, and the existing PostgreSQL installation/configuration, remains untouched by backend work unless a change to one of them is explicitly requested and approved separately from ordinary feature or documentation work.

## 16. Frontend ↔ Backend System Architecture

```text
                    WardSetu Users
                         │
        ┌────────────────┼────────────────┐
        │                │                │
     Citizen       Representative      Admin
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
                 Next.js Frontend
                  127.0.0.1:2020
                         │
                  HTTPS / REST API
                         │
                         ▼
                 NestJS Backend
                  127.0.0.1:2010
                         │
          ┌──────────────┼──────────────┐
          │              │              │
     Auth/AuthZ      Business Logic    Audit
          │              │              │
          └──────────────┼──────────────┘
                         │
                       Prisma
                         │
                         ▼
                    PostgreSQL
```

The frontend never talks to Auth/AuthZ, Business Logic, Audit, Prisma, or PostgreSQL directly — every one of those is reached only through the REST API boundary. The backend never depends on how the frontend renders or organizes itself.

## 17. Architectural Dependency Rule

```text
Frontend
   ↓
Public API Contract
   ↓
Backend Application
   ↓
Database
```

Not:

```text
Frontend
   ↓
Database
```

and not:

```text
Frontend
   ↓
Backend internal implementation details
```

The frontend depends on the API contract (`docs/API_SPECIFICATION.md`, and the OpenAPI specification once implemented) — never on the database schema or on backend internals such as service class names, Prisma model shapes, or module structure. The backend, in turn, depends on its own database architecture (`docs/DATABASE_ARCHITECTURE.md`) — never on any frontend implementation detail. This is the rule that lets either repository evolve independently as long as the published API contract is honored on both sides.

## 18. Testing Architecture

| Layer               | Focus                                                                                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Unit                | Individual services, utilities, validation logic                                                                           |
| Service/Application | Business rules in isolation from HTTP (e.g. permission resolution, issue-transition legality)                              |
| Controller/API      | Request/response contract, status codes, DTO validation, error shape                                                       |
| Integration         | Module boundaries working together (e.g. an issue transition producing both an `issue_events` row and an `audit_logs` row) |
| Database-related    | Migration structure and scripts, validated without requiring production database access (`SKILL.md` §41)                   |

Critical workflows — authorization/permission resolution, issue state transitions, representative-term changes, and the API contract itself — must remain testable as they are implemented; this document does not prescribe specific test cases beyond what `SKILL.md` §41 already establishes, and does not require large business-domain test suites before the corresponding modules exist.

## 19. Extensibility

The architecture in §3–§6 (isolated modules, a scope-based role model, a cascading tiered-admin permission model) is designed so the following can be added without a fundamental restructure, when the corresponding backend work is undertaken:

- State, district, and ULB administration UI/API surfaces beyond what §6 already provisions at the data-model level.
- GIS/PostGIS-based ward boundaries, replacing `boundary_geojson`.
- Content internationalization beyond the initial language set.
- An outbox/event table for external notification delivery.
- Expanded analytics/reporting beyond the current monthly report and CSV export.
- Additional integrations, if and when explicitly scoped.

None of these are implemented or promised by this document; they are named because the current module and authorization architecture already reserves a place for them (see `docs/DATABASE_ARCHITECTURE.md` §16/§17 and `docs/API_SPECIFICATION.md` §13 "Recommended Next Steps" for the full, authoritative list).

---

## Document relationship

```text
                         WardSetu
                            │
                 ┌──────────┴──────────┐
                 │                     │
        PROJECT_OVERVIEW.md      CLAUDE.md
                 │                     │
                 │                  SKILL.md
                 │                     │
                 └──────────┬──────────┘
                            │
                    ARCHITECTURE.md
                    (this document)
                            │
                            ▼
                   API_SPECIFICATION.md
                            │
                            ▼
                  DATABASE_ARCHITECTURE.md
```

## Source-of-truth rules

- `SKILL.md` is authoritative for implementation/engineering rules.
- This `ARCHITECTURE.md` is authoritative for system architecture — how layers and modules relate, not their internal detail.
- `docs/DATABASE_ARCHITECTURE.md` is authoritative for database design.
- `docs/API_SPECIFICATION.md` is authoritative for the API contract.
- OpenAPI/Swagger is authoritative for the machine-readable API contract once implemented.
- `docs/PROJECT_OVERVIEW.md` is authoritative for product-level scope and MVP framing.

Where documentation conflicts (see §9's response-envelope note above for a concrete example), this document does not silently invent a resolution — it names both sides and defers to whichever source is explicitly authoritative for that layer, flagging the conflict for a deliberate decision rather than resolving it here.
