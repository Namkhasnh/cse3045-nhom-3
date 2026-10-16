---
name: implement-feature
description: "Implement a scoped product feature in this repository, connecting requirements with the necessary backend, database, API, and frontend changes. Use for thêm tính năng, user stories, or business workflows; not for a presentation-only component, explanation, or isolated failing-test repair."
---

# Implement Feature

Deliver the smallest complete capability within the user's requested scope, with traceable behavior and honest verification.

## Define the capability from existing contracts

- Follow [AGENTS.md](../../../AGENTS.md) and the [document map](../../../docs/README.md). Map the request to [requirements](../../../docs/requirements.md) IDs, actor, milestone, and acceptance criteria. Infer routine details from the repository rather than demanding a task template.
- Read all matching rows of the AGENTS.md routing table. Use the owning API/database/UI/AI specifications for the selected behavior; do not load unrelated domain detail by default.
- Inspect the working tree and use CodeGraph first when indexed. Inspect existing implementations, callers, manifests/lockfiles, migrations, and tests before choosing what to extend. Distinguish a target design from implemented behavior.
- Establish a short acceptance checklist: user action, authoritative result, necessary error/permission behavior, and evidence. Respect a backend-only or frontend-only request; do not expand it into all layers automatically.
- If a necessary product/security decision is unresolved or conflicting, identify its owning document, ask a focused question, and continue independent work. Record the approved decision in the owning contract before implementing dependent behavior. Routine choices within settled contracts do not require additional approval.

## Implement the required layers

- Follow [architecture](../../../docs/architecture.md), [target structure](../../../docs/code_structure.md), and [development §§7–11](../../../docs/development_guide.md). Create only the layers/files needed for this capability.
- For backend changes, preserve HTTP → workflow → module public service → owning repository → Prisma boundaries. Coordinate participating writes with the documented shared transaction context and database lock order; do not move domain rules into controllers or React.
- For API/schema changes, use the owning [API](../../../docs/data/api_contract.md) and [database](../../../docs/data/database.md) contracts. Preserve exact scalar formats, authorization scope, snapshots, retry/idempotency, and history as applicable. Do not invent an endpoint or policy to fill a documented gap.
- Use forward migrations and the checked-in Prisma configuration for storage changes. Validate empty/upgrade fixtures in an isolated test database when relevant; do not reset retained/shared data or rewrite applied migrations.
- For frontend changes, follow the [UI guide](../../../docs/ui/ui_convertion.md) and relevant embedded reference board. Wire actual data/actions, states, and error recovery. Keep prototypes/fixtures explicitly labeled and separate from real success paths.
- Put external providers behind the documented adapters. Follow the [AI integration contract](../../../docs/ai_integration.md) when AI is involved; provider output does not become trusted business data.
- Keep necessary groundwork within scope, preserve unrelated edits, and avoid empty scaffolding or broad dependency upgrades. Do not enable future features merely because they appear in the visual reference.

## Prove and document completion

- Select relevant case IDs and test layers from [testing](../../../docs/testing.md). Use unit evidence for policies, real MySQL/InnoDB for constraints/transactions/races, and applicable browser evidence for user journeys. Test meaningful failures and ownership/retry boundaries when affected.
- Run the affected checks in [AGENTS.md](../../../AGENTS.md#verification-and-completion) after inspecting current scripts. Lint/build, mocked HTTP tests, and connectivity checks each have limited evidence boundaries.
- Update owning contracts, implementation status/navigation, and setup instructions affected by the feature. Keep approved design and measured implementation distinct.
- Report in Vietnamese unless requested otherwise: delivered behavior, traceability, changed areas, exact verification results, and limitations. Use `NOT CONFIGURED`, `NOT RUN`, or `BLOCKED` with its source as appropriate. A missing required decision or acceptance check prevents claiming full completion.
- Implementation does not by itself authorize publishing, deployment, merging, or messages to other people; follow the user's actual requested scope.
