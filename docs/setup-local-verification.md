# V0.4 local verification

Synthetic isolated acceptance only; [setup contract](restaurant-setup-v04-contract.md), [focused OpenAPI](data/setup.openapi.json), [V0.4 evidence](progress/V0.4.md). Run from repository root. Do not use retained/production credentials, data or the existing development database.

## Environment

Use `backend/test/onboarding.compose.yml` under its separate `hlf-v04-test` compose project. It pins Oracle MySQL9.2.0 and builds the same MinIO2025-09-07 release from official source with a fixed commit/archive checksum and builder digest; see [storage setup](onboarding-local-verification.md). It exposes only loopback43316/43317 and uses its own named volumes. Existing development MySQL3307 was not modified. Synthetic credentials below belong only to this disposable compose fixture.

```sh
docker compose -f backend/test/onboarding.compose.yml -p hlf-v04-test up -d
# Create NEW test_* databases in this isolated container; do not reset an existing target.
docker exec hlf-v04-test-mysql-1 mysql -uroot -psynthetic-v03-only \
  -e 'CREATE DATABASE test_v04_recheck; CREATE DATABASE test_v04_browser_recheck; CREATE DATABASE test_v04_upgrade_recheck; CREATE DATABASE test_v04_setup_recheck;'
export TEST_DATABASE_URL='mysql://root:synthetic-v03-only@127.0.0.1:43316/test_v04_recheck'
export ONBOARDING_LOCAL_TEST=true
export ONBOARDING_S3_ENDPOINT=http://127.0.0.1:43317
export ONBOARDING_S3_ACCESS_KEY=synthetic-v03
export ONBOARDING_S3_SECRET_KEY=synthetic-v03-storage-only
export ONBOARDING_S3_BUCKET=v04-evidence
export MEDIA_LOCAL_TEST=true
export MEDIA_S3_ENDPOINT=http://127.0.0.1:43317
export MEDIA_S3_ACCESS_KEY=synthetic-v03
export MEDIA_S3_SECRET_KEY=synthetic-v03-storage-only
export MEDIA_S3_BUCKET=v04-dishes
```

The integration suite creates both private buckets if absent. MEDIA_S3_BUCKET must differ from ONBOARDING_S3_BUCKET. Public images are served through `/api/v1/dish-media/{id}` after database scope/visibility/readiness checks, not anonymous bucket access. Production endpoints deliberately fail closed pending DEC-10.

## Automated checks

Run backend commands sequentially because test compilation cleans `.test-dist`:

```sh
npm --prefix backend run lint
npm --prefix backend test
npm --prefix backend run test:e2e
npm --prefix backend run test:integration
npm --prefix backend run test:onboarding-permissions
npm --prefix backend run build
npm --prefix backend run prisma:validate
npm --prefix backend run prisma:generate
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run test:cart
TEST_DATABASE_URL='mysql://root:synthetic-v03-only@127.0.0.1:43316/test_v04_upgrade_recheck' \
  npm --prefix backend run test:onboarding-upgrade
```

Integration checks validate actual MySQL9.2.0 and reject a nonlocal/non-test database. Empty-target setup baselines existing reviewed legacy SQL and deploys forward migrations; it does not replay incompatible old ALTER scripts or modify applied migration files. The upgrade harness refuses a nonempty initial target and compares every original account/restaurant/legacy-request column while allowing additive columns. Permission checks create fresh runtime users, assert denied ownership/consent/hash/file-identity changes, run actual HTTP workflows and remove only their temporary identities.

## Browser checks

Google Chrome is required; BROWSER_BIN may select another installed Chrome executable. Each script starts backend43128, Vite43127 and Chrome debug43129; run scripts sequentially. Only outbound password-corpus/SMTP are replaced by the existing browser harness; cookies, MFA, APIs and MySQL are real. Fresh synthetic actors/fixtures are created in the guarded test database. No order-write endpoint exists in V0.4.

```sh
export TEST_DATABASE_URL='mysql://root:synthetic-v03-only@127.0.0.1:43316/test_v04_browser_recheck'
DATABASE_URL="$TEST_DATABASE_URL" npm --prefix backend run test:prepare
npm --prefix frontend run test:smoke
npm --prefix frontend run test:connected
npm --prefix frontend run test:onboarding
npm --prefix frontend run test:settings
npm --prefix frontend run test:delivery
npm --prefix frontend run test:dishes
# Full setup gets a fresh authority/quota fixture, without bypassing MFA limits.
export TEST_DATABASE_URL='mysql://root:synthetic-v03-only@127.0.0.1:43316/test_v04_setup_recheck'
DATABASE_URL="$TEST_DATABASE_URL" npm --prefix backend run test:prepare
npm --prefix frontend run test:setup
```

`test:setup` starts a new setup_required/inactive/not-accepting partner with no hours/menu/survey/commission and completes prerequisites through UI/API, including exact consent, lost-response same-key recovery and explicit accepting switch. It never grants readiness through SQL. Scoped P12/P13 scripts retain explicitly marked public quote/media fixture readiness because those earlier stages precede P14; they are not full-readiness proof. Screenshots go to the printed temporary artifact directory or an existing BROWSER_EVIDENCE_DIR. Review360px and wider screenshots visually; browser assertions alone do not establish aesthetic quality.

MFA tests wait for the next real TOTP step when necessary; do not bypass replay protection or production quotas. Browser fixtures and synthetic documents are not real partner/survey data. Existing smoke remains fixture/auth-route evidence only.

## Cleanup and compatibility

`MEDIA_CLEANUP_ACTOR_ID` and `MEDIA_CLEANUP_RESTAURANT_ID` select a synthetic current owner/restaurant for `npm --prefix backend run media:cleanup:local`, with DATABASE_URL pointing to that disposable test database. The CLI refuses retained/nonlocal/non-test targets. It retries claimed unreferenced assets and removes untracked objects older24h; tracked/attached assets survive. No production scheduler or retained-data migration is configured/authorized.

Code/config/grants are reviewable artifacts. Applying them to retained environments, choosing a production provider, importing real surveys and accepting real commercial agreements require their own authorized adoption work. Cash configuration readiness is not P15/P16 ordering, V0.6 QR readiness or V1.0 commercial release acceptance.

## October 24 owner proposal correction

The reported retained-local PUT422 was caused by the owner form copying every historical approved rate into its editable draft. An inactive sample point disappeared from public point choices but remained in the submitted array. The backend correctly rejected the inactive point. Both initial/reload draft creation and new proposal serialization now restrict rates to currently active, selectable points; the approved policy/history remain unchanged. Unknown-result retries retain their original payload/key. A point disabled after the last point read still requires reload rather than bypassing backend validation.

PASS `node --test frontend/test/proposal-rates.test.mjs` (2cases), frontend lint/build, and an isolated real MySQL9.2.0/Chrome reproduction using the existing browser harness. A stored approved rate to an inactive point remains readable; submitting it reproduces422 without saving a proposal. Chrome then submitted only two active points with2000m/0VND and2500m/1000VND. Database inspection confirms exact submitted fees/distances, one pending proposal, and the unchanged old approved rate. [Sanitized receipt](evidence/delivery-proposal-hidden-point.json). No retained-local proposal was submitted by Codex; source data was inspected read-only. Mobile/accessibility certification and the full browser suite were NOT RUN for this scoped payload correction. The build retained its existing large-bundle advisory. Self-review only.

## Admin delivery list refresh — October24, 2026

Reported symptom: the owner sees a saved pending proposal, but Admin does not see the new request. Source inspection found that `/admin/delivery` loaded only on mount/manual reload, sorted older IDs first, and notification links could retain a single-proposal filter. The Admin task homepage also initially selects applications rather than delivery tasks.

The scoped frontend correction refreshes delivery data every10seconds while visible and immediately on focus/visibility return. Reads carry an abort signal, pending requests are cancelled on refresh/unmount, background read errors preserve the last list and do not clear mutation errors. Pending proposals appear newest first; notification filters explicitly explain their scope and retain the existing all-surveys link. The task homepage adds a direct delivery-review link. No proposal/approval/notification persistence or authorization rules change.

Regression coverage extends `npm --prefix frontend run test:delivery`: owner submits through HTTP, Admin opens the list, a second synthetic proposal is inserted into the disposable MySQL fixture to simulate concurrent arrival, and Chrome must display it first without reload. The suite then approves the original owner proposal and checks the owner projection and cart quote. The cart assertions now follow the current automatic quote UI rather than its removed manual-quote button. The simulated arrival does not prove a second concurrent owner HTTP session or production notification delivery.

Verification: PASS frontend lint/build, backend `test:compile` (browser harness preparation), `node --check frontend/scripts/browser-delivery.mjs`, `git diff --check`, and the updated real-Chrome/MySQL9.2.0 `test:delivery` suite against new disposable `test_delivery_fix_20261024`. The regression observed automatic arrival/newest-first ordering; the full suite completed owner submission → MFA Admin approval → owner verified policy → automatic zero-fee quote, no order writes, and cart overflow assertions at360/390/768/1024/1440px. An Admin360px screenshot was visually inspected. The first run could not start without compiled harness output; the next reached cart and exposed outdated browser assertions; the corrected full run passed. Broader backend suites NOT RUN (no backend source changes). Production deployment and the reported server's actual sessions/data NOT RUN. Self-review only; unrelated working-tree deployment/database changes were preserved.
