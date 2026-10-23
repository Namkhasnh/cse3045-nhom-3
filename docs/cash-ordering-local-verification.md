# V0.5 local synthetic verification

Authority: [V0.5 prompts](prompts/v0.5.md), [API](data/api_contract.md), [database](data/database.md), [setup verification](setup-local-verification.md). These commands target disposable local test databases only. No real partners, surveys, consent, payments or notifications. No retained-data migration is authorized.

## Isolated environment

Use the existing isolated `hlf-v04-test` compose project from `backend/test/onboarding.compose.yml`: Oracle MySQL9.2.0 on loopback43316, pinned MinIO on43317. Development/retained MySQL3307 is separate. Inspect container identity/image/ports before executing. Create **new** databases; if names already exist choose unused `test_*` names, never drop/reset old databases to rerun.

```sh
docker compose -f backend/test/onboarding.compose.yml -p hlf-v04-test up -d
docker exec hlf-v04-test-mysql-1 mysql -uroot -psynthetic-v03-only \
  -e 'CREATE DATABASE test_v05_recheck; CREATE DATABASE test_v05_browser_recheck; CREATE DATABASE test_v05_upgrade_recheck;'
export TEST_DATABASE_URL='mysql://root:synthetic-v03-only@127.0.0.1:43316/test_v05_recheck'
export ONBOARDING_LOCAL_TEST=true
export ONBOARDING_S3_ENDPOINT=http://127.0.0.1:43317
export ONBOARDING_S3_ACCESS_KEY=synthetic-v03
export ONBOARDING_S3_SECRET_KEY=synthetic-v03-storage-only
export ONBOARDING_S3_BUCKET=v05-evidence
export MEDIA_LOCAL_TEST=true
export MEDIA_S3_ENDPOINT=http://127.0.0.1:43317
export MEDIA_S3_ACCESS_KEY=synthetic-v03
export MEDIA_S3_SECRET_KEY=synthetic-v03-storage-only
export MEDIA_S3_BUCKET=v05-dishes
```

Credentials above belong solely to the documented synthetic compose fixture, not retained environments. Keep media/evidence buckets separate. Integration preparation validates loopback/test name and MySQL9.2.0. Bootstrap consolidates/baselines the reviewed legacy SQL only on an empty target, then deploys forward migrations; no applied migration is rewritten.

## Automated checks

Run sequentially from repository root. Backend commands share/clean `.test-dist`; browser scripts share ports43127/43128/43129. Never overlap compilation with these scripts.

```sh
npm --prefix backend run lint
npm --prefix backend test
npm --prefix backend run test:e2e
npm --prefix backend run test:integration
npm --prefix backend run test:onboarding-permissions
npm --prefix backend run build
npm --prefix backend run prisma:validate
npm --prefix backend run prisma:generate
TEST_DATABASE_URL='mysql://root:synthetic-v03-only@127.0.0.1:43316/test_v05_upgrade_recheck' \
  npm --prefix backend run test:onboarding-upgrade
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run test:cart
npm --prefix frontend run test:orders
```

`test:integration` includes order aggregate/fulfillment and independent-process race suites. `order-race-worker.ts` runs two actual Nest processes/pools, guarded by loopback/test database and explicit test-worker flag. It is not a deployed service. Cases cover same/different-content keys, dropped response body, both serial accept/cancel outcomes and concurrent contenders, repeated completion/cash receipt, price/hide/deactivation races, authorization and snapshot preservation after rate/point edits. Restricted-runtime tests cover immutable snapshots/items/key hashes/history/milestones/base entries and actual HTTP workflows with fresh grants.

The historical `test:onboarding-upgrade` output retains its V0.4 label; it deploys all current forward migrations, including V0.5, over synthetic legacy rows and compares every original column. This is synthetic upgrade evidence, not a restore drill of the retained database.

## Browser evidence

Prepare a fresh browser DB and run scripts sequentially. Chrome path may be selected by BROWSER_BIN. Each script uses genuine cookie auth/CSRF/MFA/APIs/MySQL; only outbound password-corpus and SMTP delivery use the established test replacements. `test:checkout`, `test:fulfillment`, `test:tracking` each build a fresh partner through actual setup/approval/consent workflows before ordering. Tracking additionally creates explicitly synthetic pagination orders through the real order API. No SQL order-row insertion or readiness bypass is used for that acceptance.

```sh
export TEST_DATABASE_URL='mysql://root:synthetic-v03-only@127.0.0.1:43316/test_v05_browser_recheck'
DATABASE_URL="$TEST_DATABASE_URL" npm --prefix backend run test:prepare
npm --prefix frontend run test:tracking
```

Tracking contains checkout and fulfillment journeys plus offline/native hidden-tab pause/resume, held responses across state/payment changes, no overlap, terminal order/payment polling, reload, immutable snapshots and history pagination. It checks360/390/768/1024/1440px and keyboard/dialog behavior. Artifacts are printed by each script; inspect mobile and desktop screenshots visually. `test:orders` deterministically checks scheduler timing/backoff and independent version merging.

Run existing `test:smoke`, `test:connected`, `test:onboarding`, `test:settings`, `test:delivery`, `test:dishes`, `test:setup` on additional fresh test databases as appropriate. Repeated Admin journeys in one database can exhaust genuine MFA quotas; use a fresh disposable database rather than resetting limits/history or weakening protection. No order-write `test:local-demo` is authorized against the retained sample database.

## Retained-data handoff

V0.5 migrations are reviewable source artifacts only for retained environments. Adoption requires its own authorized task, verified backup/restore of that exact retained schema/data, migration checksums/inventory and a forward rehearsal preserving identities, ownership, consent, snapshots and histories. Stop if inconsistent legacy relationships prevent composite constraints; obtain a preservation mapping instead of inventing/deleting facts. This task does not run that adoption or enable real partner traffic. Until adoption, the retained database does not provide the new order schema; do not use it for checkout acceptance.

## System-review order replay header regression

Authenticated HTTP E2E asserts POST /orders returns201/Idempotency-Replayed:false/Location on first creation and200/Idempotency-Replayed:true on replay, preserving the response envelope and CSRF guard. This E2E stubs only the create workflow; it does not prove durable idempotency. The real MySQL order integration separately asserts both header variants for competing same-key requests and exactly one order, initial order/payment history and creation audit; committed-response-loss recovery must also return the replay header. [Implementation status](implementation-status.md#system-review-defect-fixes--october-20-2026) records the new run separately from historical V0.5 acceptance.
