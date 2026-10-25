# Owner menu redesign — October 24, 2026

Authority: the user-approved implementation plan for [Figma Make](https://www.figma.com/make/xfAu5VZ9550JhtiOcKjCGA/Redesign-Notification-Experience?preview-route=%2Fowner%2Fsettings), [UI guide](ui_convertion.md), requirements US11/AC15 and the [V0.4 dish/media contract](../restaurant-setup-v04-contract.md#p13-enabled-interfaces). The user clarified that the requested page is **menu management**, not order management. The Make preview at the supplied settings URL currently renders the menu design.

## Design and implementation

`/owner/menu` now uses the existing owner workspace with a cream canvas, white rounded cards, four status summaries, compact search/category/status/sort controls, grid/list views and an accessible modal editor anchored to the right. The editor fills the mobile viewport; its scrollable body keeps the footer actions visible. Existing Be Vietnam Pro, semantic color tokens, header/sidebar and public storefront remain intact.

The Figma connector returns source resource links for Make, but its session and screenshot tools explicitly reject this file type. The actual Make preview was inspected through the user's Chrome session. Prototype food photographs, identities, counts and prices are not application assets or production defaults. Existing project icons and generated media references are reused; unavailable private/hidden images have an explicit fallback rather than an invented preview endpoint.

- `OwnerMenuPage` composes the feature; `use-owner-menu` owns list/category reads and cancellation. `menu-model` owns derived status counts, accent-insensitive Vietnamese name search and exact-money sorting. `MenuToolbar`, `MenuDishCard` and `DishEditor` own presentation and interaction.
- Summary counts traverse every returned page before publishing. Selling means visible and available; sold out means visible and unavailable; hidden takes precedence regardless of availability. Filtered result count is separate from the full-menu summary. Repeated/missing continuation cursors fail rather than publishing incomplete data.
- Default view is grid, default sort is Vietnamese name with numeric ID tie-break. Search, category and status filters combine locally across the complete menu. Price sort uses BigInt without converting IDs or money to Number. View/filters last for the mounted page only.
- Images and names come from actual API data. Empty/missing/broken images retain the correct geometry. Image zoom, card hover, switch transitions, feedback and drawer entry use 180–260 ms CSS motion. Reduced motion disables animations/transitions and hover transforms.
- At 360/390 px the grid is single-column, tablet uses two columns, desktop three, and wide content four. List view uses compact horizontal cards. Filters wrap and all fields/actions retain keyboard access.

## Existing interfaces and mutation safety

No backend, persistence, REST DTO or authorization changes. `dishesApi.categories` adds an optional AbortSignal; menu list/category traversal supports cancellation and invalid-cursor detection. Components remain inside the dishes feature, with existing public exports and shared Button/Input/Icon/Photo/ConfirmDialog.

- Create retains the existing account-scoped durable command and exact key/body recovery after uncertain responses, including page reload recovery. While pending, a recovery action is available inside the modal, or in the page when the modal is absent. New create intent is blocked until the pending intent resolves.
- PATCH includes `expected_version`. Quick availability and hide/show controls update only after confirmation; a synchronous lock prevents duplicate writes. Failed/uncertain quick writes reload the menu before another write. If reconciliation fails, writes stay blocked until a successful refresh.
- Edit conflicts/uncertain results retain the draft, read the current dish and require an explicit review action before using its newer version. Another conflict returns to review. Create/patch success is reported separately from a subsequent failed list refresh.
- Form fields retain existing limits: name 200 code points, description 2,000 code points/8,000 UTF-8 bytes, integer VND string 0–1,000,000,000 and existing category. Inline errors associate with fields and focus the first invalid control. Backend validation remains authoritative.
- JPEG/PNG files are checked before upload for size, dimensions and decodeability. Selection/drop supports preview, replace and removal; stale image decodes cannot replace newer selections. Successful upload references are retained through failed dish saves, preventing redundant uploads on deliberate retry. Object URLs are revoked when replaced/unmounted.
- Delete uses the existing confirmation and reports the actual returned `deleted` or `hidden` outcome. It does not infer history from the card or add destructive capabilities.
- Refresh keeps last-good data with a stale warning. Initial loading, initial failure, empty menu and filter-no-match have distinct presentations. Protected read errors clear lists/categories and close protected presentations; actor/restaurant changes remount the feature and abort old reads.
- Native modal semantics provide inert background; explicit Tab/Shift+Tab wrapping, Escape/backdrop handling, body scroll lock and focus return are included. Dirty close/navigation asks before discarding; beforeunload protects drafts. Pending saves cannot be dismissed or duplicated.

## Verification

Evidence is self-review, not independent acceptance or deployment. Tests use isolated Chrome profiles; no development or production database was reset or changed.

- PASS: `npm --prefix frontend run lint`, without warnings, and frontend build/TypeScript. The existing bundle-size advisory above 500 kB remains.
- PASS: `npm --prefix frontend run test:menu-unit` — four cases covering exclusive state groups, combined Vietnamese search/filters, exact large-price/numeric-ID sorting and field constraints.
- PASS: `npm --prefix frontend run test:dishes` — actual Nest/MySQL/MinIO create/edit/upload, lost-response same-key recovery with SQL duplicate assertion, sold-out edit, public sanitized image, confirmed unused-dish deletion and five viewport widths. Final connected evidence: `hlf-browser-evidence-mXuWJr` in the host temporary directory.
- PASS: `npm --prefix frontend run test:menu` — controlled-response real Chrome: pagination/counts, search/filters/sorts, grid/list/editor at 360/390/768/1024/1440 px, field errors/focus, dirty close/Escape, keyboard wrapping/return, upload retention, duplicate prevention, exact-key/body recovery, broken-image fallback, version review, quick writes, returned hidden deletion outcome, stale/retry, empty/loading/initial error/forbidden, zoom 200% (including drawer viewport bounds) and reduced motion. Final evidence: `hlf-owner-menu-evidence-kXQREg` in the host temporary directory. Desktop/mobile grid/list/editor and zoom screenshots were visually reviewed against the Make composition.
- PASS: `npm --prefix frontend run test:storefront` — controlled-response public storefront/cart and owner-profile regression; evidence `hlf-storefront-evidence-r1j4db`.
- Connected test target: new `test_menu_figma_20261024` in the existing dedicated `hlf-v04-test-mysql-1` (Oracle MySQL 9.2.0, loopback 43316), with existing private test MinIO on 43317. Only existing migrations/bootstrap were applied to that new empty test database. Backend test compilation prepared the current browser harness; this is not backend-suite or migration acceptance.
- PASS: changed documentation local paths, owning anchor/navigation, Markdown line limits and `git diff --check`.
- The existing setup/checkout/tracking/fulfillment/payment browser scripts now explicitly open the dish editor before filling it. Their unrelated full business journeys are NOT RUN for this frontend task; syntax checks pass.

Known boundary: the existing public dish-media endpoint intentionally hides images for hidden dishes or nonpublic restaurants. The UI shows its image fallback in those cases. Adding a protected stored-image preview endpoint is outside this frontend-only scope. Uncertain create recovery remains sessionStorage-based under the pre-existing command contract.
