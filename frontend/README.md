# Frontend — Auth and Public Discovery

React/Vite/TypeScript, Tailwind 4 and self-hosted Be Vietnam Pro. Approved cream/orange identity and compact white discovery follow the [UI guide](../docs/ui/ui_convertion.md). This slice includes role-free signup, auth/profile, Admin MFA/recovery prompts and public restaurant/menu browsing. Cart, checkout and management business screens remain outside this slice.

## Run and check

From the repository root:

```sh
npm --prefix frontend ci
npm --prefix frontend run dev
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run test:smoke
```

Open `/` at the Vite origin. `/api` proxies to `http://127.0.0.1:3000` by default; `API_PROXY_TARGET` overrides the development proxy target, without exposing credentials to the browser. Auth requires matching backend `PUBLIC_ORIGIN`; production requires same-origin HTTPS. Backend secrets never belong in `VITE_*`.

## Routes and boundaries

- `/` and `/restaurants/:id` use real public catalog APIs independently of `/auth/me` loading/failure. Guests can search/filter and read menu availability; no unavailable cart/checkout action is exposed.
- `/login`, `/register`, `/verify-email` and `/account` use same-origin cookie auth/CSRF. Signup has no role field or promotion request. The browser checks repeated passwords and sends one password. Admin password verification leads to a restricted MFA challenge; recovery success explains the required protected re-enrollment.
- `/owner` and `/admin` are capability-gated landing shells. Managers keep buyer discovery/account navigation; backend capabilities/current ownership remain authoritative. `/admin/role-requests` is retired.
- `/preview` is DEV-only and retains explicitly labeled fictional restaurant/dish/survey fixtures. Its `demo_state=loading|empty|error` parameters simulate presentation states only. Main/production browsing imports no fixture data at runtime.
- `features/restaurants/api` owns DTOs/fetch/mapping; the feature hook owns cancellation, stale-response protection, filter reset, keyset pagination and retry. Presentational controls receive values/callbacks.

Public search is a trimmed name prefix under `utf8mb4_0900_ai_ci` (case/diacritic insensitive). Restaurant category and price must match the same visible dish. Visible sold-out dishes remain discoverable. Price bands are `<30000`, inclusive `30000–50000`, and `>50000` VND. Cards show the full visible price range, independent of active filters. IDs/money remain strings; fees and distances are never synthesized from fixtures. Unknown delivery fees remain unknown.

Discovery preserves border-separated rows, 80 px thumbnails below 1024 px / 96 px above, one/two columns and distinct manager/Admin shells. Menu rows use the same tokens with a content-only layout. Loading, no-result, unpublished/missing menu, connection error, retry and load-more failure states keep useful input context.

## Connected browser evidence

`npm --prefix frontend run test:connected` requires Chrome, a migrated disposable loopback MySQL 9.2.0 database in `TEST_DATABASE_URL`, and compiled backend tests (`npm --prefix backend run test:compile`). It starts a guarded real backend and Vite, seeds **only the disposable test database**, and exercises signup/email/login, manager buyer navigation, Admin TOTP/recovery and public discovery/menu. Only outbound SMTP/password-corpus calls are replaced by the test harness. It captures 360/1440 px screenshots and checks keyboard focus/no horizontal overflow.

`test:smoke` is the smaller offline/public/DEV-preview/auth rendering check. Neither test proves production SMTP, password corpus availability, full accessibility, fulfillment or checkout. Current results and operator cutover prerequisites are in [implementation status](../docs/implementation-status.md) and the [cutover handoff](../docs/auth-discovery-cutover.md). Historical fixture observations remain in [the original report](../docs/ui/student-discovery-verification.md).
