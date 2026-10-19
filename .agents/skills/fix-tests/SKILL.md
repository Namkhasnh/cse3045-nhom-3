---
name: fix-tests
description: "Diagnose and repair reported failing tests, flaky tests or test-related CI failures in this repository. Use for sửa test, fix test or broken assertions/compilation. Not for unrelated feature work or a read-only review; no roadmap prerequisite ceremony for an isolated test repair."
---

# Fix Tests

Restore meaningful evidence under [AGENTS](../../../AGENTS.md); a green test must still prove the current governing behavior.

## Reproduce and decide what is wrong

Accept a failing command/test/log or plain symptom. Inspect git status, current runner/scripts/lockfiles/CI and relevant code with CodeGraph first when indexed. Read the affected requirement or technical contract and [testing](../../../docs/testing.md) case; do not load every roadmap prompt or require previous milestone acceptance to diagnose a test.

Run the smallest safe existing reproducer and record the first useful failure. Distinguish code/test expectation from compilation, missing config/tooling or environment. Tests using role-selected signup, Owner/Admin promotion, multi-restaurant ownership or a different MySQL version may encode superseded behavior; inspect actual current scope and migration compatibility rather than mechanically rewriting all tests.

## Repair the cause

Change only the necessary code/assertion/setup. Explain why a changed expectation follows its owning contract. Keep meaningful regression/failure assertions; no skipped tests, blanket retries, weakened authorization/precision, broad upgrades or reset of retained data to make green. Control clocks/randomness/barriers for flakiness instead of sleeps.

For DB guarantees use disposable **MySQL 9.2.0** with actual CHECK/FK/UQ/rollback/races; ORM mocks and SELECT 1 are insufficient. Inspect the existing integration guard; never run synthetic suites against retained/shared data. Node's built-in runner is used; do not assume Jest/Vitest flags. Add tooling only when part of this repair.

## Verify and report

Rerun reproducer and affected [AGENTS checks](../../../AGENTS.md#verification-and-completion); broaden only for changed behavior/failures/unresolved risk. Update affected command/technical docs. Report in Vietnamese: symptom, root cause, correction, exact command/results and limits. A focused run is not the full suite; unexecuted repro is an inspected hypothesis. An isolated repair cannot mark a roadmap step complete without its full evidence.
