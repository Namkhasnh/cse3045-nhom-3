# Implementation and Evidence Status

Historical baseline inspection: October 18, 2026. The October 19 scoped update below supersedes affected source/status claims. Source and working-tree contents changed externally during this documentation task; this final snapshot replaces older summary claims. No application, migration, account or database action was performed by the documentation rewrite. Reinspect before implementing a prompt.

## Accepted V0.1 — October 19, 2026

The follow-up uses clean lockfile installations and actual CLI enrollment/re-enrollment on isolated MySQL 9.2.0. [P01](progress/P01.md), [P02](progress/P02.md) and [P03](progress/P03.md) contain the acceptance assessment. **V0.1 is ACCEPTED** after the [final P01→P02→P03 review](progress/V0.1.md). The [authorized scoped follow-up](auth-followup.md) now verifies previous-backend expansion-window compatibility, implements safe return navigation, proves expired-email/resend in Chrome and tests restricted runtime/provision SQL/CLI/browser behavior. The user explicitly approved fresh restricted local DB identities and `.env` configuration; that operation is applied and verified. Reviewer is Codex self-review; independent/human sign-off and production deployment remain unclaimed.

- Backend/frontend `npm ci` and dependency-tree checks passed; Prisma CLI/client/adapter **7.10.0**, MariaDB **3.4.5**, Nodemailer **7.0.11**. Those baseline installs left lockfiles unchanged. Final acceptance pins existing Ajv 8.20.0 directly as a dev dependency for API-contract checks; current backend lock/source hashes are in the final review. Node **24.21.0**, npm **11.19.0**; remote CI NOT RUN.
- Backend lint, 26 unit tests, build and Prisma validate/generate passed in the scoped follow-up. Final review reran lint/build/unit and **6 HTTP E2E tests**, adding schema/example/reference and actual auth/profile request/response checks. Real MySQL integration passed 3 groups, including concurrent unique ownership for inactive/setup-required restaurants, provisioning/recovery races and audit rollback.
- `test:cli` passed **18 scenarios** using Ed25519-signed synthetic manifests and Python PTY. Initial and recovery success invoke `account:provision`; other cases invoke the same built CLI. Real restore evidence, signatures, TTY/password/TOTP/custody and transaction behavior are exercised; only outbound password-corpus lookup is replaced. No transcript or raw enrollment/recovery secret is retained.
- `test:smtp` passed real local STARTTLS + SMTP AUTH delivery through Nodemailer, random verification code, pre-verification login denial, expired-code rejection, resend limit/success, verification/login/logout revocation. The mailbox is a loopback sandbox with synthetic recipients; no external email was sent. Final acceptance reran the real SMTP sandbox with OpenAPI exchange validation; external relay delivery remains NOT RUN.
- Empty bootstrap/forward deploy passed. A checksum-verified eight-migration backup was restored only into an isolated DB; all three additive migrations applied, preserving every original column/row in 19 business tables. A separate restore with a synthetic duplicate owner failed migration with P3018/1062; the conflicting links remained and no authority table was created.
- Frontend lint/build, smoke and connected Chrome passed on a separate disposable DB: signup/email/login/logout, manager buyer navigation, Admin password-only denial/MFA/recovery, public catalog states, keyboard and 360/1440 px overflow assertions. Browser email transport is replaced in that harness; actual SMTP is covered separately. Current screenshots were inspected; this is not full accessibility evidence.
- Retained MySQL read-only observations: one sole authority, one enrolled factor, one cutover audit, ordinary legacy identities and unchanged ownership/readiness. No retained enrollment/recovery/migration was performed in this follow-up.

Operator credentials are now durably stored at `/Users/namkhanh/.config/hoa-lac-food/operator.env` (0700 parent/0600 file), outside runtime `.env`. Temporary test artifacts are at `/private/tmp/hlf-acceptance-20261019`, `/private/tmp/hlf-followup-*.log` and `/private/tmp/hlf-v01-*.log`; sanitized commands, fingerprints and limits are preserved in progress records. Self-review: Codex, October 19; no independent review, production deployment or release approval claimed. Previous sections below are dated evidence, not current acceptance.

## Historical October 18 source versus target (superseded where noted)

| Area | IMPLEMENTED / source inspection | TARGET / gap |
| --- | --- | --- |
| Stack | React/Vite/TypeScript, Tailwind 4, self-hosted Be Vietnam Pro; NestJS/Prisma with MariaDB-named adapter and custom prisma7.config.ts | Keep stack and approved UI identity |
| Auth | Email-verified registration, requested-role legacy flows, cookie JWT/CSRF, me/logout/profile, login counters and signed-manifest privileged provisioning | P01–P03 ordinary identity, no role choice/grant, unique ownership, sole Admin MFA/recovery |
| Frontend | Auth/profile and role navigation; labeled Student fixture discovery; development-only /preview skips session loading | P04–P06 real anonymous homepage/menu and guest cart/login return; current real routes still require login |
| Storage | Current schema contains account, role-request, login-limit and audit foundation; four migration.sql files found for those slices | Restaurant/menu/onboarding/order/payment/finance target schemas; empty restaurant/dish migration directories are not applied SQL evidence |
| Business workflows | Public connected catalog/order/finance/onboarding/sole MFA authority not found in final source inspection | P04–P28 target capabilities; no commercial version accepted |
| MySQL | 9.2.0 is the selected target for every environment | CI pins mysql:9.2.0 to match the selected local/staging/production version; execution on the updated CI image is NOT RUN/NOT OBSERVED |
| API machine contract | Markdown/API endpoints partly implemented for legacy auth | docs/data/openapi.yaml is planned and absent; author enabled schemas alongside implementation |

The initial workspace included uncommitted restaurant/menu source and reports that disappeared externally during the task. They are not restored or claimed as delivered. No previously applied migration should be rewritten; inspect actual retained database state independently under the future migration task. A source tree or empty folder never proves local database contents.

## Configured checks and their limits

| Command | Source-inspected coverage | This documentation task |
| --- | --- | --- |
| npm --prefix frontend run lint / run build | Lint and TypeScript/Vite build | NOT RUN; application unchanged by this task |
| npm --prefix frontend run test:smoke | Local Chrome fixture/auth-route smoke, not connected ordering | NOT RUN |
| npm --prefix backend run lint / test / run test:e2e / run build | ESLint, Node tests/build; HTTP E2E mocks Prisma | NOT RUN |
| npm --prefix backend run test:integration | Disposable loopback test DB guard, audit/auth integration | NOT RUN; not new identity/business concurrency proof |
| npm --prefix backend run prisma:validate / run prisma:generate | Current schema syntax/client generation | NOT RUN; neither proves business schema/migration correctness |
| npm --prefix backend run db:check | Build and SELECT 1 connectivity | NOT RUN; not constraints/races |

NOT CONFIGURED in final inspection: repeatable connected commercial browser/accessibility suite, business order/payment/finance/onboarding races, sole Admin MFA/recovery, OpenAPI/example/import-boundary gates, production load/live-AI evaluation, production backup/restore/incident harnesses. Add appropriate tooling with its prompt; no hypothetical script names are claimed available.

## Historical evidence boundary

[Student discovery verification](ui/student-discovery-verification.md) is retained unchanged: October 16 fixture/render/filter observations, not real anonymous APIs, cart, order or commercial acceptance. The [preserved legacy archive](history/legacy-verification.md) records the original status/test counts and limitations. The pre-rewrite documentation recorded October 17 legacy auth/audit runs on disposable MySQL 8.4.11 and local 9.2.0 connectivity, including synthetic role approvals. Those observations are historical reports, not rerun here; role-approval results do not prove the new onboarding or singleton model. No new application/browser/MySQL test pass is claimed.

Commercial release evidence remains NOT RUN/BLOCKED until [roadmap](roadmap.md) and [launch checklist](release-checklist.md) are actually fulfilled. The [decision register](decisions.md) identifies policy blockers. Documentation validation is separately reported in [documentation verification](documentation-verification.md).

## Subsequent public homepage update — October 18, 2026

The scoped homepage implementation supersedes the login-gated homepage observation above: `/` now renders during auth/me loading/failure and for all legacy roles, with a VJU introduction, guest login/register, account and legacy management entry points. Restaurant data remains explicitly labeled fixtures; catalog/menu APIs, guest cart, ordinary signup and sole Admin MFA remain TARGET. No backend, database or migration was changed and no roadmap acceptance is claimed.

Frontend lint, build and Chrome smoke (public homepage, preview and auth pages at 360 px) passed. Additional local Chrome checks used synthetic auth responses: 360/390/768/1024/1440 px without horizontal overflow; pending/offline/anonymous/buyer/manager/Admin homepage; filter/reset, keyboard focus and simulated loading/empty/error/retry. Screenshots were inspected at 360 and 1440 px. These checks do not prove real authentication, current ownership, connected catalog, full accessibility or ordering.

## Scoped auth/discovery implementation — October 19, 2026

This is a scoped implementation, not roadmap/version acceptance. Decisions and operator sequence: [cutover handoff](auth-discovery-cutover.md). Existing uncommitted user changes, including login styling, were preserved; no commit, production deployment or independent review is claimed.

| Area | Current result |
| --- | --- |
| Migration recovery | Four exact historical SQL blobs recovered; SHA-256 matches retained DB history. Eight historical migrations remain immutable. Empty installation uses a fingerprint-checked consolidated schema plus explicit baseline, because historical CREATE TABLE statements overlap. |
| Retained MySQL 9.2.0 | Backup restored into a separate MySQL 9.2.0 container; all row and normalized schema hashes matched. Three additive migrations applied locally (11 migration records total). Every original column/row in 19 business tables preserved, including credentials, ownership, order snapshots, payment and commission history. Post-expansion backup/restore also verified. |
| Auth source | Signup rejects privilege inputs; role-request website/controller/service removed. Safe self DTO exposes server-computed capabilities/nullable managed restaurant; current account/ownership and singleton authority are checked. Legacy role enum/records stay stored for compatibility and have no authority in new code. |
| Sole Admin/MFA source | Singleton constraints, encrypted account-bound TOTP, replay protection, independent MySQL quotas, restricted challenges, atomic recovery and manifest-request consumption implemented. Operator CLI verifies signed manifest, restore evidence, password/enrollment/custody before atomic cutover. |
| Actual Admin activation | **OBSERVED ACTIVE, October 19 read-only check**: `operator_admin` exists; exactly one authority and one enrolled factor; one `admin.cutover` audit. Legacy IDs 2/3/5/6 are ordinary (`student` compatibility enum), auth version 2; ownership 2→1 is preserved. This verification task did not provision/recover the retained Admin and does not attest private recovery-code custody. |
| Public APIs/UI | Anonymous restaurants/menu/dishes/categories; signed filter-bound keyset cursors, exact string IDs/VND, accent-insensitive name prefixes, visible-dish matching, safe projections and Vietnamese hours. Main homepage/menu use API data; preview fixtures stay DEV-only. Login design retained, registration role chooser removed, MFA/recovery step added. |
| Retained catalog result | Public list is empty because restaurant 1 is `setup_required`. Owner 2 still has `buy,manage_restaurant` and managed restaurant 1. No data was fabricated or auto-published. |

### Verification performed

- Backend lint/build and Prisma validate/generate passed. Unit suite passed **25 tests**; HTTP E2E passed **5 tests**, including role injection/retired route denial and cookie/CSRF/profile/logout behavior.
- Real MySQL integration passed **3 groups**: auth/email/rate limits and audit rollback; singleton/ownership constraints and concurrent provisioning; TOTP vectors/replay/challenge exhaustion/expiry, concurrent recovery, same-authority re-enrollment/manifest replay, audit-failure rollback and quota-window expiry; public filtering, exact large IDs/price bounds, hidden/sold-out/setup-required resources, cursors and overnight Vietnamese hours.
- Empty bootstrap verified on new isolated databases. Upgrade on a retained-data restore preserved all original data; later additive steps preserved all original data in its 23 already-expanded business tables. Applied historical SQL was never rewritten or replayed on retained storage.
- Frontend lint/build and Chrome `test:smoke` passed. Connected Chrome passed signup/verification/login, manager buyer navigation, Admin MFA/recovery, public filter/empty/error/retry/menu/sold-out, keyboard focus and 360/1440 px overflow checks. Screenshots were inspected; a narrow menu-row layout was corrected and the browser journey rerun.
- Source DB verification was a direct read through the actual catalog/access services, not a browser claim about a deployed backend. Connected browser tests used real isolated MySQL with synthetic test actors; only outbound SMTP/password-corpus calls were replaced. Production email/provider availability and full accessibility are **NOT RUN**.

Private local backup/evidence: `/private/tmp/hlf-post-expansion-20261019/restore-evidence.json` and its protected companion dump. Temporary storage is not durable backup custody; the operator must preserve artifacts securely and rerun rehearsal when the source changes or evidence expires (24 hours). Disposable MySQL container `hlf-auth-discovery-test-20261019` was stopped after verification and retains restore/test databases only; the retained source container was not replaced/reset.

Historical scoped verification reused installed dependencies: Prisma CLI/client generation reported 7.10.1 and installed MariaDB driver 3.5.4, while lockfiles pin Prisma 7.10.0 and driver 3.4.5. No clean `npm ci` or remote CI run was performed; that earlier local run was not lockfile-reproducible. The follow-up below supersedes local dependency/test evidence; remote CI remains **NOT RUN**. The driver is now an explicit pinned backend dependency for the migration utilities.

The historical local slice left broad runtime grants. The [later authorized follow-up](auth-followup.md) switches local runtime to a fresh restricted identity and separates operator credentials; original users/grants remain preserved. Production configuration remains **NOT RUN**.
