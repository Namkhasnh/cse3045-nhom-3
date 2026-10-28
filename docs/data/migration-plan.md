# Forward Migration and Legacy Data Compatibility

> October25 COD cutover: [approved operating/API/history contract](../cod-ordering.md) supersedes new-order cash/QR selection, QR authoring/review and platform voucher issuance/redemption. Legacy payment/refund and accepted voucher subsidy obligations remain. Prior verification is historical.

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

## October 24 local website repair adoption

The subsequent user request to fix reported order/history500 errors and recheck the local website required the existing storefront forward migration on the retained local database. Protected backup, verified restore, exact prior-checksum review, clone rehearsal, pre-adoption recheck and post-adoption original-row comparison passed; all61 original business tables were preserved. Narrow storefront runtime grants and a read-only HTTP startup gate accompany adoption. [Receipt and boundaries](../website-local-verification.md) supersede the earlier local NOT RUN boundary only for this migration/target; no VPS deployment, reset or reseed occurred.

## Owner analytics index — October 24

`20261024020000_owner_analytics` adds only `orders_owner_analytics_idx(restaurant_id,status,completed_at,id)` for bounded completed-order aggregates. No rows or historical snapshots change. Apply through the normal migration operator, never runtime credentials or destructive push. Actual application/verification in this task is restricted to new disposable `test_owner_analytics_20261024` on MySQL9.2.0; retained/production application is NOT RUN. See [analytics handoff](../ui/owner-analytics.md).

## Public order references — October 24

`20261024030000_order_codes` adds nullable/unique ASCII order codes, fills only missing codes with collision retry, checks completion, then enforces NOT NULL/format with a compatible SQL default. No accepted monetary, contact, lifecycle or historical facts are invented. Runtime creation generates its code within the existing transaction; unique collisions retry at most five attempts. Existing IDs and references survive. A dedicated MySQL9.2.0 upgrade rehearsal compares every original column/history for 25 pre-code orders and rejects duplicate/invalid codes. Retained local/VPS application is NOT RUN and outside this task. See [owner order evidence](../ui/owner-orders-figma.md).

## Retained local order-code repair — October 24

The subsequent user request to repair owner-list500s and recheck the project authorized the backed-up local adoption of the analytics index and public-code migrations. Verified restore/clone rehearsal,29prior checksums,62preserved original business tables and6unique codes precede/confirm31applied migrations. [Receipt](../local-runtime-order-code-repair.md) supersedes the local NOT RUN statements above only for `hlf_dev_flow` on loopback3307. VPS/production remains separate.

## Checkout voucher expansion — October 25, 2026

The [approved scoped contract](../checkout-vouchers.md) uses forward migration `20261025000000_checkout_vouchers`. Existing totals, recipients, payment statuses, item/history/key and ledger facts are preserved; discount defaults to zero and voucher snapshot is null. Even historical zero-total payments remain unchanged. New voucher/redemption facts and unique subsidy linkage extend exact constraints; runtime grants permit only voucher active/version updates and immutable redemption inserts. Runtime startup requires this migration and never applies it itself. Disposable upgrade verification: `npm --prefix backend run test:voucher-upgrade` with a fresh empty loopback `test_*` MySQL9.2.0 target. The subsequent user request to repair local login502authorized [local adoption](../local-checkout-runtime-repair.md) on `hlf_dev_flow`/3307: backup restoration, exact clone rehearsal, original62table data preservation,32migration checksums and runtime grants/gate pass. Other retained targets and production deployment remain outside this authorization.

## October25 retained-local COD runtime repair

The subsequent reported502 repair authorized local adoption of20261025010000_cod_ordering on hlf_dev_flow/loopback3307. [Receipt](../local-cod-runtime-repair.md) records protected backup/verified restore, clone rehearsal,32prior/33final checksums, unchanged original columns/rows across64business tables, unchanged runtime grants and successful startup/actual5173Chrome reads. No historical payment/voucher/ledger state was rewritten; VPS/production remains separate.

## October25 authorized academic VPS code/schema update

The user explicitly selected deployment of current local code and schema while preserving VPS data; local business-data import is excluded. [Update handoff](../demo-cod-update.md) owns the reviewed migration allowlist, exact-clone rehearsal, old-column/row comparisons, protected SQL/object/vault recovery point, restricted grants and compatibility-gated application recovery. Preparation does not prove remote adoption; actual deployment evidence is recorded separately.


## October28 personal-profile adoption

The user explicitly approved a full private local backup, same-Mac restore rehearsal, avatar/verified-email feature adoption and removal of the temporary SQL/test copies. The [profile contract and local evidence](../profile-identity.md#retained-local-adoption--october282026) record the exact source, preserved64tables/795rows, one additive migration, narrow grants, runtime restart and sanitized cleanup receipt. No retained avatar/email was fabricated or changed for a demonstration; production remains separate.
