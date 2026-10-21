# Local development demo adoption — October 20, 2026

Authority: the user's approved local-demo implementation plan explicitly permits forward migrations and synthetic sample additions to the existing `hlf_dev_flow` database. This is a named local exception to the earlier V0.3/V0.4 disposable-only acceptance boundary, not authorization for production, real partner imports, Admin cutover or changes to existing ownership/consent.

## Behavior and data

The connected homepage now has an independent **Khám phá món ăn** section using public `GET /api/v1/dishes`, with exact VND prices, a linked seller name from `restaurant_name`, menu links, pagination and loading/empty/error/retry states. Existing restaurant filters still apply to the restaurant section. No API changes or checkout/order writes were introduced. Public eligibility remains active + ready; hidden dishes stay private.

`Bếp VJU (Mẫu)` belongs to a separate synthetic ordinary account. Its four dishes are Cơm gà35000, Cơm sườn40000, Bún thịt nướng35000 and Bánh mì trứng20000 VND. Descriptions, category, address and pickup-point labels identify fictional local data; images deliberately use the existing missing-image fallback. The sample pickup distance500m, fee5000VND and agreed3% rate are synthetic fixtures, never survey facts or commercial defaults. The sample's owner/operator workflow history and consent are simulated; no real user's consent is supplied or changed.

The existing sole enrolled operator remains unchanged. The synthetic account receives a random password whose plaintext is discarded; no public demo login or extra Admin is created. The legacy restaurant and its three dishes remain unchanged and setup-required. No historical order, payment, commission ledger or recipient data is created by this command.

The development shell displays a local synthetic-data notice when ignored `frontend/.env.local` contains `VITE_LOCAL_DEMO=true`. This flag contains no secret and is gated by Vite development mode. Sample names/descriptions remain labeled independently of that notice.

## Explicit operator command

Run from repository root, after backup/restore verification and the reviewed migrations/grants:

```sh
LOCAL_DEMO_CONFIRM=hlf_dev_flow npm --prefix backend run demo:local
npm --prefix frontend run test:local-demo
```

The backend command additionally requires `PROVISION_DATABASE_URL` supplied through protected operator environment, distinct from the runtime credential but pointing to the same database. Do not paste its value into a command/history, documentation or frontend config. `backend/.env` supplies the existing runtime connection and local storage configuration. The CLI rejects production, non-loopback hosts, other ports/databases and absent confirmation. It is never run on server startup and exposes no HTTP mutation endpoint.

The operator connection creates only the synthetic account and durable fixture markers; menu, survey, specific commission/consent and readiness use existing workflows with the runtime connection and audit/durable-key behavior. An advisory lock serializes concurrent fixture commands. Stable keys permit resuming completed workflow stages; an existing unmarked login is rejected. A completed run is a no-op on rerun, rather than overwriting later manual sample edits. Unexpected identity/schema/authority/configuration changes require inspection, not reset or forced readiness.

MinIO uses two new private buckets, `hlf-dev-flow-onboarding` and `hlf-dev-flow-dishes`, on the existing loopback local service. Credentials remain solely in ignored local environment. Neither bucket is shared with a disposable test database. Production storage remains unconfigured.

## Actual database adoption

The backend was stopped during backup/restore/migration, then restarted from the current build with the same runtime identity and auth secrets. The running frontend picked up its ignored local flag. MySQL version is9.2.0.

Protected operator artifacts are in `/private/tmp/hlf-local-adoption-20261020` (directory0700, files0600): full SQL dump including migration metadata, user definitions/grants, restored-schema/data fingerprints, restore evidence, and post-adoption preservation evidence. These files contain sensitive database material and are intentionally outside git. Temporary storage is not a durable backup-retention policy.

The dump was restored into new `test_local_restore_20261020` on the same MySQL9.2.0 service; every source schema/data fingerprint matched before migration. All existing applied-migration checksums matched repository SQL. The seven missing forward migrations, onboarding through commission agreements, were applied without resetting or rewriting history. The reviewed runtime grants template was applied only to the existing runtime account; no global grant or grant option was added.

After migration, all25 original application tables retained every original column/row. After sample creation, a second comparison against the restored backup verified all92 original rows across26 tables, including migration metadata, still exist unchanged. The sole-authority count remains1 and the original restaurant remains active/setup_required. New rows are additive.

For recovery, stop local writers, verify the dump hash from `restore-evidence.json`, restore into a **new** local database, compare against the saved inventory, and inspect migration/app compatibility before redirecting the backend. Keep the upgraded source and backup intact; do not import a dump over a running database. Any writes after the backup need reconciliation before switching. Saved grants are operator recovery material, not a script to apply wholesale to root/runtime identities.

## Onboarding read failure correction

The screenshot's live terms endpoint returned500 because the running schema lacked the onboarding tables. After schema/grants adoption it returns200 with the published version/hash. The runtime onboarding workflow also successfully uploaded both private sample documents, submitted the synthetic application and recorded operator review.

Frontend terms and history now load independently, with cancellation/generation guards against stale responses. A failed history read does not claim that no application exists; the empty state appears only after a successful history read. Existing data/drafts remain visible through background read failures, and submitting is disabled until current terms/history are usable. There is one refresh control. Expired/forbidden history reads clear private results while preserving the account-scoped draft/recovery mechanism. Unknown mutation outcomes retain their original payload/key.

## Verification

- PASS backend lint/build,36unit tests,6HTTP E2E, Prisma validate/generate. The first sandboxed E2E run could not bind loopback (`EPERM`); the authorized rerun passed all6.
- PASS9actual MySQL/MinIO integration groups in `test_local_demo_regression`, with separate regression buckets; coverage includes auth, public catalog, ownership, onboarding/privacy, audit rollback, delivery/commission races, image validation and readiness.
- PASS frontend lint/build and6cart tests.
- PASS explicit sample rerun: every table's data/schema fingerprint was unchanged; no duplicate account, dish, consent or history.
- PASS connected local Chrome: four actual DB dishes, terms200, menu links/fallback, keyboard,360/390/768/1024/1440px, independent dish error/retry/empty/pagination. Artifacts: temporary directory suffix `hlf-local-evidence-iUtzXm`;360px and1440px screenshots visually inspected.
- PASS connected auth/catalog/cart Chrome regression using separate `test_local_demo_browser`. Artifacts suffix `hlf-browser-evidence-FelW2X`.
- PASS connected onboarding Chrome in separate `test_local_demo_onboarding_browser`: independent terms/history503 failures, no false empty history, disabled submit during failed reads, draft preservation/recovery, real private uploads, same-key unknown-result recovery, operator MFA/approval/manual invitation/consent/create, five widths and keyboard. Artifacts suffix `hlf-browser-evidence-WNdY8c`; history-error mobile screenshot visually inspected. The initial added assertion ran before the independent history response had completed; the test now waits for the actual completed history state.
- PASS live local privacy checks: anonymous applications401 and anonymous private-bucket read403; diff whitespace and documentation links/limits validation.

Self-review only; no independent/user acceptance, real survey, commercial launch or production deployment is claimed.

## Seller attribution follow-up — October 20

The user chose linked seller names with existing available/sold-out status; ratings and remaining quantities were deferred. Public dish list/detail now includes `restaurant_name` via the existing restaurant join, with no schema migration or additional per-dish requests. OpenAPI and frontend types match. Every homepage card shows “Quán bán: …”.

PASS backend/frontend lint/build,36unit tests,6HTTP E2E, focused actual-MySQL public catalog checks including restaurant rename/list/detail/visibility, documentation/diff checks, and local Chrome at five widths with a seller-name/link assertion for every card. Current artifacts: temporary suffix `hlf-local-evidence-wAjHZV`;1440px screenshot visually inspected. The local backend was restarted from the updated build.
