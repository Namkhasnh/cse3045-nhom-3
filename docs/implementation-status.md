# Implementation and Evidence Status

## Accepted P25 account/support/audit — October21,2026

[Approved DEC-08](account-support-policy-proposal.md) and [P25 self-review/evidence](progress/P25.md) accept isolated synthetic account suspension/restricted obligations, compromised-password recovery, six-state scoped support, protected holds/retention and bounded redacted audit. Backend lint/49unit/8HTTP/build/Prisma,18real-MySQL cases,14P25 SQL denials,12legacy restricted-runtime cases and forward upgrade preservation PASS. Frontend lint/build/cart6/orders10/finance3 and actual Chrome response-loss/account-switch/foreign-ID/self-suspension/recovery/keyboard/five-width checks PASS; selected screenshots visually inspected. [Reproduction and adoption boundary](account-support-local-verification.md).

P22–P25 have sequential local acceptance records. Retained3307 adoption, production publication, remote CI and independent review NOT RUN. The temporary key vault refuses non-test DBs; actual services/key custody/backup expiration and duty staffing remain DEC-10/11/12. No real funds/messages/partner consent or V1.0 readiness claimed. P26/DEC-09 remains the next separate roadmap gate.

## Accepted P22–P24 finance — October21,2026

Explicitly approved [DEC-07](finance-policy-proposal.md) and sequential [P22](progress/P22.md)→[P23](progress/P23.md)→[P24](progress/P24.md) now accept isolated synthetic ledger/monthly statements/manual receipts/full reversal-replacement and connected exact owner/Admin reports. Backend lint/47unit/7HTTP/build/17MySQL, restricted-runtime12case, forward-base preservation, net-zero count follow-up, frontend lint/build/3finance+6cart+10orders and final Chrome recovery/scope/negative-credit/five-width/native-dialog checks passed. [Commands/evidence/adoption boundary](finance-local-verification.md). Source inspection, automated checks and real browser observation are distinguished in P23/P24.

[P25](progress/P25.md) now accepts approved DEC-08 account availability/support/privacy/retention/audit reads for local synthetic scope; the newer evidence below supersedes the previous unresolved gate. No separate production/version-release review is inferred. Retained3307 migration, real partner/consent/funds, production and remote CI NOT RUN; no automatic collection/payout or external message.

## P22 DEC-07 decision checkpoint — October21,2026

[Concrete policy package](finance-policy-proposal.md) explicitly approved by the user October21; [P22 handoff](progress/P22.md) records source inspection and decision boundary. Existing monthly deadlines/signed credit/no-overcollection remain approved; membership/finalization, reversal/replacement, evidence and report semantics are approved. P22 accepted after explicit user approval and policy checks; Subsequent P23/P24 implementation/evidence is recorded below. DEC-08 is a separate P25 gate. This P22 decision checkpoint itself made no runtime/schema/migration/retained-data changes or application-test claim.

Historical baseline inspection: October 18, 2026. The October 19 scoped update below supersedes affected source/status claims. Source and working-tree contents changed externally during this documentation task; this final snapshot replaces older summary claims. No application, migration, account or database action was performed by the documentation rewrite. Reinspect before implementing a prompt.

## Accepted V0.2 — October 19, 2026

**V0.2 is ACCEPTED** by [P04→P05→P06 self-review](progress/V0.2.md), following accepted V0.1. Five existing public catalog routes now have enabled OpenAPI schemas/examples/query/errors and real MySQL HTTP privacy/filter/cursor evidence. Public homepage/menu preserve real API data independent of auth failure, with missing/broken images and complete retry/404 states; header uses current capabilities.

`/cart` now persists non-sensitive one-restaurant intent, exact estimated dish subtotals and accepted prices; quantity limits, explicit cross-restaurant consent, reload/login/logout/account continuity, storage failure and current-catalog/price confirmation are implemented. Auth rechecks on focus clear private account views while preserving anonymous login forms. That V0.2 delivery introduced no server cart, order/quote mutation, recipient or recovery key. V0.5 separately adds cash checkout and private recovery; see its acceptance records below.

Backend lint/build, 26 unit tests, 6 HTTP E2E and 4 real-MySQL 9.2.0 integration groups PASS. Frontend lint/build, 6 cart unit tests, smoke and connected Chrome PASS, including homepage/menu/cart at 360/390/768/1024/1440 px, dialog keyboard/focus, lower controls clear of navigation, storage corruption/denial, price change during login, expired session/account switch and zero order requests. Cart and dialog screenshots were visually inspected. Exact commands, fingerprints and local artifacts: [P06](progress/P06.md). New cart unit tests are configured in frontend CI; remote CI and full accessibility audit remain NOT RUN.

Only a dedicated disposable MySQL 9.2.0 container was written; retained data/configuration were untouched. No migration/dependency upgrade/deployment or production acceptance. Browser SMTP/password-corpus replacements remain test boundaries. Earlier source/status descriptions below are historical where superseded here.

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

## October 19 V0.3 local synthetic implementation

[Sequential P07→P10 acceptance](progress/V0.3.md) supersedes onboarding-absent claims in the historical baseline. Current source has approved Vietnamese versioned terms, private MinIO evidence/retention, applicant submit/read/history, current MFA Admin review and atomic setup-required creation, authenticated selected-user manual consent/create and forward storage/grants. Buyer rights and one-restaurant cap remain.

Automated: lint/build/Prisma,27 unit,6 HTTP E2E,5 real MySQL9.2.0/MinIO integration groups, fresh restricted-runtime HTTP/SQL denials, empty/upgrade preservation and6 cart unit tests PASS. Browser: fixture smoke, V0.2 regression and P08–P10 real submit/replay/MFA/review/manual confirmation/create at five widths PASS. Evidence, exact commands and source fingerprint are linked from the acceptance record; self-review only.

No retained accounts/DB migration or real terms publication performed. Production object storage/scheduler/backup adoption and remote CI NOT RUN. Food-ready contact filtering and anti-evasion recoveries remain future contracted work, not current order functionality. No V1.0 readiness/release claim.

## V0.4 P11 scoped implementation — October 19, 2026

[P11](progress/P11.md) accepted locally: connected owner settings/Admin activation, weekly hours, readiness checklist and restricted-runtime audit/rollback/race evidence. Full V0.4 readiness waits for P12–P14; no retained-data or production adoption.

[P12](progress/P12.md) accepted October20 locally: verified surveys/opaque expiring quotes, real MySQL races/OpenAPI/restricted runtime and connected Chrome evidence. Production survey data/provider adoption remains unconfigured.

[P13](progress/P13.md) accepted October20 locally: owned menu/category management, sanitized separate dish media and history-preserving deletion, with MySQL/MinIO/restricted-runtime/browser evidence. Full sell readiness remains P14.

## V0.4 accepted local setup — October20,2026

[P14](progress/P14.md) and [V0.4 self-review](progress/V0.4.md) complete P11→P14: approved surveys/expiring quotes, owned menu/sanitized media, exact negotiated-rate consent and complete readiness. Backend36unit/6HTTP E2E/9MySQL integration groups/5restricted-runtime groups, frontend lint/build/cart and all connected Chrome journeys PASS. Upgrade preserves old menu/survey/rate/order snapshots without inventing verification/consent. [Local commands](setup-local-verification.md). Only isolated synthetic test databases were migrated; retained/production adoption and ordering/QR/commercial launch remain unaccepted.

## October 20 local homepage and onboarding follow-up

The separately approved [local demo adoption](local-demo-adoption.md) applied the seven missing V0.3/V0.4 migrations and runtime grants to backed-up local `hlf_dev_flow`, preserving every original row. A distinct labeled synthetic restaurant/four dishes now appear in connected discovery, including the new homepage dish section. Live terms now returns200; terms/history failures are independent and no longer render false empty history. This changes local adoption status only; historical V0.3/V0.4 evidence remains dated and production/real-partner adoption remains unaccepted.

## Accepted V0.5 — October20,2026 local synthetic scope

[V0.5 acceptance](progress/V0.5.md) closes [P15](progress/P15.md)→[P16](progress/P16.md)→[P17](progress/P17.md)→[P18](progress/P18.md) sequentially by Codex self-review. Implemented cash aggregate/snapshots/durable keys, account-scoped uncertain checkout, explicit price/quote consent, food-ready contact gating, owner fulfillment and buyer pending cancellation, independent cash receipt, atomic completed/base commission, history and safe polling with separate order/payment versions. Unknown incomplete legacy payment facts are not fabricated.

Final backend lint40unit/6HTTP/12real-MySQL integration groups/7restricted-runtime groups/build/Prisma PASS. Two independent backend processes prove key/state/payment/catalog race invariants. Frontend lint/build/6cart+7order tests and actual Chrome checkout/fulfillment/tracking plus all existing auth/catalog/cart/onboarding/settings/delivery/dishes/setup regressions PASS. Five widths360/390/768/1024/1440, keyboard/dialog and native offline/hidden/late-response evidence recorded. [Commands and artifacts](cash-ordering-local-verification.md).

Only isolated test_* databases on MySQL9.2.0:43316 and local MinIO43317 were used. V0.5 forward upgrade preserves original synthetic legacy columns/rows and deployed SQL checksums. Retained development3307/V0.4 sample remains unchanged: V0.5 adoption NOT RUN, requires its own explicit authorization and verified backup/restore. Remote CI and independent/human review NOT RUN; production/real partner/survey/consent, QR/refunds/AI/release remain unaccepted. [Migration gate](data/migration-plan.md#6-v05-ordering-adoption-is-separate).

## V0.6 P19 policy gate — October20

[P19](progress/P19.md) accepted after explicit operator approval and policy consistency checks. DEC-06 exact states/guards/DTOs/notices finalized; P20/P21 implementation acceptance remains NOT RUN. Retained migration unauthorized.

[P20 backend](progress/P20.md) accepted for local synthetic scope: verified QR config/snapshots/receipt/full refunds/scoped disputes/private evidence; actual MySQL/process races and restricted runtime PASS. P21/browser acceptance remains NOT RUN.

## Accepted V0.6 — October20,2026

[V0.6](progress/V0.6.md) accepts sequential P19→P20→P21 for local synthetic QR/direct full-refund scope. Backend44unit/6HTTP/13MySQL groups/8restricted groups, forward preservation/checksums, frontend lint/build/cart6/orders10, Chrome cash+QR/response-loss/reload/account/FileReader guard and cash tracking/history/five widths PASS. Source/commands/artifacts and self-review limits are in the version record. Retained3307 was not accessed/migrated; no real partner/bank/consent/refund/production acceptance. DEC-08 general support and DEC-10/11/12 production/publication gates remain.

## System review defect fixes — October 20, 2026

Scoped follow-up to the V0.1–V0.6 system review; existing acceptance sections above are historical, not new results. Codex self-review only; no independent/user review is inferred.

- Onboarding upload compensation now queries authoritative metadata by the generated immutable object key. It removes only a confirmed unpersisted object; metadata/read uncertainty preserves storage for reference-aware cleanup. Storage operations stay outside retried transactions.
- Explicit QR refresh now retrieves payment as well as instructions/disputes, with order/account scope, aborts and monotonic payment-version checks across refresh/mutations/Admin lookup. Account/restaurant-prop changes remount page state.
- POST /orders now emits Idempotency-Replayed:false with201 and true with200, preserving first-create Location, bodies, authorization and durable keys. MySQL assertions still require one order and one set of history/audit effects.

Reproduction/coverage details: [onboarding compensation](onboarding-local-verification.md#system-review-compensation-regression), [payment refresh](payments-local-verification.md#system-review-refresh-regression), [order header](cash-ordering-local-verification.md#system-review-order-replay-header-regression).

Newly executed final evidence (October20 local synthetic run; root commands, serialized compilation/browser ports):

| Exact command | Final result |
| --- | --- |
| npm --prefix backend run lint | PASS, 0 warnings |
| npm --prefix backend test | 44/44 PASS, 0 fail |
| npm --prefix backend run test:e2e | 7/7 PASS, 0 fail; Prisma mocked |
| npm --prefix backend run build | PASS |
| npm --prefix backend run test:integration | 16/16 PASS, 0 fail: 13 top-level groups + 3 upload fault subtests, actual MySQL9.2.0/private MinIO |
| npm --prefix frontend run lint | PASS, 0 warnings |
| npm --prefix frontend run build | PASS |
| npm --prefix frontend run test:cart | 6/6 PASS, 0 fail |
| npm --prefix frontend run test:orders | 10/10 PASS, 0 fail |
| npm --prefix frontend run test:onboarding | PASS, 1 Chrome journey |
| npm --prefix frontend run test:checkout | PASS, 1 Chrome journey |
| npm --prefix frontend run test:payments | PASS, 1 full Chrome journey including independent-owner/Admin refresh and held stale refresh |
| PAYMENT_ASYNC_ONLY=true npm --prefix frontend run test:payments | PASS, 1 FileReader/account-switch Chrome journey |
| git diff --check | PASS |

Fresh test_fixes_* databases only, MySQL43316/MinIO43317; no retained3307 access/reset/adoption, applied-migration edit, schema migration, external messages or real financial movements. Browser cases are real Chrome against synthetic local HTTP/MySQL/storage; outbound SMTP/password-corpus use the existing harness boundary. Screenshots include five widths and the Admin receipt/refund refresh view; source inspection and visual inspection are not independent acceptance.

Temporary run artifacts: /private/tmp/hlf-review-fixes/ (results.jsonl, databases.txt, run.py/final-run.py/payment-last.py, backend-unit.log, backend-e2e-final.log, mysql-integration-final.log, frontend-*-last.log, chrome-onboarding.log, chrome-checkout.log, chrome-payments-last.log, chrome-paymentasync-last.log and screenshots-*). Final payment screenshots are in screenshots-payments-last. These paths are temporary, not durable production evidence.

Earlier failed attempts remain in that directory: HTTP6/7 due to the new mock missing adminFactor (fixed); Chrome payment stopped once before restaurant options loaded (harness now waits for its real option), once because a new private test bucket was uninitialized (explicitly created before retry), and once because equal-version payment props unnecessarily restarted/aborted the instructions read (dependency changed to payment.version, then full Chrome rerun passed). No failed assertion was removed to obtain the final results. Final affected-document local links/anchors and <500-line checks PASS.

No remaining defect was established in this scoped final run. NOT RUN: remote CI, independent/human review, production/retained adoption, load testing, non-Chrome browsers and full manual accessibility audit. Production storage/backup/hosting remain NOT CONFIGURED under DEC-10/11/12. This fix does not establish commercial or production readiness.

## P23 accepted finance backend — October21

[P23](progress/P23.md) accepts local synthetic approved DEC-07 ledger/settlements/receipts/full reversals/replacements and scoped exact report API. Forward migration,47unit/7HTTP/17integration/12restricted cases, two backend processes and old-column/base preservation passed; see exact logs and limits. P24 UI/browser and DEC-08/P25 remain separate. No retained3307 migration, real funds or production action.
