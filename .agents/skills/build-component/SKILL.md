---
name: build-component
description: "Create or update React components, pages, styles, and responsive UI in this repository. Use for thêm component, làm giao diện, UI states, or layout changes. Owns UI work; a backend business capability belongs to a feature implementation task."
---

# Build Component

Build UI that fits the existing product design and has a clear data and interaction contract.

## Ground the component

- Follow [AGENTS.md](../../../AGENTS.md) and the [document map](../../../docs/README.md). Identify the role, relevant requirement IDs, delivery milestone, and whether the request is presentation-only or connected UI.
- Read [UI guide §§1–8, 10–13](../../../docs/ui/ui_convertion.md) and the applicable §9 rules. Inspect the relevant embedded board in the [original HTML](../../../docs/ui/Hoa%20Lac%20Food%20Ordering%20Platform.html); the export wrapper is not the board. Keep the reference asset unchanged.
- Use CodeGraph first when indexed, then inspect nearby components, styles, entrypoints, package scripts, and dependencies. Reuse what exists. The target tree and design system do not prove Tailwind, routing, or shared controls are already installed.
- For connected UI, inspect the real endpoint and [API contract](../../../docs/data/api_contract.md), including §§2–4 and affected errors. Establish the props, callbacks, request owner, and relevant loading/error/conflict behavior before editing.

## Implement within the UI boundary

- Follow [architecture §10.1](../../../docs/architecture.md#101-splitting-the-frontend-into-small-components) and [target structure](../../../docs/code_structure.md). Keep domain widgets in their feature and generic reusable controls in `shared/ui`; compose features through public exports at app level.
- Keep requests and server-state coordination in hooks/API layers. Presentational components receive data and callbacks; local interaction state may stay close to the UI. Do not duplicate backend money, permissions, or lifecycle decisions.
- Preserve Be Vietnam Pro, semantic tokens, Vietnamese product copy, and the relevant Student/Owner/Admin layout. Apply UI §10 corrections before copying reference behavior.
- Implement states appropriate to the component: unavailable or disabled actions, pending submission, missing images, and loading/empty/error/conflict states where data is involved. Preserve input during failures; require server confirmation before displaying mutation success.
- Build keyboard, label, focus, dialog, and responsive behavior alongside the UI. Follow UI §§11 and 13 for long text, zoom, contrast, and viewport checks.
- For an explicitly requested prototype or presentation-only component, keep synthetic fixtures at a clearly labeled data boundary. An absent backend must not become a fake successful order, payment, or other real mutation. For requested connected behavior, report the missing contract/implementation and continue independent UI work; implement backend changes only within the user's authorized scope.
- Add only dependencies and structural changes necessary for the requested UI. Do not scaffold every future page or extract every element into a component.

## Verify and deliver

- Run the current frontend checks listed in [AGENTS.md](../../../AGENTS.md#verification-and-completion). Add meaningful interaction coverage when warranted; lint/build alone do not prove UI behavior.
- Use an available browser to check the affected states, keyboard/focus behavior, and the viewports required by UI §13, including 360 px. Check affected role layouts when changing shared controls or tokens.
- Report missing browser/test tooling as `NOT CONFIGURED`, available but unrun checks as `NOT RUN`, and unresolved policy dependencies as `BLOCKED` with their source. Separate source inspection, automated checks, and browser observation.
- Update UI conventions when adding a shared token, component contract, or variant. Report the component's location, integration/props, verified behavior, fixture boundaries, and intentional differences from the reference in Vietnamese unless requested otherwise.
