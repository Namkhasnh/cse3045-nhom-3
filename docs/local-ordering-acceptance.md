# Local ordering repair and real-account acceptance — October23,2026

Authority: explicit user-approved implementation plan for localhost, existing restaurant4 and two separate authenticated browser sessions. This is a scoped repair, not a UI redesign, VPS deployment or version/release acceptance. [Local adoption](local-ordering-adoption.md), [order API](data/api_contract.md), [testing](testing.md) and [notification contract](notifications-contract.md) remain authoritative.

## Actual findings and repairs

| Finding | Evidence and disposition |
| --- | --- |
| Existing saved checkout rejected as restaurant not orderable | Actual Chrome same-intent retry showed the server eligibility refusal. Read-only MySQL confirmed restaurant4 ready/active/accepting but configured08:00–20:00, when observed local time was after21:00. This refusal is correct; hours/fees/consent were not bypassed. |
| Two local backend watchers competing for3000 | Process inventory identified two Nest watchers for this repository. Their logs contained186/54historical `EADDRINUSE` matches respectively. Initially stopped the non-serving duplicate. A later build exposed the remaining watcher attempting to start during `dist` deletion (`MODULE_NOT_FOUND`). Stopped it and started the tested built backend; actual public catalog returned200. Added a dev occupied-port preflight and separate `.dev-dist` output to prevent build/watch output collisions. These counts are log matches, not distinct incidents. |
| One saved-credential login attempt showed an unhelpful generic error | Same saved credentials later authenticated successfully. The first attempt's exact HTTP error was not captured; its cause is NOT ESTABLISHED. Do not claim duplicate watchers prove that login's cause. Added explicit auth500/503 copy and safe correlated backend diagnostics. |
| Checkout offered little explanation when unavailable | Cart/checkout now show current restaurant/dish verification issues and block new-order controls with a reason. Menu displays today's configured Vietnam hours and an explicit refresh action. Cart retains access to the recovery page even when new checkout is blocked. |
| Pickup loading/failure/empty states were indistinguishable or lacked recovery | Shared feature hook provides abort-safe loading, error, true-empty and retry states for cart quote/checkout; failed reads never claim there are no points. Quote selection is disabled while calculating; late/unmounted replies cannot show a quote for a changed selection. |
| Saved intent could not be reviewed adequately | Recovery displays restaurant, dish IDs/quantities/accepted unit prices, exact accepted total and payment method from the original intent. It never replaces the original payload/key with the current cart. Same-key recovery stays available after sales stop because an earlier order may have committed. |
| History could retain another filter's empty/error state | Results and errors now bind to account/restaurant/filter key; stale requests cannot populate a different query. Failed refresh suppresses false-empty text while retaining valid same-query rows. Buyer and owner empty states both distinguish read failure. |
| Order confirmation cancel button said “Giữ giỏ hiện tại” | Observed in the real owner accept dialog. Order actions now explicitly use “Quay lại”; the generic/cart dialog remains unchanged. Frontend lint/build passed after this copy correction. |
| Successful checkout/tracking were hard to discover | Success offers a prominent exact-order tracking link plus history link. Existing server-backed order timeline, independent fulfillment/payment status and polling remain in use; no fake successful order or new tracking API was introduced. |

5xx diagnostics log only generated request ID, status, stable code, allowlisted Prisma code and bounded relative source frames. No exception message, SQL, request body, recipient, password, cookie or token is logged. A unit test verifies correlation and redaction. Generic404 UI copy now states missing content or lack of permission without revealing ownership.

The retained local backend now runs the tested `dist/main.js` directly, with no watcher. Protected process/log references are in `/private/tmp/hlf-order-acceptance-local-runtime.pid` and `/private/tmp/hlf-order-acceptance-local-runtime.log`; never run another backend on3000without first stopping the intended existing process. Future watch mode uses the new output separation described in the [development guide](development_guide.md).

No schema migration, database role/account mutation, retained reset or new survey/rate/consent was performed. Codex did not confirm a cash receipt; order2 was found paid after the user-operated interval described below. Existing unrelated work, sample labels and saved checkout intent remain. Normal real browser authentication may update its existing authentication/audit metadata.

## Verification performed

[Sanitized receipt](evidence/local-ordering-acceptance.json) owns exact sources/artifact hashes and boundaries. All disposable runs use Oracle MySQL9.2.0 on the isolated43316service. Checkout, tracking and integration use three distinct newly created test databases. Browser runners run sequentially on shared43127/43128/43129ports. Real identities/contacts and private screenshots are not copied into evidence.

| Check | Result |
| --- | --- |
| Backend lint/unit | PASS59tests, including safe5xx diagnostic redaction |
| Backend HTTP E2E/build | PASS9tests/build |
| Dev runtime safeguards | PASS1occupied/free-port test and actual isolated dev→production-build→dev HTTP200probe; retained backend also remained200 |
| Selected actual-MySQL orders/fulfillment/notifications | PASS concurrent create/state retries, history, scopes, snapshots, lost-response replay, audit/commission/notification rollback and mailbox deduplication |
| Frontend lint/build | PASS |
| Frontend cart/orders | PASS6+10tests |
| Extended Chrome checkout | PASS point503/empty/retry; closed restaurant refusal in menu/cart/checkout; original-key replay after sales stop; guest/login continuity, storage refusal, expiry/account isolation, price/quote reconfirmation, buyer/owner inbox links and native double-click |
| Extended Chrome tracking | PASS failed history refresh not empty, query error/data isolation, actual fixture account switching/manager buying, native360px submit, owner fulfillment/contact gating, unpaid completion, cancellation/rejection, offline/hidden-tab pause/resume, stale replies, reload and pagination |

Browser widths360/390/768/1024/1440are covered by the existing runners' asserted flows; order inbox additionally360/1440. Synthetic360px checkout and offline tracking captures were visually inspected. Native pointer hit testing checks a scrolled submit is not hidden by fixed navigation; a full-document capture can show fixed navigation at the capture viewport and is not proof that all content is simultaneously visible. Comprehensive accessibility/redesign acceptance is NOT RUN.

## Real-data observations and remaining acceptance

[Real order2 metadata](evidence/local-ordering-real-order-2.json) contains the read-only retained MySQL comparison, with no recipient, credentials, request key or ciphertext.

- User authenticated buyer `khanh124` in Chrome and existing restaurant4 owner `khanh25051505` in Edge. No role mutation or impersonation. A later unexpected Chrome Admin session was detected before any order submission; the user signed back into the buyer. The original buyer intent then reappeared unchanged with dish9 ×2, accepted total65000VND/cash.
- User explicitly permitted extending today's Friday interval from08:00–20:00 to08:00–23:59. Saved through the owner UI, verified by refresh and public catalog. After the run, restored20:00 through that same owner UI and refreshed. Read-only MySQL at23:31:28Vietnam time confirms all seven weekdays exactly08:00:00–20:00:00, no next-day close.
- Automatic UI review rejected Codex clicking the original-intent retry because it submits a real transaction, requiring the user to perform the final submission. Codex did not bypass the rejection. The user performed the send/reconfirmation interaction and reported completion. Exact intermediate conflict/status and success screen were not captured by Codex, so those are NOT ESTABLISHED for this real submission.
- Real **order2** was created22:10:57Vietnam time, buyer11, restaurant4, dish subtotal60000, delivery5000, total65000VND. Codex directly observed it pending in both buyer history and owner list, and opened both notification links: buyer message18 → `/orders/2`; owner message19 → `/owner/restaurants/4/orders?order=2`.
- Codex opened the owner accept confirmation, then work paused. On continuation, order2 was already completed. UI and MySQL agree: accepted22:12:39, ready22:12:43, delivering22:12:46, completed22:13:30; owner actor8. Those mutations occurred during the unobserved interval, not a Codex-observed sequence. Order2 does not establish polling latency; the subsequent observed order3 run below supplies that evidence.
- Order2 cash was confirmed paid by actor8 at22:13:18 during that interval. Codex did not click the payment control or edit this history. User clarified that this was a test click and no real cash receipt occurred. This is a retained test record, not evidence of money actually received. Order2 cannot establish unpaid completion; the subsequent order3 run does.
- Read-only DB confirms one create-request, one encrypted-private-payload record, four lifecycle history entries plus the separate ready milestone, exactly ten order notifications (five events × buyer11/owner8) and one base commission2400VND =60000×0.04000000, excluding delivery. No duplicate successful request or duplicate event was found for order2. No retained-data fault injection or cleanup was performed.
- Both browser sessions expired during the pause; normal login returned to the same order2. Codex observed the completed timeline in both sessions, refreshed buyer detail, and observed all five persisted owner inbox events. The buyer account also manages restaurant3, so this is direct evidence that management retains buyer ordering rights. Owner8's separate buyer-history page was also accessible without foreign orders.
- Earlier authenticated buyer GET for another account's order1 and restaurant4's owner list returned `NOT_FOUND`; no foreign data returned. Forbidden mutation attempts on retained data are NOT RUN; disposable authorization cases passed.

## Observed real order3 acceptance

User authorized another65000VND cash acceptance order and exclusive localhost interaction. Friday hours were temporarily reopened23:59 within the same explicit authorization, then restored20:00 again. No role changes, fictitious identity, retained fault injection or payment confirmation was used.

| Step | Direct observation / persisted evidence |
| --- | --- |
| Cart and quote | Actual public menu → add dish9 twice → cart60000 → same existing point/recipient → fresh server quote5000 → total65000, cash. |
| Submit | User performed final send because automatic UI review requires handoff. Codex observed actual success “Đã đặt đơn #3”, pending/unpaid, then clicked its tracking link. Raw create HTTP status was NOT CAPTURED; source/HTTP E2E status is distinct evidence. |
| Buyer and owner | Same order3 in buyer detail/history and owner polled list; owner contact withheld until ready. The buyer11 also manages restaurant3, directly establishing manager buying rights. |
| Owner commands | Codex directly performed accept23:41:11, ready23:41:53, delivering23:42:11, completed23:42:20 Vietnam time. Each command returned the server-confirmed current state. Corrected “Quay lại” copy was observed in real confirmation dialogs. |
| Buyer updates | Buyer detail remained selected and online, with no manual refresh between transitions. Each state/milestone and notification count updated automatically. Native observation bounds from action start: accepted10.966s, ready9.768s, delivering1.038s, completed9.324s, including tool/sampling overhead. These bounds are not exact paint latency. |
| HTTP polling | Read-only browser Resource Timing inspected through native DevTools shows HTTP200 order3 reads roughly5.05s apart. First reads after the persisted mutation timestamps ended at16:41:16.156Z /16:41:56.630Z /16:42:11.889Z /16:42:22.233Z: delays4.694s /2.668s /0.326s /1.345s from the corresponding history/ready timestamps. Correlation with the observed UI supports the two-cycle requirement; request completion is not a paint timestamp. Status0 on an initial aborted read is not counted as success. |
| Reload and recovery | Reloaded both selected order3 views: completed/unpaid and full history persisted. Buyer history retains both2and3 with distinct payment states. Both inboxes show all five order3 events; selected completed notifications link to the correct buyer/owner order3 route. A further natural buyer expiry retained `/orders/3` as return path; normal saved-credential sign-in recovered the same full order/timeline. |
| Cash and finance | Order3 remains unpaid, no confirming actor/time, payment version1. One base commission2400VND on60000×0.04000000; fee excluded. |
| MySQL | [Order3 receipt](evidence/local-ordering-real-order-3.json): PASS one create request/private payload/base commission, four lifecycle history rows plus ready, five audit events, exactly ten notices (five per account11/8), correct scopes/money/state. |
| Restoration | Final read-only DB23:44:35Vietnam time confirms all seven original08:00–20:00 intervals, no next-day close. Both acceptance orders and all generated history are retained. |
| Visual | Actual native Chrome360px responsive detail and desktop detail observed; totals, payment, timeline and update action readable. Prior disposable native360px pointer checks cover scrolled checkout/owner action hit testing. Private real screenshots remain out of repository. |

The **two-account localhost functional journey passed on real order3**, with raw mutation HTTP capture and exhaustive accessibility remaining limitations. Existing isolated network/commit-loss/double-click/expiry/price/closed/rollback/race tests remain PASS and are not substituted for the real journey. Forbidden mutations against retained foreign orders were intentionally NOT RUN; read denials were observed and mutation scope tests use disposable data. Actual recipient/point labels were preserved, including the existing sample-point label; this run is not a surveyed operational pilot or proof of actual meal delivery/payment. Local key backup remains NOT CONFIGURED as documented in adoption. No deployment or independent review is claimed.
