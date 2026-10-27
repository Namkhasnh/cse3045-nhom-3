# Owner finance redesign — October 27, 2026

Authority: the user-approved implementation plan for the “Redesign finance reports dashboard” version in [Figma Make](https://www.figma.com/make/XymiDbnoGxZqEB2oY2bP45/Redesign-Restaurant-Detail-Page), [UI guide](ui_convertion.md#v07-finance-interface), [DEC-07](../finance-policy-proposal.md) and the [finance API](../data/api_contract.md#75-commission-and-settlement--v10-minimal-operations).

## Scope and visual reference

Only `/owner/finance` uses the new owner presentation. The shared header/sidebar and Admin finance rendering, commands, confirmation and recovery remain unchanged. The Figma connector supplies Make resource links but cannot render this file; the requested chat version, live preview and period drawer were inspected in the user's existing Chrome tab. Existing project SVG icons are reused. Prototype identities, amounts and dates are not production defaults or assets.

The page retains Be Vietnam Pro, cream canvas, orange accents and white bordered cards. It has four metrics, a month-range picker, report refresh, expandable commission explanation, monthly report table, filtered commission ledger, right-side detail dialog and delivery/collection activity disclosure. At mobile widths tables become labeled cards; the drawer fills the viewport. No new dependency or backend/schema change is introduced.

## Data and interaction contracts

- `FinancePage` routes the owner to `OwnerFinancePage`, keyed by actor and restaurant. The Admin branch retains its existing JSX and hooks. Styles use unique `of-*`/`owner-finance` selectors.
- Complete report snapshots are collected before publication. Continuation requests retain the signed cursor and identical filters; mismatched cutoffs, duplicate periods and missing/repeated cursors fail. Revenue sums all returned months with BigInt. No partially collected total is presented as complete.
- Revenue is labeled for the applied range; receivable, collected-after-reversal and signed outstanding values come directly from the account summary and are labeled for all periods. Negative credit is preserved. Zero-entry periods remain distinguishable from net-zero periods with facts.
- Month boundaries use Vietnam time. From/to must form an inclusive range of at most 120 months. The period search and twelve-row report pagination operate on the complete report snapshot.
- Ledger filters are explicit-submit and use existing `order_code` (full code), `period_start_at` and `assigned` server filters. Changing filters resets cursor navigation. Previous/next pages use cursor history; no fabricated total count or numeric last-page link is shown.
- Assignment badges describe statement membership, not payment. Period badges derive open, unfinalized, late-statement, late-collectible, settled and signed-credit labels from existing data/deadlines. There is no new settlement enum.
- Period details retain base, adjustment, voucher subsidy, receivable, collected and signed period balance. Assigned periods and ledger entries open current statement/receipt reads. Current statement values are explicitly distinguished from the report cutoff. Receipt reversals, replacement links and notes remain visible; owner evidence stays redacted by the API.
- Entry details do not infer completed date, dish subtotal or rate from a commission amount. Missing fields say “Chưa có dữ liệu”. Refresh/loading use a dash until a complete successful snapshot exists; failures never fabricate zero.
- Refresh retains same-scope last-good values with a stale warning. Initial errors, empty results and denied reads are distinct. Denied/account-conflict reads clear protected values. Abort signals, binding checks and component keys prevent late responses from replacing a new actor/restaurant's data.
- Native modal dialogs make the background inert. Close/Escape/backdrop, explicit focus wrapping/return, body scroll lock, independently scrolling content and persistent footer are included. Reduced motion removes drawer animation.

## Verification

Evidence is self-review and isolated frontend testing, not release or financial persistence acceptance. No retained or production data was modified.

- PASS: frontend lint, TypeScript/production build and `test:finance-unit` (five cases). The existing bundle-size advisory above 500 kB remains.
- The unit additions cover exact aggregate revenue above Number precision, complete snapshot traversal, cutoff/duplicate/cursor rejection, cancellation and open/late/zero/credit/collectible labels.
- PASS: `npm --prefix frontend run test:finance-ui` runs real headless Chrome with explicitly controlled API responses; its fixtures are isolated at the request boundary. It checks 360/390/768/1024/1440 px, report/ledger filters and pagination, signed credit, dialog/receipt history, keyboard focus, loading/stale/error/empty/denied states, incomplete snapshots, late old-account replies, Admin rendering, 200% zoom and reduced motion.
- NOT RUN: connected `test:finance` (actual Nest/HTTP/MySQL). This session has no `TEST_DATABASE_URL` configured. The existing owner selector is updated for the detail button; its Admin mutation and recovery assertions are unchanged. The script passes syntax validation. Database arithmetic, constraints and races are outside this UI-only evidence.
- PASS: final Chrome evidence `hlf-owner-finance-evidence-ZezH2n` in the host temporary directory. Desktop/mobile tables and period drawers were visually reviewed against the Make composition.
- PASS: changed documentation local paths/anchors, Markdown line limits, script syntax and `git diff --check`.
