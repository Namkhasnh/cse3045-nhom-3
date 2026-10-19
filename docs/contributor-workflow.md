# Contributor Workflow and Short Requests

[AGENTS.md](../AGENTS.md) defines always-on rules; [documentation map](README.md) owns specifications. Use [quick-start requests](prompts/quick-start.md) instead of repeating project rules in every message. Read this guide when resolving task scope, resuming roadmap work or preparing handoff; it does not add product policy.

## Select context by intent

For a numbered/version/next-roadmap request, use [run-roadmap](../.agents/skills/run-roadmap/SKILL.md), [roadmap](roadmap.md), relevant [prompt](prompts/README.md) and previous [handoff](progress/README.md). Load one prompt's block, not all version files. The prompt's own required-reading and gates remain applicable; avoid rereading unchanged text.

For ordinary feature/UI/fix/review/explanation requests, infer the affected requirement or technical contract from actual code and AGENTS routing. Do not require all earlier roadmap acceptance merely to explain a function or repair a test. A feature slice can implement requested settled behavior without claiming its full Pxx/version accepted. Missing technical/business prerequisites still limit that slice; never silently implement an entire predecessor milestone.

Choose one main implementation workflow. run-roadmap orchestrates and may consult implement-feature or build-component for the current task; decision/operations prompts use their own contract and authorization, not blanket feature coding. frontend-design and ui-ux-pro-max are optional specific inputs, not automatic companions to every UI task.

## Read only affected domain detail

| Domain | Requirements / technical detail | UI board(s), if UI changes |
| --- | --- | --- |
| Identity/MFA/current capabilities | Requirements §4.1/§7; account-security; architecture §9; API §2/§7.1/§12; database §4.1/§10; testing §5 | 01/06 plus approved MFA pattern |
| Applications/terms/manual partners | Requirements US23–24/FR11/AC14–16; onboarding; migration-plan; account-security; database §4.1/§10; API §7 | 11 hierarchy plus approved applicant form |
| Discovery/menu/media | US02–03/US11–12/US16; API §3/§7.2/§10; database §4.1/§8–10; UI §10 corrections | 01–02/08–09/11 |
| Cart/quote/order creation | BR01–10; architecture §5.1/§6–7; database §4.2–4.3/§6/§10; API §5/§7.3–7.4/§8; UI §9.2–9.3 | 02–03 |
| Fulfillment/tracking | BR15–19; architecture §5.2–5.3/§7–8; database §5/§10; API §7.4/§9; UI §9.1/§9.3 | 04/07 |
| Cash/QR/refund | BR11–14; payments-policy; architecture §5.4; database §4.4/§10; API §7.4/§9/§11; testing §8 | 03–04/07/09 |
| Commission/settlement/report | BR20–27; architecture §5.3/§6–7; database §4.5/§6–11; API §5/§7.5/§11; testing §6–8 | 10/12 |
| AI | BR28–31; ai_integration; API §7.6/§11–12; architecture §5.5; testing §9 | 05 |
| Support/users/audit/retention | account-security; DEC-08; requirements NFR07/§7; database §4.6/§8/§10; deployment §8; testing USER-01/SUPPORT-01/AUDIT-01 | 13 and approved support patterns |
| Tooling/release/restore | development §2–6/§12; current manifests/lockfiles/CI; deployment; database §11; testing §11–13; release-checklist | Only affected operator UI |

Inspect embedded reference templates/resources, not just the HTML export wrapper. Shared UI changes read UI identity/tokens/layout/components plus §§10–13; feature widgets also read the applicable §9 rules. Read architecture §3–4/§10 and code_structure when placement/import boundaries change. Models/migrations need database §4/§7–11, development §4–5 and migration-plan for retained data. No provider choice comes from a mockup.

## Resolve missing decisions without repeated confirmation

Use DEC entries and session approvals first. If a necessary choice is still open, prepare options with a recommendation, exact affected behavior/cost/privacy/migration implications and a clear question; link the owning source. Ask for the missing choice only. Continue independent authorized work; do not turn silence into consent. No new question is needed for routine placement, reuse or checks under settled rules.

A policy prompt produces a concrete decision proposal and affected contract changes. It is not accepted while its mandatory choices remain unanswered. An earlier approved commercial choice does not need reconfirmation because a later prompt mentions it. Actual release/real pilot authorization remains scoped to the concrete candidate/traffic plan.

## Handoff and resumption

Ordinary tasks use a concise final report: outcome; files/behavior; exact meaningful check results; remaining blockers/limits. No progress file is required for every typo, explanation or review. For roadmap tasks use [progress records](progress/README.md); the record must allow a new session to continue without pretending an old test result covers new code.

When the user says “continue”, preserve the active task's scope and resume its missing work. With no active task, identify the earliest unaccepted roadmap item from backlog and evidence, announce the chosen item and proceed where its prerequisites permit. Do not skip a blocked required predecessor or ask the user to rediscover repository state.

## Instruction changes

Keep AGENTS as concise always-on context; skill bodies describe only their workflow's distinctive decisions. Descriptions must route feature/UI/test/review/explanation/roadmap requests accurately. Keep automatic selection enabled unless explicitly changed by the user. Preserve vendored licenses/data/scripts; record local design-entrypoint changes in design-skills. Validate names/frontmatter/openai.yaml, links, real short-request behavior and helper error cases. Structural validation alone does not prove runtime agent quality.
