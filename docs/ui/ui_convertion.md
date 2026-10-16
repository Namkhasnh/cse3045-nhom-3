# UI Conversion & Design Consistency — Hòa Lạc Food
> **File name:** [ui_convertion.md](ui_convertion.md) — keep the exact requested name.
> **Purpose:** guide AI assistants and developers in converting the reference HTML UI into a production-usable React application while preserving the same design language when adding pages, states, or features.
> **Document scope:** UI conversion and extension standards; this document does not claim that the frontend, backend, or listed features have already been implemented.
## 1. Mandatory Instructions for AI
Before every UI change, read this document, the relevant business requirements, and the corresponding design board in the HTML. Treat the task as a **conversion of an existing design**, not as a request to redesign the product.
1. Preserve the colors, typography, text hierarchy, shapes, role-based layouts, and tone of the original interface.
2. Reuse existing layouts, tokens, and components. If they do not exist yet, establish the shared foundation before scaling to more screens.
3. Build new pages by composing the closest existing patterns; do not create a different visual style for each feature.
4. The HTML defines the visual reference; [requirements.md](../requirements.md) defines business behavior. Do not copy mock content that violates business rules.
5. Preserve Vite + React + TypeScript + Tailwind CSS and the frontend boundaries defined in [architecture.md](../architecture.md).
6. Demo data, prices, fees, accounts, QR codes, metrics, and timestamps in the HTML are not production data.
7. Do not assume that a button shown in the design means the feature is approved for production. Determine whether it belongs to MVP, post-MVP, or Could scope.
8. Every screen must support appropriate loading, empty, error, and interaction states; do not implement only the ideal state.
9. Do not change business flows, states, APIs, or schemas for UI convenience.
10. When finished, clearly report which screens/components changed, how to verify them, which parts still use fixtures, and any intentional differences from the HTML.
The root AGENTS.md routes all frontend changes to this guide and the relevant design board in `docs/ui/Hoa Lac Food Ordering Platform.html`. Keep that routing instruction synchronized when moving or renaming a UI document. A standalone Markdown file does not automatically enter every AI tool’s context.
## 2. Reference Sources and Conflict Resolution
The paths below are relative to the repository root `cse3045-nhom-3`:
| Source | What it decides |
| --- | --- |
| [docs/requirements.md](../requirements.md) | Roles, scope, user stories, business rules, and acceptance criteria |
| [docs/architecture.md](../architecture.md) | Stack, feature structure, frontend/backend responsibilities, polling, and state coordination |
| [docs/data/database.md](../data/database.md) | Enums, data relationships, snapshots, money, history, and delete/deactivate rules |
| `docs/ui/Hoa Lac Food Ordering Platform.html` | Design system, layouts, components, and state appearance |
| [docs/ui/ui_convertion.md](ui_convertion.md) | Conversion rules, normalization of design differences, and consistent extension |
| Current API contract and source code, if available | Endpoints, DTOs, backend capabilities, and components that actually exist |
**Resolution order:** use requirements for business behavior, architecture for technical boundaries, and database documentation for data semantics. Use the HTML for design after applying the corrections in §10. If business sources still conflict, document the conflict and request a decision for the affected part while continuing independent work. Do not silently resolve a conflict by inventing a new field or enum.
The dimensions, colors, and typography marked as “original” below are extracted from the HTML content/CSS. Breakpoints, page routes, and application rules that are not defined by the HTML are marked as **conversion conventions/proposals**, not as current code behavior.
## 3. Product Context AI Must Preserve
Hòa Lạc Food helps students discover restaurants, browse dishes, receive AI recommendations, place orders, and track food delivery in the Hòa Lạc area. The MVP is initially deployed at Vietnam Japan University (VJU).
- Three roles: `student`, `restaurant_owner`, and `admin`. There is no delivery-driver account.
- Restaurants deliver orders themselves; students pay restaurants directly. The platform tracks commission and supports manual settlement/reconciliation.
- One order and one cart belong to exactly one restaurant. One restaurant owner may manage multiple restaurants; each restaurant has one responsible owner account.
- The frontend presents data, keeps drafts, and submits user intent. The backend determines final prices/fees, authorization, state transitions, and financial data.
- AI recommendations may reference only real, currently available, deliverable dishes. AI does not create orders or determine authoritative monetary values.
| Scope | UI handling |
| --- | --- |
| MVP | Login/register, restaurant/dish discovery, cart, fixed pickup points with surveyed fees, cash payment, order creation/tracking, restaurant order handling, dish/restaurant CRUD, AI recommendations, minimal manual reconciliation |
| Post-MVP | Free-form addresses/map pins, route-based fees, QR/refund transfer flows, extended reporting |
| Should | Random food selection, order history/reorder, order-linked support requests |
| Could | Reviews and favorites; enable only after data design and backend support exist |
| Out of scope | Multi-restaurant cart, driver assignment, payment splitting/automatic commission collection, storing AI conversations |
All mock design boards may be converted into previews for visual comparison, but production routes and menus should expose only features included in the current delivery scope and backed by real behavior. Do not leave fake buttons or fake success messages in real user flows.
## 4. Understanding the HTML Structure Before Conversion
The source file is a **packaged collection of design boards**, not a normal application HTML page. The outer layer contains `__bundler/manifest`, `__bundler/template`, and `__bundler/page_order`; page data is packaged as base64/gzip. There are **14 boards**, and each board includes its own template and resources.
### 4.1. Reference Board Catalog
| # | Board title in HTML | Content to convert |
| --- | --- | --- |
| 00 | Design system | Tokens, typography, buttons, inputs, cards, badges, alerts, dialogs, skeletons |
| 01 | Student · Login, Register, Home | Auth, current pickup point, search/filter, restaurants, and dishes |
| 02 | Student · Restaurant, Cart | Menu, quantity controls, totals, restaurant-switch warning |
| 03 | Student · Pickup Point, Price Conflict, Checkout | Pickup selection, fee errors, price re-confirmation, cash/QR |
| 04 | Student · Order Tracking, History | Timeline, two state lifecycles, rejection/refund, reorder |
| 05 | Student · AI Recommendations, Random Pick | Preference input, loading, results, fallback, random |
| 06 | Student · System States | Skeleton, empty search, offline, unauthorized |
| 07 | Restaurant Owner · Incoming Orders | Order list/detail, accept/reject/deliver/complete, payment confirmation |
| 08 | Restaurant Owner · Dish Management | Dish table, edit form, hide instead of delete |
| 09 | Restaurant Owner · Restaurant Settings | Order acceptance, opening hours, delivery fees, phase-based QR |
| 10 | Restaurant Owner · Statistics | KPIs, charts, period-based commission table |
| 11 | Admin · Restaurant Management | List, create/assign owner, deactivate |
| 12 | Admin · Commission and Settlement | Aggregates, rates, receipts, adjustments, history |
| 13 | Admin · Audit Log | Filters, read-only table, before/after, pagination |
### 4.2. What to Keep and What to Remove
**Keep:** screen content, information order, colors, relative spacing, interaction patterns, typography, image ratios, and role-specific visual identity.
**Do not include in the application:** the “Unpacking…” loader, export thumbnails, manifest, design-board iframes, unresolved resource UUIDs, screen numbering labels, presentation-canvas backgrounds, multiple mock screens shown side by side, or random demo JavaScript.
- The student `.scr` frame is **390 px** wide, at least **844 px** high, with **28 px** radius. It is a phone presentation frame. Do not lock the application to 390 × 844 px or render a fake phone border in production.
- Desktop boards are **1440 px** wide as reference targets, not as a global `min-width`.
- The outer mobile board background `#EFE4D6` and gallery page background `#F5F4EF` do not replace the application background `#FFF8F0`.
- Forms/modals shown simultaneously on one board are examples of multiple states. In the application, each state appears only after the relevant interaction.
- Dish image and QR placeholders must be replaced with real data/assets or clearly labeled fallbacks.
If extraction is required: read template JSON at each layer, decode the manifest by MIME type, map UUIDs to the correct resources, and inspect each embedded template. Do not read only the outer CSS and assume it represents the product UI. Do not execute packaged scripts merely to collect tokens.
## 5. Design System to Preserve
### 5.1. Visual Personality
Warm, approachable, compact, and easy for students to use. Food imagery and dish prices are visually important. Use cream backgrounds, white surfaces, dark brown text, coral-orange primary actions, and green success/acceptance states. Cards are soft and buttons use pill shapes. Dashboards may have higher information density but still share the same component system.
Do not independently add dark mode, glassmorphism, large decorative gradients, purple/neon primary palettes, multiple font families, or a square-corner design system. The original skeleton gradient is a loading effect, not a general page-background style.
### 5.2. Original Colors and Standardized Token Names
The token names below are conversion conventions; values come from the HTML. Define them in one place and map them into Tailwind instead of scattering hex values across pages.
| Token | Value | Purpose |
| --- | --- | --- |
| `brand` | `#D2411D` | Primary CTA, brand emphasis |
| `brand-dark` | `#A93214` | Hover, text on light orange, links |
| `brand-tint` | `#FDE9E1` | Selected chips, soft buttons, new-order background |
| `fresh` | `#2F7D4F` | Success, order acceptance, open state |
| `fresh-tint` | `#E3F2E8` | Success badge background |
| `fresh-ink` | `#1E5B38` | Success badge text |
| `sun` | `#F5B63D` | Secondary accent, rating stars when real review data exists |
| `warn` / `warn-tint` | `#7A5200` / `#FFF1CC` | Warnings, pending states |
| `danger` / `danger-tint` | `#B3261E` / `#FCE4E2` | Errors, rejection, destructive actions |
| `info` / `info-tint` | `#2457A6` / `#E4EDFA` | Information emphasis / information background |
| `info-ink` | `#1B4585` | Text on information background |
| `surface` | `#FFFFFF` | Cards, forms, navigation surfaces |
| `surface-page` | `#FFF8F0` | Product page background |
| `surface-sunk` | `#F1E7DC` | Skeletons, neutral/disabled backgrounds |
| `surface-line` | `#EADFD3` | Borders and dividers |
| `surface-table-head` | `#FBF4EA` | Table headers and summary rows |
| `ink` / `ink-muted` | `#2A1F1A` / `#6F625A` | Primary / secondary text |
| `disabled-ink` | `#85786F` | Disabled control text |
| `focus-ring` | `#F6B7A3` | Original input focus ring |
| `owner-sidebar` / `owner-sidebar-ink` | `#2A1F1A` / `#F6EBDD` | Restaurant-owner sidebar |
| `admin-sidebar` / `admin-sidebar-ink` | `#1F2A44` / `#E8ECF5` | Admin sidebar |
Add secondary tokens only when they have a clear semantic role. Do not add a new color solely to solve one page. For colors present in the HTML but not listed above, inspect their context before standardizing them; do not turn decorative placeholder colors into business-state colors.
### 5.3. Typography
Primary font: **Be Vietnam Pro**, fallback `system-ui, sans-serif`. Load the required weights with Vietnamese glyph support; do not use only a Latin subset. Packaged font URLs use UUIDs and must be mapped to proper assets; self-host permitted assets if appropriate, but do not leave temporary blob/UUID URLs in source code.
| Role | Font size / line height | Weight |
| --- | --- | --- |
| Display / prominent greeting | 32 / 38 px | 800 |
| Standard title | 22 / 28 px | 800 |
| Heading / emphasized dish name | 17 / 24 px | 700 |
| Dish price | 17 / 24 px | 700 |
| Standard body | 15 / 22 px | 400 |
| Caption | 12 / 16 px | 500 |
| Original input label | 13 px, line-height sufficient for Vietnamese marks | 600 |
| Original mobile page-header title | 20 px | 800 |
| Original table/dashboard content | 14 px | 400–600 depending on role |
| Original dashboard KPI | 28 px / 1.2 | Bold, use tabular numbers |
The mobile/dashboard variants above exist in the HTML. Do not force all text into one size. Do not use the 28 px title from the “Design system” board as the default title size for every page.
Display monetary values as `45.000đ`; use one shared formatter. Use `tabular-nums` for money columns, totals, and KPIs. Do not format money differently in each component.
### 5.4. Spacing, Shape, and Motion
| Property | Standard |
| --- | --- |
| Base spacing scale | 4, 8, 12, 16, 24, 32, 48 px |
| Small / medium / large radius | 10 / 16 / 24 px |
| Buttons and chips | Pill, `border-radius: 999px` |
| Card | White, 1 px `surface-line` border, 16 px radius |
| Original card shadow | `0 4px 16px rgb(74 40 20 / .08)` |
| Original modal shadow | `0 12px 32px rgb(74 40 20 / .18)` |
| Icon | 2 px SVG stroke, rounded caps/joins, default 20 × 20 px, `currentColor` |
| Dish / restaurant card image | 4:3 / 16:9, `object-fit: cover` |
The original CSS contains values such as 14, 18, 20, and 28 px padding. Preserve them when reconstructing specific components; do not globally “round everything to the 4 px scale” if that breaks visual fidelity. For new pages, prefer the shared spacing scale and established component patterns.
Keep motion subtle and functional. The original skeleton animation runs for 1.4 seconds; support `prefers-reduced-motion`. Do not add long animations to ordering or payment-confirmation actions.
### 5.5. Tailwind Integration
- Use semantic token names such as `brand`, `surface`, `ink`, and `danger`, not page-specific names such as `checkoutOrange`.
- Maintain one source of truth for token values; Tailwind aliases should reference that source.
- The HTML shows a `theme.extend` configuration example. It is a mapping example, not proof that the project uses a specific Tailwind version.
- Inspect the manifest/lockfile before choosing a compatible configuration. At review time, the provided frontend manifest did not list Tailwind, a router, or a server-state library; do not assume those packages already exist and do not independently upgrade the whole stack.
- Do not import the entire CSS bundle from every design board because selectors such as `.btn`, `.side`, and `.main` are repeated with different variants.
- Convert variants into clearly named props/components; do not scatter role-based conditions across JSX.
## 6. Layout and Responsive Behavior
### 6.1. Student — `StudentLayout`
Preserve the mobile-first approach: compact header; visible pickup point; search/filter; restaurant/dish content; CTAs placed within easy reach. Bottom navigation contains **Home, Cart, Orders, Account**; the active item uses `brand-dark` with icon and label. The original navigation item height is at least 60 px.
The menu page has a “View cart” CTA with item count/total. Checkout has a summary area and a prominent order button. When using sticky/fixed bars, add matching content padding and safe-area support so they do not cover the final item, form errors, or other controls. Login and focused multi-step pages do not have to show bottom navigation.
Keep mobile content padding close to the reference, approximately 16–20 px. Do not shrink text merely to fit more columns. Long dish names should wrap; prices and quantity controls must remain clear.
### 6.2. Restaurant Owner — `OwnerLayout`
- Desktop sidebar width: **240 px**, background `owner-sidebar`, text `owner-sidebar-ink`; active item uses an orange background and white text.
- Navigation groups: **Incoming Orders, Dish Management, Restaurant Settings, Statistics** according to enabled scope.
- Sidebar header shows the active restaurant and order-acceptance state. Add a restaurant selector when the account owns multiple restaurants, using the same system input/popover patterns.
- Reference main-area spacing: 28 px top padding, 32 px horizontal padding, 48 px bottom padding; 20 px group gaps.
- The incoming-orders page keeps a list-left/detail-right layout when enough width is available. On narrow screens, switch to list then detail instead of forcing two columns.
- Switching restaurants must switch data scope, stop stale queries, and prevent mutations from targeting the previous restaurant.
### 6.3. Admin — `AdminLayout`
- Desktop sidebar width: **240 px**, navy background `#1F2A44`, text `#E8ECF5`; active item uses white background and navy text.
- Navigation: **Restaurant Management, Commission and Settlement, Audit Log**.
- Keep the cream main background, white cards, orange CTAs, and warm table dividers used across the rest of the product.
- Do not make the admin sidebar identical to the restaurant-owner sidebar; the difference is intentional.
### 6.4. Additional Responsive Conventions
The HTML provides artboards, not a complete responsive product specification. The breakpoints below are **proposed conversion conventions** and may be adjusted based on content, but related layouts must be re-verified:
| Width | Behavior |
| --- | --- |
| 360–639 px | Single-column forms/checkout; dashboards use collapsed navigation; dishes may use two columns only if names/prices/tap targets still fit |
| 640–1023 px | Increase card columns as space allows; forms may use two columns; sidebar may collapse |
| 1024 px and above | 240 px dashboard sidebar; list–detail split if space allows; student pages expand grids instead of scaling up a phone frame |
The browse → select pickup point → order → track flow must work at **360 px with no full-page horizontal scrolling** (NFR06). Wide admin tables may scroll inside a labeled table region or transform into cards; do not use `overflow-x: hidden` to hide clipped data.
## 7. Reusable Component Contracts
### 7.1. Foundation Components
| Component | Appearance and behavior |
| --- | --- |
| `Button` | Orange primary; orange-border/dark-orange-text secondary; white/warm-border neutral; light-orange soft; red danger; green success where appropriate for accepting orders |
| `Input`, `Select`, `Textarea` | White background, 10 px radius, always-visible label; helper/error close to field; errors are not communicated by color alone |
| `Chip`, `FilterChip` | Pill, warm border; selected uses light-orange background, orange border, dark-orange text; state must be readable by assistive technology |
| `Card` | White background, 16 px radius, warm border; do not add heavy shadow by default |
| `Badge` | Pill, 12 px/700 text, original padding 3 × 10 px; includes text plus secondary cue, not color alone |
| `Modal`, `ConfirmDialog` | Title, explicit impact, primary action and cancel/back action; backdrop, focus lock, and focus return on close |
| `Toast`, `InlineAlert` | Toast for short feedback; blocking checkout errors remain in content and must not disappear as the only error indication |
| `LoadingState`, `EmptyState`, `ErrorState` | Match screen shape/spacing; messages include the next action |
| `DataTable`, `Pagination` | Light-cream header, 12 px header text, 14 px body text, right-aligned monetary values, pagination according to API capability |
Primary mobile buttons are at least **48 px** high in student boards; dashboard controls at least **44 px**. Mobile inputs are 48 px, dashboard inputs 44 px. Icon buttons and quantity controls require at least a 44 × 44 px hit area. Some design-system examples use 36 px small buttons or 40 px chips; when converted into touch controls, expand the hit area to at least 44 px.
Use one primary CTA for the focused task. Lists may have per-item “add” buttons, but secondary actions should not all receive equal visual emphasis. `loading` should preserve button dimensions, show feedback, and prevent duplicate submission. `disabled` controls should show a visible nearby explanation when users need to understand why.
### 7.2. Business Components
| Component | Rule |
| --- | --- |
| `DishCard`, `DishRow` | Image, name, description/restaurant context, price, add action; row variant keeps menu-board thumbnail pattern; unavailable dishes are labeled and cannot be added |
| `RestaurantCard` | Image, name, hours/order-acceptance capability, distance/fee if verified; do not show fake ratings |
| `QuantityControl` | Decrease–quantity–increase; valid integer quantity; line-removal behavior must be explicit |
| `CartSummary`, `OrderSummary` | Separate food subtotal, delivery fee, total; cart values are estimates, created orders use snapshots |
| `PickupPointSelect`, `DeliveryQuotePanel` | Pickup point and backend quote; calculating, valid, not deliverable, unknown states |
| `OrderStatusBadge`, `PaymentStatusBadge` | Separate components and semantics; use mappings in §9 |
| `OrderTimeline` | Milestones from server history, current step, timestamps, rejection reason; do not invent ETA values |
| `PriceConflictPanel` | Old/new prices or fees, new total, explicit accept button; do not auto-accept changes |
| `DishForm`, `RestaurantForm` | Permission-based data; distinguish delete, hide, and deactivate |
| `RecommendationCard` | Reuse dish-card foundation; recommendation reason is supplementary; selected dish still goes through cart/checkout |
| `CommissionEntryTable`, `SettlementSummary` | Backend-provided figures with clear period/restaurant context; do not recalculate the commission ledger in the UI |
Business components belong to the owning feature even when used by multiple roles. `shared/ui` contains only general-purpose components.
## 8. Converting to React Within the Architecture
### 8.1. Target Structure
```text
frontend/src/
  app/
    router.tsx
    providers.tsx
    layouts/                 # StudentLayout, OwnerLayout, AdminLayout
    pages/                   # Pages that compose multiple features
    hooks/                   # Example: useCheckout
  features/
    auth/ restaurants/ dishes/ delivery/ cart/ orders/
    payments/ commissions/ recommendations/
    # support, reviews, favorites only when in scope
  shared/
    api/                     # HTTP client, API errors, shared DTOs from contract
    ui/                      # Button, Input, Modal, LoadingState...
    hooks/
    lib/                     # Money/date formatting, no business-money decisions
  assets/
  index.css                  # Fonts, tokens, Tailwind integration
```
This is the target structure defined by the architecture, not a requirement to create empty directories for every feature. Each feature may add `pages`, `components`, `hooks`, `api`, `types.ts`, and `index.ts` only when needed.
- `app` composes features through `index.ts`; features import only internal code and `shared`; `shared` must not import upward.
- Pages owned by one feature stay inside that feature; pages coordinating menu/cart/delivery belong in `app/pages`.
- `DishCard` receives `onAddDish`; it must not directly import cart logic and call the add-to-cart API.
- Presentation components do not directly `fetch`; hooks/API layers own data loading, mutation, and errors.
- Session state belongs to auth; cart draft belongs to cart; modal/form state stays close to its usage; server data should not be unnecessarily duplicated.
- Do not place entire HTML boards into `App.tsx`, `dangerouslySetInnerHTML`, or an iframe.
### 8.2. Proposed Page Map
The paths below are **proposed UI routes**, not existing backend endpoints. If the current router follows another convention, preserve that convention and update this table.
| Page/group | Proposed route | Layout / source board |
| --- | --- | --- |
| Login, register | `/login`, `/register` | Compact auth / 01 |
| Home | `/` | Student / 01 |
| Restaurant detail | `/restaurants/:restaurantId` | Student / 02 |
| Cart, checkout | `/cart`, `/checkout` | Student / 02–03 |
| Order tracking | `/orders/:orderId` | Student / 04 |
| Order list/history | `/orders` | Student / 04; history according to scope |
| AI, random | `/recommendations`, `/random` | Student / 05; random post-MVP |
| Account | `/account` | Student; extended from form patterns in 01 |
| Restaurant orders, dishes, settings, statistics | `/owner/restaurants/:restaurantId/{orders,dishes,settings,statistics}` | Owner / 07–10 |
| Restaurant management | `/admin/restaurants` | Admin / 11 |
| Settlement | `/admin/settlements` | Admin / 12 |
| Audit logs | `/admin/audit-logs` | Admin / 13 |
New pages such as account/profile editing should inherit existing form and layout patterns; do not assume the HTML already contains a detailed design for them. Validate session and role before rendering protected areas, and handle 401/403 according to the contract. Hiding menu items in the frontend does not replace backend authorization.
### 8.3. Conversion Sequence
1. Read the scope; inspect current code/manifest; select the source board and list required states.
2. Extract content/assets from the export wrapper; preserve the reference HTML unchanged.
3. Establish fonts/tokens and foundation components, including hover/focus/loading/error/disabled states.
4. Build the three role layouts, then convert home/menu/cart/checkout/tracking; continue with management screens according to scope.
5. Split JSX into components/hooks under the correct feature; convert `class` to `className`, connect label–input relationships, and replace fake controls with semantically correct interactive elements.
6. If the backend is not ready, use intentional fixtures at the data layer and clearly mark demo mode; do not mix sample values with real API data. Do not invent endpoints or response shapes.
7. Connect real APIs, add price/fee revalidation, retry/idempotency behavior, and connectivity states.
8. Compare screenshots at sizes matching each screen inside the artboard; do not compare an entire multi-screen board against a single route.
9. Verify responsive behavior, keyboard support, and error flows; update reusable conventions when new decisions are made.
### 8.4. Implemented Student Discovery Preview
As of October 16, 2026, `/` renders a presentation-only Student restaurant list (US02/US03, FR02, NFR06); see the [frontend guide](../../frontend/README.md) for fixture data, internal props, preview URLs and tooling. This is not connected discovery or proof of full MVP acceptance.
- Tailwind CSS 4 uses `@tailwindcss/vite`. `src/index.css` owns semantic `@theme` tokens, font imports and component styles. Be Vietnam Pro is bundled through Fontsource, including Vietnamese glyphs and weights 400/500/600/700/800. Existing token values are preserved; no new business-state palette is introduced.
- Implemented shared controls: Button (`primary`/`neutral`, native disabled), Input (required visible label/id, native attributes), FilterChip (`aria-pressed`), Badge (`neutral`/`success`/`warning`, text plus dot), decorative Icon, and ListState (message, optional action, alert for errors). Other variants in §7 remain target contracts.
- StudentLayout contains the brand header, skip link, persistent fixture notice and safe-area-aware fixed navigation. Home is current; other navigation items are disabled with a visible explanation. Only the Student layout is implemented.
- The search Input uses a scoped pill treatment; the generic Input retains the standard 10 px radius. Focus combines a dark-orange outline with the original light focus ring for contrast.
- Reference adaptations: no phone frame/gallery; a 1200 px maximum container, one/two/three restaurant columns at `<640`/`640–1023`/`≥1024` px; wrapping touch-size filter chips; a read-only example pickup point; local labeled SVG illustrations/fallbacks; no fictional user identity, ratings, AI/random tiles, featured-dish additions or dead menu links.
- Every restaurant, delivery value and availability flag is synthetic and labeled. No map or pricing calculation is performed. Missing fee and known zero fee stay distinct; fixture view models are not API DTOs.
- Development-only `demo_state=loading|empty|error` selects labeled states; retry leaves filters intact. Production ignores these parameters but remains a fixture-only preview.
- Browser observations and missing coverage are recorded in the [verification report](student-discovery-verification.md). Owner/Admin layouts and automated browser suites remain unimplemented.
## 9. Data and Behavior That Must Not Be Implemented Incorrectly
### 9.1. Order and Payment Are Separate Lifecycles
| Order enum | UI label | Color family |
| --- | --- | --- |
| `pending` | Waiting for restaurant confirmation | Warning |
| `accepted` | Accepted by restaurant | Info |
| `delivering` | Out for delivery | Brand |
| `completed` | Completed | Success |
| `rejected` | Rejected | Danger |
| `cancelled` | Cancelled | Neutral |
| Payment enum | UI label | Color family |
| --- | --- | --- |
| `unpaid` | Unpaid | Warning |
| `paid` | Paid | Success |
| `refund_pending` | Refund pending | Danger |
| `refunded` | Refunded | Neutral |
Color mappings are standardized for shared badge components from the reference patterns; do not create new enums merely to match tab names. Always present “Order” and “Payment” clearly as separate concepts in order details.
```text
pending → accepted → delivering → completed
pending → rejected   (restaurant owner; reason required)
pending → cancelled  (student who owns the order)
```
- Students may cancel only their own orders while `pending`. After acceptance, do not show direct cancellation; support flows appear only when the support feature exists.
- Owners see only valid next actions for orders belonging to their restaurant. Admins do not implicitly receive permission to accept orders or confirm payments.
- Do not add `preparing`, `shipping`, or `failed` to the enum; if “Preparing” appears as a tab label, map it to `accepted`.
- `completed` does not imply `paid`, and `paid` does not automatically complete the order. Update states only according to successful backend responses.
- Scanning a QR code or pressing “I transferred” must not change the status to `paid`. The restaurant must verify receipt. Refunds are performed by the restaurant; the system only records the state.
### 9.2. Cart, Pickup Point, and Pricing
- Adding a dish from another restaurant opens a dialog explaining which previous restaurant/cart items will be removed, with two choices: “Keep current cart” and “Clear current cart and add dish.” If not confirmed, preserve the cart.
- `is_visible=false`: dish is hidden from students. `is_visible=true` and `is_available=false`: show as unavailable and disable add. Do not infer a new database status enum from three form options.
- A restaurant can accept orders only when active, currently open, and order acceptance is enabled; do not check only one flag.
- Changing restaurant/pickup point/items must refresh dependent data. Do not reuse a quote that no longer matches the current order intent.
- MVP uses the surveyed distance/fee for the exact restaurant–pickup-point pair. Post-MVP uses route distance from the backend; do not replace it with straight-line distance or calculate authoritative fees in the browser.
- If no valid fee exists, show “Not determined” rather than `0đ` or “Free delivery.” Disable confirmation and provide retry/choose-another-point actions.
- When the backend reports changed prices/fees, show old → new values, the new total, and require user confirmation. Do not automatically resubmit using the new price.
- Cart totals are estimates and must be labeled accordingly; final totals are determined by the backend. Created orders use snapshots of dish name/price, pickup information, fee, distance, and the finalized rate.
- BIGINT IDs travel through REST as strings. Preserve monetary representations exactly according to the contract, especially money strings in quotes/snapshots; do not coerce all IDs/money to JavaScript `Number` or serialize `BigInt` directly to JSON. Database rates are fractions, e.g. `0.10000000` = 10%; percentage forms must convert precisely at the contract boundary.
- Use Vietnamese locale and timezone `Asia/Ho_Chi_Minh` for displayed dates/times; do not manually convert UTC by adding a fixed number of hours.
### 9.3. Duplicate Submission, Concurrency, and Polling
- One order-creation intent uses one stable idempotency key. Rerenders, retries after disconnection, or retries after a missing response must not generate a new key for the same intent.
- When the client does not know whether an order was created, show a verification/recovery state according to the backend contract; do not immediately invite the user to place another order.
- UI click prevention is only supplemental; server-side idempotency is still required.
- If order acceptance and cancellation race, use the server result, refetch current state, and explain that the action is no longer valid.
- Target MVP architecture: REST polling around every 5 seconds while the tab is visible; do not overlap requests, back off on errors, pause when hidden/offline, and refresh when returning.
- Stop order-status polling at `completed`, `cancelled`, or `rejected`; payment/refund state may continue independently. Only one place in the page should own polling for the same order.
- Show last-updated/connectivity state; late stale responses must not overwrite newer data.
### 9.4. AI, Administration, and Finance
- AI receives budget, preferences, and relevant pickup context through the backend. Do not send full names, phone numbers, or detailed addresses to the AI provider; do not place secrets in the frontend.
- AI target: 95% of responses within 5 seconds; after 10 seconds show retry/fallback messaging while still allowing manual dish selection. Do not present “maximum 5 seconds” as an absolute guarantee.
- Selecting a dish from AI/random uses the same cart, quote, and confirmation rules as manual selection; AI must not place the order automatically.
- Dishes with order history should be hidden rather than deleted; restaurants with orders or settlement periods should be deactivated rather than removed. Dialogs and toasts must reflect the actual backend result, not say “Deleted” when an entity was only hidden.
- Deactivating a restaurant does not cancel active orders, remove settlement obligations, or erase valid historical owner access.
- Commission is generated only from the food subtotal of a completed order, excluding delivery fees, and uses the snapshotted commission rate. The frontend reads backend financial figures; it does not multiply current rates against historical totals.
- Adjustments are new records with reasons and must reference the correct completed order/base entry according to the contract; receipts belong to the correct settlement period. Restaurant name alone is not sufficient transaction identity.
- Do not edit/delete receipt, commission, or audit history. Do not add automatic collection/payment splitting or invent a settlement-state enum. Do not clamp negative balances to zero.
## 10. HTML Details That Must Be Corrected During Conversion
This table preserves the visual form while correcting content/behavior that is wrong or not yet decided.
| Detail in HTML | Correct implementation |
| --- | --- |
| Admin creates restaurant: “One account can manage one restaurant” | Change to “One restaurant-owner account may manage multiple restaurants”; owner layout supports restaurant switching |
| “Preparing” tab | Map to `accepted` or label as “Accepted by restaurant”; do not add an enum |
| Adjustment/audit: “order #1987 was cancelled after commission was calculated” | Remove this example: completed is terminal and cancelled orders do not generate base commission. Use an adjustment fixture with a valid reason; do not describe completed → cancelled |
| QR, free-form address, map, fee tiers shown together | Separate by scope; MVP uses cash and fixed surveyed pickup points/fees |
| Map failure blocks every order | Block only when there is no valid quote; surveyed fixed points with valid data may still be ordered |
| “Radius” in delivery UI | Express clearly as a route-distance limit when route delivery is enabled; do not interpret as straight-line circular radius |
| Reviews, stars, review counts | Show only when the feature and real data exist; remove demo counts from production |
| School email, `@st.vju.ac.vn`, 8-character password, 10-digit phone | Mock form examples only; auth/validation follows the approved contract, not the HTML example |
| JPG/PNG up to 5 MB | Mockup guidance only; align with the media contract and do not treat UI validation as final security validation |
| “Live”, “updated 3 seconds ago” | Show real timestamps; do not infer a WebSocket requirement. MVP follows polling architecture |
| Response within 3 minutes / ETA 10 minutes | Show only if backed by a reliable source/rule; do not hardcode operational promises |
| “Settled”, “Partially collected”, “Uncollected” | Do not add a settlement enum/field; use derived labels only if rules are approved. Otherwise show amount due/received/difference and history |
| Receipt/adjustment form selects only restaurant | Add the correct settlement period or order/base entry according to business rules using existing components |
| Audit example assigns owner from “unassigned” | Do not create ownerless restaurants: schema requires a responsible owner. Use create-with-owner or owner A → B reassignment |
| Price, fee, 10% rate, bank account, QR, example identity | Illustration fixtures, not production defaults |
| “2 dishes” and “3 dishes” used inconsistently for the same cart | Normalize to “2 dish types · 3 portions” when distinguishing line count from total quantity |
Do not copy example bank/account details into real QR generation. Unapproved limits such as maximum commission rate, quote expiry, and receipt-editing workflow remain **TBD**; do not silently turn them into working features.
## 11. States, Content, and Accessibility
### 11.1. Minimum State Matrix
| Situation | UI and action |
| --- | --- |
| Initial load | Skeleton matching card/table layout; loading label for assistive technology |
| Background refresh | Keep current data, mark as updating; on failure indicate that data may be stale |
| Empty list | Distinguish no-data from filter-no-match; provide create/clear-filter actions according to permission |
| Network error | Short explanation and retry; preserve unsent cart/form data |
| Unauthenticated / session expired | Re-authenticate according to auth contract; do not expose prior account data |
| Unauthorized | Use board 06 pattern, provide path to a valid page; do not keep protected data visible |
| Validation | Inline error by field using `aria-describedby`; focus first invalid field on failed submit |
| Mutation pending | Loading button, prevent duplicate submit, preserve input |
| Price/fee/state conflict | Refetch server data, explain the change, require the correct next action |
| Order not eligible | Explain reason: unavailable dish, restaurant closed/not accepting, outside range, fee unknown |
| AI error/slow response | Retry plus manual selection; do not block ordering |
| Missing/broken image | Correct-ratio fallback and appropriate name/alt; card layout remains intact |
### 11.2. Vietnamese Product Copy
Keep the product tone friendly and action-oriented, for example: “Hôm nay ăn gì nhỉ?”, “Thêm vào giỏ”, “Chọn điểm nhận”, “Chưa xác định được phí giao”. Buttons should name the action explicitly; avoid generic “OK” for important decisions. Dashboards use direct, concise wording.
Do not expose stack traces, raw enum names, or raw error codes to students. A safe support reference code may be shown when needed. Do not turn mock copy into real data or show success before the server confirms the action.
### 11.3. Accessibility
- Use `button` for actions and links for navigation; inputs have labels; radios/switches have correct semantics and keyboard interaction.
- Focus must remain visible and must not be covered by sticky bars. Modals require accessible names, focus trapping, Escape behavior when appropriate, and focus return to the opener.
- Icon-only buttons need accessible names such as “Increase quantity of Cơm gà xối mỡ”; decorative icons are hidden from screen readers.
- Badges include text, not only colored dots. Important notifications use appropriate live regions without rereading the entire page on every poll.
- Verify real color contrast, targeting at least 4.5:1 for normal text. Claims in the HTML do not replace measurement; especially verify controls, focus indicators, and text on colored backgrounds.
- Support 200% zoom, long names, Vietnamese diacritics, and reduced motion; do not use fixed heights that clip content.
## 12. Process for Adding Future Pages or Features
Before writing code, identify briefly:
1. Which role uses it; which user story/FR applies; is it MVP or post-MVP?
2. Which existing HTML board/page is closest? If none exists, which existing pattern will it inherit?
3. Which layout, tokens, components, and states can be reused?
4. Does the required data/API exist; what authorization and business-error conditions apply?
5. Should an existing component be extended, or is a new feature-owned component required?
Then implement according to the architecture. Move a component to `shared/ui` only when it is genuinely general-purpose. Changes to shared tokens or shared-component behavior must be checked across all three roles. When adding a new variant, document why it exists, where it is used, and update this file; do not leave conventions only in AI chat history.
**Example:** a post-MVP order-support page uses `StudentLayout`, `OrderSummary`, a labeled/error-aware form, an orange CTA, and submission states. Do not create a visually unrelated full-screen chatbot, do not turn a support request into an order cancellation, and do not expose the feature before a backend contract exists.
**Task template for AI:**
```text
Implement [page/feature] for role [role], in [MVP/post-MVP] scope.
Read docs/ui/ui_convertion.md and the relevant requirements/architecture/database sections.
Compare against board [board name] in docs/ui/Hoa Lac Food Ordering Platform.html.
Preserve the design system and role-based layout; prioritize existing components.
Apply all corrections listed in section 10.
Implement loading/empty/error/disabled/success states and responsive behavior from 360 px.
Use the current API/DTO contract; if the contract is missing, state what is missing and isolate fixtures from real flows.
Report changes, verification steps, and all intentional differences from the HTML.
```
## 13. Conversion Acceptance Checklist
### Design and Responsive
- [ ] Be Vietnam Pro renders correct Vietnamese glyphs/weights; backgrounds, text, and CTA colors match the tokens.
- [ ] Cards, inputs, badges, pill buttons, image ratios, and spacing match the reference.
- [ ] Owner/admin sidebars preserve their intended difference; active navigation matches the current route.
- [ ] No iframe/artboard/export loader/fake phone frame remains in the application.
- [ ] Compare screenshots at 390 px for student screens and 1440 px for dashboards; additionally verify 360, 768, and 1024 px.
- [ ] No full-page horizontal scrolling; wide tables scroll internally; sticky/footer bars do not cover content.
- [ ] Verify long dish names, large prices, missing images, 200% zoom, focus, and keyboard use.
### Behavior and Data
- [ ] One-restaurant cart; switching restaurant requires confirmation; cancelling the dialog preserves the cart.
- [ ] Unavailable/hidden dishes and closed/inactive/non-accepting restaurants cannot be ordered against business rules.
- [ ] Unknown fee is different from `0đ`; MVP works with surveyed pickup points.
- [ ] Changed price/fee requires reconfirmation; do not auto-accept a new value.
- [ ] Order and payment states are separate; show and submit only valid actions.
- [ ] QR does not auto-mark payment as paid; admin does not implicitly inherit owner actions.
- [ ] Retry does not duplicate orders/receipts/adjustments; missing responses are handled explicitly.
- [ ] Historical orders display snapshots rather than reconstructing history from current prices or pickup data.
- [ ] Delete/hide/deactivate behavior and commission figures follow business rules.
- [ ] AI failure still allows manual ordering; no demo data is presented as real.
- [ ] Post-MVP/Could features are not enabled merely because they appear in the HTML.
### Implementation Quality
- [ ] Shared tokens/components are used; do not copy each board stylesheet or place everything in `App.tsx`.
- [ ] Imports/state/API follow architecture boundaries; backend remains authoritative for permissions and money.
- [ ] Build, TypeScript checks, and lint run according to current scripts; remaining failures are reported accurately.
- [ ] Tests cover risky flows such as price conflict, duplicate submit, accept/cancel race, missing quote, authorization, and snapshots—not only CSS classes.
- [ ] Clearly state whether verification used a browser/screenshots or source inspection only; do not claim pixel-perfect or production-ready status without verification.
**Completion condition:** the interface preserves the identity of the original HTML, behaves according to business rules within the assigned scope, and is structured so future pages can reuse the same design system. A visually similar copy with non-functional buttons, incorrect states, or fake data presented as real is not considered complete.
