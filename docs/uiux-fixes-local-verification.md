# UI/UX defect fixes — local verification

Scope: seven reproduced defects from the October 20, 2026 V0.1–V0.6 UI/UX review. This is a frontend correction, not milestone acceptance, a redesign, retained-data adoption or production readiness. Requirements and [UI states/accessibility](ui/ui_convertion.md#11-states-content-and-accessibility) remain authoritative.

## Changes

| Finding | Resulting behavior | Browser regression |
| --- | --- | --- |
| F02 checkout double-click | Keep the submitted form disabled during its first request and after success; show the result beside the submitted action. Reserve page space through recovery/reconfirmation so navigation cannot move under the original pointer. Keep the original durable intent/key semantics. | `test:checkout`: native same-coordinate double-click while a real committed response is held, then click the old coordinate after success, at360/390/768/1024/1440px; one POST and one new SQL order per intent. |
| F01 setup drafts | Profile fields and hours have separate drafts. Background reads and saving the other form update clean fields only. Own successful save adopts the authoritative response; scoped notices identify the saved form. | `test:settings`: hours save preserves a dirty name; profile save preserves an added unsaved hours row. |
| A01 form errors | Shared `Input.error` connects inline copy with `aria-describedby` and `aria-invalid`. Password mismatch focuses confirmation; recognized auth validation errors focus the relevant field. Restaurant profile validates its scoped name/address/phone/coordinate fields and focuses the first invalid field; server errors remain visible and focusable. | `test:connected` password mismatch; `test:settings` invalid phone, inline association/focus. |
| U01 owner order selection | Selecting an order focuses and scrolls its named detail region, revealing it again once the order content is ready without jumping on subsequent polling; a return button restores list focus without resetting its filter/cursor. | `test:tracking`: native Enter on a20-row360px list, visible detail region and focus return. |
| U02 login response stall | Login and MFA exchanges have a15s client deadline, including body reads; abort the transport and ignore late completion. Keep username, clear password/MFA proof, enable deliberate retry; no automatic resubmission. This is a UI recovery timeout, not a server SLA or quota change. | `test:connected`: held login promise, real deadline, release a late MFA-shaped response; no stale challenge or automatic retry. |
| U03 cash-only copy | Cart says “Tiếp tục đặt món”; buyer navigation says “Thanh toán trực tiếp cho quán”. Checkout still chooses cash/approved QR explicitly. | `test:connected` cart/navigation; `test:payments` actual QR flows. |
| U05 filtered menu empty | Distinguish an empty restaurant menu from no rows matching the filter; show “Xem tất cả món” for filter recovery. | `test:dishes`: hidden filter with zero matches, reset restores existing rows. |

The review's U04 discovery composition and V01 CTA hierarchy remain proposals. No font, palette, shape or payment/fulfillment rule was changed. No backend implementation, schema or migration was edited by this fix.

## Isolated reproduction

Use the guarded synthetic environment from [cash ordering](cash-ordering-local-verification.md) and [payments](payments-local-verification.md). Check MySQL9.2.0 and loopback43316; use new `test_*` databases, never reset retained/shared data. Initialize separate private MinIO evidence/dish buckets per DB and confirm anonymous access is denied before running. All identities, bank details, evidence and transactions are synthetic. Browser-server replaces outbound SMTP/password-corpus services; no external notification or money movement.

Run from the repository root, sequentially: backend compilation cleans `.test-dist`; Chrome harnesses share43127/43128/43129. Each independent browser journey uses its own newly prepared database/storage configuration; do not reuse a DB containing ordered dishes with the reseeding browser server.

```sh
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run test:cart
npm --prefix frontend run test:orders
npm --prefix backend run test:compile
# For EACH new empty disposable target, with DATABASE_URL=$TEST_DATABASE_URL:
npm --prefix backend run test:prepare
# Run only that target's selected journey, then prepare a different new target:
npm --prefix frontend run test:smoke
npm --prefix frontend run test:connected
npm --prefix frontend run test:onboarding
npm --prefix frontend run test:settings
npm --prefix frontend run test:delivery
npm --prefix frontend run test:dishes
npm --prefix frontend run test:setup
npm --prefix frontend run test:checkout
npm --prefix frontend run test:tracking
npm --prefix frontend run test:payments
```

## Newly executed evidence

Evidence root: `/private/tmp/hlf-uiux-fixes/`; `commands.log`, per-journey logs/screenshots, `results.json`, rerun/final records and synthetic `*-environment.json` identify the actual targets. The prior review is preserved separately at `/private/tmp/hlf-uiux-review/`; its PASS counts are not added to these results.

New local results: frontend lint and build PASS; `test:cart`6/6 and `test:orders`10/10 PASS. All10 distinct browser journeys listed above have a final PASS result on fresh MySQL9.2.0/private MinIO targets. There were16 browser invocations in total:15 PASS and1 retained harness failure. All16 database preparations and one backend test compilation passed.

The first settings regression used an append-only fill helper but expected a replacement name; its failure log/screenshot show that the dirty name was actually retained. The corrected regression selects the existing input before typing and passed on a new target. Additional final reruns verified menu reset focus, checkout success visible within the viewport and the owner selection probe at an explicitly configured360px. The earlier owner screenshot labeled360 was actually1440px and is excluded from mobile evidence; `final-tracking/uiux-owner-selected-360.png` is360px and the assertion checks that the actual loaded order heading is inside the viewport. A final auth run also verifies clearing inline errors when editing the field or resending an email code. No preservation assertion or server invariant was weakened.

A new native Chrome Guest check at actual200% zoom verified password-error readability, focus on password confirmation and Tab to submit. Toolbar AX reported “Zoom:200%”; evidence is `native200-password-error.png` and `native200-password-error-ax.txt`. This client-side mismatch does not submit registration or modify DB data. It is not evidence that every journey ran at200%.

Self-review preserved the pre-existing staged patch byte-for-byte and all11 unrelated unstaged diff chunks. Existing untracked backend test content was unchanged. `git diff --check` and cached diff checks passed. Application changes are limited to the frontend; reviewed forward migrations only prepared fresh synthetic databases. No acceptance, retained database or production configuration was changed.

Chrome viewport emulation is not a real mobile device. Screen-reader, cross-browser, live bank/SMTP, remote CI and production checks are NOT RUN for this scoped fix. DOM association/focus checks and screenshots do not certify WCAG or user comprehension. Backend lint/unit/HTTP/integration suites are NOT RUN because backend behavior was not changed; real MySQL browser checks establish only their stated journeys. No roadmap acceptance was updated.
