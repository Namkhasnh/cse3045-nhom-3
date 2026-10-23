# Synthetic recovery preparation — P29

Authority: [approved subset DEC-10/11](infrastructure-recovery-proposal.md); [P29](progress/P29.md). Independent local preparation while P29 is blocked, **not P30 acceptance**, staging evidence or retained-data authorization.

## Tools and reproduction

Run from repository root with existing backend lockfile dependencies, Node 24.21.0/npm 11.19.0 and Docker with the local `mysql:9.2.0` image. No package/service installation was needed.

```sh
node --test ops/recovery/archive.test.mjs
backend/node_modules/.bin/eslint --config backend/eslint.config.mjs ops/recovery/*.mjs
sh -n ops/inspect-vps.sh
node ops/recovery/rehearse.mjs
# Optional: existing user-selected Drive, encrypted synthetic archive only.
node ops/recovery/rehearse.mjs --drive-synthetic
```

[Rehearsal](../ops/recovery/rehearse.mjs) accepts **no DB URL/retained input**: creates a uniquely named/labelled MySQL9.2.0 container, random loopback port, three `test_*` DBs and explicit synthetic credentials. Child processes receive an allowlisted environment with AI disabled and only generated DB URLs. It never targets existing3307/43316 or imports their `.env` connection values. Cleanup verifies its container label before `docker rm -fv`; existing containers remain untouched. No `db push`, reset or applied migration edit.

Commands invoked inside the temporary target:

- `node scripts/bootstrap-empty.mjs`, then `node node_modules/prisma/build/index.js migrate deploy --config prisma7.config.ts` against new `test_empty`.
- `node scripts/verify-onboarding-upgrade.mjs` against new `test_upgrade`: existing synthetic legacy account/restaurant/menu/survey/order/base data, every original column preserved, historical unknown consent/survey facts retained as unknown, full forward chain.
- MySQL9.2.0 container's `mysqldump --single-transaction --source-data=2 --no-tablespaces --set-gtid-purged=OFF --column-statistics=0 test_upgrade`; root identity only in that disposable container, no concurrent writers/DDL.
- Encrypt full SQL plus synthetic media/key fixtures; read/decrypt/validate; restore using container `mysql` into separate `test_restore`; compare every table's rows and schema plus exact SQL money/base assertions and all applied migration checksums.

`--source-data=2` records coordinates; it does **not** prove increment shipping/replay or concurrent backup consistency. Full-backup start is the conservative local recovery timestamp. Logs/encrypted bundle/journal/DDL/evidence are0600 inside a0700 `/private/tmp/hlf-recovery-synthetic-*` directory. Recovery RSA keys are ephemeral in memory; these synthetic archives are deliberately not a retained operational backup.

[Archive library](../ops/recovery/archive.mjs): format/synthetic marker, path uniqueness/allowlist and SHA256 manifests; AES256GCM authenticated encryption, random256bit data key/96bit nonce, RSA3072OAEP-SHA256 key wrapping in rehearsal. Private key never enters archive. This demonstrates a standard cryptographic roundtrip, not audited production key management or sender identity. Payloads are memory-bounded only by the local process, so this format is unsuitable for production-scale streaming backups.

Reconciliation requires an independently preserved current journal, rejects stale journals and >15min/future recovery points, excludes tombstoned synthetic key files, preserves held fixture keys, takes exact BigInt maxima for known AI counter scopes and carries new scopes. Missing quota scope blocks recovery. Caller must independently establish journal authenticity/freshness; a JSON timestamp cannot prove that. The helper returns a restored synthetic manifest; it does not execute application vault deletion, SQL AI counter updates or reopening controls.

[Read-only VPS helper](../ops/inspect-vps.sh) can later run as `sh ops/inspect-vps.sh PROFILE`: existing SSH profile only, batch mode, existing known-host trust required. It prints allowlisted OS/resource/version/service/listen metadata and optional socket-only SQL settings; no env files, credentials, process arguments, logs or application rows. Do not disable host verification when access is missing. Actual SSH execution NOT RUN.

## Actual results and boundaries

The opt-in `--drive-synthetic` mode requires the already configured `hlfdrive:` remote. It accepts no remote/path/database override, uploads only its newly generated encrypted archive under a unique `HLF-Backup-Synthetic/database-drill-*` prefix, downloads it, checks the ciphertext SHA256, then decrypts/restores that downloaded copy into its disposable MySQL target. It never uploads the in-memory recovery key, plaintext SQL or independent journal. Remote ciphertext remains as a drill artifact; ephemeral-key destruction means it is not a usable retained backup. Missing remote, transfer or hash failure fails the run and still cleans up its labelled container. It does not configure Drive/OAuth, install tools or touch the VPS. Transfer timings are local interactive observations, not operational RPO/RTO.

[Durable sanitized receipt](evidence/p29-local-preparation.json) contains exact source hashes/versions, local run results/timing and public endpoint observations. It is synthetic-only and contains no real DB URL, key, row payload or contact.

- PASS: five crypto/manifest/erasure/quota failure groups, ops ESLint and shell syntax.
- PASS: actual SQL9.2.0, binlog ON, sync_binlog1, flush-at-commit1; new empty bootstrap/28migration full chain and synthetic legacy upgrade.
- PASS: encrypted full restore of62tables/43rows, including28migration rows; original schema/data hashes and migration SHA256 preserved; item/subtotal/fee/total/base rounding invariants hold for the synthetic order.
- PASS: media fixture bytes/hash, erased-key exclusion and held-key retention, synthetic counter100 carried without refilling. These fixtures never read/mutate the real Gemini allowance.
- First restore comparator reported schema differences. Protected raw-DDL comparison established all17 were redundant `CHARACTER SET utf8mb4` before an equivalent utf8mb4 collation; normalization is restricted to that syntax, preserving all constraints/types/values/auto-increment state. Corrected rerun passed; no SQL/application behavior was changed to hide a mismatch.
- NOT CONFIGURED: off-VPS destination/access/custodians, scheduler/retention/alerts, remote staging and durable operational vault/media adapters.
- NOT RUN in the original local-only run: offsite transfer/read-back, binlog replay/gap drills, scheduled daily/monthly jobs, actual vault/erasure/holds integration, nonempty request/history/receipt replay, app login/MFA/new-order restore journey, compatible-app rollback, CI/staging pipeline and measured operational RPO/RTO. Empty history/request tables are not replay evidence.

No application/CI/package/lockfile/schema/migration/config/guard changed. Existing backend/frontend suites are NOT RUN for this ops-only preparation; no application behavior was edited. [V0.8](progress/V0.8.md) remains the attributed accepted feature/live-provider evidence, not a new staging run. No VPS mutation, retained migration, real pilot/payment, paid service, Gemini request or quota reset.

## October23 offsite database drill

[Agent-executed receipt](evidence/p29-drive-database-drill.json): `node ops/recovery/rehearse.mjs --drive-synthetic` PASS with214884 encrypted bytes uploaded/read back in12.934s and identical SHA256; downloaded archive restored62tables/43rows, exact schema/data/migrations/money and erasure/held-key/media/counter checks passed. Full run35.338s; local simulated gap13.296s; decrypt/SQL/validation0.934s. Existing three container IDs unchanged after cleanup. Ephemeral recovery private key was never uploaded or persisted. This narrows the offsite synthetic full-restore gap only; scheduled continuous binlogs, offline custody and full operational RPO/RTO are still NOT RUN. VPS remains unchanged and P29/P30/V0.9 are unaccepted.

## October23 binlog and offline-copy continuation

[Focused procedure/results](recovery-binlog-verification.md) and [receipt](evidence/p29-binlog-recovery-drill.json) supersede binlog NOT RUN only for the local synthetic one-table probe with two encrypted binlogs read back from Drive. Existing full-schema checks still pass. Continuous operational shipping/schedule remains NOT CONFIGURED. Actual offline age-copy recovery remains NOT RUN; user-run verifier and disposable-key tests do not establish custody. V0.9 stays BLOCKED, unaccepted.
