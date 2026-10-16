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

Open the URL printed by Vite (normally `http://localhost:5173/`). The backend and MySQL are unnecessary for this preview. No API calls or secret environment variables are used.

## Fixture boundary and interactions

- `src/features/restaurants/fixtures/restaurants.fixture.ts` contains only fictional restaurants, dishes, hours, static availability and fixed-point delivery examples. Nothing is a real survey, live status, authoritative quote or production default.
- The persistent banner and per-card notes identify sample data. Local SVG illustrations are marked as illustrations; absent/broken images use a labeled fallback. One invalid image data URI intentionally exercises that fallback.
- Search uses trimmed, NFC-normalized, case-insensitive Vietnamese name prefixes, preserving diacritics. It does not establish the future server collation.
- Category and price must match the same visible dish. Sold-out visible dishes remain discoverable; hidden dishes and inactive restaurants are excluded. Price ranges are `< 30000`, inclusive `30000–50000`, and `> 50000` VND. Filters default to all values.
- IDs/money stay strings. Price comparisons and the shared VND formatter use BigInt. A null fee is unknown; `"0"` is a known sample zero fee.
- Cards and the fixed sample pickup point are read-only. The Student navigation identifies Home as current and disables Cart/Orders/Account with a visible explanation. There are no menus, authentication, cart, ordering, AI, reviews or fake mutation successes.

Development-only state URLs:

| URL suffix | Result |
| --- | --- |
| `/?demo_state=loading` | Persistent card skeletons with an accessible loading label |
| `/?demo_state=empty` | Empty dataset; applying filters shows the distinct no-match state |
| `/?demo_state=error` | Explicit simulated error; retry restores fixtures and preserves filters |

Every simulated state is labeled. Parameters are ignored in the production build. Normal fixture data and its labels remain in production; this build is still a preview.

## Component boundaries

- `App` composes `app/layouts/StudentLayout` and the restaurant feature through its `index.ts` public export. No router or server-state library is installed.
- `RestaurantListPage` owns local filters and development state selection; presentational components do not fetch.
- `RestaurantFilters` takes values, categories, `onChange`, `onReset` and `hasFilters`; `RestaurantCard` takes one read-only `RestaurantSummary`; `RestaurantList` takes status, results, `hasFilters`, `onReset` and `onRetry`.
- Types are internal fixture view models, not invented API DTOs. Backend integration will replace the fixture source through an approved feature hook/API layer.
- `shared/ui` contains generic Button, Input, FilterChip, Badge, Icon and ListState. The CSS theme is the single token source; Fontsource bundles the Vietnamese, Latin and extended Latin subsets for weights 400/500/600/700/800.

## Verification

Frontend unit/component/browser automation is **NOT CONFIGURED**; lint/build do not prove browser behavior. See the [discovery verification report](../docs/ui/student-discovery-verification.md) for actual checks and limitations.

Check widths 360, 390, 768 and 1024 px; search/filter combinations and reset; price boundaries; unknown versus zero fees; missing/broken images; simulated states and retry; long names; keyboard/focus; 200% zoom; reduced motion; no page horizontal scrolling or fixed navigation covering the final content. Other role layouts do not exist yet and cannot be browser-verified.
