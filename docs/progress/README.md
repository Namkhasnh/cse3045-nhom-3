# Roadmap Progress and Evidence

[Roadmap](../roadmap.md) owns sequencing/acceptance. This folder stores resumable handoffs for prompts actually worked on; it does not duplicate requirements or create 36 empty status files. No prompt is accepted by introducing this convention.

## Current follow-up — October 19, 2026

| Prompt | Recorded status | Full acceptance gap |
| --- | --- | --- |
| [P01](P01.md) | ACCEPTED | No V0.1 blocker; expansion-window compatibility boundary recorded |
| [P02](P02.md) | ACCEPTED after P01 | Auth/profile/email, OpenAPI, safe return and expired-email evidence complete |
| [P03](P03.md) | ACCEPTED after P02 | MFA/recovery, restricted SQL/CLI/Chrome and approved local config complete |
| [P04](P04.md) | ACCEPTED after P03 | Public catalog OpenAPI/HTTP/MySQL/privacy complete |
| [P05](P05.md) | ACCEPTED after P04 | Real public UI, states and five-width Chrome evidence complete |
| [P06](P06.md) | ACCEPTED after P05 | Guest cart, login/price consent/storage/account continuity complete |

**V0.1 is ACCEPTED** by the [final criterion-by-criterion self-review](V0.1.md), October 19, 2026. The [scoped follow-up](../auth-followup.md) closes the preceding implementation/evidence gaps. CLI now has 18 signed-manifest/PTY scenarios (Python PTY), local real SMTP has STARTTLS/AUTH evidence, and all recorded checks use clean lockfile installs. Retained Admin enrollment is observed read-only, not performed by this follow-up. See P01 for exact commands, fingerprints and evidence boundaries.

**V0.2 is ACCEPTED** by the [P04→P05→P06 self-review](V0.2.md), October 19, 2026. Checkout remains unavailable until P15/P16; production is not accepted.

**V0.3 is ACCEPTED for local synthetic scope** by [P07→P10 self-review](V0.3.md), October19,2026. [P07](P07.md), [P08](P08.md), [P09](P09.md), [P10](P10.md) record sequential acceptance. No real partner intake, retained-data adoption or production publication; future order privacy/anti-evasion controls are contracted, not implemented.


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

- V0.4: [P11](P11.md), [P12](P12.md), [P13](P13.md), [P14](P14.md) and [version acceptance](V0.4.md), local synthetic scope only.

- V0.5: [P15 cash aggregate](P15.md), local synthetic acceptance; [P16 checkout](P16.md) accepted; [P17 fulfillment](P17.md), [P18 tracking/concurrency](P18.md) and [V0.5 acceptance](V0.5.md) accepted for local synthetic scope; retained adoption is separate.

V0.6: [P19 QR/refund decision](P19.md); implementation acceptance remains separate.

- V0.6: [P19 approved DEC-06](P19.md), [P20 backend](P20.md), [P21 connected UI](P21.md) and [version acceptance](V0.6.md), local synthetic scope only; retained adoption remains separate.

- V0.7: [P22 approved DEC-07](P22.md)→[P23 finance backend](P23.md)→[P24 connected reports/reconciliation](P24.md) accepted for local synthetic scope October21. [Approved DEC-08](../account-support-policy-proposal.md) and [P25](P25.md) now also accepted for local synthetic scope; no separate production/version-release review is inferred.

- Finance verification/adoption boundary: [actual commands and limitations](../finance-local-verification.md). Retained migration and production/publication remain separate.

- V0.8: [P26 accepted decision](P26.md); [P27 backend](P27.md)/[P28 UI](P28.md) accepted for local synthetic scope with deterministic and100case real Gemini evidence; [version/adoption boundary](V0.8.md) remains separate from retained/production adoption.

- V0.9: [P29 partial DEC-10/11 approval/local preparation](P29.md), [P30](P30.md), [P31](P31.md), [P32 draft pilot](P32.md), [P33](P33.md) and [version status](V0.9.md). Requested downstream records are preparation/dependency tracking only; local independent synthetic recovery tooling has run, no dependent staging/pilot acceptance.
