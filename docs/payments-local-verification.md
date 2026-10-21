# V0.6 isolated local payment verification

Authority: [approved DEC-06 policy](payments-policy.md), [P19](progress/P19.md), [P20](progress/P20.md), [V0.5 safety boundary](cash-ordering-local-verification.md). Synthetic accounts/QR/receipts only; never partner consent, real banking evidence or payment movements. No retained-data/production adoption.

## Environment and target refusal

Docker28.4.0, Oracle MySQL Community Server9.2.0/InnoDB in `hlf-v04-test-mysql-1` on127.0.0.1:43316; pinned MinIO on43317. Retained `hlf-dev-flow-mysql` on3307 was not accessed. Existing installed Node24.21.0/npm11.19.0 and pinned lockfiles reused; no dependency upgrade. Chrome binary `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.

Verify identity/version first. Pick unused names each run; never drop/reset a previous test DB. Credentials below are the public synthetic compose fixture only:

```sh
docker version --format '{{.Server.Version}}'
docker ps --format '{{.Names}} {{.Image}} {{.Ports}}'
docker exec hlf-v04-test-mysql-1 mysql --version
docker exec hlf-v04-test-mysql-1 mysql -uroot -psynthetic-v03-only \
  -e 'SELECT VERSION(); CREATE DATABASE test_v06_recheck; CREATE DATABASE test_v06_browser_recheck; CREATE DATABASE test_v06_upgrade_recheck;'
export TEST_DATABASE_URL='mysql://root:synthetic-v03-only@127.0.0.1:43316/test_v06_recheck'
export DATABASE_URL="$TEST_DATABASE_URL"
export ONBOARDING_LOCAL_TEST=true
export ONBOARDING_S3_ENDPOINT=http://127.0.0.1:43317
export ONBOARDING_S3_ACCESS_KEY=synthetic-v03
export ONBOARDING_S3_SECRET_KEY=synthetic-v03-storage-only
export ONBOARDING_S3_BUCKET=v06-evidence
export MEDIA_LOCAL_TEST=true
export MEDIA_S3_ENDPOINT=http://127.0.0.1:43317
export MEDIA_S3_ACCESS_KEY=synthetic-v03
export MEDIA_S3_SECRET_KEY=synthetic-v03-storage-only
export MEDIA_S3_BUCKET=v06-dishes
```

Private payment objects use database-isolated prefixes so equal restaurant IDs in different disposable databases cannot delete one another’s orphans. Private objects use `payments/{database_namespace_hash}/{restaurant_id}/` in the evidence bucket; dish objects remain separate. Image decode/reencode removes metadata; it does not prove owner redaction. Image processing/GET/storage occur outside retried DB transactions. New payment SQL is additive; second scoped-reference migration does not rewrite the first after application.

## Sequential checks

Run from repository root. Never overlap backend compilation with any backend/browser harness; browsers share43127/43128/43129. `test:integration` prepares only allowlisted loopback test databases; HTTP E2E uses mocks and cannot prove SQL races.

```sh
npm --prefix backend run lint
npm --prefix backend test
npm --prefix backend run test:e2e
npm --prefix backend run test:integration
npm --prefix backend run test:onboarding-permissions
npm --prefix backend run build
npm --prefix backend run prisma:validate
npm --prefix backend run prisma:generate
TEST_DATABASE_URL='mysql://root:synthetic-v03-only@127.0.0.1:43316/test_v06_upgrade_recheck' \
  npm --prefix backend run test:onboarding-upgrade
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run test:cart
npm --prefix frontend run test:orders
export TEST_DATABASE_URL='mysql://root:synthetic-v03-only@127.0.0.1:43316/test_v06_browser_recheck'
export DATABASE_URL="$TEST_DATABASE_URL"
npm --prefix backend run test:prepare
npm --prefix frontend run test:payments
```

For the focused FileReader/account race, prepare another new test DB with the same steps and run `PAYMENT_ASYNC_ONLY=true npm --prefix frontend run test:payments`. It holds a real FileReader, changes the actual cookie account, unmounts the old component, releases the reader and asserts zero private upload requests/storage/DB writes.

The payment integration group validates actual new HTTP responses against [payment schemas](data/payments.openapi.json), MySQL nested-scope FKs/CHECKs, two serial orders and6 confirmation/cancel-or-reject races across two Nest processes/pools, durable/bank-event duplicate protection, wrong/triple payments, full refund replay and audit rollback. It verifies instruction replacement/suspension, protected evidence and actual storage deletion/dispute hold. Restricted harness repeats8 HTTP groups using a fresh limited runtime identity plus immutable-money/identity SQL denials. Explicit legacy compatibility fixture retains pre-existing paid without fabricated QR snapshots/receipt history.

`test:payments` includes full prior checkout/cash fulfillment baseline, then actual owner QR submission, MFA Admin review, QR checkout, claim remaining unpaid, cancellation/late receipt/full direct-refund recording, committed-response-loss/reload/replay, stale reply/account guards, scoped disputes and five-width screenshots. Synthetic transport failures/held replies exercise recovery after real backend work; no mocked financial success. Password-corpus/SMTP are replaced only in the disposable browser server. Repeated Admin login waits for a fresh TOTP step rather than resetting MFA state.

## Cleanup and operational boundary

`payments:cleanup:local` is a guarded maintenance CLI, not an unkeyed financial HTTP endpoint. It requires `PAYMENT_LOCAL_TEST=true`, explicit synthetic MFA Admin/restaurant IDs, loopback and a `test_*` database. Missing/retained targets fail before boot. It claims expired unlinked24h/settled90day evidence under locks, excludes pending obligations/open disputes/live QR snapshots, removes objects outside transactions and records deletion/audit; retry reconciles a claimed deletion. Untracked old storage orphans are scanned only under the selected database/restaurant prefix. Cleanup does not delete image keys outside that namespace, including imported/historical keys; those need a separate reviewed mapping. Do not schedule this CLI against retained or production storage.

No commercial partner onboarding, survey, bank account, consent, transfer or refund is proven by fixtures. Retained adoption requires a separately authorized complete V0.5/V0.6 backup/restore/rehearsal/grants task. Production storage/backup/hosting remain NOT CONFIGURED under DEC-10/11/12; remote CI and independent review remain NOT RUN. [Progress records](progress/README.md) own actual source fingerprints/logs/results.

## System-review refresh regression

Explicit QR refresh reads authoritative payment, instructions and disputes using the current account/order scope. Payment versions and abort guards prevent older refresh/mutation/lookup responses from replacing newer financial state; pending refresh and retry errors remain visible. The Admin page also isolates account/restaurant-prop lifetimes.

The Chrome payment journey now keeps Admin on a refunded order while an independent owner cookie session uploads synthetic proof and records another late receipt through real APIs. Refresh must issue a payment GET and show the new receipt, full pending obligation, exact refund due and refund_pending status. The journey holds both an old order-poll response and an old explicit payment refresh across receipt confirmation; it retains account-switch/private-response and FileReader regressions. Newly executed evidence is separated from historical acceptance in [implementation status](implementation-status.md#system-review-defect-fixes--october-20-2026).
