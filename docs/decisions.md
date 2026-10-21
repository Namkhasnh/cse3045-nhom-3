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
| DEC-03 | Opening form required evidence, rejection/resubmission/withdrawal rules, limits, consent publication/versioning, exact Vietnamese partnership text; [onboarding](onboarding.md) | P07 decision gate, P08–P10, V0.3 | APPROVED October 19; [V0.3 contract](onboarding-v03-contract.md), exact Vietnamese terms and user implementation authorization |
| DEC-04 | Commercial commission value, rate cap, effective timing, partner agreement and authority to edit; [database](data/database.md) §6 | P14 and V0.4 | APPROVED scoped commercial policy October19: negotiated3–5%, cap5%, explicit partner consent; no default. [P14](progress/P14.md) implemented/verified local policy and agreement; production adoption separate |
| DEC-05 | Survey ownership/approval and quote artifact protection/version/expiry; [delivery API](data/api_contract.md) §8.1 | P12, V0.4 | APPROVED October19: owner proposes, sole MFA Admin verifies; DB-backed opaque quotes expire15min; [V0.4 setup](restaurant-setup-v04-contract.md) |
| DEC-06 | QR representation/verification, bank details exposure, permitted proof, late transfer/refund evidence, partial/exceptional refunds and direct refund obligations; [payments](payments-policy.md) | P19 decision gate, P20–P21, V0.6 | APPROVED October20; [exact policy](payments-policy.md), local synthetic scope; implementation acceptance separate |
| DEC-07 | Settlement period/membership/overlap/closure, late adjustments, overcollection, receipt corrections and commercial reports; [finance](data/database.md) §§4.5–6 | P22 decision gate, P23–P24, V0.7 | APPROVED October21, explicit user approval of [complete package](finance-policy-proposal.md); implementation/evidence separate |
| DEC-08 | Suspension effects on active fulfillment, support workflow/escalation/response targets and privacy/retention/deletion obligations; [security](account-security.md) | P25; dependent V0.7 actions | APPROVED October21: [package DEC-08.2026-10-21.v1](account-support-policy-proposal.md), explicit user authorization for synthetic P25 implementation only; acceptance separate |
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

## DEC-03 and scoped commercial approvals — October 19, 2026

Deciding person: repository operator/user, explicit policy answers and implementation request. [V0.3 contract](onboarding-v03-contract.md) owns approved limits, exact Vietnamese terms/hash, consent/manual workflow and evidence retention. Alternatives rejected: evidence-free submission, withdrawal, ownership reassignment and production storage selection. MinIO local synthetic acceptance only; no production provider/cost commitment. Additive migrations preserve every retained identity/history; no real consent is backfilled.

DEC-04 approved commercial range3–5%, cap5%, per-partner explicit consent before sale and new-order-only changes. DEC-06 approved full direct refund within24h when obligation and verified receipt exist; no partial refunds. DEC-07 approved monthly statements by3rd/payment by7th Vietnam time, next-period append-only corrections, signed balances and no overcollection. Anti-evasion recovery requires verified evidence/appeal and a separate receivable design; completed-only adjustments cannot apply to terminal rejected/cancelled orders. At the October19 checkpoint these scoped approvals left DEC-06/07 operational DTOs, proof/corrections and DEC-08 suspension/disputes BLOCKED. The October20 DEC-06 decision below supersedes its QR/payment-proof/scoped-dispute blocker only. DEC-10 permits local private MinIO only; production remains BLOCKED.

## DEC-05 and P13 media approval — October 19, 2026

Deciding person: repository operator/user, explicit planning answers and full implementation authorization. [V0.4 setup contract](restaurant-setup-v04-contract.md) records survey approval, old-approved-version continuity, location invalidation, random quote/hash storage and15minute expiry. Alternatives rejected: Admin-only entry, nonexpiring or HMAC quotes. Public business locations only, no recipient/contact quote storage. Additive migrations preserve old rows without marking them verified; actual survey values are never invented. No external routing provider/cost.

P13 permits local MinIO dish-media storage separate from private onboarding evidence, JPEG/PNG5MiB/4096×4096/16million pixels, decode/reencode without metadata; Admin-created shared categories. WebP and production-provider selection deferred. DEC-10 production services remain BLOCKED. DEC-04 change timing refined: old agreed rate stays effective until current owner confirms the new specific version/text; future orders only. No default rate or fabricated partner consent.

## DEC-06 approved — October 20, 2026

Deciding person: repository operator/user, explicit choices and full states/guards/DTO/notices approval in this conversation, followed by implementation authorization. [Payment policy](payments-policy.md) records the concrete contract and alternatives: verified static QR; immutable order instructions; mandatory protected image evidence90days after resolution with dispute hold; full per-transfer refunds within24h including wrong/duplicate/late receipts; no partial/exceptional cash refunds; scoped payment disputes without Admin receipt powers. No external bank/provider charges, production service selection or retained migration authorized. Additive storage only; preserve cash/unknown legacy facts. Actual implementation and verification recorded separately in P19–P21; no real transactions or independent review claimed.

## DEC-07 approved — October 21, 2026

Deciding person: repository operator/user. Explicit answer: “Duyệt toàn bộ gói DEC-07, triển khai P23–P24”. [Package DEC-07.2026-10-21.v1](finance-policy-proposal.md) records concrete monthly membership/finalization, later adjustments, full receipt reversals/replacements, credit/no-overcollection, evidence/access, reports/recovery, Vietnamese addendum, alternatives and compatibility. No new provider/cost, rate, real consent or retained migration. DEC-08/P25 and production publication/retention gates remain separate. P22 acceptance and P23/P24 implementation evidence are recorded separately.

## DEC-08 approved — October 21, 2026

Deciding person: repository operator/user. Explicit answer: “Duyệt toàn bộ gói DEC-08.2026-10-21.v1, triển khai P25 trong phạm vi dữ liệu thử nghiệm.” The [complete package](account-support-policy-proposal.md) records restricted obligations access, six support states, elapsed response/update targets, escalation, personal-payload separation/retention/holds, bounded redacted audit and alternatives/cost/compatibility. Synthetic implementation only; no retained-data adoption, new Admin, delegated fulfillment/payment, production staffing/services, legal compliance conclusion or publication. Evidence and P25 acceptance follow separately.
