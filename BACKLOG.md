# Commercial Delivery Backlog

[Roadmap](docs/roadmap.md) is the canonical source for version order, dependencies, acceptance and release. This checklist mirrors its P01–P36 chain; [copyable prompts](docs/prompts/README.md) contain full instructions. [Current implementation/evidence](docs/implementation-status.md) records source and legacy gaps.

No checkbox below is accepted by the documentation rewrite. Some reusable code exists; reuse it after checking the revised contract. Check off only with accepted behavior, decisions and actual verification evidence. Missing policy = BLOCKED with decision ID; missing tool = NOT CONFIGURED; an available unexecuted check = NOT RUN.

Use [short requests](docs/prompts/quick-start.md) to execute/resume work and [progress records](docs/progress/README.md) for evidence. The workflow convention alone accepts no prompt; completed gates below link actual acceptance evidence.

## Ordered acceptance checklist

- [x] **V0.1 / [P01](docs/prompts/v0.1.md#p01) — Identity data transition.** [Accepted](docs/progress/P01.md), October 19: preserved-data migration, explicit mapping, unique ownership/singleton and expansion-window compatibility.
- [x] **V0.1 / [P02](docs/prompts/v0.1.md#p02) — Ordinary signup, login and email.** [Accepted after P01](docs/progress/P02.md): ordinary identity, SMTP/browser expiry/resend/logout, safe return and auth/profile OpenAPI.
- [x] **V0.1 / [P03](docs/prompts/v0.1.md#p03) — Sole Admin MFA and recovery.** [Accepted after P02](docs/progress/P03.md): 18 CLI cases, MySQL MFA/recovery races, restricted runtime/provision and approved local config. [V0.1 acceptance](docs/progress/V0.1.md), Codex self-review.
- [ ] **V0.2 / [P04](docs/prompts/v0.2.md#p04) — Public catalog API.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.2 / [P05](docs/prompts/v0.2.md#p05) — Homepage, restaurant page and header.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.2 / [P06](docs/prompts/v0.2.md#p06) — Guest cart and login return.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.3 / [P07](docs/prompts/v0.3.md#p07) — Approve onboarding policy and contract.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.3 / [P08](docs/prompts/v0.3.md#p08) — Applicant experience.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.3 / [P09](docs/prompts/v0.3.md#p09) — Atomic review and restaurant creation.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.3 / [P10](docs/prompts/v0.3.md#p10) — Manual partner creation and legacy compatibility.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.4 / [P11](docs/prompts/v0.4.md#p11) — Restaurant profile, hours and readiness.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.4 / [P12](docs/prompts/v0.4.md#p12) — VJU points, surveys and delivery quotes.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.4 / [P13](docs/prompts/v0.4.md#p13) — Dish CRUD and images.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.4 / [P14](docs/prompts/v0.4.md#p14) — Commission configuration and exact money.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.5 / [P15](docs/prompts/v0.5.md#p15) — Order backend, snapshots and idempotency.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.5 / [P16](docs/prompts/v0.5.md#p16) — Checkout and uncertain-result recovery.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.5 / [P17](docs/prompts/v0.5.md#p17) — Fulfillment and cash confirmation.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.5 / [P18](docs/prompts/v0.5.md#p18) — Tracking, history and concurrency acceptance.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.6 / [P19](docs/prompts/v0.6.md#p19) — Approve QR and refund policy.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.6 / [P20](docs/prompts/v0.6.md#p20) — Payment configuration and lifecycle backend.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.6 / [P21](docs/prompts/v0.6.md#p21) — QR, confirmation and refund interface.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.7 / [P22](docs/prompts/v0.7.md#p22) — Approve reconciliation policy.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.7 / [P23](docs/prompts/v0.7.md#p23) — Commission ledger, settlements and receipts.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.7 / [P24](docs/prompts/v0.7.md#p24) — Reconciliation UI and reports.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.7 / [P25](docs/prompts/v0.7.md#p25) — Users, partners, support and audit lookup.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.8 / [P26](docs/prompts/v0.8.md#p26) — Approve AI provider, privacy and budget.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.8 / [P27](docs/prompts/v0.8.md#p27) — Grounded recommendation backend.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.8 / [P28](docs/prompts/v0.8.md#p28) — Recommendation UI and failure acceptance.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.9 / [P29](docs/prompts/v0.9.md#p29) — Approve infrastructure and services.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.9 / [P30](docs/prompts/v0.9.md#p30) — CI/CD, forward migration and restore.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.9 / [P31](docs/prompts/v0.9.md#p31) — Whole-system acceptance.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.9 / [P32](docs/prompts/v0.9.md#p32) — VJU partner pilot.** Record acceptance/evidence under roadmap rules.
- [ ] **V0.9 / [P33](docs/prompts/v0.9.md#p33) — Pilot fixes and acceptance.** Record acceptance/evidence under roadmap rules.
- [ ] **V1.0 / [P34](docs/prompts/v1.0.md#p34) — Product, policy and operations launch review.** Record acceptance/evidence under roadmap rules.
- [ ] **V1.0 / [P35](docs/prompts/v1.0.md#p35) — Approved controlled production release.** Record acceptance/evidence under roadmap rules.
- [ ] **V1.0 / [P36](docs/prompts/v1.0.md#p36) — Post-release checks and incident drill.** Record acceptance/evidence under roadmap rules.

## Scope and release discipline

P01–P03 replace the former role-request/multi-owner design; old completed-foundation checkboxes are not new identity acceptance. P07/P19/P22/P26/P29/P34 are policy/operational gates and must obtain the missing decisions before dependent actions. P32 real pilot traffic and P35 production release require explicit authorization for the concrete plan/candidate.

V1.0 includes direct QR/refunds, finance reports, support/audit lookup and history/recovery. V1.1 holds reorder/favorites/reviews/random; V1.2 holds free addresses/route fees and regional expansion. Drivers/custody/splitting, multiple restaurants per manager and additional Admins remain excluded. See [decisions](docs/decisions.md) and [launch checklist](docs/release-checklist.md).
