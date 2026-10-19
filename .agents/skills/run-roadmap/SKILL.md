---
name: run-roadmap
description: "Execute a named P01–P36 prompt, resume roadmap work, or complete a requested V0.x/V1.0 version in this repository. Use for làm P04, làm tiếp lộ trình, chạy bước tiếp theo, or hoàn thành V0.2; also handles the selected prompt's decision/preflight mode. Not the default for ordinary bug fixes, UI tweaks, reviews or code explanations."
---

# Run Roadmap

Resolve a short request into the existing full contract and carry its authorized work to a verified handoff. Follow [AGENTS](../../../AGENTS.md), [roadmap](../../../docs/roadmap.md) and [progress rules](../../../docs/progress/README.md). This skill orchestrates; it does not replace product/technical contracts.

## Resolve one task

- Pxx: load that exact block and its accepted dependencies. A short “Run P04” means the complete P04 contract; no need to ask the user to paste it.
- Version: identify its prompt range in roadmap, resume the first unfinished member and process the requested range sequentially. Do not expand a single prompt into the full version.
- Continue/next: resume the active unfinished record/handoff; otherwise find the earliest unaccepted candidate in backlog/evidence. Announce the selected prompt and relevant prerequisite before working.
- Prepare decisions/preflight/read-only: honor that narrower mode. A prerequisite inspection does not authorize code, progress edits or execution of the selected step.

The read-only helper prints a single block or the index without loading every version into context:

```sh
python3 .agents/skills/run-roadmap/scripts/resolve_prompt.py P04
python3 .agents/skills/run-roadmap/scripts/resolve_prompt.py --list
```

It resolves text only; it does not determine acceptance, authorize actions or mark progress. Run from repository root or use the script's absolute path. No dependencies beyond Python 3.

## Gate and execute

Read the selected block's required inputs once and relevant progress/DEC evidence. Compare actual current source and scripts; apply CodeGraph for code inspection. Missing checkboxes can be stale, and checked boxes can lack evidence: inspect rather than assume. Do not redo accepted work merely because a new session starts.

If prerequisites are missing, name the exact prompt/DEC/evidence gap. Prepare independent authorized analysis/options without silently skipping predecessors or implementing their entire scope. Preserve an explicit later-step request; prerequisite remediation outside its scope needs existing authorization or a focused scope question.

Choose the current prompt's mode: policy proposal/decision, feature implementation, UI work, test acceptance, migration/operations or release. Use implement-feature/build-component only where their workflow applies. A policy prompt produces concrete choices and records actual decisions before dependent implementation; it is not blanket permission to code. Pilot/release/retained-data changes follow their exact contract and existing authorization.

For implementation, carry the requested task through meaningful checks and contract/status updates. Do not automatically run unrelated tests or read every document. Preserve current MySQL 9.2.0 and the shared buyer-manager/sole MFA Admin design. Legacy role requests/multi-owner fixtures are migration inputs, not target authority.

## Leave resumable evidence

Use progress/Pxx.md for actual roadmap work, recording exact source basis, delivered scope, results, unresolved gates and next safe action. Mark partial/blocked work honestly. Check off backlog only after full prompt acceptance; never infer approval from silence or fabricate external review. For a requested version, continue the next member only after dependency acceptance is established. Stop dependent work at a necessary missing decision, mandatory review or explicit pilot/release approval while finishing independent authorized work.

Report in Vietnamese: prompt/version; delivered behavior or concrete decision proposal; exact checks; blockers with source; acceptance and next action. Writing code or finishing all prompts never proves commercial readiness.
