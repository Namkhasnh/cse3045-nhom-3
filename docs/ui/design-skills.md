# Design Skill Coordination

This guide coordinates installed design tools. The [UI guide](ui_convertion.md) remains the sole record of approved visual direction; [AGENTS.md](../../AGENTS.md) and the business/technical contracts retain their authority. Installation does not change application UI or prove design quality.

## Choose the workflow

| Request | Workflow |
| --- | --- |
| Add a component using the current identity | `build-component` owns implementation. Reuse approved tokens/components; consult a focused UX/stack search only if useful. No identity approval is needed for routine work. |
| Propose a substantial aesthetic or identity change | `frontend-design` develops and critiques concrete options. `ui-ux-pro-max` can inform specific UX questions or a product-wide proposal. Present font names with Vietnamese support, palette values, shapes, hierarchy, wireframe/preview and reasons. Obtain the user's decision before applying identity changes, then record approved decisions in the UI guide and implement through `build-component`. |
| Explain code or repair tests | Use `explain-code` or `fix-tests`. Do not initiate a UI redesign or load design tools unless the task actually requires visual investigation. |

Do not load all three skills for every UI edit. A new page within the existing system does not require generating a new design system. The current cream/orange/brown, Be Vietnam Pro and soft-corner identity remains in effect until a concrete alternative is approved. Font, color and shape proposals are permitted; they are not pre-approved changes.

Requirements decide scope and business behavior; architecture, API and database own their technical domains. The UI guide records approved visual decisions. The unchanged HTML is the initial reference, subject to UI §10 corrections. Skill recommendations and numerical defaults are advisory: verify relevance against actual content, installed stack and accessibility needs. Search output cannot add routes, libraries, dependencies, features or operational promises.

Prioritize restaurant discovery and dish selection: readable names, prices, availability, filters and actionable states. Use a clear hierarchy and useful comparison information. Remove decorative labels, marketing filler and repeated identical cards when they obscure content. Distinctiveness must support these tasks, Vietnamese copy, semantic tokens, responsive layouts, accessibility and labeled fixture boundaries.

## Installed sources and local adaptations

Both skills are vendored in `.agents/skills/`, shared with the team; no personal duplicate, global CLI or application dependency is required.

| Skill | Upstream and pinned revision | Installed source | License |
| --- | --- | --- | --- |
| [frontend-design](../../.agents/skills/frontend-design/SKILL.md) | [anthropics/skills](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/frontend-design), official Anthropic; `dbd4588f9e1033efb41dad4bef2f7947c8993d44` | `skills/frontend-design` | [Apache-2.0, full terms](../../.agents/skills/frontend-design/LICENSE.txt) |
| [ui-ux-pro-max](../../.agents/skills/ui-ux-pro-max/SKILL.md) | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/56ea9cf174ed86786187daa9de0e6247cb0747e4/.claude/skills/ui-ux-pro-max), community project, not an AI vendor product; `56ea9cf174ed86786187daa9de0e6247cb0747e4` | `.claude/skills/ui-ux-pro-max`, including all scripts, data and references | [MIT, full terms](../../.agents/skills/ui-ux-pro-max/LICENSE), copied from upstream root at the same revision |

Local patch inventory (both revisions checked October 16, 2026):

- `frontend-design/SKILL.md`: add repository integration guidance and approval boundary; clarify that its studio/client framing is an exercise. Remaining upstream content and license are retained.
- `ui-ux-pro-max/SKILL.md`: scope automatic selection to focused research and add repository integration/handoff guidance; replace Claude plugin-root commands with `python3 .agents/skills/ui-ux-pro-max/scripts/search.py` from the repository root (use an absolute resolved path from elsewhere); narrow design-system generation to requested overall direction; replace upstream Master/override workflow with the repository's single UI-guide authority. Add the upstream root MIT license. Runtime scripts, CSV/JSON data and reference documents are unchanged.
- `build-component/SKILL.md`: coordinate optional design inputs and distinguish routine implementation from an identity proposal. Search results never override existing contracts.

Do not run `--persist`, `--force` or create `design-system/.../MASTER.md` as a parallel authority. Print research to stdout. Only approved decisions enter the UI guide. An explicitly requested export outside canonical design documentation must be labeled as an unapproved proposal.

## Usage

Example prompts (skills become available on the next turn after installation):

```text
$build-component Add a restaurant filter using the current approved identity and labeled fixtures.
$frontend-design Propose two concrete directions for student restaurant discovery; explain typography, palette, shapes and hierarchy. Wait for my choice before changing the identity.
$ui-ux-pro-max Research keyboard focus around fixed bottom navigation; retain the approved identity.
$explain-code Explain RestaurantListPage in Vietnamese without changing UI.
```

Run local searches from the repository root using existing Python 3; no external Python packages are needed for these commands:

```sh
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "focus not obscured" --domain ux --json
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "list stable keys" --stack react --json
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "chip badge overflow nowrap" --stack html-tailwind
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "student food ordering discovery" --design-system -p "Hoa Lac Food" --format markdown
```

Use one dominant intent per query. Inspect the returned domain, top result and applicability. Retry once with a narrower query if off-topic; if still unsuitable, report no verified match and label any general advice as fallback. Typography suggestions still require Vietnamese glyph/weight checks and user approval for identity changes. Do not send private project or personal data in queries.

## Reproducible installation and updates

Use the `skill-installer` helper supplied by the local Codex installation. Its location is machine-specific; substitute the actual helper path below. These commands install into a clean destination and refuse to overwrite an existing skill:

```sh
python3 /path/to/skill-installer/scripts/install-skill-from-github.py --repo anthropics/skills --path skills/frontend-design --ref dbd4588f9e1033efb41dad4bef2f7947c8993d44 --dest .agents/skills --method download
python3 /path/to/skill-installer/scripts/install-skill-from-github.py --repo nextlevelbuilder/ui-ux-pro-max-skill --path .claude/skills/ui-ux-pro-max --ref 56ea9cf174ed86786187daa9de0e6247cb0747e4 --dest .agents/skills --method download
```

For an update:

1. Select an explicit commit SHA; inspect upstream license, instructions, scripts, imports and resource changes before execution. Never use a floating branch for the installed revision.
2. Install into a temporary staging directory using `--dest`; compare with the installed skill. Preserve local work; do not delete an existing installation just to satisfy the helper.
3. Include the complete upstream subtree and its license (copy the root MIT license from the same revision for UI UX Pro Max). Reapply and review only the local adaptations listed above. Update the revision and patch inventory here.
4. Validate `name`/`description` YAML frontmatter, Markdown links, resource paths and licenses with `skill-creator/scripts/quick_validate.py`. If PyYAML is unavailable, use a disposable virtual environment; do not install it into system Python.
5. Smoke-test UX, React, Tailwind and design-system modes against local data without persistence. Inspect result suitability as well as exit status. Check the three workflow scenarios above, canonical documentation links, Markdown files under 500 lines and `git diff --check`.
6. Review the diff before replacing installed files. Preserve the reference HTML, application code, manifests and lockfiles unless a separate application change is requested. Skills are loaded next turn; assess actual visual outcomes during a subsequent UI task.

## Installation verification — October 16, 2026

- `quick_validate.py`: PASS for `frontend-design`, `ui-ux-pro-max` and updated `build-component`; Python 3.14.5 with PyYAML 6.0.3 installed only in a temporary virtual environment.
- CLI smoke checks: UX returned focus visibility guidance; React returned stable list-key guidance; Tailwind returned compact-label overflow guidance. Design-system generation completed and printed to stdout without persisting design documents.
- Suitability limitation: both `student food ordering discovery` and the narrower retry `food delivery restaurant marketplace` produced a marketing funnel/hero pattern. No verified match for the restaurant-list layout was found. Treat that layout output as unsuitable; it is not an approved design. Focused UX/React results were relevant.
- Resource integrity: all 2 Anthropic and 73 UI UX Pro Max upstream files are present; byte comparison against pinned archives found only the documented `SKILL.md` changes. The added MIT license matches upstream exactly. The data validator passed all 12 domain files, 22 stack files and `ui-reasoning.csv`.
- Documentation checks: 157 local Markdown links resolved, all 9 affected/vendor Markdown files are under 500 lines and `git diff --check` passed. Application/reference files and the pre-existing staged diff were unchanged.
- The three workflow scenarios were reviewed against instructions by source inspection, not by running new end-to-end agent sessions. Automatic skill activation and actual design quality must be checked in later tasks.
- Application tests and browser checks: **NOT RUN**; this change is limited to skills and documentation. Component/browser automation remains **NOT CONFIGURED** as documented in the existing UI verification report.
