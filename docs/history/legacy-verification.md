# Legacy Verification Archive

Archived from the pre-rewrite documentation map, preserving reported October 16–17 observations and limitations. **Historical old-design evidence, not current instruction or commercial acceptance.** References now resolve to living specifications, whose rules may differ. In particular the former 8.4.11 target, role requests and exclusive Student/Owner/Admin model are superseded by the October 18 decision. No checks below were rerun in the documentation rewrite.

## Archived implementation and verification snapshot

Repository inspection on **October 17, 2026** found a technical scaffold, backend auth endpoints, and a fixture-only Student restaurant-list preview. Recheck source before relying on this snapshot.

| Area | Exists now | Target / not yet implemented |
| --- | --- | --- |
| Frontend | Vite, React, TypeScript, Tailwind CSS 4, self-hosted Be Vietnam Pro, auth/profile routes, role navigation and a labeled development-only restaurant preview; see [frontend guide](../../frontend/README.md) | Connected restaurant/order screens and owner/admin business pages |
| Backend | NestJS, configuration, global validation, `/api/v1` prefix, shared envelopes/scalars, transaction runner and audit writer; email-verified registration, requested role review, login/me/logout/profile, cookie JWT, bound CSRF and signed-manifest initial privileged provisioning | Other business controllers/workflows/modules |
| Database | MySQL datasource, MariaDB-named Prisma adapter, account/audit/login-limit/email/role-request models and four SQL migration files | Remaining business models/migrations and guarded seed |
| Verification | Frontend lint/build and Chrome fixture/auth-route smoke; backend lint/unit/HTTP E2E/build; isolated local MySQL 9.2.0 AUTH-01 run and disposable Docker MySQL 8.4.11 audit/AUTH-01 run; one observed connected Chrome auth journey at 360 px | Repeatable automated connected browser auth suite, business MySQL constraint/race suites, OpenAPI and boundary automation |
| Integrations/operations | Design documents | Selected AI/map/storage/hosting providers, deployment/backup/restore evidence |

The [package manifests](../../backend/package.json), [frontend manifest](../../frontend/package.json), [Prisma configuration](../../backend/prisma7.config.ts) and [CI](../../.github/workflows/ci.yml) determine current tooling. Backend HTTP E2E tests mock Prisma; `db:check` tests connectivity with `SELECT 1`. A MySQL audit integration job is configured in CI against a disposable 8.4.11 service and can run locally with a disposable loopback `TEST_DATABASE_URL`. None establishes order/financial concurrency guarantees.

Local observation on October 17, 2026: `db:check` reached `cse3045`; all four migrations are applied, including additive email and role-request storage. The local server reported MySQL 9.2.0, while [database §1](../data/database.md#1-authority-scope-and-implementation-boundary) selects 8.4.11.
Checks reached 22 unit and 5 mocked HTTP E2E tests. A disposable Docker MySQL 8.4.11 container passed both audit and AUTH-01 real-database integration tests (2/2), including email verification, login backoff, synthetic Admin/Owner provisioning and a pending Owner approval. Chrome smoke rendered the new email verification route at 360 px. A prior one-time connected Chrome journey completed the former register/login/profile/logout flow before email verification was added; the new connected browser journey and real SMTP delivery remain untested. The local `backend/.env` has no `SMTP_*` configuration yet. Containers were removed. A CI run and repeatable connected browser suite remain unobserved/unconfigured.

The machine-readable companion `docs/data/openapi.yaml` is **planned and absent**. Author it with the enabled API schemas; do not claim DTO generation or OpenAPI validation already exists. NFR thresholds and release checklists are targets, not measured results.


Current source/evidence: [implementation status](../implementation-status.md). Original fixture report remains [unchanged](../ui/student-discovery-verification.md).
