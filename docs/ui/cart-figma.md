# Cart redesign and verification

> October25 extension: [grouped cart and independent checkout](purchase-history-figma.md) supersedes single-restaurant cart/switch behavior below; prior evidence remains historical.

User approved October 24, 2026: [Figma Make cart redesign](https://www.figma.com/make/XymiDbnoGxZqEB2oY2bP45/Redesign-Restaurant-Detail-Page), including automatic fee lookup, mobile continuation and five-second removal undo. Implements the scoped presentation/interaction extension to US04–07, CART-01/GUEST-01/PRICE-01 and UI §9.2; no backend/API/schema change or deployment.

## Presentation and ownership

`/cart` has a 1200px maximum content area, breadcrumb, heading/count, restaurant card, photographed dish rows and a sticky desktop order summary. Tablet/mobile stack into one column; mobile adds a fixed continuation bar with safe-area and trailing content space. Container queries preserve readable cart content at 200% CSS zoom. Be Vietnam Pro, approved semantic colors, shared header/footer, buttons, icons and image fallback remain.

The Make source was inspected through its Chrome editor after the design-context tool returned resource links that were unreadable through the resource bridge. The rendered Make was the visual reference. Prototype photography, names, descriptions, notification counts, prices and fees are not seeded: rows use the actual catalog and accepted cart names/prices. Missing/broken dish images use a labeled fallback. No fictional dish variant is introduced.

The app-level `CartRoutePage` coordinates feature exports. Cart presentation stays in the cart feature; `useCartDelivery` owns points and quote requests. `CartDish` adds optional description/image fields only to the current catalog projection; `hlf.cart.v1` remains unchanged and contains no image, quote, destination or recipient data.

## Interactions and consent

- Cart reducer records only the most recent removed draft in memory for five seconds, including removal of the last item. Undo restores exact IDs, order, quantities and accepted prices; every intervening cart action/storage replacement invalidates it. Expiry is enforced in both the timer and reducer. Catalog is refreshed after undo.
- Signed-in buyers automatically request a real quote after choosing an active point. Each selection/retry/cart fingerprint has independent request identity; late responses cannot replace newer results, including A→B→A. The response must match the selected point. Unknown/error/expired fees remain unknown; known zero is displayed as zero.
- Continuation requires valid catalog/orderability, explicit changed-price acceptance and a live fee quote. Guests retain a login link returning to `/cart`. Session loading, unsupported capabilities, loading/error/empty points and retry states are explicit.
- Historical October24 behavior (superseded by the [October25 checkout contract](../checkout-vouchers.md)): only `{restaurantId,pointId}` was passed through account-scoped session storage (`hlf.setup.{accountId}.cart-delivery`), reusing existing account-switch/logout cleanup. Checkout validates the point against its current list and fetches a fresh quote; it does not inherit a quote artifact or submit an order automatically. Existing saved order intents take precedence and retain original payload/key.
- Exact money arithmetic uses BigInt and the shared VND formatter. The cart total is an estimate; checkout remains the explicit confirmation step. Existing recovery navigation stays available when the cart is blocked.

## Verification — October 24, 2026

All commands run from repository root. Self-review, not independent acceptance.

| Check | Result / boundary |
| --- | --- |
| `npm --prefix frontend run lint` | PASS |
| `npm --prefix frontend run build` | PASS; Vite reports its large-chunk advisory |
| `npm --prefix frontend run test:cart` | PASS, 7 tests including exact undo, expiry, last item, distinct IDs and intervening-action invalidation |
| `npm --prefix frontend run test:cart-browser` | PASS, controlled API responses rendered in real Chrome |
| `npm --prefix frontend run test:storefront` | PASS, existing controlled-response menu/drawer regression |
| `npm --prefix frontend run test:checkout` | PASS, real Chrome → Nest → disposable MySQL 9.2.0, synthetic storage/services |
| `git diff --check`; browser-script syntax | PASS |

Cart browser coverage: 1440/768/390/360px; desktop/mobile geometry and screenshots; images/fallback and long Vietnamese content; distinct IDs sharing a name; exact subtotals/known-zero fee; native quantity/remove/undo/continuation actions; undo timeout/last item/storage-event invalidation; quote race/error/expiry; point error/empty/retry; explicit price consent; sold-out/closed/missing/network/loading states; fresh checkout quote and no automatic order; guest login return; keyboard focus, reduced motion and 200% CSS zoom. Reload persistence is also exercised by the existing storefront suite. Reduced-motion emulation and keyboard checks are scoped evidence, not a full accessibility audit.

Cart screenshots: `/var/folders/pn/4h65x5kx5sj8_4q9lkdj48k00000gn/T/hlf-cart-evidence-TDKCxB`. Desktop/mobile and zoom screenshots were visually inspected; temporary artifacts are not durable repository assets.

Storefront evidence: `/var/folders/pn/4h65x5kx5sj8_4q9lkdj48k00000gn/T/hlf-storefront-evidence-87FNgn`.

Connected checkout used a newly created `test_cart_redesign_20261024` database on the existing isolated `hlf-v04-test-mysql-1` (`mysql:9.2.0`, loopback43316), separate synthetic MinIO buckets and the established browser harness. Existing forward migrations were applied only to this disposable database. No retained data, migration source or backend code was changed for this task. The suite covers real guest login/no auto-submit, cash ordering, lost-response recovery, same-key replay, account isolation, fee/price conflicts and native duplicate-click protection at five widths. Outbound password-corpus/SMTP remain the harness's documented substitutes.

The checkout runner's obsolete add-button selector was updated to tolerate the existing decorative plus icon. Coordinate checks now request instant scrolling before measuring the button; otherwise shared smooth scrolling races the test. Final connected screenshots: `/var/folders/pn/4h65x5kx5sj8_4q9lkdj48k00000gn/T/hlf-browser-evidence-yQAJGH`.

## Admin quote403 repair — October 25, 2026

The reported Edge session was the sole MFA Admin. Its self DTO incorrectly included `buy`, while the delivery workflow correctly denied Admin buying (requirements §4.1). This was not missing fee data or a CSRF failure. `AccountsService.access` now excludes ordinary capabilities/management from the sole authority, including pre-enrollment and inconsistent legacy-ownership cases. Ordinary managers retain buying. Cart additionally rejects mixed legacy `admin,buy` capabilities, explains which account to use and preserves the draft; it does not repeatedly request a forbidden quote.

Evidence: actual Edge cart after reload shows the Admin explanation and retains14portions; backend lint/build,72unit cases,9HTTP E2E cases and the real MySQL9.2.0 delivery integration pass. Delivery HTTP assertions check Admin-only self capabilities and quote403, manager buying, approved zero-fee quotes and survey races. Protected logs: `/private/tmp/hlf-cart-backend-*.log` and `/private/tmp/hlf-cart-delivery-integration.log`. No account/session/fee/history data was changed to bypass the denial. VPS deployment is on hold.

The same follow-up adds [transient action feedback](action-feedback.md). It does not create another inbox message for each local action.
