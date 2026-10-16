---
name: explain-code
description: "Explain actual repository code and execution flows in clear Vietnamese for a learner. Use for giải thích code, code này làm gì, luồng xử lý, or learning React/NestJS/Prisma through this project. Read-only by default; not a request to implement or refactor."
---

# Explain Code

Help the reader understand what the code does, why it is placed there, and how it connects to the rest of the application.

## Inspect before teaching

- Follow [AGENTS.md](../../../AGENTS.md) and consult the [document map](../../../docs/README.md) for the requested area. Read the relevant owning contract when explaining business behavior or a design decision.
- Accept a file, symbol, snippet, or question about a flow. If the snippet cannot be matched to the repository, explain the supplied snippet and state which surrounding behavior remains unknown.
- When `.codegraph/` exists, use CodeGraph before text search/source reads. Follow the symbol's callers and dependencies far enough to explain the requested behavior. If a result is missing or unavailable, disclose the limitation and inspect actual files; do not create an index.
- Check current source and configuration before naming endpoints, dependencies, lifecycle behavior, or test coverage. Cite real file locations and symbols. Do not infer an implemented capability from the target structure or examples in docs.
- Keep the task read-only unless the user separately requests changes. Do not install packages, start a database, run migrations, or rewrite code to make an explanation easier. Run a check only when needed to answer a concrete uncertainty and safe in the available environment.

## Explain at the reader's level

- Use Vietnamese unless requested otherwise. Start with the practical purpose in one or two sentences; assume beginner familiarity when no experience level is given.
- Trace input → important processing → output or side effect. Explain where the call starts and who uses the result. Include asynchronous behavior and failure handling when they affect understanding.
- Introduce unfamiliar terms where first needed, with a concrete meaning in this code. Distinguish, for example, a TypeScript type from runtime validation and an injected dependency from an HTTP request.
- Use a small hypothetical example when it helps. Label example values and pseudocode; keep them separate from actual project data and executable source.
- Explain the important decisions rather than narrating every import or line. Zoom into line-by-line detail when requested or when syntax itself is the obstacle.
- Use a compact Mermaid flow only when several components/calls are easier to understand visually. Keep simple explanations as prose.
- Separate observed implementation, documented target behavior, and your inference. For example, a mocked Prisma test does not show an actual MySQL transaction, and a documented route does not establish a registered endpoint.

## Deliver a useful learning result

Anchor the explanation with clickable file/line references. Cover the purpose, main flow, one illustrative example when useful, and a few pitfalls relevant to the question; omit sections that add no value.

If inspection reveals a likely bug or a contract gap, explain the evidence and consequence without silently changing it. Do not describe unexecuted checks as passing or present a proposed refactor as existing code.
