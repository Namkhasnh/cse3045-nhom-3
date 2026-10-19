# Prompt Execution Guide

[Roadmap](../roadmap.md) is the canonical version/dependency/release authority. These files contain complete prompts to copy one at a time; the common guardrails are repeated inside each block so copying a block does not lose its constraints. Technical prompts are English; product copy is Vietnamese.

Short calls such as `Run P04`, `$run-roadmap Complete V0.2` or “continue” can resolve the full prompt automatically; see [quick start](quick-start.md). The full copyable blocks remain unchanged acceptance contracts. [Progress records](../progress/README.md) preserve actual evidence between sessions.

1. Read AGENTS.md, the document map, current implementation status and decision register.
2. Choose the next unaccepted P01–P36 prompt, inspect actual source and previous accepted handoff.
3. Check its additional decision/feature gates. Decision prompts prepare concrete choices; obtain missing user decisions and record them before dependent work. A blocked prompt cannot be checked off because independent preparation exists.
4. Use run-roadmap to resolve the selected complete block, or copy it manually. Apply only its scope; preserve unrelated work and use disposable targets for tests. The documentation rewrite itself does not authorize application code, migrations, accounts or data changes.
5. Accept the prompt only with required behavior, exact verification and reviewer evidence. Update backlog/status; then continue. P35 needs explicit approval of the concrete production release and P32 actual pilot traffic needs authorization.
6. Required V1.0 policies/evidence cannot be deferred by disabling an unfinished feature. Code/prompt completion is not commercial readiness.

## Sequence

| Version | Full prompts | Required previous acceptance |
| --- | --- | --- |
| V0.1 — Accounts and new permissions | [P01–P03](v0.1.md) | Read-only inventory and explicit mapping/factor gates |
| V0.2 — Public discovery | [P04–P06](v0.2.md) | P03 |
| V0.3 — Restaurant opening applications | [P07–P10](v0.3.md) | P06 |
| V0.4 — Restaurants ready to sell | [P11–P14](v0.4.md) | P10 |
| V0.5 — Cash ordering | [P15–P18](v0.5.md) | P14 |
| V0.6 — QR and refunds | [P19–P21](v0.6.md) | P18 |
| V0.7 — Administration and reconciliation | [P22–P25](v0.7.md) | P21 |
| V0.8 — AI recommendations | [P26–P28](v0.8.md) | P25 |
| V0.9 — Operational pilot | [P29–P33](v0.9.md) | P28 |
| V1.0 — Commercial release | [P34–P36](v1.0.md) | P33 |

Use [decision register](../decisions.md) for unresolved choices and [release checklist](../release-checklist.md) for actual go-live conditions. No P01–P36 acceptance is claimed by these documents.
