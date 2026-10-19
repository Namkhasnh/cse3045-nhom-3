# Short Requests for Repository Work

You can give a short request in Vietnamese or English. [AGENTS.md](../../AGENTS.md) supplies project rules; skills infer relevant requirements, files, checks and routine choices. You do not need to paste the full project context or all P01–P36 prompts each time.

## Roadmap requests

| Intent | Copyable request | Expected handling |
| --- | --- | --- |
| Run a specific step | `Run P04.` | Resolve the full prompt, inspect accepted dependencies/decisions and implement its permitted scope |
| Invoke explicitly | `$run-roadmap Run P04.` | Same behavior with explicit skill selection |
| Continue | `Continue the current roadmap task.` | Resume its progress record; if no task is active, identify earliest unaccepted step |
| Finish a version | `$run-roadmap Complete V0.2.` | Process P04–P06 sequentially; stop dependent work at unresolved gates, without skipping predecessors |
| Prepare a policy choice | `$run-roadmap Prepare P19 decisions.` | Prepare concrete QR/refund options and obtain missing decisions before dependent implementation |
| Inspect readiness only | `$run-roadmap Check P15 prerequisites; do not edit files.` | Read-only prerequisite/evidence report; no implementation or acceptance edits |

Calling a later step does not waive prerequisites. The agent should report the exact missing evidence/decision, continue only independent work and preserve the requested scope. A full prompt remains available in the [version files](README.md); the short request refers to that contract, not a shortened acceptance standard.

## Everyday requests

| Intent | Copyable request |
| --- | --- |
| Scoped feature | `$implement-feature Add public menu search using the approved API contract.` |
| Backend only | `$implement-feature Implement the application submit/read backend only.` |
| UI only | `$build-component Build the opening application form; use labeled fixtures until its approved API exists.` |
| UI behavior bug | `$build-component Fix the mobile header overflow at 360 px.` |
| Failing tests | `$fix-tests Fix the failing backend tests without weakening current contracts.` |
| Review only | `$review-change Review my working-tree changes; do not edit.` |
| Explain | `$explain-code Explain the current login flow and its gap to the new identity model.` |
| Design proposal | `$frontend-design Propose an opening-application layout using the approved identity.` |
| Focused research | `$ui-ux-pro-max Research keyboard focus after login returns to checkout.` |

Natural requests such as “fix mobile header” or “explain login” can select the same workflows automatically. Feature requests outside explicit roadmap execution stay scoped to the request; they do not authorize all earlier milestones or commercial release.

## Useful optional constraints

Add only constraints that matter: `backend only`, `review only`, `do not change the schema`, `continue the same task`, `keep the current design`, or a real failing command/error. The agent should infer known stack, MySQL **9.2.0**, identity model, exact money, history and verification rules from repository instructions.

## Resume and accept

Roadmap work leaves [progress evidence](../progress/README.md); later sessions compare it with actual source. Code written is not accepted behavior. Decisions/release approval are recorded only when actually supplied; mocks/source inspection are not MySQL/browser evidence. Starting this workflow changes no current P01–P36 acceptance checkbox.
