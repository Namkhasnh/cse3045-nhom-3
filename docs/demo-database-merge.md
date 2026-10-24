# Demo database merge — October 24, 2026

Authority: the user explicitly approved merging the retained Mac fork into the SSH academic demo, keeping SSH versions of shared records, importing verified local orders/finance and archiving confirmed demo targets. [Migration policy](data/migration-plan.md) remains authoritative. This is an operator operation, not a public API or commercial release.

## Scope and source custody

`ops/merge/prepare.mjs` accepts a verified protected Mac backup and the original October23 common ancestor. Both SQL snapshots are restored on disposable MySQL9.2.0, and current local data must still match the recovered source. `check-source.mjs` repeats the read-only freshness check before delivery.

Shared primary keys are identified through the common ancestor, rather than assuming independently created equal IDs represent the same record. Existing SSH records win. New local IDs are translated throughout live foreign keys and saved operation results. Accepted historical JSON snapshots and proposal payloads retain their original source identifiers; the protected manifest records their origin. New identities, missing common roots, owner capacity conflicts, unique conflicts and unmapped references block the whole import.

No existing SSH account credentials, Admin authority or MFA data are replaced. Shared local account exports contain only identity comparison fields. The payload excludes local MFA secrets, original backup identity and runtime configuration. It contains protected business rows, media and only needed personal-vault keys/deletion markers. Treat it as private even while encrypted.

## Verified behavior

- Inserts preserve exact integer VND, fixed-scale decimals, timestamps, events and history; no business operation creates orders or recalculates stored finance.
- Existing database constraints remain enabled. Saved original actor/operation/key/hash semantics survive; result IDs are translated.
- Object/key collisions require identical content. Tombstones block revival. Staging occurs outside the SQL transaction and may leave unreferenced staged assets after failure; no retained asset is overwritten or deleted.
- Confirmed sample accounts are suspended, sample restaurants deactivated, sample dishes hidden/unavailable and two sample pickup points disabled through existing workflows inside the import transaction. Existing history remains.
- Readiness derives from current approval, location, point versions and policy. Retiring sample points can stop an existing restaurant from accepting orders. No survey or approval is invented.

## Tooling and checks

Run from the repository root. Private output paths belong under `/private/tmp/hlf-merge-*`; never commit snapshots, manifests with rows, ciphertext unlock keys or payloads.

```sh
node --test ops/merge/*.test.mjs
node ops/merge/check-source.mjs /private/tmp/hlf-merge-EXAMPLE
node ops/merge/probe.mjs /private/tmp/hlf-merge-EXAMPLE
node ops/merge/package.mjs /private/tmp/hlf-merge-EXAMPLE
```

Preparation requires the explicitly selected protected backup argument. Docker/network/socket access may need the workstation sandbox escalation. `probe.mjs` creates only labeled disposable resources, restores the genuine ancestor, adds a synthetic independent SSH fork, and exercises ID collisions, full import, early/late injected rollback, concurrent single commit, replay, exact totals/base commission and private-payload decryption. This is not evidence about current server rows.

Snapshot comparisons normalize MySQL integer/Decimal/date representations across MariaDB and Prisma. Tests cover exact money beyond JavaScript safe integer range and `DEFAULT_GENERATED` timestamps, which must still be imported.

## Remote execution and recovery

`package.mjs` requires passing isolated evidence, hashes operator files and existing Linux images, then creates AES256GCM ciphertext with an independently held unlock key. Its optional second argument generates an SSH bootstrap for an explicitly authorized temporary HTTPS endpoint. The bootstrap checks ciphertext hash/authentication, unpacks with the data filter and starts a systemd unit independent of SSH.

`run.py` validates release labels, volumes, image identities, runtime configuration and nginx ownership. It first builds a read-only server manifest. Only a conflict-free plan enters maintenance. It then stops writers/storage, creates new SQL/object/vault recovery points, restores all three into isolated resources and rehearses the exact frozen manifest. Asset byte checks, injected rollbacks and replay/decryption/money checks must pass before one live transaction imports and archives demo records.

The transaction locks accounts first and records actor7 + `operator.database.merge` + run UUID + manifest hash/result in `setup_requests`; a concurrent repeat returns the same result. It verifies all existing history and real accounts remain unchanged. A maintenance audit event is recorded; the current audit UI safely redacts unknown maintenance actions.

On success, direct API checks and routed frontend/catalog/auth/asset checks pass before completion is reported. On a failure after freezing, maintenance remains active and the private `state/merge-state.json` distinguishes whether SQL committed. Do not restore an old dump over subsequent facts. Inspect the failure stage and transaction marker before preparing a forward repair. Do not blindly rerun the bootstrap or remove the state directory.

## Evidence boundary

Local isolated probe: PASS for collision mapping,158 imported rows including3 orders,4 referenced objects,3 private keys, early/late rollback, concurrent single commit and replay. These counts describe the tested fork fixture; the server generates a fresh manifest and may stop on drift/conflicts.

SSH application: **PASS**, completed2026-10-24 at06:19:28UTC (13:19:28Asia/Ho_Chi_Minh). The user supplied the completed systemd journal: fresh backup, exact-clone rehearsal,158 inserted rows including3 orders, preservation of existing SSH history, and demo archival. Independent HTTPS checks returned200 with1 public restaurant,2 dishes and2 active pickup points; sample IDs were absent and both imported public images matched source byte hashes. Native Edge displayed the imported restaurant/menu on the homepage. The temporary ciphertext endpoint and Cloudflare tunnel were closed. [Sanitized remote receipt](evidence/demo-merge-remote-20261024.json) records the manifest hash and protected server backup path. No authenticated buyer/manager mutation was performed during the public check.
