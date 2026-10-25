# Owner order dashboard and public references — October 24, 2026

Authority: user-approved implementation plan and [Figma Make](https://www.figma.com/make/xfAu5VZ9550JhtiOcKjCGA/Redesign-Notification-Experience?preview-route=%2Fowner%2Fsettings), [requirements](../requirements.md), [API](../data/api_contract.md#owner-order-dashboard-and-shared-codes--october-24) and [database](../data/database.md#43-orders-items-history-and-durable-idempotency).

## Presentation and behavior

The existing owner route now uses four server-counted status summaries, a four-column Kanban board, card list, code-prefix search, payment-method and inclusive Vietnam-date filters. Default dates are unrestricted so yesterday's pending orders remain visible. Desktop defaults to Kanban; mobile defaults to list. Each column/list has independent bounded signed-keyset pagination. Rejected/cancelled remain accessible through list filters.

The existing header/sidebar, Be Vietnam Pro and semantic cream/orange tokens are retained. White cards show accepted item snapshots, pickup point, exact totals and separate fulfillment/payment badges. The right native-modal drawer becomes full-screen on mobile; nested confirmation, reasoned rejection, support, cash and QR/refund panels reuse current behavior. Focus returns to the opener, Escape/backdrop close, pending commands block close, and a draft rejection reason asks before dismissal. Reduced-motion and stale/empty/error/loading states are supported.

Point labels are visible from pending. Acceptance never discloses recipient name/phone. Explicit food-ready reveals contact, retains accepted status and creates no commission. Starting delivery remains separate. Backend projection enforces the same omission on cards and owner detail, including owners buying from themselves. Hidden fields never reach the browser. No search by customer identity is offered.

Cards mutate only after server confirmation, serialize writes, and require refresh/review after failed/uncertain actions. Detail retains version-aware order/payment merging and blocks writes while reconciliation is pending or connection is paused/error. Polling retains five-second visible/online behavior and backoff. Protected read failures clear private data.

## Interfaces and migration

All order responses now include one immutable `order_code`, `HLF-` plus eight characters from `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`. Buyer checkout/history/tracking, owner cards/detail/dashboard, new notifications and ledger lists show the same reference. IDs remain strings and remain in URLs, mutation payloads, keys and foreign keys. Historical notification text is retained.

Owner list projections add items/destination/food-ready and conditionally decrypted recipient; internal vault payloads never leave the server. Code/method/date filters execute in MySQL with cursor binding. The scoped summary endpoint counts matching statuses independently of the page and selected lane; it does not load all history into React. Ledger entries include public codes and the Admin correction form resolves a code within authorized ledger results before writing the existing ID-based operation.

Forward migration `20261024030000_order_codes` adds/backfills unique codes and validates completion/format without touching original IDs, snapshots, histories, payments or finance. CSPRNG codes are inserted atomically with the existing creation/key/history/audit transaction and retried on code uniqueness only, at most five attempts. SQL default supports pre-code INSERT clients. No retained/shared database, runtime credentials, live schema or VPS was changed.

The Figma connector returns Make source links but rejects session/screenshot operations for Make. The actual already-open Make preview was inspected through Chrome. Prototype customer names/counts/items are reference fixtures only; no static photo assets occur in this screen. Existing project icons are reused.

## Verification

Evidence is self-review, not independent acceptance, deployment or V1.0 readiness. All database changes below are restricted to newly created disposable databases in `hlf-v04-test-mysql-1` (Oracle MySQL9.2.0, loopback43316). Retained development MySQL3307/VPS were not changed. QR images use a separate synthetic MinIO bucket `owner-orders-evidence-20261024` on loopback43317. No database was reset or dropped.

- PASS: frontend lint and build/TypeScript; the existing bundle-size advisory above500kB remains. Backend lint,69unit tests,9HTTP E2E cases and build; Prisma validate/generate. HTTP E2E uses existing mocks; persistence claims come from the separate MySQL cases.
- PASS:18frontend unit cases across `orders.test.mjs`, `owner-orders.test.mjs` and `owner-dashboard.test.mjs`, covering polling/version merges, exact data, Vietnam dates and separate food-ready actions.
- PASS:4real-MySQL suites (`orders`, `fulfillment`, `payments`, `finance`) on `test_owner_orders_20261024_implementation`: actor/owner projection, code equality/replay, actual unique-index collision recovery inside a transaction, hidden contact before food-ready and disclosed contact after, same-account buyer/owner, filtered summaries/counts, rollback/races, QR/private images/refunds, signed finance and contract schemas. Expected injected failure500logs are part of rollback evidence.
- PASS: `test:order-code-upgrade` on fresh `test_owner_orders_upgrade_retry_20261024`:25pre-code orders preserve every original column and status history; codes are unique/valid, legacy INSERT defaults work, duplicate/invalid values fail real constraints. Initial harness fixture omitted required pickup-point `updated_at`; corrected and rerun against a different fresh target.
- PASS: `test:owner-orders` controlled-response Chrome: full counts despite paginated cards, Kanban/list, code/method/date filters, rejected orders, per-view pagination, the complete food-ready workflow, five viewport widths, drawer geometry/focus/keyboard/return, synchronous duplicate-write prevention, conflict reconciliation, stale/loading/empty/forbidden states and reduced motion. Evidence: `hlf-owner-orders-evidence-2TiEWw` under the host temporary directory. Desktop/mobile screenshots were visually reviewed against Make; icons are reused shared components, without external raster assets.
- PASS: `test:fulfillment` connected Chrome on `test_owner_orders_fulfillment_20261024`, real API/MySQL: buyer cancel, owner acceptance/privacy/food-ready/delivery/completion while unpaid, one base commission, separate cash confirmation and reasoned rejection, deactivated existing obligations and five widths. Evidence: `hlf-browser-evidence-OiCroz`.
- PASS: `test:tracking` connected Chrome on fresh `test_owner_orders_tracking_final_20261024`: native offline/hidden-tab pause/resume, bounded in-flight reads and delayed order/payment replies, terminal/payment polling, keyset history, reload and unchanged snapshots after hiding/deactivation. Evidence: `hlf-browser-evidence-VsI4Gn`. Harness assertions were updated for modal/card/public-code semantics and native Enter input; startup waits and CDP timeouts avoid indefinite test hangs.
- PASS: `test:payments` connected Chrome on fresh `test_owner_orders_payments_final_20261024`: cash baseline, owner/Admin QR configuration, QR checkout/claim without implicit receipt, cancelled-order late receipt, five widths, independent payment refresh, full refund with lost-response/reload/replay, disputes and cross-account private-proof denial. Evidence: `hlf-browser-evidence-FLIPMY`. Earlier missing-storage503and startup-wait failures were harness/environment gaps; the final run uses the dedicated synthetic MinIO bucket and real persisted uploads.
- PASS: changed documentation local links, Markdown line limits, script syntax and `git diff --check`.

## Reproduction and delivery boundary

From the repository root use `npm --prefix frontend run test:owner-orders-unit`, `npm --prefix frontend run test:owner-orders` and the existing connected `test:fulfillment`, `test:tracking`, `test:payments` scripts. Connected scripts share ports43127/43128/43129; run them sequentially and never overlap backend compilation. Set a fresh loopback `TEST_DATABASE_URL`, prepare it using the existing guarded `test:prepare`, and use the documented synthetic MinIO variables in [payment verification](../payments-local-verification.md).

For upgrade rehearsal create a new empty `test_*` database first, then run `TEST_DATABASE_URL=<synthetic target> npm --prefix backend run test:order-code-upgrade`. The script refuses nonempty targets. Code/schema/migration are ready for review; applying the migration to retained development or VPS data is NOT RUN and requires its separate backed-up adoption task.

## Subsequent local runtime repair

The user later reported500s on the retained local website and requested project-wide checks. [Local adoption and regression receipt](../local-runtime-order-code-repair.md) records the verified backup/restore/rehearsal, preserved original data, two applied migrations and actual signed-in owner dashboard/board observation. It supersedes the local NOT RUN boundary above for that repair only; VPS/production remains unperformed.
