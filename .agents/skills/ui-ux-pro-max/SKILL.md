---
name: ui-ux-pro-max
description: "Research a specific UX, accessibility, responsive or React/Tailwind question using the bundled local dataset. Use for focused interaction evidence, not every UI task. Product-wide design-system output is only an unapproved proposal when that direction is requested."
---

# UI/UX Pro Max — Focused Local Research

Answer one concrete UI question using local data; [AGENTS](../../../AGENTS.md), [UI guide](../../../docs/ui/ui_convertion.md) and [design coordination](../../../docs/ui/design-skills.md) govern implementation. build-component owns React changes. No roadmap-wide reading or redesign is needed for a focus/overflow question.

## Choose the smallest query

Use existing Python 3 and the bundled standard-library scripts; no global CLI or app dependency installation. Run from repository root, or use the script's resolved absolute path. Inputs contain public/general UI terms, never private user/payment/application data.

```sh
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "focus not obscured" --domain ux --json
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "error summary validation" --domain ux --json
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "list stable keys" --stack react --json
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "chip badge overflow nowrap" --stack html-tailwind
```

Choose an observable UX outcome first; use explicit --domain ux/icons/chart/style/product/typography/color as appropriate. Use --stack react or html-tailwind only for implementation details; do not introduce Next.js/native patterns into this React/Vite website. Native-specific guidance is relevant only when a request genuinely concerns native UI.

Inspect the top result's subject/category and applicability, not just exit status. If empty/off-topic, retry once with a narrower query or explicit domain. If still unsuitable, state no verified match and label any general advice as fallback. A successful search is not evidence of implemented accessibility or measured performance.

Read [quick reference](references/quick-reference.md) only for the affected category; [native polish rules](references/pro-rules.md) only if their platform applies. Do not load all dataset/stack files or apply every checklist to a small change.

## Apply within repository contracts

Existing identity remains Be Vietnam Pro/cream-orange with semantic tokens; search typography/color defaults are advisory. No result can add a role, API, provider, fixed fee/rate, dependency, metric or operational promise. Shared buyer-manager/one-restaurant/sole MFA Admin behavior comes from product contracts, not dataset examples.

Only a requested overall direction may use --design-system; treat it as a proposal and reject generic marketing output when it does not fit restaurant discovery or operations. Print output to stdout. Do not use --persist/--force or create design-system/MASTER.md as another authority; approved decisions go in the UI guide after actual user choice.

Return the query, relevant finding, concrete application to this interaction and limitations to the calling workflow. Actual browser/keyboard/contrast checks under UI §§11/13 still establish whether the change works. Runtime scripts, CSV/JSON data, pinned-source attribution and [license](LICENSE) remain unchanged.
