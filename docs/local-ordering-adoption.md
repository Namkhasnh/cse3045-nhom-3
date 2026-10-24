# Existing local data — ordering adoption

Authority: October23, 2026 user request “tôi muốn dùng data thật luôn”, following the reported checkout/history/inbox failure. This scopes adoption to the existing Mac loopback3307/`hlf_dev_flow`, preserving all records. It is not a VPS deployment, commercial pilot or production release. Requirements BR01–10/15–19, existing terms/survey/commission consent and [privacy contract](account-support-v07-contract.md) remain authoritative.

## Behavior

New orders use the actual database and existing eligibility/quote/state rules. There is no sample-to-real relabeling, generated survey/rate/consent, inserted test order or automatic checkout submission. Existing unknown-outcome intent/body/key stays in the browser for an explicit same-key retry. Expired quotes or changed prices require fresh explicit confirmation.

The synthetic-only key guard previously returned503 before the order transaction on this database. Retained-local mode now requires both `ORDER_LOCAL_RETAINED_DATABASE=hlf_dev_flow` and an absolute `ORDER_PRIVATE_KEY_DIR`, the exact loopback database/3307 target, non-production runtime, owner-only0700 persistent directory and matching `.database.json` binding. There is no temporary fallback, automatic replacement of a missing binding or old plaintext rewrite. New0600 AES keys and their directory are synced before the order transaction. Lost keys remain unavailable; external deletion tombstones override restored keys/SQL.

Synthetic `test_*` storage retains its existing isolated behavior. Retained privacy cleanup is still disabled. Production key custody/recovery remains a separate DEC-10/11 gate.

New orders append a buyer confirmation and current-owner incoming-order notice atomically. Effective status and food-ready changes append both mailbox events. Stable order/version/role keys prevent replay duplicates. Inbox detail links to the exact buyer/owner order and omits the unrelated opening checklist. No native push, email or historical notification backfill is added. [Notification contract](notifications-contract.md) owns the event details.

## Operator configuration and recovery

Use a private persistent directory outside the repository and OS temporary storage, e.g. under the current operator's `Library/Application Support/HLF Orders/hlf_dev_flow`. Keep keys and erasure tombstones together and separate from MySQL. Do not log/share key bytes, recipient payloads, runtime URLs or `.env` contents.

Set the two backend-only variables in ignored `backend/.env`, then run from the repository root:

```sh
npm --prefix backend run orders:configure:local
```

Initialization reads version/current private payloads using the existing runtime identity, refuses new binding when existing encrypted rows have no proven original custody, verifies every undeleted/unclaimed payload, and performs a standalone encrypt/decrypt/re-created-service probe with no database/order writes. A first empty vault creates its database-bound marker once. Existing files are never overwritten to repair missing keys. Restart the local backend after configuration; never change its auth/MFA/AI secrets, database identity or counters.

Recovery requires both the database backup and original vault directory, including deletion tombstones. The existing [Mac backup](mac-backup-verification.md) is SQL-only and does **not** back up this vault. Automatic vault backup/offsite restore is NOT CONFIGURED. Keep this persistent directory when moving/reinstalling; losing it makes affected recipient details unreadable. Before serving a restored database, reconcile tombstones, holds, payments and existing AI counters. Do not restore old SQL over the active database.

To disable new local orders, stop the backend, remove the two opt-in variables and restart. Preserve the vault and all database rows; encrypted order reads still need the matching configured vault, so prefer stopping sales through existing owner controls when historical reads must stay online. Never remove the vault as a rollback mechanism.

## Verification and activation

Evidence is scoped to local use; Codex self-review only. [Sanitized receipt](evidence/local-ordering-adoption.json) records checks and artifact hashes. No migration/grant change was performed on the retained database.

- PASS backend lint/build,58unit tests and9HTTP E2E. An initial sandbox E2E attempt was denied loopback listen; the approved unrestricted rerun passed.
- PASS selected actual MySQL9.2.0 orders, fulfillment and notification integration groups: concurrent same-key create/completion, message deduplication, lost-response replay, notification-insert failure rolling back order/request/messages, private mailbox access and current-context links. Initial invocation used the wrong cwd for contract files; another new assertion mistakenly used the same buyer as its foreign actor. Both were corrected and rerun; initial failures are not passes.
- PASS frontend lint/build and extended `test:checkout` actual Chrome/disposable MySQL journey. It checks guest/login continuity, lost-response/same-key recovery, account isolation, price/quote consent and native double-click at360/390/768/1024/1440px, plus buyer/owner order inbox navigation and no opening checklist at360/1440px. The runner's two stale setup labels were updated after its initial wait failure. Synthetic360px inbox and desktop selected-owner-order screenshots were visually inspected; no horizontal clipping was observed.
- PASS retained-local configuration probe: actual MySQL9.2.0, persistent database-bound vault, fresh-service decrypt roundtrip, original payload custody check and no business writes. Before/after activation counts remain1order,0private payloads,17notifications. The existing Nest watcher restarted with the new environment and public catalog returned HTTP200. Existing auth/MFA/AI secrets and counters were not changed.
- Browser observation on the actual local checkout confirms the original saved intent is still present. The user must select “Kiểm tra / thử lại đúng đơn”; configuration/reload never submits it. If its quote has expired, explicit price/fee reconfirmation remains necessary. Actual real-order submission after adoption is NOT RUN by Codex.
- PASS affected local Markdown link targets/line limits and diff whitespace. Full integration suite, full accessibility certification and offsite vault recovery are NOT RUN; automatic vault backup is NOT CONFIGURED.

## Follow-up acceptance

The [October23 repair and real-account acceptance record](local-ordering-acceptance.md) supersedes any inference that the synthetic checks above prove the user's complete current local journey. It records the actual restaurant-hours refusal, duplicate backend watchers, scoped repairs, fresh tests and the pending second-account/open-hours acceptance gate.
