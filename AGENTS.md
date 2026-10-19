# AI Contributor Guide

Applies to the whole repository. Users may give short Vietnamese requests; infer the necessary scope, contracts and checks. Technical docs/prompts are English, UI copy and task reports Vietnamese. [Documentation map](docs/README.md) owns navigation; [contributor workflow](docs/contributor-workflow.md) contains task routing and handoff details.

## Interpret the request before loading context

| Request | Route | Expected behavior |
| --- | --- | --- |
| Run Pxx, continue roadmap, finish a named V0.x/V1.0 | [run-roadmap](.agents/skills/run-roadmap/SKILL.md) | Load only the selected prompt; verify accepted dependencies/decisions; implement or prepare its required decision |
| Add business behavior, API/data workflow | [implement-feature](.agents/skills/implement-feature/SKILL.md) | Infer IDs and needed layers; keep a backend/frontend-only request scoped |
| Build/change React page/component/style | [build-component](.agents/skills/build-component/SKILL.md) | Reuse approved UI; connect real APIs only within requested scope |
| Repair reported failing tests/CI | [fix-tests](.agents/skills/fix-tests/SKILL.md) | Reproduce, diagnose against current contracts, fix and verify |
| Review diff/commit/PR | [review-change](.agents/skills/review-change/SKILL.md) | Read-only findings by default |
| Explain code/flow | [explain-code](.agents/skills/explain-code/SKILL.md) | Read-only Vietnamese explanation of actual source |
| Design direction / focused UX evidence | [frontend-design](.agents/skills/frontend-design/SKILL.md) / [ui-ux-pro-max](.agents/skills/ui-ux-pro-max/SKILL.md) | Advisory input; build-component owns React changes |

Select one primary workflow. A roadmap request uses run-roadmap for orchestration and only the matching implementation/decision workflow for the current step. Do not stack every skill or load every prompt/specification. A normal bug/UI/explanation task does not require replaying P01–P36 or asking for a task template.

## Start every task

1. Read the documentation map once per session; reuse unchanged material. Inspect git status and preserve unrelated/staged/untracked work. Follow existing user authorization and task limits.
2. For roadmap execution, resolve the requested prompt/version or next unaccepted handoff through roadmap/backlog and [progress records](docs/progress/README.md). For other tasks, identify only affected US/FR/BR/AC or technical contract; a similarity to Pxx does not expand the assignment into the entire milestone.
3. Read the relevant owning contract before changing behavior or diagnosing a bug. Use the routing table below; detailed section/board references are in contributor workflow. Inspect actual source, scripts, lockfiles/migrations and relevant tests before editing code. Treat status docs as a dated guide, not proof of current source.
4. Infer routine implementation details and proceed. For a necessary unresolved product/security choice, prepare a concrete recommendation with alternatives/impact, ask one focused question, cite its DEC/owning source and continue independent authorized work. Do not ask again for an already approved choice or invent values.
5. Complete the smallest coherent authorized task, verify it, update affected docs and leave a factual handoff. Do not stop at a plan when implementation is requested. A scoped task does not authorize unrelated features, deployment or messages.

<!-- CODEGRAPH_START -->
## CodeGraph

When `.codegraph/` exists, query CodeGraph **before source search/reads** to understand or locate code: MCP `codegraph_explore`/`codegraph_node` or shell `codegraph explore "question"` / `codegraph node <symbol-or-file>`. If querying fails, disclose the limitation and use `rg`/`rg --files` and source inspection. If no index exists, skip it. Never create an index unless asked. Documentation/skill editing does not require a code query unless actual code behavior needs inspection.
<!-- CODEGRAPH_END -->

## Read before changing an area

Read only applicable rows and sections. Cross-cutting work uses multiple rows; do not reload unchanged documents within a session.

| Area | Owning contracts |
| --- | --- |
| Scope / version / prerequisite | [Requirements](docs/requirements.md), [roadmap](docs/roadmap.md), [decisions](docs/decisions.md) |
| Placement / imports / refactor | [Architecture §§3–4, 10](docs/architecture.md), [target structure](docs/code_structure.md), [development §§7–10](docs/development_guide.md) |
| Identity / MFA / user availability / support / audit reads | [Account security](docs/account-security.md), requirements §4.1, architecture §9, API §§2/7, database §§4.1/10 |
| Opening applications / terms / approval / manual partners | [Onboarding](docs/onboarding.md), [migration plan](docs/data/migration-plan.md), security, API/database §4.1/§7 |
| Catalog / menu / images / partner CRUD | Requirements US02–03/11–12/16, API §§3/7.2/10, database §§4.1/8–10 |
| Cart / quote / checkout / order retries | Requirements BR01–10, architecture §§5.1/6–7, API §§5/7.3–7.4/8, database §§4.2–4.3/6/10 |
| Fulfillment / history / polling | Requirements BR15–19, architecture §§5.2–5.3/7–8, API §§7.4/9, database §§5/10 |
| Cash / QR / refunds | [Payment policy](docs/payments-policy.md), requirements BR11–14, architecture §5.4, API §§7.4/9/11, database §§4.4/10 |
| Commission / reconciliation / reports | Requirements BR20–27, architecture §5.3, database §§4.5–11, API §§5/7.5/11 |
| AI | [AI integration](docs/ai_integration.md), requirements BR28–31, API §§7.6/12, architecture §5.5 |
| UI of any feature | [UI guide](docs/ui/ui_convertion.md) relevant layout/states/§§9–13, [reference boards](docs/ui/Hoa%20Lac%20Food%20Ordering%20Platform.html), connected API §§2–4 |
| Test / dependency / CI / setup | [Testing](docs/testing.md), development §§2–6/12, current manifests/lockfiles/[CI](.github/workflows/ci.yml) |
| Retention / migration / backup / incident / release | Database §§8/10–11, [migration plan](docs/data/migration-plan.md), [deployment](docs/deployment.md), [release checklist](docs/release-checklist.md) |
| Documentation / skill maintenance | [Maintenance rules](docs/README.md#maintaining-documentation), owning specification, contributor workflow and affected references |

Requirements govern behavior; architecture boundaries, database storage and API wire contracts own their respective domains. UI/AI refine within them; testing/deployment own evidence/operations. Roadmap owns version/dependency/acceptance gates. Source/manifests/CI establish implementation, never permission to override contracts. Correct conflicting downstream rules at their owner before dependent implementation. HTML is visual reference with fictional data; apply UI §10 corrections and preserve the asset unchanged.

## Rules that every implementation must preserve

- **Identity:** public homepage/list/menu and guest cart; role-free ordinary signup. Managers retain buyer rights. Each account manages at most one restaurant, including inactive/setup-required. One operator-owned Admin with MFA/recovery; no website Admin request/grant and no implicit owner fulfillment/payment powers.
- **Onboarding:** versioned terms consent and review history. Approval/manual create atomically persists eligible user ownership, setup-required restaurant, decision/result and audit. Approval alone never enables selling. Legacy Admin/ownership migration requires explicit primary selection/conflict mapping, never auto-selection/deletion.
- **Operating model:** V1.0 at VJU, fixed verified surveyed points, cash+direct restaurant QR, restaurant delivery, manual commission reconciliation, history/recovery, support/users/audit and controlled AI. No drivers, custody/splitting, automatic collection or multi-restaurant orders. V1.1 reorder/random/reviews/favorites; V1.2 areas/free addresses/route fees.
- **Orderability and consent:** ready/active/open/accepting restaurant, visible/available dishes, valid configured destination/fee/rate. Unknown fee is not zero; never invent surveys or replace route distance with straight-line. Login preserves/revalidates the cart and never submits an order automatically. Changed accepted unit prices/fees require conflict and explicit reconfirmation.
- **Exact money/history:** REST IDs/integer VND are strings; rates are eight-place fractions (`0.10000000` = 10%). BigInt/Decimal exact arithmetic; no wholesale Number coercion. Immutable accepted names/prices/recipient/destination/quote/fee/distance/rate snapshots. Ordered dishes hide; history-bearing restaurants deactivate; accounts and history survive deletion of unused partners.
- **Lifecycles:** pending → accepted → delivering → completed; pending alone may be owner-rejected with reason or buyer-cancelled. Terminal stays terminal. Receipt/payment/refund and fulfillment are independent; scans/customer claims never prove payment. Completion may be unpaid. Preserve late-payment/refund obligations under approved policy.
- **Atomicity:** actor+operation+key/hash/result commits with mutation/history/audit. Original uncertain intent keeps its key/payload; changed confirmed intent gets a new key. Authorized current-state repeats have no duplicate effects. Follow database §10 account-first lock order including authority/application groups. Public services share one transaction context; no process-local mutex as cross-instance protection or external calls in retried transactions.
- **Finance:** completion and one base commission commit together; completed dish subtotal × snapshotted rate, delivery excluded, round half-up once per order. Append reasoned adjustments/receipts/history; one same-restaurant settlement per entry. Preserve signed balances; no invented rates, settlement states or correction policies.
- **AI/privacy:** backend builds/revalidates eligible candidate IDs; provider output is untrusted and cannot set money or write orders/payments. No contacts, detailed destinations, secrets, transcripts or training storage. Manual valid surveyed ordering survives AI failure; DEC-09 gates provider/semantics/cost limits.
- **Runtime/data:** Oracle MySQL Community Server **9.2.0** with InnoDB in local/CI/staging/production; preserve Prisma adapter/config (`prisma7.config.ts`) and ESM .js imports. Secrets never enter VITE_*, bundles/docs/logs. No retained/shared-data reset, destructive push, demo seed or rewriting applied migrations. Use reviewed forward migrations; never invent missing historical facts.

## Code placement

Backend: HTTP → workflows → modules/domain/public.ts → owning repository → Prisma. Controllers do not query Prisma or own business rules; workflows pass transaction context without querying tables; modules do not write another module's tables or import workflows back. Adapters belong in integrations; common is infrastructure only.

Frontend: app composes features through index.ts; a feature imports its internals/shared; shared never imports upward. Requests live in hooks/API layers; presentation receives data/callbacks. Domain widgets stay in features, generic controls in shared/ui. Do not create empty scaffolding or edit generated Prisma/dist/.test-dist.

UI retains approved Be Vietnam Pro, cream/orange, white compact discovery and distinct manager/Admin layouts, Vietnamese copy and semantic tokens. Routine work reuses identity; a font/palette/shape change needs a concrete proposal and recorded user decision. Keep fixtures labeled at their boundary; missing APIs never become fake mutation success. Support loading/empty/error/conflict, 360 px and keyboard/accessibility states.

## Verification and completion

Inspect scripts first; run from repository root. No root npm workspace/test command. Install with npm --prefix package ci only when needed.

| Change | Required existing checks |
| --- | --- |
| Frontend code | npm --prefix frontend run lint; npm --prefix frontend run build; applicable browser checks |
| Backend code | npm --prefix backend run lint; npm --prefix backend test; npm --prefix backend run test:e2e; npm --prefix backend run build |
| Prisma schema/config | npm --prefix backend run prisma:validate; npm --prefix backend run prisma:generate; affected backend checks and real migration tests |
| SQL/transactions/races | Disposable real MySQL 9.2.0 constraint/rollback/race checks; existing backend test:integration covers only its actual cases |
| Connectivity | npm --prefix backend run db:check = SELECT 1 only; not constraint/race evidence |
| Documentation/skills only | Frontmatter/metadata where changed; links/anchors/paths, <500 Markdown lines, routing/examples and diff checks; no application tests required |

Build/dev/start/test compilation generates Prisma Client; generation is not proof of the intended schema. HTTP E2E mocks Prisma; frontend test:smoke is limited fixture/auth-route Chrome evidence. Add scoped missing meaningful tooling when required; do not invent passing scripts. Match testing case IDs; money/state needs unit evidence, persistence/races actual MySQL, journeys real browsers. Rerun broader checks only when changes/failures/unresolved concerns warrant them.

Report outcome, changed areas, exact verification and material limitations concisely in Vietnamese. Distinguish source inspection, automated tests and browser observation. Use NOT CONFIGURED for missing tooling, NOT RUN for available unexecuted checks, BLOCKED with DEC/source for necessary decisions. Update only affected contracts/navigation/status; keep every Markdown document under 500 lines.

For roadmap work, store resumable evidence using [progress records](docs/progress/README.md) and update backlog consistently. Do not check off code-only, partial or unverified work. Do not invent independent/user review; identify self-review honestly. P32 real pilot and P35 concrete production release require explicit authorization; missing answers are not approval. Completing docs, prompts or deployment alone never proves V1.0 readiness.
