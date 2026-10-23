# Next staging handoff — current access gate

Date: October 23, 2026. Scope: prepare the next P29 decision/access step after [local MVP verification](mvp-ordering-verification.md). This is not P30 implementation or authorization to change the existing VPS deployment.

## Concrete proposed scope

- Existing VPS only, no purchase/billing. Preserve existing `hlf-backend.service`, nginx routing, MySQL container/volume and `cse3045`; no restart, upgrade or migration of those resources.
- Candidate is the current reviewed working tree, not bare HEAD: it includes uncommitted onboarding/AI/notification work and the latest MVP fixes. [MVP receipt](evidence/mvp-ordering-verification.json) records scoped source/log hashes; it is not a frozen Linux deployment artifact.
- Prepare a separate staging project, identities, DB, object namespace, secrets and loopback endpoints after resource/port/isolation checks. Synthetic data only, no copy/merge of retained Mac/VPS data. Public origin/HTTPS and access controls require an actual approved route before browser acceptance.
- Build off-host; validate Linux/native modules and exact runtime before host execution. Preserve MySQL9.2.0 and Prisma configuration. No in-place Node downgrade or replacement of MySQL.
- Reuse Google Drive only under a reviewed source-specific encrypted backup schedule/retention/alert scope. Current manual Mac backups do not protect a future staging DB automatically. No automatic transfer of local OAuth credentials/private age identity to VPS.
- Keep AI disabled until the approved staging allowance/counter model is established; never refill the existing100call usage by changing environment. Do not send real email/payment/pilot traffic.
- After complete P29 decisions/access, execute P30 deployment/recovery, then P31 staging verification. Real pilot and commercial release remain separately gated by exact partner/window/candidate approvals.

## Current blocker and next read-only action

Agent has **no authenticated VPS shell**. The previously supplied Cloudflare gateway was reachable but noninteractive SSH returned `Permission denied (password)`. Existing user-authenticated Terminal access is not agent authentication. A prior Terminal UI safety denial must not be bypassed. No password/private key/token should be sent to chat.

User supplied current resource and listener/Compose snapshots:1596MiB available RAM,11786236KiB root free, existing MySQL21.88MiB/0.06percent CPU, Docker Compose5.6.0. Proposed ports14300/14443 are absent from the supplied listener list. Existing listeners remain SSH22, nginx80, loopback MySQL3306 and backend3000, plus local DNS53. [Sanitized inventory](evidence/p29-vps-user-inventory.json) records the exact distinction between user output and agent observation.

Do not repeat this inventory request. Listener availability is point-in-time; the prepared preflight must still check collisions immediately before any future binding. No443 listener appears in this snapshot; public HTTPS termination is not established by that absence. User selected **private SSH-tunnel testing first**. Candidate browser origin is `https://localhost:14443`; no public DNS or existing V0.1 route change is required. Certificate trust and actual tunnel connectivity remain unverified.

Agent can continue directly when an already authorized SSH connection usable by the agent is available; otherwise user-run commands remain necessary for remote operations. Once current metadata is supplied, finalize the exact isolated plan and missing service/custody/owner decisions in [P29 package](infrastructure-recovery-proposal.md), then present any required concrete remote mutation for approval. Do not ask for blanket deployment approval while ports/resources/origin/secrets are unresolved.

## Delivered versus pending

Delivered: local code/UX fixes,108reported automated cases and5Chrome journeys PASS; encrypted Mac SQL backup/restore/Drive read-back PASS; reproducible manual backup/MVP runners. These do not require re-execution merely because remote access is missing.

Pending: usable agent SSH or a concrete user-run deployment handoff; actual isolated allocation/origin; target-VPS runtime verification; SMTP/media/vault/alert owners and operational recovery configuration; staging/load/pilot/release evidence. USB remains deferred; no repeated USB request or acceptance waiver. P29/V0.9 remain BLOCKED / NOT ACCEPTED.

## Local Linux candidate preparation

[Dockerfile](../ops/staging/Dockerfile) and [deny-by-default context](../ops/staging/Dockerfile.dockerignore) build Linux/amd64 candidate artifacts off-host with Node24.22.0/npm11.19.1. Backend runtime runs as `node`; no retained env/key/backup, Mac node_modules, migration execution or VPS connection is included. Both builds PASS; [Linux receipt](evidence/p29-linux-candidate.json) records image IDs/archive hashes and actual smoke/startup verification. Frontend build image is a builder, not a deployed web server.

[Resource proposal](../ops/staging/capacity-proposal.json): synthetic starting caps384MiB DB +384backend +128object storage +64web =960MiB, with384MiB separate proposed host reserve. These are uninstalled caps, not measured service capacity or a guaranteed budget for every enabled feature. Existing host swap usage and workload peaks still matter. Image sizes/growth/recovery storage require measured allocation review.

[Read-only preflight](../ops/staging/preflight.sh) checks Linux/amd64, current RAM against that proposal, proposed14300/14443listener collisions, Docker/Compose access and existing `hlf-staging` project resources. Syntax checked locally; actual VPS execution NOT RUN. It installs/changes nothing and accepts no credentials. Run only after obtaining the exact script in an authorized session; do not infer the file already exists on the VPS.

Actual Linux startup probe PASS against a newly migrated9.2.0 disposable DB: public catalog200/empty, anonymous profile401, invalid login401. Docker limits were384MiB DB and256MiB backend; idle observations233.7MiB DB and197.8MiB backend. Backend was nonroot, read-only, all capabilities dropped, with no-new-privileges. This is a startup/HTTP probe under Mac Docker emulation, not target-VPS load or restricted-grant evidence. The proposed backend cap is increased to384MiB to allow more headroom; proposed total960MiB plus384reserve requires1344MiB currently available. Both new probe containers/volumes were label-checked and removed.

Local prepared files: backend Linux image archive212270592bytes (~202.4MiB), frontend static gzip549373bytes (~536.5KiB). Native sharp1pixel PNG, generated Prisma import and compiled AppModule import PASS as UID1000 with network disabled; local configured secret exact-match scan PASS across frontend assets,10secret values checked without printing them. This scan is not a complete secret audit. Source/lock/schema checksums and actual artifact paths are in the receipt. No image/file has been transferred to VPS or a registry.

The supplied snapshots settle preliminary sizing, point-in-time port availability and Compose availability. They do not settle agent authentication or the remaining P29 service/origin/custody decisions. The private SSH access route is selected; no repeated listener/Compose/memory/disk inventory request is needed unless host state changes. Actual deployment remains NOT RUN; no P30/P31/pilot acceptance inferred.

## Selected private access — October23

User selected SSH-tunnel testing before a public staging origin. [Tunnel helper](../ops/staging/tunnel.sh) supports only a **single verified direct VPS SSH alias/destination**, adding `-L 127.0.0.1:14443:127.0.0.1:14443`, no remote command, fail-on-forward-error and keepalive. It rejects the supplied session-selector gateway and remote-command arguments. Run on the Mac only after a verified forwarding route and remote private service exist; it does not deploy or authenticate automatically.

[Private HTTPS entry](../ops/staging/private-web.mjs) serves built frontend assets and proxies `/api` to `127.0.0.1:14300`; browser and `PUBLIC_ORIGIN` must both be exactly `https://localhost:14443`. It binds only `127.0.0.1:14443`, requires that exact Host, rejects hidden/traversal/symlink escapes and unknown asset types, preserves API status/Set-Cookie/Origin and replaces forwarded client metadata. Backend `Secure`/`__Host-` cookies are unchanged. TLS key/cert paths are explicit runtime inputs, never bundled; certificates must cover localhost and be trusted by the test browser. Certificate issuance/trust installation is NOT RUN; do not disable certificate checks or weaken auth cookies to make the tunnel work.

New `private-web` Docker target builds the actual SPA plus this entry as nonroot Linux/amd64. Intended remote topology is Linux host networking for this web container (its own listener stays loopback), backend published only to host loopback14300, and an isolated new DB. Do not use bridge publication for a container listener bound to its internal127.0.0.1; it will not reach this server. Complete Compose/migration/runtime-identity/media/SMTP/recovery configuration is still pending; this image is not a deployable full stack by itself.

[Private-access receipt](evidence/p29-private-access.json): verified-TLS host test PASS for proxy/SPA/static/Host/path boundaries and backend outage. Linux image build/import/HTTPS SPA probe PASS as UID1000, read-only, no capabilities and network disabled. Probe returned login HTML200 and absent API502; this is **not authenticated login or actual browser/SSH evidence**. A64MiB Docker cap was requested; emulated process RSS was98787328bytes, so this short probe is not proof of web memory capacity. No retained data, remote command, certificate trust change or secret transfer occurred. Earlier backend/frontend receipts retain their original build hashes; the new receipt owns changed Dockerfile/context/private-web hashes.

## Actual gateway command follow-up

User supplied `ssh -t` through Cloudflare Access to `vlab@ssh-lab.bcse-vju.com` followed by an assigned-session selector. The selector is a remote command on the gateway; its value is omitted here. Agent retried that exact route noninteractively with strict host-key checking: **exit255, Permission denied (password)**. No VPS command executed. This is an authentication failure, not an automatic approval rejection.

The command establishes an interactive gateway-selected shell when the user authenticates; it does not establish direct SSH forwarding to that selected VPS. `-N` would suppress the selector, and a `-L ...:127.0.0.1:14443` destination is relative to the SSH server, not automatically the selected VPS. The earlier generic helper must not be used for this route. Need the lab's supported per-VPS SSH/TCP forwarding mechanism or its connection documentation before constructing a correct tunnel; no passwords, private keys or tokens in chat. No gateway bypass, credential change or publicly exposed staging port is proposed.

## User-run image import handoff

User requested commands and asked why the new version is absent remotely. Agent SSH authentication is not the only gap: a complete runtime/migration/secrets/service package has not been completed. User-run deployment is an available execution model once that package exists; agent SSH is not mandatory. Do not imply a local startup probe equals a remotely deployable full stack.

[Image-transfer receipt](evidence/p29-image-transfer.json) records a local tar containing the two candidate Linux images, an import-only helper, README and checksums. No upload/remote import was executed. After authorized transfer/extraction on the correct VPS, `sudo sh load-images.sh` from the bundle directory checks integrity/conflicting tags and loads the exact images. It does **not** create/start services or databases, migrate retained data or change existing nginx/systemd. Full-stack startup instructions remain pending; this is not a substitute for them. The Cloudflare selector endpoint is not verified for scp, so no guessed scp command is supplied.

## Explicit retained Mac copy request

User has now chosen **all existing Mac hlf_dev_flow data into a NEW Docker DB on the VPS**, superseding synthetic-only scope for this specific SQL copy. [Copy handoff](mac-to-vps-database-copy.md) and [receipt](evidence/p29-mac-vps-transfer.json) record fresh backup and actual importer rehearsal PASS62tables/203rows/28migrations; encrypted clipboard-transfer package and separate hidden-key prompt are prepared. Actual remote execution NOT RUN. No existing VPS DB/service, application startup, public routing or release approval is implied. No original age/application key is bundled.
