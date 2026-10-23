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
