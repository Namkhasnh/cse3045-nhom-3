# Development Guide — Hoa Lac Food Ordering Platform

Commercial target revision: October 18, 2026. Follow [roadmap](roadmap.md), [full prompts](prompts/README.md) and [implementation/evidence status](implementation-status.md). This guide describes safe implementation; it does not certify the target as built.

## 1. Authority and conflict resolution

Requirements own behavior, architecture owns boundaries, database owns storage/locks, API owns wire contracts and UI/AI own their domain refinements. Roadmap owns version order/acceptance; the decision register owns unresolved choices. Source/manifests/lockfiles/CI describe actual tooling, never override the target. Read [documentation map](README.md) and AGENTS.md before implementing.

Public browsing and guest carts, ordinary buyer-manager identity, one restaurant maximum and one MFA Admin are decided. Old requested-role code is legacy. Necessary TBDs block dependent work; routine implementation details within settled contracts need no new product decision.

## 2. Technology baseline

React/Vite/TypeScript, Tailwind CSS 4 and self-hosted Be Vietnam Pro; NestJS/TypeScript REST `/api/v1`; Prisma with the MariaDB-named adapter and `prisma7.config.ts`; modular monolith. Target Oracle MySQL Community Server **9.2.0**, InnoDB, real FKs/CHECKs/strict mode/UTC sessions. Preserve installed package versions/lockfiles; no unrelated upgrades.

CI uses Node.js 24.x. Exact deployment Node/npm patches and services are DEC-10. CI pins mysql:9.2.0, matching the selected local/staging/production release; the updated CI run remains unobserved. Verify actual SELECT VERSION() and CHECK rejection in 9.2.0 suites. Connectivity alone proves neither constraints nor concurrency.

## 3. Environment setup

Inspect current scripts/manifests/lockfiles and git status first. Install only when needed, from repository root:

```sh
npm --prefix frontend ci
npm --prefix backend ci
```

Separate packages/lockfiles; no root npm workspace command. Commit intentional dependency changes with their lockfile. Do not delete lockfiles to fix unrelated failures. Use CodeGraph before source search/reads when indexed; fall back with an explanation if unavailable.

## 4. Configuration and environment variables

Preserve existing `.env`; copy backend/.env.example only if no configured file exists. Never commit real environment files or print credentials. Current configuration names must be verified in code before adding settings.

| Setting | Purpose / boundary |
| --- | --- |
| DATABASE_URL | Backend-only MySQL URL; encode credentials; current parser rejects query/fragment |
| PROVISION_DATABASE_URL | CLI-only distinct user on the same DB; required, no fallback; keep outside runtime .env |
| MIGRATION_DATABASE_URL, DB_OPERATOR_URL | Private operator storage; command-scoped migration/configuration only, never HTTP runtime environment |
| PORT | Backend defaults 3000 |
| JWT_SIGNING_KEY, CSRF_HMAC_KEY | Distinct backend-only 32-byte hex secrets |
| ADMIN_MFA_ENCRYPTION_KEY or ADMIN_MFA_ENCRYPTION_KEY_FILE | Original separate 32-byte hex MFA key; alternatively a protected file outside the repository containing only that key. Direct value takes precedence; a missing/unreadable/invalid key fails closed. Preserve the enrolled key across backend restarts. |
| JWT_ISSUER, JWT_AUDIENCE, JWT_KEY_ID, optional JWT_PREVIOUS_KEYS | Current access-token validation/rotation; API §2 |
| PUBLIC_ORIGIN | Exact browser origin; unsafe requests verify Origin; production same-origin HTTPS |
| SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM | Backend email; dedicated verified sender; current code supports TLS 465 or STARTTLS 587 |
| ACCOUNT_PROVISION_MANIFEST, ACCOUNT_PROVISION_REVIEWER_PUBLIC_KEY, NODE_ENV | Protected signed provisioning config; see cutover handoff and P03 CLI evidence |
| ADMIN_MFA_ENCRYPTION_KEY, CUTOVER_RESTORE_EVIDENCE | Approved backend-only factor encryption key and checksum/inventory-verified restore proof; see cutover handoff |
| AI/media/hosting/backup config | Approved names/values in P13/P26/P29; unresolved choices are not defaults |

Backend secrets never belong in VITE_* or bundles. Public API origin/feature flags contain no secrets. Trusted proxy handling, login limits, cookie/JWT/CSRF/password policy remain API §2 contracts. No refresh-token endpoint is promised.

## 5. Local database and Prisma

Keep `backend/prisma/schema.prisma`, reviewed forward migration files and custom config. Do not edit generated Prisma code, dist or .test-dist. Build/dev/start/test compilation generates Client; generation is not validation of the intended business schema.

```sh
npm --prefix backend run prisma:validate
npm --prefix backend run prisma:generate
# Only for an explicitly scoped future migration task on a disposable target:
cd backend
npx --no-install prisma migrate dev --create-only --config prisma7.config.ts
```

Review generated SQL for CHECK/FK/UQ/composite keys/indexes/actions. P01/P10 follow [migration plan](data/migration-plan.md): inventory, explicit primary Admin and legacy ownership mapping, expand/backfill/validate/constrain/cutover. Preserve accounts/partners/snapshots/orders/finance/audit/keys. No auto-selection, reset, destructive push, demo seed on retained/shared data or rewriting applied migration SQL. Missing historical facts cannot be reconstructed from current menu data.

Guard future seeds by explicit disposable target allowlist. Use fictional ordinary users, two buyer-managers with one restaurant each, one sole Admin, unknown/zero surveyed-fee variants and valid snapshots/history. Deliberate legacy multi-owner/Admin conflicts test migration refusal, not valid target fixtures. No actual partner/QR/contact/provider credentials in fixtures.

## 6. Running locally

After configuring MySQL and backend auth settings:

```sh
npm --prefix backend run db:check
npm --prefix backend run dev
# Another terminal:
npm --prefix frontend run dev
```

Local dev preflight refuses an already occupied `PORT` before starting another watcher. Run only one backend for a port. Watch mode uses ignored `.dev-dist`/its own build metadata; `npm --prefix backend run build` writes `dist`, so a production build does not remove the running watcher's entrypoint. Do not edit either output directory. `npm --prefix backend run test:dev-runtime` checks occupied/free loopback ports. The check is a startup preflight, not a lock against simultaneous starts.

Backend default 3000, Vite default 5173 (use printed URL); Vite proxies /api to 3000. Match PUBLIC_ORIGIN exactly; localhost and 127.0.0.1 are different origins. SMTP is required for new email verification. A send failure can leave an unverified legacy account for resend; inspect actual error behavior.

Current `/login`, `/register`, `/verify-email`, `/account` implement accepted V0.1 capability/MFA auth; role-request website routes are retired. Public homepage/menu source exists and P04/P05 acceptance is separate. `/preview` remains development-only labeled fixtures without auth/me. No fixture mutation counts as real success. `/` and `/todos` on the backend return 404, independently of frontend SPA routes.

## 7. Target repository structure

Follow [target structure](code_structure.md). Frontend app composes features through public index.ts; domain UI stays inside its feature; generic controls in shared/ui. Backend follows HTTP → workflow → module public service → owning repository → Prisma. Add onboarding, security/user-management, support, media and financial code only when its scoped prompt needs it; no empty scaffolding.

## 8. Frontend code conventions

- app → feature public exports → own internals/shared; shared never imports upward; no cross-feature deep imports.
- Single-feature pages belong in feature/pages; cross-feature checkout/navigation composition in app/pages/hooks.
- Hooks/API layers own requests; presentational components receive data/callbacks. Reuse shared API errors/envelopes and semantic UI tokens.
- Public catalog rendering cannot depend on auth/me success. Ordinary manager retains buyer/cart/history links; no multi-restaurant selector or role chooser.
- Guest local cart is non-sensitive intent; login restores/revalidates and requires explicit confirmation. Private checkout/unknown-result key persistence is account scoped; clear stale private views on account switch/logout.
- IDs/money stay strings; format exact VND without wholesale Number coercion. Backend owns totals/fees/rate/eligibility/transitions.
- UI guide/approved boards govern Be Vietnam Pro, cream/orange/white discovery and distinct manager/Admin layouts; Vietnamese copy, 360 px and accessibility states required. Do not copy HTML fictional identities, metrics or policies.

## 9. Backend code conventions

Controllers parse/validate transport, authenticate and call workflows; they do not query Prisma or implement pricing/state rules. Workflows coordinate public services with one shared transaction context and never query tables. Each repository accesses its owning module only; modules do not import workflows back. common/ is infrastructure, not business logic. Keep ESM .js specifiers and Prisma config.

onboarding owns immutable submissions/terms/reviews; accounts owns ordinary identity/sole authority/MFA; restaurants owns unique ownership/readiness; orders/payments/commissions own their facts. Approval/manual create crosses them in a workflow, atomically with audit and key/result. External AI/media/maps remain adapter calls outside retried DB transactions.

## 10. Cross-cutting coding rules

### 10.1 Naming and placement

TypeScript naming follows existing source; API/DB fields snake_case; exact paths follow target structure. No empty directories/classes to match a diagram.

### 10.2 Validation and authority

Reject unknown/server-controlled fields. Derive active actor and current capabilities/ownership server-side for reads/lists/nested IDs/replays and locked writes. Public responses use explicit allowlists. Admin is sole authority with MFA, not inherited owner power; a hidden UI button is no authorization proof.

### 10.3 Money, IDs and rates

REST IDs and integer VND are canonical strings; rate has eight places as a fraction (`0.10000000` = 10%). BigInt/Decimal exact arithmetic, overflow validation and half-up once per completed-order dish subtotal excluding delivery. Commercial rate/cap is DEC-04, never the example rate.

### 10.4 Errors

API owns success/list/error envelopes and machine codes. Localize UI copy; no SQL/stack/secret/private data in errors. 409 requires specific refetch/reconfirmation/reconciliation. Preserve user input and same original key/payload after unknown outcome.

### 10.5 Transactions and concurrency

Follow database §10 account-first lock order, including singleton/application groups where relevant. Mutation/history/audit/key/result commit together; completion and unique base commission too. Same-key same-content replay; changed content conflict. Authorized current-state repeat has no extra facts. Only bounded whole-transaction transient retries; no external side effects or process-local mutex as cross-instance protection.

### 10.6 Logging

Safe IDs/outcome/timing/version/cost metadata only. No passwords/hashes/tokens/cookies, MFA/recovery material, contacts/recipient snapshots, QR secrets or AI prompts/preferences/candidates/raw outputs/transcripts. Business audit is transactional; operational collector failure is separate.

### 10.7 API client

Feature API modules use shared/api and /api/v1 with approved snake_case/scalars/envelopes. No invented endpoints/DTOs while decisions are open. The V0.1 [OpenAPI](data/openapi.yaml) covers auth/profile; extend it alongside later enabled groups. HTTP/SMTP schema checks are implemented, not SDK generation.

## 11. Feature workflow

Read AGENTS/map/roadmap and next prompt; identify US/FR/BR/AC/test cases and owning contracts; inspect current source/scripts/working tree; check prior acceptance and decision gates; implement the smallest coherent scoped change; verify meaningful failures/races/browser paths; update affected docs/status; hand off actual evidence. A decision prompt prepares concrete choices and obtains unresolved policy decisions before dependent work.

## 12. Verification commands

Inspect current manifests before use; commands below exist at the inspected baseline:

| Check | Repository-root command / boundary |
| --- | --- |
| Frontend lint/build | npm --prefix frontend run lint; npm --prefix frontend run build |
| Fixture/auth-route Chrome smoke | npm --prefix frontend run test:smoke; local Chrome or BROWSER_BIN; not commercial browser acceptance |
| Backend lint/unit/E2E/build | npm --prefix backend run lint; npm --prefix backend test; npm --prefix backend run test:e2e; npm --prefix backend run build |
| Isolated audit/auth MySQL | npm --prefix backend run test:integration; configured disposable loopback TEST_DATABASE_URL and test-name guard required |
| Prisma syntax/client | npm --prefix backend run prisma:validate; npm --prefix backend run prisma:generate |
| Connectivity | npm --prefix backend run db:check; SELECT 1 only |

HTTP E2E mocks Prisma. Node's built-in test runner is used, not assumed Jest/Vitest. CI configures Node.js 24.x/MySQL 9.2.0; configuration alone does not establish a passing compatibility run. Current auth/catalog MySQL, CLI MFA recovery, local SMTP and connected Chrome checks are recorded in [P01–P03 progress](progress/README.md); full accessibility, later business/onboarding/finance races and production load/AI/restore coverage remain incomplete. Add scoped tooling with implementation; never invent a passing script or use --if-present to conceal a required missing check.

Documentation-only work checks links/anchors/references/path/script consistency, P01–P36 and Markdown <500 lines; application tests are unnecessary. Report actual PASS/FAIL, NOT CONFIGURED, NOT RUN, BLOCKED with owning decision, and separate source inspection/browser observation/automated evidence.

## 13. Meaningful test requirements

Use [testing case IDs](testing.md). Unit-test exact money/state rules; use actual MySQL 9.2.0 for SQL constraints, transaction/audit rollback, approval/manual uniqueness, request replays, accept/cancel/payment/refund/settlement races. Browser-test public browsing, guest continuity, buyer-manager navigation, application/terms, MFA, checkout/history and sensitive workflows. Include keyboard/360px/accessibility and measured NFRs. Mock/fixture/source evidence cannot replace real DB/browser/restore results.

## 14. Git and PR

Use focused branches/commits following the team's current integration/protection policy; no branch name is assumed. PR description leads with concrete behavior, traceability, migration/compatibility implications, exact tests/evidence and unresolved decisions. Preserve unrelated work. Do not deploy/merge/publish/send messages merely because implementation is complete; use actual task authorization.

Ready to merge requires settled affected contracts, server authority, exact money/history, reviewed SQL, meaningful relevant verification, updated docs and no secrets/destructive retained-data commands. Merge readiness is separate from commercial release acceptance.

## 15. Data and secret safety

No real .env, credentials, MFA/recovery/bank material or private customer/provider content in Git/reports. No resetting shared/retained data, deleting history for tests, rewriting snapshots/applied migrations or fabricating consent/fees/rates. Physical account purge/retention is DEC-08; no automatic purge job. Use forward corrective migrations and isolated restoration drills.

## 16. Giving tasks to AI coding assistants

Use complete [P01–P36 prompts](prompts/README.md) in order. For maintenance, identify affected technical contract and meaningful checks without forcing a product template. Do not turn a missing product/security decision into behavior.

### 16.1 AI task template

```text
Execute Pxx / version from docs/roadmap.md, after accepted prior handoff.
Read AGENTS.md, documentation map, owning requirements/API/data/UI/AI and decision gates.
Inspect actual source/scripts/working tree and preserve unrelated work.
State scope/traceability, implement only authorized settled behavior and verify it.
Use exact scalar/history/transaction/current-capability contracts and forward migrations.
Report actual checks/evidence, changed docs, blockers and acceptance status.
```

### 16.2 AI-specific rules

No invented roles/providers/endpoints/policies, automatic checkout, Admin grant, extra ownership, custody/splitting, driver dispatch or AI money/order writes. No silent TBD resolution. Prepare concrete proposals before seeking required decisions; continue independent work within authorization.

## 17. Quick checklist

Before coding: identify version/prompt/IDs, read owning contracts, inspect current source and prior acceptance, resolve necessary decisions. Before handoff: run relevant real checks, protect secrets/history, update docs/status, report limits honestly. Before release: complete concrete dossier and obtain explicit approval.

## 18. Setup decisions still TBD

[Decision register](decisions.md) owns factor/recovery (DEC-02), onboarding/partnership (03), commission (04), surveys/quotes (05), QR/refunds (06), finance (07), user/support/retention (08), AI (09), infrastructure/services (10), backups/RPO/RTO (11), launch policies/authority (12). Providers, budgets and hosting are not chosen by this guide. Update exact config/runbooks after approval, then prove them under [release checklist](release-checklist.md).
