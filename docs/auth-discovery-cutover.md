# Auth and Public Discovery Cutover

Approved scope: October 19, 2026. This operational handoff implements the user's scoped request; it is not production release approval. Later [final review](progress/V0.1.md) accepts V0.1; V1.0 remains unaccepted.

## 1. Approved decisions

DEC-01 selects a **new** `operator_admin`, not either legacy Admin. Preserve all account IDs, credential hashes and historical references. Legacy Admin IDs 3/6 become ordinary users; legacy owner IDs 2/5 also use ordinary identity. Account 2 retains restaurant 1 through its existing ownership; account 5 has no management capability. No ownership reassignment or deletion is approved. The new numeric authority ID is recorded by the protected provisioning transaction, not invented in documentation.

DEC-02 selects local RFC6238 TOTP (SHA1, six digits, 30 seconds, ±1 step), encrypted using AES-256-GCM with account-bound authenticated data and a separate 256-bit backend key. Consume the last accepted step atomically. Challenges expire after five minutes and five proof attempts; issuance and verification share independent MySQL account/IP quotas of 20 attempts per 15 minutes. Password verification alone issues no Admin session. Successful proof produces a 15-minute MFA-assured JWT under existing cookie/CSRF/Origin rules.

Ten random 128-bit recovery codes are shown once on the operator's private terminal, acknowledged as saved, and stored only as SHA-256 hashes. The user holds them in a separate password manager; the encryption key stays outside DB/repository. Password plus recovery code consumes the code, revokes all prior sessions/codes/challenges and disables the old factor. Re-enrollment through the protected CLI is mandatory before further Admin access. Loss of all factors uses OS/operator access and an Ed25519-signed manifest to re-enroll the **same** sole authority; no website reset/promotion endpoint exists. Existing signed-manifest requester/reviewer identity requirements remain enforced.

## 2. Migration lineage and retained data

Four recovered SQL files match the exact SHA-256 recorded in `_prisma_migrations`. They must never be replayed on the retained database. Historical SQL overlaps: `dev_order_flow` creates tables that later restaurant/dish SQL also creates. Consequently, plain historical replay on an empty DB is not supported.

- Existing DB: verify eight historical names/checksums, inventory conflicts, rehearse backup/restore, then use forward deploy.
- Empty DB: `npm --prefix backend run db:bootstrap` refuses any existing table, installs the consolidated legacy schema, checks schema fingerprints, then marks the eight historical migrations as **baselined**, not executed. It does not copy categories, accounts or business data.
- `npm --prefix backend run db:migrate` applies additive readiness, unique ownership, singleton/factor/challenge/recovery tables and a separate MFA quota table and a durable consumed-manifest request table. It does not change credentials, roles, account versions, operational flags, order snapshots, payment or commission history.
- Legacy restaurants default to `setup_required`. Existing `is_active`/`is_accepting_orders` values remain stored; public catalog excludes them until a separately authorized, evidence-backed readiness workflow exists.
- Prisma includes all observed retained business tables. Never generate a destructive diff from the earlier account-only schema.

The bootstrap snapshot retains the observed legacy schema, including its historical constraints; it is not a claim that every legacy order/finance table meets the commercial target. Read-only catalog and this identity slice do not enable those workflows.

## 3. Operator sequence

Run package commands from the repository root; scripts themselves execute in `backend`. Local schema expansion and initial Admin cutover are already applied, confirmed by a read-only October 19 check (one authority, one enrolled factor, one cutover audit). Do not rerun initialize locally. The sequence below documents the original initialize procedure and future explicitly authorized recovery; this verification task authorizes only isolated test writes. For production, configure separate runtime/migration/provision identities and deny runtime writes to the singleton authority; the later [authorized follow-up](auth-followup.md#local-operational-configuration--sec-01) configures fresh restricted local identities while preserving existing users/grants.

1. Stop retained-data writers during rehearsal/cutover. Provide a **new**, empty `test_*` database on isolated MySQL 9.2.0 through `RESTORE_DATABASE_URL`; do not reuse a shared or retained database.
2. Set `REHEARSAL_OUTPUT` to a new protected directory under `/private/tmp/`, then run `npm --prefix backend run db:rehearse`. It creates a private dump, restores it and compares row/schema fingerprints. Source access is read-only. Preserve the dump/evidence in protected operator storage before temporary storage is cleared.
3. Run `scripts/verify-upgrade.mjs` against the disposable restore (`DATABASE_URL` override). It verifies every original column/row, including snapshots and exact financial amounts, survives forward deploy. Do not run this test script on the retained DB.
4. Apply `CUTOVER_RESTORE_EVIDENCE=<verified-json-path> node scripts/expand-retained.mjs` from `backend` only after the above checks pass. This guard verifies the dump checksum, current source fingerprints and historical migration checksums before forward deploy. Rehearse again afterwards so provisioning evidence matches the expanded source schema exactly.
5. Supply `ADMIN_MFA_ENCRYPTION_KEY` from secure operator storage, not a tracked `.env`, browser setting or frontend bundle. Alternatively set `ADMIN_MFA_ENCRYPTION_KEY_FILE` to a protected external file containing only the original 64-hex key (optional final newline); keep its directory0700/file0600. The direct variable takes precedence. Keep a recoverable copy outside the DB backup and separate from recovery codes. Preserve the same key after restart; a new random key cannot decrypt an existing enrolled factor.
6. Prepare an Ed25519-signed manifest in protected external storage. Required fields: `request_id,environment,database,role,username,display_name,requester,reviewer,reason,approved_at,operation,legacy_admin_ids,legacy_owner_ids`. Initial values: `role=admin`, `username=operator_admin`, `operation=initialize`, `legacy_admin_ids=["3","6"]`, `legacy_owner_ids=["2","5"]`. Use actual operator/reviewer identities and environment/database names; do not fabricate signatures or review.
7. Set `ACCOUNT_PROVISION_MANIFEST`, `ACCOUNT_PROVISION_REVIEWER_PUBLIC_KEY`, `CUTOVER_RESTORE_EVIDENCE` (the verified JSON file) and `NODE_ENV`. Run `npm --prefix backend run account:provision -- --role admin --username operator_admin` in a private interactive terminal.
8. Enter/confirm the password without echo, import the displayed `otpauth://` URI into Authenticator, enter a valid TOTP and save the recovery codes. Type `SAVED` to acknowledge custody. The transaction then creates/enrolls the sole authority, applies exactly the approved legacy mapping, revokes old privilege-bearing sessions and appends audit. Any failure rolls back the transaction.
9. Verify ordinary/manager access and Admin password → challenge → TOTP → session. Record the allocated Admin ID only in protected operator evidence. Keep restaurant 1 setup-required.

For loss/re-enrollment use `operation=recover`, the same username and sole authority, a fresh signed request and current restore evidence. Recovery never changes the password or selects a different account. A successful initial request cannot be silently replayed to reset a factor; use the explicit recovery operation. SQL singleton constraints also reject concurrent second provisioning.

No password, URI, factor secret, recovery code, private signing key or database URL belongs in source, chat reports, screenshots or logs. The CLI intentionally cannot complete unattended.

## 4. Runtime and verification boundaries

- Public GET APIs: restaurants list/detail, dishes list/detail and category list under `/api/v1`; no auth dependency. Explicit public projections omit ownership, rates, bank and account data.
- Name-prefix search uses `utf8mb4_0900_ai_ci`; restaurant category/price filters require one visible dish satisfying all supplied filters. Pagination is signed, filter/sort-bound keyset pagination; IDs and VND stay strings. `min_price_vnd`/`max_price_vnd` in restaurant responses describe visible dishes, including sold-out dishes.
- Main homepage/menu contain no fixtures or invented pickup/delivery values. `/preview` is DEV-only. Managers retain buyer navigation; signup has no role input. Retired role-request HTTP routes return 404, while historical records remain stored.
- `npm --prefix backend test`, `run test:e2e`, `run test:integration`, lint/build and Prisma validate/generate are the application checks. Integration requires an isolated `TEST_DATABASE_URL`; its empty bootstrap uses the consolidated lineage.
- `npm --prefix frontend run test:smoke` covers offline/public and preview rendering. `run test:connected` requires a migrated disposable DB URL, compiled backend tests and Chrome. It runs real MySQL/auth/catalog, with only outbound SMTP/password-corpus replaced inside the guarded test harness. Test actors/data are synthetic and never written to retained storage.

Evidence and remaining operator work are recorded in [implementation status](implementation-status.md). Documentation or code completion does not imply that interactive provisioning or production cutover occurred.

## 5. Follow-up verification and acceptance

[Current implementation status](implementation-status.md) and [P01–P03 progress](progress/README.md) supersede the earlier pending-activation report. Clean `npm ci` dependencies match both lockfiles. CLI `test:cli` now exercises signed initialization and same-authority recovery through a private synthetic PTY; it does not bypass the production CLI's interactive requirement or attest human custody. `test:smtp` exercises a real local STARTTLS mailbox without external recipients.

From the repository root, provide an explicit loopback MySQL 9.2.0 `TEST_DATABASE_URL` naming a fresh, empty `test_*` DB, then run `npm --prefix backend run test:cli`. Requires Python 3 with `pty`, local `mysql`/`mysqldump` clients and a DB identity able to create isolated rehearsal databases. The harness refuses nonempty targets, preserves raw terminal output only in memory, deletes temporary synthetic signing/enrollment artifacts and leaves test databases for inspection. Stop the dedicated test container after review. Never use a retained DB or human reviewer signature for this harness.

For `npm --prefix backend run test:smtp`, use a migrated disposable `test_*` DB and installed OpenSSL. A temporary trusted test certificate and synthetic SMTP credentials are generated; real Nodemailer uses STARTTLS and AUTH against loopback only. No production TLS bypass or external delivery is introduced. Runtime/provision separation and approved local configuration are verified in the [follow-up](auth-followup.md); V0.1 is accepted in the [final review](progress/V0.1.md).

## 6. Restricted operator connections

The [follow-up](auth-followup.md) supersedes previous local-grant gaps. Runtime uses only `DATABASE_URL`; CLI provisioning requires distinct `PROVISION_DATABASE_URL` on the same database and never falls back. Load operator credentials only in a private subshell. Run migrations/rehearsals with a command-scoped `DATABASE_URL="$MIGRATION_DATABASE_URL"`; do not export operator credentials into the HTTP runtime. Reviewed grants: `backend/prisma/permissions/grants.sql`. Never rerun initialization against the already enrolled retained authority.

Operator connection file now resides at `/Users/namkhanh/.config/hoa-lac-food/operator.env`, with 0700 parent/0600 file, after checksum-verified movement from temporary storage during V0.1 acceptance. Use only a private operator subshell; runtime must not inherit these credentials.
