# Onboarding notifications verification — October 22, 2026

Authority: approved user implementation plan and [contract](notifications-contract.md), US27/FR13/AC18; NOTIFY-01/02. Self-review only; no production release or independent/user acceptance claim.

## Implemented

- Real MySQL inbox with unique logical-mailbox/event identity, immutable content and read state; atomic onboarding/setup notifications, no account FK lock inversion.
- Session-scoped bell/recent preview/unread count; mailbox/detail/unread pagination/read-loaded actions; current seven-step checklist composed into application, owner settings, Admin restaurant and inbox screens.
- Current Admin queues for pending applications/manual confirmation, delivery reviews and restaurant setup/activation/receiving. Exact application/restaurant/proposal links work beyond the first application page.
- First-access current summaries for pre-existing applicants/managers/Admin; no invented historical messages, no email/chat/order/finance expansion and no automatic consent/activation/receiving.

## Automated evidence

Run from repository root, backend compilation commands sequentially. Logs are temporary `/tmp/hlf-notifications-*.log` files, not committed private artifacts.

| Check | Observed result |
| --- | --- |
| `npm --prefix backend run lint` | PASS |
| `npm --prefix backend test` | PASS50 unit tests |
| `npm --prefix backend run test:e2e` | PASS8 HTTP tests; sandbox initially denied listen, authorized loopback rerun passed |
| `npm --prefix backend run build` | PASS |
| `npm --prefix backend run prisma:validate` / `prisma:generate` | PASS; generation also runs before build/test compilation |
| `npm --prefix backend run test:integration` | PASS19 tests on fresh `test_notifications_full_20261022`, MySQL9.2.0 + real private local MinIO |
| `node --test .test-dist/test/integration/notifications.integration-spec.js` from backend | PASS NOTIFY-01 lifecycle, loaded-ID read race, scoped access/MFA, bootstrap/deduplication/rollback, pagination, readiness loss and manual invitations; final extension also creates a real cash order after readiness, validates notification responses against OpenAPI, resolves approved context from pre-approval messages, and verifies Admin queues/CSRF/account-change rejection |
| `node test/onboarding-restricted.mjs` from backend | PASS13 tests using newly created restricted runtime identities; SQL cannot rewrite/delete notification content |
| `npm --prefix frontend run lint` / `build` | PASS, no lint warnings |
| `npm --prefix frontend run test:cart` / `test:orders` | PASS6/10, including safe login return and shared polling hidden/offline/backoff behavior |
| `git diff --check` | PASS |

Fixture URLs use loopback43316 with databases named test_notifications_*. Explicit ONBOARDING/MEDIA local storage config uses loopback43317 and separate evidence/dish buckets; synthetic compose credentials are documented in [setup verification](setup-local-verification.md). No new dependency/provider was installed.

## Browser evidence

`npm --prefix frontend run test:setup`: real Chrome, cookies, MFA, MySQL and APIs. Extended checks cover owner first-access summary, bell unread preservation/Escape, manual read, complete seven-step guide, Admin task overview, profile/hours/menu, survey proposal/review, rate proposal/explicit consent/retry, active/ready/receiving states and current guidance after readiness. Checks360/390/768/1024/1440px and keyboard. Initial successful artifacts: temporary suffix `hlf-browser-evidence-F8OmKk`;360px inbox screenshot visually inspected.

`npm --prefix frontend run test:onboarding`: PASS real Chrome natively submitted form/private uploads/terms, uncertain-result same-key recovery, sole Admin MFA/approval, visible setup guide, manual invitation/user confirmation/manual creation, five widths and keyboard. Artifacts suffix `hlf-browser-evidence-u2DLMp`.

A premature checklist assertion was corrected to wait for the asynchronous guide response. An early browser run overlapped test-output cleaning and was rerun sequentially after compilation. These failed harness runs are not counted as passing evidence. The final setup run also passed notification-specific network-error/retry and injected HTTP401 polling-stop/preview-clear checks. Final artifacts suffix `hlf-browser-evidence-hV8lbq`; transport failures are injected test boundaries, not claims of an actual SMTP/network outage. Shared polling's hidden/offline behavior has unit evidence; do not present it as a full offline onboarding journey.

## Local schema adoption and recovery

The requested feature was adopted on the existing loopback3307 `hlf_dev_flow` after reviewed migration checksum checks, full backup and actual restore into new `test_notifications_restore_20261022` on the isolated MySQL9.2.0 container. The restored copy was migrated and every original business table's row/schema fingerprint compared before migrating the source.

PASS57 original business tables /173 original rows preserved exactly; only `_prisma_migrations` and the additive notifications table changed. Notification count was zero at migration verification; summaries are produced only on a later legitimate first access. Runtime receives INSERT and UPDATE(read_at), preserving content immutability. No owner, authority, profile, survey, fee, rate, consent or order was fabricated/changed. A grant-script helper error occurred after schema migration; the separate completion step granted only those two privileges and reverified original fingerprints/checksum.

Protected backup/restore/adoption evidence: `/private/tmp/hlf-notifications-adoption-20261022/`, directory0700 and files0600. This directory contains sensitive backup material and must not be committed. Recovery is forward-compatible: stop new notification reads/writes while repairing source; preserve mailbox rows, successful event identities, and all business data. No retained reset or migration rewrite.

Local Vite/backend were restarted with existing environment. HTTP smoke: homepage200, anonymous inbox/summary401. Authenticated local-user browsing was not claimed; connected role journeys above use isolated synthetic actors. Production retention/hosting rollout remains separate.

## October 24 standalone notification redesign

Authority: approved user plan and clarification that `/notifications` is a separate page, without the personal-account sidebar. Self-review only. [Design mapping](ui/notifications-figma.md) records the current Make preview/source and the retained project typography/tokens.

### Result and changed files

- Standalone route, shared header bell, 410px desktop popover/mobile sheet, reusable notification cards, All/Unread/Read and category filters, date grouping, pagination, loading/empty/error/retry, focus/Escape/outside click and reduced motion.
- Explicit per-item read-on-click before contextual navigation. Confirmed mutations update the shared count/card state and invalidate delayed polls. Loaded pagination depth is retained during refresh. Full read-all includes unloaded rows, with a server ID cutoff; later IDs remain unread.
- Backend reconstructs order destinations from durable role/source metadata and current buyer/restaurant ownership. Unknown/system messages without a destination open their own details. Stored arbitrary URLs cannot become destinations. No order, payment or commission mutation is performed by read operations.

Scoped file inventory (pre-existing changes in overlapping files were preserved):

| Area | Files |
| --- | --- |
| Backend HTTP/wiring | `backend/src/http/notifications/notifications.module.ts` |
| Backend behavior | `backend/src/workflows/notifications.workflow.ts`, `backend/src/modules/notifications/{public.ts,notifications.repository.ts}`, `backend/src/modules/orders/{service.ts,orders.repository.ts}` |
| Frontend route/navigation | `frontend/src/App.tsx`, `frontend/src/app/layouts/WorkspaceLayout.tsx` (standalone route and removal from personal sidebar only) |
| Notification frontend | `frontend/src/features/notifications/{api.ts,context.ts,NotificationProvider.tsx,NotificationBell.tsx,NotificationItem.tsx,InboxPage.tsx,notification-time.ts,notifications.css}` |
| Tests/scripts | `backend/test/integration/{notifications.integration-spec.ts,orders.integration-spec.ts}`, `frontend/scripts/{browser-notifications.mjs,browser-setup.mjs,browser-workspaces.mjs,browser-homepage.mjs}`, `frontend/package.json` |
| Contracts/docs | `docs/{README.md,requirements.md,testing.md,notifications-contract.md,notifications-verification.md}`, `docs/data/notifications.openapi.json`, `docs/ui/{ui_convertion.md,notifications-figma.md}` |

### Automated evidence

| Check | Actual result |
| --- | --- |
| Frontend lint / build (TypeScript + Vite) | PASS; existing bundle-size warning remains (>500kB minified chunk) |
| Backend lint / build | PASS |
| `npm --prefix backend test` | PASS60 unit tests |
| `npm --prefix backend run test:e2e` | PASS9 HTTP tests |
| `npm --prefix backend run test:integration` | PASS21 tests on real MySQL9.2.0/MinIO, isolated `test_notifications_redesign_20261024` |
| Final targeted compiled integration rerun | PASS2 notification/order suites after final URL normalization; includes independent-connection cutoff race, persisted timestamps/counts, ownership, removed-owner destination and unchanged order/payment/commission checks |
| Frontend `test:orders` / `test:cart` | PASS10 / PASS7 |
| Frontend `test:notifications` | PASS real Chrome with controlled API fixtures, five widths, click/double-click/failure/retry, full-read beyond first page, page reload, filters, role destinations, stale pre-mutation polling response, bounds/Escape/focus/outside click/reduced motion |
| Frontend `test:setup` | PASS real cookies/auth/API/MySQL browser journey, including read-on-click, logout/sign-in persistence, current owner destination, setup lifecycle, network failure/retry and expired-session polling stop |
| Frontend `test:workspaces` / `test:homepage` / `test:smoke` | PASS existing workspace/header/homepage/auth-route regressions |
| `git diff --check`, changed notification Markdown local links and <500-line limits | PASS |

Commands run from repository root except the final compiled targeted integration call from `backend`. Backend compilation commands ran sequentially. Expected injected500 logs in rollback tests are not actual test failures. Early attempts failed on legacy selectors/expectations and fixture setup (foreign URL schema, already-owned reassignment target, shared integration/browser pagination); these were corrected and final runs passed. A resize-triggered premature popover close found by browser screenshots was corrected to reposition the open popover instead.

### Browser observation and remaining boundaries

Visually inspected desktop1440px page and mobile390px dropdown screenshots: centered standalone feed, shared header, visible read indicators, viewport-bounded sheet, fixed footer and internal scrolling. Controlled final notification screenshots: temporary `hlf-notifications-evidence-ZfpNGW`; real authenticated journey: `hlf-browser-evidence-ygRUAO`; workspace: `hlf-workspaces-evidence-FwpfSO`; homepage: `hlf-home-evidence-dFJPRG`. These artifacts are local test evidence, not production screenshots or independent acceptance.

Migration: **none added or required**. The existing29 forward migrations were applied only to fresh disposable `test_*` databases to verify the current schema; no original migration was edited. A separate `test_notifications_browser_20261024` isolates browser fixtures from integration data. Existing retained/development/production notifications were not reset, removed, reseeded or backfilled. Prisma Client generation occurred through existing build/test hooks; it is not claimed as schema correctness evidence by itself.

No VPS deployment or production browser verification was performed. Production data/permissions and release readiness are outside this scoped test evidence. Figma Make's Manrope and mocked records were intentionally replaced with approved Be Vietnam Pro, semantic tokens/icons and real APIs; see the design mapping. No dependency, notification provider or database infrastructure was added.

## October 24 incoming popup and optional chime

Authority: the user's explicitly approved implementation plan; self-review only. Extends the existing session provider/poll and bell controls with `NotificationToast`, `use-notification-alerts` and `notification-sound`. No backend, API, migration, dependency or deployment change was made for this extension; earlier overlapping working-tree work was preserved.

| Check | Actual result |
| --- | --- |
| `npm --prefix frontend run lint` | PASS, no warnings in the final run |
| `npm --prefix frontend run build` | PASS TypeScript/Vite; existing >500kB chunk warning remains |
| `npm --prefix frontend run test:notifications` | PASS real headless Chrome with controlled API transport and real Web Audio nodes; retains previous five-width mailbox regressions |
| Incoming-alert browser cases | PASS initial-load suppression, exact IDs above Number.MAX_SAFE_INTEGER, burst selection/count, repeated-poll deduplication, default mute, focus and hover pause beyond 8 seconds, auto-expiry after blur, Escape/focus return, and bell dismissal |
| Audio/preferences browser cases | PASS one two-tone chime per batch, explicit activation/test sound, controlled blocked resume/retry, sound-only operation, read-message suppression, reload persistence/reactivation without replay, stop-on-disable, independent switches and blocked-localStorage memory fallback |
| Read/privacy browser cases | PASS failed read and failed detail preserve retryable popup; successful fallback detail navigation; expired-session cleanup, account isolation, inactive/reactivated account and logout cleanup |
| Visual observation | Inspected 360px and 1440px popup screenshots: below shared header, viewport-bounded card, Vietnamese copy and visible action/close controls |
| `git diff --check`; affected Markdown local link paths/anchors and <500 lines | PASS |
| Subjective listening on a physical audio device | NOT RUN; Web Audio activation, oscillator scheduling and stopping are automated evidence, not an audible-volume/quality claim |

Final controlled-browser screenshots: temporary `hlf-notifications-evidence-FmXZjm` under the OS temporary directory; visual inspection also used the equivalent earlier `hlf-notifications-evidence-80qbAc/notification-toast-{360,1440}.png`. No screenshots contain real user data. The first sandbox run could not start the Vite loopback server; the authorized local Vite/Chrome rerun passed. Early test corrections enabled headless tab focus and made the blocked-audio fixture suspend the real context before rejecting resume. Final checks use those corrected fixtures.

Delivery remains bounded by the existing recent-page poll while the website is visible/online. No real-server event-generation or persistence claim is added by these controlled fixtures; existing backend evidence above remains historical. No physical listening, VPS deployment, OS notification or closed-tab delivery was performed.

## Local runtime follow-up — 422 after frontend refresh

The reported localhost5173 error was reproduced in the user's existing Chrome session: summary returned200 while list queries with read_state/category returned422. Source and current dist supported those fields, but port3000 was held by an older, non-watching `node dist/main.js` process started before the redesign build. Rebuilding files did not reload the already-imported modules in that process.

Rebuilt backend successfully and restarted only that identified local backend with the current build and existing local environment. Verified directly in the existing authenticated Chrome tab: All/Unread/Read queries now return200, real messages render, and header/page unread counts agree. Restored the All filter. No read-state mutation, migration, reset, seed or VPS deployment was performed as part of this runtime repair. No API compatibility fallback or source behavior change was necessary.

The later order/history500 follow-up exposed a separate missing storefront migration in the retained local database after the runtime restart. [Website runtime repair](website-local-verification.md) records its subsequent verified local adoption, original-data preservation and broader regression. No notification schema migration was needed.
