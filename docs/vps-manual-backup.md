# Manual VPS recovery backup

## Authority and purpose

The user requested a complete manual backup of the existing academic VPS before its announced full-data reset at 00:00 November 1, 2026 (Vietnam time), also covering an unexpected server failure. User approved a brief maintenance window and encrypted Google Drive storage. Large archives must not remain permanently on the Mac. GitHub Actions, recurring backups, retention deletion and a live restore are outside this operation.

Unlike the [Mac SQL backup](mac-backup-verification.md), this recovery point must capture actual VPS data and the matching assets, secrets and application artifacts. The owning [recovery contract](deployment.md), [migration rules](data/migration-plan.md) and [DEC-11 proposal](infrastructure-recovery-proposal.md) still govern restoration and recovery-gap reconciliation. A single manual snapshot does not establish operational RPO/RTO or commercial readiness.

## Manual tools

```sh
# Use the CURRENT session UUID from the school portal, not an expired SSH profile value.
python3 ops/recovery/backup-vps.py --session CURRENT_PORTAL_UUID
# Both passwords are prompted with echo disabled; never put credentials in commands or Git.

# If capture succeeded but transfer was interrupted, resume the SAME private receipt.
python3 ops/recovery/backup-vps.py --session CURRENT_PORTAL_UUID \
  --resume /private/tmp/hlf-vps-backup-EXAMPLE/receipt.json

# Restore the uploaded recovery point into NEW owned resources on the Mac.
python3 ops/recovery/verify-vps.py /private/tmp/hlf-vps-backup-EXAMPLE/receipt.json

PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s ops/recovery -p 'test_vps_backup.py'
```

Prerequisites: existing SSH gateway configuration/host trust, current portal allocation, VPS sudo/Docker access, Mac Docker running, age/age-keygen/rclone, the existing protected age-identity settings, and the already configured `hlfdrive:` remote. No original age private key or Drive OAuth credential is transferred to the VPS. The Drive backup directory is private by default; no public download endpoint or sharing grant is created.

## Contents and consistency

- Inspect the four known containers and exact mounts. Refuse unexpected database scope, unowned nginx route, wrong MySQL version, enabled database jobs or insufficient source space. Current sources are `test_hlf_demo` on `hlf-mac-copy-mysql` and legacy `cse3045` on `hlf-mysql`; preserve them separately.
- Save actual container configuration/environment, bind-mounted database secret, database user definitions/grants, nginx configuration, optional existing Let's Encrypt configuration and legacy backend service definition. These contain secrets and belong only inside encrypted archives.
- Briefly enable the owned nginx maintenance route; stop current API/storage and the legacy backend service if active. Database containers stay running. All captured rows remain unchanged; no migration, reset, seed, credential rotation or quota reset runs.
- While writers are frozen, capture logical SQL, deterministic schema/all-row hashes for every table, current object/vault archives (including tombstones), current frontend files and manifests. Compare source data before/after. Capture failure attempts service recovery; unknown external nginx edits are never overwritten.
- Resume services and check catalog200/anonymous401 before transfer. Keep the root-only recovery staging directory for retry until offsite restore verification passes.
- Stream the snapshot and exact running application/MySQL/storage images through authenticated SSH into age encryption on the Mac. Upload ciphertext to `hlfdrive:HLF-Backup-VPS/<UTC-time>-<UUID>/`. Read each Drive file back and compare its SHA256. Resume never silently takes a newer recovery point or replaces a previously verified archive.

Main files: `snapshot.tar.gz.age` (SQL, media, vault, secrets/config and frontend) and `images.tar.gz.age` (exact immutable running Docker images). The age identity is the decryption dependency; do not lose it. A Drive ciphertext copy alone is not usable without that key.

## Verification and failure handling

The verifier reads the actual Drive files, decrypts/authenticates them, checks captured file hashes, and loads the actual recovered image archive. It creates uniquely labeled disposable volumes, an internal Docker network and MySQL9.2.0, without published ports. It restores both databases and compares every table's schema, exact logical row dump and row count.

It restores object/vault volumes and frontend and checks their original bytes. It recreates restricted application users, starts the exact recovered storage/backend with outbound network isolation, disables AI/email in the verification environment and checks public catalog200/anonymous401. Read-only probes decrypt retained private payloads and Admin MFA secrets and read objects through S3 without returning their content. Original backup configuration remains unchanged. No live login, OTP consumption, order, payment or provider call is performed.

Only uniquely labeled resources created by this verification are removed. Failed verification preserves protected evidence for diagnosis and must not be reported as a usable complete recovery backup. After PASS, remove this run's plaintext scratch tree and large local encrypted transfer copies. Preserve the small receipt, decryption identity and recovery instructions. Never remove pre-existing local databases, images in use, original backups or retained source volumes.

## Recovering after a server reset

This is a manual operator procedure for an explicitly selected replacement server, not permission to overwrite a surviving server. First recover the small receipt/runbook, existing age private key and the two Drive archives. Decrypt on a trusted Mac; never paste key values, environment files or SQL into chat or GitHub. Check recorded hashes and run the isolated verifier before authorizing live recovery.

1. Confirm the target is empty and has enough disk/memory, Docker and nginx. Refuse pre-existing same-name databases/volumes or an unrelated website. Confirm the school's new SSH allocation, origin routing and public hostname; server-side archives cannot recreate portal/DNS/Cloudflare access that is managed elsewhere.
2. Load the verified image archive with Docker. Use immutable IDs from `manifest.json`, not newly pulled mutable tags. Create the recorded database/object/vault volumes. Restore the database root-secret bind file from encrypted `config/`, using its original mode0600 path from `containers.json`. Never expose the SQL port publicly.
3. Start the application database using its captured MySQL9.2.0 image, original root-secret-file configuration and named SQL volume. Keep database event execution disabled until reviewed. Restore `test_hlf_demo.sql.gz` only into this newly created database server. Recreate the restricted users from `config/hlf-mac-copy-mysql-users.json`; skip root definitions because the new server already has its selected root identity. Decode the MySQL batch transport escaping exactly once using `batch_unescape` in the packaged verifier before applying each non-root CREATE USER and GRANT statement. Raw batch-escaped user definitions are not executable SQL. Do not run Prisma migrations against the recovery snapshot automatically.
4. Restore `cse3045.sql.gz` into a separate newly created legacy MySQL server/volume, with its captured environment and credentials. Keep the legacy backend stopped until explicitly needed. Its database is protected by this backup; old backend application binaries are not part of the current demo recovery image.
5. Restore `objects.tar.gz` and `vault.tar.gz` into the new named volumes using a root helper container. Preserve owner/mode and deletion markers. Restore `frontend.tar.gz` under the original frontend parent recorded in the manifest. Restore the selected nginx tree and any captured local certificate material, preserving legitimate original symlink targets.
6. Create the storage and API containers from captured image IDs and environment, with original mounts/security/resource settings. Both share the application database container's network namespace, keeping SQL/S3 loopback-only. The known deployment publishes only host-loopback14300(API) and13307(SQL). Create a separate recovery runtime environment copy with AI and SMTP disabled initially; retain the untouched original protected configuration for later review.
7. Verify SQL/asset hashes, restricted DB permissions, payload/MFA decryption, frontend files and API reads. Validate nginx before changing/reloading its route. No real OTP/login/write is required for the read-only data integrity checks.
8. Reconcile transactions, receipt/refund obligations, erasure/deletion requests and AI quota facts that may have occurred after the recorded recovery point. A manual backup contains no independently current post-snapshot journal. If freshness is unknown, keep affected processing/AI disabled and resolve with the operator before reopening writes; never revive erased data or blindly replay uncertain requests.
9. Reopen traffic only after the explicit live-recovery decision. Confirm public HTTPS and then authorized account/owner/Admin journeys. Keep the old archive and evidence; do not overwrite the recovery point during repair.

## Evidence

[October27 receipt](evidence/vps-backup-20261027.json) records **PASS** for actual VPS capture, ciphertext upload/readback and isolated restore. Recovery point: **October27 at10:38:59 Vietnam** (`2026-10-27T03:38:59Z`). Application DB:65tables/1873rows; legacy DB:5tables/25rows. Snapshot:14650877bytes; images:492538715bytes (about507MB combined, before small recovery tools/receipts).

Full schema/every-row comparisons passed for both databases;262frozen object-volume files,55vault files and all frontend files restored byte-for-byte. The exact recovered backend served catalog200/anonymous401 with restricted source credentials. Read-only probes decrypted49private payloads and1Admin MFA factor and retrieved223S3objects. MinIO's live metadata/file counts can change while running;262is the actual frozen snapshot count, not a claim about its later live directory.

The archive is in `hlfdrive:HLF-Backup-VPS/20261027T033841Z-ad672564-0953-4dde-af4a-37f55a758a5d/`. The transfer was entirely authenticated SSH/Drive with no public endpoint. Eight scoped Python tests, syntax checks, local documentation links and diff checks passed. The first capture refused a legacy scheduler setting despite no enabled events; a subsequent capture hit batch-user-definition handling and restored services. The final frozen capture succeeded; transfer resumed that exact point without another maintenance window. Verification caught MySQL batch escaping in stored user definitions; decoding it once restored the original restricted credentials successfully. Failed and successful attempts are not conflated.

The old Drive files were Mac SQL snapshots only (62tables/203rows, October23); readback/hash/decryption still passed. The newer Mac-only October24 snapshot (62tables/438rows plus209objects/9vault files) was readable but had not been uploaded. Live VPS comparison found new tables/rows and assets absent or different in older backups. Those older copies were preserved.

No automatic refresh occurs: data created after this recovery point requires another manual backup. Restoring the running application on the live replacement VPS, public ingress/TLS recovery and authenticated browser journeys remain NOT RUN. Independent/offline custody of the age private key remains NOT VERIFIED; preserve the existing Mac key/settings. This receipt does not accept operational zero-data-loss, V0.9 or commercial release readiness.
