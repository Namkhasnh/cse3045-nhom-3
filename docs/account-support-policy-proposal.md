# DEC-08 — Approved account availability, support, privacy and audit policy

Status: **APPROVED by the repository operator/user**, October 21, 2026. Package `DEC-08.2026-10-21.v1`.
Owner: [account security](account-security.md), [decision register](decisions.md), requirements US18/25/26, FR12, NFR07, AC17.
Scope: approved synthetic implementation of [P25](prompts/v0.7.md#p25). [P24](progress/P24.md) records accepted isolated synthetic finance evidence; implementation evidence and acceptance remain separate.

Approved product choices below are not statements of legal compliance. Explicit user approval: “Duyệt toàn bộ gói DEC-08.2026-10-21.v1, triển khai P25 trong phạm vi dữ liệu thử nghiệm.” Approval authorizes P25 implementation and verification on synthetic data only. Retained migration, publication, external messaging and money movement remain unauthorized. Implementation acceptance is separate.

## 1. Suspension and outstanding obligations

Recommend a restricted obligations mode rather than delaying suspension until debts/refunds end. Account availability, restaurant availability and fulfillment/payment states remain distinct.

| Situation | Proposed handling |
| --- | --- |
| Suspend an ordinary buyer or manager | Sole MFA Admin supplies reason and expected version. Availability, auth-version revocation and audit commit together under account-first locks. Repeating the current state is an authorized no-op; no role/ownership change. |
| Existing sessions | Revoke all existing sessions immediately. A subsequent password/email-verified authentication can issue only a restricted obligations session, with server-side scope checked on every request; never a normal session while suspended. Existing password/rate-limit/CSRF protections remain. |
| Restricted buyer | Read own historical orders/payment facts; cancel own pending order; submit/track support and disputes; access existing refund instructions/evidence under the approved payment policy. No new checkout, opening application or unrelated mutation. |
| Restricted current manager | Read own existing orders and finance; reject pending orders with reason; progress already accepted/delivering orders; verify actual receipts and record required refunds under DEC-06. Cannot accept pending orders, publish/configure selling or change ownership. |
| Restaurant of suspended manager | Atomically stop new ordering and public orderability; retain ownership and all facts. Resuming the account does not reopen sales automatically: readiness and an explicit owner accepting-orders action are required. A separately Admin-deactivated restaurant remains inactive. |
| Pending/accepted/delivering orders | Suspension never changes order status. Pending buyers can cancel and managers can reject; accepted/delivering orders continue with the same current manager and permitted state edges. Admin cannot fulfill/cancel/confirm payment on their behalf. |
| Pending refund | Keep the obligation, evidence and original deadline. Full verified direct refund remains due within 24 elapsed hours under DEC-06. Suspension never restarts the clock or marks it paid/refunded. |
| Outstanding commission or credit | Preserve signed balance and manual finance controls. Restricted owner can read; MFA Admin continues authorized DEC-07 accounting. No automatic collection, penalty, write-off, debt transfer or suspension based solely on overdue debt. |
| Compromised credentials | Revoke sessions and use existing verified credential recovery before restricted access. Do not issue an alternative bearer link, delegate ownership or grant Admin operational powers. Record stalled obligations as urgent support; an unavailable owner is an escalation, not permission for a forbidden transition. |
| Sole Admin | Reject self-suspension and any website removal/suspension of the sole authority. Existing operator recovery remains the only recovery route. |

Restricted access ends at logout/revocation and is rechecked against current account/ownership/resource state; it never permits access to another buyer or former manager's scope. Recovery from a lost response keeps the original durable intent. Define closed route/operation allowlists and negative tests before implementation; a generic guard bypass is forbidden.

Alternative: reject suspension while any active order/refund/debt exists. Simpler implementation, but lets an unsafe account continue ordinary actions and permits indefinite evasion through outstanding debt. Fully blocking every operation prevents the actual owner from satisfying obligations. Restricted mode has higher authorization/test cost and is the recommended tradeoff.

## 2. Order-linked support

Recommend one order per request; buyer or current manager may open/read/reply within their order scope, including restricted accounts. Admin may open an operator case with a reason. An open request does not prove an allegation. Do not reveal account/application contacts or another participant's private evidence through ticket nesting.

Proposed statuses: `open`, `in_progress`, `waiting_requester`, `waiting_partner`, `resolved`, `closed`.

- Creation enters `open`. Only the sole MFA Admin changes status, using expected version and a reason; each effective change has an append-only event and audit.
- `open → in_progress`; `in_progress → waiting_requester|waiting_partner|resolved`; either waiting state returns to `in_progress` when the requested participant replies, or by reasoned Admin action. Waiting states cannot resolve directly.
- `resolved → closed` after the requester accepts or after 7 elapsed days without a reply. A requester reply within those 7 days returns the case to `in_progress`; participants cannot close an unresolved case.
- `closed` is terminal. A later issue creates a linked follow-up case. Admin resolution requires a public explanation and structured outcome `answered|action_recorded|unable_to_resolve`; this does not assert payment/fulfillment success.
- One open case per `(order, creator, category)`; return the existing case for a duplicate. Categories: `delivery`, `payment_refund`, `account_access`, `other`. Durable create/reply keys prevent duplicate messages after response loss.
- Proposed limits: initial description/reply 1–2000 characters; resolution/reason 1–1000 characters; at most 100 participant messages per case, then a linked follow-up preserves continuity. No ticket uploads, external URL fetching or HTML. Existing protected payment evidence is linked by authorized opaque ID, never copied into messages. Internal Admin notes are separate and never serialized to participants.
- Shared thread includes only deliberately submitted support text, safe order ID/status and participant role labels. Explicitly warn users not to paste phone, address, bank details or secrets. Arbitrary participant text is not safe audit content.

Response targets use elapsed hours, including weekends/holidays, displayed in `Asia/Ho_Chi_Minh`. They are operational targets, not automatic compensation or a promise of autonomous notifications.

| Priority | Criteria | Human first response | Next substantive update |
| --- | --- | --- | --- |
| Urgent | Active delivery failure, compromised account, refund deadline at risk/overdue | Within 2 hours | At least every 4 hours until stabilized |
| Normal | Other order/account questions | Within 24 hours | At least every 48 hours until resolution |

The clock starts at server receipt; an automated acknowledgement does not count. Waiting for a participant never pauses first-response or update deadlines. Response/update due timestamps and overdue flags are derived and visible to Admin; no automatic suspension, refund or money change follows a breach.

Escalation is a separate flag/time/reason, not an extra fulfillment state or extra Admin account. Admin can escalate immediately; participants can request escalation; a missed deadline makes the case overdue and eligible for escalation. Only Admin confirms escalation. The repository operator remains accountable and records out-of-band consultation/reference manually, with no automatic email/Slack transmission. A named duty owner and backup/contact channel must be recorded before production under DEC-10/12; technical policy approval does not establish staffing. No second website Admin or assigned support-agent role is introduced.

Payment disputes retain approved DEC-06 `open → resolved` semantics. A support case may link a dispute; resolving/closing support never resolves that dispute or releases its evidence hold. Admin must act on the dispute explicitly with the existing reason/version rules.

## 3. Data access, retention and removal

Recommend preserving non-contact business history while giving contact data an explicit end date. This extends the currently unresolved database §8 retention policy; it does not authorize rewriting original commercial facts or silently dropping existing plaintext snapshots.

| Data class | Proposed retention / handling |
| --- | --- |
| IDs, non-contact order/item/money snapshots, state/finance facts, terms/consent version/hash, successful request results and redacted audit | Indefinite for historical integrity and replay protection; no physical account/order/finance deletion in P25. Keep stable pseudonymous actor IDs. Review necessity annually before production policy renewal; a later change requires a new explicit retention decision. |
| Mutable account profile/contact fields | While active. On verified erasure request, deactivate/revoke and acknowledge within 7 days; complete profile anonymization within 30 days after identity verification and all related obligations/holds end. Preserve an unusable unique account tombstone and ownership/history links, never recycle identity. No automatic anonymization solely for inactivity or suspension. |
| Private recipient/contact/detailed-destination snapshot payloads | 24 calendar months after terminal fulfillment and closure of all payment/refund/support obligations, whichever is later; a hold postpones deletion. After expiry remove the personal payload and show an explicit unavailable marker. Preserve non-contact snapshots, amounts, IDs, hashes and deletion metadata. |
| Support message bodies and internal note bodies | 90 days after terminal `closed`; retain safe category/status/times/order links/outcome code indefinitely. Reopened or linked active disputes hold relevant content; do not duplicate bodies into audit. |
| Payment proof images | Preserve approved DEC-06: 90 days after financial resolution; dispute resolution restarts a 90-day grace; pending obligations/live QR references prevent cleanup. |
| Onboarding evidence files | Preserve DEC-03: unattached 24 hours, rejected 90 days, approved one calendar year after an explicit cooperation end. Add the same dispute hold; never invent an end date. |

Snapshot personal-payload removal is an explicit proposed refinement of historical immutability: business facts remain immutable; personal information is isolated in an immutable encrypted private payload with separate keys, then removed/cryptographically erased only by privileged retention maintenance. P25 must define the forward storage/migration plan before implementing this policy. Do not overwrite commercial snapshots, pretend a UI mask erases data, or claim key destruction erases existing plaintext copies. Existing plaintext data requires an inventoried, reviewed migration and separately authorized retained-data adoption; no bulk erase is authorized here.

Personal payload keys must be absent from retained database/backups after erasure; backup recovery must reapply deletion tombstones before serving traffic. DEC-10/11 must establish actual key custody, backup expiry and restore enforcement before production. Local synthetic implementation must verify these boundaries honestly; no claim of backup erasure from a metadata flag.

Access defaults: buyer sees own records; current manager sees only own restaurant and order contacts at the already-approved food-ready milestone; suspended users get only the obligations projection. Admin sees masked account contacts in lists and safe support summaries. Exceptional contact/evidence reveal requires a specific case, reason, explicit action and access audit; it never grants access to MFA/password/session secrets. No mass reveal or general export. Existing protected payment/onboarding evidence read contracts remain subject to resource authorization.

A hold records exact related resource IDs, reason, creating Admin, start time and next review due in 30 days. Buyers/current managers can open a linked dispute/request a hold; creation of an authorized open dispute protects relevant resources atomically. Only MFA Admin releases a hold with a reason after resolution. A missed review never expires it automatically. For a released hold, content expiry is the later of its original deadline and 90 days after release; active obligations and other holds still win. The longer grace is intentional, including support/onboarding evidence.

Hold creation and cleanup claims serialize under the documented account/resource lock order; a claimed/deleted object cannot be promised as available evidence. Deletion uses reference-checked claims, storage work outside retried transactions, retryable completion/tombstone/audit and no public object URLs. Hold release does not delete immediately. A deletion request cannot suppress an existing dispute or financial obligation; tell the requester which data categories remain and why, without exposing another person's data.

Alternatives: keep all contact data forever (simpler, higher privacy exposure), or purge complete order/account rows (breaks history/replay/FKs). The recommended separation costs storage/key/restore work. Durations are proposed operational values; exact Vietnamese publication and legal/operational review remain DEC-12, with no compliance conclusion made here.

## 4. Audit lookup and protected access

Only the current sole MFA Admin may query `/admin/audit-logs`. Recommend these closed filters: `from`, `to`, `actor_id`, `action`, `target_type`, `target_id`, `request_id`; unknown keys/values are rejected. Actions/resource types come from backend-owned enums, including availability/support/reveal/hold/lookup actions. Target ID requires target type. Exact identifiers only; no free-text search inside changes, raw SQL, arbitrary JSON path or export.

Default time range: previous 7 elapsed days; maximum 31 elapsed days per query with `from < to`, `[from,to)` UTC boundaries. Older periods remain queryable with an explicit interval. Default limit 20, maximum 100, descending `(created_at,id)` keyset only. Opaque cursors bind actor, validated filters, sort and first-page cutoff; reauthorize every page. A captured first-page maximum ID also excludes audit rows appended during pagination, including the lookup's own audit.

Allowlisted output: `id`, UTC timestamp, pseudonymous `actor_id`, safe action, target type/ID, safe correlation ID, structured reason code, approved non-sensitive field names and typed before/after values. Example: `is_active:true→false`, `status:accepted→delivering`, exact financial strings where authorized. Human-readable audit reasons must be separately sanitized/allowlisted; free-text support, suspension narratives and evidence contents are never copied verbatim. Redact unsafe legacy fields at read time too.

Always omit password/hash, factor/recovery material, cookies/tokens, raw request body, raw durable keys, storage paths/URLs, email/phone/full recipient/destination, bank/payee details, evidence contents, support/internal-note bodies and raw IP/user-agent. A safe request correlation ID is not an idempotency key. Show `redacted:true` where a changed field is intentionally hidden; never replace it with a reversible mask.

Successful private user detail, support detail, exceptional reveal, audit lookup and hold operations record actor/target-or-filter IDs/time/purpose and outcome, without the response body. Audit-list reads record one access event per HTTP page with result count; internal audit writes do not recursively audit themselves. Fail closed if a required access audit cannot commit before returning protected data. Rate-limit Admin lookup to 60 requests/minute/account; do not cache private responses. Mutation and its audit/result remain atomic as already required.

Alternative: allow unrestricted dates/free-text/export for convenience. Rejected recommendation because of unbounded scans, sensitive-value search and bulk disclosure; bounded paginated historical lookup covers investigation without a new export workflow.

## 5. Approval and implementation boundary

Decision: the repository operator/user approved the complete package on October 21, 2026, with the exact authorization quoted above. DEC-08 is APPROVED; P25 implementation/verification and acceptance are separate. Production DEC-10/11/12 gates remain open.

After approval: update requirements/account-security/database/API/OpenAPI/UI/testing at their owners; specify closed DTOs and error/retry contracts; implement the smallest coherent P25 slice with restricted-session/hold/retention migration design. Do not treat this proposal as enabled API schemas or evidence that new endpoints exist. Retained adoption, production services, staffing, backup guarantees and published notices stay separately gated.

Required evidence plan: USER-01, SUPPORT-01, AUDIT-01, AUTH-02, ADMIN-02; real MySQL 9.2.0 account suspension versus checkout/acceptance/fulfillment/refund/finance writes; atomic revoke/audit rollback; scoped restricted sessions and nested ID denial; ticket transition/version/deadline boundaries; lookup redaction/cursor cutoff/access-audit failure; hold-versus-cleanup and erasure/restore tests; actual browser self-suspension denial, suspended buyer/manager obligations, 360px and keyboard states. These checks are **NOT RUN** for this proposal. No application tests are needed for documentation-only preparation.

Concrete DTO/storage/recovery implementation is owned by the [P25 contract](account-support-v07-contract.md). The compromised-credential gate uses the existing verified email channel with purpose-separated single-use recovery and a mandatory new password; it does not reactivate the account or extend sole Admin recovery. Production custody/staffing/backup/publication remain separately gated.
