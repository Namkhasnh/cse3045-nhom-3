---
name: build-component
description: "Create or fix React components, pages, layout, styling and interaction states in this repository. Use for làm giao diện, sửa UI, responsive or component work. A business workflow across backend/data belongs to implement-feature; explicit Pxx/version execution is orchestrated by run-roadmap."
---

# Build Component

Build the requested UI under [AGENTS](../../../AGENTS.md) and the [approved UI guide](../../../docs/ui/ui_convertion.md). Infer the page/actor/data boundary from the request; no full task template is needed.

## Load only relevant context

Inspect nearby components, tokens, app composition, installed scripts/dependencies and callers; use CodeGraph first when indexed. Read UI identity/tokens/layout/component rules plus the relevant §9 behavior and §§10–13 corrections/states/accessibility. Inspect the matching embedded [reference board](../../../docs/ui/Hoa%20Lac%20Food%20Ordering%20Platform.html) when reconstructing/designing a screen; preserve it unchanged. A small existing-component bug need not load unrelated boards or the entire roadmap.

For connected UI, read actual endpoint/DTO/errors in API §§2–4 and its feature section. Identify request ownership, props/callbacks, session/current capability and required loading/empty/error/conflict states. If a necessary product choice is open, use the owning DEC/contract rather than inventing behavior.

## Build within the approved design

Keep Be Vietnam Pro, cream/orange tokens, white compact discovery and distinct manager/Admin shells; product copy Vietnamese. [frontend-design](../frontend-design/SKILL.md) helps a substantial layout/design proposal, [ui-ux-pro-max](../ui-ux-pro-max/SKILL.md) a specific UX/accessibility concern. Routine UI uses neither automatically. Font/palette/shape changes require a concrete proposal and actual user decision; no redesign during a small fix.

Public homepage/menu cannot wait on successful auth/me. Guests build carts; login restores/revalidates and never submits orders. Managers retain buyer/cart/history navigation while managing at most one restaurant. Signup has no role choice; Admin access is sole MFA authority. Applications identify exact terms/consent and setup-required state; approval is not permission to sell.

Keep domain widgets in features and generic controls in shared/ui; app composes through feature exports. Requests belong in hooks/API layers, presentation gets data/callbacks. Do not duplicate backend money, authorization or state decisions. Real mutation success requires backend confirmation; fixtures stay explicitly labeled when presentation-only work is requested. Do not expand UI-only work into an unrequested backend feature.

Preserve input/retry context, exact string IDs/money, separate order/payment/refund display and explicit price/fee reconfirmation. Build semantic labels, keyboard/focus/dialog behavior and touch targets with the UI; ensure 360 px flow, long Vietnamese text, zoom/reduced motion and no clipped sticky controls.

## Verify

Run current frontend lint/build plus relevant meaningful browser checks under [AGENTS](../../../AGENTS.md#verification-and-completion). Check affected states, keyboard/focus, 360 px and applicable UI §13 widths; shared-control/token edits need affected layouts checked. Source inspection and lint/build do not prove browser/accessibility results. Report NOT CONFIGURED/NOT RUN/BLOCKED accurately.

Update affected UI conventions for new shared contracts/variants. Hand off component location/integration, connected-versus-fixture boundary, actual verification and intentional reference differences in Vietnamese. A roadmap caller receives only this task's evidence, not automatic milestone acceptance.
