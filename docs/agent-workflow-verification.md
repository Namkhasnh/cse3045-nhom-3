# Contributor Workflow Verification

Date: October 18, 2026. Scope: AGENTS, repository skill entrypoints/metadata, short-request guidance, progress convention and a read-only prompt resolver. No application behavior, schema, account/data, existing CI pin or P01–P36 acceptance was changed by this instruction task.

## Executed checks

| Check | Actual result |
| --- | --- |
| Skill Creator quick_validate.py | PASS for all 8 skills, using existing temporary Python/PyYAML environment |
| openai.yaml parsing | PASS for 8 metadata files; short descriptions 25–64 characters, correct $skill default prompts and implicit invocation enabled |
| Prompt resolver listing | PASS: P01–P36 in order, correct source versions/titles |
| Exact prompt extraction | PASS: all 36 outputs match their original complete text block; positional/--prompt forms and execution from another directory agree |
| Invalid resolver input | PASS: missing arguments, P00, P37, lowercase p04, conflicting modes and path traversal input return usage error and no prompt output |
| Read-only resolver behavior | PASS: prompt-file/backlog hashes unchanged after all resolver runs |
| Vendored resource integrity | PASS: 74 existing resources/scripts/references/licenses unchanged; the original Anthropic exercise remains available in an optional reference |
| Local UX command | PASS: focus-not-obscured query returned relevant Web accessibility results; inspection distinguished AAA enhanced versus AA minimum, not interchangeable targets |
| Markdown links/anchors/line limits | PASS: 443 local links/anchors across 53 Markdown files; maximum 439 lines, all under 500 |
| Whitespace/conflict markers | PASS: git diff --check and no conflict markers in changed/new Markdown |

quick_validate checks structure, not decision quality. The helper prints text only and cannot infer prerequisites, accept a prompt, mutate progress or authorize operations.

## Manual routing and boundary walkthrough

These are instruction walkthroughs, not independent live-agent/UI-picker executions:

| Request | Reviewed route / expected boundary |
| --- | --- |
| Run P04 | run-roadmap resolves exact P04, checks P03/DEC evidence; missing acceptance is not silently waived |
| Complete V0.2 | P04–P06 requested range, sequential dependency acceptance; no expansion into V0.3 |
| Continue with no record | Inspect prior handoff/backlog/source, choose earliest unaccepted candidate and state missing evidence; no invented progress |
| Prepare P19 | Concrete QR/refund decisions, no unapproved provider/policy implementation |
| Check P15 prerequisites; read-only | Inspection/report only, no code/progress/backlog writes |
| Backend-only application submit/read | implement-feature, necessary backend scope only; not automatic full onboarding milestone |
| Fix mobile header overflow | build-component, approved identity and relevant browser evidence; no unrelated roadmap or redesign |
| Fix failing backend test | fix-tests, safe reproducer/current contract; no prerequisite ceremony or reset of retained DB |
| Review current diff | review-change, findings only unless fixes separately requested; no acceptance edits |
| Explain login | explain-code, actual source versus shared-identity target; no code/DB changes |
| Design an opening-form layout | frontend-design within current identity; identity change needs a concrete approved proposal |
| Research checkout focus | ui-ux-pro-max focused local evidence, no automatic design-system generation/persistence |

Checked the current commercial invariants in always-on guidance: public browsing/guest cart, ordinary buyer-manager identity, one restaurant maximum, sole MFA Admin, atomic opening/manual creation, setup readiness, fixed surveyed VJU points, direct cash/QR/refunds, exact money/snapshots/idempotency/audit, manual finance and MySQL **9.2.0**. Required decisions and pilot/release authorization are preserved. Ordinary execution does not introduce a new approval at every task.

## Limits

No independent subagent forward-test or future-session automatic skill selection was executed; no claim of measured runtime token/time savings. Context scope and workflow boundaries were inspected manually, and the new deterministic helper was actually exercised. User-facing descriptions/defaults will be available when the updated skill catalog is loaded; natural short requests also route through AGENTS.

Application lint/build/unit/E2E/browser/MySQL, migrations and operational procedures: NOT RUN for this instruction-only task. Existing historical test records and reference HTML remain intact; no prompt/version was checked off. [Quick start](prompts/quick-start.md) is the usage entry point; [contributor workflow](contributor-workflow.md) and [progress convention](progress/README.md) describe resumption.
