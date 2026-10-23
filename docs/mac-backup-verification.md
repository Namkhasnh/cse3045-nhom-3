# Retained Mac database backup verification

Date: October 23, 2026. User selected **protect Mac `hlf_dev_flow` first**, keeping VPS `cse3045` separate. This authorizes the recorded Mac backup/isolated restore, not migration, database merging, VPS upgrade, pilot or production release. [P29](progress/P29.md), [DEC-10/11](infrastructure-recovery-proposal.md) and [V0.9](progress/V0.9.md) retain their remaining gates.

## Executed local backup and restore

[Sanitized receipt](evidence/p29-mac-backup.json) records actual retained data, distinct from prior synthetic drills. [Backup tool](../ops/recovery/backup-mac.mjs) fixes its source to loopback3307/hlf_dev_flow and requires `--protect-hlf-dev-flow`; it verifies the expected Docker port mapping. Existing backend `.env` supplies credentials only in process memory; children receive an allowlisted environment. No URL, credential, key text or row payload is logged.

```sh
# Existing local age identity path is supplied privately; never paste key text.
HLF_BACKUP_IDENTITY='/path/to/existing/recovery.key' \
  node ops/recovery/backup-mac.mjs --protect-hlf-dev-flow --local-only
```

The tool confirmed actual MySQL9.2.0 and InnoDB tables. It inventoried schema/every row in a read-only consistent snapshot, ran the source container's9.2.0 `mysqldump --single-transaction --source-data=2 --no-tablespaces --set-gtid-purged=OFF --column-statistics=0 --routines --events --triggers`, then checked source fingerprints again. Existing container root credential is used only inside that container; never returned or passed as a password argument. Coordinate collection can briefly acquire MySQL's backup consistency lock; no source table writes, rotation, purge, migration, credential change or restart.

SQL, manifest and migration metadata are bundled/gzipped in memory and encrypted with age to the public recipient derived from the user's existing key. Plaintext SQL is never persisted. The private key is read by age locally; it is not copied/uploaded. Unlike prior ephemeral-RSA drills, the age key remains with the user for future recovery. This does not establish independent/offline key custody.

Encrypted output and evidence are under `~/Library/Application Support/HLF Backup/full-ozRCYs/`, a0700 directory. Evidence/readback files0600; age ciphertext has0644 file mode within the private0700 parent. The backup directory and ciphertext remain after the run. No reset or retention deletion was performed.

A new labelled MySQL9.2.0 container with a random loopback port and event scheduler OFF received decrypted SQL into new `test_mac_restore`. No application was started. Every table's canonical schema hash and every row's hash compared equal; all28applied migration checksums matched source migration files. Source was fingerprinted again after verification and remained unchanged. The temporary container was removed only after checking its unique label.

| Actual result | Value |
| --- | --- |
| Full SQL restore | **PASS**,62tables/203rows/28migrations |
| Exact schema/all-row fingerprints | **PASS**, limited normalization of redundant explicit utf8mb4 declarations |
| Source unchanged across backup/validation | **PASS** at recorded run times; no assertion about later app activity |
| Encrypted size | 60,188bytes |
| Ciphertext SHA256 | `7b2a6a4ac2cd0302917a579fa4cd54617efb1a5385c887157bbfa3272eb1a163` |
| Independent offline key recovery | **NOT RUN — user deferred USB step** |
| Automated Mac/VPS backup | **NOT CONFIGURED** |

Matching database contents includes the stored AI usage facts at the snapshot; it does not grant permission to restore an old counter into live use. Before starting a restored app/AI, reconcile current counters/leases, erasure/holds/journal and external receipts under DEC-11. Media/private object stores and external encryption secrets are **not included** in this SQL-only backup.

## Offsite authorization and read-back

Automatic approval review initially rejected the combined dump/upload command because selecting the source alone was insufficient explicit authorization for sensitive retained payload transfer to the exact Drive destination. The rejected command did not execute. The independent local-only backup/restore then passed.

User subsequently explicitly selected **“Cho phép upload bản mã hóa này”** for the60,188byte restored archive and the exact destination `hlfdrive:HLF-Backup-Mac/full-baac28f2-d2e7-49ff-8550-925401200c8b/database.json.gz.age`. This approval covers that ciphertext/read-back, not a blanket authorization for future uploads, schedulers, public sharing or other destinations.

[Uploader](../ops/recovery/upload-verified-mac.mjs) accepts an explicit approval flag and only a protected Mac backup directory with a PASS receipt. It checks original ciphertext bytes/SHA256, restricts the Drive namespace, uploads only `database.json.gz.age`, downloads it and checks SHA256 again. It decrypts the downloaded copy in memory and verifies format/source/manifest totals; no new dump, source write or key upload. The read-back matches the exact encrypted bytes already restored on9.2.0. Actual offsite result/times are in the linked receipt; do not infer success from the approval itself.

```sh
# Only after explicit approval of the exact archive/destination.
HLF_BACKUP_IDENTITY='/path/to/existing/recovery.key' \
  node ops/recovery/upload-verified-mac.mjs --upload-approved \
  "$HOME/Library/Application Support/HLF Backup/full-ozRCYs"
```

## Verification and remaining gates

Node syntax and ops ESLint PASS. Actual local full restore PASS as above; Codex self-review only. Application suites NOT RUN because application source/behavior was not changed. No Gemini request/quota reset, existing test-container mutation, VPS action, migration, real order/payment, pilot or release.

This protects one SQL recovery point only. Continuous encrypted binlog shipping, approved automatic schedule/retention/expiry/alerts, unattended OAuth, independent key recovery, media/vault/journal recovery, app login/MFA/key replay/new order after restoration, incident reconciliation and measured common-point RPO/RTO remain unconfigured/unverified. A sleeping Mac cannot continuously produce recovery points. **P29/P30 and V0.9 remain BLOCKED / NOT ACCEPTED.**

## Manual end-of-session backup — October 23 continuation

User requested implementing the development workflow after clarification that Mac need not remain powered on, then confirmed Google Drive as destination. [One-command runner](../ops/recovery/backup-to-drive.mjs) performs a new local-only age backup/isolated full restore first, then invokes the restricted ciphertext uploader/read-back. Source and destination remain fixed to Mac `hlf_dev_flow` and `hlfdrive:HLF-Backup-Mac`; no VPS action, scheduler, retention deletion, sharing or automatic upload on machine wake/shutdown.

Run from repository root after a work session or before a significant change, with Docker running:

```sh
node ops/recovery/backup-to-drive.mjs
```

Initial setup uses `--identity /path/to/existing/recovery.key`. After a successful run, only the key **path** is remembered in0600 `~/Library/Application Support/HLF Backup/settings.json`; key content remains in its existing location and is never copied/uploaded. Any manual invocation creates a fresh encrypted recovery point, verifies all local rows/schema in an isolated9.2.0 target, then uploads/read-backs only its ciphertext in the fixed Drive namespace. A local restore failure stops upload; transfer/read-back failure produces a failing exit status. Existing backup copies are preserved. Terminal success explicitly states the Mac may be shut down after completion.

This is a user-triggered development backup workflow, not a15minute operational recovery guarantee. Close pending edits/avoid concurrent application writes during its short verification window; if source fingerprints change, it fails safely and should be retried later. Do not interrupt a running backup by putting Mac to sleep. Media/external vault and current erasure/AI counter reconciliation remain outside its SQL-only scope. Actual current end-to-end result is stored in [manual-run receipt](evidence/p29-mac-manual-backup.json); earlier exact one-file approval above remains historical. V0.9 stays BLOCKED / NOT ACCEPTED.
