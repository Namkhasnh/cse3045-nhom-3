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

## Local image outage — October27,2026

Public catalog requests succeeded, but existing cover/avatar endpoints returned503. The configured local storage endpoint was loopback43317; its existing MinIO container `hlf-v04-test-minio-1` had exited with code0. The storage adapter converts failed object reads to503. The image metadata in MySQL alone cannot serve the stored image bytes.

Recovered with `docker start hlf-v04-test-minio-1`, preserving its existing `/data` volume and bucket configuration. No source, schema, object or credential changes were needed. MinIO readiness returned200; cover3 returned200 directly through backend3000, and avatar4 plus dish images2/3/4 returned200 with image content types through Vite5173. Why the container was stopped was not established; its restart policy was `no` and was left unchanged.

Browser reload/visual confirmation: NOT RUN to completion because the active Edge window was being used concurrently. Application suites: NOT RUN for this runtime-only recovery. Reload the local storefront to retry image elements that previously failed; the React DevTools message and browser lazy-image intervention are informational and do not cause these503 responses.


## Login regression from an unfinished account-profile draft — October27,2026

While preparing personal-account avatar/email changes, an incomplete Prisma schema/client was generated in the active backend checkout before its forward migration had been reviewed/adopted. Login's full account lookup then failed withP2022 (missing columns). No retained migration or account-data change had been performed.

Recovery moved only that new unapplied migration and schema draft into `/private/tmp/hlf-profile-incomplete-se2w95pq`, restored the previously matching schema and regenerated Prisma Client. The existing Nest watcher recompiled and restarted successfully. Read-only checks passed for the runtime schema gate and the same full account projection used by login. Routed anonymous `/auth/me` returned401 and public catalog200. No password was guessed, session minted or retained data changed. An actual successful password/MFA login remains user verification; these read-only checks do not claim that journey.

Resume the profile feature in an isolated checkout until its schema, code, forward migration and evidence are ready together; do not regenerate an incompatible client in the active runtime.

The personal-account feature was subsequently completed in isolation and adopted only after explicit backup/restore approval on October28. See [profile identity and adoption evidence](profile-identity.md#retained-local-adoption--october282026); its schema and runtime now match.
