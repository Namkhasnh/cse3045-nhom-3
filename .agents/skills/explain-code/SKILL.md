---
name: explain-code
description: "Explain actual repository code and execution flows in Vietnamese for a learner. Use for giải thích code, code này làm gì or luồng xử lý. Read-only; distinguish current legacy code from target design. Not an implementation, migration, test-repair or review request."
---

# Explain Code

Teach what the actual code does, why it is placed there and who calls it. Follow [AGENTS](../../../AGENTS.md); no implementation or roadmap execution is implied.

## Inspect the smallest useful path

Accept a file/symbol/snippet or natural question. Use CodeGraph first when indexed to trace entrypoint → meaningful processing → caller/output; fall back with a limitation if unavailable. Read actual source/config before claiming routes, dependencies, data writes or test coverage. An unmatched pasted snippet can be explained on its own with surrounding context labeled unknown.

Read only the owning contract needed to explain behavior or a gap. No need to load P01–P36, verify all prerequisites, install packages, start DB/services or mutate files merely to explain a function. Current implementation/status docs are hints, not proof of code behavior.

## Explain clearly

Use Vietnamese, assume beginner familiarity and lead with practical purpose. Trace input → processing → output/side effect, including async/error behavior when it matters. Introduce necessary terms through this code; a TypeScript type is not runtime validation, a Prisma mock is not MySQL evidence.

For auth/ownership questions, explicitly distinguish legacy Student/Owner/Admin/role-request code from the decided ordinary buyer-manager, one-restaurant and sole MFA Admin target. Do not describe that target as already implemented or silently fix the code to match it.

Use one small clearly hypothetical example and real clickable file/line references. A compact Mermaid flow is useful only for a multi-part path. Avoid narrating every import or adding unrelated architecture lectures; explain pitfalls affecting this question. Separate observed code, documented target and inference. If a likely bug is seen, describe evidence/impact without editing or claiming an unrun reproducer passed. No progress/acceptance changes.
