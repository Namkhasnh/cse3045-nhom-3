# Academic demo COD update — October 25, 2026

Authority: the user requested deployment of the current local code to the existing VPS and explicitly selected **code + schema only, preserving VPS data**. The user will run the prepared commands in their authenticated SSH session. No local business database, media, credentials or sample records are imported. This updates the existing academic demo, not P35/commercial acceptance.

## Candidate and preservation

`ops/demo/prepare-update.mjs` builds the current working tree through the allowlisted Docker context, records its source fingerprint and Git base separately, verifies no source drift during builds and exports Linux/amd64 backend/schema images plus frontend. Environment files, local databases and operator secrets are excluded. AES256GCM protects delivery; the generated delivery key is separate.

`ops/demo/update.py` verifies the original release/container/volume/environment ownership and the completed October24 full/frontend update route. Unknown route edits or migration checksums stop execution. Server SQL, object and vault volumes and existing runtime keys stay in place.

Expected pending migrations on the recorded October24 server:

- `20261024020000_owner_analytics`: index only.
- `20261024030000_order_codes`: add unique public codes to existing orders; retain IDs and all old columns.
- `20261025000000_checkout_vouchers`: zero-discount/null-snapshot defaults and new empty voucher/redemption tables; preserve historical payment and signed ledger facts.
- `20261025010000_cod_ordering`: extend enums/checks without reclassifying old payment methods/statuses.

The previous storefront migration is also allowlisted for a target where it is still pending. All other missing, modified, unfinished or unknown migrations require inspection.

## Execution and recovery

A bounded maintenance window stops API/storage writers. The operator creates protected SQL/object/vault backups, restores SQL into disposable MySQL9.2.0, compares every original table/schema/row fingerprint, restores and compares asset bytes, then rehearses the exact migration chain. Every old business column and row must match after rehearsal; only the reviewed schema expansion and generated order codes are accepted. New voucher/redemption tables remain empty. Migration and narrow storefront/voucher grants are then applied to the retained VPS database and checked again.

The prior API container and frontend assets remain available. Only static frontend files become web-readable; state, backup and operator artifacts remain private. Routed frontend/asset/catalog/auth checks must pass. No reset, schema push, seed or old-dump restoration is performed.

Application rollback never rolls back data. An unfinished/unverified migration keeps maintenance active for forward repair. A verified expansion may restore the previous app only after freezing writers and proving there are no new COD/discount/subsidy facts incompatible with the old readers. Once those facts exist, keep maintenance and repair forward. Prepared candidate: `/opt/hlf-update-20261025-c4c7172`; protected recovery evidence is in its `state` directory. Release-specific application rollback is `sudo python3 /opt/hlf-update-20261025-c4c7172/update.py --rollback`; do not reuse an older rollback script or blindly rerun a failed release.

[Sanitized preparation receipt](evidence/demo-cod-update-20261025.json) records artifact identities and evidence boundaries.

## Verification status

- PASS backend lint,76unit tests,9HTTP E2E tests and build; HTTP listener tests reran with the required sandbox access after the initial loopback EPERM.
- PASS Prisma schema validation/generation.
- PASS frontend lint/build and25unit cases across orders, baskets, vouchers and owner orders. Existing Vite chunk-size advisory remains.
- PASS15operator Python tests, including refusal after new COD facts, missing-new-container recovery and unverified-migration refusal; Node syntax and scoped ESLint.
- PASS Linux/amd64 images and authenticated exact-archive delivery decryption; candidate `20261025-c4c7172`, Git base `a53a150` with recorded working-tree fingerprint. Ciphertext492700887bytes; no local data/env/unlock key in archive.
- PASS disposable MySQL9.2.0 full SQL restore/schema/row comparison, four-migration chain, original QR/cash/zero-total history/key preservation, positive/negative runtime grants, repeat and deliberate row-drift rejection. Exact Linux backend serves catalog/categories200and anonymous401using the restricted account.
- Delivery READY: user approved temporary Cloudflare ciphertext endpoint; HTTPS HEAD200with492700887bytes and bootstrap shell syntax PASS. The user must execute the prepared script in the authenticated SSH session; direct agent access through the interactive SSH gateway is unavailable. Remote download/deployment: PASS by the user-provided completion journal below; authenticated VPS browser journeys: NOT RUN.

[Previous deployment](demo-deployment.md), [previous in-place update](demo-update.md), [COD behavior evidence](cod-verification.md) and [migration policy](data/migration-plan.md) remain the owning context. Scheduled VPS backups remain NOT CONFIGURED in the recorded deployment; this update prepares a manual pre-change recovery point.

## Remote completion and independent verification

The user supplied `PASS: authenticated update bundle` and systemd unit `hlf-demo-update-20261025-c4c7172.service`, invocation `da035c5d3a78418785114ff032db2847`. This proves authenticated transfer and launch, not migration/deployment completion. The approved temporary Cloudflare tunnel and loopback artifact server are CLOSED. The subsequent user-provided journal confirms start16:45:49UTC, protected backup16:45:54, isolated restore/rehearsal16:45:56, forward migration with original rows verified16:46:07and complete/PASS16:46:10UTC (23:46:10Vietnam), followed by successful service deactivation. The operator reports server DB/object/vault/key preservation. Protected backup and verification evidence remain in `/opt/hlf-update-20261025-c4c7172/state`.

Independent public HTTPS using curl: login200with candidate asset references, restaurants200(2public), dishes200(6public), anonymous auth self401and exact candidate JS/CSS SHA256matches. Python urllib requests received edge403; curl succeeded without any edge-setting changes. No authenticated VPS login/order/payment mutation or browser journey was performed. Local disposable evidence and user-provided server journal are distinct from these public reads.
