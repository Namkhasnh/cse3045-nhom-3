# P25 — Approved account, support, privacy and audit contract

Authority: [approved DEC-08.2026-10-21.v1](account-support-policy-proposal.md), [account security](account-security.md), requirements US18/25/26, FR12, NFR07, AC17. [P25 evidence](progress/P25.md) owns acceptance; this contract does not authorize retained-data adoption or production publication.

## Sessions and availability

`PATCH /admin/users/{id}/availability`: closed `expected_version,is_active,reason`, optional `credential_compromised` boolean (default false; permitted only with `is_active:false`). Sole MFA Admin; protect the sole authority, preserve ownership. Account availability/auth-version, append-only reason event, stop-accepting flag on the owned restaurant, and safe audit commit together. Repeated effective state is a no-op. Version conflicts return409. Resumption does not enable sales; erasure requests/tombstones cannot be resumed through this route.

Suspension revokes all existing sessions. A fresh verified-password login of an ordinary suspended account issues a15minute `scope:obligations` session with only the `obligations` capability. Recheck current account/auth version and resource ownership on every request and under transaction locks. Explicit HTTP metadata permits only these operation groups:

- `/auth/me`, logout; own order/history reads and buyer pending cancellation.
- Current-owner order reads, pending rejection, food-ready and accepted→delivering→completed; never pending acceptance. Owner cash/QR receipt/refund confirmation retains actual-verification requirements.
- Existing payment instructions/claims/disputes and authorized image reads; receipt/refund proof upload only, never new QR configuration.
- Own finance reads, scoped support, own erasure tracking/request. No new order, application, profile mutation, rate/survey/menu/QR configuration or Admin power.

A compromised-credential suspension additionally sets `credentials_blocked`; no old or fresh session may act while it remains set. Admin cannot resume it before recovery. The approved email channel supports Origin-checked `/auth/recovery/start` (`login_identifier`) and `/auth/recovery/complete` (`login_identifier,code,new_password`). Generic start response; only blocked accounts with an existing verified email receive a code. No email/identity is invented for legacy accounts: unavailable contact requires operator support and grants no temporary access.

Recovery codes have a separate HMAC purpose,10minute expiry, at most5attempts,60second resend interval and shared hashed username/IP budget5requests per15minutes. Count failed code attempts in a committed transaction. Check the existing password-safety policy/hash outside transactions, require a password different from the compromised one, then recheck and atomically consume the code, replace the password, revoke sessions and audit. Return no session and keep `is_active:false`; the user logs in again for restricted obligations. Never expose password/code/hash in DTOs/audit. Sole Admin recovery stays its existing protected operator workflow.

## Closed private APIs

[Enabled OpenAPI](data/administration.openapi.json) defines exact scalars/projections and is merged into the main OpenAPI. IDs are decimal strings; UTC instants use milliseconds; business time is `Asia/Ho_Chi_Minh`. Private reads use `no-store`. Browser requests bind `X-Account-Id`; all protected writes retain CSRF/Origin.

| Operation | Contract |
| --- | --- |
| GET `/admin/users[/{id}]` | Lists: optional `is_active,limit,cursor`;20default/100max, ascending ID, actor/filter-bound signed cursor. Only ID/display/availability/version/managed restaurant/sole-Admin and erasure-request indicator. Detail masks email/phone and includes safe erasure summary/credential block. Every list/detail access audits before returning. |
| GET `/support/requests`; `/admin/support/requests` | `status,order_id,limit,cursor`;20/100 ascending ID, actor/filter-bound cursor. Buyer or current owned-restaurant scope, Admin all. An explicit unauthorized order filter returns404. |
| POST `/support/requests` | Key;201new/200existing-or-replay; `order_id,category,priority,description`, optional same-order `followup_id,dispute_id`; Admin requires `operator_reason`. Return current existing not-closed `(order,creator,category)` case for duplicates, including resolved during its appeal grace. Persist only result ID/hash in the durable request store. |
| GET `/support/requests/{id}` | Reauthorize order scope; safe messages, requester flag and deadlines. Internal/reason notes are Admin-only. Message pages100max with scope-bound cursor; no full history dump. |
| POST `/support/requests/{id}/messages` | Key;201new/200replay; `body`, optional Admin-only `internal`. Participant limit100messages/case; internal text never appears in audit. |
| PATCH `/admin/support/requests/{id}` | `expected_version,status,reason`; resolving additionally requires `outcome,resolution`. Enforce DEC-08 six-state transitions. |
| POST `/support/requests/{id}/accept-resolution` | `expected_version`; creator accepts a resolved case and closes it. |
| POST `/support/requests/{id}/escalate`, `/hold-request` | `expected_version,reason`; participants request escalation/retention review, Admin confirms escalation. A request never claims an actual hold exists. |
| GET `/support/requests/{id}/holds` | Safe bounded list of latest100hold IDs/versions/times; no reason/contact disclosure. |
| POST `/admin/support/requests/{id}/holds` | Key;201new/200replay; `reason`; hold protects the linked order, current proof and personal payload. Refuse deletion-claimed resources. Store30day review due; overdue never auto-releases it. |
| POST `/admin/restaurant-applications/{id}/holds` | Key;201new/200replay; `reason`; lock applicant/application/evidence and protect exactly that application's evidence. |
| GET `/admin/data-holds/{id}` | MFA Admin; exact safe hold metadata, audited read for uncertain version reconciliation; no reason/body/contact disclosure. |
| POST `/admin/data-holds/{id}/release` | `expected_version,reason`; authorized resolved dispute only. No immediate deletion; preserve90day grace. |
| POST `/admin/support/requests/{id}/reveal` | `reason`; explicit audited exceptional recipient reveal for this case only. Purpose stored as a private internal note; no general contact directory. |
| GET/POST `/privacy/erasure` | Own request/status; POST exactly `{}`. Deactivate/revoke/stop sales atomically, preserve facts. Request replay returns the existing record; sign in again after revocation. |
| POST `/admin/users/{id}/erasure/verify` | `expected_version,reason,identity_verified:true`; explicit manual identity verification and acknowledgment. No invented verification from a timestamp alone. |
| GET `/admin/audit-logs` | Approved exact actor/action/target/correlation/time filters; default7days/max31days,20/100 descending timestamp+ID. Bind cursor to actor/filter/cutoff/max-ID; prevent lookup events entering their own pages. Rate60successful pages/minute/account. |

An active support slot includes `resolved` until `closed`, preserving the7day right to reply. An approved forward guard change refuses existing conflicting cases rather than deleting/selecting one.

Support categories: `delivery,payment_refund,account_access,other`; priorities `urgent,normal`. Descriptions/replies1–2000characters, reasons/resolutions1–1000; plain text, no file/HTML/fetched URL workflow. Admin notes do not count as a substantive public reply. Resolution outcomes: `answered,action_recorded,unable_to_resolve`. Existing DEC-06 payment disputes remain independent: closing support does not resolve a dispute or a hold.

`open→in_progress→waiting_requester|waiting_partner|resolved`; waiting→in_progress on the relevant participant's reply or reasoned Admin action. Resolved requester reply within7days reopens; creator acceptance or maintenance after7days closes; closed is terminal. Waiting does not pause response/update clocks. Urgent2h/4h and normal24h/48h targets are elapsed, including holidays. Escalation records intent/confirmation, not a second Admin or automatic external notification.

New safe errors include `ACCOUNT_RESTRICTED`, `SOLE_ADMIN_PROTECTED`, `SUPPORT_STATE_CONFLICT`, `SUPPORT_MESSAGE_LIMIT`, `EVIDENCE_DELETION_IN_PROGRESS`, `DISPUTE_OPEN`, `ERASURE_PENDING`, `CREDENTIAL_RECOVERY_REQUIRED`, `RECOVERY_CODE_INVALID`, `PASSWORD_REUSED`, plus existing version/key/auth/rate errors. No raw foreign IDs, private notes or evidence appear in errors. Unknown fields/unsupported filters are422; foreign nested resources404. A failed required access audit returns no protected data.

## Storage, retention and recovery

Forward migrations add availability events, support requests/messages/events, holds, erasure requests, encrypted order personal payloads and optional credential-recovery fields. Preserve every old account/order/finance column, ownership and actor FK; no inferred old support, hold, suspension, verification or private payload. All new logical links use RESTRICT FKs; active support uniqueness and scalar/state guards are actual MySQL constraints.

For new orders in synthetic scope and the explicitly authorized retained-local scope below, business rows store explicit private placeholders; recipient/name/phone/private destination text are sealed in an immutable AES-256-GCM payload with UUID-bound authenticated data and a retained hash. Keys are separate from MySQL. The existing quote's public surveyed coordinates/point identity remain business facts; no recipient contact enters it. Pre-existing plaintext is left intact, explicitly outside automatic erasure until a separately authorized inventory/migration.

The synthetic vault is enabled for loopback `test_*` databases. Default key directory is private OS temporary storage namespaced by database host/path; optional `P25_PRIVATE_KEY_DIR` must be an operator-managed local test directory. Key writes/decrypt/erasure run outside retried transactions. Missing key without a deletion tombstone is unavailable, not false erasure. Deleted/claimed private content returns an explicit unavailable marker. Local tests are not production key custody/backup guarantees (DEC-10/11 remain open).

October23 user authorization also enables new orders on the existing local `127.0.0.1:3307/hlf_dev_flow` database through explicit `ORDER_LOCAL_RETAINED_DATABASE=hlf_dev_flow` plus `ORDER_PRIVATE_KEY_DIR`. This separate retained-local mode rejects production, other database/port targets, temporary/relative/symlinked/world-accessible directories and missing/mismatched database binding. Keys use persistent owner-only0700 storage,0600 files and synced writes; startup/configuration must preserve existing keys and external erasure tombstones. No legacy plaintext conversion or retained erasure maintenance is authorized. See [local ordering adoption](local-ordering-adoption.md) for evidence and recovery limits.

Internal `privacy:cleanup:local` requires `P25_LOCAL_MAINTENANCE=true`, local `test_*` database and `P25_MAINTENANCE_ACTOR` naming the enrolled sole Admin. Use a separate operator DB identity, never grant website runtime purge rights. Scan in bounded batches; recheck authority/order/payment/support/holds under account→authority→restaurant→order→payment→support/privacy locks. Profile erasure locks all relevant restaurants/orders in numeric order. Failed audit/metadata commits roll back; storage deletion happens after a durable claim and is retryable.

- Personal order payload:24calendar months in Vietnam business time from the latest known terminal/financial/support/dispute closure. Active orders, unpaid/unknown completed payment, pending refunds, open support/disputes and holds prevent cleanup. Unknown history is not inferred resolved.
- Profile:30days from actual verified eligibility, computed from closure facts/hold grace/finance timestamps. A late maintenance run does not restart the clock. Clear mutable contacts/credentials into an unusable reserved tombstone, preserving IDs/ownership/business history. Pending applications, related holds, active obligations or nonzero signed partner balances block it.
- Support bodies/internal notes:90days after closed, subject to holds/disputes. Preserve IDs/category/events/times and deletion metadata. Auto-close resolved7day grace through internal maintenance; never auto-resolve money or disputes.
- Payment/onboarding file retention preserves DEC-06/03, extended by holds. Both cleanup workflows consult the privacy module under the same resource locks before claiming deletion. New holds/disputes cannot attach to an in-flight deletion claim.
- Released holds keep the later original expiry or90days after release. Missed30day review never releases them. Retained business facts, pseudonymous IDs, request hashes/results and redacted audit are indefinite under the approved package.

Key erasure writes an external deletion tombstone before removing the key. Database restoration cannot resurrect that key; serve no private content when a tombstone exists. Keep tombstones outside rollbackable DB backups and enforce them before restoration serves traffic. Production key inventory/custody, actual backup expiration and disaster restore remain DEC-10/11; production publication/staffing/legal review remains DEC-12.

Audit reads allowlist typed scalar changes and additionally redact unsafe legacy fields. Never reveal free-text reason/message/evidence, recipient/account contacts, bank details, raw durable keys, credentials/factors/tokens, IP/user-agent or object paths. Only a server-designated `req_<UUIDv4>` correlation ID is displayable. Access audit commits before a protected response; audit-list access writes one safe count event without recursion.

Keyed P25 writes set `Idempotency-Replayed` explicitly; replay returns the original resource ID and its current authorized representation. Sole Admin is independently refused by public credential recovery even if a corrupt/forged block/code record exists. Order response schemas permit an explicit deleted-recipient marker; order input schemas still require a real valid recipient phone.
