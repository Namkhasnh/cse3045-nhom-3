# Restaurant Opening Applications and Partnership

Authority: [requirements](requirements.md) US23–24, FR11, AC14–15; delivery: V0.3 P07–P10. This is a target contract, not an existing role-request service. [DEC-03](decisions.md) blocks policy-dependent implementation.

## 1. Identity and eligibility

An active email-verified ordinary user may apply when they manage no restaurant. Ownership includes inactive/setup-required restaurants and is capped at one by DB uniqueness. Management does not replace buyer access. Admin cannot approve a role promotion as a substitute for this workflow.

The application captures proposed restaurant name/address/contact, applicant account reference, approved evidence fields and the accepted partnership version. Exact evidence, limits and publication/resubmission rules must be approved in P07. Account private email/phone must never enter public catalog projections automatically.

## 2. Versioned partnership consent

Publish immutable terms versions with identifier, content hash, Vietnamese text, publication/effective time and retained accessible copy. Store applicant ID, exact accepted version/hash and acceptance instant; do not silently update existing consent when terms change. Reacceptance requirements are DEC-03. Never use a checkbox alone without identifying and showing the terms.

The partnership must specify delivery/payment responsibility, fees and effective commission, direct QR/refund obligations, support/escalation, suspension/termination and data handling. These are required topics, **not approved commercial/legal wording**. Commission values are DEC-04; refund obligations DEC-06; reconciliation DEC-07. Only the approved version may gate an actual submission.

Manual partner creation requires the same approved agreement evidence associated with the selected user; Admin cannot silently consent on their behalf. P07 defines the permitted evidence/confirmation method. Do not invent a signature or accept a missing version.

## 3. Lifecycle and history

Target core review states: `submitted → approved | rejected`; approval/rejection is terminal for that submission. Applicant draft is local until submitted. Rejection requires a visible reason. Resubmission, withdrawal, expiration, duplicate submission limits and treatment of newly published terms remain DEC-03 and must be specified before exposing those controls.

Retain submitted content/consent and append-only review events with actor, timestamp, decision, reason and resulting restaurant ID. Applicant sees only own application/history; sole Admin sees the approved review projection. No public read route exists. Application status is separate from restaurant operating status and account availability.

## 4. Atomic approval

One workflow, one MySQL transaction:

1. Verify sole Admin with MFA; identify affected applicant without trusting request ownership.
2. Lock relevant accounts ascending, request key, singleton authority, application, then restaurant/config groups using [database §10](data/database.md#10-transaction-and-concurrency-recipes). Re-read active verified applicant, submitted status, valid consent and absence of ownership.
3. Create the restaurant and its unique non-null ownership link; initial readiness `setup_required`, accepting false and unavailable for public sale.
4. Record approved decision/result and append review history plus business audit in the same transaction.
5. Commit the durable request result with restaurant ID. Failure leaves no restaurant, link or approved event. Same key/content replays; changed content conflicts. Concurrent approval/manual create cannot create a second restaurant.

An already-approved repeat returns its existing result after current authorization, without duplicate history/audit. A conflicting rejected/approved decision returns 409, never reopens a submission. Public data may be published only after the readiness policy passes.

## 5. Manual creation and reassignment

Admin selects a valid active verified ordinary user, not an Owner-role dropdown. Check zero existing ownership while holding the user's account lock; create restaurant/link/agreement/audit/result atomically, with the same setup-required initial state. No ownerless restaurant is allowed.

A later reassignment must verify both accounts, one-restaurant uniqueness, agreement validity and current authority under ascending locks, revoke old management access immediately and preserve historical actors/orders/audit. Whether to expose reassignment to operations and its consent requirements are finalized by P07/P10; do not invent an ownership-marketplace flow.

## 6. Sell readiness

Approval alone never opens sales. P11–P14 must establish verified public profile, hours in Asia/Ho_Chi_Minh, current owner, active status, visible available menu, verified supported VJU point/fee data and an explicit commission policy/valid agreement. Cash readiness is independent of later QR readiness; V1.0 additionally requires approved QR setup. Missing information keeps `setup_required` and accepting false. Once `ready`, every order still rechecks current active/open/accepting/catalog/delivery/rate conditions.

## 7. Target storage and API handoff

Accounts own identity; onboarding owns `restaurant_applications`, immutable submitted payload/terms acceptance and append-only `application_reviews`; restaurants own restaurant/ownership/readiness. Proposed `partnership_terms_versions` is append-only, keyed by immutable version and content hash. Application PK, applicant FK, status/version/times, accepted terms FK/hash/time, resulting restaurant FK and review actor FKs must be specified with approved field limits in P07/P08 before onboarding SQL.

Target API under `/api/v1`:

| Method/path | Access | Input/result |
| --- | --- | --- |
| GET `/partnership-terms/current` | Public published projection | Current approved Vietnamese terms/version/hash; unavailable if not published |
| POST `/restaurant-applications` | Verified user owning none | Approved form + terms version/hash + explicit consent; durable `Idempotency-Key`; 201 submission, replay 200 |
| GET `/restaurant-applications` and `/{id}` | Self | Paginated own submissions/history only |
| GET `/admin/restaurant-applications` and `/{id}` | Sole MFA Admin | Paginated protected review projection |
| POST `/admin/restaurant-applications/{id}/review` | Sole MFA Admin | expected version, approve/reject, reason for rejection, key; 200 decision/result |
| POST `/admin/restaurants` | Sole MFA Admin | Eligible user + approved partner/agreement fields + key; 201 setup-required restaurant |

Use standard envelopes/scalars/errors. 404 conceals another applicant; 409 `RESTAURANT_LIMIT_REACHED`, `APPLICATION_STATE_CONFLICT`, `TERMS_VERSION_CONFLICT`, `VERSION_CONFLICT` or key reuse; 422 invalid/incomplete consent; 401/403 auth/MFA. P07 finalizes schemas, query limits and canonical hashes before enabling writes. These are target endpoints; current `/admin/role-requests` is legacy and must be retired by P02/P09.

## 8. Acceptance evidence

ONBOARD-01: applicant privacy, valid consent and retained review history. ONBOARD-02: two approvals, approval versus manual create and duplicate/manual requests race on MySQL 9.2.0; one restaurant/link/result and atomic rollback on audit failure. ONBOARD-03: approval shows setup state; no public sale/order until readiness. Browser checks cover buyer-to-applicant-to-manager navigation without losing buyer rights, rejected reasons, conflicts and 360 px keyboard use.
