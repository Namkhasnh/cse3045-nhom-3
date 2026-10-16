---
name: fix-tests
description: "Diagnose and repair failing tests or test-related CI checks in this repository. Use for sửa test, fix test, broken assertions, flaky tests, or test compilation failures; not for adding an unrelated feature or reviewing code without a reported failure."
---

# Fix Tests

Restore meaningful verification while preserving the behavior required by the project contracts.

## Establish the expected behavior

- Follow [AGENTS.md](../../../AGENTS.md) and the [document map](../../../docs/README.md). Read the governing contract before attempting a fix; map business failures to the relevant IDs in [testing](../../../docs/testing.md), especially §§4–9. For scaffold/tooling failures, identify the affected technical contract instead.
- Accept a failing command, CI log, test name, or plain-language symptom. Discover missing paths and scripts yourself. Ask for a log or environment detail only when local inspection cannot establish it.
- Check the working tree. Use CodeGraph first when its index exists, as instructed by AGENTS.md, to trace the failing test, production code, and callers.
- Inspect current package scripts, lockfiles, test setup, and CI. Distinguish an assertion failure from compilation, missing tooling, database connectivity, or environment failure.

## Diagnose and repair

1. Reproduce with the smallest existing check that exercises the failure. Record the command and first useful error; redact secrets and personal data from logs.
2. Compare actual behavior with the owning specification. Establish whether production code, the test expectation/fixture, or setup is wrong. A test is evidence to investigate, not authority to replace requirements.
3. Make the smallest coherent correction. Update an incorrect test only with a contract-backed explanation. Do not skip tests, remove meaningful assertions, add blanket retries, or weaken validation to obtain a green run.
4. For a product regression, add or strengthen a focused case that fails for the old behavior and passes for the fix. Avoid tests that merely mirror implementation. For flakiness, control clocks, randomness, asynchronous completion, or fixture isolation according to testing §3; do not add arbitrary sleeps.
5. Keep unrelated failures and user changes intact. Do not upgrade dependencies broadly, delete lockfiles, edit generated outputs, or reset a database as a test repair shortcut.

## Verify and report

- Rerun the reproducer, then the affected checks required by [AGENTS.md](../../../AGENTS.md#verification-and-completion) and [development §12](../../../docs/development_guide.md#12-verification-commands). Inspect scripts before using runner-specific filters; this repository must not be assumed to use Jest or Vitest.
- Use real MySQL/InnoDB evidence for database constraints, transaction rollback, and races. Mocked HTTP tests and `db:check` do not establish those guarantees. Add missing tooling only when it belongs to the requested fix.
- Update affected technical documentation if a command, contract, or setup changes.
- Report in Vietnamese unless requested otherwise: symptom, root cause, corrected behavior, changed areas, exact commands/results, and remaining limitations. Mark missing checks `NOT CONFIGURED`, configured but unrun checks `NOT RUN`, and policy-dependent work `BLOCKED` with its source.
- Do not claim the full suite passed from a focused run. If reproduction is unavailable, state that explicitly and distinguish an inspected hypothesis from a verified fix.
