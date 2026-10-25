# Restaurant cover, avatar and crop selection — October26,2026

Scope: user requested a storefront link from restaurant management, independent horizontal cover and square avatar, and selecting a crop from an uploaded image. Extends US03/US12 and the [storefront contract](restaurant-detail-figma.md); existing typography, palette, authorization and readiness remain authoritative.

## Behavior

- Dashboard and settings expose “Xem trang quán” linking to `/restaurants/{id}`. This is the existing public customer page, including unavailable states for unpublished restaurants; it does not bypass publication checks.
- Cover and avatar are independent optional images. Existing covers are preserved. Public detail and homepage show the avatar beside the restaurant name; a missing/broken avatar shows a shop icon.
- Cover picker uses a3:1 horizontal frame; avatar uses1:1. The native modal previews the retained region, supports pointer dragging, zoom1–4, horizontal/vertical sliders with keyboard support, explicit apply and cancel/Escape. A square source can select a horizontal subsection for a cover.
- Applying the crop creates only a local file/draft. Saving the profile uploads sanitized bytes then PATCHes the references with `expected_version`. Cancel does not alter the saved or pending image. An unsaved crop can be reopened against its original file. Reload requires selecting the source file again; uncropped originals are not stored on the server.
- Input remains JPEG/PNG,1byte–5MiB, up to4096×4096 and16million pixels. Canvas output is bounded to1800px wide for covers and512px for avatars, without intentional upscaling; PNG transparency is retained. Server decode/reencode/metadata removal and all existing limits still apply. Client cropping is not a security boundary.
- Dirty-draft leave protection, explicit save, loading/error/conflict/reload and independent settings sections remain. Changing a reference retries previously failed image rendering.

## API and persistence

`avatar_image_reference` is nullable on public catalog/detail and owner/Admin settings read DTOs. Owner PATCH accepts an optional platform `/api/v1/restaurant-cover-media/{id}` reference or null; omitted means unchanged. Cross-restaurant/claimed/deleted assets return404; nonsquare avatar metadata returns422; stale version409. Admin cannot edit either content reference.

Avatar uploads reuse `POST /owner/restaurants/{id}/cover-media` and protected preview. Public `GET /restaurant-cover-media/{id}` serves a live current cover **or avatar** of an active/ready restaurant, including closed/not-accepting restaurants. Upload alone remains private. There is no new provider or public bucket.

Forward migration `20261025020000_restaurant_avatar` adds only nullable `restaurants.avatar_media_asset_id` with a composite FK `(avatar_media_asset_id,id)` to `(restaurant_cover_media.id,restaurant_id)`. Previous columns/rows remain intact. Runtime UPDATE grants add only this column. Startup schema checks require this migration and column; HTTP startup never migrates automatically.

Profile changes, version checks, ownership and redacted `avatar_changed` audit are atomic. Cleanup marks a former image only when neither next reference uses it. Claims and deletion recheck both references under the existing account→restaurant→asset transaction locks. A shared cover/avatar asset survives removal of one reference. Failed storage deletion remains retryable.

Machine contracts: [setup OpenAPI](../data/setup.openapi.json), [public catalog OpenAPI](../data/openapi.yaml). New content does not affect readiness or order snapshots.

## Verification and adoption

Use the disposable MySQL9.2.0/MinIO environment from [setup verification](../setup-local-verification.md), with new `test_*` databases only. Upgrade check: `TEST_DATABASE_URL=<empty disposable database> npm --prefix backend run test:avatar-upgrade` from the repository root. It compares every preexisting restaurant column, including a stored cover/introduction, and verifies the new avatar is NULL.

The storefront integration suite checks same-restaurant avatar FK, nonsquare rejection, separate references, public/private reads, shared-reference cleanup, audit rollback and stale concurrent writes. `npm --prefix backend run test:storefront-permissions` from the repository root runs it with temporary least-privilege identities. `test:storefront-connected` checks crop output pixels, owner persistence/reload, cancel/Escape, keyboard positioning and public images through real Chrome/Nest/MySQL/MinIO. Readiness in that suite is an explicitly labeled fixture, not onboarding evidence.

Retained-local/remote adoption requires the reviewed forward migration and updated runtime grants through the operator workflow; no reset, seed, applied-migration rewrite or automatic upload is part of this change. Existing photos are not recropped automatically. Execution results follow below.

## Executed self-check

- PASS frontend `lint`, `build`, `test:homepage`; the existing large-bundle advisory remains. Homepage covers five widths and missing/broken/saved-cover states.
- PASS backend `lint`, `test` (77cases), `test:e2e` (9cases), `build`, Prisma `validate` and `generate`. HTTP E2E uses mocked persistence; its sandbox port restriction was resolved by running with loopback permissions.
- PASS `cd backend && node test/storefront-restricted.mjs` with real MySQL9.2.0/MinIO and temporary restricted runtime/provision identities. Tests intentionally inject audit/acknowledgement/deletion failures; resulting sanitized500 logs are expected.
- PASS `cd backend && node scripts/verify-restaurant-avatar-upgrade.mjs` on a separate initially empty database. All previous restaurant columns, including a synthetic persisted cover/introduction, were unchanged.
- PASS frontend `test:storefront-connected`: real Chrome/Nest/MySQL/MinIO. A600×600 red/blue source is dragged and positioned to keep its lower600×200 blue rectangle; decoded canvas pixels verify the saved crop. Square avatar, keyboard positioning, Escape cancellation, modal viewport bounds, reload, public avatar/homepage and independent cover reset are asserted. Browser screenshots were visually inspected at360px; modal centering and owner preview stacking were corrected and rerun.
- `test:workspaces`: relevant owner/settings sections PASS at five widths, including drafts, crop confirmation, upload failure/retry, conflicts and navigation. Full suite FAILS later on the preexisting purchase-history assertion “Lịch sử đơn hàng”; the current history page uses newer copy. The earlier403 assertion was updated to match the current explicit authorization message. No full-suite pass is claimed.
- PASS script syntax, changed JSON parsing, local document targets/anchors, Markdown limits and diff whitespace checks.

New disposable databases: `test_avatar_20261025_01` and `test_avatar_upgrade_20261025_01`, in the existing isolated test container on43316; synthetic image/evidence buckets on43317. Final connected browser artifacts: host temporary directory `hlf-browser-evidence-dJ0HsY`; homepage artifacts `hlf-home-evidence-Ajs9fj`. No real partner image was uploaded by the tests. Retained-local migration/grant adoption and deployment: NOT RUN pending the user's separate response.
