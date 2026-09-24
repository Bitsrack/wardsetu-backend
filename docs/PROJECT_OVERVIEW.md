# WardSetu — Project Overview

## Document control

| Field                     | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status                    | Documentation only. No application code, database schema, Prisma models, APIs, migrations, infrastructure, configuration, dependencies, or services were changed to produce this document.                                                                                                                                                                                                                                                                     |
| Scope                     | High-level product and system overview, not a technical specification.                                                                                                                                                                                                                                                                                                                                                                                         |
| Sources                   | `CLAUDE.md`, `README.md`, `.claude/skills/wardsetu-backend/SKILL.md` and `docs/DATABASE_ARCHITECTURE.md` / `docs/API_SPECIFICATION.md` in this (backend) repository; `CLAUDE.md`, `README.md`, `.gitignore` and `.claude/skills/wardsetu-frontend/SKILL.md` in the WardSetu frontend repository; the WardConnect Backend Schema & API Specification, Version 6.0 (Consolidated Edition), 17 Sep 2026.                                                          |
| Note on source versioning | This document's task instructions refer to the source spec as "v5.0 (Consolidated Edition)." The actual authoritative document already reflected in this repository's `docs/DATABASE_ARCHITECTURE.md` and `docs/API_SPECIFICATION.md` is titled **Version 6.0 (Consolidated Edition)**. This overview follows the same v6.0 content as those two documents, for internal consistency, rather than the v5.0 label — flagged here rather than silently resolved. |
| Note on ARCHITECTURE.md   | Neither repository had an `ARCHITECTURE.md` when this document was first written. Both now have one, at `docs/ARCHITECTURE.md` (moved there from each repository's root after this document was written) — see §17 below for how it relates to this overview.                                                                                                                                                                                                  |

This document does not duplicate the database schema, the full API endpoint list, or detailed frontend/backend coding standards. For those, see §17 below.

---

## 1. Project Identity

**WardSetu** is a pan-India civic technology platform for ward-level civic engagement, issue management, representative operations, public information, and citizen services.

It connects citizens, elected ward representatives (Parshads/Councillors), their office staff, ward operations teams, tiered platform administration (ULB, district, state, and national), and platform administrators — designed to operate across any state, district, and city/ULB in India.

WardSetu is a **politically neutral civic technology platform**. It is not a political-party platform, a campaign platform, or a partisan product.

## 2. Vision and Purpose

WardSetu exists to give every ward in India a consistent, digital civic layer: a place where a citizen can report a civic issue and track its resolution, where a ward representative and their team can run day-to-day ward operations transparently, and where public civic information (notices, events, schemes, resources) reaches the people it is meant for — all on infrastructure that can scale from a single ward's MVP rollout to a nationwide platform without being redesigned.

## 3. Problem Being Solved

Civic issue reporting and ward-level communication in Indian cities today is typically informal, undocumented, and representative- or office-specific — issue history, complaints, and civic information disappear when a representative's term ends or an office changes hands. WardSetu solves this by making ward civic data belong to the **ward itself**, with a structured issue workflow, an accountable roles-and-permissions model, and continuity across election cycles (see §8).

## 4. Target Users

- **Citizens** — report issues, follow public ward information, participate in community features (ideas, polls, events).
- **Ward Representatives (Parshads/Councillors)** — run their ward's operations dashboard.
- **Representative Office staff** (PA, Secretary) — support the representative's day-to-day work under a narrower permission set.
- **Ward Staff** — ward-level operational support (e.g. issue verification, content drafting).
- **Platform Admin** — overall platform administration.
- **Tiered administrators** (State Admin, District Admin, ULB Admin, Ward Admin) — location-scoped administrative oversight, provisioned in the architecture as future-phase capabilities (see §16).

## 5. MVP User Model

The MVP intentionally uses the minimum practical number of active user roles:

```text
Platform Admin
      │
      └── Ward Representative
              ├── Ward Staff (optional)
              └── Representative Office
                    ├── PA
                    └── Secretary

Citizen
```

- One active **Ward Representative** user is intended per ward in the MVP.
- **Ward Staff** and **Representative Office** users are optional and can be introduced when operationally required.
- **Citizen** is an independent end-user role, not subordinate to the Ward Representative.
- Additional administrative roles are architecturally supported for future phases (§16) but are not part of the minimum MVP user rollout.

The backend's authorization architecture (`user_ward_roles`, documented fully in `docs/DATABASE_ARCHITECTURE.md` §13 and `docs/API_SPECIFICATION.md` §6/§11) defines nine roles in total: `citizen`, `ward_staff`, `ward_representative`, `ward_rep_office`, `ward_admin`, `ulb_admin`, `district_admin`, `state_admin`, `platform_admin`. This overview's MVP model does not remove or redefine any of them — `ward_admin`, `ulb_admin`, `district_admin`, and `state_admin` are real, already-designed roles, described here as future-phase administrative capabilities rather than part of the minimum MVP rollout.

## 6. Geographic and Civic Hierarchy

WardSetu's civic hierarchy, applicable pan-India:

```text
State
  ↓
District
  ↓
City / ULB
  ↓
Ward
  ↓
Locality
```

Each level is a normalized entity carrying an LGD (Local Government Directory) code so the platform can reconcile against the official Local Government Directory (lgdirectory.gov.in). Full column-level detail lives in `docs/DATABASE_ARCHITECTURE.md`.

## 7. Core Platform Capabilities

The following functional areas are supported by the current project documentation:

- Ward and locality information (public ward profiles, locality listings)
- Citizen access and onboarding
- Civic issue reporting
- Issue verification and workflow
- Issue assignment and resolution
- Issue follow-up and citizen rating
- Issue linking (duplicate/related issues)
- Issue escalation (ward-scoped and platform-wide default rules)
- Ward representative dashboard
- Representative office/team management
- Ward staff operations
- Public updates and notices
- Events
- Government schemes
- Library/resources
- Community ideas
- Polls
- Reports and analytics
- Notifications
- Auditability (every privileged write is recorded)
- Ward configuration
- Election / representative-term management

This list intentionally mirrors the modules already documented in `docs/API_SPECIFICATION.md` and the frontend `SKILL.md`; no additional modules are introduced here.

## 8. Representative and Election-Term Continuity

A core architectural principle: **ward civic data belongs to the ward, not to an individual elected representative or election term.** Changing representatives must never migrate, delete, archive, or otherwise break historical ward civic data — issues, updates, events, schemes, library items, opportunities, and localities remain with the ward, permanently, across every election.

WardSetu maintains this continuity through four cooperating concepts:

- **Election terms** — a ward's 5-year election cycle, tracked so re-election and succession are both handled correctly.
- **Representative profiles** — the enduring record of a person, reused across multiple terms if the same person is re-elected.
- **Representative-term relationships** — the link between a specific election term, a ward, and the representative profile holding it for that term.
- **Representative office users** — the staff (PA, Secretary, etc.) granted dashboard access on the current representative's behalf, independent of the elected person's own record.

When a new election term begins:

- the previous representative term remains historical (kept forever, never deleted);
- the new representative term becomes the active one;
- the representative profile is reused when the same person is re-elected, and left untouched (not deleted) when a different person wins;
- identity matching is always explicit — the caller passes either an existing profile's ID or creates a new one; the platform never infers identity by matching name or mobile number;
- ward civic data remains continuous throughout;
- term-scoped permissions (the outgoing office staff's access) are revoked as part of the same transaction that closes the term.

Full table-level detail is in `docs/DATABASE_ARCHITECTURE.md`; the full election/term API surface is in `docs/API_SPECIFICATION.md`. This document does not reproduce either.

## 9. High-Level System Architecture

```text
Citizens / Ward Representatives / Staff / Admins
                    │
                    ▼
             WardSetu Frontend
                    │
                    ▼
              REST API Layer
                    │
                    ▼
             WardSetu Backend
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   PostgreSQL     Auth       Services
                    │
                    ▼
              Audit / Events
```

This reflects the architecture already defined in the frontend and backend `SKILL.md` files and `README.md`s: a Next.js frontend consuming a REST API served by a NestJS backend, which enforces authentication/authorization and business rules, persists to PostgreSQL via Prisma, and records privileged actions to an audit log. No additional infrastructure components are introduced beyond what those documents describe.

Production topology (from both repositories' `README.md`/`SKILL.md`):

```text
Internet
├── wardsetu.in      → Nginx → 127.0.0.1:2020 → WardSetu Next.js frontend
└── api.wardsetu.in  → Nginx → 127.0.0.1:2010 → WardSetu NestJS backend
```

## 10. Technology Overview

At a high level, per the current `SKILL.md` and `README.md` files in each repository (exact versions are pinned there, not repeated here):

| Layer                        | Approach                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Frontend framework           | Next.js (App Router), React, TypeScript                                                                                                                                                    |
| UI/component foundation      | Radix UI for behavior, CSS variables / CSS Modules for a centralized theme-token design system                                                                                             |
| Backend framework/runtime    | NestJS on Node.js                                                                                                                                                                          |
| Database                     | PostgreSQL                                                                                                                                                                                 |
| ORM                          | Prisma                                                                                                                                                                                     |
| API style                    | REST, with a consistent success/error response envelope and a request ID on every response                                                                                                 |
| Authentication approach      | Token-based session authentication (OTP-based login, refresh/rotation), enforced server-side                                                                                               |
| Validation/security approach | Server-side DTO validation, Helmet security headers, a strict Content-Security-Policy, and the explicit rule that frontend permission checks are UX only — never an authorization boundary |
| Testing approach             | Unit/component tests (Jest) on both repositories; accessibility and end-to-end tests (Playwright + axe-core) on the frontend                                                               |
| API documentation / OpenAPI  | Swagger/OpenAPI is the executable source of truth for the API contract, served at `/api/docs` once implemented; `docs/API_SPECIFICATION.md` is the narrative companion                     |
| Deployment architecture      | Both applications run behind Nginx, each bound only to a local loopback address (`127.0.0.1:2020` frontend, `127.0.0.1:2010` backend) — see §9                                             |

Where a technology is not explicitly defined in the current project documentation, it is intentionally omitted here rather than invented.

## 11. Frontend and Backend Architecture

### Frontend

The frontend's architectural responsibility, per its `SKILL.md`/`README.md`, is to be:

- a user-facing web application serving the public site, citizen application, ward representative/office dashboards, ward team screens, and tiered-admin dashboards;
- role-based in its experiences, with each role seeing only the navigation and screens relevant to it;
- responsive across desktop, tablet, and mobile, with a mobile-first citizen experience;
- accessible, targeting WCAG 2.2 AA;
- rendered using Server Components by default, with Client Components only where interactivity requires them (Next.js App Router);
- an API consumer only — it never enforces authorization itself, only UX-level permission checks;
- built on a centralized design/theme-token system, so visual identity changes happen in one layer rather than across components;
- internationalization-ready, with English and Hindi as the initial languages and the architecture prepared for more Indian languages;
- prepared to support public, SEO-optimized content (the public website) alongside authenticated, non-indexed application areas.

Detailed frontend implementation rules (route structure, component conventions, exact folder layout, etc.) live in the frontend `SKILL.md` and are not repeated here.

### Backend

The backend's architectural responsibility is to be:

- the REST API for the whole platform;
- the sole enforcer of authentication and authorization — every privileged action is checked server-side, following the roles-and-permissions model in `docs/DATABASE_ARCHITECTURE.md`/`docs/API_SPECIFICATION.md`;
- the owner of business rules: issue workflows and their state machine, election/representative-term lifecycle, ward configuration;
- responsible for role/permission enforcement, including the location-hierarchy cascade rules for tiered administration;
- responsible for data validation on every request;
- responsible for audit logging of privileged writes;
- responsible for reporting/analytics aggregation;
- responsible for notification/service orchestration (e.g. device tokens, notification preferences);
- the sole owner of database access, via Prisma against PostgreSQL.

Detailed backend module structure and coding rules live in the backend `SKILL.md` and are not repeated here.

## 12. Security and Privacy

- Server-side authorization is authoritative; frontend role/permission checks are UX only and are never a security boundary.
- Authentication and session security follow the backend's documented architecture (OTP-based login, session/refresh-token handling).
- Sensitive information must not be exposed through public pages, SEO metadata, client bundles, or logs.
- Privileged operations must be auditable — every privileged write is recorded.
- Input validation and secure API practices are mandatory on every endpoint.
- Secrets must never be committed to source control (`.env` files are git-ignored in both repositories; only `.env.example` with non-secret values is committed).
- Citizen privacy must be protected.
- WardSetu must not store a citizen's caste, religion, or political preference — this is an explicit, non-negotiable design principle carried from the backend specification.
- Political profiling and inferred political affiliation of citizens are prohibited.

Detailed controls (exact headers, CSP configuration, validation pipes, etc.) belong in each repository's architecture/security documentation, not here.

## 13. Political Neutrality

WardSetu is explicitly designed to remain politically neutral. The platform must not:

- promote political parties;
- endorse candidates;
- rank candidates or representatives;
- infer political preferences;
- create citizen political profiles;
- target citizens based on political characteristics;
- manipulate civic participation;
- present partisan campaign messaging as neutral civic information.

Public representative information may contain documented civic facts such as designation and party affiliation where defined by the data model (e.g. `ward_representative_terms.party_affiliation`), but the platform itself remains neutral — usable equally by independent representatives and representatives affiliated with any political party.

## 14. Accessibility and Internationalization

**Accessibility.** WardSetu targets accessible, inclusive interfaces per the current frontend design and accessibility requirements (WCAG 2.2 AA, verified with automated and manual checks).

**Internationalization.** English and Hindi are the initial language requirements, with the architecture prepared for additional Indian languages.

## 15. Scalability and Extensibility

The system is intended to expand from an initial ward-level MVP toward:

```text
Ward
→ City / ULB
→ District
→ State
→ Pan-India
```

The architecture — the location hierarchy, the location-scoped `user_ward_roles` authorization model, and the tiered-admin cascade rules — is designed to support the future administrative roles and larger geographic/data volumes described in §16 without requiring a fundamental redesign. No specific performance numbers or infrastructure capacity targets are documented at this stage, and none are invented here.

## 16. MVP Scope vs. Future Phases

### MVP focus

- Platform Admin
- Ward Representative
- Optional Ward Staff
- Optional Representative Office (PA / Secretary)
- Citizen
- Ward-level civic workflows
- Core issue management
- Representative operations
- Public civic information
- Basic reporting/analytics
- Election-term continuity

### Future phases

The architecture already provisions the following; they are documented capabilities, not yet part of the minimum MVP user rollout:

- State Admin
- District Admin
- ULB Admin
- Ward Admin (as a distinct administrative appointment, beyond the elected Ward Representative)
- The full tiered-administration cascade (appointment chain: Platform Admin → State Admin → District Admin → ULB Admin → Ward Admin; `view_analytics` permissions cascading down the hierarchy while `manage_*` permissions stay exact-tier)
- Frontend support for the `ward_rep_office` role's narrowed permission set (already an open, tracked frontend task — see the frontend `SKILL.md` §119 "Backend role model" and `docs/API_SPECIFICATION.md` §13)
- Other documented future architecture improvements: PostGIS-based ward boundaries, content internationalization beyond English/Hindi, an outbox/event table for external notifications, fully dynamic custom roles, and a periodic cleanup job for expired permission overrides (all listed in `docs/DATABASE_ARCHITECTURE.md`/`docs/API_SPECIFICATION.md` "Recommended Next Steps")

No future feature is promised here beyond what is already documented in the sources above.

## 17. Documentation and Source of Truth

```text
PROJECT_OVERVIEW.md
    ↓
ARCHITECTURE.md
    ↓
DATABASE_ARCHITECTURE.md / API_SPECIFICATION.md
    ↓
SKILL.md
    ↓
Source Code
```

(`CLAUDE.md` sits alongside `PROJECT_OVERVIEW.md` at the top as the entry point that names the
skill and states non-negotiable key rules; both repositories' `CLAUDE.md` point here.)

- **`CLAUDE.md`** (each repository) — project-level AI/development instructions: the entry point that points to the authoritative skill and states the non-negotiable key rules.
- **`docs/PROJECT_OVERVIEW.md`** (this document) — high-level product/system overview for a new developer, architect, project manager, or AI coding agent to orient quickly.
- **`docs/ARCHITECTURE.md`** (each repository) — authoritative for system architecture: how layers and modules relate and why, connecting this overview to the database/API documents without duplicating them.
- **`docs/DATABASE_ARCHITECTURE.md`** — authoritative database model and relationships.
- **`docs/API_SPECIFICATION.md`** — authoritative API contract and endpoint specification (narrative companion to OpenAPI/Swagger).
- **`SKILL.md`** (each repository) — implementation standards and engineering rules; authoritative for how the code is actually built.
- **OpenAPI/Swagger** (once implemented, served at `/api/docs`) — authoritative machine-readable API contract; an API change is not complete until its OpenAPI documentation is updated to match.
- Frontend design/theme documentation (theme-token architecture, described in the frontend `README.md`/`SKILL.md`) — authoritative for UI/UX and design-system requirements.

Both repositories now have a `docs/ARCHITECTURE.md` (added after this document was first written,
and moved into `docs/` alongside the other reference documents); it is the authoritative source
for the high-level architecture summarized in §9–§11 above — those sections give just enough
architecture to orient a reader, and `docs/ARCHITECTURE.md` is where the full picture lives.

### Source-of-truth rules

- `SKILL.md` is authoritative for implementation/engineering rules.
- `docs/ARCHITECTURE.md` (each repository) is authoritative for system architecture.
- `docs/DATABASE_ARCHITECTURE.md` is authoritative for database design.
- `docs/API_SPECIFICATION.md` is authoritative for API contracts.
- OpenAPI/Swagger is authoritative for the machine-readable API contract.
- `docs/PROJECT_OVERVIEW.md` (this document) must remain a high-level overview and must not become a duplicate of any of the above.

When documentation conflicts, the newer, more specific, explicitly authoritative source wins — this document does not silently invent a resolution to a conflict; see the version-note in the Document control table above for a worked example of that principle in practice.

## 18. Project Principles

- Ward-level civic data is never touched, migrated, or archived because of an election — only representative-office access changes.
- No individual citizen's caste, religion, or political preference is ever collected.
- Authorization is enforced server-side only; client-side filtering is never a security control.
- Every privileged write is recorded in an audit log.
- Representative identity is always explicit, never inferred by matching name or mobile number.
- A permission that grants oversight (`view_analytics`) may cascade down the location hierarchy; a permission that grants the power to act (`manage_*`) never does.
- WardSetu never implies an issue was officially submitted to a municipal department when the platform only records an internal reference/forwarding action.
- WardSetu is politically neutral, usable equally by independent representatives and representatives of any political party.
- The platform is designed to scale from a single ward to pan-India without a fundamental redesign.
