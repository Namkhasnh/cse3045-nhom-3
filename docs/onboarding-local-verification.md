# Local synthetic onboarding verification

Authority: [V0.3 contract](onboarding-v03-contract.md). Never use these fixtures, passwords or commands for retained/production data. All commands start at repository root. Production publication/storage/cleanup scheduling is not configured.

## Services and explicit configuration

`docker compose -f backend/test/onboarding.compose.yml up -d` creates isolated persistent test volumes on loopback43316/43317. It must not replace an existing listener; choose another port explicitly if needed. MySQL9.2.0 is pinned. MinIO2025-09-07 is built using [the test Dockerfile](../backend/test/minio/Dockerfile), which pins the official source commit/archive SHA256 and Go builder image digest. No upstream MinIO container pull is required. The original task used separate equivalent containers named `hlf-v03-mysql-20261019` / `hlf-v03-minio-20261019`; no existing service was stopped.

Synthetic configuration (values are intentionally non-production):

```sh
export TEST_DATABASE_URL='mysql://root:synthetic-v03-only@127.0.0.1:43316/test_onboarding'
export ONBOARDING_LOCAL_TEST=true
export ONBOARDING_S3_ENDPOINT=http://127.0.0.1:43317
export ONBOARDING_S3_ACCESS_KEY=synthetic-v03
export ONBOARDING_S3_SECRET_KEY=synthetic-v03-storage-only
export ONBOARDING_S3_BUCKET=onboarding-test
```

The test creates a private bucket if absent. The app adapter permits only explicitly enabled loopback synthetic storage; no real upload path is enabled by this configuration. Do not share one bucket between unrelated test databases: object references/cleanup belong to their database. Tests retain synthetic rows for inspection, with unique actors per run.

## Commands

```sh
npm --prefix backend run prisma:validate
npm --prefix backend run prisma:generate
npm --prefix backend run lint
npm --prefix backend test
npm --prefix backend run test:e2e
npm --prefix backend run build
npm --prefix backend run test:integration
npm --prefix backend run test:onboarding-permissions
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run test:cart
```

`test:integration` refuses non-loopback/non-test names, bootstraps only empty targets and deploys reviewed forward migrations; eight overlapping historical migrations use the existing consolidated baseline. Files run sequentially because they share one singleton authority; race participants within a case still run concurrently. `test:onboarding-permissions` requires a disposable operator capable of creating fresh SQL users, checks immutable-column denials, then runs the actual HTTP flow through the restricted runtime identity; generated credentials are not printed. New runtime grants never apply themselves to retained accounts.

For browser checks use a **separate prepared test database/bucket**, with `TEST_DATABASE_URL` pointing to it. Run `DATABASE_URL="$TEST_DATABASE_URL" npm --prefix backend run test:prepare`, `npm --prefix backend run test:compile`, then `npm --prefix frontend run test:onboarding`. The harness uses real MySQL/MinIO/auth/MFA and replaces only password-corpus/SMTP outbound services. Chrome is required; `BROWSER_BIN` may select its installed path. Screenshots are emitted to a temporary directory, or `BROWSER_EVIDENCE_DIR`. It waits for a new actual TOTP step instead of bypassing replay protection.

`test:onboarding-upgrade` requires `TEST_DATABASE_URL` to identify a **new empty** disposable database; it refuses existing tables. It installs pre-V0.3 schema, inserts synthetic legacy account/hash/restaurant/role-request rows, deploys V0.3 migrations and compares exact retained row snapshots. It never resets a target or invents consent.

Local cleanup: set `DATABASE_URL` to the prepared synthetic test database, `ONBOARDING_CLEANUP_ACTOR_ID` to its synthetic enrolled operator and the same private bucket config; run `npm --prefix backend run onboarding:cleanup:local`. It checks loopback/test name/current authority, claims due files transactionally and deletes outside transactions with retry markers. No production command/scheduler or cooperation termination is enabled here.

## Evidence boundaries

MySQL/MinIO HTTP tests validate response envelopes against OpenAPI, durable rows, consent/history, private reads, version/key conflicts, races and rollback. Byte-signature MIME checks are not a malware-scanning claim. Cleanup storage-failure tests are injected failures around actual object operations. Browser screenshots/focus/width checks are observed independently from unit/build results. Remote CI/production/pilot remain NOT RUN; pin/pull support on remote runners must be established by actual CI execution.

## System-review compensation regression

The ONBOARD-01 real MySQL/MinIO group now injects three upload failures: a real metadata/audit commit followed by lost acknowledgement; an audit failure rolling the transaction back; and rollback followed by failed authoritative metadata verification. Assertions cover live metadata/audit plus authorized object reads after commit, absence of rows/audit and safe object removal after rollback, and preservation when metadata cannot be checked. Compensation queries the generated immutable object key through the owning repository; storage remains outside retried transactions. Unknown outcomes defer to reference-aware cleanup. Newly executed results are recorded separately in [implementation status](implementation-status.md#system-review-defect-fixes--october-20-2026).

## CI MinIO image repair — October21,2026

The supplied GitHub Actions failure stopped at Docker Hub image pull (exit125), before integration/P25 restricted checks. Direct verification also found no manifest for the same digest or release tag on Quay; the official binary archive checksum endpoint returned410. An existing local cached image did not prove clean-runner availability.

CI and Compose now build the same [official release source](https://github.com/minio/minio/tree/07c3a429bfed433e49018cb0f78a52145d4bedeb) instead of pulling the unavailable MinIO image. The Dockerfile verifies the source archive SHA256, pins the Go builder's multi-platform digest, uses the release's readonly Go modules/checksums and cross-compiles a static binary for the target architecture. The runtime includes CA certificates, temporary directory and AGPL license. No third-party MinIO mirror or replacement S3 implementation is introduced. The integration job allows30minutes for a cold source build; all existing assertions remain enabled.

Local verification (Codex self-review, Node24.21.0, MySQL9.2.0):

- `docker build --platform linux/amd64 -t hlf-test-minio:2025-09-07 backend/test/minio`: PASS; `/private/tmp/hlf-minio-ci-build-final.log`. First uncached build also passed (`hlf-minio-ci-build.log`); the final build adds the runtime temporary directory.
- `docker run --rm --platform linux/amd64 hlf-test-minio:2025-09-07 --version`: PASS correct release/commit and linux/amd64. The separate synthetic container on loopback43318 passed the CI-equivalent readiness probe. AMD64 runs under local Docker emulation, not a hosted GitHub runner.
- `npm --prefix backend run test:compile`: PASS; `/private/tmp/hlf-minio-ci-compile.log`.
- `node test/integration/run.mjs` from backend after compilation: PASS18/18; `/private/tmp/hlf-minio-ci-integration.log`.
- `node test/administration-permissions.mjs` from backend: PASS P25 HTTP/MySQL and14 SQL denials; `/private/tmp/hlf-minio-ci-restricted.log`.
- Compose config, CI/Compose YAML parse, extracted CI shell syntax, documentation links/line bounds and `git diff --check`: PASS.

The two CI test steps used new `test_ci_minio_20261021_a` on synthetic MySQL43316 and distinct new buckets on the new storage container. Existing storage43317 and retained MySQL3307 were untouched. The temporary verification container was stopped with its synthetic contents preserved. Hosted CI rerun NOT RUN; the supplied remote failure is not a pass. No commit/push, deployment or application behavior change is included in this repair.
