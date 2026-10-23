# P29 infrastructure and recovery package

Package **DEC-10/11.2026-10-22.v2 — PARTIALLY APPROVED, P29 BLOCKED**. Supersedes the v1 paid-hosting/service recommendation. Owners: [deployment](deployment.md), [decisions](decisions.md), [P29–P33](prompts/v0.9.md). Existing historical price research is not a selected provider or spending authorization.

## 1. Explicit user decisions — October 22

- Reuse the existing VPS as the preferred hosting candidate: user reports Ubuntu 24.04, 2 vCPU, 2 GB RAM, 20 GB disk and V0.1 at `sv26.bcse-vju.com` since October 17. Inspect actual state before judging compatibility/capacity. No additional VPS/domain purchase, billing activation or paid-service signup.
- Build locally/CI, not by default on the 2 GB host. Preserve exact MySQL **9.2.0**, Prisma adapter/config and ESM imports. Do not replace the engine or change the running deployment.
- Gemini Free only, **USD 0 paid ceiling**; preserve existing quota/counters, never change environment/reset to obtain allowance. Reuse accepted [V0.8](progress/V0.8.md) evidence; no new Gemini requests made.
- Recovery design approved for implementation/drills on **synthetic data only**: RPO target **15 minutes**, RTO **4 hours**, daily full + binlogs, encryption, **14 daily + 8 weekly** copies and monthly drills.
- Original October22 boundary: no retained-data migration, running-version upgrade, production deployment, real pilot, VPS install/restart/config/data change or external messages. Later source-specific Mac protection and the explicit new-DB copy authorization below amend only those scopes; old VPS DB/service and release remain protected.

These decisions settle the listed choices; they do not settle the remaining destination, custody, services or access gates below. Do not ask for these same approvals again.

## 2. Actual inspection

[Original inventory](evidence/p29-source-inventory.json) remains historical. [Current local preparation](evidence/p29-local-preparation.json) records source fingerprints, public observations and actual isolated SQL evidence.

| Observation | Actual result / limit |
| --- | --- |
| Public HTTPS `/login` | 200, curl certificate verification result 0; verifies client-to-public-endpoint connection only, not origin TLS/renewal |
| Public HTTP `/login` | 200, no redirect Location observed; HTTPS redirect requirement needs investigation, not silently marked PASS |
| Public HTTPS `/api/v1/restaurants` | 404; application/API proxy/version compatibility unverified. No response body or personal data retained |
| Local SSH config | No explicit `sv26` profile in primary config; `ssh -G sv26` resolves hostname to literal `sv26`. No usable configured target established; no SSH connection attempted |
| VPS user-supplied metadata | Corrected [SSH output](evidence/p29-vps-user-inventory.json): Ubuntu24.04.4/x86_64/2CPU, RAM1967MiB/available1578MiB, root39%/available11785420KiB, swap560/2047MiB, Node24.22.0/npm11.19.1. Earlier screenshot belongs to wrong target and is EXCLUDED |
| VPS DB/services/origin/capacity | Subsequent user inventory: mysql:9.2.0 Up5days, host3306 loopback; nginx/Docker active, caddy/mysql/mysqld units inactive. Host mysql client absent. SQL VERSION/InnoDB/binlog/volume/digest, origin attribution and V0.9 capacity NOT VERIFIED. No update/restart |
| Local runtime/source | Node 24.21.0/npm 11.19.0; separate package lockfiles and `prisma7.config.ts` preserved; CI still Node `24.x` and MySQL `9.2.0` |
| Local SQL rehearsal | New temporary MySQL container, actual `SELECT VERSION()` 9.2.0, binlog/durable flush settings verified; empty and synthetic legacy upgrade plus encrypted full restore passed |

Public GETs are not proof of continuous uptime, V0.9 readiness or a successful release. Sandbox DNS initially failed; the authorized network retry succeeded. No private application endpoint, login, VPS modification or real-data export was used.

## 3. DEC-10 remaining choices and concrete recommendation

| Area | Recommendation within current constraints | Missing evidence/decision |
| --- | --- | --- |
| Hosting | Existing VPS only; inspect with [read-only helper](../ops/inspect-vps.sh), retain V0.1 untouched | Configured SSH profile/access; allocation continuity, region, running services and persistent storage; corrected user resource snapshot recorded, workload capacity unmeasured |
| Capacity | Off-host Linux-compatible builds; one backend process initially; measure API/DB/storage working set and disk growth in isolation before colocating | 2 GB/20 GB may be insufficient; no capacity guarantee or swap/installation authorized. Do not allocate most disk to backups |
| Staging | Local disposable MySQL/storage while P29 unresolved. A future remote synthetic target must have separate DB/identities/volumes/origin and preserve current deployment | Available remote isolation/resources and origin/DNS authority; no new host/domain purchase |
| Runtime | Candidate Node 24.21.0/npm 11.19.0, lockfile installs, exact MySQL 9.2.0 image digest per host architecture | Corrected target output reports24.22.0/11.19.1, differing from local proposal; Linux/native-module compatibility and exact pin decision remain unresolved. Do not downgrade running services |
| HTTPS/proxy | Inspect/reuse existing proxy and certificate renewal; same-origin `/api/v1`, overwrite trusted proxy headers, no exposed DB | Explain observed HTTP 200/API404; origin TLS, cookies/CSRF, renewal and private bind evidence |
| SMTP | Reuse an existing approved SMTP identity with TLS and synthetic recipients; no paid signup or automatic tier upgrade | Existing sender/service/free allowance/owner and authorized test recipient setup; no email sent |
| Media/private keys | Keep local synthetic guards intact. Existing storage may be reused only after owner/location/access and durable custody review | No production provider selected; production adapters/custody remain NOT CONFIGURED. An env flag is not a safe production implementation |
| Logs/alerts | Local redacted operational logs, proposed 7 days/1 GiB cap; use existing approved alert channel, no new paid monitor | Service/channel, named primary/backup responder, delivery/acknowledgement drill; no external messages authorized now |
| Budget | Zero additional paid provisioning; Gemini paid ceiling USD 0 | Existing service entitlement/capacity is unknown, not unlimited free service |
| MySQL support | Retain 9.2.0 for isolated work; keep real operation gated | v1 documented Innovation support risk; explicit real-operation risk disposition still required before pilot/production |

## 4. DEC-11 recovery design and off-VPS solution

Approved targets and cadence in §1 are fixed. Proposed detailed schedule: full at 02:00 Asia/Ho_Chi_Minh; rotate/archive closed binlogs and newly referenced media/key changes every 5 minutes, verify every chain. Binlogs contain private data and require encryption. Keep 14 days of continuous increments covering daily points and complete recovery dependencies for all 8 weekly points. No concurrent DDL during full backup. Record exact binlog coordinates, schema/migration checksums and compatible app/config references.

**Selected by user: existing Google Drive**, superseding the unconfigured workstation/NAS proposal and earlier “no destination available” report. VPS can eventually upload client-encrypted bundles directly; local Mac need not remain powered on. Selection is not configuration or a measured free allowance. [User setup guide](google-drive-backup-setup.md) covers free-space check, own Drive-only OAuth client/drive.file scope, local setup and upcoming synthetic evidence. No billing/trial/paid storage, new Gemini project use or actual transfer authorized by this choice.

Required protected inventory: actual available capacity, Google account owner/location/access policy, OAuth lifecycle and credential custody, independent recovery access, decryption-key custodian and offline copy. User identifies as Admin/responsible operator; key/offline custody is still unconfirmed. **Local OAuth/storage query PASS, user-reported**:15GiB total/14.987GiB free in the [receipt](evidence/p29-drive-preparation.json). Agent has not inspected tokens. Encrypted synthetic-file roundtrip now PASS by user report October23; [receipt](evidence/p29-drive-preparation.json). Actual DB/binlog recovery, operational retention sizing, key/offline custody, unattended OAuth lifecycle/scheduler/RPO remain NOT RUN or NOT CONFIGURED. No secrets or private Drive files accessed by the agent.

Capacity formula before enablement: sum of 14 daily and 8 weekly compressed full snapshots (avoid double-counting shared copies) + retained binlog chains + unique media versions/key manifests + tombstone journal + growth/headroom. Measure actual bytes/change rate; do not invent a GB requirement, silently shorten retention or keep sole backup on the 20 GB source disk. Full-only backup cannot satisfy 15-minute RPO for active ordering.

Production encryption format/tool and recovery-key rotation/custody require review. Current [synthetic archive tooling](../ops/recovery/archive.mjs) exercises authenticated AES-256-GCM with RSA-OAEP-SHA256 wrapping using ephemeral synthetic keys; it is not a production key vault, scheduler or provider adapter. Age remains an optional implementation choice, not an installed dependency or new service requirement.

## 5. Recovery and incident acceptance procedure

1. Record incident detection, write-stop and last acknowledged intent time; preserve source/artifacts. Real write controls/reopening require designated incident authority. Drills never overwrite source or enable external effects.
2. Restore to an isolated exact MySQL 9.2.0 target. Verify encrypted full/binlog hashes, uninterrupted coordinates and a common DB/media/key point. Unknown/missing increments or objects block that point.
3. Apply the independently preserved current erasure/hold journal before making restored keys accessible. Never resurrect erased keys; preserve required held evidence. Journal authenticity/freshness must be verified independently of the old archive.
4. Preserve/reconcile current AI counters/leases and prior usage; unknown scope disables AI. Restoring old DB or using another environment must not refill allowance.
5. Validate schema/constraints/grants, table counts/fingerprints, exact totals/rounding, immutable snapshots, histories, commission/settlement memberships and actor/key/hash/result links. Run compatible synthetic app login/MFA, original-key replay/no-duplication and a new safe synthetic order; verify media access/privacy.
6. Reconcile the gap against preserved facts and protected partner/buyer/receipt evidence; retain original uncertain keys, no inferred money/consent/history and no blind retry against stale records. Each discrepancy needs owner/evidence/resolution. Missing correction policy requires a decision rather than ledger rewrites.
7. Record detection delay, effective common point, restore/validation/reconciliation/reopen times. RTO includes these steps; compare actual offsite data loss and total outage against approved 15-minute/4-hour targets. Local archive elapsed time is not operational RPO/RTO.
8. Review before reopening; monitor backup freshness and critical journeys. Repeat monthly and after schema/storage/key changes. Expiry requires validated complete chains/holds; backup deletion never authorizes deletion of live history.

Proposed alerts: warn at recovery lag >10 minutes; stop new business writes at >15 minutes under reviewed controls; failed full by 03:00, disk >80%, HTTPS/readiness failure and missing acknowledgements. Primary acknowledgement/escalation target 15 minutes remains proposed until staffing/channel accepted and tested. No block, alert or scheduler was installed on VPS.

## 6. Local work delivered and sequential gate

[Local reproduction and limits](recovery-local-preparation.md) documents executed tools, synthetic schema/row preservation, archive tamper/wrong-key refusal, journal freshness, erased-key exclusion, held-key retention, media bytes and exact quota preservation. No actual private-vault/media recovery, live replay, offsite transport or binlog replay is implied.

**P29 remains BLOCKED** by destination/custodians and unresolved DEC-10 services/access/compatibility. Continue only independent local preparation while waiting. **P30 has not started dependent staging execution or achieved acceptance.** P31 waits for P30; [P32](progress/P32.md) is a concrete unapproved plan; P33 waits for authorized real pilot evidence. No commercial/version acceptance or production authorization is inferred.

Corrected-target follow-up: supplied `free`/`df` output supports only that resource snapshot; memory/swap/root free space is not a load or recovery guarantee. User subsequently supplied running mysql:9.2.0 image/status and nginx/Docker active status. Origin-to-host mapping, persistence/allocation, exact image digest, proxy config and SQL settings still need read-only inspection. MySQL client package suggestions are shell output, not authorization to install8.x/MariaDB or change the9.2.0 contract. No Docker-group change or sudo escalation of application permissions is proposed.

October23 user inspect evidence: hlf-mysql has named volume hlf_mysql_data mounted RW at /var/lib/mysql; local image content ID recorded in [receipt](evidence/p29-vps-user-inventory.json). This narrows the storage inventory gap but does not establish offsite backup/durable host allocation or SQL/binlog settings. Registry RepoDigest and actual SQL query remain unverified; no deployment/migration/config change.

October23 SQL snapshot: user query confirms exact9.2.0/InnoDB, ROW binlogs ON, sync_binlog1/flush-at-commit1 and binlog expiry30days ([receipt](evidence/p29-vps-user-inventory.json)). Earlier actual SQL settings gap is narrowed; no registry digest/host capacity/backup/replay proof inferred. Before enabling archives, measure DB/binlog/media sizes/growth against available host/Drive space; never silently purge logs or shorten approved retention.

October23 connection-file evidence: user-run masked probe in confirmed hlf-backend working directory reports **127.0.0.1:3306/cse3045**, sourced from `.env` after process DATABASE_URL was unavailable. This narrows the VPS attribution gap but does not prove the running process loaded that file. Mac configuration remains separate **127.0.0.1:3307/hlf_dev_flow**; do not switch, merge, migrate or export either retained database. Existing5table/0.19MiB VPS metadata is not the accepted local V0.8 schema. Credentials were not printed or retained; no remote mutation or backup enabled. P29 remains BLOCKED; P30–P33/V0.9 unaccepted. See the current sanitized VPS inventory for details.

October23 VPS backup-tool check: user `command -v` reports **rclone: NOT CONFIGURED; age: NOT CONFIGURED** in the current SSH user PATH. No exhaustive disk inventory implied. Installing tools, transferring OAuth credentials or enabling a scheduler on the retained VPS remains outside current authorization; none performed. Local Mac encrypted-file roundtrip remains separate and does not prove VPS unattended backup. P29/DEC-10/11 remain BLOCKED; P30–P33/V0.9 remain unaccepted.

October23 independent local offsite database drill: **PASS** agent-executed `node ops/recovery/rehearse.mjs --drive-synthetic` ([receipt](evidence/p29-drive-database-drill.json)). New disposable MySQL9.2.0 empty/legacy migration chain; only214884-byte encrypted synthetic archive uploaded to existing Drive, downloaded with identical SHA256, then restored62tables/43rows with exact schema/data/migration/money checks, erased-key exclusion, held-key/media preservation and synthetic counter100. Upload/read-back12.934s, full run35.338s, local simulated gap13.296s, decrypt/SQL/validation0.934s; **not operational RPO/RTO**. New opt-in mode has fixed synthetic namespace/no retained input, leaves ciphertext only (ephemeral private key never uploaded), and preserves all three existing containers. Ops syntax/lint/5crypto test groups PASS; application suites NOT RUN for ops-only change. VPS tools still NOT CONFIGURED; unattended/full+binlog retention/offline-custody/staging/app-replay gates remain open. No VPS, retained DB, real Gemini counter, billing or pilot changes. P29–P33/V0.9 remain unaccepted.

October23 access decision: user selected **private SSH tunnel first** for synthetic staging, preserving the public V0.1 route. Candidate HTTPS origin `https://localhost:14443`; local Linux private-web/TLS/proxy checks PASS ([handoff](staging-next-step.md), [receipt](evidence/p29-private-access.json)). Actual tunnel, certificate trust, authenticated staging journey and remote full-stack setup remain NOT RUN. This selection does not approve retained migration, public routing, pilot or production release.

October23 source-specific copy authorization: user explicitly selected transferring all Mac `hlf_dev_flow` data into a **new** Docker DB on the existing VPS. [Handoff](mac-to-vps-database-copy.md)/[receipt](evidence/p29-mac-vps-transfer.json): fresh encrypted backup and actual importer rehearsal PASS62tables/203rows/28migrations; wrong-key/corruption refusal. Prepared encrypted terminal-transfer package; actual VPS execution NOT RUN. This supersedes synthetic-only data scope for that copy, not old `cse3045` overwrite, original key transfer, app startup, operational backup, cutover or release.
