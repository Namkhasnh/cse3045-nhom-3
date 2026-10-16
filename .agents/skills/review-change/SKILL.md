---
name: review-change
description: "Review a diff, commit, pull request, or working-tree change for concrete bugs, regressions, and project-contract violations. Use for review code, kiểm tra thay đổi, or pre-commit review. Report findings without editing code or posting externally unless requested."
---

# Review Change

Identify actionable defects introduced by the selected change, supported by code and the governing project contracts.

## Establish the review target

- Follow [AGENTS.md](../../../AGENTS.md) and the [document map](../../../docs/README.md). Inspect `git status` and the requested diff/commit/PR. With no explicit target, review staged and unstaged tracked changes plus relevant untracked source files; state that scope. Do not include secrets, generated files, or binary payloads in output.
- Use the supplied comparison base when available. If a branch/PR target cannot be inferred reliably, ask which base to compare rather than silently choosing one. Inspect locally available evidence while waiting.
- Read the owning specifications and relevant [testing cases](../../../docs/testing.md). Use CodeGraph first when indexed to trace changed symbols, callers, data ownership, and affected tests; review surrounding code as well as the diff.
- Separate pre-existing defects from regressions introduced by this change. Missing future features in the technical scaffold are not automatically findings against an unrelated patch.

## Focus on consequences

Prioritize affected behavior rather than running a generic audit on every file. Where applicable, investigate:

- Incorrect results, unreachable/error paths, stale responses, resource leaks, or incompatible interfaces.
- Role/current-ownership enforcement, nested/list/replay access, and accidental disclosure.
- Exact money/scalar handling, lifecycle validity, snapshots, durable idempotency, transaction/audit atomicity, and documented lock order.
- Module/import boundaries where the violation creates a contract or maintenance problem; data migrations and history preservation.
- UI consent/recovery, accessibility/responsive regressions, fixture leakage, and fake success paths.
- Tests that contradict required behavior or cannot detect the claimed regression; documentation or command changes that mislead contributors.

Trace a concrete trigger to a concrete consequence. Mark uncertain observations as questions or evidence gaps rather than presenting speculation as a confirmed bug. Do not invent missing policies to judge the implementation.

## Validate without changing the patch

- Remain read-only by default. Do not apply fixes, rewrite tests/snapshots, run auto-fix commands, commit, merge, publish, or post PR comments unless explicitly requested.
- Run focused existing checks when they help validate a finding and do not alter tracked files or retained/shared data. Inspect scripts first; report command failures and unavailable tooling accurately.
- Do not equate mocked database tests with real MySQL guarantees, or source inspection with browser evidence. Keep verification gaps separate from demonstrated functional defects unless the gap itself violates the requested acceptance contract.

## Report findings first

- Respond in Vietnamese unless requested otherwise. Order actionable findings by severity: P0 critical immediate blocker, P1 high-impact bug, P2 ordinary functional defect, P3 low-impact actionable issue. Avoid priority labels for purely stylistic preferences.
- For each finding, include a short title, the smallest useful file/line reference, the triggering scenario, consequence, and relevant contract/case ID when applicable. Suggest a correction briefly when clear; do not supply an unsolicited rewrite.
- State the review target, checks actually run, and material assumptions or gaps. Use `NOT CONFIGURED`, `NOT RUN`, and policy-dependent `BLOCKED` with its source appropriately.
- If no actionable findings are established, say so plainly and still identify material verification limits. Do not manufacture findings or claim absence of all bugs.
