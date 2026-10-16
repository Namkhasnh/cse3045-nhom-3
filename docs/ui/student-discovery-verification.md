# Student Discovery Preview — Verification

Date: October 16, 2026. Current revision: user-approved compact horizontal list (direction 1). Scope: presentation-only discovery for US02/US03, FR02, BR05/08/10 display boundaries and NFR06. Relevant target cases: CAT-01 and UI-02 in [testing.md](../testing.md). These checks do not establish connected discovery, delivery eligibility or full MVP acceptance.

This report supersedes the earlier large-card layout observations. Earlier baseline evidence included 26 fixture/filter/formatter assertions and Chrome checks; those results are not claimed as rerun below.

## Automated checks

| Check | Result |
| --- | --- |
| `npm --prefix frontend run lint` | PASS — Oxlint |
| `npm --prefix frontend run build` | PASS — TypeScript and Vite production build |
| One-off Node.js assertions against actual TypeScript modules | PASS — 14 price-range/filter assertions |
| Contrast calculation for current text/background colors | PASS — 8 pairs, minimum 4.65:1 |
| `git diff --check` | PASS |
| Frontend unit/component/browser regression suites | NOT CONFIGURED — no runner or dependency added |
| Backend/database checks | NOT RUN — unchanged and outside this presentation-only task |

Node.js v24.21.0 ran the assertions using native type stripping with a temporary in-memory resolution hook for extensionless TypeScript imports; no application files were rewritten by the check. Coverage:

- Empty/all-hidden catalogs, one price, equal endpoints, unsorted min/max, hidden exclusion and visible sold-out inclusion.
- Adjacent amounts `9007199254740992` and `9007199254740993` retain exact values and order. No ID or money string is converted to Number.
- Bếp Nhà excludes its hidden 10.000đ dish and displays 20.000–49.000đ.
- Six active fixtures, trimmed/mixed-case Vietnamese prefix, same-dish category/price matching, and Bánh under 30.000đ.

Contrast pairs: ink/white 16.04, muted/white 5.88, muted/cream 5.58, brand-dark/brand-tint 5.68, fresh-ink/fresh-tint 6.95, warn/warn-tint 6.16, warn/white 6.92, brand/white 4.65. These calculations do not constitute a full accessibility audit.

## Browser observations

Manual checks used native Chromium browsers on macOS against the existing local Vite server at `localhost:5173`. Chrome supplied the initial 360 px observation; subsequent checks used Microsoft Edge independently. Screenshots and accessibility-tree states were inspected in-session, not saved as a pixel-diff baseline. Widths below are DevTools viewport settings; absence of overflow is visual evidence, not a measured document-width assertion.

| Scenario | Result / evidence |
| --- | --- |
| 360 px | PASS — white surface, compact title/pickup, wrapping chips, labeled price select and horizontal row; no visible horizontal overflow |
| 390 px | PASS — single column; long Bếp Nhà name wraps, missing/broken images keep their thumbnail frame; footer and final row remain reachable above fixed navigation |
| 768 px | PASS — single column and unframed filters; thumbnail/text alignment retained |
| 1024 px | PASS — two columns begin at the documented breakpoint; larger thumbnails |
| 1440 px | PASS — two columns within the centered container; single and range prices, hours and statuses readable |
| Name search | PASS — `  cƠm  ` returns only Cơm Gà Bà Tư |
| Combined category/price | PASS — Cơm below 30.000đ returns zero; 30.000–50.000đ returns two restaurants, preventing a drink from satisfying the rice-category price filter |
| Reset/no-match | PASS — no-match state offers reset; reset restores six active fixtures |
| Delivery/status labels | PASS — `Giao 0đ`, unknown fee, closed and paused are distinct; no ordering actions |
| Images and prices | PASS — missing/invalid images retain labeled fallback; Bếp Nhà shows 20.000–49.000đ; single-price restaurants show one amount |
| Simulated loading | PASS — horizontal skeleton rows and accessible loading label; development-only simulation notice |
| Simulated empty/error | PASS — empty-dataset and error copy differ from filtered no-match; explicit simulated-state notice |
| Error retry | PASS — query `Bánh` and native select `Dưới 30.000đ` survive retry; one matching row appears and error parameter is removed |
| Keyboard/focus | PASS — Tab reaches skip link, Enter then Tab reaches search; Tab/Space selects Cơm, updates pressed state/results and displays the focus outline |
| Native select accessibility | PASS — accessible name “Giá một món”, selected value exposed; arrow keys/Enter change selection and results |
| Reduced motion | PARTIAL — Edge Rendering emulation selected `prefers-reduced-motion: reduce` and the loading view was inspected; source retains `animation: none !important`. Computed animation-name measurement was NOT RUN |
| Browser zoom 200% | PASS — browser reports 200%; long name, fees, final row/footer remain readable and reachable above navigation; zoom restored to 100% |

## Source inspection and limits

- The Student wrapper alone uses a white background; the generic cream token and Owner/Admin design rules are preserved. The approved visual revision is recorded in [UI §5.6](ui_convertion.md#56-approved-student-discovery-revision--october-16-2026).
- Existing public props/view-model types, fixture filtering, exact VND formatting and retry state ownership are preserved. The new feature-owned formatter summarizes visible catalog prices independently of filters; this is not a delivery quote or backend pricing decision.
- `App` continues to compose through the restaurant feature entrypoint. No API, dependency, router, authentication, cart or ordering capability was added. Original reference HTML is unchanged.
- Development state selection remains guarded by `import.meta.env.DEV`; production parameter handling was source-inspected, not browser-tested.
- The deliberately invalid image data URI may produce an expected resource error. Maximum-size monetary rendering in the browser, computed geometry measurements and a full screen-reader audit: NOT RUN.
- Owner/Admin layouts and automated accessibility suites: NOT CONFIGURED. Physical mobile devices and non-Chromium browser engines: NOT RUN.
- No live hours, real delivery quote, authenticated API, database constraint, order creation, payment or performance target was tested or claimed.

See the [frontend guide](../../frontend/README.md) for commands, preview URLs and component contracts.
