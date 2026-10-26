# Local COD startup/proxy repair — October 25, 2026

Scope: the user reported502 responses for auth self, restaurant4, dish11 and public categories on localhost:5173 after the COD implementation. This follow-up authorizes the necessary retained-local repair; it does not deploy to VPS or certify a release.

## Root cause and repair

Vite remained listening on5173, but its backend upstream3000 had no listener. The Nest watcher log explicitly failed the startup gate because required migration20261025010000_cod_ordering was absent. The local hlf_dev_flow database on loopback3307 had32completed migrations, ending at checkout_vouchers. The preceding implementation's disposable tests did not adopt this retained database.

Stopped only the identified failing Nest watcher, verified a protected full backup and restore, rehearsed the exact COD forward migration, rechecked the source and applied that same migration locally. Restarted npm run dev with the existing backend configuration; Vite was left running. The runtime gate remains enforced. No application source change was necessary.

## Preservation and adoption evidence

- Verified Oracle MySQL Community Server9.2.0 and all32prior repository migration checksums.
- Full SQL backup is stored in a0700directory with0600files, including routines/events/triggers and binary values. Restored into new disposable MySQL9.2.0 database test_cod_retained_repair_*. Original row fingerprints matched before rehearsal.
- Rehearsed COD migration on that clone, checked the expanded enum and startup gate, and compared every original column/row across all64business tables.
- Immediately rechecked original data, previous checksums and candidate SQL hash before retained adoption. After adoption, all original business row counts/content hashes remained unchanged; all33completed migration checksums matched.
- Runtime-account startup gate passed. No additional grants were required. No reset, seed, credential replacement, historical status/money rewrite or applied-migration edit occurred.

Protected receipt: /private/tmp/hlf-cod-local-repair-gZTyjM/evidence.json. Backup, connection state and logs remain private in that directory and are not committed. The restoration/rehearsal happens on a separate disposable database; the original local database is never replaced.

## Actual runtime verification

| Check | Result |
| --- | --- |
| Backend listener | PASS — npm run dev starts backend3000 after the migration |
| Actual5173proxy public reads | PASS — restaurant4, dish11, categories and pickup points200 |
| Anonymous protected reads | PASS — auth self/orders401 rather than502 |
| Existing signed-in Chrome tab | PASS — reloaded the exact /restaurants/4 page from the screenshot; restaurant and3menu dishes rendered; existing one-item cart remained |
| Native Chrome network | PASS — auth self, restaurant, categories, dishes, notification summary/list200/304; no continuing502 |

Navigation cancellation entries were followed by successful responses and are not gateway failures. No password/cookie/private response export or order/payment mutation was used for verification. Preservation comparison precedes ordinary browser reads that may write their existing read-audit/mailbox metadata.

Full application suites are NOT RUN again because this repair changed no application code; [COD verification](cod-verification.md) records75backend units,9HTTP E2E,23real-MySQL integrations, frontend checks and five synthetic Chrome suites separately. Actual retained checkout mutations, external payments, real delivery and VPS/production deployment remain NOT RUN.
