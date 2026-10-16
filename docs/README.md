# Documentation Map

Start here to locate the specification for a task. AI contributors must also follow the repository's [AGENTS.md](../AGENTS.md), which maps coding tasks to required document sections.

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
│   ├── ui_convertion.md       # Design/conversion rules; retained filename
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

Repository inspection on **October 16, 2026** found a technical scaffold. Recheck source before relying on this snapshot.

| Area | Exists now | Target / not yet implemented |
| --- | --- | --- |
| Frontend | Vite, React, TypeScript, introductory page, plain CSS | Tailwind, router, API integration, auth and business screens |
| Backend | NestJS, configuration, global validation, shared Prisma connection lifecycle | Business controllers/workflows/modules, JWT/CSRF and `/api/v1` prefix |
| Database | MySQL datasource, MariaDB-named Prisma adapter, empty business schema, migration lock | Business models, first SQL migration and guarded seed |
| Verification | Frontend lint/build; backend lint/unit/HTTP E2E/build; CI on Node.js `24.x` | Real-MySQL constraint/race suites, browser E2E, OpenAPI and boundary automation |
| Integrations/operations | Design documents | Selected AI/map/storage/hosting providers, deployment/backup/restore evidence |

The [package manifests](../backend/package.json), [frontend manifest](../frontend/package.json), [Prisma configuration](../backend/prisma7.config.ts) and [CI](../.github/workflows/ci.yml) determine current tooling. Backend tests mock Prisma; `db:check` tests connectivity with `SELECT 1`. Neither establishes the financial/concurrency guarantees described in the design.

The machine-readable companion `docs/data/openapi.yaml` is **planned and absent**. Author it with the enabled API schemas; do not claim DTO generation or OpenAPI validation already exists. NFR thresholds and release checklists are targets, not measured results.

## Open decisions

Read the owning specification for the complete list. These groups are especially likely to affect implementation:

| Decision group | Owning sections |
| --- | --- |
| Login identifier/password policy; JWT transport/lifecycle; CSRF; privileged account provisioning | [API §§2, 7.1, 12](data/api_contract.md), [deployment §§4, 6](deployment.md) |
| Quote artifact protection; route provider, expiry and distance normalization | [API §§8.1, 11–12](data/api_contract.md), [database §4.2](data/database.md) |
| Pickup-point/category provisioning; business validation limits | [API §§3, 7.2–7.3, 12](data/api_contract.md) |
| AI budget/quantity/preferences, provider/model, privacy validation, limits/evaluation | [AI §§2, 8, 12, 14](ai_integration.md), [API §7.6](data/api_contract.md) |
| Settlement periods/late adjustments/overcollection/receipt correction; QR evidence/refunds | [Database §§4.4–4.5, 6](data/database.md), [API §§7.5, 11](data/api_contract.md) |
| Exact runtime patch/npm/MySQL versions; browser/DB test tooling; hosting and recovery ownership | [Development §18](development_guide.md), [testing §§12–13](testing.md), [deployment §§9–13](deployment.md) |

Keep affected functionality disabled until its necessary decisions are explicit. Continue independent work that does not depend on them. A disabled required MVP feature still prevents claiming the whole MVP is complete.

## Maintaining documentation

- Keep one owning specification for each rule; link to it rather than creating a parallel contract. AGENTS.md is a routing guide and concise reminder, not a replacement for detailed specifications.
- When behavior changes, update requirements first if needed, then affected architecture/data/API/UI/AI documents and tests. Update development/deployment instructions when commands or configuration change.
- Keep existing US/FR/BR/NFR/AC and test-case IDs stable. When renumbering sections or moving content, update section references, links, code trees, templates, this index and AGENTS.md together.
- Use English for instructions and technical documentation. Preserve Vietnamese product labels and the original HTML asset.
- Keep each Markdown documentation file **under 500 lines**. Split long detail by responsibility and leave an explicit link at the original location. Do not split the packaged HTML or reformat its embedded payload.
- Distinguish current implementation, target design, conditional proposals, `TBD` decisions and actual verification results. Record a fresh inspection date when updating current-state claims.
- Validate local links (including case and URL-encoded spaces), file paths inside task templates, section references and command names before finishing. Documentation-only changes do not require application test runs.
- Preserve unrelated work and never add secrets, real environment files or private production data to documentation.
