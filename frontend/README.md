# Frontend — Auth, Public Discovery and Guest Cart

React/Vite/TypeScript, Tailwind 4 and self-hosted Be Vietnam Pro. Approved cream/orange identity and compact white discovery follow the [UI guide](../docs/ui/ui_convertion.md). This slice includes role-free signup, auth/profile, Admin MFA/recovery prompts and public restaurant/menu browsing. V0.2 adds a persistent non-sensitive guest cart. Checkout and management business screens remain later scope.

## Run and check

From the repository root:

```sh
npm --prefix frontend ci
npm --prefix frontend run dev
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run test:cart
npm --prefix frontend run test:smoke
```

Open `/` at the Vite origin. `/api` proxies to `http://127.0.0.1:3000` by default; `API_PROXY_TARGET` overrides the development proxy target, without exposing credentials to the browser. Auth requires matching backend `PUBLIC_ORIGIN`; production requires same-origin HTTPS. Backend secrets never belong in `VITE_*`.

## Routes and boundaries

- `/` and `/restaurants/:id` use real public catalog APIs independently of `/auth/me` loading/failure. Guests can search/filter, read availability and add eligible dishes. Menu images support missing/broken references.
- `/cart` is public; authenticated `/checkout` connects real cash ordering after the separately authorized schema adoption. Menu/header navigation includes cart quantities.
- `/login`, `/register`, `/verify-email` and `/account` use same-origin cookie auth/CSRF. Signup has no role field or promotion request. The browser checks repeated passwords and sends one password. Admin password verification leads to a restricted MFA challenge; recovery success explains the required protected re-enrollment.
- `/owner` and `/admin` are capability-gated landing shells. Managers keep buyer discovery/account navigation; backend capabilities/current ownership remain authoritative. `/admin/role-requests` is retired.
- `/preview` is DEV-only and retains explicitly labeled fictional restaurant/dish/survey fixtures. Its `demo_state=loading|empty|error` parameters simulate presentation states only. Main/production browsing imports no fixture data at runtime.
- `features/restaurants/api` owns DTOs/fetch/mapping; the feature hook owns cancellation, stale-response protection, filter reset, keyset pagination and retry. Presentational controls receive values/callbacks.

Public search is a trimmed name prefix under `utf8mb4_0900_ai_ci` (case/diacritic insensitive). Restaurant category and price must match the same visible dish. Visible sold-out dishes remain discoverable. Price bands are `<30000`, inclusive `30000–50000`, and `>50000` VND. Cards show the full visible price range, independent of active filters. IDs/money remain strings; fees and distances are never synthesized from fixtures. Unknown delivery fees remain unknown.

Discovery preserves border-separated rows, 80 px thumbnails below 1024 px / 96 px above, one/two columns and distinct manager/Admin shells. Menu rows use the same tokens with compact images/fallbacks and explicit availability. Loading, no-result, unpublished/missing menu, connection error, retry and load-more failure states keep useful input context.

## Guest cart boundary

`features/cart` owns versioned intent under `hlf.cart.v1`: restaurant ID/name and dish ID/name/quantity/accepted price only. IDs/VND stay strings; subtotal uses BigInt and is labeled an estimate. The parser rejects unknown/private fields, duplicate dishes, invalid versions/scalars and quantities above 99 per dish, 50 distinct dishes or 200 total portions. No server cart, quote, recipient, token, order key or recovery state exists here.

The app injects the public catalog client into the cart and passes callbacks to the menu. Switching restaurants requires a keyboard-accessible dialog; cancel/Escape retains the draft and restores focus. Repeated additions merge without silently accepting a new price. Reload/login/logout/account switch keep public intent; browser focus and login/route changes refresh catalog. Private account views clear while the session is checked again, without resetting anonymous login forms.

Price changes show old → current values and require explicit acceptance. Hidden/sold-out items remain in the draft with a warning; network errors preserve quantities and allow retry. Missing delivery fees remain unknown. `/cart` is an allowlisted login destination; no cart/login code sends an order or creates an idempotency key. Storage denial keeps an in-memory cart with a reload warning; corrupt storage is ignored safely.

`npm --prefix frontend run test:cart` runs Node 24 TypeScript-stripping tests for limits, exact totals, queued additions, restaurant consent, corrupt/private storage and safe return paths; the same check runs in frontend CI. No new dependency is required.

## Connected browser evidence

`npm --prefix frontend run test:connected` requires Chrome, a migrated disposable loopback MySQL 9.2.0 database in `TEST_DATABASE_URL`, and compiled backend tests (`npm --prefix backend run test:compile`). It starts a guarded real backend and Vite, seeds **only the disposable test database**, and exercises signup/email/login, manager buyer navigation, Admin TOTP/recovery and public discovery/menu. Only outbound SMTP/password-corpus calls are replaced by the test harness. It captures homepage/menu/cart screenshots at 360/390/768/1024/1440 px, checks keyboard/dialog focus and no horizontal overflow, and verifies guest login continuity without an order request. Real disposable DB changes exercise price/visibility/availability and expired sessions. Run it sequentially with smoke because they share the Vite port.

`test:smoke` is the smaller offline/public/DEV-preview/auth rendering check. Neither test proves production SMTP, password corpus availability, full accessibility, fulfillment or checkout. Current results and operator cutover prerequisites are in [implementation status](../docs/implementation-status.md) and the [cutover handoff](../docs/auth-discovery-cutover.md). Historical fixture observations remain in [the original report](../docs/ui/student-discovery-verification.md).

## V0.4 connected management

Owner settings/menu/delivery/commission and Admin partner activation/category/survey/rate pages are connected; guests retain public browsing/cart. Setup readiness never submits an order or turns receiving on automatically. Scripts test:settings, test:delivery, test:dishes and test:setup exercise actual local backend/MySQL flows with synthetic data; [V0.4 local guide](../docs/setup-local-verification.md) explains fixture boundaries and separate full-setup database/MFA quota. Production storage and retained-data adoption remain outside local acceptance.

## Local sample homepage

The explicitly authorized local DB sample and recovery procedure are documented in [local adoption](../docs/local-demo-adoption.md). `npm --prefix frontend run test:local-demo` checks the running localhost:5173 app read-only, including four actual DB dishes, five widths, menu links and controlled isolated-browser dish error/empty/pagination responses. `VITE_LOCAL_DEMO=true` in ignored `.env.local` enables a development notice; it is not an API data fallback.

## Cash ordering and recovery

`/checkout`, `/orders`, `/orders/:id` and `/owner/restaurants/:id/orders` use real order APIs. App composes cart/delivery/orders through feature exports. Account-scoped sessionStorage retains immutable checkout payload/key across timeout/reload/relogin within the tab; storage failure blocks transmission. Cookie/account binding is rechecked before mutation, and account switches abort/drop private responses. Guest localStorage never contains recipient/order keys.

One page-level query owner polls visible online order details/lists about5s, without overlap and with capped30s error backoff. Terminal details switch to separate payment reads while unpaid and stop when paid. Order/payment versions merge independently; stale responses cannot revert committed state. Explicit food-ready opens owner contact projection, independently of delivery/completion/cash. Server snapshots supply history after catalog edits.

`test:orders` covers durable storage and polling/version timing; `test:checkout`, `test:fulfillment`, `test:tracking` use actual isolated MySQL/Chrome. [Reproducible commands and retained-data boundary](../docs/cash-ordering-local-verification.md). No migration is automatically applied by frontend/build/start.

## V0.6 QR and direct-refund interface

`/owner/payments` submits/static-QR configuration and suspension; `/admin/payments` supplies MFA review and scoped payment-dispute lookup. Checkout offers QR only after approved configuration; each order shows its immutable payee/amount/reference, owner-verified receipts and independent full refund obligations. Buyer claims never mark paid; Admin cannot confirm funds. Protected payment requests/images bind current account and no-store API responses.

`npm --prefix frontend run test:payments` runs the real Chrome cash+QR journey on a new disposable DB; `PAYMENT_ASYNC_ONLY=true` selects the focused held-FileReader/account-switch check. Run only after backend compilation/preparation and sequentially with other browser scripts. [Reproduction and boundaries](../docs/payments-local-verification.md); [P21 evidence](../docs/progress/P21.md).

## V0.7 finance

`/owner/finance` reads own current restaurant ledger, signed account/period balances and receipt/reversal history; `/admin/settlements` and `/admin/reports` support approved manual reconciliation and reports. Rate-consent pages remain separate. Whole-month finalization, reasoned corrections and verified receipts require explicit confirmation; unknown creates reconcile unique month/entry membership, keyed writes recover the original intent and account-bound stale replies are dropped. `test:finance-unit` checks intent binding, exact signed VND and Vietnam month boundaries; `test:finance` uses actual Chrome/HTTP/MySQL with explicitly synthetic completed-order/base fixtures. [Reproducible commands, scope and retained-adoption limits](../docs/finance-local-verification.md).
