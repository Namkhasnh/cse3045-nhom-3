# Development Guide — Hoa Lac Food Ordering Platform
> **Purpose:** define how developers and AI coding assistants work safely and consistently in the repository.
> **Status:** derived from [requirements.md](requirements.md), [architecture.md](architecture.md), [database.md](data/database.md), [api_contract.md](data/api_contract.md), [ui_convertion.md](ui/ui_convertion.md), and [ai_integration.md](ai_integration.md).
> **Repository check:** October 16, 2026. CI uses Node.js `24.x`; current scripts, `DATABASE_URL` and `PORT` are verified below. Exact runtime patch/npm/MySQL versions and future auth/provider configuration remain **TBD**. Recheck manifests/config before use.
## 1. Authority and conflict resolution
Requirements govern behavior; the following documents own their respective domains:
1. [docs/requirements.md](requirements.md) — scope, roles, US/FR/BR/AC.
2. [docs/architecture.md](architecture.md) — module ownership, dependencies, transactions.
3. [docs/data/database.md](data/database.md) — schema semantics, constraints, snapshots, exact arithmetic.
4. [docs/data/api_contract.md](data/api_contract.md) — `/api/v1`, DTOs, errors, retry/idempotency.
5. [docs/ui/ui_convertion.md](ui/ui_convertion.md) — frontend structure, UI behavior, visual consistency.
6. [docs/ai_integration.md](ai_integration.md) — AI boundaries, privacy, validation.
7. Current source, manifests, lockfiles and CI — exact versions, scripts and implemented behavior; these do not override product requirements. See [documentation map](README.md) and [AGENTS.md](../AGENTS.md) for task routing.
Rules:
- Never change a business rule only to simplify implementation.
- Do not silently resolve a **TBD**.
- Do not treat mock/demo data or scaffold folders as implemented behavior.
- Keep MVP, post-MVP Must, Should, Could, and out-of-scope work distinct.
## 2. Technology baseline
| Area | Decision / status |
| --- | --- |
| Frontend | Vite + React + TypeScript |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite`; semantic CSS theme and self-hosted Be Vietnam Pro |
| Backend | NestJS + TypeScript |
| API | REST + JSON; target `/api/v1` prefix is not registered yet |
| Auth | JWT; lifecycle/transport details partly TBD |
| ORM | Prisma |
| Database | MySQL / InnoDB |
| Architecture | Modular monolith, logical 3-tier separation |
| Node.js | CI: `24.x`; exact local/production patch remains to be pinned |
| npm | **TBD — verify and pin** |
| Exact MySQL release | **TBD — verify and pin** |
| AI/LLM provider/model | **TBD** |
| Map provider | **TBD** |
| Image storage provider | **TBD if uploads are enabled** |
### 2.1 MySQL requirement
- The schema relies on enforced `CHECK` constraints.
- Select a MySQL release compatible with enforced checks; the data design requires behavior available in **MySQL 8.0.16+**.
- `8.0.16+` is a compatibility floor, not a verified project version.
- Financial/concurrency integration tests must run against real MySQL/InnoDB, not SQLite.
## 3. Environment setup
### 3.1 Verify local tools
Before coding:
```bash
node --version
npm --version
mysql --version
```
Use Node.js 24 to match CI; record/pin exact deployment versions when selected. The source/lockfiles remain authoritative for package versions.
Do not upgrade Node, npm, Prisma, NestJS, React, Vite, or database packages only because newer versions exist. Follow manifests and lockfiles.
### 3.2 Install dependencies
The repository has separate frontend/backend lockfiles.
```bash
cd frontend
npm ci
cd ../backend
npm ci
```
Use `npm install` when intentionally modifying dependencies or when an approved lockfile update is required.
Rules:
- Commit intentional `package.json` + `package-lock.json` changes together.
- Do not delete lockfiles to solve dependency errors.
- Do not perform broad upgrades in unrelated PRs.
- Inspect manifests before adding a package; do not assume a router, state library, test runner, or Tailwind version is already installed.
## 4. Configuration and environment variables
### 4.1 General rules
- Never commit real `.env` files.
- `.env.example` contains names and safe placeholders only.
- Backend secrets must never be exposed through `VITE_*`.
- Exact env names must match current code/config. If no approved name exists, mark it **TBD**.
### 4.2 Backend configuration inventory
Current settings come from `backend/.env.example`, `backend/src/main.ts` and `backend/src/prisma/database.config.ts`; future settings remain logical/TBD. Copy the example only if no configured `.env` already exists.
| Logical setting | Required when | Safe example / note |
| --- | --- | --- |
| `DATABASE_URL` | Backend uses MySQL | Required `mysql://user:password@host:port/database`; URL-encode credentials; current parser rejects query/fragment; database must already exist |
| Runtime environment | All environments | `development` |
| `PORT` | Backend listen port | Optional; defaults to `3000` |
| JWT signing material | Auth enabled | `CHANGE_ME_LOCAL_ONLY`; backend only |
| JWT issuer | Auth enabled | Exact value/name TBD |
| JWT audience | Auth enabled | Exact value/name TBD |
| Allowed frontend origin | Separate origins | Example `http://localhost:5173`; never wildcard with credentials |
| CSRF config | Cookie-auth writes | Protocol/header name **TBD** |
| AI endpoint/model/credential | AI enabled | Provider/model **TBD**; backend only |
| AI timeout/quota/cost limits | AI enabled | **TBD**; absent limits must not mean unlimited |
| Map settings | Post-MVP map delivery | **TBD** |
| Storage settings | Image upload enabled | **TBD** |
### 4.3 Frontend configuration
Frontend config contains public/non-secret values only.
| Logical setting | Status |
| --- | --- |
| API origin/base URL | **TBD**; same-origin production preferred |
| Public map-rendering key | Only if provider requires it; restrict by domain/quota |
| Feature flags | Only for approved scope/configuration |
| Secrets | **Forbidden** |
Do not create variables equivalent to `VITE_DATABASE_URL`, `VITE_JWT_SECRET`, or `VITE_AI_API_KEY`.
## 5. Local database and Prisma
Use a disposable local MySQL database.
Setup flow:
1. Start MySQL/InnoDB.
2. Create a local database and least-privilege dev account.
3. Configure backend DB access using the repo's actual config.
4. Generate Prisma Client.
5. Apply reviewed migrations if present.
6. Seed only when a guarded local/test seed exists.
7. Start backend and frontend.
### 5.1 Prisma commands
Use the existing generation/validation scripts. Generate a migration only when schema work is in scope, using the installed Prisma CLI and explicit config:
```bash
cd backend
npm run prisma:generate
npm run prisma:validate
# Only for intended disposable local migration work:
npx --no-install prisma migrate dev --create-only --config prisma7.config.ts
```
Inspect generated SQL before applying a migration. Build/dev/start/test compilation generate Prisma Client automatically. There are no business migrations, seed configuration or migration/seed npm wrappers yet. Commands needing the datasource/migration config must explicitly select `prisma7.config.ts`; do not assume this custom filename is auto-discovered.
### 5.2 Migration safety
- Maintain `backend/prisma/schema.prisma` and reviewed `backend/prisma/migrations/`.
- Inspect generated SQL, especially CHECKs, composite FKs, indexes, and FK actions.
- Do not edit migrations already applied to shared environments.
- Use forward corrective migrations.
- Never reset/force-reset/destructively push schema against retained data.
- Never invent missing historical snapshots from current menu/restaurant data.
- For populated DBs prefer: `expand → backfill → validate → constrain → contract`.
- Production backup/rollback belongs in [deployment.md](deployment.md).
### 5.3 Seed safety
Seed only explicit local/test targets.
- Refuse known production/shared DBs.
- Use deterministic fictional users/business data.
- No real contacts, QR/bank data, provider keys, or production credentials.
- Clearly label test distances/fees/rates.
- Preserve valid snapshot/history/ledger relationships in history fixtures.
## 6. Running locally
Use Node.js 24 and npm. Preserve any existing local `.env`; otherwise copy `backend/.env.example` to `backend/.env` and configure MySQL. Never print credentials.
```bash
# Repository root, after installing dependencies and configuring local MySQL:
npm --prefix backend run prisma:validate
npm --prefix backend run db:check
npm --prefix backend run dev
# Separate terminal:
npm --prefix frontend run dev
```
Backend defaults to port 3000; Vite defaults to 5173 (use its printed URL). Backend startup requires MySQL. The frontend restaurant-list preview runs independently with labeled fixtures and no API calls; see [frontend guide](../frontend/README.md) for filters and development-only state previews. Proxy/CORS/API-origin integration will be added with a connected feature. No backend application endpoints are registered; `/` and `/todos` return 404.
Documented `/api/v1` endpoints and the authenticated surveyed cash-order flow are targets to implement, not startup smoke checks that currently pass. Frontend code must not import Prisma, query MySQL or call the AI provider.
## 7. Target repository structure
| Area | Target location |
| --- | --- |
| Documentation | `docs/` |
| Frontend app composition | `frontend/src/app/` |
| Frontend business features | `frontend/src/features/<feature>/` |
| Frontend shared HTTP/UI/lib | `frontend/src/shared/` |
| Backend transport DTO/controllers | `backend/src/http/` |
| Cross-module workflows | `backend/src/workflows/` |
| Business modules | `backend/src/modules/<module>/` |
| External adapters | `backend/src/integrations/` |
| Prisma infrastructure | `backend/src/prisma/` |
| Shared backend infrastructure | `backend/src/common/` |
| Prisma schema/migrations | `backend/prisma/` |
| Integration/E2E/race tests | `backend/test/` |
Target feature folders include `auth`, `restaurants`, `dishes`, `delivery`, `cart`, `orders`, `payments`, `commissions`, and `recommendations`. Post-MVP/support/review/favorite folders are created only when in scope.
Do not create empty directories/classes only to match the target architecture.
## 8. Frontend code conventions
Dependency direction:
```text
app
  → features/<feature>/public exports
      → feature pages/hooks/api/components
          → shared/api, shared/ui, shared/lib
```
Rules:
- `app` may compose multiple features.
- Features import their own internals + `shared`; no deep-import of another feature.
- `shared` must not import `features` or `app`.
- Single-feature pages stay inside the feature; cross-feature pages go in `app/pages`.
- Presentation components do not call `fetch` directly.
- Feature API modules use the shared HTTP client.
- Generic reusable controls go in `shared/ui`; domain components stay in their domain.
- Cart draft is frontend-owned; created orders are backend-owned.
- React must not decide authoritative prices, fees, commission, or authorization.
- BIGINT IDs and money strings must not be coerced to JavaScript `Number`.
- For UI work, read [docs/ui/ui_convertion.md](ui/ui_convertion.md) and the relevant reference design board first.
## 9. Backend code conventions
Main direction:
```text
HTTP controller / guard
  → workflow
    → public business service
      → owning repository
        → Prisma / MySQL
```
Rules:
- Controllers: DTO parsing/validation, auth, preliminary role checks, workflow call, HTTP mapping.
- Controllers must not contain money formulas, state machines, Prisma queries, or provider logic.
- Cross-module coordination belongs in `workflows/`.
- Business modules own their data and rules.
- Expose narrow public services; do not export repositories for cross-module access.
- Workflows open transactions and pass one shared transaction context.
- Repositories own queries, locks, and conditional writes for their module.
- AI/maps/storage stay behind adapters/ports.
- AI never gets order/payment/database write tools.
Suggested substantial-module shape:
```text
modules/orders/
├── orders.module.ts
├── public.ts
├── application/
│   ├── order.service.ts
│   └── order-query.service.ts
├── domain/
│   ├── order-state.policy.ts
│   └── order-pricing.policy.ts
└── infrastructure/
    └── order.repository.ts
```
Smaller modules may use fewer files.
## 10. Cross-cutting coding rules
### 10.1 Naming and placement
Follow existing repo conventions. Architecture examples use:
- React components/classes/types: `PascalCase`.
- Variables/functions/hooks/services: `camelCase`.
- Hooks: `use...`.
- Backend filenames: `order.workflow.ts`, `order.service.ts`, `order.repository.ts`.
- Feature API: `orders.api.ts`.
- DB tables/columns and API JSON keys: `snake_case`.
Do not rename public wire fields to camelCase without an explicit API contract change.
### 10.2 Validation and authority
- Reject unknown fields, wrong types, and client-supplied server-controlled fields.
- Frontend validation is usability only; backend validation is authoritative.
- Enforce role + ownership server-side.
- Do not trust client user/role/restaurant scope, totals, prices, fees, or commission.
- Re-read current data for orderability/financial decisions.
- Treat AI output as untrusted input.
### 10.3 Money, IDs, rates
- Money is integer VND.
- REST money = canonical decimal string.
- BIGINT IDs = decimal strings over REST.
- Commission rate = exact decimal fraction with 8 fractional digits.
- Never use JS binary floating-point for money/rate calculations.
- UI formatters display; backend decides.
### 10.4 Errors
Use the API error envelope:
```json
{"error":{"code":"VALIDATION_ERROR","message":"Check the highlighted fields.","field_errors":[],"details":{},"request_id":"req_example","retryable":false}}
```
- Preserve stable machine-readable codes.
- Never expose stack traces, SQL, secrets, raw provider responses, or another actor's data.
- Treat 409 as a conflict requiring the contract-defined recovery/refetch/reconfirmation.
- Preserve one idempotency key for one durable intent.
### 10.5 Transactions and concurrency
- Required business mutation + audit commit/rollback together.
- Completion + unique base commission commit together.
- Follow documented lock order + conditional writes.
- Retry only transient deadlocks/lock timeouts, boundedly.
- Do not retry validation/auth/state conflicts automatically.
- No AI/map/storage/external money movement inside retried DB transactions.
- A Node.js mutex is not sufficient for cross-instance correctness.
### 10.6 Logging
Safe operational metadata:
- request/correlation ID;
- safe resource IDs;
- safe actor ID when appropriate;
- outcome category;
- latency/timing.
Do not log passwords/hashes, JWTs/cookies/auth headers, secrets, full recipient details, AI prompts/preferences/candidate payloads/raw responses, or payment secrets.
Audit logs and operational logs are separate.
### 10.7 API client
Frontend API code:
- belongs to the owning feature `api/`;
- uses `shared/api`;
- uses `/api/v1`;
- preserves documented JSON envelopes and `snake_case`;
- centralizes common error handling where useful;
- never invents endpoints/DTOs while backend work is incomplete.
## 11. Feature workflow
For each feature/fix:
1. **Read requirements**
   - Identify US, FR, BR, AC, and delivery scope.
2. **Check ownership/contracts**
   - Identify owning module.
   - Read API + database docs.
   - Read UI/AI docs when relevant.
3. **Inspect current code**
   - Verify package versions, scripts, DTOs, services, migrations, tests.
4. **Plan smallest consistent change**
   - Avoid unrelated refactors.
   - Do not resolve TBDs silently.
5. **Implement**
   - Keep backend authority and architecture boundaries.
6. **Test**
   - Add relevant unit/integration/E2E/race coverage.
   - Use real MySQL where constraints/locking matter.
7. **Run repo checks**
   - Use actual scripts from `package.json`.
8. **Update docs**
   - Requirements first if business behavior changes.
   - Update downstream docs when contracts change.
   - Keep every documentation file under 500 lines.
9. **Prepare PR**
   - State scope, traceability, verification, risks, docs, and remaining TBDs.
## 12. Verification commands
These scripts were checked against package manifests and CI on October 16, 2026. Run from the repository root and recheck scripts when tooling changes.

| Check | Existing command / status |
| --- | --- |
| Frontend development | `npm --prefix frontend run dev` |
| Frontend lint | `npm --prefix frontend run lint` (Oxlint) |
| Frontend TypeScript + production build | `npm --prefix frontend run build` |
| Frontend unit/component/browser tests | **NOT CONFIGURED** |
| Backend development | `npm --prefix backend run dev` |
| Backend lint | `npm --prefix backend run lint` (ESLint) |
| Backend unit tests | `npm --prefix backend test` (TypeScript compile, then Node test runner) |
| Backend HTTP E2E | `npm --prefix backend run test:e2e` (Prisma mocked) |
| Backend build | `npm --prefix backend run build` |
| Prisma schema validation / generation | `npm --prefix backend run prisma:validate` / `npm --prefix backend run prisma:generate` |
| Local MySQL connectivity | `npm --prefix backend run db:check` (build then `SELECT 1`; configured DB required) |
| Real-MySQL constraints/races, OpenAPI and import-boundary automation | **NOT CONFIGURED** |

CI runs frontend lint/build and backend lint/unit/HTTP E2E/build. Backend tests mock DB access; they do not establish actual MySQL transaction, constraint or race correctness. No root npm workspace or standalone type-check script is configured. Build/test compilation covers current TypeScript checks.
For documentation-only changes, verify links, canonical paths, referenced sections, line limits and source/script consistency. Run application checks when executable code/config changes. Report configured-but-unrun checks as `NOT RUN`, missing tooling as `NOT CONFIGURED`, and policy-dependent work as `BLOCKED: <decision/source>`.
## 13. Minimum test expectations
Add only tests relevant to the changed area, while preserving these invariants:
- server-side price/fee recalculation and one restaurant per order;
- hidden/sold-out/closed/not-accepting rejection;
- pending-only cancellation and accept/cancel races;
- durable same-key retry and changed-content idempotency conflict;
- repeated completion creates one base commission; delivery fee excluded;
- historical snapshots survive catalog/rate edits;
- payment and order lifecycles stay separate;
- cross-account/restaurant authorization;
- one-settlement-per-entry and mutation+audit rollback;
- history-preserving hide/deactivate;
- AI invalid output/privacy/outage/manual fallback.
Use real MySQL for constraints, locks, and concurrency; ORM mocks are insufficient evidence.
## 14. Git and PR
The repository does not establish enforced Git naming syntax. The following is a **proposed team convention**; align it with actual branch protection before enforcing it.
### 14.1 Branches
```text
feat/<topic>
fix/<topic>
docs/<topic>
test/<topic>
refactor/<topic>
chore/<topic>
```
Rules:
- one focused task per branch;
- branch from the team's current integration branch;
- do not assume the integration branch name;
- avoid direct changes to a protected integration branch;
- do not mix unrelated features.
### 14.2 Commits
Proposed prefixes:
```text
feat:
fix:
docs:
test:
refactor:
chore:
```
Each commit should represent one coherent change. Avoid messages such as `update`, `fix stuff`, or `changes`.
### 14.3 PR description
```text
## Scope
- Changed:
- Not changed:
## Traceability
- US:
- FR:
- BR:
- AC:
- Scope: MVP / Post-MVP Must / Should / Could
## Implementation
- Frontend:
- Backend:
- Database/API/AI:
## Verification
- Commands:
- Tests:
- Manual checks:
## Documentation
- Updated:
- Remaining TBDs:
## Risk
- Data/concurrency/security/history:
```
### 14.4 Definition of done
Ready to merge when:
- requirements/business rules are satisfied;
- API/data/UI/AI contracts are not silently changed;
- backend authorization/ownership is enforced;
- exact money/ID handling is preserved;
- migration SQL is reviewed when applicable;
- relevant tests/checks pass or missing tooling is explicitly reported;
- no real secret/`.env` is committed;
- no unsafe DB reset/destructive command is introduced;
- docs are updated when contracts changed;
- no TBD became behavior without a decision;
- PR explains verification and remaining risk.
## 15. Data and secret safety
Never commit:
- real `.env`;
- DB credentials;
- JWT signing material;
- AI/map/storage credentials;
- production tokens/cookies;
- real bank/QR secrets;
- private customer datasets;
- raw AI conversation content.
Never:
- reset a DB containing data that must be retained;
- delete historical order/payment/commission/audit data to fix tests;
- rewrite snapshots from current data;
- physically delete entities when rules require hide/deactivate;
- run demo seeds on shared/production data;
- use production/private user content as AI training/evaluation input.
## 16. Giving tasks to AI coding assistants
AI contributors should infer these fields from the request and repository where possible; ask only for decisions that cannot be inferred. Use this template for complex handoffs:
| Field | Required content |
| --- | --- |
| Goal | One concrete feature/fix |
| Traceability | US/FR/BR/AC IDs |
| Scope | MVP / post-MVP Must / Should / Could |
| Read first | Relevant requirements/architecture/API/DB/UI/AI docs |
| Allowed changes | Specific folders/files |
| Acceptance | Observable pass/fail criteria |
| Verification | Exact existing commands/tests |
| Data rules | Money, snapshots, idempotency, ownership, history |
| Forbidden changes | Unrelated refactors/tech/providers/contracts |
| TBD handling | Decisions the AI must not invent |
### 16.1 AI task template
```text
Task: <short title>
Goal: <one concrete goal>
Traceability:
- US:
- FR:
- BR:
- AC:
- Scope:
Read first:
- docs/requirements.md
- docs/architecture.md
- docs/data/api_contract.md
- docs/data/database.md
- docs/ui/ui_convertion.md   # when frontend changes
- docs/ai_integration.md  # when AI changes
Allowed changes:
- <specific folders/files>
Do not change:
- unrelated modules
- approved business rules
- API/DB contracts unless requested
- package versions/tooling unless approved
- unresolved TBD decisions
Acceptance criteria:
1. ...
2. ...
Verification:
- <exact existing command>
- <test/manual check>
Report:
- files changed
- behavior implemented
- commands/tests + results
- remaining TBDs
- intentional UI/docs deviations
```
### 16.2 AI-specific rules
AI must inspect current files first, preserve architecture boundaries, prefer the smallest coherent change, use actual repository scripts, report missing tools honestly, and update docs when approved contracts change.
AI must not invent endpoints/enums/fields/roles/providers/infrastructure; resolve auth/CSRF/TBD policy silently; add driver dispatch or automatic payment splitting/collection; let AI set authoritative price/fee or create orders; bypass backend validation; expose secrets; reset retained data; or fix unrelated code outside scope.
For frontend tasks, include:
```text
Read and follow docs/ui/ui_convertion.md and the relevant reference design board before changing UI. Preserve requirements and backend contracts.
```
## 17. Quick checklist
Before coding: read US/FR/BR/AC, confirm scope, identify owning module, check API/DB contracts, verify scripts/tool versions, and list unresolved TBDs.
Before PR: update tests, run existing repo checks, use real MySQL where DB behavior matters, ensure no secret/destructive operation, update changed contract docs, include traceability/verification, and keep remaining TBDs explicit.
## 18. Setup decisions still TBD
Resolve and record: exact deployment Node.js patch/npm/MySQL versions (CI currently uses Node.js 24.x); future test/tooling scripts and auth/provider/frontend env names; JWT transport/lifetime/refresh/logout/revocation; CSRF protocol; AI provider/model/config/limits; post-MVP map config; optional storage config; real-MySQL/browser runners and additional CI gates; and protected integration-branch/review policy.
Do not replace these gaps with guessed values. Update this guide and the relevant config/examples together after each approved decision.
