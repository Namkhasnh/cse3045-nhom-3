# Decision Register

This is the canonical register of unresolved product and operational decisions. Owning specifications define invariants; the entries below identify what still needs an explicit owner decision. No values, provider contracts, fees or legal terms are invented here. Technical documents and prompts are in English; the final user-facing policy text is Vietnamese.

## Decided baseline — October 18, 2026

Public homepage/list/menu; ordinary-user signup without role choice; manager capability from current ownership, at most one restaurant per account; one operator-owned Admin with MFA/recovery; atomic application approval and manual create-with-owner; VJU fixed surveyed points; cash and direct restaurant QR; restaurant delivery; manual commission reconciliation; MySQL 9.2.0, React/Vite, NestJS/Prisma and approved identity remain fixed.

No driver, custody/splitting, multi-restaurant order, additional Admin, multiple restaurants per manager or AI transcript storage is authorized. V1.1 retention features and V1.2 route expansion are later scope.

## Open decisions and blocking versions

| ID | Required decision / owning contract | Blocked work / prompt | Status |
| --- | --- | --- | --- |
| DEC-01 | Explicit primary Admin ID, disposition of every legacy privileged account and conflicting ownership; [migration](data/migration-plan.md) | P01 constrain/cutover and V0.1 | APPROVED mapping October 19; new `operator_admin`, IDs 3/6 ordinary, ownership 2→1 preserved, ID 5 ordinary; one new authority/enrolled factor observed by read-only October 19 verification; numeric ID kept in protected operator records |
| DEC-02 | MFA mechanism/provider if any, enrollment/recovery verification, secure factor storage, recovery custody and availability; [security](account-security.md) | P03 privileged activation; V0.1 | APPROVED October 19: local TOTP + single-use recovery; local enrolled authority observed October 19; custody is not inferred from DB state |
| DEC-03 | Opening form required evidence, rejection/resubmission/withdrawal rules, limits, consent publication/versioning, exact Vietnamese partnership text; [onboarding](onboarding.md) | P07 decision gate, P08–P10, V0.3 | BLOCKED |
| DEC-04 | Commercial commission value, rate cap, effective timing, partner agreement and authority to edit; [database](data/database.md) §6 | P14 and V0.4 | BLOCKED; no default 10% or implied 100% cap |
| DEC-05 | Survey ownership/approval and quote artifact protection/version/expiry; [delivery API](data/api_contract.md) §8.1 | P12, V0.4 | BLOCKED; never substitute a fee |
| DEC-06 | QR representation/verification, bank details exposure, permitted proof, late transfer/refund evidence, partial/exceptional refunds and direct refund obligations; [payments](payments-policy.md) | P19 decision gate, P20–P21, V0.6 | BLOCKED |
| DEC-07 | Settlement period/membership/overlap/closure, late adjustments, overcollection, receipt corrections and commercial reports; [finance](data/database.md) §§4.5–6 | P22 decision gate, P23–P24, V0.7 | BLOCKED |
| DEC-08 | Suspension effects on active fulfillment, support workflow/escalation/response targets and privacy/retention/deletion obligations; [security](account-security.md) | P25; dependent V0.7 actions | BLOCKED; no silent operational override |
| DEC-09 | AI budget/quantity/preferences semantics, provider/model, retention/training compatibility, payload/output limits, quotas/concurrency/cost and evaluation acceptance; [AI](ai_integration.md) | P26 decision gate, P27–P28, V0.8 | BLOCKED |
| DEC-10 | Hosting/regions/domain/email/media services, exact Node/npm pins, production credentials/access, health/alerts, budget and owners; [deployment](deployment.md) | P13 media-dependent uploads; P29 decision gate/P30–P33 and V0.9 | BLOCKED; media subdecision may be approved early in P13 |
| DEC-11 | Backup method/location/encryption/retention, RPO/RTO, drill cadence, restore gap reconciliation and incident owner; [deployment](deployment.md) §§9–10 | P30 restore and V0.9/V1.0 | BLOCKED |
| DEC-12 | Exact Vietnamese published privacy/partnership/payment/refund/support notices and partner approval, launch authority/window and rollback thresholds; [release](release-checklist.md) | P34–P35, V1.0 | BLOCKED |
| DEC-13 | Free-address/map provider, route normalization/expiry/tiers and regional operating policy | V1.2 only | DEFERRED |

A decision prompt may research options and prepare a concrete proposal, then must obtain the missing decision before dependent implementation. Missing answers keep that capability BLOCKED; elapsed time or a successful build is not approval. Continue independent work whose prerequisites are met.

## Required decision record

For each approved entry record: ID, decision date, deciding person, concrete value/text/version, rationale, alternatives/tradeoffs, affected versions/prompts/contracts, privacy/cost implications, migration/compatibility impact and evidence/review references. Do not mark DEC-01 settled until every legacy conflict has an explicit preservation plan. Do not place secrets, real bank credentials or recovery codes in the register.

Changing a decision updates requirements and its owning specification, roadmap/prompt prerequisites and relevant tests together. Reopening a required decision reopens the release gate. This register records no claim that the current implementation has adopted these contracts.

## DEC-01/02 approved scoped implementation — October 19, 2026

Deciding person: repository operator/user, through explicit planning answers and implementation authorization. [Cutover handoff](auth-discovery-cutover.md) records the concrete mapping, MFA mechanism, limits, encryption, custody, recovery verification and transaction/compatibility effects. Alternatives rejected: selecting legacy Admin 3/6 and WebAuthn. TOTP uses no external MFA provider or provider charges; factor/recovery data stays backend-only. Preserve all retained IDs, credentials, owner links and histories; new constraints use additive forward migrations. The October 19 read-only DB check confirms one new sole authority, one enrolled factor and the approved legacy cutover. The numeric ID stays in protected operator records; private recovery-code custody is not inferred from DB state. CLI enrollment/recovery was independently exercised only with synthetic actors on isolated MySQL; see [P03 evidence](progress/P03.md). No independent review or production approval is claimed.
