# Retained local demo cleanup — October 24, 2026

Authority: the user approved the concrete local cleanup plan and separately selected discovery categories that have public dishes. Only Mac loopback3307/`hlf_dev_flow` is affected. The existing website/VPS, fixtures, migrations and commercial-release gates are unchanged.

## Applied behavior

- Suspended the seven explicitly selected sample accounts and incremented their auth versions through the existing administration workflow. Existing sessions are invalid; DEC-08 fresh restricted obligations access remains available where applicable. No credential compromise, erasure request or physical account deletion was invented.
- Deactivated both selected sample restaurants and stopped their sales; hid/stopped selling all seven sample dishes. Preserved every account, restaurant, dish, ownership, application/review/consent, durable result, order/payment/commission and audit record. One sample restaurant has order/commission history; the other has retained onboarding/review and creation-result links. This task archives their targets rather than erasing evidence or forcing FK cleanup.
- Disabled both sample/unverified pickup points, keeping survey links and historical snapshots. Existing setup synchronization consequently changed the previously ready real restaurant to `setup_required` and stopped new sales. Both retained real restaurants now require setup; their profiles, ownership, menu, prices and account credentials are preserved.
- Disabled ignored `frontend/.env.local`'s local demo notice. Illustration labels remain accurate; test fixtures and fixture-only routes are unchanged.
- Homepage category reads now use `GET /dish-categories?public_only=true`: only categories with a visible dish from an active, ready restaurant qualify. Closed restaurants and visible sold-out dishes still qualify, consistent with catalog discovery. Default/false retains all categories for creating dishes; no category names/IDs are hardcoded in the frontend and no taxonomy rows were deleted. API/OpenAPI own the filter and cursor binding.

## Operator tooling

Run from the repository root after building the backend. The CLI defaults to inventory and rejects production, other hosts/ports/databases, unexpected identities/ownership and source changes since inventory. Output manifests contain row hashes and selected identifiers, not credential/contact payloads; keep them in an operator-only directory outside Git.

```sh
cd backend
node scripts/cleanup-local-demo.mjs
node scripts/cleanup-local-demo.mjs --inventory /protected/backup/cleanup-manifest.json
node scripts/cleanup-local-demo.mjs --apply /protected/backup/cleanup-manifest.json
```

Apply requires sibling PASS receipts `evidence.json`, `assets-evidence.json` and `cleanup-rehearsal.json`. These operational prerequisites must correspond to the current source and candidate; a receipt filename alone is not backup evidence. Never regenerate a manifest to bypass unexplained source drift. All changes reuse existing workflows within one dedicated CLI transaction, with account-first locks, existing checks, events, request results and audit. No HTTP server is started. A durable manifest-bound cleanup result commits with the mutations; same-manifest repeats have no duplicate effects, and a different manifest cannot reuse the completed operation. No external storage/provider call occurs inside the transaction.

Companion commands take the protected directory returned by the existing local-only [SQL backup](mac-backup-verification.md):

```sh
node ops/recovery/backup-local-assets.mjs /protected/backup
node ops/recovery/rehearse-local-cleanup.mjs /protected/backup
node ops/recovery/verify-local-cleanup.mjs /protected/backup/cleanup-manifest.json
```

The rehearsal restores retained data into a newly labelled, isolated MySQL9.2.0 container; never run generic fixture/reset suites against that copy. The separate catalog integration test uses an empty disposable database and synthetic records only.

## Recovery point and evidence

Protected local recovery material is under `~/Library/Application Support/HLF Backup/full-prLEdt/`: encrypted SQL, encrypted media/vault, private inventory, restore and rehearsal receipts. The existing age identity remains in its original configured location and is not copied/uploaded. Nothing was uploaded. Preserve that identity and the recovery directory; this is one manual recovery point, not automatic backup/retention coverage.

- PASS fresh SQL restore on MySQL9.2.0:62tables/361rows/28migrations, exact schema/all-row comparison and unchanged source at backup verification.
- PASS209objects across2buckets restored/read back in isolated MinIO;8vault files restored in a private separate directory with exact bytes. Source assets were re-read unchanged. No live object/key deletion occurred.
- PASS actual-MySQL stale-inventory refusal; injected mid-operation and late audit failure each rolled back the entire batch, including audit/messages/results. Two independent concurrent CLI apps produced one effect and one replay; subsequent replay changed no rows.
- PASS backend lint/build,59unit tests and9HTTP E2E; E2E initially hit sandbox loopback `EPERM`, then passed with loopback permission. PASS frontend lint/build; Vite reported its existing large-bundle advisory.
- PASS extended public-catalog HTTP/MySQL test on a fresh isolated9.2.0 database: default taxonomy, filtered hidden/inactive/setup-only/empty categories, visible sold-out/closed inclusion, pagination, cursor filter mismatch and malformed-filter rejection.
- PASS retained-local verification: every original protected historical row remains; real account/dish rows unchanged; seven old sample sessions return401 and fresh restricted sample sessions cannot access ordinary owner routes; both real buyer-manager accounts pass in-memory signed-session `/auth/me` probes. Password login is **NOT RUN**; no password was supplied or changed.
- PASS live backend/proxy reads and desktop Chrome observation: no public demo restaurant/dish/pickup point, no sample category on the homepage after backend restart, no local demo notice. Current public discovery is empty because neither retained real restaurant is ready. Full mobile/accessibility certification is **NOT RUN**.

[Sanitized adoption receipt](evidence/local-demo-cleanup.json) records local state and session limits. Self-review only. Existing histories remain visible to their authorized participants/Admin; removing them from historical screens is not part of cleanup. Do not restore the pre-cleanup dump over the active database: reconcile subsequent orders, receipts, AI counters and external erasure tombstones before any separately authorized recovery.
