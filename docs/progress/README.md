# Roadmap Progress and Evidence

[Roadmap](../roadmap.md) owns sequencing/acceptance. This folder stores resumable handoffs for prompts actually worked on; it does not duplicate requirements or create 36 empty status files. No prompt is accepted by introducing this convention.

## Current follow-up — October 19, 2026

| Prompt | Recorded status | Full acceptance gap |
| --- | --- | --- |
| [P01](P01.md) | ACCEPTED | No V0.1 blocker; expansion-window compatibility boundary recorded |
| [P02](P02.md) | ACCEPTED after P01 | Auth/profile/email, OpenAPI, safe return and expired-email evidence complete |
| [P03](P03.md) | ACCEPTED after P02 | MFA/recovery, restricted SQL/CLI/Chrome and approved local config complete |

**V0.1 is ACCEPTED** by the [final criterion-by-criterion self-review](V0.1.md), October 19, 2026. The [scoped follow-up](../auth-followup.md) closes the preceding implementation/evidence gaps. CLI now has 18 signed-manifest/PTY scenarios (Python PTY), local real SMTP has STARTTLS/AUTH evidence, and all recorded checks use clean lockfile installs. Retained Admin enrollment is observed read-only, not performed by this follow-up. See P01 for exact commands, fingerprints and evidence boundaries.

## Record only when needed

For a roadmap implementation/decision task, create or update `Pxx.md` here. For an ordinary scoped task related to Pxx, add a record only if it helps later roadmap work, clearly labeled as a partial slice. Do not create a record for a read-only prerequisite inspection, routine review or explanation unless requested. Update [BACKLOG](../../BACKLOG.md) and [implementation status](../implementation-status.md) only when behavior/evidence actually changes.

## Record contents

```text
Prompt/version and requested scope:
Status: in_progress | blocked | verified | accepted
Source revision: commit plus relevant dirty files/diff fingerprint
Prerequisites: prior accepted evidence and approved DEC versions/references
Delivered behavior and requirement/test IDs:
Remaining work, defects and exact blockers:
Changed files/contracts:
Verification: exact commands, environment/versions, outcomes and artifact references
Evidence type: source inspection | automated tests | real browser | operations
Acceptance: criteria satisfied/missing; reviewer's identity, date and conclusion
Authorization: actual decision/pilot/release approval reference where required
Next safe action:
```

Use only actual statuses. `verified` means required checks for the delivered scope passed; it is not a claim of an external review, full prompt acceptance or release approval. `accepted` requires all prompt criteria/prerequisites/decisions and its required review evidence. Identify agent self-review as such; do not fabricate a user/independent reviewer. Normal work needs no additional approval beyond existing authorization unless the owning contract explicitly requires a missing decision/review/release approval. When a required external review is absent, record verified/pending review and do not check the prompt off.

## Resume rules

Read only the active prompt's record and referenced prerequisite evidence. Compare commit/dirty scope, relevant code, schemas/config and changed decisions; stale evidence is not automatically invalid everywhere, but rerun affected checks when its basis changed. A checkbox without evidence is not acceptance. Where records are absent, inspect prior handoffs/status/source/tests; reconstruct only supported facts and label missing evidence NOT RUN/NOT CONFIGURED/BLOCKED.

Prefer the current unfinished task when “continue” has context. Otherwise choose the earliest unaccepted roadmap candidate; validate dependencies before execution. A blocked predecessor cannot be skipped by treating future-source presence as completion. Preserve unrelated work, original uncertain intent/keys and history.

Keep records concise, sanitized and under 500 lines; link substantial artifacts at protected appropriate locations. No environment secrets, contacts, bank details, MFA/recovery material or provider transcripts in records. No extra operational permission comes from a status file.
