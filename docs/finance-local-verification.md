# V0.7 finance — isolated verification and adoption boundary

Authority: [approved DEC-07](finance-policy-proposal.md), [P22](progress/P22.md), [P23](progress/P23.md), [P24](progress/P24.md). All fixture names/orders/locations/evidence references are synthetic. No bank connection or money movement occurs.

## Environment and preparation

Run from repository root; backend/frontend are separate packages. Preserve local `.env` and all existing databases. Use Oracle MySQL Community Server9.2.0/InnoDB at the already configured loopback43316 test container; optional existing regression suites use private local MinIO43317. Retained3307 is outside this workflow.

Create a fresh `test_finance_*` database using a separately authorized operator identity. Never replace an existing database. The repository's guarded bootstrap refuses non-test/remote targets. Provide `TEST_DATABASE_URL` and `DATABASE_URL` only for this fresh loopback target; never copy retained secrets into commands/logs.

```sh
DATABASE_URL="$TEST_DATABASE_URL" npm --prefix backend run test:prepare
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
npm --prefix frontend run test:orders
npm --prefix frontend run test:finance-unit
npm --prefix frontend run test:finance
```

Run backend compile/test/build steps sequentially: test compilation clears `.test-dist`; do not run compilation while an integration suite/browser backend is using it. HTTP tests/Chrome require local listen/network permissions. `test:onboarding-permissions` creates temporary restricted runtime/provision identities and drops them after the suite; operator grants are necessary on this fresh DB only.

Upgrade rehearsal requires another **new empty** test DB and `npm --prefix backend run test:onboarding-upgrade`. The script preserves every original column/row, including an explicitly synthetic completed-order/base fixture. It proves base-link expansion and zero invented receipts, plus February/March SQL boundaries. It is not retained adoption permission.

## Actual finance evidence

FIN-03/04/05 integration uses actual HTTP/MySQL and an independent backend worker process. It checks monthly earliest/full membership, competing creates, keyed same/changed financial intents, event reference duplicates, full reversal/replacement, signed credit, collection limits, audit/result/assignment rollback, scope/cursor validation and historical report cutoff. Ajv validates actual success/error envelopes against enabled [finance OpenAPI](data/finance.openapi.json). Restricted runtime separately denies original fact/settlement/key edits/deletes; immutable settlements use SHARE locks under exclusive restaurant locking.

Browser runner `frontend/scripts/browser-finance.mjs` uses actual Chrome, Vite, NestJS and a fresh MySQL DB. `backend/test/browser-server.ts` supplies synthetic identity/MFA fixtures and replaces outbound SMTP/password-corpus calls. Completed-order/base fixtures are inserted explicitly by this runner solely to test finance reporting; they are not real orders, partner agreements or fulfillment evidence. P23's completion regressions independently test actual workflow base creation.

Chrome verifies independent90000+40000 dish revenue and6500base oracle; unique-month create after committed-response loss/reload; receipt commit loss/reload with identical actor/key/body and one fact; full reversal/replacement; signed next-period adjustments; protected owner view/foreign404; report empty/error/retry; zero writes when sessionStorage fails; open-month/late-statement/overdue displays; negative credit blocks receipt; held private report released after actual cookie account change. Native dialog initial focus/Tab wrap and table keyboard focus,360/390/768/1024/1440px/no full-page overflow are asserted. Screenshots are synthetic and need visual inspection in addition to automated assertions.

## Runtime/adoption limits

Routes: owner `/owner/finance`; sole MFA Admin `/admin/settlements` (`/admin/reports` alias). Existing `/owner/commission` and `/admin/commissions` continue to manage negotiated rate consent separately. Finance supports immutable monthly statements, manual reference-backed receipts and reasoned corrections. No proof uploads, automatic notifications, collection/payout, write-off or suspension is added.

Request body limit remains100KiB; full entry-ID selection must fit this existing transport limit. Reports allow at most120months per query,20/default100/max rows per page, fixed cutoff and scope-bound cursor; account summary appears once. Lists are ascending numeric ID. Evidence references are not document-upload or production retention functionality.

Migration `20261021000000_finance_ledger` is forward-only. Old bases missing known completion timestamps deliberately block migration rather than inventing history. Do not run retained schema push/reset, rewrite applied SQL, backfill receipts/consents, grant Admin fulfillment/payment powers or infer partner approval. Retained adoption requires its own authorized inventory/backup/restore/rehearsal/grants plan. Production services/retention/publication remain DEC-08/10/11/12. P25 requires a separate approved DEC-08; P22–P24 do not accept all V0.7 or V1.0.
