# Google Drive backup preparation

Status: **local OAuth/storage and synthetic encrypted file roundtrip PASS (user-reported October23); database/scheduled recovery NOT RUN**. [P29](progress/P29.md), [DEC-10/11](decisions.md) still gate operational acceptance. User selected their existing Google Drive and requested guidance; this authorizes preparation, not retained-data backup/export, VPS installation/change, deployment, production or pilot. No account/billing/OAuth/files changed by the agent.

## 1. Check existing account and local tooling

Open [Google storage](https://one.google.com/storage) in the intended existing account. Note only remaining GB; do not send mailbox/file listings or account screenshots with private details. Do not purchase storage or start a paid trial. Free space must cover measured full/binlog/media/key retention; no assumption15GB remains.

On the Mac's **local terminal, not its SSH session**, Homebrew is already available and rclone was not found during local read-only inspection. User may install locally using official documented instructions:

```sh
brew install rclone
rclone version
```

This does not install anything on VPS. [Rclone installation](https://rclone.org/install/) documents Homebrew. Existing backup retention/RPO decisions are unchanged.

## 2. Create a Drive-only OAuth client, without billing

Current [rclone Drive documentation](https://rclone.org/drive/#making-your-own-client-id) says its shared client ID is being retired during2026; do not build an unattended backup around that shared ID.

1. Open [Google Cloud Console](https://console.cloud.google.com/). Select/create a dedicated free project such as `HLF Backup Drive`; do not attach a billing account, activate a free-credit trial, enable Gemini or change the existing Gemini project/quota. This project is for Drive authorization only.
2. APIs & Services → Library → Google Drive API → Enable. [Standard Drive API use](https://developers.google.com/workspace/drive/api/guides/limits) is currently available without additional cost, with quotas; do not request paid overages/quota increases or attach billing. If the actual account UI requires billing, stop and report it.
3. Google Auth Platform → Branding/Get started: app name `HLF Backup`, own support/contact email; Audience External for ordinary personal Gmail, or Internal only if an existing eligible Workspace organisation is intended. User handles any account/terms/consent prompts themselves.
4. Data Access → add only `https://www.googleapis.com/auth/drive.file`. This is a [non-sensitive per-file scope](https://developers.google.com/workspace/drive/api/guides/api-specific-auth). Do not add full Drive/docs/Gmail scopes. It lets rclone manage only files/folders created by this app; create the backup folder with rclone later, not by hand in Drive.
5. Audience → Testing → add the intended Google account as a test user. Clients → Create client → **Desktop app**, name `hlf-backup-local`.
6. Keep client ID/client secret privately in a password manager; never paste secrets/config/tokens into chat/git or shell history. Do not send downloaded credential JSON.

Testing is sufficient only for a short synthetic trial: [Google says authorizations/refresh tokens expire after7days in Testing](https://support.google.com/cloud/answer/15549945). Before unattended backup, resolve appropriate OAuth publishing status, branding/requirements, renewal failure alerts and reauthorize as needed. Google OAuth “In production” is a consent-platform setting, not deployment of this repository. Do not invent public privacy notices or publish a website merely to pass a setup screen; report required fields for review.

## 3. Authorize locally with minimum scope

On local Mac:

```sh
umask 077
rclone config
```

Choose by label/value, not version-dependent option numbers:

| Prompt | Input |
| --- | --- |
| New remote | `n` |
| Name | `hlfdrive` (choose a different name if it already exists; never overwrite another remote) |
| Storage | `drive` |
| client_id / client_secret | Enter the private values from own Desktop client |
| scope | `drive.file` |
| service_account_file | Empty; user OAuth, not service account |
| Advanced config | No for initial trial |
| Browser authentication | Yes on local Mac; log into intended account and review requested scope |
| Shared Drive / Team Drive | No for personal My Drive |
| Keep remote | Yes, then quit |

Some versions print token/config values during confirmation. Do not send terminal screenshots/output containing these. User performs sign-in and grant; no agent access expansion is presumed. [Remote setup](https://rclone.org/remote_setup/) will later support headless VPS authorization without keeping the Mac on. No OAuth/config transfer to VPS yet.

Run `rclone about hlfdrive:` to inspect storage only. If scope/provider restrictions reject it, inspect storage in browser instead; do not broaden permissions just for quota reporting. Report remaining capacity and nonsecret error text only. Do not run broad recursive file listings or `rclone config show` for troubleshooting.

## 4. Next synthetic evidence and custody gates

After OAuth succeeds, prepare a private synthetic-only directory/folder, encrypt locally with a reviewed key mechanism, upload **only encrypted fixture bytes**, download/decrypt and compare hashes. No real SQL dump, account/contact/order/receipt/media/key payload may be substituted for the fixture. Do not use `sync`/deletion/expiry during preparation. User has now reported the encrypted synthetic file roundtrip PASS on October23 (procedure/result below). Current [user-reported receipt](evidence/p29-drive-preparation.json) records successful callback and15GiB total/14.987GiB free; this is not a retention-capacity guarantee or server-side setup.

The user must choose custody of the private decryption key plus an offline recovery copy; do not leave the sole copy on VPS or upload it beside backups. A final public-key encryption design can keep only the encryption recipient on VPS. OAuth credentials and decryption keys are different secrets.

Only after remaining P29 decisions and acceptance: separately authorized VPS setup, noninteractive credential custody, protected scheduler, consistent full+binlog/media/erasure manifests, quota/retention/alerts and isolated recovery drills. A folder, consent token or successful upload cannot prove15minute RPO/4hour RTO,14daily/8weekly retention or P30 acceptance. The Mac may be off after a verified server-side job is operating; it is needed interactively only for initial setup and occasional recovery/reauthorization.

## 5. Next user-run step: local synthetic encryption key

Run only on the local Mac, not VPS. [Age official instructions](https://github.com/FiloSottile/age#installation) document Homebrew and public-key encryption. Agent has not installed or generated keys for the user. These are synthetic trial keys, not an implicit production custody decision.

```sh
brew install age
age --version
umask 077
mkdir -p "$HOME/.config"
hlf_backup_drill="$(mktemp -d "$HOME/.config/hlf-backup-drill.XXXXXX")"
age-keygen -o "$hlf_backup_drill/recovery.key"
```

Each attempt uses a new0700 directory; never overwrite an existing recovery key. The private key stays in recovery.key with restrictive permissions; terminal displays only a public recipient. Do not run cat on the key or upload/send it. Keep the same local Terminal session for subsequent fixture encryption/upload/download/hash commands. Store an independent protected offline key copy and verify its readability before relying on any future retained backup; no offline copy has been confirmed yet.

User confirmed key generation and subsequent synthetic encrypted-file roundtrip PASS. Age version/private-key offline custody are still unconfirmed. No automatic real-data backup/scheduler or P29 acceptance follows from this step.

## 6. October23 user-reported synthetic roundtrip

The user followed the same local terminal session using the generated `hlf_backup_drill` directory. Procedure: create a fixed synthetic probe; derive only the public recipient; encrypt with age; upload only probe.txt.age into a unique HLF-Backup-Synthetic subdirectory; download to a different local file; decrypt with local recovery.key; compare original/restored bytes with cmp. User reported `PASS: file khoi phuc trung ban goc`. [Receipt](evidence/p29-drive-preparation.json) records this as user evidence, not an agent-executed test.

PASS establishes that this fixture's encrypted transport/download/decryption/comparison worked. It is not a MySQL backup, binlog chain, schedule, immutable retention, actual private-data erasure restoration, operational RPO/RTO, key-loss recovery or independent review. No real SQL/private-key upload instructed or performed in this procedure.

Next required custody step: user designates a protected offline USB/removable storage or other reviewed offline method for a second copy of recovery.key, separate from Drive and VPS, and later verifies decryptability from that copy. Do not ask for the secret or infer a completed copy. Avoid overwriting/deleting either original until verification. This trial key is not automatically adopted as a production key.

Also still open: rotation/replacement confirmation for the previously exposed OAuth client secret, OAuth Testing-token lifetime/unattended reauthorization, actual backup growth/retention capacity, all remaining P29 service/access choices and explicit VPS operational scope. No new Google billing/Gemini allowance or deployed-data operation follows from the fixture PASS.

Branding follow-up: user screenshots show External/Testing, disabled Publish requiring completed Branding, empty homepage/privacy URLs and developer contact present. [Prepared Vietnamese homepage/privacy draft](google-drive-backup-branding-draft.md) is NOT PUBLISHED and does not authorize site/VPS changes. Confirm top app-name/support-email fields, actual required Console validation and controlled hosting/domain before entering real URLs.

## 7. Published OAuth notice URLs — October23

User authorized GitHub Pages notices. [Homepage](https://namkhasnh.github.io/hlf-backup-info/) and [privacy notice](https://namkhasnh.github.io/hlf-backup-info/privacy.html) now serve HTTP200 over verified HTTPS; [receipt](evidence/p29-backup-pages-publication.json) records exact source/commit/run and scoped browser checks. Host is controlled through user GitHub repository; Google domain verification is separate.

Enter the actual URLs in Branding; authorized domain candidate `namkhasnh.github.io` without scheme/path. Do not enter bare github.io. Optional terms field has no published terms URL to invent. Inspect actual Google validation before saving; if Google requires ownership verification, use a reviewed verification procedure. Agent did not change Branding, Audience/Publishing status, scopes or tokens in this publication task. OAuth Testing lifecycle and exposed-secret replacement still need closure before unattended backup.

This is a public static notice site only, with no login, app integrations, secrets, backup payloads or billing. Production ordering/VPS deployment, backup scheduler and V0.9 acceptance remain separate.

## 8. User-published OAuth status and next local reconnect — October23

User Audience screenshot confirms **In production**, External, and Branding changes saved. This supersedes the earlier Testing screenshot; the agent did not perform the Google Console changes. [Google audience documentation](https://support.google.com/cloud/answer/15549945) defines Testing-token expiry; publishing alone is not evidence of new token issuance, indefinite token validity, scope verification or Google domain ownership verification.

Before using unattended credentials, confirm the previously exposed client secret has been replaced and local hlfdrive config uses the replacement; no secret or token should be sent to chat or git. User performs any credential change manually. With the updated own client credentials, run on local Mac:

```sh
rclone config reconnect hlfdrive:
```

[Rclone reconnect](https://rclone.org/commands/rclone_config_reconnect/) repeats interactive OAuth. If prompted to replace/reconnect existing token, choose Yes; browser authorization Yes on Mac; use the same intended account and drive.file scope. No broader permissions, new remote/quota environment or billing. Then run `rclone about hlfdrive:` and report only nonsecret result/error. User subsequently reported OAuth Success and “about ok” on October23: interactive post-publication reauthorization/storage access PASS by user report. Actual unattended token refresh/revocation alerts remain unverified; no token inspected or copied by the agent.

User reports saving the private key securely; no independent offline copy/recovery-from-copy evidence is inferred. This OAuth state does not accept P29, start P30 staging or authorize VPS installation/retained backup/production deployment.

## 9. Next remote read-only inventory

After local reconnect/about success, identify the actual retained VPS MySQL container without accessing credentials/config/application rows. Run in the already connected **correct VPS SSH session**, not Mac:

```sh
sudo -n docker ps --filter ancestor=mysql:9.2.0 --format 'name={{.Names}} image={{.Image}} ports={{.Ports}}'
```

Report only container metadata/nonsecret errors. If sudo is denied, stop; do not change Docker permissions/groups or install packages. User subsequently supplied unfiltered ps -a output: container **hlf-mysql**, image tag mysql:9.2.0, Up5days and host3306 loopback. Ancestor filter returned no output; reason unresolved, not evidence of stopped MySQL. Follow-up must use that observed target for allowlisted volume/image metadata and credential-prompted read-only SQL settings, without printing environment or putting passwords in command arguments/chat. No backup/export/migration/service mutation follows from inventory authorization.

## 10. Named-container metadata and settings (read-only, not executed yet)

Use observed name hlf-mysql. No raw docker inspect/config/environment output. Mount listing excludes host Source paths and credentials:

```sh
sudo -n docker inspect hlf-mysql --format '{{range .Mounts}}type={{.Type}} volume={{.Name}} destination={{.Destination}} rw={{.RW}}{{println}}{{end}}'
sudo -n docker inspect hlf-mysql --format 'image_id={{.Image}}'
```

With an existing authorized MySQL root password, user can run this SELECT via the container's own client; it does not require installing a host client:

```sh
sudo -n docker exec -it hlf-mysql mysql -u root -p -e 'SELECT VERSION() AS mysql_version, @@GLOBAL.default_storage_engine AS storage_engine, @@GLOBAL.log_bin AS log_bin, @@GLOBAL.binlog_format AS binlog_format, @@GLOBAL.binlog_expire_logs_seconds AS binlog_expire_seconds, @@GLOBAL.sync_binlog AS sync_binlog, @@GLOBAL.innodb_flush_log_at_trx_commit AS flush_at_commit;'
```

Password is entered only at the local interactive prompt, not in argv/chat; it is MySQL root's existing password, not the SSH/sudo password. If unavailable or access denied, stop/report nonsecret error. Do not extract/print env, reset password, change grants/variables, flush logs or restart. SQL version/settings/mount evidence remains NOT RUN until user supplies results. No application rows queried or retained-data backup/export.

## 11. SQL settings confirmed; next size metadata (read-only)

User supplied SELECT result:9.2.0/InnoDB/log_bin1/ROW/binlog_expire_logs_seconds2592000/sync_binlog1/innodb_flush_log_at_trx_commit1. Initial interactive root attempt failed1045; existing MYSQL_ROOT_PASSWORD used only inside the container authenticated successfully without secret output. Do not change credentials based on earlier failure.

Next user-run SSH command reads application-schema table-size estimates and binary-log file sizes, not application rows. No dump/export/rotation/purge/config changes:

```sh
sudo -n docker exec -i hlf-mysql sh <<'HLF_READONLY'
set +x
if [ -z "${MYSQL_ROOT_PASSWORD:-}" ]; then
  printf 'ROOT_PASSWORD_ENV_NOT_CONFIGURED\n'
  exit 2
fi
export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"
mysql --no-defaults --protocol=socket -u root --table <<'SQL'
SELECT TABLE_SCHEMA AS db_name, COUNT(*) AS base_tables,
       ROUND(SUM(DATA_LENGTH + INDEX_LENGTH)/1024/1024,2) AS estimated_mib
FROM information_schema.TABLES
WHERE TABLE_SCHEMA NOT IN ('mysql','sys','information_schema','performance_schema')
  AND TABLE_TYPE = 'BASE TABLE'
GROUP BY TABLE_SCHEMA;
SHOW BINARY LOGS;
SQL
HLF_READONLY
```

Schema/table estimates do not equal a compressed full dump or media/private-key size. Binlog listing supplies current sizes only, not measured change rate or future capacity. Results NOT RUN until supplied;30day configured expiry alone does not prove14daily/8weekly complete recovery retention or15minute offsite RPO. No secret/env dump should be sent.

## 12. Size snapshot supplied; inspect actual retained schema metadata next

User output: cse3045 has5base tables,0.19MiB estimated data+indexes; two binary logs total3006123bytes and EncryptedNo. This snapshot is not a compressed full-backup measurement or growth/retention/media/key capacity proof. It does not justify upgrading/resetting the running database or assuming local V0.8 schema compatibility. Client-side backup encryption remains required; do not change/purge live binlogs.

Next user-run SSH command lists only table/column metadata, not business rows or secrets:

```sh
sudo -n docker exec -i hlf-mysql sh <<'HLF_READONLY'
set +x
if [ -z "${MYSQL_ROOT_PASSWORD:-}" ]; then
  printf 'ROOT_PASSWORD_ENV_NOT_CONFIGURED\n'
  exit 2
fi
export MYSQL_PWD="$MYSQL_ROOT_PASSWORD"
mysql --no-defaults --protocol=socket -u root --table <<'SQL'
SELECT TABLE_NAME, ENGINE, TABLE_ROWS AS estimated_rows
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'cse3045'
ORDER BY TABLE_NAME;
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'cse3045'
ORDER BY TABLE_NAME, ORDINAL_POSITION;
SQL
HLF_READONLY
```

Names/types/index flags/estimated counts are schema metadata; no password hashes, account contacts or user rows selected. Migration history presence can be assessed by table-name metadata; actual history/checksums require a later scoped query only if that table exists. Current five-table state is not a full V0.9 deployment claim. Results NOT RUN until supplied.

## 13. Local versus VPS source clarification

User clarified changed connection refers to Mac. Agent used Node's built-in process.loadEnvFile in a one-off read-only subprocess to emit only masked metadata: backend/.env points to127.0.0.1:3307/hlf_dev_flow. No credentials/raw connection string or user rows printed; no SQL query, .env edit or runtime restart. Initial optional dotenv import was unavailable; no dependency installation performed. File configuration does not prove the running process's effective environment.

The cse3045/5table/0.19MiB observation remains valid for the queried VPS instance only; actual VPS backend connection is not established. Do not continue treating cse3045 as the current Mac DB, apply migrations there, or silently change backup targets. Section12's schema inspection is deferred pending source attribution.

Drive availability and source availability are separate: existing cloud files remain accessible when Mac sleeps, but a sleeping Mac cannot continuously produce fresh local database backups. A15minute offsite RPO without an always-on Mac requires the intended source data to run on an authorized always-on host. Current source/upgrade authorization does not permit transferring retained local data or upgrading the running VPS. P29/V0.9 remain unaccepted.

## 14. User-run offline recovery copy verification

Run `sh ops/recovery/verify-offline-key.sh` from repository root on Mac. [Exact procedure and limits](recovery-binlog-verification.md#verify-the-users-real-offline-age-copy) describe the private path prompts, original-recipient challenge and reportable result. No key text should enter chat/git. Actual offline copy status remains **NOT RUN** until user reports successful decrypt/cmp and independent offline custody. The separate synthetic full+binlog Drive drill PASS does not verify this age key. VPS automatic backup remains **NOT CONFIGURED** and V0.9 **BLOCKED / NOT ACCEPTED**.

October23 user deferral: offline-copy attempt reported `OFFLINE_COPY_NOT_READABLE`; user then requested skipping the USB step. Actual offline-key recovery remains **NOT RUN — deferred at user request**, not PASS or an acceptance waiver. No further USB action requested. Automatic VPS backup remains **NOT CONFIGURED**; V0.9 **BLOCKED / NOT ACCEPTED**. Existing synthetic binlog PASS evidence is unchanged.

October23 authorized retained Mac protection: user selected `hlf_dev_flow` first; source9.2.0/62InnoDB tables verified. **PASS** local age-encrypted full SQL backup and isolated9.2.0 restore62tables/203rows/28migration checksums, exact canonical schema/all-row fingerprints and source unchanged at recorded checks. Automatic review initially rejected source-only Drive authorization; rejected command did not run. After local-only restore, user explicitly approved the exact60,188byte ciphertext and Drive destination; approved uploader/read-back/SHA256/decrypt/manifest **PASS**. [Procedure](mac-backup-verification.md), [sanitized receipt](evidence/p29-mac-backup.json). Private key/plaintext SQL never uploaded; new labelled restore container removed; no source/VPS migration, data write, Gemini call or app startup. USB remains deferred/NOT RUN. Automatic Mac/VPS backup, continuous binlog shipping, media/vault/journal/app recovery and operational RPO/RTO remain incomplete; P29/P30/V0.9 BLOCKED / NOT ACCEPTED. Future uploads/scheduling not inferred from this single-file approval.
