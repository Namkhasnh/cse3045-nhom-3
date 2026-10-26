# Local login/proxy repair — October 25, 2026

Scope: the user reported login failure with502 responses on `localhost:5173`. This follow-up repairs the existing local runtime; it does not deploy to VPS or certify checkout acceptance on retained data.

## Root cause and repair

Vite was running, but its upstream `127.0.0.1:3000` had no listener. Retained MySQL lacked `20261025000000_checkout_vouchers`, while the backend startup compatibility gate required that migration and its columns. Consequently authentication and catalog requests both returned502 through the proxy. Disposable checkout tests from the preceding implementation did not establish readiness of this retained database.

Applied the reviewed forward migration to the identified local `hlf_dev_flow` database on loopback3307, then restarted the identified Nest dev watcher. Kept Vite running. The startup gate remains enforced; no application source change was needed for this repair.

## Preservation evidence

- Verified MySQL9.2.0 and all31prior migration checksums before adoption.
- Created a full protected SQL backup, restored it into a fresh isolated MySQL9.2.0 database and rehearsed the exact migration there.
- Rechecked source contents and migration checksum before adoption. Original column values and row counts/hashes across all62business tables are unchanged after adoption. Historical order discounts default to zero with null voucher snapshots.
- Verified32completed migration checksums and the runtime schema gate through the existing runtime account.
- Added only the reviewed new-table grants: voucher SELECT/INSERT and UPDATE of active/version, plus redemption SELECT/INSERT. Voucher economics remain non-updatable by runtime credentials.
- No reset, seed, credential replacement, historical money/status rewrite or applied migration edit occurred.

Protected receipt: `/private/tmp/hlf-checkout-local-repair-FyyiWE/evidence.json`. Backup, restore/rehearsal logs and private operator state stay in that0700directory with0600files; credentials and SQL data are not committed.

## Runtime verification

| Check | Result |
| --- | --- |
| Backend startup | PASS; Nest successfully listens on3000 after restart |
| Actual5173proxy public reads | Restaurants, dishes and pickup points200 |
| Actual5173proxy anonymous protected reads | Auth self, orders, notifications and Admin vouchers401, rather than502 |
| Native Edge existing login | PASS; submitted the already filled local login form and reached `/cart` |
| Native Edge signed-in network | Auth self200; restaurant/dish200/304; pickup points and notification list/summary200 |
| Native Edge rendered page | Existing cart and quantities retained; no order submitted |

The HTTP sweep also tried two incorrect route names and received404; those are not claimed as coverage. Browser network showed aborted requests during navigation followed by successful requests, not continuing gateway failures. No cookie/password/private response export was used.

Full application suites are NOT RUN again in this follow-up because no application code changed; [the preceding checkout evidence](ui/checkout-verification.md) records those checks separately. Retained order/payment/voucher mutations and VPS/production deployment are NOT RUN. The normal successful login creates its ordinary session/audit facts after the preservation comparison.
