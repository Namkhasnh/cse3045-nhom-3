# Academic demo in-place update — October24,2026

Scope: the user requested deployment of the new application while preserving server-created data. This is an update to the existing academic demo at `https://sv26.bcse-vju.com`, not P35/commercial release acceptance. Local data merge and remote sample-data cleanup are separate tasks.

## Candidate and current server

Application commit: `36e01f15676fc4ff6a9f5cd9d80a97a4ce2f7327`. New operator tooling is an uncommitted working-tree change, shipped with checksums in the update manifest. Linux/amd64 Node24.22.0/npm11.19.1 application and one-shot schema images are built through `ops/staging/Dockerfile`; the schema operator includes an explicitly verified Linux/OpenSSL3 Prisma engine. The frontend build uses no local `.env` files.

User-run read-only SSH inventory confirms three running owned containers: `hlf-mac-copy-mysql`, `hlf-demo-api`, `hlf-demo-storage`; release `87078c71-67cb-4d58-9323-037ebc2ce041`. Volumes are `hlf_mac_copy_data`, `hlf_demo_vault` and `hlf_demo_objects`; root-secret source is the original protected release state. All28reported migrations are finished, not rolled back, and their checksums match the local files.

The only pending migration is `20261024010000_restaurant_storefront` (`b37e47bba8e2d7ec0537b9a70e038a98604503e1d04a9ee454888f56a20f25c4`). It creates cover metadata and adds nullable description/cover-reference fields with constraints. It writes no historical restaurant/order values. The update adds only the corresponding runtime column/metadata grants after rehearsal and migration succeed.

## Procedure and safety boundaries

1. `node ops/demo/prepare-update.mjs` exports the two Linux images, frontend, update scripts and file/image identity manifest; packages and AES256-GCM-encrypts them. No local DB, objects, configuration, original MFA/SMTP keys or local cleanup state is copied. A fresh delivery unlock key remains outside the bundle.
2. Remote bootstrap verifies ciphertext SHA256 and authenticates GCM before unpacking with Python's data extraction filter. Transfer is separate from application mutation. It launches the update as a systemd service so SSH disconnect does not terminate a running update.
3. `update.py` acquires an exclusive operator lock and verifies original container/volume/network/environment/nginx ownership, release path, disk space and artifact/image identities. Drift stops the update. Existing browser asset URLs are retained in the new static tree.
4. A short nginx503maintenance window blocks new app traffic. Stop/drain the API and stop storage; keep the original DB running. Back up full SQL and object/vault contents to root-only release state, retaining runtime key configuration. No reset, seed or original volume removal occurs.
5. Restore SQL into a newly labeled disposable MySQL9.2.0container without published ports. Compare all-table schema and all-row hashes. Rehearse the one pending migration and compare every original business column/row. Extract asset archives into a private temporary directory and compare each restored file against the stopped source volume.
6. Remove only the disposable restore container/anonymous volume after label verification. Apply the same forward migration to the existing DB with Prisma migrate deploy, compare original business rows and add narrow grants. The operator refuses unknown, modified, unfinished or unexpected pending migrations.
7. Retain the stopped prior API under a release-specific name. Start the new API with original runtime environment, DB network and vault volume; restart existing storage. Change only the owned frontend root, validate/reload nginx, and check exact frontend/asset bytes, catalog200and anonymous401through explicit Host-header requests.
8. On failure after maintenance starts, attempt to restore the prior application/route and restart existing storage. Preserve the current DB and all retained volumes. Additive schema remains in place; rollback never restores a stale SQL dump over subsequent writes. Config/container ownership drift refuses forced rollback.

Do not rerun the original installer or local-only cleanup against this retained `test_hlf_demo` namespace. Do not blindly rerun an update directory after failure; inspect its sanitized journal/stage and protected evidence first. Manual application rollback after a completed update is:

```sh
sudo python3 /opt/hlf-update-20261024-36e01f1/update.py --rollback
```

This command is for this specific update, not the original `rollback.sh`, which returns to the pre-demo website and stops the demo storage/API. A database recovery remains a separately reviewed reconciliation action.

## Verification and actual status

- PASS frontend lint/build, backend lint/build,60unit tests and9HTTP E2E tests. Vite retains its existing main-chunk-size advisory; HTTP E2E uses mocked persistence.
- PASS `npm --prefix frontend run test:workspaces`: controlled-response Chrome regression at five widths, personal/owner/Admin separation, profile save/conflict/error, setup guidance and keyboard/mobile states. This is frontend interaction evidence, not server persistence evidence.
- PASS seven Python tests (three existing nginx and four new rollback ownership/failure cases), scoped ESLint, Node/Python/shell syntax and diff whitespace checks.
- PASS `python3 ops/demo/probe-update.py`: new disposable MySQL9.2.0with28prior migrations and synthetic original rows, exact all-table SQL backup/restore, actual Linux Prisma migration, preservation of61original business tables, limited grant execution, safe already-applied repeat, exact new Linux API catalog/category200and anonymous401, and deliberate original-row drift rejection. Initial missing schema-engine and semantically redundant MySQL charset-rendering differences were caught in isolated probes and repaired before any remote change; charset normalization matches the existing backup tooling.
- PASS local authenticated decryption produces the exact release archive. The public transfer contains ciphertext only; its fresh unlock key is entered separately at a hidden SSH prompt.

Direct agent SSH is unavailable because the gateway requires interactive password authentication. Computer Use also prohibits access to Terminal; no bypass was attempted. The user has an authenticated shell and provided the inventory above. Automatic review initially rejected opening a public Cloudflare artifact tunnel because destination-specific approval was missing. The user then explicitly selected approval for a temporary Cloudflare ciphertext download. The subsequently authorized endpoint passed HTTPS HEAD200with492565901bytes. The user confirmed full download and matching ciphertext checksum; both tunnel and loopback file server were then stopped. The key stays outside the delivery; the user copies the generated bootstrap and key from local Mac files into their existing SSH session.

[Sanitized preparation receipt](evidence/demo-update-20261024.json) records current image/ciphertext identities, local proof and actual remote status. Pre-update public HTTPS checks observed login200, restaurants200(two current public restaurants) and anonymous auth/me401; no authenticated server actions were performed.

Remote deployment: **PASS by user-provided systemd journal**. Service started October24at01:44:06UTC(08:44:06Vietnam); backup began01:44:12, isolated restore/rehearsal01:44:13, forward migration01:44:24, and complete/PASS01:44:27. The service deactivated successfully. Protected backup and row/asset verification evidence remain under `/opt/hlf-update-20261024-36e01f1/state`; original DB/object/vault volumes and runtime keys are retained. Temporary Cloudflare transfer is **CLOSED**.

Independent post-update HTTPS: homepage/login/catalog/filtered-categories200, anonymous auth/me401; public restaurant count remains2. Both new JS/CSS responses match the exact packaged SHA256and bytes. Native Edge observation confirms homepage, new real-restaurant detail layout, both retained menu items and existing uploaded dish images render. Authenticated login/writes and VPS mobile viewport checks remain **NOT RUN**; local Chrome tests are separate evidence. No local data merge or remote sample cleanup occurred. Scheduled backups remain **NOT CONFIGURED**, and V0.9/V1.0 acceptance remains separate.
