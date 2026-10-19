# Forward Migration and Legacy Data Compatibility

Authority: [database](database.md) §11; versions V0.1 P01 and V0.3 P10. The original documentation rewrite authorized no data changes. The October 19 scoped implementation and approved mapping are recorded in the [cutover handoff](../auth-discovery-cutover.md); that handoff distinguishes additive schema expansion from protected interactive account cutover.

## 1. Canonical target versus local legacy

The target has ordinary users with optional one-restaurant management, one explicitly selected MFA Admin, opening applications/terms and setup readiness. Current schema, previously applied migrations and retained local legacy tables may differ. [Implementation status](../implementation-status.md) records the final source/evidence boundary; no retained local migration/adoption is inferred from a source schema. Source schema is not evidence of actual live data invariants.

## 2. Read-only inventory and blocking report

Under an appropriately authorized future task, inspect migration checksums/history and actual MySQL 9.2.0 tables/constraints; count accounts by legacy role, Admins, owner-to-restaurant links, inactive restaurants, pending role requests and retained order/payment/financial/audit references. Store sanitized counts/conflict IDs in protected operator records, not public docs with personal data.

Require DEC-01: primary Admin ID explicitly selected by the operator, intended handling of every other privileged identity, and conflict resolution for every account linked to multiple restaurants. Never auto-select, merge, delete, detach or deactivate retained records. An unresolved conflict blocks enforcing the affected constraint and V0.1 completion.

## 3. Expand, validate and constrain

1. Backup schema/data/migration metadata; demonstrate isolated restore of the pre-change state. Record exact source/target MySQL and app compatibility.
2. Add compatible structures for sole authority/capabilities, terms/applications and readiness; keep old readers valid for the explicitly documented transition window.
3. Backfill ordinary identity without losing account IDs, credentials, email verification, availability or historical actors. Existing owner role is not authority after cutover; current relationship is. Pending role requests are retained as legacy history, never silently converted into partnership consent or an approved opening application.
4. Apply only the operator-approved Admin/ownership mapping. Existing partners need documented agreement/setup validation; do not label them ready or invent surveys/commission/consent from fixtures.
5. Verify one non-null owner per restaurant, unique owner across all restaurants, exactly one sole authority and no broken references; verify snapshots, keys/results, ledger/payment/audit counts/totals before and after.
6. Enforce owner uniqueness/FKs/checks and singleton authority with reviewed forward SQL. Do not rewrite previously applied migrations or remove their audit evidence. Inspect real DB constraints, not Prisma types alone.
7. Cut over API/guards/UI together, revoke legacy privilege-bearing sessions, retire role-request write/read website flows and reject obsolete privilege inputs. Preserve historical records under controlled storage/retention policy.
8. Contract old readers/columns only after reviewed compatibility and retention decisions. Produce a forward recovery plan; application rollback must remain schema-compatible. [Previous-backend evidence](../auth-followup.md#previous-application-compatibility-boundary--data-01) proves expansion-window compatibility only; after authority cutover, legacy role writers must remain stopped and recovery proceeds forward with capability/MFA enforcement.

## 4. Required verification and rollback

Apply reviewed migrations to empty and upgraded disposable fixtures on MySQL 9.2.0. Include multiple legacy Admins (must stop for selection), multi-restaurant legacy ownership (must stop for mapping), accounts referenced by history, pending old requests, audit failure, duplicate-owner races and retry/restart boundaries. Assert retained IDs/snapshots/counts/totals and session revocation, plus refusal to proceed on invalid inventory.

Never reset, force-push schema, run demo seeds on retained/shared data, fabricate missing snapshots or delete evidence to pass migration. If restore becomes necessary, reconcile orders/direct restaurant receipts/manual commission receipts and durable keys after the recovery point before resuming writes. DEC-11 governs gap handling; an old app rollback never undoes database facts.
