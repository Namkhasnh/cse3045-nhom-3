# AI Contributor Guide

This file applies to the entire repository. Use it as the entry point for coding tasks; detailed contracts live in `docs/`. Write repository instructions and technical documentation in English. Product UI copy remains Vietnamese as specified by the UI guide.

## Start every task

1. Read [docs/README.md](docs/README.md) for the document map and implementation status.
2. Read the relevant stories, scope, rules and acceptance criteria in [requirements](docs/requirements.md). Identify the applicable US/FR/BR/AC IDs and MVP or later scope. For maintenance tasks without a product story, identify the affected technical contract instead.
3. For code changes, read the relevant parts of [architecture](docs/architecture.md) and [development guide](docs/development_guide.md), then all matching rows in the table below. Cross-cutting work must follow more than one row.
4. Inspect current source, manifests, lockfiles, migrations and tests before editing. Check `git status` and preserve unrelated or in-progress user changes.
5. Implement the smallest coherent change, verify it with existing tools, and update affected documents in the same change.

Do not require the user to supply a fully specified task template. Infer traceability and routine implementation choices from the repository. If an unresolved product/security decision is necessary, ask a focused question and continue independent work; do not turn a `TBD` into behavior silently.

Reusable workflows for test repair, UI authoring, code explanation, feature implementation, and change review are cataloged in [Repository skills](docs/README.md#repository-skills). Use a matching skill when appropriate; this guide and the owning contracts apply whether or not a skill is selected.

<!-- CODEGRAPH_START -->
## CodeGraph

When `.codegraph/` exists at the repository root, use CodeGraph before text search or source reads to understand or locate code:

- Prefer `codegraph_explore` for questions/source/call paths and `codegraph_node` for a symbol or file when the MCP tools are available. Discover deferred tools by name when supported.
- Shell equivalents: `codegraph explore "<symbols or question>"` and `codegraph node <symbol-or-file>`.
- If `.codegraph/` does not exist, skip CodeGraph. Do not create an index unless asked.
- If an existing index cannot be queried, report that limitation and use ordinary source inspection. Use `rg` / `rg --files` for text/file search.
<!-- CODEGRAPH_END -->

## Read before changing an area

Section numbers below refer to the linked documents. Read the relevant requirements and architecture sections in addition to each row.

| Task / trigger | Required reading before implementation |
| --- | --- |
| Scope, roles, business behavior, new feature | [Requirements §§2–4, 6–8](docs/requirements.md), [architecture §§3–5](docs/architecture.md); downstream contracts for the feature |
| File placement, imports, module boundaries, refactor | [Architecture §§3–4, 10](docs/architecture.md), [target code structure](docs/code_structure.md), [development §§7–10](docs/development_guide.md) |
| Any frontend UI, page, component, CSS, layout or responsive change | [UI guide §§1–8, 10–13](docs/ui/ui_convertion.md), relevant §9 rules, and the relevant board in [reference HTML](docs/ui/Hoa%20Lac%20Food%20Ordering%20Platform.html); [API §§2–4](docs/data/api_contract.md) for connected UI |
| API endpoint, DTO, HTTP client, error handling, pagination | [API §§2–7, 12](docs/data/api_contract.md) plus affected endpoint/examples; [database §§4–7](docs/data/database.md); [development §§10.2–10.4, 10.7](docs/development_guide.md) |
| Prisma model, SQL, migration, seed, index, database config | [Database §§4, 7–11](docs/data/database.md), [development §§4–5](docs/development_guide.md); [deployment §5](docs/deployment.md) when retained data/deployment is affected |
| Registration, login, JWT, session, CSRF, authorization, owner assignment | [Requirements §4.1, §7](docs/requirements.md), [architecture §9](docs/architecture.md), [API §2, §7.1–7.2, §12](docs/data/api_contract.md), [database §4.1, §10](docs/data/database.md), [testing §5](docs/testing.md) |
| Restaurant/menu discovery, filters, dish CRUD, hiding/deactivation | [Requirements US02–03, US11–12, US16, §7](docs/requirements.md), [database §4.1, §§8–9](docs/data/database.md), [API §3, §7.2, §10](docs/data/api_contract.md); UI boards 01–02, 08–09, 11 |
| Cart, checkout, quote, pricing, snapshots, order creation/retry | [Requirements BR01–BR10](docs/requirements.md), [architecture §5.1, §§6–7](docs/architecture.md), [database §§4.2–4.3, 6, 10](docs/data/database.md), [API §5, §§7.3–7.4, 8](docs/data/api_contract.md), [UI §§9.2–9.3](docs/ui/ui_convertion.md); boards 02–03 |
| Pickup points, surveyed fees, maps, distance tiers | [Requirements BR07–BR10](docs/requirements.md), [database §4.2, §10](docs/data/database.md), [API §7.3, §8.1, §11](docs/data/api_contract.md), [testing §§6, 9](docs/testing.md); boards 03, 09 |
| Order acceptance/rejection/cancellation/completion, tracking, polling | [Requirements BR15–BR19](docs/requirements.md), [architecture §§5.2–5.3, 7–8](docs/architecture.md), [database §§5, 10](docs/data/database.md), [API §§7.4, 9](docs/data/api_contract.md), [UI §§9.1, 9.3](docs/ui/ui_convertion.md); boards 04, 07 |
| Cash/QR payment, confirmation, refund | [Requirements BR11–BR14](docs/requirements.md), [architecture §5.4](docs/architecture.md), [database §4.4, §10](docs/data/database.md), [API §7.4, §§9, 11](docs/data/api_contract.md), [testing §8](docs/testing.md); boards 03–04, 07, 09 |
| Commission, rate, adjustment, settlement, receipt, financial report | [Requirements BR20–BR27](docs/requirements.md), [architecture §5.3, §§6–7](docs/architecture.md), [database §4.5, §§6–11](docs/data/database.md), [API §5, §7.5, §11](docs/data/api_contract.md), [testing §§6–8](docs/testing.md); boards 10, 12 |
| AI provider/adapter, prompt/schema, recommendation, random selection | [AI integration](docs/ai_integration.md), [requirements BR28–BR31](docs/requirements.md), [API §7.6, §11–12](docs/data/api_contract.md), [architecture §5.5](docs/architecture.md), [testing §9](docs/testing.md); board 05 |
| Audit, logs, telemetry, history retention | [Requirements NFR07, §7](docs/requirements.md), [architecture §§6, 9](docs/architecture.md), [database §4.6, §§8, 10](docs/data/database.md), [AI §11](docs/ai_integration.md), [deployment §8](docs/deployment.md); board 13 for UI, whose read API is still TBD |
| Reorder, support, reviews, favorites or other later feature | [Requirements §§2–3, BR16, BR32](docs/requirements.md), [API §11–12](docs/data/api_contract.md), [database §2](docs/data/database.md); finalize the selected feature's contract before exposing it |
| Tests, regression fix, concurrency, performance, accessibility | [Testing](docs/testing.md), especially §4 case IDs and the affected scenario sections; [UI §§11, 13](docs/ui/ui_convertion.md) for browser work |
| Dependencies, local setup, scripts, CI | [Development §§2–6, 12](docs/development_guide.md), both package manifests/lockfiles and [CI workflow](.github/workflows/ci.yml); [testing §12](docs/testing.md) |
| Hosting, release, bootstrap, backup/restore, rollback, operations | [Deployment](docs/deployment.md), [testing §§11–13](docs/testing.md), [database §11](docs/data/database.md); provider/security contracts for enabled features |
| Documentation reorganization or contract change | [Documentation maintenance rules](docs/README.md#maintaining-documentation), owning specification, all referencing documents and this routing table |

For a bug, read the governing contract before reproducing/fixing it; a current implementation bug does not override requirements. UI board numbers are cataloged in UI §4.1. Inspect embedded board templates/resources, not only the HTML export wrapper; preserve the reference file unchanged.

## Authority and actual implementation

- Requirements govern product scope and business behavior. Architecture governs technical boundaries; database governs storage semantics; API governs wire contracts. UI and AI guides refine their domains within those constraints. Testing and deployment specify evidence and operations.
- Current source, manifests, lockfiles and CI describe what exists and which commands run. They do not authorize replacing required behavior. When code and a target contract differ, describe the gap explicitly.
- The reference HTML is a visual reference with fictional data and known corrections in UI §10. It cannot introduce roles, endpoints, states or MVP features.
- Architecture service names/directories are target designs. Create only what the task needs. `docs/data/openapi.yaml` is a planned artifact and does not exist yet.
- Resolve conflicting requirements or necessary `TBD` decisions in their owning documents before implementing dependent behavior. Routine coding choices within documented contracts do not require extra approval.

Repository baseline checked on October 16, 2026 (recheck before use):

- `frontend/`: Vite/React/TypeScript introductory page; no API calls. Tailwind, router, auth and business features are not installed/implemented.
- `backend/`: NestJS with environment configuration, global validation and shared Prisma lifecycle. ESM imports use `.js` specifiers. Preserve `prisma7.config.ts` and the generated-client configuration.
- Prisma targets MySQL with the MariaDB-named adapter. The schema has no business models; no business migration, seed or application endpoint exists. `/` and `/todos` return 404. `/api/v1` is the target prefix, not configured behavior yet.
- CI uses Node.js `24.x`, npm and separate package lockfiles. Backend unit/E2E tests use Node's built-in test runner and mock Prisma; they do not prove real MySQL constraints or races. Browser and real-MySQL integration suites remain unconfigured.

## Rules that every implementation must preserve

1. **Scope:** MVP uses fixed VJU pickup points, surveyed restaurant–point fees, cash, AI suggestions and manual commission reconciliation. Free addresses/maps, QR/refunds and expanded reporting are later Must; random/history UI/reorder/support are Should; reviews/favorites are Could. Durable order history/recovery is already MVP.
2. **Operating model:** restaurants deliver and receive money directly. No driver accounts/dispatch, multi-restaurant orders, automatic splitting/collection or AI conversation/training storage.
3. **Permissions:** derive the actor from verified authentication and enforce role plus current ownership on the server, including reads/lists/replays/nested IDs. One owner can manage several restaurants. Admin does not inherit owner fulfillment/payment powers.
4. **Orderability:** require active/open/accepting restaurant, visible/available dishes and valid delivery data. Unknown fee differs from zero; never invent a fee or substitute straight-line distance for route distance.
5. **Money and consent:** server computes integer VND with exact arithmetic. REST IDs/money are strings; rate is an eight-place decimal fraction (`0.10000000` = 10%). Never coerce them wholesale to `Number`. Changed accepted unit prices or fees require conflict and explicit reconfirmation.
6. **Snapshots/history:** retain accepted names/prices, recipient/destination, fee/distance/quote and rate on orders. Later edits do not rewrite history. Ordered dishes hide; restaurants with orders/settlements deactivate. Preserve owner accounts and other restaurant access when deleting an unused partner.
7. **Lifecycles:** `pending → accepted → delivering → completed`; only pending may become owner-rejected (reason required) or student-cancelled. Terminal states stay terminal. Payment (`unpaid/paid/refund_pending/refunded`) is separate. QR scans/customer claims never prove payment. Completion may be unpaid.
8. **Idempotency/concurrency:** retain one key and original payload through an uncertain outcome; changed confirmed intent gets a new key. Persist actor + operation + key/hash/result atomically. Same key/content replays; changed content conflicts. Authorized current-status repeats have no duplicate effects. Follow database §10's concrete lock order, including its account prefix; a process-local mutex is insufficient.
9. **Transactions:** workflows coordinate public services using one transaction context. Required mutation/history/audit commit together; completion and its single base commission commit together. No external AI/map/storage/money calls inside retried DB transactions.
10. **Finance:** commission uses completed-order dish subtotal × snapshotted rate, excludes delivery and rounds half-up once per order. One base per order; adjustments append with reasons. One same-restaurant settlement per entry; receipts record manual collection. Preserve signed balances and append-only history; do not invent settlement states or correction policies.
11. **AI:** backend builds/revalidates eligible candidate IDs; provider output is untrusted. AI neither sets money nor writes orders/payments. Minimize/filter payloads; no personal contacts, detailed destinations, secrets or transcripts in provider requests/logs. Manual ordering stays usable on AI failure when valid delivery data exists. Budget semantics/provider/limits remain TBD.
12. **Security/data safety:** backend secrets never enter `VITE_*`, bundles, docs or logs. Keep `.env` private. Preserve retained data; no reset/destructive push/demo seed on shared/real data, no rewriting applied migrations or historical snapshots. Use reviewed forward migrations.

## Code placement

- Backend: `http/ → workflows/ → modules/<domain>/public.ts → owning repository → Prisma`. Controllers do not query Prisma or implement pricing/state rules. Workflows pass the transaction context and do not query tables. Modules do not write another module's data or import workflows back. Adapters live in `integrations/`; `common/` is infrastructure only.
- Frontend: `app/` composes features through `features/<feature>/index.ts`; features depend on their own internals and `shared/`; `shared/` never imports upward. Cross-feature coordination belongs in app composition. Hooks/API layers own requests; presentational components receive data/callbacks. Keep domain widgets in their feature and generic controls in `shared/ui`.
- Use the [target structure](docs/code_structure.md) as placement guidance. Do not create empty scaffolding or edit generated Prisma, `dist/` or `.test-dist/` outputs.
- Connected code follows `/api/v1`, `snake_case`, exact scalar formats, documented envelopes/errors and retry behavior in the API contract. Do not invent missing endpoints or treat a mock response as real success.
- UI preserves Be Vietnam Pro, semantic tokens, three role layouts, Vietnamese copy, loading/empty/error/conflict states, accessibility and the 360 px flow. Follow UI §10 corrections before copying board behavior. Label intentional fixtures at the data boundary.

## Verification and completion

Run commands from the repository root using the package prefixes below, after inspecting current scripts. Install with `npm --prefix <package> ci` when dependencies are needed. There is no root npm workspace/test command.

| Change | Existing commands |
| --- | --- |
| Frontend code | `npm --prefix frontend run lint`; `npm --prefix frontend run build` (includes TypeScript checking) |
| Backend code | `npm --prefix backend run lint`; `npm --prefix backend test`; `npm --prefix backend run test:e2e`; `npm --prefix backend run build` |
| Prisma schema/config | `npm --prefix backend run prisma:validate`; `npm --prefix backend run prisma:generate`, plus affected backend checks |
| Actual local DB connectivity | `npm --prefix backend run db:check` (builds and executes `SELECT 1`; needs configured MySQL and `DATABASE_URL`) |
| Documentation only | Check relative links/section references, canonical paths, line limits and consistency with actual source/scripts; application tests are unnecessary unless executable behavior/config changes |

Backend build/dev/start/test compilation automatically generate Prisma Client. Do not claim this generation validates the target business schema. Do not invent `test:integration`, browser-test, migration or seed scripts; add appropriate tooling only when it is part of the task.

For changed rules, add meaningful tests using [testing case IDs](docs/testing.md). Money/state policies need unit coverage; DB constraints, transactions and races need real MySQL/InnoDB; UI behavior needs applicable browser/visual/accessibility checks. Existing mocked E2E tests are scaffold HTTP checks only. Report missing tooling as `NOT CONFIGURED`, unexecuted checks as `NOT RUN`, and policy-dependent work as `BLOCKED` with its source; never imply a passing result.

Before finishing, update contracts/navigation affected by the change and ensure instructions still point to real files. Report the outcome, changed areas, exact verification results, and material unresolved decisions/limitations. Distinguish source inspection, automated tests and browser observation. Keep every Markdown documentation file under 500 lines; split long detail by responsibility and link it from its parent.
