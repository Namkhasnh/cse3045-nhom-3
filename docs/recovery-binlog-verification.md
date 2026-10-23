# Synthetic binlog recovery and offline key verification

Date: October 23, 2026. Authority: [DEC-10/11 approved synthetic subset](infrastructure-recovery-proposal.md), [P29](progress/P29.md) and [P30](progress/P30.md). **V0.9 remains BLOCKED / NOT ACCEPTED. Automatic VPS backup remains NOT CONFIGURED.**

## Reproduce the binlog drill

From repository root, using the existing local Docker/MySQL image, backend dependencies and `hlfdrive:` remote:

```sh
node ops/recovery/rehearse.mjs --drive-synthetic --binlog-synthetic
```

[Rehearsal](../ops/recovery/rehearse.mjs) creates and cleans up its own labelled disposable MySQL **9.2.0** container. No retained DB URL/input is accepted. [Binlog helper](../ops/recovery/binlog.mjs) runs inside that rehearsal only; it creates two additional `test_binlog_*` databases in the temporary container. No VPS connection, live rotation/purge, application mutation, secret upload, Gemini request or quota change.

The existing full-schema rehearsal remains separate: 28 migration checksums, 62 tables/43 rows and exact schema/data/money comparisons. The binlog case uses a clearly synthetic **one-table probe**, not additional application workflow coverage:

1. Create InnoDB probe rows with integer/decimal values above JavaScript's safe integer range. Dump with `--single-transaction --source-data=2`, retaining full-backup file/position.
2. Commit update/delete; rotate the disposable server's binlog. Commit an insert in the next log; roll back another insert. Record the end file/position at a committed transaction boundary.
3. Commit a further insert after that point, then close the second log. Capture both raw binlogs with SHA256 and full SQL in one authenticated encrypted bundle.
4. With `--drive-synthetic`, upload only that freshly generated ciphertext to a unique fixed synthetic Drive prefix, read it back and compare SHA256. Private RSA key remains ephemeral in memory, never uploaded. Ciphertext remains on Drive as an unusable drill artifact after key destruction.
5. Authenticate/decrypt and validate ordered complete increments. Missing, reordered or corrupted increments must be refused before replay. Restore full SQL; confirm that full-only state differs from the intended end state.
6. Run native `mysqlbinlog --verify-binlog-checksum --rewrite-db=... --database=... --start-position=... --stop-position=...` on the recovered files. Feed emitted SQL to the disposable MySQL9.2.0 target. Compare exact string values; require committed changes, rollback exclusion and exclusion of the after-cutoff transaction while the source retains it.

The stock local server image has no mysqlbinlog executable. Initial attempt failed with exit127; the temporary container was removed. Corrected execution uses existing Mac **mysqlbinlog9.5.0** and verifies replay on server9.2.0. This proves that observed tool/server pairing only, not an exact9.2.0 client or future compatibility. [Official mysqlbinlog documentation](https://dev.mysql.com/doc/refman/8.4/en/mysqlbinlog.html) explains that database rewriting precedes filtering and that positions apply to the first/last supplied files; actual run evidence owns this result.

[Sanitized receipt](evidence/p29-binlog-recovery-drill.json) records actual coordinates, bytes/hashes, versions, timing, checks and limitations. Missing/reordered/corrupt checks use independently retained in-process manifest metadata from the synthetic source; operational manifest authenticity, continuous chain discovery and custody remain unimplemented. No concurrent DDL/writer backup consistency claim, GTID failover, repeat replay/idempotency guarantee, actual app login/MFA/new order/financial recovery or operational RPO/RTO acceptance.

## Verify the user's real offline age copy

Status: **NOT RUN — deferred at the user’s request**. User reported `OFFLINE_COPY_NOT_READABLE`, then requested skipping the USB step. No successful offline decrypt/cmp or independent custody is established; do not request this step again unless the user resumes it. This deferral does not waive DEC-11 acceptance gates. Previous user-reported age encrypted-file roundtrip used local working material; it does not prove recovery from an offline copy. The RSA binlog drill cannot verify the user's age key.

Run locally, attach/unlock the intended independent copy, and keep paths/keys private:

```sh
sh ops/recovery/verify-offline-key.sh
```

[Verifier](../ops/recovery/verify-offline-key.sh) prompts for original local age identity path and independent offline-copy path. It rejects missing/unreadable material and the same file, symlink or hardlink. It derives the **original** public recipient, encrypts a fresh harmless synthetic file, decrypts using only the supplied copy and compares bytes. Private key values/paths are never printed or uploaded. Temporary synthetic outputs are removed on exit; original/copy keys are never modified. User should not run with shell tracing.

Report only `OFFLINE_COPY_DECRYPT_CMP: PASS` or a sanitized error, plus confirmation that the copy is independent of Drive/VPS and returned to offline custody. A distinct filesystem path alone cannot prove independent physical storage. A pass verifies this synthetic challenge, not recovery of a historical archive unless its recipient is also known to match. Do not delete/rotate the original based on this check.

Verifier tooling checks on newly generated disposable keys: matching distinct copy PASS; wrong copy fails; same file fails; missing copy fails. These tests **do not change the actual offline-copy status**. No user's private key was inspected by the agent. Operational custodian/backup custodian, access after workstation loss and key rotation remain DEC-11 gates.

## Acceptance boundary

Local synthetic binlog success is independent P29 preparation; P30 staging remains blocked by P29. Scheduler/retention/alerts/unattended OAuth, offsite continuity, operational media/vault/journal recovery, app replay, incident reconciliation and review remain open. Application suites NOT RUN: ops-only tooling, no frontend/backend application changes. Review is Codex self-review only. No pilot or production acceptance is inferred.

Validation: ops ESLint, both Node syntax checks, shell syntax, five archive test groups and four disposable-key verifier cases PASS. Documentation validation PASS485local paths/anchors,108Markdown files below500lines,15prior fingerprints unchanged; `git diff --check` PASS. New rehearsal containers removed; pre-existing exited recovery container preserved. Actual user offline-copy check remains NOT RUN.
