# Restaurant owner overview and settings — October 24, 2026

Authority: user-approved implementation plan for [Figma Make](https://www.figma.com/make/xfAu5VZ9550JhtiOcKjCGA/Redesign-Notification-Experience?preview-route=%2Fowner), [UI guide](ui_convertion.md), [setup contract](../restaurant-setup-v04-contract.md), and [order API](../data/api_contract.md). This frontend-only revision supersedes the owner checklist dashboard described in [workspaces](workspaces-figma.md). Personal/Admin workspace behavior stays unchanged.

## Design and boundaries

The Make connector returned source resource links, but its session/screenshot tools do not support Make files. The actual `/owner` preview and all four settings tabs were inspected in the user's Chrome session. Implemented composition: warm cream canvas, white rounded cards, orange accents, four KPIs, operational panels, compact readiness, quick actions, segmented settings tabs, profile preview and weekly schedule editor. Existing Be Vietnam Pro, semantic tokens, header and workspace shell remain. Prototype sample names, orders, food images and financial totals are not production data or implementation assets.

`OwnerDashboardPage` and its data loader live in the restaurants feature. App composition injects order/dish/guide readers through public feature exports. The former notifications-owned checklist dashboard and separate storefront edit form are removed; the compact `SetupChecklist` remains shared by settings, inbox, onboarding and Admin.

| Route | Responsibility |
| --- | --- |
| `/owner` | Read-only operational overview; processing links open the existing order workflow. |
| `/owner/settings#profile` | Name, address, business phone, paired coordinates, cover and introduction; one versioned profile save. |
| `/owner/settings#hours` | Seven days, add/remove intervals, per-day on/off draft, overnight flag and selected-day copy from Monday. |
| `/owner/settings#accepting` | Draft receiving switch and explicit save; active/readiness prerequisites remain. |
| `/owner/settings#readiness` | Full backend-owned setup checklist and next-step links. |

Old `/owner#profile`, `#hours`, `#accepting` links still redirect after authorization; `#readiness` is also accepted. Tabs retain mounted drafts, support arrow/Home/End keys and reveal deep links. Sidebar wording is “Cài đặt quán”.

The subsequent [backend analytics extension](owner-analytics.md) enables the formerly unsupported daily revenue/chart/top-dish widgets. It supersedes the missing-backend notes below, which document the earlier frontend-only boundary.

## Existing APIs and truthful data

All paths below use the existing `/api/v1` prefix. No backend, wire contract, schema or permission changes are introduced.

- `GET /notifications/setup/{restaurant_id}` supplies name, current visibility/open/orderable facts and checklist steps. Readiness progress counts returned steps, never a hardcoded denominator.
- `GET /owner/restaurants/{restaurant_id}/orders` supplies summaries, cursor pagination, status filters and descending `created_at`. The frontend order type now includes the already-returned `created_at` field.
- Today's order count uses `Asia/Ho_Chi_Minh`, reads descending pages until an older business date/end, and only publishes a completed total. Processing count traverses every page of pending/accepted/delivering. Recent orders show returned IDs, dates, status and exact money; pending previews link to `?order={id}`. No buyer identities are requested or invented.
- `GET /owner/restaurants/{restaurant_id}/dishes` reads all pages. Selling count means visible and available; sold-out count means visible and unavailable.
- `GET /owner/restaurants` and `GET/PATCH /owner/restaurants/{restaurant_id}` retain ownership, `expected_version`, validation and receiving rules.
- `POST /owner/restaurants/{restaurant_id}/cover-media` and protected owner preview retain existing sanitized JPEG/PNG behavior. Upload precedes PATCH; failure retains the file/draft, and a successful upload followed by failed PATCH retains its reference for deliberate retry.

The owner explicitly chose no new analytics backend in this task. Daily revenue, 7/30-day chart and best-selling dishes therefore show an unsupported state rather than zero or fabricated chart bars. `/owner/finance` links to the existing monthly report. Daily aggregation and completed-item ranking need a separate backend capability before those widgets can show numbers.

Dashboard polling uses the existing visible/online five-second scheduler and bounded backoff, with one refresh in flight, abort on scope change/unmount, explicit stale-data warnings and retry. Each complete data group updates independently; a failed paginated load never publishes a partial count. Protected read failures clear the affected data. Large active-order lists can require multiple requests; a future aggregate endpoint would reduce this cost.

## Editing and accessibility

Profile, hours and receiving drafts are independent. Saving one section does not erase another draft. Reload after a conflict/uncertain result preserves dirty drafts and requires review before another explicit write. Restoring a section uses the latest server baseline. Success feedback is a live region and appears only after API confirmation; pending saves are locked synchronously and controls disabled.

Opening hours use explicit 24-hour `HH:mm:ss` text controls so host/browser AM/PM preferences cannot alter the display. Validation matches the current contract: at most 56 intervals, positive duration up to 24 hours, explicit next-day close, no overlap including Sunday/Monday; adjacent intervals allowed. Copy and day switches only edit a draft. No schedule is saved automatically.

A native confirmation protects dirty internal navigation; browser beforeunload protects reload/close. Tabs are keyboard accessible, field errors are associated and focusable, mobile content reflows at 360 px, shared drawer behavior is retained, and scoped 150–200 ms CSS motion respects reduced motion. The cover picker has Vietnamese copy; business imagery remains dynamic and default imagery remains labeled.

## Verification

Evidence is self-review, not independent acceptance or a production release. Connected checks use only the new `test_owner_redesign_20261024` database in existing disposable `hlf-v04-test-mysql-1` (Oracle MySQL 9.2.0, loopback 43316) and existing private test MinIO (43317). Existing migrations were applied only to that new database. No new migration was authored; development/production data were not changed. Browser harness SMTP/password-corpus boundaries remain as documented in [setup verification](../setup-local-verification.md).

- PASS: `node --test frontend/test/owner-dashboard.test.mjs` — five cases covering business midnight, pagination, partial failures, exact money preservation, empty data, in-flight abort and weekly overlap/overnight validation.
- PASS: frontend lint, without warnings; frontend build including TypeScript. Existing bundle-size advisory above 500 kB remains.
- PASS: `test:settings` — actual profile persistence/reload, independent restaurant drafts, field errors, overlap validation and five widths. Evidence: `hlf-browser-evidence-zk16LH` in the host temporary directory.
- PASS: `test:storefront-connected` — actual upload, protected preview, replacement cleanup, public cover, description reload and default reset through Nest/MySQL/MinIO. Evidence: `hlf-browser-evidence-nJ35x7`.
- PASS: `test:setup` — actual fresh partner configuration, Admin activation/survey/rate, owner consent/replay and explicit receiving; no SQL readiness shortcut. Evidence: `hlf-browser-evidence-brqhXa`.
- PASS: `test:workspaces` — controlled responses in real Chrome: paginated KPI totals, stale/empty/forbidden states; independent drafts, tabs/keyboard, conflict/reload, pending duplicate prevention, upload failure/retry, schedule copy and leave-warning choices; five-width settings/dashboard and personal/Admin regressions. Final evidence: `hlf-workspaces-evidence-zdxY89`. Includes cancellation of logout without losing the draft/session.

- PASS: `test:storefront` — controlled-response Chrome regression for public menu/cart and the consolidated owner profile form. Evidence: `hlf-storefront-evidence-fpiX1q`.
- PASS: `node --test frontend/test/owner-dashboard.test.mjs frontend/test/orders.test.mjs` — 15 combined cases.
- PASS: documentation local paths, Markdown line limits and `git diff --check`. Final dashboard desktop/mobile, weekly editor and operating-tab screenshots were visually inspected against the Make composition.

Other connected checkout/tracking/payments scripts were updated only for the new tabs/receiving controls; their full business journeys are NOT RUN for this frontend task. Backend application suites are NOT RUN; backend compilation was run to prepare the existing browser harness. No deployment is included.


## File handoff

- Added under `frontend/src/features/restaurants/`: `pages/OwnerDashboardPage.tsx`, `owner-dashboard-data.ts`, `owner.css`, `opening-hours.ts`, `profile-draft.ts`, `components/OpeningHoursEditor.tsx`, `components/RestaurantProfileEditor.tsx`, and `hooks/use-settings-draft.ts`.
- Updated composition/navigation: `frontend/src/App.tsx`, `frontend/src/app/layouts/WorkspaceLayout.tsx`; restaurant settings page/API/index; order summary API type; dish reader/API export; notifications guide export and compact checklist.
- Removed replaced implementations: `frontend/src/features/notifications/OwnerOverview.tsx`, `owner-overview.css`, and restaurant `components/StorefrontForm.tsx`, `components/storefront-form.css`. Their active behavior is consolidated into the new dashboard/settings components.
- Added `frontend/test/owner-dashboard.test.mjs`; updated `frontend/scripts/browser-{workspaces,settings,setup,storefront,storefront-connected,checkout,tracking,payments}.mjs` for the new layout and retained business assertions.
- Added this document; updated `docs/README.md`, `docs/ui/ui_convertion.md`, and `docs/ui/workspaces-figma.md`. Pre-existing unrelated workspace edits remain untouched.

The [October26 imagery extension](restaurant-images.md) adds “Xem trang quán” to dashboard/settings, independent avatar content and a crop editor. It supersedes this document’s earlier cover-only frontend boundary for those controls.
