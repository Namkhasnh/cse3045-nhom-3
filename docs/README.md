# Documentation Map

Start here to locate the specification for a task. AI contributors must also follow the repository's [AGENTS.md](../AGENTS.md), which maps coding tasks to required document sections.

Implementation order and progress checklist: [MVP backlog](../BACKLOG.md).

## Reading order and authority

1. [Requirements](requirements.md): what the product must do, scope, permissions, business rules and acceptance criteria.
2. [Architecture](architecture.md): responsibilities, module ownership, dependencies, transactions and integration boundaries.
3. [Database](data/database.md) and [API contract](data/api_contract.md): storage semantics and wire contracts for the selected feature.
4. [UI conversion guide](ui/ui_convertion.md) and [AI integration](ai_integration.md): feature-specific implementation rules within the preceding constraints.
5. [Development](development_guide.md), [testing](testing.md) and [deployment](deployment.md): working commands, verification evidence and operational procedures.

Requirements govern business behavior; each downstream document owns its domain. If documents disagree, identify the owning specification and correct the dependent material. Do not silently resolve a product/security decision or overwrite a requirement through code. Current source, manifests, lockfiles and CI establish implemented behavior and runnable commands, not permission to change product rules.

## Directory layout

```text
docs/
├── README.md                  # Navigation, status and maintenance
├── requirements.md            # Product authority: US/FR/BR/NFR/AC
├── architecture.md            # Technical boundaries and critical flows
├── code_structure.md          # Proposed source tree; not current inventory
├── data/
│   ├── database.md            # Schema, precision, constraints, locks, migrations
│   └── api_contract.md        # REST DTOs, endpoints, errors, retry semantics
├── ui/
│   ├── ui_convertion.md       # Approved UI direction; retained filename
│   ├── design-skills.md       # Skill coordination, sources and updates
│   └── Hoa Lac Food Ordering Platform.html  # Original packaged reference
├── ai_integration.md          # Recommendation boundaries, prompts, validation
├── development_guide.md       # Local setup and coding workflow
├── testing.md                 # Traceable acceptance and verification plan
└── deployment.md              # Release, bootstrap, backup/restore and operations
```

The `data/` and `ui/` groups keep related contracts/assets together. Top-level documents cover the project as a whole. Keep existing underscore filenames, including [ui_convertion.md](ui/ui_convertion.md), rather than creating competing aliases. All paths in AI task templates are relative to the repository root; Markdown links are relative to the containing document.

## Find a document by question

| Question | Document / sections |
| --- | --- |
| Is this MVP? Which role can do it? | [Requirements §§2–4, 7–8](requirements.md) |
| Where should code live? Which module owns data? | [Architecture §§3–4, 10](architecture.md), [code structure](code_structure.md) |
| Which fields, constraints, snapshots and locks apply? | [Database §§4–10](data/database.md) |
| Which URL, DTO, scalar, error or retry applies? | [API §§2–10](data/api_contract.md) |
| How do I build a page consistent with the reference? | [UI §§4–8, 10–13](ui/ui_convertion.md), [original HTML](ui/Hoa%20Lac%20Food%20Ordering%20Platform.html) |
| How should AI choose dishes, handle privacy and fail safely? | [AI integration §§2–12](ai_integration.md) |
| How do I install, run, code and check the project? | [Development §§2–12](development_guide.md), [root README](../README.md) |
| What proves a rule works? | [Testing §4 traceability matrix, §§5–12 scenarios](testing.md) |
| How do I deploy, provision partners or recover data? | [Deployment §§3–11](deployment.md) |
| What must be decided before a feature is enabled? | Owning document's `TBD` sections, [API §12](data/api_contract.md), [AI §14](ai_integration.md), [deployment §13](deployment.md) |

For feature-specific reading, use the detailed routing table in [AGENTS.md](../AGENTS.md). Use the HTML as a visual reference after applying UI §10 corrections. Its 14 packaged boards include future scope and fictional data; they do not establish implemented capabilities.

## Implementation status

Repository inspection on **October 17, 2026** found a technical scaffold, backend auth endpoints, and a fixture-only Student restaurant-list preview. Recheck source before relying on this snapshot.

| Area | Exists now | Target / not yet implemented |
| --- | --- | --- |
| Frontend | Vite, React, TypeScript, Tailwind CSS 4, self-hosted Be Vietnam Pro, auth/profile routes, role navigation and a labeled development-only restaurant preview; see [frontend guide](../frontend/README.md) | Connected restaurant/order screens and owner/admin business pages |
| Backend | NestJS, configuration, global validation, `/api/v1` prefix, shared envelopes/scalars, transaction runner and audit writer; email-verified registration, requested role review, login/me/logout/profile, cookie JWT, bound CSRF and signed-manifest initial privileged provisioning | Other business controllers/workflows/modules |
| Database | MySQL datasource, MariaDB-named Prisma adapter, account/audit/login-limit/email/role-request models and four SQL migration files | Remaining business models/migrations and guarded seed |
| Verification | Frontend lint/build and Chrome fixture/auth-route smoke; backend lint/unit/HTTP E2E/build; isolated local MySQL 9.2.0 AUTH-01 run and disposable Docker MySQL 8.4.11 audit/AUTH-01 run; one observed connected Chrome auth journey at 360 px | Repeatable automated connected browser auth suite, business MySQL constraint/race suites, OpenAPI and boundary automation |
| Integrations/operations | Design documents | Selected AI/map/storage/hosting providers, deployment/backup/restore evidence |

The [package manifests](../backend/package.json), [frontend manifest](../frontend/package.json), [Prisma configuration](../backend/prisma7.config.ts) and [CI](../.github/workflows/ci.yml) determine current tooling. Backend HTTP E2E tests mock Prisma; `db:check` tests connectivity with `SELECT 1`. A MySQL audit integration job is configured in CI against a disposable 8.4.11 service and can run locally with a disposable loopback `TEST_DATABASE_URL`. None establishes order/financial concurrency guarantees.

Local observation on October 17, 2026: `db:check` reached `cse3045`; all four migrations are applied, including additive email and role-request storage. The local server reported MySQL 9.2.0, while [database §1](data/database.md#1-authority-scope-and-implementation-boundary) selects 8.4.11.
Checks reached 22 unit and 5 mocked HTTP E2E tests. A disposable Docker MySQL 8.4.11 container passed both audit and AUTH-01 real-database integration tests (2/2), including email verification, login backoff, synthetic Admin/Owner provisioning and a pending Owner approval. Chrome smoke rendered the new email verification route at 360 px. A prior one-time connected Chrome journey completed the former register/login/profile/logout flow before email verification was added; the new connected browser journey and real SMTP delivery remain untested. The local `backend/.env` has no `SMTP_*` configuration yet. Containers were removed. A CI run and repeatable connected browser suite remain unobserved/unconfigured.

The machine-readable companion `docs/data/openapi.yaml` is **planned and absent**. Author it with the enabled API schemas; do not claim DTO generation or OpenAPI validation already exists. NFR thresholds and release checklists are targets, not measured results.

## Open decisions

Read the owning specification for the complete list. These groups are especially likely to affect implementation:

| Decision group | Owning sections |
| --- | --- |
| Login identifier/password policy; JWT/CSRF; email SMTP verification; pending role approval and initial privileged provisioning (decided) | [API §§2, 7.1](data/api_contract.md), [deployment §§4, 6](deployment.md) |
| Quote artifact protection; route provider, expiry and distance normalization | [API §§8.1, 11–12](data/api_contract.md), [database §4.2](data/database.md) |
| Pickup-point/category provisioning; feature-specific limits still open | [API §§3, 7.2–7.3, 12](data/api_contract.md) |
| AI budget/quantity/preferences, provider/model, privacy validation, limits/evaluation | [AI §§2, 8, 12, 14](ai_integration.md), [API §7.6](data/api_contract.md) |
| Settlement periods/late adjustments/overcollection/receipt correction; QR evidence/refunds | [Database §§4.4–4.5, 6](data/database.md), [API §§7.5, 11](data/api_contract.md) |
| Exact runtime Node/npm patches; browser/DB test tooling; hosting and recovery ownership | [Development §18](development_guide.md), [testing §§12–13](testing.md), [deployment §§9–13](deployment.md) |

Keep affected functionality disabled until its necessary decisions are explicit. Continue independent work that does not depend on them. A disabled required MVP feature still prevents claiming the whole MVP is complete.

## Repository skills

Reusable contributor workflows live in [`.agents/skills/`](../.agents/skills/). These skills use the owning specifications above; they do not replace AGENTS.md or authorize unrelated actions. Instructions and metadata are in English; explanations and task reports default to Vietnamese.

| Skill | Use it for |
| --- | --- |
| [fix-tests](../.agents/skills/fix-tests/SKILL.md) | Diagnosing test failures and verifying targeted repairs without weakening required behavior |
| [build-component](../.agents/skills/build-component/SKILL.md) | Coordinates React components, pages, styling, interaction states, and responsive UI |
| [frontend-design](../.agents/skills/frontend-design/SKILL.md) | Official Anthropic skill: substantial aesthetic direction, typography, composition and critique |
| [ui-ux-pro-max](../.agents/skills/ui-ux-pro-max/SKILL.md) | Next Level Builder community skill: focused local UX/accessibility and React/Tailwind research |
| [explain-code](../.agents/skills/explain-code/SKILL.md) | Read-only, beginner-friendly explanations grounded in actual source and call paths |
| [implement-feature](../.agents/skills/implement-feature/SKILL.md) | A scoped product capability across the layers it actually needs |
| [review-change](../.agents/skills/review-change/SKILL.md) | Read-only review of changes for actionable bugs, regressions, and contract violations |

Invoke a skill by name in Codex, for example:

```text
$fix-tests Diagnose and fix the failing backend tests; explain the root cause.
$build-component Build a DishCard following the UI guide, using clearly labeled fixtures.
$explain-code Explain PrismaService and its startup/shutdown flow in Vietnamese.
$implement-feature Implement the restaurant discovery capability for US02 within MVP scope.
$review-change Review my current changes for bugs and missing acceptance evidence.
```

Automatic selection remains enabled when a request matches a skill's description. Picker metadata in `agents/openai.yaml` is optional. Design research uses existing Python 3 and bundled data, with no frontend/backend dependencies. See [design skill coordination](ui/design-skills.md) for pinned upstream sources, licenses, local adaptations, examples and the update procedure. Validate changes to metadata/links and try representative tasks when revising their behavior; structural validation alone does not prove task quality.

## Maintaining documentation

- Keep one owning specification for each rule; link to it rather than creating a parallel contract. AGENTS.md is a routing guide and concise reminder, not a replacement for detailed specifications.
- When behavior changes, update requirements first if needed, then affected architecture/data/API/UI/AI documents and tests. Update development/deployment instructions when commands or configuration change.
- Keep existing US/FR/BR/NFR/AC and test-case IDs stable. When renumbering sections or moving content, update section references, links, code trees, templates, this index and AGENTS.md together.
- Use English for instructions and technical documentation. Preserve Vietnamese product labels and the original HTML asset.
- Keep each Markdown documentation file **under 500 lines**. Split long detail by responsibility and leave an explicit link at the original location. Do not split the packaged HTML or reformat its embedded payload.
- Distinguish current implementation, target design, conditional proposals, `TBD` decisions and actual verification results. Record a fresh inspection date when updating current-state claims.
- Validate local links (including case and URL-encoded spaces), file paths inside task templates, section references and command names before finishing. Documentation-only changes do not require application test runs.
- Preserve unrelated work and never add secrets, real environment files or private production data to documentation.
