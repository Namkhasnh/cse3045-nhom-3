# Deployment and Operations — Hoa Lac Food Ordering Platform

> Status: source-derived deployment runbook; no deployment, backup, restore or test execution is certified by this document.
> Hosting, providers, infrastructure configuration and unverified commands remain **TBD**. Operational procedures below are proposed controls to implement and rehearse, not existing capabilities.
> Repository location: [docs/deployment.md](deployment.md). Current script availability is recorded in implementation-status.md (October 18, 2026); production decisions and execution evidence remain incomplete.

## 1. Sources, authority and release scope

Based on the repository specifications below; docs/README.md maintains navigation and distinguishes the existing scaffold from target capabilities.

| Source | Deployment authority |
| --- | --- |
| [requirements.md](requirements.md) | Product scope, roles, BR/AC, NFR03 security and NFR08 daily backups/verified restore |
| [architecture.md](architecture.md) | Modular monolith, placement direction, transactions, security, polling and integrations |
| [database.md](data/database.md) | MySQL constraints, exact arithmetic, snapshots, migrations and retention boundaries |
| [api_contract.md](data/api_contract.md) | REST `/api/v1`, JWT/CSRF decisions, DTOs, errors, retries and provisioning gaps |
| [ui_convertion.md](ui/ui_convertion.md) | Real UI behavior, Vietnamese presentation, responsive checks and scope controls |
| [ai_integration.md](ai_integration.md) | AI readiness, privacy, deadlines, quotas, cost controls and fallback |
| [testing.md](testing.md) | Release checks, NFR measurement, OPS-01 restore evidence and result reporting |
| [development_guide.md](development_guide.md) | Toolchain verification, configuration, scripts, safe migrations and seeds |

Follow the development guide's precedence: requirements → architecture → database → API → UI → AI; inspect application source/manifests/lockfiles for implemented behavior and commands. Testing defines evidence. This runbook does not resolve upstream TBDs or claim scaffold folders are working features.

- **V1.0 at VJU:** public catalog/guest cart, ordinary buyer-managers/one restaurant each, sole MFA Admin, opening agreements, fixed surveyed points, cash+direct QR/refunds, durable history, finance/reports/support/users/audit, approved AI and proven operations.
- **V1.1:** reorder/random/favorites/reviews; **V1.2:** free address/map pin, route fees and expansion. Later features require their own completed contracts.
- Restaurants deliver their own orders. Ordinary users retain buying rights with current management of at most one restaurant; one MFA Admin has administrative capabilities only. No driver accounts, platform payment processing, automatic splitting/collection, multi-restaurant orders or AI conversation storage.
- A required V1.0 decision remains a release blocker. Keeping an unfinished V1.0 feature disabled during development does not establish a complete V1.0 release.

## 2. Stack and component placement

| Component | Required design | Placement / unresolved choice |
| --- | --- | --- |
| Frontend | Vite + React + TypeScript; Tailwind CSS; browser SPA | Built static assets served publicly; hosting/service/region **TBD** |
| Backend | NestJS + TypeScript; REST + JSON `/api/v1`; JWT | One modular monolith deployed as a unit; runtime host/process supervision/instance count **TBD** |
| Data access | Prisma, owning repositories and shared workflow transactions | Backend only; installed versions/config from lockfiles |
| Database | MySQL/InnoDB, real FKs, enforced CHECKs | Private network; backend runtime access, separately controlled migration/backup/recovery access; service/host/region **TBD** |
| Images | Optional Dish image references; media/storage adapter if uploads enabled | Conditional object storage proposal; provider/location/retention **TBD**; no image blobs in MySQL or durable uploads on temporary app filesystems |
| AI | Backend `AiGateway` adapter | External provider/model/endpoint **TBD**; no browser provider calls |
| Maps | Backend route adapter after V1.0 | Provider **TBD**; valid surveyed V1.0 pairs do not depend on online routing |
| Public entry | Architecture's proposed same-origin reverse proxy | Frontend at the selected origin, `/api/v1` routed to backend; domain/proxy/TLS implementation **TBD** |

The three logical tiers are presentation, business logic and data. Separate frontend/backend placement does not turn modules into microservices. The V1.0 does not require Redis, a broker, queues or a driver dispatch service.

CI uses Node.js `24.x`; installed package versions are recorded in manifests/lockfiles. Pin the exact production Node.js patch and npm before deploying; MySQL is selected as **Oracle MySQL Community Server 9.2.0** in database §1. MySQL 8.0.16 is only the historical CHECK floor. A MariaDB-named Prisma adapter does not change the MySQL target. Preserve the repository's actual Prisma configuration, including `prisma7.config.ts` where present.

## 3. Environment configuration

| Area | Local | Staging | Production |
| --- | --- | --- | --- |
| Purpose | Development and disposable tests | Release/migration/security/recovery rehearsal | Live VJU operation for the approved milestone |
| Frontend/backend | Verified dev scripts on developer machine | Built release artifacts on **TBD** infrastructure | Verified artifacts on **TBD** infrastructure |
| MySQL | Disposable local InnoDB database | Separate database with representative synthetic fixtures | Retained live data; no demo seeds/reset |
| Public origins | Loopback; backend defaults to 3000, Vite to 5173 (verify printed URL) | Separate HTTPS domain/origin **TBD** | HTTPS domain/origin **TBD**; same-origin direction preferred |
| Credentials | Development-only values | Separate staging identities/keys | Separate production identities/keys with controlled access |
| External services | Adapter mocks for deterministic tests | Mocks plus bounded synthetic live AI evaluation | Only configured, validated integrations for enabled scope |
| Data bootstrap | Guarded local/test seed if configured | Controlled synthetic setup; seed only an explicit local/test target | Approved first-admin/partner bootstrap in §6 |
| Recovery | Disposable fixtures for procedure development | Isolated restore rehearsal and evidence | Daily backup; approved incident recovery only |

Keep environment databases, credentials, storage locations and provider allowances separate. Do not copy real contacts, orders, bank/QR data or private user content into test fixtures. Staging should reproduce the selected production MySQL version, constraints, collation, SQL mode and transaction isolation behavior; record any differences affecting test evidence.

### 3.1 Configuration inventory

These are logical settings, **not invented environment-variable names**. Map each to verified code/config and update safe `.env.example` files before use.

| Logical setting | Required value / status |
| --- | --- |
| Runtime environment, backend listen address/port | Current `PORT` defaults to `3000`; runtime-mode/bind/deployment configuration remains TBD |
| Database connection and runtime identity | Current `DATABASE_URL`; MySQL URL without query/fragment, credentials URL-encoded; per-environment values backend-only and TBD |
| Migration and backup/recovery identities | Separate privileges from runtime; provisioning/access procedure **TBD** |
| SQL settings | InnoDB, strict SQL mode, UTC sessions, `utf8mb4`; exact collation/isolation **TBD**, documented and tested |
| Business time | `Asia/Ho_Chi_Minh` for opening hours, display and monthly boundaries; persist UTC instants |
| Frontend API base/origin | Public value; route through `/api/v1`; exact config name **TBD** |
| JWT signing material, issuer, audience | Backend only; per-environment values TBD, lifecycle and rotation policy in API §2 |
| Origin/CORS/CSRF/cookie configuration | Configure one exact HTTPS origin and backend CSRF HMAC key; names/protocol in API §2 |
| Delivery quote authentication | Encoding/protection and required material **TBD**; not assumed to be JWT; route TTL/normalization remain post-V1.0 gates |
| AI endpoint/model/credentials and limits | Backend only; readiness and limits in §12; exact settings **TBD** |
| Map routing credentials / public rendering key | Conditional post-V1.0; privileged keys backend only; public key restricted by domain/quota |
| Image storage and upload controls | Conditional; provider, object location, allowed types/size and access settings **TBD** |
| Health/log/alert/backup configuration | Implementation, destinations and access **TBD**; complete §§8–10 before live operation |
| Feature availability | Match approved milestone and backend contract; configuration mechanism **TBD** |

Never commit real `.env` files or put DB/JWT/AI/storage secrets into `VITE_*`, bundles, documentation or logs. Frontend build configuration is public. Record environment-specific public configuration with the frontend artifact and verify it before promotion; do not assume changing backend runtime settings changes a built SPA. Example files contain placeholders only; they are not production credentials.

### 3.2 Local startup sequence

1. Inspect `frontend/package.json`, `backend/package.json`, their lockfiles and Prisma config; record verified versions/scripts.
2. Start disposable MySQL/InnoDB, create a local database and least-privilege development identity, and set the actual backend configuration.
3. Install from each package's reviewed lockfile and generate Prisma Client. Four account/audit/version/login/email-role migration files exist; apply reviewed forward SQL with `prisma7.config.ts` on the intended target.
4. Run a seed only if configured and explicitly guarded for the local/test database. Use fictional data and label fees/distances as test values.
5. Start the backend/frontend dev scripts. Current checks cover startup/DB connectivity, the fixture page and `/api/v1` envelope behavior; legacy auth exists; the revised commercial identity and surveyed cash/QR ordering remain target flows.

Inspect tooling from the repository root; development_guide.md §12 lists verified package commands:

```bash
node --version
npm --version
mysql --version
npm --prefix frontend run
npm --prefix backend run
npm --prefix frontend ci
npm --prefix backend ci
```

Current local commands: `npm --prefix backend run dev`, `npm --prefix frontend run dev`, `npm --prefix backend run prisma:validate` and `npm --prefix backend run db:check`. Current build commands are `npm --prefix frontend run build` and `npm --prefix backend run build`; backend production start is `npm --prefix backend run start:prod`. These scripts do not select hosting, deployment automation, health endpoints or process supervision.

For new migration work use the pinned Prisma CLI with explicit `--config prisma7.config.ts` from `backend/`; this custom filename is not assumed to be auto-discovered. `migrate dev` is for intended disposable local work; retained/shared environments need reviewed deploy migrations. There is no migration/seed wrapper or configured seed yet. Do not download a different CLI version silently.

## 4. Domain, HTTPS, CORS and secrets

1. Record production/staging domain ownership, DNS records, frontend/API routing and certificate issuance/renewal responsibility: **TBD**.
2. Implement and test HTTPS public access and redirects. For the proposed same-origin setup, route `/api/v1` to NestJS; SPA navigation must load on refresh without swallowing API errors into an HTML fallback. Exact proxy configuration is **TBD**.
3. Keep MySQL off the public application interface. Verify runtime minimum grants and separately controlled migration/maintenance privileges, including protections for append-only audit, history and receipts.
4. Serve the SPA and `/api/v1` from the same public HTTPS origin. A separate-origin deployment requires a reviewed API transport change with explicit CORS origins, credentials and CSRF behavior; never use wildcard origins with cookies.
5. Deploy the API §2 same-origin 15-minute JWT cookie, no refresh, versioned logout and bounded key rotation. Configure distinct backend signing and CSRF keys and exact issuer/audience/origin per environment; never expose tokens in JSON or browser storage.
6. Enforce exact Origin checks and the session-bound `X-CSRF-Token` protocol on authenticated writes; protect login/register with Origin checks. Test rejection paths before release.
7. Select the secret delivery/access mechanism (**TBD**), keep secrets backend-side, and document authorized custodians and recovery/rotation steps. Verify Argon2id parameters against API §2.
8. If uploads are enabled, validate ownership, actual MIME type, format and size on the backend; use generated storage keys. Final limits are **TBD**; the UI's 5 MB example is not policy. Public Dish images must not make recipient/supporting documents public.

Student registration and privileged provisioning need outbound HTTPS access to the Pwned Passwords range API. Permit only that destination for this check, verify TLS, and monitor failed lookups. A failed lookup returns 503 and creates no account. Login remains available during a lookup outage.
New registration also needs a configured SMTP relay (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`) and outbound TLS. Verify sender ownership, provider limits and deliverability before enabling public registration. A failed send leaves an unverified account that can request a new code; it grants no session or privileged role.
For login IP throttling behind a reverse proxy, set `TRUSTED_PROXY_IPS` to the exact socket peer IPs of controlled proxies. Those proxies must overwrite any inbound `X-Forwarded-For` before forwarding. Without this configuration, the backend uses the socket peer IP and may group users behind one proxy into one limit bucket.

Record and test certificate renewal, secret replacement and resulting session/quote behavior once mechanisms are selected. Do not claim a rotation/revocation capability before implementation.

## 5. Build, release and migration procedure

### 5.1 Release preparation and staging

1. Assign release operator/reviewer, milestone, commit and release identifier; record enabled features and unresolved gates. Provider/infrastructure selection is not implied by a release record.
2. Verify/pin toolchain and exact scripts. Install both packages from lockfiles; generate Prisma Client; run the actual frontend/backend builds, lint/type checks and applicable tests. Record `NOT CONFIGURED` for missing tooling, never a successful result.
3. Package the built Vite assets and NestJS application with required runtime dependencies, Prisma artifacts and reviewed migrations. Packaging format, artifact location and retention are **TBD**. Exclude real environment files/secrets; record checksums and configuration references without values.
4. Inspect migration SQL, including CHECKs, composite FKs, uniqueness, indexes and explicit `ON DELETE RESTRICT` / `ON UPDATE RESTRICT` actions. Keep custom SQL constraints represented so future migrations do not remove them accidentally.
5. Rehearse migration on empty and representative upgrade databases using real MySQL/InnoDB. Verify actual constraints, runtime grants and the selected isolation/locking behavior; SQLite/ORM mocks are insufficient.
6. Deploy the candidate to staging, run §7 and the enabled-scope suites in [testing.md](testing.md), measure NFRs, and rehearse backup/restore and the relevant rollback path. Retain sanitized results.
7. Freeze a release record with artifact identifiers, schema/migration state, compatibility assessment, approved configuration and backout plan. Record the previous known-good application and compatible schema state.

### 5.2 Production release

1. Confirm staging evidence, operations ownership, bootstrap readiness and successful isolated restore evidence. Resolve every decision required for enabled V1.0 behavior.
2. Confirm a recent verified daily backup and take/verify a pre-migration backup for a data/schema change; include image recovery references if applicable. Record the recovery point and expected interruption/data-loss implications.
3. Select the reviewed traffic/write-control procedure (**TBD implementation**). Drain requests before incompatible changes; prevent new writes during any migration that cannot coexist safely with current readers/writers. Do not assume rolling/zero-downtime deployment is supported.
4. Apply reviewed deploy migrations once through the controlled migration identity. Record start/end, exact command and result; stop on failure. Do not allow competing application instances to run migrations independently.
5. Verify schema state and invariants, deploy compatible backend/frontend artifacts, apply environment-specific configuration, and run health/readiness checks before directing traffic to them. Exact rollout/start commands are **TBD**.
6. Complete §7, inspect operational signals and resume permitted traffic/writes. Record operator/reviewer, outcome and any rollback decision. Observation period and rollback thresholds are **TBD**.

For populated databases use **expand → backfill → validate → constrain → contract**. Backfill in bounded batches from trustworthy data. Never reconstruct missing historical snapshots from current menus/policies. Retire old readers before contracting the schema; coordinate app compatibility explicitly.

Never edit an already-applied migration, run reset/force-reset/destructive schema push against retained data, or run demo seeds in production. Use forward corrective migrations. A failed migration requires inspecting actual migration/schema state before a reviewed recovery; do not blindly rerun or mark it successful.

## 6. First Admin and initial partner bootstrap

Target procedure for P03/P10/P29–P35; not execution authorization. [Account security](account-security.md) owns singleton MFA/recovery; [migration plan](data/migration-plan.md) owns legacy mappings. The current signed-manifest CLI implements the accepted V0.1 sole-authority/MFA model; retired role approvals grant no authority. See [acceptance evidence](progress/V0.1.md). Never run the previous role-based provisioner after cutover.

1. Inventory real target/migration state without exposing contacts/secrets. Operator explicitly selects primary Admin and resolves all legacy privilege/ownership conflicts under DEC-01. Never auto-select/delete old identities.
2. Adapt protected operator provisioning to sole authority and approved DEC-02 MFA enrollment/recovery; protect credentials/manifest/signature/keys outside Git and command arguments. Verify environment/database/MySQL 9.2.0, approval and singleton state before writes. Runtime must not provision authority; no website Admin grant exists.
3. Establish the one Admin with MFA; verify password-only denial and recovery/revocation in staging. Secure factor/recovery custody; remove temporary access. Operational backup people do not mean additional application Admins.
4. Real partners use approved opening application/review or manual create-with-eligible-user plus valid agreement evidence. Each account owns at most one restaurant, including inactive/setup-required records. Create ownership/partner/review/audit/result atomically; ordinary manager retains buyer rights.
5. Verify actual partner profile/consent, menu/hours/media, VJU points and surveyed restaurant–point distance/fee, explicit commission and direct QR payee/configuration. No default rate, fictional survey or copied bank data.
6. Partners stay setup_required/not accepting until all readiness checks pass. V1.0 QR readiness additionally follows approved DEC-06 evidence/refund procedures; cash readiness alone does not satisfy the full launch gate.
7. Approve limited pilot cohort/limits/window/support/rollback plan before real P32 traffic. Final P35 production release requires explicit approval of the concrete P34 dossier/candidate.

Never seed fictional orders/finance in production, fabricate consent or erase history to make bootstrap pass. The [launch checklist](release-checklist.md) records real evidence, not completed instructions.

## 7. Release checks and acceptance evidence

Use [testing.md](testing.md) case IDs and source traceability. Full mutation/race/failure-injection checks run in isolated staging/test data. Production checks should use safe reads and actual authorized workflows; do not generate fake payments, receipts or irreversible test history in live data.

| Check | Required observation |
| --- | --- |
| Routing/assets | HTTPS origin, SPA deep-link refresh, frontend assets/fonts and `/api/v1` JSON work; no mock/demo success paths or secret-bearing bundle |
| Auth/security — AUTH-01/02, SEC-01 | Approved login/expiry/CSRF/CORS behavior; current role/ownership enforced; private data inaccessible across accounts/restaurants |
| Discovery/delivery — CAT-01, DEL-01 | Real active catalog and Pickup points; correct surveyed pair quote; absent/disabled pair blocks confirmation |
| Checkout/recovery — PRICE-01, IDEM-01/02 | Server totals and immutable snapshots; changed price/fee requires consent; lost-response/reload retry with original payload/key returns one Order |
| Fulfillment/payment — STATE-01, RACE-01, PAY-01 | Owner transitions `pending→accepted→delivering→completed`; rejection requires reason; Student cancels own pending only; cash confirmation independent |
| Finance/audit — FIN-01–05, AUDIT-01 | Completion + one base commission atomic; delivery excluded, snapshotted rate and half-up rounding; same-restaurant one-time settlement assignment; durable keyed receipts/adjustments and audit |
| History — HIST-01, CRUD-01/02 | Old snapshots retained after edits; ordered Dish hides, Restaurant with history deactivates; active orders/receivables remain |
| AI — AI-01–04 | Eligible IDs only, no prohibited provider data/writes; safe timeout/fallback, manual surveyed ordering available; required policies/limits finalized |
| UI — UI-01/02 | Vietnamese copy/Be Vietnam Pro and role layouts; loading/error/conflict/missing-image states; complete 360 px flow without page horizontal scroll; keyboard/focus/accessibility checks |
| Recovery — OPS-01 | Daily backup runs evidenced and isolated restore passes §10 before go-live |

Verify canonical string IDs/money, eight-decimal fraction rates and UTC timestamps; backend authority remains unchanged by deployment. Order polling is approximately every 5 seconds while visible, without overlap, paused hidden/offline with bounded backoff. Terminal Order states stop order polling; Payment state is tracked separately.

Measure proposed NFR targets in the documented environment: at least 95% of Restaurant/Dish list loads within 2 seconds at 50 concurrent users; at least 95% of AI requests within 5 seconds, with retry/manual fallback at 10 seconds. Include failures/timeouts, polling load, resource sizes and workload in the report; these are not achieved guarantees.

Retain release/commit, exact commands, versions/config references, milestone, fixture, timestamps, case IDs, pass/fail/blocked counts and sanitized artifacts. Use `NOT CONFIGURED`, `NOT RUN`, `BLOCKED: <decision/source>` or `NOT APPLICABLE: <milestone>` accurately. Missing required evidence blocks claiming release readiness.

## 8. Health checks, logs, alerts and incident response

Health endpoints, paths, response schemas, polling intervals and access controls are **TBD**; no `/health` route is established by the API contract. Implement and verify the following proposed checks without inventing a public business endpoint:

| Signal | Meaning / proposed response |
| --- | --- |
| Process liveness | Backend can respond; supervision/restart policy **TBD** |
| Application readiness | Required config and compatible schema available; safe DB connectivity check succeeds; withhold traffic if core ordering cannot run |
| Public journey | HTTPS/frontend/API accessibility and authorized read checks; no routine synthetic financial writes in production |
| AI/provider degradation | Track separately from core readiness; an AI outage must not disable valid manual surveyed ordering |
| Database/transactions | Connection failures, capacity, transaction failures, deadlocks/lock timeouts and bounded retries; investigate invariant failures immediately |
| Backup/storage/TLS | Failed/missed daily backup, restore validation failure, storage exhaustion, missing image objects and certificate expiry/renewal failure |
| Performance/cost | API/provider latency, error/timeout rates, rate limits, conflict trends, AI/map quota and spend consumption |

Operational logs contain safe request/correlation/resource IDs, appropriate actor IDs, outcome categories and timing. For AI, include model/template/config versions, stage durations, candidate/result counts and tokens/cost where available. Do not record passwords/hashes, JWT/cookies/auth headers, secrets, full recipient details, prompts/preferences/candidate payloads/raw responses, or QR/bank secrets in logs, traces, analytics or error reports.

Transactional `audit_logs` retain required actor/time/action/target/redacted changes with the mutation. Audit failure rolls back the business transaction. Operational log-collector failure is separate and must not itself fail business operations. Neither log collection nor backups may introduce AI conversation storage.

Log destination, access, retention, alert tool/channel, threshold/window, acknowledgement time and escalation contacts are **TBD**. Configure actionable alerts with an assigned responder before go-live; distinguish expected business 409 conflicts from abnormal spikes. Rehearse alert delivery using safe test signals.

Incident sequence: record safe timestamps/request IDs and affected scope → assess data integrity and ongoing writes → use the approved traffic/write-control mechanism if needed → investigate release/config/DB/provider signals → choose compatible app rollback or §10 recovery → validate → restore service → record cause and corrective action. Do not repair an incident by deleting history or inventing payment/commission facts.

## 9. Backup policy and verification

**NFR08 mandates daily database backups and a successful verified restore before go-live.** Daily frequency does not establish an approved RPO/RTO; missed jobs and post-backup transactions affect actual loss.

| Policy item | Required handling / decision |
| --- | --- |
| Schedule | Daily; exact local time, timezone and scheduler **TBD**; record last successful backup and expected next run |
| Additional recovery point | Proposed pre-change backup before production schema/data migration, referenced by release record |
| Method | MySQL/InnoDB-consistent backup; tool, options and consistency procedure **TBD**, tested with concurrent writes/schema-change controls |
| Contents | Complete application database and schema/migration state: catalog/config, accounts, orders/items/snapshots, both histories/payments, commission/settlement/receipts, durable request records and audit |
| Location | Protected destination outside the application's failure scope; provider, region, exact path/bucket and access mechanism **TBD** |
| Protection | Proposed restricted backup/restore identities and encrypted transfer/storage; selected mechanism/key custody **TBD**; backups contain sensitive records |
| Retention | Number of copies/days, expiry mechanism and storage budget **TBD**; do not invent 7/30/90-day policies |
| Images, if stored | Object copies/versions and DB-reference consistency; destination, schedule and retention/recovery alignment **TBD** before enabling uploads |
| App/config recovery | Retain compatible artifacts, schema/config references and secure access to required credentials/decryption material; locations/retention **TBD**, no plaintext secrets in reports |
| RPO / RTO | Maximum acceptable data loss / recovery duration **TBD**; measure observed results and obtain an explicit decision |
| Verification frequency | Validate each backup job; successful isolated restore before go-live; recurring drill cadence **TBD** |

For each job record backup ID, start/end/recovery-point time, schema/app compatibility reference, byte size, checksum, protected location reference and success/failure. Verify readability, transfer completion and checksum; alert on failed/missing/stale backup. A nonempty file is insufficient evidence of recovery.

Before expiring copies, verify the approved retention policy and available validated recovery points. Backup expiry is not authorization to purge live financial/history/audit records. Their retention/anonymization remains **TBD**; successful `order_requests` and `financial_requests` must remain for their associated history lifetime, not a short TTL.

## 10. Restore procedure and evidence

Exact restore commands depend on the selected backup method/infrastructure and remain **TBD**. Record and rehearse them before production. A pre-live drill uses synthetic representative data and a separate isolated target, never overwrites production, and starts a compatible application.

1. Identify drill/incident, authorized operator, intended recovery point and target. For an incident, stop affected writes through the approved mechanism and preserve the current state for investigation; record the possible loss window.
2. Select a complete validated backup and compatible release/migration state. Verify checksum, accessibility and required decryption/credential access. Include matching image objects/references where applicable.
3. Prepare an isolated MySQL/InnoDB target with the documented version, collation, strict SQL mode, UTC sessions and isolation settings. Keep external effects and public traffic disabled during validation.
4. Restore schema/data with the approved tool; capture exact command/version, elapsed time and errors without credentials or personal payloads. Restore selected image objects and verify reference resolution if enabled.
5. Inspect actual constraints and migration state. Compare source backup manifests and restored counts for orders/items, order/payment histories, payments, request records, commission entries, settlements/receipts and audit; check FKs and required aggregate relationships.
6. Verify snapshots and exact financial totals: subtotal/items/fee/total, completed Orders with one base from snapshotted rate, no base for rejected/cancelled Orders, one same-Restaurant Settlement per entry, preserved receipts and unmodified history. Check durable key-to-result links and actor scope.
7. Start the matching app against the restored target; verify login, authorized reads and old Order snapshots. In the isolated synthetic drill, retry original successful order/financial intents and confirm the original results with no duplicates; create one safe new test Order and verify normal behavior.
8. Verify optional image retrieval, health/readiness and safe logs. Record validation results and observed recovery duration/loss; do not declare an unapproved RPO/RTO met.
9. For a live incident, reconcile the post-backup gap before reopening writes: previously confirmed Orders, Restaurant cash/QR receipts and manual Settlement receipts may exist outside the restored data. A stale backup may also lack successful idempotency records; do not blindly replay unknown intents or overwrite ledger history. The discrepancy-resolution procedure/owner is **TBD** and must be finalized before live operation.
10. Obtain the designated operations/recovery review, switch traffic/config using the tested cutover procedure (**TBD**), run §7's safe checks and monitor. Retain incident evidence and protect the old target until the approved retention/disposal decision.

### 10.1 OPS-01 evidence record

No restore evidence was supplied. Initial status: **NOT RUN — production recovery readiness is not demonstrated**. Complete this record with actual results; never fill it with hypothetical success.

| Evidence field | Value |
| --- | --- |
| Run ID / date / operator / reviewer | TBD |
| Synthetic fixture / application commit / migration state | TBD |
| MySQL/backup/restore tool versions and target settings | MySQL 9.2.0 selected; backup/restore tools and target settings TBD |
| Backup ID / recovery timestamp / size / checksum | TBD |
| Protected backup and sanitized report references | TBD |
| Isolated target / image recovery scope | TBD |
| Exact commands and start/end / duration | TBD |
| Before/after counts, snapshot comparisons, financial totals and constraint results | NOT RUN |
| Login/read checks, same-key recovery, safe new Order and image checks | NOT RUN |
| Failures, corrective action and rerun evidence | TBD |
| Observed loss window / RPO and RTO comparison | NOT RUN / targets TBD |
| Reviewer conclusion and go-live gate | BLOCKED until successful verified restore evidence exists |

## 11. Application rollback and incompatible migrations

Rollback tooling, artifact retention, decision thresholds and operators are **TBD**. Keep previous compatible frontend/backend builds and AI prompt/schema/model/config references in the release record.

| Situation | Response |
| --- | --- |
| App/config regression; schema remains compatible | Use approved traffic/drain procedure; restore prior compatible app/public config and backend secret references; validate `/api/v1`, assets, auth, reads and core invariants before resuming |
| Additive migration with verified old-app compatibility | Prior app may run against expanded schema; preserve data/new structures; document follow-up corrective migration |
| AI prompt/model/adapter regression | Restore the previously evaluated compatible static configuration/artifacts; preserve manual ordering and quota/privacy checks; no user transcript rollback/store |
| Failed or incompatible/destructive migration | Stop incompatible writers; inspect actual state; prefer a reviewed forward corrective migration where data integrity can be preserved; otherwise use approved §10 restore with explicit recovery point and loss reconciliation |

An application rollback does not roll back MySQL data. Do not run assumed down-migrations, delete migration history or reset retained data. Never deploy old code against an incompatible schema merely because its build starts.

Before a destructive migration, identify affected data, old/new app compatibility, verified backup and restore duration, write-freeze plan, and reconciliation owner. If historical snapshots cannot be recovered truthfully, resolve policy before migration. Retain successful idempotency records and financial/audit history during every backout.

Unknown order/receipt/adjustment outcomes use the original payload and `Idempotency-Key` against intact durable records; changed content conflicts. Settlement creation has no promised durable key: inspect existing results/assignments before retrying. Restored data gaps require §10 reconciliation before accepting stale retries.

## 12. Costs, AI/map quotas and integration controls

No provider, provider-billing currency, price, free tier, operating budget or capacity is established. Product money remains integer VND. Complete a cost register before enabling each paid integration; unavailable usage is **unknown**, not zero.

| Cost area | Record before use |
| --- | --- |
| Frontend/backend hosting | Provider/plan/region **TBD**; compute, transfer, build/deploy charges, allowance and spending owner |
| MySQL | Selected service/resources **TBD**; compute/storage/growth, backup and restore costs |
| Domain/HTTPS/observability | Selected arrangements **TBD**; renewals, log/metric storage and alert delivery costs |
| Images, conditional | Storage, requests, egress, retained versions and recovery cost **TBD** |
| AI | Provider/model **TBD**; pricing basis, input/output tokens, failed/retried billed calls, per-request and aggregate spend cap, period/currency |
| Maps, post-V1.0 | Provider **TBD**; routing/geocoding/rendering usage, unit pricing, quota period and spend cap; no routing dependency for valid V1.0 surveys |

AI launch requires approved budget/quantity/preferences semantics, privacy minimization, provider retention/training compatibility, prompt/schema versions and synthetic live evaluation. Finalize preference/candidate/byte/token/result limits, per-IP/account quotas, concurrency, retries/backoff, provider timeout and cost-accounting mechanism; all remain **TBD**. Missing limits must not mean unlimited access.

Retries share one workflow deadline and cost allowance. Reserve time for validation; provide retry/manual fallback at 10 seconds and ignore late results. Track request counts, token/cost metadata, latency, invalid outputs, provider errors and allowance exhaustion without content logs. Platform throttling uses `429 RATE_LIMITED`; timeout uses `504 AI_TIMEOUT`; proposed provider/quota/cost failure mapping is `503 AI_UNAVAILABLE` per AI documentation, subject to final approval.

Rate-limit login, order creation and financial confirmation while accounting for polling. Exact quotas are **TBD**. Before multiple backend instances, implement the architecture's shared/gateway limiting approach (**choice TBD**); in-process counters alone cannot enforce global quotas. DB uniqueness/idempotency remains mandatory regardless of limiter.

Map setup requires approved route distance normalization, quote expiry, fee tiers and bounded calls. Unknown route/eligibility/fee blocks confirmation; no straight-line or zero-fee substitution. Restrict any public rendering key by domain/quota and keep routing credentials backend-side. Review actual usage and projected costs on a cadence **TBD**, with thresholds and escalation assigned in §13.

## 13. Operations ownership and final readiness

These are operational responsibilities, not new application roles or implicit business permissions. One person may hold multiple duties, but named primary/backup owners and access must be recorded before go-live.

| Responsibility | Primary / backup / contact | Required handoff |
| --- | --- | --- |
| Service/release and incident coordination | TBD / TBD / TBD | Release decision, traffic controls, escalation and service reopening |
| Backend/security and secrets | TBD / TBD / TBD | Auth/CSRF, permissions, config/secret rotation and safe logs |
| Database/migrations/backup/restore | TBD / TBD / TBD | Daily jobs, failures, protected recovery access, drills and data reconciliation |
| Frontend/domain/HTTPS | TBD / TBD / TBD | Routing/assets, UI release checks, DNS/certificate renewals |
| AI/maps/storage and budget | TBD / TBD / TBD | Provider configuration, quotas, cost alerts, privacy and fallback |
| Partner/bootstrap and commission operations | TBD / TBD / TBD | Verified surveys, responsible owner accounts, rates and manual reconciliation |
| Release evidence/recovery reviewer | TBD / TBD / TBD | Test/NFR/restore evidence and recorded readiness decision |

Restaurant Owners remain responsible for their Restaurants' fulfillment and payment verification. Admin records manual commission receipts/adjustments under the contract; operations access does not grant Admin owner-only order/payment powers.

Before claiming production readiness, confirm:

- [ ] Hosting/placement, domains/HTTPS, network boundaries, pinned versions, exact scripts/config and access mechanisms recorded and verified.
- [ ] All required V1.0 security/business/integration/provisioning decisions resolved in owning documents; future scope remains disabled.
- [ ] Sole MFA Admin/recovery, ordinary buyer-manager accounts, approved agreements, real VJU pickup points, surveyed pairs, menus and explicit commission policies verified without demo production data.
- [ ] Reviewed builds/migrations and enabled-scope tests/NFR evidence accepted; safe post-release checks and compatible rollback rehearsed.
- [ ] Daily backup schedule/location/retention/access and alerts configured; OPS-01 isolated restore passed with evidence; RPO/RTO and incident gap-reconciliation decisions recorded.
- [ ] Conditional image recovery, AI/map quotas/cost controls and safe log retention configured for enabled services.
- [ ] Named owners/backups, escalation/acknowledgement process, alert thresholds, budget review and recurring recovery-drill cadence recorded.

Until these records and results exist, this document is a deployment plan, not authorization or evidence that the platform is ready for live operation.

### 13.1 Commercial release authority

[Roadmap](roadmap.md) P29–P36 and [release checklist](release-checklist.md) govern acceptance. Hosting/email/media/health/alerts remain DEC-10; RPO/RTO/retention/restore gaps DEC-11; exact public Vietnamese notices and launch criteria DEC-12. No missing answer, completed document or successful build authorizes production mutations. Prepare the complete candidate and evidence first, then obtain explicit release approval before P35.

The CI database service now pins mysql:9.2.0, matching the selected version across environments. Remaining implementation/evidence gaps are in [implementation status](implementation-status.md). This documentation revision runs no deployment, migration, provisioner, backup or restore. Historical role-request checks are not sole Admin/onboarding evidence.

## 14. Scoped runtime/provision identity configuration

[Verified local handoff](auth-followup.md) records the authorized local split and evidence. Runtime `DATABASE_URL` has reviewed auth/catalog grants; `PROVISION_DATABASE_URL` is mandatory for CLI, distinct and same-database. Keep provisioning/migration credentials in protected operator storage outside runtime `.env`; inject them only into private operator subprocesses. For migration jobs use command-scoped `DATABASE_URL="$MIGRATION_DATABASE_URL"`. Never give runtime global/database ALL, DDL, GRANT OPTION, authority writes or secret-replacement rights. Apply [grants](../backend/prisma/permissions/grants.sql) to fresh users without inherited roles; additive GRANT statements cannot narrow an existing broad identity. Production setup remains NOT RUN.

## V0.4 local-only configuration

[Local verification](setup-local-verification.md) uses isolated MySQL9.2.0/MinIO with MEDIA_LOCAL_TEST and distinct MEDIA_S3_ENDPOINT/BUCKET/ACCESS_KEY/SECRET_KEY. Only loopback media endpoints are enabled; bucket must differ from ONBOARDING_S3_BUCKET. No new VITE secret/config is introduced. Public image access is backend-gated rather than bucket-public. Quote protection now uses DB-backed random artifacts with15minute expiry, not an undecided signing algorithm. Guarded media:cleanup:local refuses non-test/nonlocal DBs; production provider, scheduler, region, backup and retention adoption remain DEC-10/11.
