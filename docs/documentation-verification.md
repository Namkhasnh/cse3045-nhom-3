# Documentation Verification — Commercial V1.0 Rewrite

Date: October 18, 2026. Scope: documentation and contributor guidance only. [Implementation status](implementation-status.md) distinguishes actual source from target design; [legacy archive](history/legacy-verification.md) preserves older test observations. This report does not certify V1.0 or any application version.

## Automated documentation checks

One-off Python validation was executed locally from `/private/tmp/validate_v1_docs.py`; no runtime dependency, application/test script or migration was added. Final measured counts are recorded after the last run below.

| Check | Result |
| --- | --- |
| Local Markdown paths and heading/explicit anchors | PASS — 502 links across 47 Markdown files |
| Markdown length | PASS — every checked file under 500 lines; largest 439 lines |
| Prompt set | PASS — exactly P01–P36, each once, in 10 version files |
| Prompt fields and dependencies | PASS — objective, inputs, previous accepted prompt, additional prerequisites, readings, scope, behavior/API/data, acceptance, tests/commands and handoff present in each copyable block |
| Numbered section references | PASS — 144 referenced section endpoints exist; policy and ID cross-references reviewed separately |
| Prompt required-reading paths | PASS — every listed repository input exists |
| Stable US/FR/BR/NFR/AC and pre-existing test IDs | PASS — IDs from HEAD retained; changed role/scope semantics explicitly superseded |
| Referenced package run scripts | PASS — 13 frontend/backend script-name pairs exist in current manifests; availability is not execution |
| Original reference HTML and October 16 fixture report | PASS — byte-identical to HEAD |
| Initial rewrite file scope | PASS — original rewrite contained Markdown only; the subsequent MySQL correction also changes the CI image pin to mysql:9.2.0 |
| Whitespace/conflict-marker check | PASS — git diff --check; no merge markers in changed/new documents |

## Contract/source review

Source was located through CodeGraph before ordinary source inspection. Reviewed requirements, architecture, database/API/UI/AI, current manifests/CI/schema, contributor/skill references and prompt dependencies. Revised living contracts no longer grant role-selected signup, Owner/Admin requests, mandatory login for public catalog or multiple restaurants per manager. Legacy occurrences are explicitly source/history, denied input, excluded scope or migration conflicts.

Cross-checked public/private projections, buyer-manager rights, singleton authority/existence/MFA gate, atomic opening/manual creation, consent/readiness, cash+direct QR/refunds, exact money, snapshots, durable keys, account-first locks and transaction/audit invariants. P08 includes necessary applicant submission/read backend work so its connected UI does not depend on the later P09 Admin review implementation. Unknown policy/provider/budget/hosting choices stay in the decision register with blocking versions/prompts. Section/skill links resolve; retained numbered owning sections remain the task routing basis.

## Limits

Application lint/build/unit/E2E/browser/MySQL tests, migrations, provisioners, account edits, deployment and backup/restore: **NOT RUN** for this documentation-only change. No database was queried or changed. No current CI pass or commercial readiness is claimed. Follow-up correction: CI now pins mysql:9.2.0 to match the selected local/staging/production version. The one-line image change was inspected; CI/integration execution remains NOT RUN/NOT OBSERVED.

External working-tree changes removed initial uncommitted restaurant/menu implementations/reports during the task. They were not restored or treated as delivered; the final inspected source snapshot is documented separately. This limits comparisons against that initial dirty snapshot; the original rewrite diff contained documentation only; the follow-up correction additionally updates the CI MySQL image pin. Existing tracked HTML/fixture history stayed unchanged; historical auth counts/limitations were retained in the archive.

The launch checklist remains unexecuted/unapproved; code completion, documentation checks and the existence of all prompts are not evidence that the product can launch.

Subsequent AGENTS/skill rewrites, metadata/helper tests and refreshed navigation checks are recorded separately in [workflow verification](agent-workflow-verification.md); counts above describe the original commercial-document rewrite.
