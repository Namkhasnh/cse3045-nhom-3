# Local website regression and runtime repair — October 24, 2026

Scope: the user's reported notification422/order500 errors and subsequent request to recheck the local website. This is implementer verification, not independent review or production acceptance. Existing authentication/session, notification alerts and workspace work was preserved.

## Root cause and repair

1. The notification list422 came from an older non-watching backend process. Updating `dist` did not reload its imported modules. Restarting the identified local process loaded the supported notification filters; see [notification follow-up](notifications-verification.md#local-runtime-follow-up--422-after-frontend-refresh).
2. The subsequent order/history/public catalog500 came from the retained local database missing `20261024010000_restaurant_storefront`, while the new Prisma client selected its restaurant columns. Backend diagnostics showed missing-column errors. A successful connection/`SELECT 1` alone had not established runtime compatibility.
3. Reviewed and adopted that existing forward migration on the local development database after protected backup, verified restore and migration rehearsal. Restarted the local backend and checked the actual signed-in browser and public API. No original migration was edited or new migration created.

`backend/src/prisma/runtime-schema.ts` now checks the current cutover's required columns and completed migration marker read-only. `backend/src/main.ts` initializes providers, checks readiness, closes on failure and only then opens the HTTP listener. Missing columns or an incomplete marker produce an operator-directed error; HTTP startup never applies DDL or resets data. `runtime-schema.spec.ts` covers complete/additive schema, missing column and missing table. The current marker must advance with future schema-dependent releases; this is not a complete structural schema-diff tool. `db:check` remains a connectivity check.

## Changed areas in this repair

| Files | Purpose |
| --- | --- |
| `backend/src/main.ts`, `backend/src/prisma/runtime-schema.ts`, `runtime-schema.spec.ts` | Read-only schema readiness before HTTP starts; focused failure tests |
| `frontend/scripts/browser-{checkout,tracking,payments,fulfillment,recommendations,connected,onboarding,delivery,dishes}.mjs` | Update notification/storefront/Admin/checklist selectors and copy; wait for pickup options before selection |
| `frontend/scripts/browser-administration.mjs` | Target the open confirmation dialog instead of the closed mobile drawer; enable headless focus emulation |
| This report, documentation map, testing/development guides, migration plan, storefront/notification verification | Record actual local adoption, checks and remaining boundaries |

Notification page/dropdown/API implementation and its earlier file-level contract remain in [notification verification](notifications-verification.md) and [notification contract](notifications-contract.md). Existing unrelated working-tree files are not attributed to this repair.

## Retained local migration evidence

- Target was verified as loopback local development MySQL Community Server9.2.0/InnoDB. Production/VPS was not accessed or deployed.
- Verified all28 prior applied migration checksums against repository files; exactly one pending migration.
- Backup and restore into an isolated test container compared equal before rehearsal. Rehearsal then applied the reviewed migration and passed the new startup gate; the pre-migration clone failed the gate as expected.
- Rechecked the retained source before adoption. All61 original business tables' original column/row hashes remained unchanged after adoption. New restaurant fields areNULL and `restaurant_cover_media` starts empty.
- Narrow runtime grants were added for the optional restaurant fields, cover insertion and cover cleanup timestamps. No order, payment or commission write permissions were expanded for read-state operations.
- Protected local backup/receipt: `/private/tmp/hlf-website-repair-GLvt0W/retained.sql` and `evidence.json` (directory0700/files0600). They contain private operational data and are deliberately not committed. No reset, reseed, removal of notification records or fabricated historical backfill occurred.

## Automated checks

| Check | Result / boundary |
| --- | --- |
| Backend lint, build, `prisma:validate` | PASS; generated Prisma client through the existing hook |
| Backend unit tests | PASS65; additional dev-runtime preflight1/1 and AI evaluation-summary units3/3 |
| HTTP E2E | PASS9; mocked persistence, not MySQL evidence |
| Full integration | PASS21 on fresh `test_website_regression_20261024`, real MySQL9.2.0/MinIO; includes ownership, read-state persistence/idempotency, order lifecycle, exact finance, rollback and race checks |
| Frontend lint, TypeScript/Vite build | PASS; existing >500kB bundle warning remains |
| Frontend cart/order/finance units | PASS7/10/3 |
| Controlled Chrome suites | PASS `test:smoke`, `test:homepage`, `test:storefront`, `test:cart-browser`, `test:workspaces`, `test:notifications`; controlled API fixtures, desktop/mobile, keyboard, loading/empty/failure and notification interaction coverage |

Backend logs for deliberately injected rollback/provider failures in integration are expected assertions, not unhandled test failures. The initial integration attempt used a previously populated test database and failed the Admin initialization fixture; the complete rerun on a fresh database passed21/21 without weakening the assertion. An initial sandbox-denied HTTP listener was rerun with local execution permission.

Connected Chrome regression uses the suites recorded below. Each suite uses a newly created disposable `test_web_*` database and actual application HTTP/authentication/MySQL, with existing synthetic SMTP/media/provider boundaries. Tests never target the retained database. Existing browser assertions are updated for the approved notification detail class/action, icon-bearing cart buttons, current checklist/error copy and open-dialog focus; the general cart/auth journey asserts disabled handoff until price consent and a valid quote, and asynchronous pickup/application data is awaited before selection; no production UI is changed to satisfy legacy selectors.

## Connected Chrome suite inventory

**PASS20/20 browser suites** (six controlled and fourteen connected). The final rollup is stored in `/private/tmp/hlf-website-browser-final-results.json` with the latest completed result for each suite. Each name below is an existing `npm --prefix frontend run test:<name>` command.

| Suites | Coverage |
| --- | --- |
| `checkout`, `fulfillment`, `tracking` | Login/cart preservation, explicit price/quote consent, recovery/deduplication, authorized notification destinations, fulfillment/payment independence, history, offline/hidden-tab polling |
| `payments`, `finance` | Direct QR/refund recovery, bank-data isolation, account denial, append-only commission/reconciliation/report journeys |
| `administration` | Support, suspension, holds, audit, current ownership, redaction and recovery without reactivation |
| `onboarding`, `setup`, `settings`, `delivery`, `dishes` | Applications/invitations/consent/review, profile/readiness, explicit receiving switch, surveyed fee approval, dish/media management |
| `storefront-connected` | Owner description/cover through HTTP/MySQL/MinIO and public reload |
| `recommendations` | Deterministic provider failure/timeout/quota and manual ordering through actual local APIs; no live AI-provider claim |
| `connected` | General public/cart/auth, account isolation, safe return, MFA/recovery, keyboard, storage failures and price/quote gates |

The six controlled suites in the previous table supplement these14 connected suites. Initial failures were stale UI selectors/copy, picking a closed drawer instead of the open dialog, reading async options/cards/scroll geometry before readiness, or asserting desktop navigation while the mobile menu was closed. Assertions were aligned with inspected source and screenshots; checkout gating and access denials remain asserted. No production UI or business rule was weakened to make a test pass.

## Actual local browser/API observation

Read-only inspection in the existing signed-in Chrome session confirmed order history lists stored orders and order detail renders items, fulfillment history and independent payment state. Also opened notification inbox, account, support/privacy, owner overview/settings/menu/orders/delivery/payments/commission/finance, public restaurant and homepage. These are page-load observations, not mutation journeys on the real account. The final attempt to repeat the native-browser check could not bind its previous Chrome window (`cgWindowNotFound`); the observations above occurred earlier in this same repair, and the final anonymous API liveness check still returned200 for catalog and401 for protected lists. One navigation to delivery briefly showed a browser connection error; reopening the same route rendered the page normally.

Public read-only API requests returned200 for restaurants, dishes, categories, pickup points and actual restaurant/dish filtering. Anonymous orders, notifications, owner and Admin endpoints returned401. Signed-in browser notification list/summary and order/payment reads returned200. No actual account's order, payment or notification state was changed during this inspection.

## Evidence and limits

Local logs: `/tmp/hlf-website-{backend-lint,build,unit,e2e,integration,frontend-lint,frontend-build,cart-unit,orders-unit,finance-unit}.log`. Controlled-browser summary: `/private/tmp/hlf-website-browser-results.json`; connected-browser logs/summary use `hlf-website-connected-*`. Temporary artifacts are local evidence and may expire.

`test:local-demo` was NOT RUN: its fixed four sample-dish precondition does not match the current retained user catalog; no demo seed was applied to satisfy it. Read-only public API and native Chrome observations above cover the current actual catalog instead. Additional operator CLI/SMTP/permission/release suites were NOT RUN in this pass; only the explicitly listed checks are claimed.

No VPS deployment, production verification, real-payment mutation, external live-provider sweep or independent acceptance was performed. Admin mutation journeys use synthetic fixtures, not the real operator account. Browser suites establish their named scenarios/viewport assertions; they cannot guarantee every possible browser, network or data condition. Existing release/retained adoption gates outside this specific local migration remain in effect.

## Order-code release follow-up

A subsequent owner-order redesign introduced another schema-dependent runtime release. The [local order-code repair](local-runtime-order-code-repair.md) records the missing-column reproduction, safely applied analytics/code migrations, updated startup marker and fresh project regression. Earlier storefront-only schema-gate evidence is historical; the gate now covers the public order-code release as well.
