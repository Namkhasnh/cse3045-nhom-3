# Figma homepage and shared site chrome

User-approved October 24, 2026. Reference: [Hoa Lac Food Figma Make](https://www.figma.com/make/hXfOPbv322znOPyfI1a6rO/Redesign-Hoa-Lac-Food-Homepage). This scoped approval supersedes the compact homepage presentation in UI §5.6, the Student bottom navigation, and the absence of shared chrome on authentication/management pages. Business permissions and API contracts remain unchanged.

## Visual and component contracts

- `AppShell` owns one sticky `SiteHeader`, one skip link, the route-content area and one `SiteFooter` across all routes. Each route still owns exactly one `main#main-content`.
- The shell uses a column flex layout with minimum viewport height and a growing content area. The footer follows long content and reaches the viewport bottom on short pages; it is never a fixed overlay.
- `StudentLayout` owns buyer content spacing. `RoleLayout` keeps the distinct owner/Admin sidebar and existing navigation below the shared header. Auth forms keep their existing behavior and fit inside the shell.
- Guest header offers login/register and guest cart. Active buyers get opening applications, notifications, cart and account navigation; current ownership changes the action to “Quán của tôi”, including inactive/setup-required restaurants. Admin gets “Quản trị”. Restricted accounts retain navigation for existing obligations.
- Account navigation exposes “Lịch sử mua hàng” through the existing `/orders` route when authorized. This change does not implement or redesign history.
- Mobile uses a disclosure menu, replacing the former Student bottom navigation. Escape restores toggle focus; focus leaving the account disclosure and outside pointer clicks dismiss it. Tablet also collapses navigation when authenticated controls would otherwise crowd the header.
- Original Make CSS is namespaced in `figma-home.css`; connected-data and shell adaptations live in `site-shell.css`. Be Vietnam Pro stays locally packaged. Cream, orange, espresso, larger image cards and organic hero corners follow the approved Make. Generic business controls and role sidebar tokens retain their established semantics.

## Motion and accessibility

Retain Make timing: button180ms, card250ms, image450ms with cubic-bezier(.2,.7,.2,1), hero entrance700ms and120ms stagger. Reveal triggers when a section enters the viewport and remains visible without observer support. Decorative hero float follows the original4s cycle. Hover effects apply only to fine pointers; touch controls retain press feedback. Reduced-motion disables shell animations/transitions and smooth scrolling.

CTA backgrounds and small orange text use darker variants for readable contrast. Touch actions remain at least44px; text wraps and tables retain internal scrolling. Header anchors/focus account for the sticky header. Notification previews fit within the mobile viewport. All content remains reachable without animation.

## Connected-data boundary and reference differences

- Real categories, dishes and restaurants use existing public catalog requests. Shared query/category/price filters are server-side; name search retains the documented prefix semantics. Lists retain cursor pagination, retry, loading, empty and broken-image states.
- Hero/category/AI decorative photos are exact source URLs from the Make, downloaded under `frontend/public/images/home`. They are illustrative, not catalog evidence. Live dish images retain API ownership and safety/fallback handling.
- Historical homepage boundary: the original public restaurant DTO had no cover photo, review count or dish total. The [October24 storefront extension](restaurant-detail-figma.md) now adds optional cover/introduction; the homepage card presentation remains unchanged. Restaurant cards therefore show an explicit missing-photo illustration, real hours, price range and order-acceptance state. No fictional venue photography or popularity claims are supplied.
- The hero mini-card is labeled “Ảnh minh họa”; it does not claim popularity. Local synthetic catalog notices remain gated by the existing development configuration.
- The AI panel links to the existing `/recommendations` workflow; it never runs the prototype's random picker, calls the provider on page load or claims an illustrative dish is an actual recommendation.
- The [restaurant-detail revision](restaurant-detail-figma.md) replaces the buyer footer with the compact Make variant; management chrome retains this document’s footer. Footer links target implemented routes, replacing prototype-only about/help/contact anchors. Login return paths, guest-cart preservation and current capability restrictions remain authoritative.

## Verification

`npm --prefix frontend run test:homepage` runs real isolated Chrome rendering with controlled frontend API responses. It checks five widths, image loading, server filter arguments, guest/buyer/owner/Admin navigation, short/long footer geometry, auth forms, mobile Escape/focus, notification bounds, session loading/failure, empty/error results, reduced motion and200% zoom. Screenshots go to a temporary directory or `BROWSER_EVIDENCE_DIR`.

This test is frontend evidence, not proof of backend persistence or real authentication. `test:smoke` remains offline/public/fixture/auth rendering evidence. `test:connected` requires its separately configured disposable MySQL/backend environment and exercises real guest-cart/login continuity.

October24 implementation self-check: frontend lint/build, offline browser smoke, the dedicated homepage browser suite, script syntax, local links/Markdown limits and diff whitespace checks PASS. Desktop/mobile screenshots were visually inspected. The build emits a bundle-size warning (main JS just above500kB); no build failure. Real-MySQL `test:connected` is NOT RUN because `TEST_DATABASE_URL` is not configured for this session. The retained local database was not changed.
