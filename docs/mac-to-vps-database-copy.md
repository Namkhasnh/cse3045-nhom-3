# Mac database copy into a separate VPS Docker server

Date: October23,2026. User explicitly selected transferring **all current Mac `hlf_dev_flow` data** to a new Docker DB on the existing VPS. This authorizes that source-specific copy, not overwriting old `cse3045`, application cutover, pilot or production release.

## Prepared and verified

[Sanitized receipt](evidence/p29-mac-vps-transfer.json) records a fresh encrypted Mac backup and a second rehearsal using the actual transfer importer: **62tables/203rows/28migrations**, exact canonical schema/all-row hashes and migration checksums PASS. Wrong transfer key and corrupt ciphertext refused. Source unchanged at backup checks; no source write, quota reset, app startup or remote operation. The new probe container/volume were label-checked and removed.

The package contains AES256GCM-authenticated encrypted SQL/manifest, importer, shell helper and locked pure-JS MariaDB dependencies. No npm install on VPS is required. No plaintext SQL, original age identity or backend `.env` is included. A separate one-time transfer key remains on the Mac; never paste it in chat. Archive SHA256 and all shipped file checksums are recorded; the original encrypted age backup remains independent.

This is a **snapshot from2026-10-23T09:58:21.913Z**, not replication. Writes after that snapshot are absent. No freeze/cutover or source switch is performed.

## User-run handoff through the existing SSH terminal

The Cloudflare command supports a user-authenticated selected shell; scp/SSH forwarding is not established. The generated paste script transfers only the encrypted package and public tooling through that existing session. Terminal paste/remote import is **NOT RUN**; local SQL importer rehearsal passed. The1.78MB paste script may take time to paste; its archive checksum is checked before extraction/execution.

1. In a **Mac** terminal, copy the generated transfer script:

   ```sh
   pbcopy < /private/tmp/hlf-db-transfer-CL3je1/paste-vps.sh
   ```

2. In the already authenticated **correct VPS** shell, paste and run. It creates a new private transfer directory, verifies/extracts the package and runs the import helper with sudo. Enter the VPS sudo password locally if requested. At the hidden one-time transfer-key prompt, leave that terminal waiting.

3. In another **Mac** terminal, copy the one-time transfer key, then paste it at that hidden VPS prompt and press Enter:

   ```sh
   pbcopy < /private/tmp/hlf-db-transfer-CL3je1/transfer.key
   ```

Only the locally generated transfer key is used here, not the original age identity. No key/password should be returned to chat. Alternatively transfer `hlf-db-transfer.tar.gz` through an authorized secure file channel, extract on the correct VPS and run `sudo sh run-import.sh` in its directory; the same separate key is needed.

## Target behavior

- New container `hlf-mac-copy-mysql`, new named volume `hlf_mac_copy_data`, MySQL**9.2.0**, database `hlf_dev_flow`; memory384MiB/cpu0.5, event scheduler OFF.
- Only host `127.0.0.1:13307` is published. Docker binding must succeed; a collision causes failure, not replacement. Existing target container or volume causes refusal before creation. Existing `hlf-mysql`/`hlf_mysql_data`/`cse3045`/3306, service3000 and Mac3307 are not targets.
- Requires existing Linux/Node24.22.0/Docker. It generates a root password on the target into `.vps-state/mysql-root.password` with mode0600 and uses a file mount, not a plaintext argv password.
- Decrypts SQL in memory, imports only into the new server, verifies every table/data hash and migration checksum. No app or AI starts. Full success prints PASS/counts and writes sanitized `vps-import-evidence.json` in the extracted directory.
- Preserve `.vps-state` with the new server: its root secret file is needed on restart. The one-time transfer-key file is removed after PASS. A failed import preserves its own new resources for inspection; do not blindly rerun/delete volumes. No automatic cleanup/reset of retained targets.

## Remaining boundary

Actual VPS transfer/import is **NOT RUN**, awaiting user execution and sanitized result. A SQL copy is not the complete MVP deployment: media/objects, original application encryption keys, runtime grants/config, SMTP, SSH/TLS access and authenticated browser checks remain separate. Encrypted fields retain their original key dependencies. Do not start a restored application/AI before current erasure/quota/vault reconciliation. No original application secrets were transferred by this package.

VPS automatic backup remains **NOT CONFIGURED**. This snapshot plus local verification does not establish operational15minRPO/4hRTO, independent offline-key recovery or V0.9/V1.0 acceptance. USB remains deferred at user request.
