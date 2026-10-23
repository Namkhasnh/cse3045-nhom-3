# Implementation and Evidence Status

## Accepted P25 account/support/audit — October21,2026

[Approved DEC-08](account-support-policy-proposal.md) and [P25 self-review/evidence](progress/P25.md) accept isolated synthetic account suspension/restricted obligations, compromised-password recovery, six-state scoped support, protected holds/retention and bounded redacted audit. Backend lint/49unit/8HTTP/build/Prisma,18real-MySQL cases,14P25 SQL denials,12legacy restricted-runtime cases and forward upgrade preservation PASS. Frontend lint/build/cart6/orders10/finance3 and actual Chrome response-loss/account-switch/foreign-ID/self-suspension/recovery/keyboard/five-width checks PASS; selected screenshots visually inspected. [Reproduction and adoption boundary](account-support-local-verification.md).

P22–P25 have sequential local acceptance records. Retained3307 adoption, production publication, remote CI and independent review NOT RUN. The temporary key vault refuses non-test DBs; actual services/key custody/backup expiration and duty staffing remain DEC-10/11/12. No real funds/messages/partner consent or V1.0 readiness claimed. P26/DEC-09 was subsequently approved October22; V0.8 local synthetic live acceptance is recorded below.

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

## October 21 — authorized local login/schema repair

After explicit user authorization, the eight outstanding forward migrations and reviewed runtime grants were applied to retained local `hlf_dev_flow` on loopback3307. The [auth repair evidence](auth-followup.md#october-21-local-login-repair) records backup/restore equivalence, full-chain rehearsal, checksums, preservation of all original 38 tables/158 rows and six denied runtime authority/history probes. This supersedes earlier local schema-adoption NOT RUN statements only: all 26 migrations are applied; retained business journeys and production adoption remain unaccepted.

Login's confirmed missing-column `P2022`/HTTP500 is resolved; nonexistent-account login now returns401 and public dishes200. The shared username pattern now escapes its hyphen for browser Unicode `v` validation. Frontend lint/build/smoke, Chrome form validation/error rendering at360px, and successful synthetic login/session recovery through a restricted runtime on the restored database passed. No existing password, ownership, consent or historical fact was rewritten; no synthetic test account was added to retained storage.

The subsequent [MFA configuration repair](auth-followup.md#october-21-local-mfa-configuration-repair) restores the original operator key through a protected external file and reloads the local backend. Direct injected keys remain supported. Backend lint/50unit/8HTTP E2E/build and real restored-MySQL restricted-runtime Admin MFA wrong401/valid200/session200 passed; existing retained factors/credentials/authority were unchanged. The user's live Authenticator login remains distinct from this isolated evidence.

## October 22 onboarding notifications

Implemented the user-approved in-site bell/mailbox, atomic onboarding/setup messages, seven-step current guidance, Admin pending queues and first-access summaries. [Contract](notifications-contract.md) and [verification](notifications-verification.md) separate source, real-MySQL/race/rollback/runtime-permission evidence, connected Chrome role journeys and local schema adoption. Forward migration preserves57 original business tables/173 rows in `hlf_dev_flow`; no business setup/consent/activation was invented. No email/chat/order notifications, new provider, production release or milestone acceptance is implied.

## October22 V0.8 — accepted local synthetic evidence

[DEC-09](ai-v08-contract.md) and [P26](progress/P26.md) are approved/accepted for decision scope. [P27](progress/P27.md)/[P28](progress/P28.md) add real-data recommendation backend and connected buyer UI, minimized Gemini free adapter, exact inclusive budget, shared MySQL quota/leases and safe manual fallback. [Verification](ai-local-verification.md)/[version evidence](progress/V0.8.md) separate unit/E2E/MySQL/restricted SQL/Chrome results. Operator-supplied key/free-tier attestation and quotas were verified without disclosure;100 real Gemini attempts meet the local synthetic rubric (97 within5s,72/75 preference hits,3 failures retained). P27/P28/V0.8 accepted by Codex self-review for isolated local synthetic scope; provider-stage timing is not a production HTTP/load SLA. Subsequently authorized local metadata migration/narrow grants/backend restart completed with all58 original tables/173 rows unchanged and100 actual calls carried forward; [receipt](ai-local-adoption-review.md). Production release NOT RUN.

## October 22 — P29 continuation and independent local recovery tooling

[V0.9](progress/V0.9.md) remains **BLOCKED / NOT ACCEPTED**. [P29/v2](infrastructure-recovery-proposal.md) records user approval of existing-VPS preference, no new paid provisioning/billing and Gemini Free/USD0; synthetic recovery targets15min/4h, daily full+binlog, encryption,14daily/8weekly/monthly drills. User explicitly has no offsite backup destination; key/offline-copy custody and DEC-10 access/services/compatibility/isolation/owners remain unresolved. User identifies as Admin and reports connected Terminal; UI access is safety-denied, no bypass. User corrected the SSH target: [read-only output receipt](evidence/p29-vps-user-inventory.json), October22 at10:25:14 Vietnam time, reports Ubuntu24.04.4LTS/x86_64/2logical CPUs,1967MiB RAM with1578MiB available,560/2047MiB swap used, root39% used with11785420KiB available, Node24.22.0/npm11.19.1 and restart-required banner. Earlier screenshot was from another SSH target and is EXCLUDED. MySQL client unavailable does not prove server absence. Subsequent user-provided read-only inventory shows image tag `mysql:9.2.0`, Up5days, host publication `127.0.0.1:3306->3306/tcp`, and33060/tcp listed without host publication; nginx/Docker active, caddy/mysql/mysqld systemd units inactive. Initial Docker permission denial is superseded for image/status inventory only. SQL VERSION/InnoDB/binlog/durable volume/image digest remain unverified; inactive host mysql units are consistent with a container and do not establish DB absence. This is user-supplied command evidence, not independent origin attribution or V0.9 capacity proof. No update/restart/install/permission change performed. Public HTTPS login200/TLS verification0, HTTP login200/no redirect, public catalog404 observed read-only; no remote modification.

New [ops tooling and executed reproduction](recovery-local-preparation.md): read-only VPS inventory helper, AES256GCM/RSAOAEP synthetic bundle+reconciliation and5failure groups, labelled disposable MySQL9.2.0 rehearsal. PASS empty bootstrap/28migration chain, synthetic legacy upgrade and62table/43row encrypted full restore with exact money/schema/data/checksum checks; synthetic erased/held keys/media/quota100 preserved appropriately. [Sanitized receipt](evidence/p29-local-preparation.json) records versions/hashes/timing. No application/CI/package/lockfile/schema/migration/guard edits; previous15source/evidence fingerprints unchanged.

This is independent local P29 preparation, not dependent P30 acceptance. NOT CONFIGURED: offsite transport/scheduler/retention/alerts, durable operational vault/media and approved staging. NOT RUN: binlog replay, current SSH/server SQL, nonempty history/key app replay/MFA/new order after restore, actual erasure integration, operational RPO/RTO, Linux build/pipeline/staging/load/P31 journeys. Existing app suites not rerun for ops-only changes. No new Gemini call, counter reset, retained migration, VPS change, purchase/billing, external message, pilot or production. [P30](progress/P30.md)–[P33](progress/P33.md) remain sequentially blocked; P32 concrete draft awaits real partner/window/evidence and later explicit authorization.

Google Drive follow-up: user selected existing Drive for off-VPS backup and requested [setup guidance](google-drive-backup-setup.md). Supersedes earlier absent-destination/workstation proposal; own Drive-only OAuth client/drive.file and actual capacity/key custody still pending. No billing, tokens, upload, retained-data export or VPS setup performed; P29/V0.9 remain BLOCKED. Documentation-only instruction changes, application tests NOT RUN.

Drive local-auth follow-up: user completed OAuth and reports `rclone about hlfdrive:`15GiB total/14.987GiB free ([receipt](evidence/p29-drive-preparation.json)); not an automated agent observation or retention/recovery acceptance. Local encrypted fixture/key setup is next; server-side setup, key/offline custody, OAuth lifecycle, actual backup sizing/retention/recovery remain open. No real-data upload or VPS change; P29/V0.9 BLOCKED.

October23: user reports age-encrypted synthetic fixture roundtrip on Drive PASS after download/decrypt/cmp ([receipt](evidence/p29-drive-preparation.json)). This is local user evidence, not agent-executed DB recovery/CI/staging. Offline key custody, OAuth secret/lifecycle, full/binlog/media retention capacity and server-side backup/recovery gates remain; P29/V0.9 BLOCKED. No code/config/VPS/database/billing/Gemini changes; documentation-only checks.

October23 OAuth notices: user authorized two public GitHub Pages pages in a separate repository; [homepage](https://namkhasnh.github.io/hlf-backup-info/)/[privacy](https://namkhasnh.github.io/hlf-backup-info/privacy.html) deployed with build/deploy success, HTTP200/TLS/hash and scoped Chrome360px/keyboard evidence ([receipt](evidence/p29-backup-pages-publication.json)). Local3file source under ops/hlf-backup-pages; no ordering frontend/backend/CI change. Google Console settings/domain verification/OAuth lifecycle unchanged and pending; no VPS/real-data/billing change. P29/V0.9 remain BLOCKED.

OAuth status follow-up October23: user screenshot confirms External/In production and saved Branding ([receipt](evidence/p29-drive-preparation.json)); Google changes user-performed, separate from website/VPS deployment. Post-publication rclone reconnect/refresh, exposed-secret replacement confirmation, offline-copy recovery, actual DB/binlog backup/scheduling and remaining DEC gates still open. Key securely saved per user, no secret accessed; P29/V0.9 remain BLOCKED. Metadata/docs-only changes; app tests NOT RUN.

October23 reconnect: user reports post-publication OAuth Success and `rclone about` OK; [receipt](evidence/p29-drive-preparation.json) records local interactive reauthorization/storage access PASS only. Next remote metadata inventory remains read-only; unattended refresh, DB/binlog recovery/sizing/scheduler and other P29 gates open. No token/secret access or VPS change; documentation-only checks, app tests NOT RUN.

October23 VPS SQL metadata: user successfully queried actual9.2.0/InnoDB/binlogON/ROW/30day expiry/sync1/flush1 using existing container credential; no credential value or business rows inspected/exported ([receipt](evidence/p29-vps-user-inventory.json)). Read-only size inventory next; no backup/retained mutation/purge/restart. This is settings evidence, not P29/P30 recovery/transport acceptance. Metadata/docs checks only; app tests NOT RUN.

October23 retainedVPS size snapshot from user: cse3045 has5tables/estimated0.19MiB, two binlogs total3006123bytes/EncryptedNo ([receipt](evidence/p29-vps-user-inventory.json)). Physical schema still to inventory; not assumed equal to local accepted source/rehearsal. No user rows/SQLdump/retained mutation or live-log change; full backup/growth/media capacity/recovery remain unverified. P29/V0.9 BLOCKED; metadata/docs only.

October23 source-attribution correction: user changed connection on Mac; masked backend/.env reads127.0.0.1:3307/hlf_dev_flow, not a runtime/SQL recheck. Earlier cse3045 size metadata belongs to observed VPS instance; active VPS backend mapping remains unverified. No secret output, DB change/export/migration or VPS upgrade; source availability during Mac sleep remains a P29 planning gate.

October23 connection-file evidence: user-run masked probe in confirmed hlf-backend working directory reports **127.0.0.1:3306/cse3045**, sourced from `.env` after process DATABASE_URL was unavailable. This narrows the VPS attribution gap but does not prove the running process loaded that file. Mac configuration remains separate **127.0.0.1:3307/hlf_dev_flow**; do not switch, merge, migrate or export either retained database. Existing5table/0.19MiB VPS metadata is not the accepted local V0.8 schema. Credentials were not printed or retained; no remote mutation or backup enabled. P29 remains BLOCKED; P30–P33/V0.9 unaccepted. See the current sanitized VPS inventory for details.

October23 VPS backup-tool check: user `command -v` reports **rclone: NOT CONFIGURED; age: NOT CONFIGURED** in the current SSH user PATH. No exhaustive disk inventory implied. Installing tools, transferring OAuth credentials or enabling a scheduler on the retained VPS remains outside current authorization; none performed. Local Mac encrypted-file roundtrip remains separate and does not prove VPS unattended backup. P29/DEC-10/11 remain BLOCKED; P30–P33/V0.9 remain unaccepted.

October23 independent local offsite database drill: **PASS** agent-executed `node ops/recovery/rehearse.mjs --drive-synthetic` ([receipt](evidence/p29-drive-database-drill.json)). New disposable MySQL9.2.0 empty/legacy migration chain; only214884-byte encrypted synthetic archive uploaded to existing Drive, downloaded with identical SHA256, then restored62tables/43rows with exact schema/data/migration/money checks, erased-key exclusion, held-key/media preservation and synthetic counter100. Upload/read-back12.934s, full run35.338s, local simulated gap13.296s, decrypt/SQL/validation0.934s; **not operational RPO/RTO**. New opt-in mode has fixed synthetic namespace/no retained input, leaves ciphertext only (ephemeral private key never uploaded), and preserves all three existing containers. Ops syntax/lint/5crypto test groups PASS; application suites NOT RUN for ops-only change. VPS tools still NOT CONFIGURED; unattended/full+binlog retention/offline-custody/staging/app-replay gates remain open. No VPS, retained DB, real Gemini counter, billing or pilot changes. P29–P33/V0.9 remain unaccepted.

October23 binlog continuation: agent-executed **PASS** `node ops/recovery/rehearse.mjs --drive-synthetic --binlog-synthetic`; [procedure and offline-copy check](recovery-binlog-verification.md), [receipt](evidence/p29-binlog-recovery-drill.json). Disposable MySQL9.2.0 full restore still62tables/43rows; separate one-table probe recovered exact large integer/decimal/update/delete/insert across two authenticated encrypted binlogs read back from Drive. Missing/reordered/corrupt increments refused; rollback and after-cutoff writes excluded. Native mysqlbinlog9.5.0 used because server image lacks that tool; initial exit127 corrected, cleanup completed. This is local synthetic infrastructure evidence, not app-intent replay or operational RPO/RTO. Offline age verifier passes disposable-key positive/negative checks, but **user's actual offline copy remains NOT RUN**, pending user verification/custody confirmation. Automatic VPS backup **NOT CONFIGURED**; V0.9 **BLOCKED / NOT ACCEPTED**. No VPS/retained data/Gemini changes; app suites NOT RUN for ops-only tooling.

October23 user deferral: offline-copy attempt reported `OFFLINE_COPY_NOT_READABLE`; user then requested skipping the USB step. Actual offline-key recovery remains **NOT RUN — deferred at user request**, not PASS or an acceptance waiver. No further USB action requested. Automatic VPS backup remains **NOT CONFIGURED**; V0.9 **BLOCKED / NOT ACCEPTED**. Existing synthetic binlog PASS evidence is unchanged.

October23 renewed V0.9 completion request: first unfinished gate remains P29. [Current continuation table](progress/V0.9.md#current-continuation--october-23-2026) separates verified Drive/full/binlog preparation from unresolved intended retained source (Mac current features versus VPS old5table database), remote authentication, unattended jobs, custody/services/staging and pilot inputs. Source question pending; no retained export/merge/migration, VPS mutation or dependent P30–P33 acceptance inferred. USB remains deferred.

October23 authorized retained Mac protection: user selected `hlf_dev_flow` first; source9.2.0/62InnoDB tables verified. **PASS** local age-encrypted full SQL backup and isolated9.2.0 restore62tables/203rows/28migration checksums, exact canonical schema/all-row fingerprints and source unchanged at recorded checks. Automatic review initially rejected source-only Drive authorization; rejected command did not run. After local-only restore, user explicitly approved the exact60,188byte ciphertext and Drive destination; approved uploader/read-back/SHA256/decrypt/manifest **PASS**. [Procedure](mac-backup-verification.md), [sanitized receipt](evidence/p29-mac-backup.json). Private key/plaintext SQL never uploaded; new labelled restore container removed; no source/VPS migration, data write, Gemini call or app startup. USB remains deferred/NOT RUN. Automatic Mac/VPS backup, continuous binlog shipping, media/vault/journal/app recovery and operational RPO/RTO remain incomplete; P29/P30/V0.9 BLOCKED / NOT ACCEPTED. Future uploads/scheduling not inferred from this single-file approval.

October23 manual Mac backup workflow: user requested end-of-session/pre-change backup without keeping Mac awake continuously and confirmed Google Drive destination. `node ops/recovery/backup-to-drive.mjs` now performs local-only encrypted full backup/isolated9.2.0 restore before restricted ciphertext upload/read-back. Actual full pipeline **PASS**; [procedure](mac-backup-verification.md), [receipt](evidence/p29-mac-manual-backup.json). Only the existing age key path is remembered privately; key content is not copied/uploaded. No scheduler/background job/deletion/VPS change. Shut down only after the manual run finishes successfully. SQL-only/manual recovery is distinct from operational15minRPO; V0.9 remains BLOCKED / NOT ACCEPTED.

## October 23 — Scoped MVP ordering and three-role UX

[Verification](mvp-ordering-verification.md) / [receipt](evidence/mvp-ordering-verification.json): PASS57backend unit,9HTTP E2E,20real-MySQL groups,3AI-summary unit and19frontend unit cases; backend/frontend lint/build PASS. Actual Chrome155/real disposable9.2.0 PASS tracking, QR/refunds, finance, administration/support and onboarding. Manager buying, actor isolation, durable replay/price consent/state/payment separation, pagination,360–1440px/keyboard/dialog and360px native submit hit-test are recorded within exact fixture boundaries. Fixed owner return-to-newest, current management sidebar marking, duplicate pickup-name display and lint initialization; aligned stale/racy browser assertions without relaxing business rules. Added reproducible ops runner and preserved prior working-tree changes. No retained/VPS/real partner/payment/Gemini action or deploy; full accessibility/load/staging/pilot remain unaccepted. V0.9 gates unchanged.

October23 P29 independent Linux preparation: [handoff](staging-next-step.md)/[receipt](evidence/p29-linux-candidate.json). Linux/amd64 backend/frontend build PASS, native sharp/generated Prisma/AppModule imports PASS; full Nest startup on fresh9.2.0 DB returns200 public and401 unauthorized/invalid-login under bounded disposable containers. Measured source resource snapshot recorded; artifact checksums and secret-boundary scan saved. This is off-host preparation only; VPS transfer/deploy/real load not run, P29/P30/V0.9 remain unaccepted. No application source changed or prior app suites repeated.
