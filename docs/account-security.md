# Accounts, Sole Admin and User Administration

Authority: [requirements](requirements.md) FR01/FR12, US01/US25/US26, AC14/16/17. V0.1 identity/MFA is [accepted](progress/V0.1.md); V0.7 user/support administration remains target design.

## 1. Ordinary identity and management

Public registration accepts username, email, password, display name and optional phone; no role/requested-role/owner/admin fields. A client-supplied privilege field is rejected, never ignored into a privileged grant. Email verification precedes login. A current relationship grants management of one restaurant maximum and coexists with buyer capabilities.

Account authority is ordinary user or singleton Admin; P01 retains the old role enum as compatibility storage and maps cutover identities to student. That enum grants no authority. Management derives from current unique ownership. Target self DTO contains account-safe fields plus `capabilities` and nullable `managed_restaurant_id`; these are computed server-side and never accepted as input or treated as lasting token authority. `/auth/me` is private, not a public account directory.

Preserve API §2 username/password/hash, 15-minute cookie JWT, origin/CSRF, login limits, key rotation and auth-version revocation. Every protected request rechecks current availability/ownership. Existing session claims are not sufficient after migration or reassignment.

## 2. Exactly one Admin

The operator designates the one primary Admin explicitly. Use a singleton authority row with a fixed checked primary key, non-null unique account FK, and no runtime create/delete privilege; that row is the sole source of Admin authority. Do not maintain an independently authoritative `role=admin` flag that can diverge. A redundant classification must be validated/updated atomically. Initialization creates exactly one row; runtime fails closed for Admin operations if singleton configuration is absent/inconsistent. SQL uniqueness provides at-most-one; the initialization/readiness check provides existence.

No registration, profile, user-management, application-review or website API may create/promote another Admin. Initial provisioning and replacement/recovery are protected operator workflows. The adapted signed-manifest CLI has isolated MySQL/PTY evidence in [P03](progress/P03.md); local retained enrollment is separately observed. Runtime/provision separation now has [isolated SQL/CLI/browser evidence and approved local configuration](auth-followup.md#local-operational-configuration--sec-01); production grants remain NOT RUN.

Before any future constrain/cutover migration, inventory privileged accounts and require the operator's selected primary ID and explicit preservation plan for others. Never choose the first/oldest account, delete old accounts, or drop their history. See [migration plan](data/migration-plan.md) and DEC-01.

## 3. MFA and recovery gate

MFA is mandatory for Admin login and privileged operations. DEC-02 was approved October 19, 2026: local TOTP and single-use recovery with operator CLI re-enrollment. The concrete parameters, custody and operator steps are in the [cutover handoff](auth-discovery-cutover.md). Do not activate Admin access with password-only fallback while blocked.

Target flow: password verification issues a restricted short-lived MFA challenge, **not a privileged session**; successful enrolled-factor verification issues an MFA-assured JWT/session. Protect enrollment/reset with operator identity verification and existing factor assurance where available. Store only factor material appropriate to the approved mechanism; encrypt recoverable secrets, hash single-use recovery codes and consume them atomically. Never log/export secrets/codes.

Recovery verifies the operator using the approved out-of-band process, replaces/rebinds access to the same sole authority, revokes old sessions and compromised factors/codes, enrolls a new factor and writes audit. It must not create a second Admin. Rehearse loss/compromise recovery in an isolated environment; record sanitized evidence and custody locations, never actual codes. Named operational backups do not imply additional application Admin accounts.

## 4. User administration and support

Admin list/detail is allowlisted and paginated; expose only necessary identifier/display/availability/management metadata. No passwords, factor material, auth tokens, full order contacts or unbounded account export. No role chooser, privilege promotion or hard-delete button.

Suspension/resumption requires reason, expected version, current MFA Admin and transactional audit; increments auth version. Refuse self-suspension/removal of sole authority through ordinary user controls. Suspension denies new authenticated actions. Handling a suspended buyer/manager's existing orders, support read access and temporary operational coverage is DEC-08: resolve before enabling suspension against active obligations; never silently cancel orders or grant Admin fulfillment/payment power.

Order-linked support checks buyer/current-manager scope; Admin may triage only the approved protected projection. P25 finalizes ticket statuses, allowed transitions, message/file limits, escalation and retention under DEC-08 before implementation. Tickets neither cancel accepted orders nor prove payments/refunds. Audit lookup uses explicit filters, bounded keyset pagination and redacted changes; lookup/access is itself auditable where approved. No arbitrary SQL/export endpoint.

## 5. Target API

| Route | Access / contract |
| --- | --- |
| POST `/auth/register`, login/verify/resend/logout; GET `/auth/me`; PATCH `/profile` | Preserve API §7.1 with role-free signup and computed self capabilities |
| POST `/auth/admin/mfa/verify` | Restricted challenge + approved factor proof; `challenge_id` plus exactly one of `code`/`recovery_code`; approved limits in cutover handoff |
| GET `/admin/users` and `/{id}` | Sole MFA Admin; approved query/projection and safe errors |
| PATCH `/admin/users/{id}/availability` | reason, expected_version, is_active; audit/revoke; no privilege fields |
| POST `/support/requests`; GET `/support/requests` and `/{id}` | Authenticated authorized order participant; finalized P25 contract |
| GET `/admin/support/requests`; PATCH `/admin/support/requests/{id}` | Sole MFA Admin, finalized transitions/version/reason |
| GET `/admin/audit-logs` | Sole MFA Admin, bounded approved filters/redacted projection |

Absent finalized schemas are BLOCKED, not implementer discretion. Admin recovery has no anonymous account-promotion route. Every protected write uses CSRF/Origin; auth challenge endpoints retain exact Origin checks/rate limits under their approved P03 contract.

## 6. Evidence

AUTH-03 now tests ordinary signup/email only (former role-approval assertions are superseded); AUTH-04 buyer+manager capabilities and one-restaurant cap; ADMIN-01 singleton/provisioning/legacy selection; ADMIN-02 MFA/recovery/session revocation; USER-01 scoped suspension/support/audit behavior. Test direct SQL and concurrent workflows on MySQL 9.2.0 plus browser journeys, including replay/nested-resource denial. A UI-hidden role selector is insufficient evidence.
