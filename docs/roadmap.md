# Commercial Roadmap to V1.0

> October25 COD cutover: [approved operating/API/history contract](cod-ordering.md) supersedes new-order cash/QR selection, QR authoring/review and platform voucher issuance/redemption. Legacy payment/refund and accepted voucher subsidy obligations remain. Prior verification is historical.

Canonical version/dependency/completion/release source, revised October 18, 2026. [Requirements](requirements.md) own behavior; [decision register](decisions.md) owns unresolved choices; [implementation status](implementation-status.md) distinguishes source and evidence. No version is certified complete by this documentation change.

## Execution rules

Run P01–P36 in order using the full [copyable prompts](prompts/README.md). Each prompt requires the previous prompt's accepted handoff plus named feature/decision dependencies. Independent preparation may continue, but later dependent implementation must not start before gates pass. No missing answer means approval. Record BLOCKED dependencies and continue unrelated authorized work.

P01 may implement an additive compatibility slice while primary Admin/ownership decisions remain open, but cannot constrain/cut over or be accepted until DEC-01 is settled. P11 defines readiness before P12–P14 provide all configuration; sales remain disabled until those checks actually pass.

A version closes only after behavior, required decisions, current source/API/schema/UI alignment, meaningful tests and accepted evidence are complete. Code written, prompts executed or old-model green tests are insufficient. **V0.1 is ACCEPTED**, October 19, 2026, under the [recorded criterion-by-criterion Codex self-review](progress/V0.1.md). Later versions are TARGET / NOT ACCEPTED; policy-dependent portions are BLOCKED as listed. No commercial release is authorized here.

## Versions and exit gates

| Version | Required result / acceptance gate | Prompt chain | Dependencies |
| --- | --- | --- | --- |
| V0.1 — Accounts and new permissions (**ACCEPTED**, Oct 19) | Shared buyer/manager identity, unique ownership, exactly one explicitly chosen Admin; MFA/recovery and forward migration proven. | P01–P03 | Inspected source + DEC-01/02; decision gates below |
| V0.2 — Public discovery | Real anonymous homepage/catalog/menu; guest cart survives login without automatic submission; privacy/mobile evidence. | P04–P06 | Accepted P03 and prior version; decision gates below |
| V0.3 — Restaurant opening applications | Approved terms/form, protected applications/history, atomic approval/manual create and one-restaurant races; setup-required initial state. | P07–P10 | Accepted P06 and prior version; decision gates below |
| V0.4 — Restaurants ready to sell | Profile/hours/menu/images, verified VJU pair quotes, explicit commission and exact arithmetic; readiness enforced. | P11–P14 | Accepted P10 and prior version; decision gates below |
| V0.5 — Ordering | COD order/snapshots/retries and history/tracking for new orders; independent cash receipts remain legacy-only. MySQL race/rollback/browser recovery evidence. | P15–P18 | Accepted P14 and prior version; decision gates below |
| V0.6 — Legacy QR obligations | Retain existing verified instructions/receipt/refund lifecycle and independent facts; no new QR authoring/orders. Historic race/browser evidence remains dated. | P19–P21 | Accepted P18 and prior version; decision gates below |
| V0.7 — Administration and reconciliation | Approved manual finance/corrections, authoritative reports, user/support/audit scope and retained history. | P22–P25 | Accepted P21 and prior version; decision gates below |
| V0.8 — AI recommendations | Approved AI semantics/provider/privacy/limits; real candidate grounding, cost/latency evaluation and manual fallback. | P26–P28 | Accepted P25 and prior version; decision gates below |
| V0.9 — Operational pilot | Selected services, staging CI/migration/restore, full quality evidence, approved real VJU pilot and blocking-defect closure. | P29–P33 | Accepted P28 and prior version; decision gates below |
| V1.0 — Commercial release | Accepted launch dossier, explicit release approval, controlled deployment and post-release/incident/operations evidence. | P34–P36 | Accepted P33 and prior version; decision gates below |

## Ordered work and explicit decision gates

| Prompt | Deliverable | Required dependency / decision |
| --- | --- | --- |
| [P01](prompts/v0.1.md#p01) | Identity data transition | Initial source inventory; DEC-01; DEC-02 before factor schema |
| [P02](prompts/v0.1.md#p02) | Ordinary signup, login and email | Accepted P01; P01 target identity mapping; SMTP configuration before real delivery |
| [P03](prompts/v0.1.md#p03) | Sole Admin MFA and recovery | Accepted P02; DEC-01/02: prepare concrete options and obtain decision before factor implementation |
| [P04](prompts/v0.2.md#p04) | Public catalog API | Accepted P03; No new policy; P01–P03 acceptance |
| [P05](prompts/v0.2.md#p05) | Homepage, restaurant page and header | Accepted P04; P04 enabled public contract |
| [P06](prompts/v0.2.md#p06) | Guest cart and login return | Accepted P05; P05 public UI; checkout action may stay unavailable until P15/P16 |
| [P07](prompts/v0.3.md#p07) | Approve onboarding policy and contract | Accepted P06; DEC-03; DEC-04/06/07 for dependent commercial text: present options, obtain and record decisions |
| [P08](prompts/v0.3.md#p08) | Applicant experience | Accepted P07; P07 accepted DEC-03 and finalized contracts |
| [P09](prompts/v0.3.md#p09) | Atomic review and restaurant creation | Accepted P08; P07 policy and P08 applicant contracts; P03 MFA accepted |
| [P10](prompts/v0.3.md#p10) | Manual partner creation and legacy compatibility | Accepted P09; DEC-01 mapping and P07 manual agreement/reassignment decisions |
| [P11](prompts/v0.4.md#p11) | Restaurant profile, hours and readiness | Accepted P10; P10 accepted; P12–P14 complete readiness dependencies before enabling selling |
| [P12](prompts/v0.4.md#p12) | VJU points, surveys and delivery quotes | Accepted P11; DEC-05 approved before dependent quote implementation |
| [P13](prompts/v0.4.md#p13) | Dish CRUD and images | Accepted P12; P11/P12; approved media service/limits before upload implementation |
| [P14](prompts/v0.4.md#p14) | Commission configuration and exact money | Accepted P13; DEC-04 explicit approval; no implementation of an invented business cap |
| [P15](prompts/v0.5.md#p15) | Order backend, snapshots and idempotency | Accepted P14; P11–P14 all accepted and actual partner readiness prerequisites met |
| [P16](prompts/v0.5.md#p16) | Checkout and uncertain-result recovery | Accepted P15; P15 backend accepted; P06 guest continuity |
| [P17](prompts/v0.5.md#p17) | Fulfillment and cash confirmation | Accepted P16; P15/P16; no post-accept cancellation policy invented |
| [P18](prompts/v0.5.md#p18) | Tracking, history and concurrency acceptance | Accepted P17; P17 accepted; V0.5 closes only with durable race/recovery evidence |
| [P19](prompts/v0.6.md#p19) | Approve QR and refund policy | Accepted P18; DEC-06: prepare concrete reviewable options and obtain operator decision |
| [P20](prompts/v0.6.md#p20) | Payment configuration and lifecycle backend | Accepted P19; P19 approved contract and P18 acceptance |
| [P21](prompts/v0.6.md#p21) | QR, confirmation and refund interface | Accepted P20; P20 backend and approved Vietnamese DEC-06 notices |
| [P22](prompts/v0.7.md#p22) | Approve reconciliation policy | Accepted P21; DEC-07: obtain explicit approval before dependent financial implementation |
| [P23](prompts/v0.7.md#p23) | Commission ledger, settlements and receipts | Accepted P22; P22 DEC-07 approval and P18 base invariants |
| [P24](prompts/v0.7.md#p24) | Reconciliation UI and reports | Accepted P23; P23 accepted approved report schemas |
| [P25](prompts/v0.7.md#p25) | Users, partners, support and audit lookup | Accepted P24; DEC-08 approved before dependent controls; P24 finance and P10 partner contracts |
| [P26](prompts/v0.8.md#p26) | Approve AI provider, privacy and budget | Accepted P25; DEC-09: obtain missing choices before dependent adapter calls/implementation |
| [P27](prompts/v0.8.md#p27) | Grounded recommendation backend | Accepted P26; P26 approved provider/privacy/semantics/limits; P25 current access contracts |
| [P28](prompts/v0.8.md#p28) | Recommendation UI and failure acceptance | Accepted P27; P27 backend and live evaluation prerequisites |
| [P29](prompts/v0.9.md#p29) | Approve infrastructure and services | Accepted P28; DEC-10/11: obtain explicit infrastructure/recovery decisions |
| [P30](prompts/v0.9.md#p30) | CI/CD, forward migration and restore | Accepted P29; P29 approved infrastructure/backup decisions; production deployment remains separately approved |
| [P31](prompts/v0.9.md#p31) | Whole-system acceptance | Accepted P30; P30 recoverable staging and all feature acceptance; unresolved decisions block affected cases |
| [P32](prompts/v0.9.md#p32) | VJU partner pilot | Accepted P31; P31 quality evidence and explicit pilot authorization for actual traffic/funds |
| [P33](prompts/v0.9.md#p33) | Pilot fixes and acceptance | Accepted P32; P32 pilot completed; P34 cannot close while any mandatory gate fails |
| [P34](prompts/v1.0.md#p34) | Product, policy and operations launch review | Accepted P33; P33 acceptance and DEC-12 actual policies/launch criteria; P35 requires explicit approval |
| [P35](prompts/v1.0.md#p35) | Approved controlled production release | Accepted P34; P34 accepted dossier AND explicit operator release approval; elapsed time or prompt execution is not approval |
| [P36](prompts/v1.0.md#p36) | Post-release checks and incident drill | Accepted P35; P35 actual controlled release; approved post-release window/ownership and drill parameters |

## Acceptance record per prompt/version

Use [progress/Pxx.md handoffs](progress/README.md) for prompts actually worked on; do not pre-create empty records. Short-request execution follows [contributor workflow](contributor-workflow.md). These records preserve evidence and do not bypass required review, decisions or release authorization.

Record prompt/version, exact commit/dirty-worktree scope, approved decision versions, implemented behavior, migration compatibility, test case IDs and exact commands/environments/results, sanitized artifacts, residual defects and named reviewer/date. Use **IMPLEMENTED** only for inspected source; **TARGET** for design; **NOT CONFIGURED** for absent tooling; **NOT RUN** for an available check not executed; **BLOCKED** with the owning decision. A passing mock is never a passing MySQL/browser check.

V0.9 and V1.0 require MySQL 9.2.0 empty/upgrade/constraint/race tests, real browser critical journeys, 360 px/mobile/accessibility, verified singleton MFA recovery, actual partner/survey/payment agreement data, COD ordering, legacy QR/refund preservation and manual finance evidence, measured NFRs, daily backup and isolated restore, support/incident ownership. Use [release checklist](release-checklist.md). P35 requires explicit approval of the concrete candidate; P36 verifies actual post-release operation. Documentation-only completion does not complete V1.0.

## After V1.0

- V1.1: reorder, favorites, completed-order reviews and ordinary random dish selection. Finalize each API/data/privacy contract before exposing controls; old orders remain immutable.
- V1.2: expand areas, free addresses/map pins and route-distance fees, with provider/expiry/normalization decisions and failure tests.
- Still excluded: drivers/dispatch, custody/automatic splitting or collection, multiple restaurants per manager and additional website Admins. A future scope change requires explicit requirements approval.
