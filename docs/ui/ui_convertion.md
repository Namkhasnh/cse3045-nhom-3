# UI Conversion & Design Consistency — Hòa Lạc Food

> October25 COD cutover: [approved operating/API/history contract](../cod-ordering.md) supersedes new-order cash/QR selection, QR authoring/review and platform voucher issuance/redemption. Legacy payment/refund and accepted voucher subsidy obligations remain. Prior verification is historical.
> **File name:** [ui_convertion.md](ui_convertion.md) — keep the exact requested name.
> **Purpose:** guide AI assistants and developers in converting the reference HTML UI into a production-usable React application following the approved design direction when adding pages, states, or features.
> **Document scope:** UI conversion and extension standards; this document does not claim that the frontend, backend, or listed features have already been implemented.
## 1. Mandatory Instructions for AI
Before every UI change, read this document, the relevant business requirements, and the corresponding design board in the HTML. Reuse the approved direction for routine work. Substantial aesthetic work may propose a new direction under [design skill coordination](design-skills.md); obtain the user’s decision on a concrete identity proposal before applying it.
1. Follow approved colors, typography, hierarchy, shapes and tone. The current baseline is cream/orange/brown, Be Vietnam Pro and soft corners. Font, palette and shape alternatives are allowed as proposals; until approved and recorded here, retain that baseline. Preserve role clarity and usability across identity changes.
2. Reuse existing layouts, tokens, and components. If they do not exist yet, establish the shared foundation before scaling to more screens.
3. Build new pages by composing the closest existing patterns; do not create a different visual style for each feature.
4. The HTML is the initial visual reference; this guide records approved visual decisions; [requirements.md](../requirements.md) defines business behavior. Do not copy mock content that violates business rules.
5. Preserve Vite + React + TypeScript + Tailwind CSS and the frontend boundaries defined in [architecture.md](../architecture.md).
6. Demo data, prices, fees, accounts, QR codes, metrics, and timestamps in the HTML are not production data.
7. Do not assume that a button shown in the design means the feature is approved for production. Determine whether it belongs to V1.0, post-V1.0, or Could scope.
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
| `docs/ui/Hoa Lac Food Ordering Platform.html` | Initial visual reference; preserve the original asset unchanged |
| [docs/ui/ui_convertion.md](ui_convertion.md) | Approved visual direction, conversion corrections, and consistent extension |
| Installed design skills and search results | Advisory aesthetic/UX input; no independent product or design authority |
| Current API contract and source code, if available | Endpoints, DTOs, backend capabilities, and components that actually exist |
**Resolution order:** use requirements for business behavior, architecture for technical boundaries, and database documentation for data semantics. Use the approved direction recorded here for visuals, with the HTML as the initial reference after §10 corrections. Skill output does not become a requirement automatically. Keep approved decisions here, not in a competing `MASTER.md`. If business sources still conflict, document the conflict and request a decision for the affected part while continuing independent work. Do not silently resolve a conflict by inventing a new field or enum.
The dimensions, colors, and typography marked as “original” below are extracted from the HTML content/CSS. Breakpoints, page routes, and application rules that are not defined by the HTML are marked as **conversion conventions/proposals**, not as current code behavior.
## 3. Product Context AI Must Preserve
Hòa Lạc Food helps students discover restaurants, browse dishes, receive AI recommendations, place orders, and track food delivery in the Hòa Lạc area. The V1.0 is initially deployed at Vietnam Japan University (VJU).
- Ordinary users may buy and manage at most one restaurant through current ownership. The single operator-owned Admin uses MFA/recovery. Student/Owner names describe buyer/management layouts, not exclusive account roles. There is no delivery-driver account.
- Restaurants deliver orders themselves; students pay restaurants directly. The platform tracks commission and supports manual settlement/reconciliation.
- One order belongs to exactly one restaurant. The [October29 purchase revision](purchase-history-figma.md) requires one restaurant per cart and new checkout; adding eligible items from another restaurant automatically replaces the old cart. Each restaurant has one responsible current manager; each account manages at most one restaurant, including setup-required/inactive partners.
- The frontend presents data, keeps drafts, and submits user intent. The backend determines final prices/fees, authorization, state transitions, and financial data.
- AI recommendations may reference only real, currently available, deliverable dishes. AI does not create orders or determine authoritative monetary values.
| Scope | UI handling |
| --- | --- |
| V1.0 | Public homepage/list/menu and guest cart; ordinary signup, sole MFA Admin, opening applications/terms, fixed surveyed points, COD with legacy QR/refund obligations, history/recovery, menu/partner management, AI, finance/reports, support/users/audit |
| V1.2 | Area expansion, free-form addresses/map pins and route-based fees after finalized provider/quote policies |
| V1.1 | Random selection, reorder, favorites/reviews after finalized contracts; durable history and support are already V1.0 |
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
| 03 | Student · Pickup Point, Price Conflict, Checkout | Pickup selection, fee errors, price re-confirmation, pay on delivery |
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
**Default baseline:** content, hierarchy, colors, spacing, interaction patterns, typography, image ratios and role identity. Adapt composition to real tasks and responsive content; approved identity changes may revise visual defaults in §§5–7 while preserving business rules.
**Do not include in the application:** the “Unpacking…” loader, export thumbnails, manifest, design-board iframes, unresolved resource UUIDs, screen numbering labels, presentation-canvas backgrounds, multiple mock screens shown side by side, or random demo JavaScript.
- The student `.scr` frame is **390 px** wide, at least **844 px** high, with **28 px** radius. It is a phone presentation frame. Do not lock the application to 390 × 844 px or render a fake phone border in production.
- Desktop boards are **1440 px** wide as reference targets, not as a global `min-width`.
- The outer mobile board background `#EFE4D6` and gallery page background `#F5F4EF` do not replace the application background `#FFF8F0`.
- Forms/modals shown simultaneously on one board are examples of multiple states. In the application, each state appears only after the relevant interaction.
- Dish image and QR placeholders must be replaced with real data/assets or clearly labeled fallbacks.
If extraction is required: read template JSON at each layer, decode the manifest by MIME type, map UUIDs to the correct resources, and inspect each embedded template. Do not read only the outer CSS and assume it represents the product UI. Do not execute packaged scripts merely to collect tokens.
## 5. Current Approved Design System
### 5.1. Visual Personality
Warm, approachable, compact, and easy for students to use. Food imagery and dish prices are visually important. Use cream backgrounds, white surfaces, dark brown text, coral-orange primary actions, and green success/acceptance states. Cards are soft and buttons use pill shapes. Dashboards may have higher information density but still share the same component system.
These are current defaults, not permanent restrictions on proposing another font, palette or shape. Explain identity changes and obtain the user’s decision before applying them. Avoid decoration without a task-related purpose; the original skeleton gradient is a loading effect. Prioritize finding restaurants and choosing dishes, useful price/availability information and clear hierarchy. Remove decorative labels, promotional filler and identical card treatments when they do not help users compare or act.
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
Current approved primary font: **Be Vietnam Pro**, fallback `system-ui, sans-serif`. Load the required weights with Vietnamese glyph support; do not use only a Latin subset. Packaged font URLs use UUIDs and must be mapped to proper assets; self-host permitted assets if appropriate, but do not leave temporary blob/UUID URLs in source code.
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
- Inspect the manifest/lockfile before choosing a compatible configuration. The current fixture preview uses Tailwind CSS 4 (§8.4); router and server-state libraries remain unimplemented. Recheck installed packages and do not independently upgrade the whole stack.
- Do not import the entire CSS bundle from every design board because selectors such as `.btn`, `.side`, and `.main` are repeated with different variants.
- Convert variants into clearly named props/components; do not scatter role-based conditions across JSX.
### 5.6. Approved Student Discovery Revision — October 16, 2026
The user selected direction 1, a compact restaurant list for students. This overrides the earlier card composition for Student discovery only; Owner/Admin identity and the generic cream-page token remain unchanged.
- White Student surface (`surface`), Be Vietnam Pro, 22 px/700 page title, 16 px/700 restaurant names and 14 px price text; left alignment throughout. Existing brown text, orange selection and green status tokens remain.
- The October 18 public-homepage request extends the compact list with a cream introductory section (“Hôm nay, ăn gì ở VJU?”), a discovery anchor and a header with guest login/register or account/management links. The catalog title remains “Quán quanh VJU” with a read-only sample pickup point. Keep the introduction brief, without promotional claims, invented metrics or footer slogans.
- Border-separated horizontal rows with no enclosing card outline/shadow; 80 px square thumbnails below 1024 px, 96 px from 1024 px, 8 px image radius. One column below 1024 px, two above; loading skeletons follow the same layout.
- Search uses the standard 10 px input radius; category chips retain touch targets/pressed semantics. A labeled native select replaces price chips; reset and filter behavior remain unchanged. Filters have no enclosing panel.
- Rows show visible-catalog dish price ranges (including sold-out dishes, excluding hidden dishes), independent of current filters. Use exact BigInt comparisons and the shared VND formatter; equal endpoints show one price, no visible dishes shows “Chưa có giá món”. This display summary is not an order quote.
- Keep text-bearing availability, hours, delivery fee/distance, persistent and per-row notices only for intentional fixtures, illustration labels and missing/broken-image fallback. Unknown fee stays distinct from known zero. The original preview enabled no menu/order action; P05 enables real public menu navigation and later prompts enable eligible order actions.
- Public `/` renders independently of auth/me loading/failure for every actor; this UI change alone does not implement the public catalog API, guest cart or new identity. Fixture notices stay visible until real catalog integration. Mobile retains fixed bottom navigation; at 1024 px and above it follows the content without an overlay.
### 5.7. Approved Figma Homepage and Shared Chrome — October 24, 2026
The user approved the linked Figma Make homepage and its desktop/mobile CSS motion, plus shared header/footer across all pages. [Implementation contract and verification](homepage-figma.md) supersedes §5.6's compact homepage, Student bottom navigation, and standalone auth chrome for this scoped change. Preserve the existing business capabilities and distinct owner/Admin sidebars. The shared header is sticky; the footer follows long content and reaches the viewport bottom on short pages without an overlay. Actual catalog data and existing history/AI workflows replace prototype-only behavior.
### 5.8. Approved Figma Restaurant Detail — October 24, 2026
The user approved the [restaurant storefront, owner content and compact buyer-footer contract](restaurant-detail-figma.md), including the shared-cart drawer. It supersedes the previous menu presentation and buyer footer only; public data, explicit consent, existing header and management identity remain authoritative. The [approved cart redesign and verification](cart-figma.md) extends `/cart` with the matching layout, real fee lookup, account-scoped point handoff and five-second undo; checkout consent remains explicit. The [October25 checkout/voucher extension](../checkout-vouchers.md) replaces checkout with profile-driven review, inherited quote consent, real vouchers and a dedicated success screen. The [October26 result-screen redesign](checkout-verification.md#october26-result-screen-redesign) adds the approved compact Figma success/partial/recovery presentation and finite motion while preserving the review form and grouped-order contracts.
The October27 [recent-additions dock](cart-figma.md#recent-additions-dock--october-27-2026) adds an orange page-local preview and accepted-add image motion to homepage/menu; headers open the full grouped saved cart. Navigation/reload resets only the preview.
### 5.9. Approved Personal and Owner Workspaces — October 24, 2026
The subsequent [owner dashboard and four-tab settings contract](owner-dashboard-figma.md) supersedes the owner overview/checklist presentation; personal and Admin workspace rules remain.

The user approved separate `/account` and `/owner` workspaces from Figma Make, with shared navigation changes and existing business-page contents retained. [Workspace design and verification](workspaces-figma.md) owns the scoped implementation. It supersedes §6.2's dark owner sidebar with a light, grouped, collapsible sidebar, a dark operational banner, and separate personal navigation. The subsequent user request extends the same workspace layout to Admin, with navy identity/active accents, separate personal-account navigation, and the existing administrative capabilities. Configuration forms move to `/owner/settings`; original setup anchors remain compatible. Progress and status come from the current backend guide; the one-restaurant limit remains authoritative.

The user-approved [owner menu redesign](owner-menu-figma.md) replaces the inline menu form with status cards, local search/filter/sort, grid/list views and an accessible add/edit drawer at `/owner/menu`; existing dish/media/version/recovery contracts remain authoritative.

### 5.10. Approved Figma Login — October 26, 2026
The user approved the complete [Login design and verification](login-figma.md), including scoped cream/orange tokens, food photography, steam/microinteractions and light header/footer. It supersedes earlier Login presentation only; registration, email verification, MFA/recovery and real authentication contracts remain authoritative.

## 6. Layout and Responsive Behavior
The visual treatments below describe the current baseline; approved identity revisions must retain role clarity, responsive behavior and accessible navigation.
### 6.1. Student — `StudentLayout`
Preserve the mobile-first approach: compact header; visible pickup point; search/filter; restaurant/dish content; CTAs placed within easy reach. Bottom navigation contains **Home, Cart, Orders, Account**; the active item uses `brand-dark` with icon and label. The original navigation item height is at least 60 px.
The menu page has a “View cart” CTA with item count/total. Checkout has a summary area and a prominent order button. When using sticky/fixed bars, add matching content padding and safe-area support so they do not cover the final item, form errors, or other controls. Login and focused multi-step pages do not have to show bottom navigation.
Keep mobile content padding close to the reference, approximately 16–20 px. Do not shrink text merely to fit more columns. Long dish names should wrap; prices and quantity controls must remain clear.
### 6.2. Restaurant Owner — `OwnerLayout`
- Desktop sidebar width: **240 px**, background `owner-sidebar`, text `owner-sidebar-ink`; active item uses an orange background and white text.
- Navigation groups: **Incoming Orders, Dish Management, Restaurant Settings, Statistics** according to enabled scope.
- Sidebar header shows the single managed restaurant and order-acceptance/readiness state. No multi-restaurant selector. Keep a visible path back to the buyer homepage/cart/account under the same identity.
- Reference main-area spacing: 28 px top padding, 32 px horizontal padding, 48 px bottom padding; 20 px group gaps.
- The incoming-orders page keeps a list-left/detail-right layout when enough width is available. On narrow screens, switch to list then detail instead of forcing two columns.
- Ownership change/session expiry must stop stale private queries and prevent mutations using a former management context.
### 6.3. Admin — `AdminLayout`
- The October 24 user-approved extension uses the shared light workspace sidebar: **256 px** expanded, **76 px** collapsed, mobile drawer below 1024 px. Navy `#1F2A44` identity/active accents and `#E8ECF5` selected surface distinguish Admin from Owner.
- Group existing navigation into **Overview, Partners and Catalog, Operations, Finance, Administration**. Personal `/account` navigation is separate and includes a return to `/admin`.
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
Appearance follows the approved identity; accessibility, data and interaction contracts remain mandatory when visuals change.
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

October25 user request: meaningful local actions and acknowledged mutations display [transient floating feedback](action-feedback.md), including repeated cart additions and successful order creation with its public code. This UI feedback does not create inbox entries. The shared top-right viewport below navigation also presents important incoming events, with at most two visible cards and a waiting queue; only important server events belong in the bell. Background polling/quotes stay quiet; unknown results never announce success, and blocking/financial errors and recovery remain in context.
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
| AI, random | `/recommendations`, `/random` | Student / 05; random post-V1.0 |
| Account | `/account` | Student; extended from form patterns in 01 |
| Restaurant orders, dishes, settings, statistics | `/owner/restaurants/:restaurantId/{orders,dishes,settings,statistics}` | Owner / 07–10 |
| Restaurant management | `/admin/restaurants` | Admin / 11 |
| Opening application / own history | `/open-restaurant`, `/applications` | Verified ordinary user; no role choice |
| Opening review | `/admin/applications` | Sole MFA Admin; P07 approved contract |
| User/support/audit | `/admin/users`, `/support`, `/admin/support`, `/admin/audit` | Scoped P25 contracts; no Admin-grant control |
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
### 8.4. Current implementation boundary

The [implementation status](../implementation-status.md) and [frontend guide](../../frontend/README.md) distinguish legacy auth/role navigation and fixture discovery from these targets. The unchanged [October 16 verification](student-discovery-verification.md) proves only its stated presentation checks. Old requested-role registration/review is superseded; it is not a new onboarding application or Admin-security acceptance.
### 8.5. Public routes, login return and new workflows

Homepage/list/menu render without an auth/me gate. Guests can select dishes; checkout asks “Đăng nhập để đặt hàng”. On success restore the cart and a validated internal return path, refresh catalog/quote and ask explicit confirmation. Login never submits an order. Store no JWT in browser storage; isolate private checkout/recovery data by account and clear stale private views on account changes.

Signup has username/email/password/confirmation and ordinary profile fields, no role choice or Admin request. Ordinary account navigation shows buyer access and either “Đăng ký mở quán”, own application history or “Quản lý quán” based on current capabilities. Management must not remove buyer/cart/history navigation.

Opening form shows the approved Vietnamese terms/version and explicit consent, submission/history/rejection/conflict states. Approval shows “Cần hoàn thiện cấu hình”, not a selling success. One-restaurant limit includes inactive/setup-required partners. Admin manual-create selects an eligible ordinary user and records approved agreement evidence; no ownerless/extra-Admin flow.

Admin UI needs MFA challenge/recovery guidance under approved DEC-02. No password-only privileged state, role grant or self-suspension control. User/support/audit screens follow the protected projections and finalized P25 contract. Historical QR panels display approved payee/reference/amount, verified receipt and refund obligation separately; scan/customer claim never marks paid.

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
[Buyer order details](buyer-order-figma.md) documents the approved buyer-only Figma composition, server-history progress, COD summary and responsive verification. Color mappings are standardized for shared badge components from the reference patterns; do not create new enums merely to match tab names. Always present “Order” and “Payment” clearly as separate concepts in order details.
```text
pending → accepted → delivering → completed
pending → rejected   (restaurant owner; reason required)
pending → cancelled  (student who owns the order)
```
- Students may cancel only their own orders while `pending`. After acceptance, do not show direct cancellation; support flows appear only when the support feature exists.
- Owners see only valid next actions for orders belonging to their restaurant. Admins do not implicitly receive permission to accept orders or confirm payments.
- Do not add `preparing`, `shipping`, or `failed` to the enum; if “Preparing” appears as a tab label, map it to `accepted`.
- `completed` does not imply `paid`, and `paid` does not automatically complete the order. Update states only according to successful backend responses.
- For historical QR orders, scanning a QR code or pressing “I transferred” must not change the status to `paid`. The restaurant must verify receipt. Refunds are performed by the restaurant; the system only records the state.
### 9.2. Cart, Pickup Point, and Pricing
- Adding a dish from another restaurant opens a dialog explaining which previous restaurant/cart items will be removed, with two choices: “Keep current cart” and “Clear current cart and add dish.” If not confirmed, preserve the cart.
- `is_visible=false`: dish is hidden from students. `is_visible=true` and `is_available=false`: show as unavailable and disable add. Do not infer a new database status enum from three form options.
- A restaurant can accept orders only when active, currently open, and order acceptance is enabled; do not check only one flag. Homepage dish cards prioritize “Ngoài giờ bán”, then “Tạm ngưng nhận đơn”, then “Tạm hết món” (red dot); “Còn món” (green dot) requires open/accepting/available. Refresh loaded dish pages every 60 seconds while visible/online and on return/reconnection, retaining filters and scroll. Failed refresh retains cards with an unverified status and disables adding until recovery. See [scoped verification](dish-hours-verification.md).
- Changing restaurant/pickup point/items must refresh dependent data. Do not reuse a quote that no longer matches the current order intent.
- V1.0 uses the surveyed distance/fee for the exact restaurant–pickup-point pair. Post-V1.0 uses route distance from the backend; do not replace it with straight-line distance or calculate authoritative fees in the browser.
- If no valid fee exists, show “Not determined” rather than `0đ` or “Free delivery.” Disable confirmation and provide retry/choose-another-point actions.
- When the backend reports changed prices/fees, show old → new values, the new total, and require user confirmation. Do not automatically resubmit using the new price.
- Cart totals are estimates and must be labeled accordingly; final totals are determined by the backend. Created orders use snapshots of dish name/price, pickup information, fee, distance, and the finalized rate.
- BIGINT IDs travel through REST as strings. Preserve monetary representations exactly according to the contract, especially money strings in quotes/snapshots; do not coerce all IDs/money to JavaScript `Number` or serialize `BigInt` directly to JSON. Database rates are fractions, e.g. `0.10000000` = 10%; percentage forms must convert precisely at the contract boundary.
- Use Vietnamese locale and timezone `Asia/Ho_Chi_Minh` for displayed dates/times; do not manually convert UTC by adding a fixed number of hours.
V0.2 implements a non-sensitive local guest draft and explicit price acceptance; it keeps that draft on logout/account change. V0.5 adds separate authenticated cash checkout and account-scoped recovery; guest storage remains non-sensitive. See [frontend boundaries](../../frontend/README.md#guest-cart-boundary) for persistence, catalog revalidation and browser evidence.
### 9.3. Duplicate Submission, Concurrency, and Polling
- One order-creation intent uses one stable idempotency key. Rerenders, retries after disconnection, or retries after a missing response must not generate a new key for the same intent.
- When the client does not know whether an order was created, show a verification/recovery state according to the backend contract; do not immediately invite the user to place another order.
- UI click prevention is only supplemental; server-side idempotency is still required.
- If order acceptance and cancellation race, use the server result, refetch current state, and explain that the action is no longer valid.
- Target V1.0 architecture: REST polling around every 5 seconds while the tab is visible; do not overlap requests, back off on errors, pause when hidden/offline, and refresh when returning.
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
| Admin creates restaurant: “One account can manage one restaurant” | Preserve the one-restaurant cap; choose an eligible ordinary user, record agreement and atomically create ownership; manager retains buyer rights |
| “Preparing” tab | Map to `accepted` or label as “Accepted by restaurant”; do not add an enum |
| Adjustment/audit: “order #1987 was cancelled after commission was calculated” | Remove this example: completed is terminal and cancelled orders do not generate base commission. Use an adjustment fixture with a valid reason; do not describe completed → cancelled |
| QR, free-form address, map, fee tiers shown together | V1.0 uses COD at fixed surveyed points; legacy QR/refund history remains accessible; free address/maps/route tiers are V1.2 |
| Map failure blocks every order | Block only when there is no valid quote; surveyed fixed points with valid data may still be ordered |
| “Radius” in delivery UI | Express clearly as a route-distance limit when route delivery is enabled; do not interpret as straight-line circular radius |
| Reviews, stars, review counts | Show only when the feature and real data exist; remove demo counts from production |
| School email, `@st.vju.ac.vn`, 8-character password, 10-digit phone | Mock form examples only; auth/validation follows the approved contract, not the HTML example |
| JPG/PNG up to 5 MB | Mockup guidance only; align with the media contract and do not treat UI validation as final security validation |
| “Live”, “updated 3 seconds ago” | Show real timestamps; do not infer a WebSocket requirement. V1.0 follows polling architecture |
| Response within 3 minutes / ETA 10 minutes | Show only if backed by a reliable source/rule; do not hardcode operational promises |
| “Settled”, “Partially collected”, “Uncollected” | Do not add a settlement enum/field; use derived labels only if rules are approved. Otherwise show amount due/received/difference and history |
| Receipt/adjustment form selects only restaurant | Add the correct settlement period or order/base entry according to business rules using existing components |
| Audit example assigns owner from “unassigned” | Do not create ownerless restaurants: schema requires a responsible owner. Use create-with-owner or owner A → B reassignment |
| Price, fee, 10% rate, bank account, QR, example identity | Illustration fixtures, not production defaults |
| “2 dishes” and “3 dishes” used inconsistently for the same cart | Normalize to “2 dish types · 3 portions” when distinguishing line count from total quantity |
Do not copy example bank/account details into real QR generation. Unapproved commission/quote/payment/finance decisions remain in [decision register](../decisions.md); do not silently turn them into working features.
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
Shared `Input` accepts an inline `error`: connect it to the control through `aria-describedby` and `aria-invalid`; focus the first invalid field on failed validation. Keep setup drafts scoped to their form when another form saves. Checkout keeps its submitted controls and pointer target stable through pending/success; owner order selection reveals a named detail region and supports returning to the list. [Scoped reproduction](../uiux-fixes-local-verification.md) records the implemented fixes and evidence limits.
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
1. Which role uses it; which user story/FR applies; is it V1.0 or post-V1.0?
2. Which existing HTML board/page is closest? If none exists, which existing pattern will it inherit?
3. Which layout, tokens, components, and states can be reused?
4. Does the required data/API exist; what authorization and business-error conditions apply?
5. Should an existing component be extended, or is a new feature-owned component required?
Then implement according to the architecture. Move a component to `shared/ui` only when it is genuinely general-purpose. Changes to shared tokens or shared-component behavior must be checked across all three roles. When adding a new variant, document why it exists, where it is used, and update this file; do not leave conventions only in AI chat history.
**Example:** a V0.7/V1.0 order-support page uses `StudentLayout`, `OrderSummary`, a labeled/error-aware form, an orange CTA, and submission states. Do not create a visually unrelated full-screen chatbot, do not turn a support request into an order cancellation, and do not expose the feature before a backend contract exists.
**Task template for AI:**
```text
Implement [page/feature] for role [role], in [V1.0/post-V1.0] scope.
Read docs/ui/ui_convertion.md and the relevant requirements/architecture/database sections.
Compare against board [board name] in docs/ui/Hoa Lac Food Ordering Platform.html.
Follow the approved direction in the UI guide and role-based layout; prioritize existing components.
For requested identity changes, propose concrete options and obtain the user’s decision before applying them.
Apply all corrections listed in section 10.
Implement loading/empty/error/disabled/success states and responsive behavior from 360 px.
Use the current API/DTO contract; if the contract is missing, state what is missing and isolate fixtures from real flows.
Report changes, verification steps, and all intentional differences from the HTML.
```
## 13. Conversion Acceptance Checklist
### Design and Responsive
- [ ] The approved font renders Vietnamese glyphs/weights (currently Be Vietnam Pro); backgrounds, text and CTA colors match semantic tokens.
- [ ] Components, image ratios and spacing follow approved direction; hierarchy supports finding restaurants and choosing dishes without decorative labels or promotional filler.
- [ ] Owner/admin sidebars preserve their intended difference; active navigation matches the current route.
- [ ] No iframe/artboard/export loader/fake phone frame remains in the application.
- [ ] Compare screenshots at 390 px for student screens and 1440 px for dashboards; additionally verify 360, 768, and 1024 px.
- [ ] No full-page horizontal scrolling; wide tables scroll internally; sticky/footer bars do not cover content.
- [ ] Verify long dish names, large prices, missing images, 200% zoom, focus, and keyboard use.
### Behavior and Data
- [ ] One-restaurant cart; switching restaurant requires confirmation; cancelling the dialog preserves the cart.
- [ ] Unavailable/hidden dishes and closed/inactive/non-accepting restaurants cannot be ordered against business rules.
- [ ] Unknown fee is different from `0đ`; V1.0 works with surveyed pickup points.
- [ ] Changed price/fee requires reconfirmation; do not auto-accept a new value.
- [ ] Order and payment states are separate; show and submit only valid actions.
- [ ] QR does not auto-mark payment as paid; admin does not implicitly inherit owner actions.
- [ ] Retry does not duplicate orders/receipts/adjustments; missing responses are handled explicitly.
- [ ] Historical orders display snapshots rather than reconstructing history from current prices or pickup data.
- [ ] Delete/hide/deactivate behavior and commission figures follow business rules.
- [ ] AI failure still allows manual ordering; no demo data is presented as real.
- [ ] Post-V1.0/Could features are not enabled merely because they appear in the HTML.
### Implementation Quality
- [ ] Shared tokens/components are used; do not copy each board stylesheet or place everything in `App.tsx`.
- [ ] Imports/state/API follow architecture boundaries; backend remains authoritative for permissions and money.
- [ ] Build, TypeScript checks, and lint run according to current scripts; remaining failures are reported accurately.
- [ ] Tests cover risky flows such as price conflict, duplicate submit, accept/cancel race, missing quote, authorization, and snapshots—not only CSS classes.
- [ ] Clearly state whether verification used a browser/screenshots or source inspection only; do not claim pixel-perfect or production-ready status without verification.
**Completion condition:** the interface follows the approved direction recorded in this guide, behaves according to business rules within the assigned scope, and is structured so future pages can reuse the same design system. A visually similar copy with non-functional buttons, incorrect states, or fake data presented as real is not considered complete.

Version acceptance follows [roadmap](../roadmap.md); new journeys must cover PUBLIC-01, GUEST-01, AUTH-04, ADMIN-01/02 and ONBOARD-01–03 alongside UI-02.

## V0.3 onboarding and order privacy amendment

Opening screens display immutable terms/version, explicit consent, private required evidence, own review history and setup-required approval. [Approved contract](../onboarding-v03-contract.md) owns limits. The [owner order dashboard](owner-orders-figma.md) uses four status cards, Kanban/list and a detail drawer with shared public order codes. Point labels are visible before acceptance. Owner order UI withholds recipient contact until “Đã xong món – chờ giao”; accepting alone reveals nothing. Backend projection must enforce this. The action does not mark delivering/completed. Never render buyer account identifiers/email. [P17](../progress/P17.md) implements this projection/milestone for local synthetic scope; [V0.5 verification](../cash-ordering-local-verification.md) owns reproducible browser evidence.

## V0.4 connected setup

Owner /owner, /owner/menu, /owner/delivery and /owner/commission manage the one current restaurant. Admin /admin/restaurants, /admin/categories, /admin/delivery and /admin/commissions provide only approved configuration/review powers. Manager/Admin mobile navigation wraps; generic ConfirmDialog adds an optional context-specific cancel label while preserving cart behavior. Pending durable commands freeze their original payload/key, expose explicit recovery and clear obsolete errors after success. Quote expiry and unknown fee are distinct from a known zero. Ready never auto-enables accepting; Admin activation and owner consent/switch remain separate. [Setup contract](../restaurant-setup-v04-contract.md) owns exact semantics, caps and states. The [October26 owner delivery redesign](owner-delivery-figma.md) owns the approved dashboard layout, km input adaptation, draft/recovery UI and scoped verification.

## Local discovery follow-up

The connected homepage adds “Khám phá món ăn” using public dishes independently of the existing restaurant filters. Compact dish rows reuse DishImage, prices and menu navigation; no fixture fallback or checkout action is added. Terms/history reads have independent error states, a successful-read-only empty history and one refresh control. Background failures preserve drafts and disable unsafe submission. A development-only notice identifies explicitly authorized local synthetic data; sample names/descriptions also remain labeled. See [local adoption](../local-demo-adoption.md).

Homepage dish cards identify the seller with “Quán bán: …”, linking to that dish’s restaurant. The public dish projection supplies the current restaurant name; retain available/sold-out text without inventing ratings or remaining quantities.

## V0.6 approved payment contract

Approved DEC-06 notices, independent receipt/refund panels, static QR manual amount/reference entry and scoped disputes follow [payment policy](../payments-policy.md). QR claim never reports transfer success; private recovery and independent version guards remain mandatory.

## V0.7 finance interface

Approved [DEC-07](../finance-policy-proposal.md) drives `/owner/finance` and sole-MFA-Admin `/admin/settlements` (`/admin/reports` alias); rate-consent pages stay separate. Reuse approved cards/buttons/native dialogs and a labeled keyboard-focusable table scroller at360px. Current owner reads own signed account/period balances and immutable facts; Admin previews and confirms whole-month finalization, adjustment, verified manual receipt and full reversal/replacement. Show open months, missing/late statements and overdue collectible debt as derived date/amount labels, never a settlement enum. Display entry count so a net-zero period is distinct from no facts. Unknown creates reconcile unique month+original entry set first; keyed intents preserve original actor/restaurant/body/key across reload, and storage failure blocks sending. Held prior-account replies are dropped. [Reproduction and boundaries](../finance-local-verification.md). The October27 owner-only [Figma finance redesign](owner-finance-figma.md) updates `/owner/finance` presentation; Admin finance and business contracts remain unchanged.

## V0.7 account, support and audit

[P25 contract](../account-support-v07-contract.md) connects buyer support/privacy in the student shell and manager/Admin pages in their distinct shells. Restricted navigation displays only obligations; pending acceptance/configuration remains unavailable. Native confirmation dialogs show concrete targets; actor-bound saved intents survive reload/account changes and stale private replies are discarded. Audit reuses the original “Admin: Nhật ký hành động” reference pattern while removing fictional contacts/rates/raw evidence and using bounded filters. No asset or identity change.

## Onboarding notification interface

[Notifications](../notifications-contract.md) add one session-scoped bell, unread badge, disclosure preview, explicit mailbox/read-loaded controls, current setup checklist and paginated Admin tasks. Keep cream/orange/Be Vietnam Pro and distinct shells. App composes checklist slots into onboarding/restaurant features. Reading never implies consent; show separate current visibility/orderability and waiting actor.

## V0.8 recommendation implementation

[Approved DEC-09](../ai-v08-contract.md): `/recommendations` accepts one-portion delivery-inclusive budget and up to3 existing category preferences; no free text. Show provider-use notice before explicit submission, current backend estimates, existing cart-switch consent and fresh quote/checkout. A five-item buyer navigation includes AI; manual ordering remains available during AI failure. [Verification](../ai-local-verification.md) records connected Chrome evidence and missing live-provider acceptance.

## Scoped MVP ordering UX follow-up

Manager/Admin navigation marks matching routes with `aria-current=page`, treating `/admin/reports` as the finance alias. Owner order pagination includes “Về đơn mới nhất”; fixed pickup snapshot name/text display once when identical. [Three-role verification](../mvp-ordering-verification.md) records actual Chrome mobile/desktop/keyboard/dialog/native-submit evidence and accessibility limits; no theme/permission policy change.
### Notification center — approved October 24

The latest [Figma Make notification design](https://www.figma.com/make/xfAu5VZ9550JhtiOcKjCGA/Redesign-Notification-Experience) supersedes the sidebar mailbox composition: `/notifications` is standalone, with no personal-account sidebar. Header bell/recent dropdown remains shared. See [implementation mapping](notifications-figma.md) for card/filter/mobile states and the deliberate reuse of Be Vietnam Pro/semantic tokens instead of the prototype font.
### Incoming notification popup and sound — October 24

The approved incoming-alert extension adds independent popup/sound switches in the bell panel, defaulting to on/off. New unread messages may show a compact top-right popup and one short chime per received batch. Initial mailbox data never replays. Keep keyboard focus, hover/focus timer pausing, reduced motion and mobile bounds; read state changes only through existing explicit actions. See the [owning notification contract](../notifications-contract.md#incoming-popup-and-optional-sound--october-24).
### Approved purchase history — October25; single-restaurant revision — October29

The [user-approved contract](purchase-history-figma.md), revised October29, retains history/reorder but supersedes grouped cart and new multi-order confirmation. Keep personal workspace chrome, history cards, server filters/counts and existing order details. One cart holds one restaurant; valid additions/reorder from another restaurant automatically replace previous dishes and selection. The bottom cart/drawer show the full current cart. A new checkout confirms one restaurant, surveyed point, fee and optional owner voucher. Legacy uncertain batch recovery remains available.
