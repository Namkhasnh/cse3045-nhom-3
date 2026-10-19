---
name: review-change
description: "Review a diff, commit, PR or working-tree change for concrete bugs, regressions and contract violations. Use for review code or kiểm tra thay đổi. Read-only by default; do not implement fixes or post comments unless the user asks."
---

# Review Change

Find consequential defects supported by the selected diff and current contracts. Follow [AGENTS](../../../AGENTS.md); this workflow is read-only unless the user explicitly requests fixes/actions.

## Bound the review

Use the supplied base/commit/PR. With no explicit comparison, review staged and unstaged changes plus relevant untracked source and state that scope; do not invent a branch base. Ask only if a specific requested comparison cannot be inferred. Inspect working tree and affected code/callers with CodeGraph first when indexed.

Read owning contracts for changed behavior and relevant testing cases. For a Pxx review, read that prompt and prerequisite evidence only as needed; an unfinished future feature is not a regression in an unrelated patch. Distinguish pre-existing issues from introduced defects, target behavior from legacy compatibility and source from actual DB/browser evidence.

## Follow concrete consequences

Prioritize authority/data leaks, incorrect money/state/retry behavior, rollback/history/unique ownership/single Admin mistakes and user-flow regressions. New identity is ordinary buyer-manager with one restaurant; Admin is sole MFA authority with no implicit fulfillment/payment power. Public projections must exclude private account/application/finance data; guest login must not auto-submit an order. Use MySQL 9.2.0 contract for persistence claims.

For every finding, establish trigger → affected path → consequence → violated owning contract. Check nested/list/replay scope, immutable snapshots, key/result/audit atomicity and account-first locks where affected. UI/backend fixtures cannot prove real mutation success. Treat undecided policy as a blocker/question, not a policy you invent to judge code.

Use safe focused read-only checks if they resolve uncertainty. No auto-fix, test/snapshot rewrite, migration, commit/merge/deploy or external PR comment under a review-only request. Do not turn absent future tooling into an introduced bug unless required by the selected change's contract.

## Report findings first

Vietnamese by default. Order actual bugs by P0–P3; include small real file/line references, trigger, consequence and contract/test ID. Keep hypotheses/evidence gaps separate. If none are established, say so and state material verification limits. Do not manufacture issues or claim the code is bug-free. No progress/acceptance edits during a read-only review.
