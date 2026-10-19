---
name: implement-feature
description: "Implement scoped business capabilities across the necessary backend, database, API and frontend layers in this repository. Use for thêm tính năng, API behavior or business workflows; run-roadmap orchestrates explicit Pxx/version requests. Not for UI-only work, explanations, reviews or isolated test failures."
---

# Implement Feature

Deliver the requested capability under [AGENTS](../../../AGENTS.md). Infer US/FR/BR/AC/test IDs, relevant version and necessary layers from [requirements](../../../docs/requirements.md) and actual source. A backend-only or frontend-only request stays scoped; matching Pxx does not authorize the whole milestone.

## Establish the contract

Read only owning contracts from AGENTS routing. For shared identity/MFA use account-security; applications/terms use onboarding; retained data use migration-plan; payments use payments-policy. Check relevant DEC entries before policy-dependent work. Do not ask the user for IDs, file paths or settled routine choices the repository can supply.

Inspect current implementations/callers, scripts/lockfiles, migrations and tests with CodeGraph first when indexed. State a short action/result/failure/evidence checklist; reuse existing code. If required policy is missing, prepare a concrete recommendation and focused question, cite the source and continue independent work without inventing it.

## Implement the smallest complete scope

- Backend: HTTP → workflow → public domain service → owning repository → Prisma. One transaction context; current capabilities/ownership checked for reads/lists/nested/replay/writes. Atomically commit required mutation/history/audit/key-result; use database §10 lock order.
- Target identity is ordinary buyer with optional management of one restaurant, plus one operator-owned MFA Admin. No Owner-role promotion, extra Admin or multi-restaurant switcher. Opening approval/manual create must enforce cap/consent/setup readiness atomically.
- Preserve exact scalar formats, consent/conflict handling, immutable snapshots and uncertain-outcome keys. No fabricated survey/rate, price authority in React, AI money/order writes or external calls inside retried transactions.
- Schema changes use reviewed forward SQL and [migration plan](../../../docs/data/migration-plan.md); no applied-migration edits/reset/retained-data cleanup. Real MySQL is **9.2.0**. Do not introduce business tables or providers beyond this capability.
- Connected UI follows [build-component](../build-component/SKILL.md) where needed, with actual approved APIs. No fake mutation success. Respect the requested presentation/connection boundary.

## Verify and hand off

Use [testing](../../../docs/testing.md) case IDs and [AGENTS checks](../../../AGENTS.md#verification-and-completion). Unit-test money/state policies; use real MySQL for persistence/rollback/races and browsers for affected journeys. Meaningful failure/scope/retry checks matter more than mirroring implementation. Missing tooling/evidence is not a pass.

Update affected contracts and implementation status only where behavior changed. For explicit roadmap work, hand evidence to run-roadmap using [progress rules](../../../docs/progress/README.md); do not claim full Pxx acceptance from a slice. Report behavior, exact verification and material blockers in Vietnamese. No deploy/merge/publish/real pilot permission is implied by completed code.
