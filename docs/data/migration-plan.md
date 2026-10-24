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

## 5. Explicit local sample exception — October 20, 2026

The user explicitly approved backed-up forward adoption and labeled synthetic sample additions on the existing local `hlf_dev_flow` database. [Local adoption evidence](../local-demo-adoption.md) records restore proof, unchanged original rows, restricted grants and fixture boundaries. This named exception does not permit seeds on other retained/shared/production targets, fabrication of existing partners’ consent, or changes to legacy ownership/authority.

## 6. V0.5 ordering adoption is separate

The October20 V0.5 implementation authorizes disposable MySQL9.2.0 tests only. Migrations `20261020030000_cash_orders` and `20261020040000_cash_fulfillment` were not applied to retained local data. The V0.4 sample exception above does not authorize this upgrade. A future adoption needs explicit authorization, a new backup/restore verification for that exact retained database, checksummed forward rehearsal/inventory and preservation mapping for inconsistent legacy relationships or missing facts. Item restaurant discriminators are derived from retained order links; conflicting dish links must stop migration rather than be rewritten/deleted. No food-ready, receipt or consent facts are backfilled. Incomplete legacy payment projections remain explicitly unknown. [V0.5 commands and boundary](../cash-ordering-local-verification.md).

## V0.6 adoption remains separate

P20 forward QR/refund migrations are rehearsed only on new disposable `test_*` MySQL9.2.0 targets. Retained local DB lacks V0.5; this task authorizes neither V0.5 nor V0.6 adoption there. A future explicitly authorized task must verify backup/restore, rehearse the complete chain, preserve unknown historical QR/payment facts and review grants before retained deployment. No reset, destructive push or applied-SQL rewrite.

## October 21 explicit local auth repair adoption

The user subsequently authorized backup/restore verification and deployment of all eight outstanding migrations to `hlf_dev_flow` on loopback3307 to repair login's missing `accounts.credentials_blocked` column. The [auth repair evidence](../auth-followup.md#october-21-local-login-repair) supersedes the local schema status in the two historical sections above: all 26 migrations are now applied with reviewed runtime grants. Backup restoration, complete-chain rehearsal, applied checksums and preservation of all original 38 tables/158 rows were verified before/after deployment. No old receipt, consent, support, private payload or compromised-credential fact was invented. Existing business journeys, retained plaintext conversion, privacy maintenance and production release remain separate from this schema/auth verification.

## October 22 local notification extension

The explicit notification implementation request adds `20261022000000_notifications` without changing original business rows. [Verification](../notifications-verification.md) records local backup/restore, checksum and forward rehearsal,57 preserved original business tables/173 rows, restricted INSERT/UPDATE(read_at) grants and legitimate first-access summaries. Logical mailbox references deliberately avoid implicit account FK lock inversion; there is no historical-event backfill or retained reset. Production release remains separate.

## V0.8 AI metadata adoption

`20261022010000_recommendations` creates metadata-only admission/counter/lease tables and singleton id1; applies no updates to original business rows. Initial full-chain rehearsal and restricted grants were tested on disposable MySQL9.2.0. [Verification](../ai-local-verification.md) separates source inspection, migration execution and live-provider evidence. Subsequent explicit local adoption authorization applied this single migration and narrow metadata grants after verified backup/restore; [receipt](../ai-local-adoption-review.md) records unchanged58 original tables/173 rows and27 prior checksums. Real100call quota was carried forward; backend restarted. Production adoption remains unauthorized/unperformed; example configuration is disabled by default.

## October 24 authorized demo fork merge

The user approved target-first three-way merging of the local and SSH academic demo forks, including verified local orders/finance, with explicit demo suspension/hiding and retained history. [Operator tooling and recovery](../demo-database-merge.md) records the common-ancestor mapping, conflict gates, exact-copy rehearsal and current evidence boundary. This exception does not authorize replacing the SSH database or importing invented survey, consent or financial facts.
