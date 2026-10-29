# Purchase history and single-restaurant cart/checkout

Authority: user's approved implementation plan and follow-up choices, [Figma Make](https://www.figma.com/make/xfAu5VZ9550JhtiOcKjCGA/Redesign-Notification-Experience), [requirements](../requirements.md), [API](../data/api_contract.md), [COD](../cod-ordering.md). This scoped extension brings forward US10 reorder; it does not accept a complete V1.1 milestone.

## October29, 2026 approved revision

The user's new instruction supersedes the October25 grouped-cart and new multi-order checkout behavior below. Current behavior follows [requirements](../requirements.md#october25-purchase-extension-and-october29-single-restaurant-revision): one restaurant per cart, automatic atomic replacement only after a valid addition/reorder from another restaurant, and one order per new confirmation. Browsing alone preserves the cart. Same-restaurant additions merge quantities and preserve accepted prices. The bottom cart and its drawer show all current dishes, quantities and totals across navigation/reload. New dishes remain unselected until the buyer checks them in the cart.

Persisted v2 grouped carts are validated then reduced to their last stored restaurant and that restaurant's selected IDs; there is no historical last-edited timestamp. A stale grouped checkout fingerprint cannot authorize a new order. Failed/ineligible additions preserve the previous cart; replacement clears removal undo and clamps transient addition state. Old account-scoped uncertain multi-order requests/results retain their payloads/keys and recovery; no backend API/schema change is needed.

## October29 verification

Self-review; local source only, no deployment or real order mutation.

- PASS: `npm --prefix frontend run lint`; `npm --prefix frontend run build` (existing large-chunk advisory).
- PASS: `npm --prefix frontend run test:basket` (8 cases) and `npm --prefix frontend run test:cart` (7 legacy primitive cases). The basket suite owns current replacement semantics; the old reducer switch-confirmation test covers an unused legacy primitive, not the live cart hook.
- PASS: `npm --prefix frontend run test:purchase`, controlled-response real Chrome at360/768/1440px: reorder replaces the old restaurant; single-group cart/checkout; voucher; one POST per confirmation/double-submit; unknown-result same-key recovery/reload; explicit price conflict/new key; blocked writes on persistence failure; stale grouped handoff invalidation; v1 migration/history states. Evidence: system temporary directory `hlf-purchase-evidence-DoaHAF`; mobile checkout screenshot inspected.
- PASS: `npm --prefix frontend run test:storefront`, controlled-response real Chrome: full bottom-cart/drawer, navigation/reload retention, adding at another restaurant replaces old quantities, responsive menu, focus/Escape, price consent, unavailable states, reduced motion and zoom. Evidence: system temporary directory `hlf-storefront-evidence-H3Lgzv`.
- PASS: changed Markdown local link paths and line limits; `git diff --check`; browser script syntax. Initial build/browser attempts failed because macOS dataless dependency files timed out; `npm --prefix frontend ci` restored exact locked dependencies before successful reruns. No manifest/lockfile changes.
- Backend/MySQL suites: NOT RUN; no backend/schema change. Browser evidence uses controlled API responses and does not establish live backend order creation or production readiness.

## Historical October25 behavior (superseded where stated above)

- `/orders` uses the existing personal workspace, Be Vietnam Pro and semantic cream/orange identity. Status tabs with server counts, code/current restaurant-name search, payment status, newest/oldest sort and inclusive Vietnam calendar dates refine a cursor-paginated list. Counts apply search/date/payment filters, ignoring selected status/cursor.
- Cards show current restaurant label, immutable order code, time, fulfillment, two snapshot item rows with expand, independent payment and exact totals. A card link and its detail/tracking action open the existing `/orders/:id`; reorder and expand remain separate keyboard controls. Rejected and buyer-cancelled orders remain distinct.
- Historical item images are not stored. Following the user’s image follow-up, cards resolve current public dish images and restaurant covers through the app catalog adapter, cached per account view to deduplicate reads. Tooltip/alt copy identifies current imagery; names/prices remain snapshots. Missing, private or broken images fall back to bowls/initials. No fictional wallet, ETA, ratings or prototype order rows enter production.
- Reorder is available for terminal own orders to active buyers. It fetches authorized detail and current public restaurant/dishes, adds eligible items with current prices, and reports unavailable/unreadable items. One local batch update either adds all eligible items or preserves the prior basket on limit failure. Existing accepted prices are preserved when merging an already-present dish; later explicit consent handles changes. New items start unselected; reorder never submits an order.
- Guest/non-sensitive cart storage v2 contains restaurant groups and selected dish IDs. Legacy v1 cart migrates with all existing items selected. New additions are unselected. Same-dish additions merge quantities; different restaurants are retained. Limits remain 50 distinct dishes, 200 portions globally, 99 per dish. Selection, quantity, removal, five-second undo and drawer apply across groups.
- One checkout can submit multiple selected restaurants to a common surveyed pickup point. Each restaurant has an independent server quote, optional owner voucher, item subtotal, delivery fee, discount and COD order. Unknown fees are never zero. Unselected/unavailable dishes do not block other selected groups. Every selected group must validate before starting the batch.
- Each child uses the existing single-restaurant order endpoint and a separate key/payload. Persist the whole account-scoped batch before sending; persist unknown before each request. Requests are sent sequentially, but all are authorized by one explicit confirmation. Each result is shown separately; a failed restaurant never cancels successful orders.
- Confirmed results and consumed request keys prevent duplicate cart deduction on refresh/replay. Only submitted quantities are deducted; unselected items, other groups and subsequent additions remain. Unknown results must retry the same key/payload; explicit price/fee reconfirmation replaces only the rejected child's key. No auto-retry with new consent.
- Legacy uncertain checkout v1 imports unchanged and takes priority over a new selection. Account-scoped session recovery and private results do not enter guest local storage. Invalid saved state is retained with a blocking recovery message.

## Integration

Orders feature owns list cards/filter UI; app composes reorder with catalog and cart through public exports. Cart owns non-sensitive intent and consumption; app hooks coordinate delivery and per-restaurant preview/create. No backend order-state, settlement or financial transaction changes; no database migration.

Current browser assertions use automatic single-restaurant replacement. The evidence below records the historical October25 grouped behavior; it does not prove the October29 revision.


## Verification evidence

Self-review only; no deployment or milestone acceptance is implied.

- PASS: frontend lint/build; build retains the existing large-bundle advisory. `test:cart` (7 legacy model/migration cases), `test:orders` (13), `test:basket` (5 new grouped-cart/recovery cases).
- PASS: backend lint, build, unit suite (76) and HTTP E2E (9). Builds/tests were run sequentially after correcting overlapping Prisma generation during an initial attempt.
- PASS: updated real-MySQL9.2.0 orders integration in new synthetic database `test_purchase_20261025_a`. Includes literal search, filtered counts independent of selected lane, cursor/filter binding, cross-buyer isolation, snapshot item projection/schema and absent private fields, plus existing idempotency/rollback/race cases. Synthetic injected500 responses are expected assertions.
- PASS: configured `test:delivery` on new synthetic database `test_purchase_delivery_a`: Admin point, owner survey proposal, MFA approval, actual zero fee/unknown fee and five widths. `test:buyer-order` controlled-response Chrome regression covers existing detail/cancellation/legacy payment states.
- Browser observation: reloaded the actual local `/orders` page read-only and visually confirmed current dish photographs. Public local restaurant4 has a null cover; its initials are the intentional fallback. No actual local order was submitted or transitioned.
- Documentation local paths, Markdown line limits and `git diff --check` pass. Broader unrelated suites are NOT RUN. Controlled-response browser checks establish frontend behavior; real-MySQL evidence establishes only the cases listed above.

- PASS: updated `test:checkout` on fresh synthetic database `test_purchase_checkout_final2`, with real auth/API/MySQL: voucher creation/retired platform codes, profile/point handoff, five widths, apply/remove/error, explicit price/fee reconfirmation, native repeated-click guard, success focus, lost-response same-key replay, COD/zero payment, tracking/history/explore. Evidence: `/private/tmp/purchase-checkout-browser.log`; screenshots `hlf-browser-evidence-Dhhzmd` in the system temporary directory. Earlier attempts exposed obsolete selectors, input clearing and click-through; these were corrected. A reused fixture hit the expected MFA challenge limit, so the final run used a new database rather than weakening authentication.

- PASS: `test:purchase` controlled-response Chrome final run at360/768/1440px. Tests current restaurant/dish image loading and broken-image fallback, cards/search/expand, direct reorder/unavailable items, grouped checkbox cart, independent fees/voucher, unknown/rejected partial outcomes, explicit new-key reconfirmation, two successes, duplicate-submit/persistence guards, v1 migration, loading/error and private-data clearing. Log: `/private/tmp/purchase-browser.log`; visually inspected responsive screenshots; final artifacts `hlf-purchase-evidence-dONibG` in the system temporary directory. The pre-existing standalone `test:cart-browser` switch-restaurant assertions are NOT RUN for the superseding grouped-cart flow; the new suite exercises its replacement behavior.
