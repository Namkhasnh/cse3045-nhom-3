# Frontend

Vite + React + TypeScript + Tailwind CSS 4. Student discovery preview for US02/US03, FR02 and NFR06, following boards 00, 01 and 06 in the [UI reference](../docs/ui/Hoa%20Lac%20Food%20Ordering%20Platform.html) and [conversion guide](../docs/ui/ui_convertion.md). This covers presentation only, not completed MVP business behavior.

## Run and check

Use Node.js 24 and npm. From the repository root:

```sh
npm --prefix frontend ci
npm --prefix frontend run dev
npm --prefix frontend run lint
npm --prefix frontend run build
```

Open `/login` at the Vite URL (normally `http://localhost:5173/login`). Vite proxies `/api` to `127.0.0.1:3000`; the backend must be running with auth keys and `PUBLIC_ORIGIN` matching the browser origin. Production requires same-origin HTTPS. `/preview` is development-only and displays restaurant fixtures without backend access. No backend secrets belong in `VITE_*`.

## Approved compact Student list

Direction 1 was approved on October 16, 2026; see [UI §5.6](../docs/ui/ui_convertion.md#56-approved-student-discovery-revision--october-16-2026). White Student surface, one page title/pickup line, unframed filters and border-separated horizontal rows replace the previous large image cards. Thumbnails are 80 px below 1024 px and 96 px from 1024 px; the list has one column below that breakpoint and two above it. Owner/Admin identity is unchanged.

Search/category semantics are unchanged. Price uses a labeled native select. Each row displays the min/max price across all visible catalog dishes, including sold-out dishes and excluding hidden dishes, independent of active filters. Single-price catalogs show one amount; empty visible catalogs show “Chưa có giá món”. The feature formatter compares with BigInt and reuses shared VND formatting; it never computes order prices or delivery fees.

## Fixture boundary and interactions

- `src/features/restaurants/fixtures/restaurants.fixture.ts` contains only fictional restaurants, dishes, hours, static availability and fixed-point delivery examples. Nothing is a real survey, live status, authoritative quote or production default.
- The persistent banner and per-card notes identify sample data. Local SVG illustrations are marked as illustrations; absent/broken images use a labeled fallback. One invalid image data URI intentionally exercises that fallback.
- Search uses trimmed, NFC-normalized, case-insensitive Vietnamese name prefixes, preserving diacritics. It does not establish the future server collation.
- Category and price must match the same visible dish. Sold-out visible dishes remain discoverable; hidden dishes and inactive restaurants are excluded. Price ranges are `< 30000`, inclusive `30000–50000`, and `> 50000` VND. Filters default to all values.
- IDs/money stay strings. Price comparisons and the shared VND formatter use BigInt. A null fee is unknown; `"0"` is a known sample zero fee.
- Cards and the fixed sample pickup point are read-only. The Student navigation enables Account and keeps Cart/Orders disabled. Auth/profile actions use the backend; there are no connected menus, cart, ordering, AI, reviews or fake mutation successes.

Development-only state URLs:

| URL suffix | Result |
| --- | --- |
| `/preview?demo_state=loading` | Persistent horizontal-row skeletons with an accessible loading label |
| `/preview?demo_state=empty` | Empty dataset; applying filters shows the distinct no-match state |
| `/preview?demo_state=error` | Explicit simulated error; retry restores fixtures and preserves filters |

Every simulated state is labeled. `/preview` and these parameters are absent from production routing. The authenticated Student home still labels its restaurant fixture data until discovery is connected.

## Component boundaries

- `App` routes `/login`, `/register`, `/verify-email`, `/`, `/account`, `/owner`, `/admin`, `/admin/role-requests` and development-only `/preview`. It calls `/auth/me` on load for real routes, keeps session state only in memory and redirects by current role; the backend remains authoritative for permissions. `/preview` skips the session request and can run with the backend stopped. Student, Owner and Admin layouts have distinct navigation. No routing dependency or browser token storage is used.
- `features/auth` owns same-origin requests, cookie CSRF forwarding, forms and profile updates. Successful registration goes to login; protected routes wait for `/auth/me`. Owner/Admin landing pages explain that their business features are not connected yet.
- Registration requires an email, requested role and repeated password. The browser checks matching passwords before sending one password to the API. The backend sends a six-digit verification code; `/verify-email` confirms it before login. Owner/Admin applicants remain Student until an Admin reviews `/admin/role-requests`. Use the Vite origin that exactly matches the backend's `PUBLIC_ORIGIN`.
- `RestaurantListPage` owns local filters and development state selection; presentational components do not fetch.
- `RestaurantFilters` takes values, categories, `onChange`, `onReset` and `hasFilters`; `RestaurantCard` takes one read-only `RestaurantSummary`; `RestaurantList` takes status, results, `hasFilters`, `onReset` and `onRetry`.
- Types are internal fixture view models, not invented API DTOs. Backend integration will replace the fixture source through an approved feature hook/API layer.
- `shared/ui` contains generic Button, Input, FilterChip, Badge, Icon and ListState. The CSS theme is the single token source; Fontsource bundles the Vietnamese, Latin and extended Latin subsets for weights 400/500/600/700/800.

## Verification

A narrow headless Chrome fixture smoke check is configured: `npm --prefix frontend run test:smoke` (or set `BROWSER_BIN`). It verifies rendering at 360 px; unit/component, connected browser journey and accessibility automation remain **NOT CONFIGURED**. Lint/build do not prove browser behavior. See the [discovery verification report](../docs/ui/student-discovery-verification.md) for actual checks and limitations.

Check widths 360, 390, 768, 1024 and 1440 px; auth/profile forms, role navigation, keyboard/focus, 200% zoom and no horizontal scrolling. The existing fixture smoke checks `/preview` at 360 px; connected auth browser E2E remains **NOT CONFIGURED**.
