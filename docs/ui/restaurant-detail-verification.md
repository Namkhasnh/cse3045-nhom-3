# Restaurant storefront verification — October 24, 2026

Scope: user-approved [Figma implementation and content contract](restaurant-detail-figma.md). Self-review by the implementing agent, not independent acceptance or production readiness.

## Implemented

Restaurant detail hero, connected search/category/price filters, responsive dish cards, labeled exact default cover, loading/error/missing/empty/closed/image-failure states; buyer-only compact footer by route context; native shared-cart drawer; owner introduction/cover form; public/private image reads; separate cover metadata, forward SQL, restricted grants and retryable cleanup. Existing working-tree changes were preserved.

## Executed evidence

| Check | Result and limit |
| --- | --- |
| Frontend `lint`, `build` | PASS. Build retains the existing main-chunk-size advisory above500kB. |
| Frontend `test:cart` | PASS,6tests. Existing reducer/price/switch behavior. |
| Frontend `test:smoke` | PASS. Offline public/development fixture and auth routes at360px. |
| Frontend `test:homepage` | PASS. Five widths, shared header/footer, buyer/manager/Admin, auth states, keyboard/reduced motion/zoom; controlled API responses. |
| Frontend `test:storefront` | PASS.1440/768/390/360px, exact local cover decoded,3/2/1columns, desktop footer140–200px, mouse/keyboard drawer, focus/scroll restoration, reload persistence, changed-price notice without acceptance, switch cancellation, filters, loading/errors/empty/long text/broken cover, reduced motion and200%zoom. Controlled responses. |
| Frontend `test:storefront-connected` | PASS. Real Chrome login→owner description save→upload/preview→reload→replace→public detail→default reset, with MySQL/MinIO persistence assertions and visible save-button contrast. Existing synthetic password-corpus/SMTP stubs only. Fresh manager identity per run. |
| Backend `lint`, `test`, `test:e2e`, `build` | PASS.60unit tests and9HTTP E2E tests. HTTP E2E mocks persistence; it is separate from the real-MySQL cases below. |
| Prisma `validate`, `generate` | PASS; generation alone is not schema adoption evidence. |
| Storefront integration + restricted runtime | PASS. HTTP ownership/session/same-restaurant scope, valid upload over100KB, MIME/size/dimension rejection, EXIF removal, private unused image, protected preview, public active/ready/current-image rule, database text/image CHECKs and FK, stale concurrent updates, audit rollback, uncertain upload acknowledgement, dish-cleanup isolation and retryable failed deletion. Fresh runtime identity is denied asset identity UPDATE/metadata DELETE/owner reassignment and is removed after testing. |
| Existing settings/dishes/public-catalog MySQL integration | PASS,3suites. New DTO schema/examples and existing media/version/audit/public boundaries checked. |
| Empty-target forward upgrade | PASS. Deploy previous migrations, insert synthetic original account/restaurant, apply only the new migration; every previous restaurant column unchanged, new optional fieldsNULL. |
| Diff/document checks | PASS. Whitespace, local added links/anchors, JSON contracts and changed Markdown files under500lines. |

Real persistence uses Oracle MySQL Community Server9.2.0, InnoDB, in the existing isolated test container on loopback43316. New databases: `test_storefront_20261024_02` and `test_storefront_upgrade_20261024_02`. Cover objects use a separate synthetic bucket on the test MinIO endpoint43317. No retained account/order data was copied into fixtures. Injected audit/response-loss failures intentionally emit sanitized500diagnostics and are asserted by tests.

## Visual observation

The implementer inspected desktop and mobile restaurant screenshots against the open Make preview/source: image crop/scrim, hierarchy, filter row, card geometry, status labels, footer and mobile drawer. Inspection also caught a white-on-white owner save action inherited from settings CSS; the scoped override was fixed and the connected journey rerun with a contrast assertion. User data replaces the prototype's fictitious restaurant/category/notification/pickup claims.

Temporary screenshots (local artifacts, not committed binaries):

- Storefront/viewport drawer: `/var/folders/pn/4h65x5kx5sj8_4q9lkdj48k00000gn/T/hlf-storefront-evidence-JZBmkf`.
- Connected owner/public covers: `/var/folders/pn/4h65x5kx5sj8_4q9lkdj48k00000gn/T/hlf-browser-evidence-emsr34`.
- Shared-homepage regression: `/var/folders/pn/4h65x5kx5sj8_4q9lkdj48k00000gn/T/hlf-home-evidence-BSHkQX`.

The Figma Make source was inspected in its Files UI and rendered preview because file-session/export tools do not support Make; the local default photo uses the exact source URL, not a screenshot of the design.

## Adoption boundary

Retained/local working database migration and VPS deployment: NOT RUN, outside the requested scope. Before running this backend against an existing database, apply the reviewed forward migration and matching restricted runtime grants through its authorized migration workflow. No reset, seed, applied-migration rewrite, production upload, release or V1.0 acceptance is implied. Production media/provider/scheduling remains subject to DEC-10; current storage intentionally supports the existing local test configuration.
