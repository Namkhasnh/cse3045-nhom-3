# V0.8 local adoption review — authorized and completed

Date: October22,2026. [DEC-09](ai-v08-contract.md) approves minimized real catalog use but explicitly excludes retained-data migration authorization. [V0.8](progress/V0.8.md) is accepted for isolated local synthetic scope; the operator subsequently explicitly selected “Áp dụng trên database local hiện tại”, authorizing the concrete local metadata migration/grants/backend restart reviewed below. [Completed receipt](evidence/ai-v08-local-adoption.json) records the actual result. Production publication/billing/pilot remain excluded.

## Reviewed pre-adoption source and delta

Read-only inspection of the configured local backend found exactly one pending migration, `20261022010000_recommendations`, and no failed migration. Before adoption none of the three AI metadata tables was installed. The Gemini key, independent quota key, enabled/free-tier attestation and15RPM/250000TPM/500RPD values are configured; app caps still apply. Read-only grants inspection found no current AI table grants, no broad runtime ALL privileges and no configured OPERATOR_DATABASE_URL/PROVISION_DATABASE_URL. Apply DDL/grants only through an explicitly authorized existing local operator mechanism; never elevate the website runtime credential. No credentials are included here.

Proposed change: apply ONLY that reviewed migration to the existing local database, retaining every original table/row. Create ai_admission/ai_counters/ai_leases; insert admission singleton1; record the migration in Prisma history. No UPDATE/DELETE of original business data, historical backfill, reset, fake partner, consent/rate change or new Admin. Reconcile only required metadata runtime privileges: UPDATE(id) on admission and INSERT/UPDATE/DELETE on counters/leases, with existing SELECT. Do not apply unrelated grants or migrations silently.

Afterward restart only the local backend process identified as this checkout, verify migrations/metadata schema/config readiness and manually check `/recommendations`. Do not generate another live evaluation request in the current Pacific-day window: the100call allowance is exhausted on its dedicated test DB. On retained adoption, carry forward the observed global daily100call reservation into metadata (known actual usage only) so moving databases cannot silently refill this allowance; no account/order history is backfilled. Test UI/backend with controlled provider or defer another real call to the next approved quota window; never reset evaluation counters to bypass the cap. Ordinary buyer/manager navigation and manual ordering remain available.

## Backup/restore and forward rehearsal already completed

Protected source backup: `/private/tmp/v08-adoption-review-20261022/retained.sql` (mode0600); restore evidence, inventories, checksum and restore connection file remain in that private operator directory, never committed. Restore target: a new loopback disposable MySQL9.2.0 database `test_ai_adoption_rehearsal_20261022`. Backup/restore fingerprints matched before migration.

Forward rehearsal applied only the pending AI migration on the restored copy. All58 original non-migration tables and173 original rows retained identical schema/data fingerprints. Exactly three new metadata tables appeared; admission has1 row, counters/leases0. `_prisma_migrations` changed only as expected for the newly applied migration. Evidence `/private/tmp/v08-adoption-review-20261022/forward-evidence.json`; source database was not modified during backup/restore/rehearsal. Temporary private artifacts require appropriate operator custody and are not a long-term backup service.

## Execution/verification checklist — completed after authorization

1. Recheck source fingerprints, applied migration checksums and pending list against this review; investigate unexpected changes instead of overwriting them.
2. Apply the single forward migration using the existing operator credential mechanism. Never put secret URLs/passwords in argv, logs, git or VITE configuration.
3. Verify all original table/row/schema fingerprints remain unchanged apart from expected migration history; verify singleton/table indexes and exact narrow runtime grants.
4. Restart the identified local backend only, verify public catalog/auth/private recommendation configuration paths and observe the actual UI. Report any user/process/data changes since rehearsal. No automatic order, billing or publication.
5. Append actual local adoption evidence to the [migration plan](data/migration-plan.md), [verification](ai-local-verification.md) and [version record](progress/V0.8.md); keep production/retained backup service/real pilot acceptance separate.

Rollback first disables AI and preserves existing history. A failed forward migration requires inspection/review; never reset Prisma or drop business tables. Do not restore over a changing source without a separate recovery decision. Original58 application tables/173 rows remain unchanged after the authorized metadata-only adoption. The migration history gained exactly one entry; three metadata tables and reviewed grants were added.

## Actual local adoption — October22

Preflight rechecked all27 applied SQL checksums and matched the verified source backup. Only the AI migration applied; all58 original non-migration tables/173 rows and schema/data fingerprints remained identical before/after restart. Operator access was obtained transiently through the identified local MySQL9.2 container; no privileged URL/password was printed or persisted into application config. Runtime retained its existing identity and received only reviewed metadata grants. Transactional INSERT/UPDATE/DELETE probes rolled back; deleting admission remained denied.

Exactly100 known real evaluation calls for Pacific window `d:2026-10-21` were carried into the source global counter. A runtime quota check returned AI_UNAVAILABLE503 without a provider call, lease/counter change or fake history. Effective limits15RPM/250000TPM/100RPD; next app-day reset14:00 October22,2026 Vietnam time. No further live call was attempted.

Identified Nest watcher/main were stopped and backend restarted through `npm run dev`; listener42783 is healthy on3000, no TS/metadata-cleanup errors. Original IPv4/IPv6 frontend listeners33100/52770 remain unchanged on5173. Backend catalog, frontend routes and proxied catalog return200; anonymous AI POST returns401/no-store. Actual Chrome guest navigation preserves `/recommendations` in login return. Retained authenticated browser/order journeys were not performed; prior synthetic Chrome/provider-live evidence remains distinct. No order, payment, account, owner/terms or billing operation occurred.
