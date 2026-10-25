# Buyer order details redesign — October 25, 2026

Authority: user-approved implementation plan for `/orders/:id`, referencing the visible [Figma Make preview](https://www.figma.com/make/xfAu5VZ9550JhtiOcKjCGA/Redesign-Notification-Experience?preview-route=%2Fowner%2Fsettings%23explore), [UI guide](ui_convertion.md), [order API](../data/api_contract.md) and [COD policy](../cod-ordering.md). The Make URL names owner settings, but its current preview displays buyer order details; the user explicitly confirmed `/orders/13` as the target.

## Composition and integration

`BuyerOrderDetail` in the orders feature supplies the buyer-only composition. `OrderPage` retains one existing `useOrder` instance and selects buyer presentation or the existing owner `OrderDetail`; owner commands, projection and drawer remain intact. No backend, API, schema, permission, historical snapshot or payment-state changes.

- Existing account header/sidebar, Be Vietnam Pro, semantic cream/orange tokens and shared controls remain. Desktop uses main content plus payment/restaurant/support sidebar; tablet reflows cards; mobile uses one column and vertical progress.
- Hero contains creation time, actual status, refresh and copyable public order code. Clipboard failure gives honest feedback and leaves the code selectable. Shared transient feedback never creates inbox records.
- Four stages map pending/accepted/delivering/completed to Vietnamese labels. Timestamps come only from matching history events, with a dash for missing events. Completion finishes all four stages; cancelled/rejected replace the tracker with a separate result/reason panel. Food-ready stays a separate server milestone.
- Dish names, quantities, unit/line totals, recipient, point and history use order snapshots. No dish-image field exists in the order DTO: shared bowl placeholders are intentional, not fixture photographs. Missing restaurant name/history/recipient is stated explicitly. No ETA, map or driver is fabricated.
- Financial summary retains string money and `formatVnd`, including discount/voucher snapshots. COD says payment is arranged externally and not tracked; zero-payment orders say no payment required. Completed fulfillment never implies paid. Existing QR instruction/refund/dispute rendering stays in the injected payment slot.
- Support links preserve the order ID. Pending-only buyer cancellation uses the existing server command, safe initial dialog focus, Escape/focus restoration, pending guard and conflict refresh. Stale/offline/conflicted state disables cancellation; forbidden reads clear private content. Refresh failures preserve known data with a warning.
- Scoped CSS supports 360px, keyboard focus, loading skeletons and reduced motion. It does not restyle owner details. No static images were downloaded from Make or added as screenshot assets.

## Verification

Evidence is self-review, not independent acceptance or production release.

- PASS: `npm --prefix frontend run lint` without warnings; `npm --prefix frontend run build` including TypeScript. Existing bundle-size advisory remains; build also reported non-failing bundler timing diagnostics.
- PASS: `npm --prefix frontend run test:orders` — 13 cases, including exact intent/money, stale version merging, polling and the new progression/terminal-state case.
- PASS: `npm --prefix frontend run test:buyer-order` — real headless Chrome with controlled API responses. Covers 360/768/1440px with no horizontal overflow, all six fulfillment states, exact totals/discount, zero COD, historical cash/QR slot, missing fields/history, copy success/failure, dialog keyboard/focus, single cancellation despite repeated click, acceptance/cancellation conflict, initial loading/error, stale-data refresh, offline/recovery and forbidden-data clearing. Log: `/private/tmp/hlf-buyer-order-browser.log`; screenshots: `hlf-buyer-order-evidence-10hgbk` in the system temporary directory. Desktop and mobile screenshots visually inspected against the Make composition.
- PASS: `npm --prefix frontend run test:owner-orders` — existing controlled-response Chrome regression: board/list, counts, filtering/pagination, privacy/food-ready, fulfillment commands, five widths, drawer focus, duplicate prevention, stale/empty/forbidden/loading and reduced motion. Log: `/private/tmp/hlf-buyer-owner-regression.log`; screenshots: `hlf-owner-orders-evidence-wRcdfB` in the system temporary directory.
- Browser observation: existing Edge session at `http://localhost:5173/orders/13` renders the redesign with actual local data, real restaurant name and total. Read-only observation; no real order was cancelled or transitioned.
- PASS: local documentation links/line limits and `git diff --check`.

The buyer browser fixtures establish frontend behavior, not backend atomicity, real cancellation races or real bank/refund outcomes. QR integration is retained and rendered; full connected historical payment/refund journeys and backend suites are NOT RUN for this frontend-only task. Buyer reduced-motion behavior is established by scoped CSS inspection; the owner regression checks its own reduced-motion path. No retained-data mutation or deployment.
