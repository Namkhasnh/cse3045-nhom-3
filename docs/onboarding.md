# Restaurant Opening Applications and Partnership

Authority: [requirements](requirements.md) US23–24, FR11, AC14–15; delivery V0.3 P07–P10. DEC-03 approved October19,2026 through explicit user decisions and implementation authorization. [Final DTO/storage contract](onboarding-v03-contract.md) and [Vietnamese terms](terms/partnership-2026-10-19.v1.txt) own exact limits/text. Acceptance is local/synthetic only, not real publication or production readiness.

## 1. Identity and eligibility

An active email-verified ordinary user may apply when they manage no restaurant. A missing legacy email is insufficient for a new opening application: verify an email first. Sole Admin is not an eligible owner applicant. Ownership includes inactive/setup-required restaurants and is capped at one by DB uniqueness. Management preserves buyer access; no role promotion substitutes for ownership.

Required: proposed restaurant name/address, contact name/phone, one front image and one business-registration document. Names≤200 Unicode code points, address≤1000, phone optional+ and9–15digits. Front JPEG/PNG; document JPEG/PNG/PDF; each≤5MiB. Actual bytes/MIME are checked server-side; no arbitrary URLs. No CCCD or bank data at onboarding. Private account email/phone is never automatically published in catalog.

## 2. Versioned partnership consent

Immutable terms include version, SHA-256, exact Vietnamese UTF-8 content, publication/effective times and retained accessible copy. Store applicant, exact version/hash and consent instant. Show text/version and require explicit consent; never silently update acceptance. New submissions use current published/effective terms; pending submissions retain their agreed version. API supports retained-version reads.

[Approved V1 text](terms/partnership-2026-10-19.v1.txt) identifies hoalacfood, Zalo0352689944, restaurant delivery/direct payment, per-partner3–5% commission with5% cap/no default, explicit new-rate consent for new orders, full direct refund within24h when obligation and verified receipt exist, monthly statements by3rd/payment by7th, next-period corrections and signed balances. Those commercial clauses are scoped DEC-04/06/07 approvals; full QR/proof/correction/dispute contracts remain separately gated.

Manual creation uses an immutable Admin-prepared invitation. Selected active verified ordinary user must log in, inspect exact proposed fields/files and retained terms, and explicitly confirm. Admin cannot consent for the user; new ownership requires confirmed snapshot. Changes require a new approved workflow; no editable invitation or silent replacement is exposed.

## 3. Lifecycle and history

Direct: `submitted → approved | rejected`. Manual: `awaiting_confirmation → submitted → approved | rejected`; only selected user confirms, only MFA Admin creates/reviews. One active pending record across both paths per account is enforced by a generated unique DB guard. Applicant drafts stay browser-session scoped until submitted. No edit, withdrawal, automatic expiry or reassignment control. Rejection requires nonblank visible reason; a new submission may follow rejection.

Retain immutable submitted content/consent, reviewer/actor/timestamp/decision/reason/result. Applicant sees only own records; sole MFA Admin sees protected review projection. No public read exists. Status is independent of account availability and restaurant readiness.

## 4. Atomic approval

One workflow, one MySQL9.2.0 transaction:

1. Authenticate current sole Admin with MFA; resolve applicant from stored application.
2. Lock actor/applicant accounts ascending, reserve durable intent, shared-lock singleton authority, then application/evidence/restaurant groups under [database §10](data/database.md#10-transaction-and-concurrency-recipes). Recheck active verified applicant, retained consent, submitted version and no ownership.
3. Create unique non-null owner link/restaurant with `readiness=setup_required`, `is_active=false`, `is_accepting_orders=false`.
4. Commit review, result and allowlisted business audit together; any failure rolls back all effects.

Same actor/operation/key/hash replays original result. Changed content with same key409. An authorized current-state decision repeat returns existing outcome without duplicate restaurant/review/audit; conflicting terminal decision409. Concurrent paths cannot create a second restaurant. No storage call occurs inside the transaction.

## 5. Manual creation and reassignment

Admin selects an eligible user via bounded exact username lookup, uploads private evidence for that user and creates an immutable invitation; one-pending cap also applies. Selected user confirms via their own authenticated session. Admin create references confirmed invitation ID/version only; no replacement owner/fields/consent are accepted. The same account locks, owner uniqueness, audit/result atomicity and readiness apply.

Reassignment is not exposed in V0.3. Preserve every legacy account/restaurant/role-request and approved DEC-01 mapping. Never fabricate partnership consent from role requests, silently assign ownership or run retained-data cutover. P10 upgrade fixtures must prove preserved rows and zero invented consent.

## 6. Sell readiness

Approval alone never opens sales. P11–P14 establish verified public profile, hours in Asia/Ho_Chi_Minh, current owner, active status, visible available menu, verified VJU point/fee data and agreed specific commission. Cash readiness and later QR readiness are distinct; V1.0 needs approved QR. Missing information keeps setup-required/not accepting. Every order rechecks active/open/accepting/catalog/delivery/rate conditions.

Approved later-order privacy: acceptance does not reveal contact. Only explicit “Đã xong món – chờ giao” opens recipient name/phone, filtered at backend in every owner projection; always omit buyer account ID/username/email and prevent identifying notes leaking earlier. Food-ready is a separate actor/time milestone, not delivering/completed or commission accrual.

Approved anti-evasion principle: false cancellation/off-platform diversion is prohibited. Buyer reports trigger two-party verification/appeal, never automatic delivery/payment proof or charging. Verified recovery needs a separate receivable design; do not reopen terminal orders or misuse completed-only adjustments. Implement these controls in later order/support/finance prompts, not claim V0.3 evidence for them.

## 7. Target storage and API handoff

Onboarding owns terms, evidence metadata/retention, immutable application payload/consent, append-only review and durable request results. Accounts own eligibility/authority; restaurants own unique ownership/readiness. [Enabled OpenAPI](data/openapi.yaml) and [focused onboarding schema](data/onboarding.openapi.json) define closed requests, private projections, keyset pages, scalars, errors and replay behavior; [contract](onboarding-v03-contract.md) lists every route.

Private MinIO via S3 adapter is authorized only for local synthetic acceptance, with durable local volume. Production storage/region/credentials/backups remain DEC-10/11. No file blobs in MySQL, public bucket or app temporary filesystem. Runtime SQL grants protect immutable terms/payload/consent identity/reviews/keys; application code protects immutable successful results.

Unreferenced uploads expire after24h. Rejected files expire90days after rejection; approved files one calendar year after explicit cooperation end. No termination UI invents end dates. Two-phase deletion marks metadata unavailable under account/application-reference protection, deletes object outside transaction, then records completion/audit; failed deletion is retryable. Preserve history/hash/deletion markers, not document copies in logs. Local-only cleanup command and setup are in [verification instructions](onboarding-local-verification.md); production scheduling/adoption remains unconfigured.

## 8. Acceptance evidence

ONBOARD-01: exact terms/hash/consent, retained versions, private files/records, rejection/resubmission/history and current-account denial. ONBOARD-02: actual MySQL9.2.0 SQL uniqueness/FKs, same/different-key approval/manual races and audit rollback. ONBOARD-03: submitted/approved setups never publicly sell and manager retains buyer rights. Browser: real form/upload/consent/retry/MFA/review/manual confirmation/create, keyboard and360px/five widths. P10: empty/upgrade fixtures preserve legacy rows; least-privilege runtime denies history tampering. See [progress](progress/README.md).

## V0.7 approved DEC-07 extension — October21

[DEC-07.2026-10-21.v1](finance-policy-proposal.md) is explicitly approved and owns monthly membership/finalization, next-period adjustment booking, full append-only receipt reversal/replacement, signed account credit and collection caps, supporting-reference access, exact report fields/cutoffs, recovery and Vietnamese finance addendum. It supersedes the DEC-07 financial TBDs above only. Existing partner terms/consent hashes remain immutable; real publication/adoption is separate. FIN-03/04/05 implementation evidence follows P22→P23→P24; DEC-08 controls remain gated at P25.
