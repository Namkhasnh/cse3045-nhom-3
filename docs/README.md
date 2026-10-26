# Documentation Map

Commercial V1.0 design revised October 18, 2026. Start with [requirements](requirements.md), [roadmap](roadmap.md), [implementation status](implementation-status.md) and [AGENTS.md](../AGENTS.md). This documentation change does not implement or release the product.

## Reading order and authority

1. [Requirements](requirements.md): scope, identity/capabilities, stable US/FR/BR/NFR/AC and superseded rules.
2. [Roadmap](roadmap.md): versions, dependencies, completion and release gates; [backlog](../BACKLOG.md) mirrors acceptance; [P01–P36](prompts/README.md) supply full prompts.
3. [Decisions](decisions.md): missing choices and blocked versions/prompts; no undocumented default policy.
4. [Architecture](architecture.md) and [target structure](code_structure.md): ownership, dependencies, transactions and placement.
5. [Database](data/database.md), [migration plan](data/migration-plan.md) and [API](data/api_contract.md): persistence, forward compatibility, exact scalars, permissions, errors and retries.
6. [UI](ui/ui_convertion.md), [AI](ai_integration.md), [development](development_guide.md), [testing](testing.md), [deployment](deployment.md): domain implementation and evidence.

Requirements govern behavior; architecture boundaries, database storage and API wire contracts own their respective domains. UI/AI refine within them; roadmap owns sequencing. Source/manifests/lockfiles/CI establish what exists, never authority to override the design. Correct downstream conflicts at the owning specification first.

Current ordering/payment policy: [COD and owner-only vouchers](cod-ordering.md); [implementation evidence](cod-verification.md); [retained-local COD startup repair](local-cod-runtime-repair.md). Earlier QR/voucher evidence remains historical.

## Feature and operational contracts

| Question | Read |
| --- | --- |
| Can visitors browse? Can a manager buy? How many restaurants/Admins? | Requirements §§2–4/7; [account security](account-security.md); API §§2/7 |
| How do opening applications, terms and approval/manual creation work? | [Onboarding](onboarding.md), [V0.3 contract](onboarding-v03-contract.md), [local verification](onboarding-local-verification.md), database §4.1 and migration plan |
| What closes compatibility, login return, expired-email and DB-grant gaps? | [Scoped follow-up](auth-followup.md) |
| How do I perform the approved auth/discovery cutover? | [Operator handoff](auth-discovery-cutover.md) |
| Which legacy identities/data need compatibility work? | [Migration plan](data/migration-plan.md), implementation status, DEC-01 |
| How are legacy cash/QR receipts and refunds handled after COD cutover? | [Approved payment policy](payments-policy.md), [V0.6 acceptance](progress/V0.6.md), [isolated reproduction](payments-local-verification.md), API §9/database §4.4 |
| How do I enable ordering with existing local data? | [Retained local ordering and key custody](local-ordering-adoption.md) |
| How do I verify cash checkout/fulfillment/history safely? | [V0.5 acceptance](progress/V0.5.md), [isolated commands and adoption boundary](cash-ordering-local-verification.md) |
| What about totals/snapshots/keys/locks/settlements? | Database §§4–11; API §§3–10; architecture §§5–7 |
| How do finance statements, corrections, signed credit and reports work? | [Approved DEC-07](finance-policy-proposal.md), [isolated verification/adoption boundary](finance-local-verification.md), [P22](progress/P22.md)→[P23](progress/P23.md)→[P24](progress/P24.md); DEC-08/P25 remains separate |
| How do P25 account/support/privacy/audit controls work? | [Approved DEC-08](account-support-policy-proposal.md), [P25 contract](account-support-v07-contract.md), [verification](account-support-local-verification.md) and [evidence](progress/P25.md); synthetic scope only |
| Why does the local homepage now show sample dishes? | [Local demo adoption and recovery](local-demo-adoption.md) |
| How were local sample accounts/catalog/points removed from active use? | [Local demo cleanup and recovery](local-demo-cleanup.md); history retained, real selling setup still required |
| How is sell readiness configured? | [V0.4 setup contract](restaurant-setup-v04-contract.md), [local verification](setup-local-verification.md) |
| How does the redesigned owner VJU delivery page work? | [Delivery dashboard, drafts and verification](ui/owner-delivery-figma.md) |
| How do restaurant cover/avatar, crop selection and the detail page work? | [Approved Figma storefront and interfaces](ui/restaurant-detail-figma.md), [verification](ui/restaurant-detail-verification.md), [cover/avatar and crop editor](ui/restaurant-images.md) |
| What governs checkout, vouchers and subsidy reconciliation? | [Approved checkout/voucher contract](checkout-vouchers.md), [implementation/verification](ui/checkout-verification.md) |
| How does the redesigned cart handle real fees, undo and checkout handoff? | [Cart design and verification](ui/cart-figma.md), [transient action feedback](ui/action-feedback.md) |
| How do purchase history, reorder and grouped multi-order checkout work? | [Approved purchase extension](ui/purchase-history-figma.md) |
| How does the redesigned buyer order details page work? | [Buyer order design and verification](ui/buyer-order-figma.md) |
| How do owner orders, food-ready privacy and shared reconciliation codes work? | [Order dashboard and verification](ui/owner-orders-figma.md) |
| How does the redesigned owner menu work? | [Menu design, interactions and verification](ui/owner-menu-figma.md) |
| How do the owner dashboard and four settings tabs work? | [Owner Figma implementation](ui/owner-dashboard-figma.md) and [backend analytics](ui/owner-analytics.md) |
| How are personal, restaurant management and Admin workspaces separated? | [Approved account/owner workspaces and verification](ui/workspaces-figma.md) |
| How does the standalone notification center behave? | [Approved notification redesign](ui/notifications-figma.md), [API/persistence contract](notifications-contract.md), [verification](notifications-verification.md) |
| How does Login match Figma, including the food steam and real authentication? | [Login design and verification](ui/login-figma.md) |
| How should screens look and behave? | UI §§1–13, [design coordination](ui/design-skills.md), [original HTML](ui/Hoa%20Lac%20Food%20Ordering%20Platform.html) |
| How are the scoped UI/UX defect fixes reproduced? | [UI/UX fix verification](uiux-fixes-local-verification.md) |
| What is implemented or tested? | [Implementation/evidence](implementation-status.md), [historical fixture report](ui/student-discovery-verification.md), [legacy verification archive](history/legacy-verification.md), [documentation checks](documentation-verification.md) |
| How is the authorized Mac DB copy prepared for a new VPS Docker server? | [Encrypted copy handoff](mac-to-vps-database-copy.md); remote import remains separate from complete deployment |
| How is the October24 academic MVP demo deployed? | [Demo deployment/rollback](demo-deployment.md); actual remote proof is recorded separately |
| Why did the local owner dashboard/orders return500 after the order redesign? | [Order-code schema adoption and full regression](local-runtime-order-code-repair.md) |
| Why did local login/catalog return502 after checkout changes? | [Checkout schema adoption and runtime repair](local-checkout-runtime-repair.md) |
| How is current local code/COD schema deployed while keeping VPS data? | [October25 code-only update](demo-cod-update.md) |
| Is Gemini enabled on the demo VPS, and why can suggestions still time out? | [October26 activation and provider latency evidence](demo-ai-activation.md) |
| How are retained local/SSH forks merged without replacing SSH data? | [Demo database merge and recovery](demo-database-merge.md); private manifests and exact-clone rehearsal |
| How do we launch/recover/respond to incidents? | [Release checklist](release-checklist.md), deployment §§5–13, testing §§11–13 |

New focused documents above are owned by their linked parent specification; do not create competing policy copies. [V0.2 OpenAPI](data/openapi.yaml) covers auth/profile and five public catalog operations with schema/example/HTTP/MySQL checks; [V0.3 onboarding schemas](data/onboarding.openapi.json) and enabled routes extend it with private applications/evidence/review/manual consent. The retained `ui_convertion.md` filename and original packaged HTML are intentional.

## Implementation status

The October 19 scoped implementation recovers migration history, expands the retained MySQL 9.2.0 schema without changing original rows, replaces role-request auth with capabilities/MFA source and connects public homepage/menu APIs. A read-only October 19 check confirms one enrolled local Admin and the approved legacy cutover; the retained restaurant remains setup-required and public discovery is empty. [Implementation status](implementation-status.md) separates actual source, automated/browser evidence, local schema expansion and remaining acceptance gaps. See the [cutover handoff](auth-discovery-cutover.md). **V0.1 is accepted** by the [October 19 criterion-by-criterion self-review](progress/V0.1.md), including CLI/SMTP/MySQL/browser and API-contract evidence. **V0.2 is also accepted** by the [P04→P05→P06 self-review](progress/V0.2.md), with public catalog contracts, five-width connected UI and persistent guest cart/login/price consent evidence. [V0.5](progress/V0.5.md) now accepts cash checkout/fulfillment/history for isolated local synthetic scope; retained adoption remains a separate gate. [V0.3](progress/V0.3.md) is accepted for local synthetic onboarding/approval/manual-create scope only; retained/production adoption remains unaccepted. [V0.4](progress/V0.4.md) is accepted for local synthetic restaurant configuration/readiness after P11–P14. [V0.5/P15–P18](progress/V0.5.md) is accepted for isolated synthetic cash ordering; later versions and commercial release remain unaccepted.

## Repository skills

Instruction validation: [workflow verification](agent-workflow-verification.md). For short requests, see [quick start](prompts/quick-start.md), [contributor workflow](contributor-workflow.md) and [resumable progress](progress/README.md). You may say “Run P04” or ask for a scoped fix without pasting project context.

Reusable workflows are in [repository skills](../.agents/skills/). Skills follow this map, roadmap decisions and AGENTS.md; they do not add permissions or silently settle TBDs. Technical instructions/metadata are English; user-facing reports default to Vietnamese.

| Skill | Use |
| --- | --- |
| [run-roadmap](../.agents/skills/run-roadmap/SKILL.md) | Resolve Pxx/version/continue requests, check gates and leave a resumable handoff |
| [implement-feature](../.agents/skills/implement-feature/SKILL.md) | Scoped business capability through its necessary layers |
| [build-component](../.agents/skills/build-component/SKILL.md) | React UI/layout/state work within approved identity |
| [frontend-design](../.agents/skills/frontend-design/SKILL.md) | Substantial aesthetic direction/critique; advisory under UI approval rules |
| [ui-ux-pro-max](../.agents/skills/ui-ux-pro-max/SKILL.md) | Focused local UX/accessibility/stack evidence |
| [fix-tests](../.agents/skills/fix-tests/SKILL.md) | Contract-backed diagnosis and test repair |
| [review-change](../.agents/skills/review-change/SKILL.md) | Read-only concrete bug/regression review |
| [explain-code](../.agents/skills/explain-code/SKILL.md) | Read-only Vietnamese explanation of actual code versus target |

Examples: `$run-roadmap Run P04`; `$run-roadmap Complete V0.2`; `$implement-feature Add public menu search`; `$build-component Fix the 360 px header`; `$review-change Review the current diff without editing`; `$explain-code Explain current login`. Ordinary scoped work does not require replaying earlier roadmap prompts. The roadmap helper resolves full text only, never acceptance or authorization.

## Maintaining documentation

- Keep one owning contract per rule. Update requirements first for behavior changes, then affected API/data/UI/AI, tests, roadmap/prompts and contributor/skill references together.
- Preserve stable requirement/test IDs; mark replaced semantics explicitly. Old verification remains historical with its actual environment/version and design boundary.
- Write technical docs/prompts in English, product copy in Vietnamese. Preserve original reference HTML and historical test artifacts.
- Every Markdown document must remain **under 500 lines**. Split by responsibility and link from its parent; no competing aliases for canonical filenames.
- Validate local links/anchors, section references, paths in prompts, actual script names, P01–P36 coverage/dependencies and legacy-rule removal. Documentation-only work needs no application tests.
- Inspect actual source/working tree before stating implementation status; preserve user work and report external changes accurately. Never put real secrets/environment values/private account/bank/recovery data in docs.
- Report TARGET, IMPLEMENTED, NOT CONFIGURED, NOT RUN and BLOCKED distinctly. Missing required evidence prevents claiming release readiness; documentation completion is not V1.0 acceptance.

V0.6: [V0.6 payment policy](payments-policy.md) and [P19 decision](progress/P19.md); implementation acceptance remains separate.

[V0.6](progress/V0.6.md) is ACCEPTED for local synthetic QR/full direct refunds after [P19](progress/P19.md)→[P20](progress/P20.md)→[P21](progress/P21.md). Retained V0.5/V0.6 adoption and commercial release remain separate and unauthorized.

Onboarding notifications: [contract](notifications-contract.md) and [verification](notifications-verification.md) own in-site inbox, current setup guidance, Admin tasks and their scoped evidence.

V0.8: [approved DEC-09](ai-v08-contract.md), [verification/setup](ai-local-verification.md), [P26](progress/P26.md) → [P27](progress/P27.md) → [P28](progress/P28.md), [current acceptance](progress/V0.8.md). Local synthetic P27/P28 acceptance combines deterministic backend/Chrome evidence and the recorded100case actual Gemini rubric; retained adoption remains separate.

[AI local adoption review/receipt](ai-local-adoption-review.md) records explicit user authorization, verified backup/restore, completed single metadata migration/narrow grants, preserved58 original tables/173 rows and backend restart. Current100call allowance is preserved; production remains separate.

V0.9: [P29 infrastructure/recovery proposal](infrastructure-recovery-proposal.md), [decision evidence](progress/P29.md) and [P29–P33 status](progress/V0.9.md). Existing VPS preference and synthetic recovery design are approved; remaining access/services/offsite/custody keep DEC-10/11/P29 blocked. [Executed local tooling](recovery-local-preparation.md) is not P30 acceptance. No paid provisioning, new retained migration, real pilot or production action authorized.

[Retained Mac backup verification](mac-backup-verification.md) records the explicitly selected local source, age-encrypted full SQL restore, exact one-file Drive approval and verified read-back. This is one recovery point, not automated backup or V0.9 acceptance.

[Scoped MVP ordering/three-role UX verification](mvp-ordering-verification.md) records current buyer/manager/Admin journeys, fixes, automated/Chrome evidence and the boundary from V0.9 operational acceptance.

[Next staging handoff](staging-next-step.md) records current VPS resource evidence, proposed isolated caps, prepared Linux artifacts and remaining remote-access/origin/service gates. No VPS deployment or release approval implied.

[Local website runtime repair and regression](website-local-verification.md) records the October24 notification/order error diagnosis, verified retained-local storefront adoption, startup schema gate and broad regression boundaries.
