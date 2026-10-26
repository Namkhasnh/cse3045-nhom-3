# Local restaurant avatar adoption — October26,2026

Scope: user explicitly approved backing up/restoring and updating the existing localhost database after the [cover/avatar implementation](ui/restaurant-images.md). This is retained-local adoption only; no VPS deployment or release approval.

## Backup and preservation

- Confirmed the existing runtime source is `hlf_dev_flow` on loopback3307, Oracle MySQL Community Server9.2.0.
- Verified all33previous migration checksums against repository SQL and confirmed avatar is the only pending migration.
- Saved a full SQL backup with routines/events/triggers and binary values in a0700directory with0600files. Credentials, SQL and private state are not committed.
- Restored into a new, separate MySQL9.2.0 database `test_avatar_retained_restore_*` in the existing isolated test container on43316. Original column/row fingerprints matched across64business tables.
- Rehearsed `20261025020000_restaurant_avatar` on that clone; every original column/row remained unchanged, historical avatars initialized toNULL, and the runtime schema gate passed.
- Immediately rechecked original data and candidate SQL hash before retained adoption. Following adoption, all64business-table fingerprints remained unchanged and all34completed migration checksums matched. Existing cover references and historical business facts were preserved.

Protected backup/receipt directory: `/private/tmp/hlf-avatar-local-adoption-wrkTw9`; sanitized completion receipt is `evidence.json`. Private connection state, SQL and operation logs remain there. The original local database was not replaced.

## Adoption and runtime

Stopped only the identified failing Nest watcher; Vite remained running. Applied the reviewed forward migration, then added runtime `UPDATE` permission for `restaurants.avatar_media_asset_id` only. Confirmed that permission inside a rolled-back no-op update and checked the runtime schema gate through the existing runtime credentials. No reset, seed, credential change or applied-migration rewrite occurred.

The first operator script invocation completed the migration and preservation check but stopped before the GRANT because it called an unavailable module-level escaping function. Corrected the temporary script to use the connection's escaping function, rechecked all original data/checksums and reran the idempotent deploy before completing the exact column grant. No data repair or additional schema mutation was required.

Restarted the existing backend dev workflow with the same environment; backend3000 now listens normally. Its protected log and watcher PID are in the receipt directory. An initial browser refresh during startup saw a temporary unavailable response; the post-start reload succeeded.

## Actual checks

| Check | Result |
| --- | --- |
| Runtime startup/schema gate | PASS through existing runtime account |
| Vite proxy public restaurant/list |200; restaurant DTO includes nullable avatar |
| Anonymous auth self |401, expected protection rather than502 |
| Existing signed-in Edge session | Preserved on post-start reload |
| Owner dashboard “Xem trang quán” | Clicked; reached restaurant4's existing public customer page |
| Public restaurant | Existing cover and3menu dishes render; missing avatar is honestly labeled |
| Owner settings | Current profile/cover render, separate3:1cover and1:1avatar pickers and storefront link are present |

Actual verification made no profile/image/order/payment mutation. Synthetic pixel/pointer/keyboard/upload/persistence evidence remains in the [implementation self-check](ui/restaurant-images.md#executed-self-check). Application suites were not rerun for this operational follow-up because no application source changed. VPS/production adoption remains NOT RUN.
