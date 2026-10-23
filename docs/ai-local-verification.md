# V0.8 recommendation verification and configuration

Date: October22,2026. [Approved DEC-09](ai-v08-contract.md), [AI design](ai_integration.md), [OpenAPI](data/recommendations.openapi.json) and [progress](progress/V0.8.md) own scope. Synthetic local evidence only, Codex self-review, not an independent review or commercial launch.

## Reproduction

Run application checks from repository root:

```sh
npm --prefix backend run prisma:validate
npm --prefix backend run prisma:generate
npm --prefix backend run lint
npm --prefix backend test
npm --prefix backend run test:e2e
npm --prefix backend run build
npm --prefix frontend run lint
npm --prefix frontend run build
```

HTTP E2E needs permission to bind loopback ports. Compilation regenerates Prisma Client; this is not migration evidence.

For real MySQL use a NEW disposable test_* database, loopback MySQL9.2.0 and the synthetic compose credentials in `backend/test/onboarding.compose.yml`. Never use a retained database. Export `TEST_DATABASE_URL` for that database, then run from backend:

```sh
DATABASE_URL="$TEST_DATABASE_URL" node scripts/prepare-test-db.mjs
DATABASE_URL="$TEST_DATABASE_URL" npm run db:migrate
npm run test:compile
node --test .test-dist/test/integration/recommendations.integration-spec.js
node test/recommendations-permissions.mjs
```

The permissions harness creates temporary runtime/provision users, exercises reviewed grants, runs the same HTTP/MySQL test with a restricted application pool and separate operator fixture pool, then drops temporary users. Worker processes use the restricted connection too. Tests reset ONLY AI counters/leases on the explicitly selected disposable DB. Run browser and integration suites sequentially, since both manage these counters.

From frontend with the same exported test URL:

```sh
BROWSER_EVIDENCE_DIR=/private/tmp/v08-browser-evidence npm run test:recommendations
```

Requires Google Chrome at its default macOS path or `BROWSER_BIN`; ports43127–43129 must be free. The guarded test server binds loopback, creates labeled synthetic catalog/survey/consent/commission facts and issues synthetic sessions through a test-only helper. None of its helper routes exists in the production AppModule. Real DB/auth/public services/cart/quote/cash checkout are used; ONLY Gemini is deterministic. Chrome foreground/timer flags prevent background timer throttling. Screenshots are supplementary observations, not proof of Gemini quality.

## Observed evidence

- Backend policy/gateway unit tests exercise exact budget bounds, string IDs beyond Number precision, preference validation, projection privacy, structured output/content limits and upstream failure normalization.
- Real MySQL9.2.0 initial forward migration replay includes `20261022010000_recommendations`; migration only creates three metadata tables and singleton admission row. No retained schema/data was migrated. Existing runtime grants were extended for metadata only.
- HTTP/MySQL test covers current commission consent, operational flags/hours/dishes, missing/disabled delivery/point, exact fee-inclusive cutoff, price/fee changes during provider call, auth/CSRF/Origin, no content projection leaks, minute/daily/token quotas, rollback, lease expiry, two independent Node processes, metadata expiry and admission CHECK constraint.
- Restricted run also verifies five denied DDL/admission/audit operations. A failed grant-parser rehearsal was corrected by removing a semicolon from a SQL comment; its two temporary users were explicitly removed before the successful run.
- Chrome:360/390/768/1024/1440, no horizontal overflow, keyboard focus, no automatic generation, empty result, outage, timeout, quota, changed-input late-result discard and successful real manual cash checkout while Gemini is unavailable. Actual provider latency/quality is NOT RUN.
- During implementation, real SQL returned location_version as bigint; owning catalog projection now explicitly converts only that bounded version, never IDs/money. Runtime metadata bucket counts are also normalized as bounded counts.

Exact final command outcomes and sanitized artifact paths are in [V0.8 progress](progress/V0.8.md).

## Enabling Gemini and live evaluation

AI remains disabled by default. Backend only: `GEMINI_API_KEY`, `AI_ENABLED=true`, `AI_FREE_TIER_VERIFIED=true`, exact `AI_MODEL`, independent32-byte hex `AI_QUOTA_HMAC_KEY`, and positive verified `AI_PROJECT_RPM/TPM/RPD`. `.env.example` contains no secret values. Do not put any key in VITE variables or paste it into reports.

Operator must verify a dedicated Google project has NO billing and current model quotas in AI Studio; backend cannot discover or enforce the remote project's billing status. Changing billing or model invalidates this attestation and requires a new decision. No automatic upgrade/model/provider fallback. If free-tier access/quota changes, disable AI; manual ordering continues.

Live evaluation uses static synthetic cases only, plus durable quota metadata. From backend after configuring a verified free-tier project and a disposable TEST_DATABASE_URL:

```sh
AI_EVAL_REPORT=/private/tmp/v08-live-metadata.json AI_EVAL_BATCH=2 npm run test:ai-evaluation
```

The report contains only case number/model/prompt/status/latency/token/validity/preference/baseline metadata, no provider output or runtime catalog text. Resume the same report over quota windows/days to100cases; quota denial stops without an extra call. No automatic retries. Actual billed cost remains unknown unless separately measured; expected free-tier paid cost0 is explicitly an estimate. Missing key/quota returns NOT CONFIGURED before DB/provider work. Completion requires100% displayed results valid (safe rejected responses display nothing), >=90% clear-preference top3 hits and >=95% successful requests within5s, including errors/timeouts in reporting.

Metadata cleanup runs on startup/hourly/admission with1000row bounds; no content is stored. `npm run ai:cleanup` offers a bounded operator sweep. An offline deployment removes expired metadata on next startup; no cloud scheduler or production monitoring is claimed.

## Adoption boundary

DEC-09 initially approved minimized real catalog use without retained migration. The subsequent explicit local adoption authorization and completed metadata migration are recorded below; production publication and real pilot were not performed. Subsequently the operator supplied a key/free-tier attestation and quotas; the [100case live metadata](evidence/ai-v08-live-metadata.json) passes the approved synthetic rubric. P26/P27/P28/V0.8 are accepted for isolated local synthetic scope. Subsequently authorized local metadata migration/grants/restart are complete; see [adoption receipt](ai-local-adoption-review.md). Rollback disables AI and keeps manual catalog/cart/checkout available; never roll back by deleting historical business records.

## October22 live follow-up

100 first attempts retained:97 valid within5s,72/75 clear-preference hits; provider-stage p95=1488ms. Three failures remain counted; one took7004ms, other causes were not captured. Original every-request-success aggregation was corrected to the approved displayed-result safety/95% latency rubric;3 new unit tests cover95%/90% boundaries and incomplete/invalid reports. `test:ai-evaluation-unit`, backend lint/unit/E2E/build all passed after the tooling-only change. Live calls now pace at least60000/min(10,projectRPM)+100ms before quota admission, excluding that intentional wait from provider timing. Reported timings cover provider generation/output validation, not full HTTP/load performance. Source/provider prompt/corpus unchanged, no failed case replayed. Actual billed cost and3 failed-call token usages remain unknown.

## Authorized local adoption follow-up

Operator explicitly selected “Áp dụng trên database local hiện tại”. [Review/receipt](ai-local-adoption-review.md) and [sanitized evidence](evidence/ai-v08-local-adoption.json) record verified backup/restore, one applied metadata migration, narrow grants, unchanged58 original tables/173 rows and backend restart with both frontends preserved. Carried100 actual calls block further live generation until14:00 October22 Vietnam time; quota denial was checked without a provider call. Actual Chrome anonymous login return works; authenticated retained-user journeys NOT RUN. No new account/order/payment, billing or production action.
