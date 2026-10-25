# Transient action feedback — October 25, 2026

User-approved behavior: meaningful actions display a floating message, including adding dishes and successful order creation. These UI acknowledgements do not need inbox persistence.

`FeedbackViewport` is a generic shared portal, mounted once beside the application. It receives in-memory events only, shows at most two messages in a shared top-right stack below navigation, queues later messages, and dismisses success after5seconds/error after8seconds. Hover/focus pauses expiry; close and Escape dismiss without taking focus on arrival. Semantic status/alert output,44px close targets, narrow layouts, safe-area spacing and reduced motion are supported. The viewport scrolls within the available height and stays above mobile bottom navigation; cart undo remains below it.

The cart emits feedback from the reducer's actual result, including repeated additions of the same dish, quantity updates, removal, undo, clearing, switching and explicit price acceptance. Draft storage remains purchase intent only. Checkout clears its cart silently after a confirmed response to avoid an unrelated clear-cart message beside order success.

Shared mutation requests acknowledge successful server responses; order creation includes the returned public `order_code`. Failed/unknown results do not announce success. Existing inline errors, uncertain-intent recovery, financial confirmations and validation remain. Auth challenge responses do not announce login success before MFA. Authentication/onboarding clients also emit acknowledgements for their own successful writes. GET polling, automatic delivery quotes, notification reads and intermediate media uploads stay quiet.

No toast calls the notification API, stores its message, changes unread counts, or restores an old message after reload. Existing durable order/status notifications retain their server-owned contracts; this change adds no per-click inbox records. It does not infer payment receipt from fulfillment or alter order state.

Verification in this follow-up:

- Frontend unit suite:37cases pass, including message/code/MFA/background filtering, event-only delivery without storage/API calls, delayed acknowledgement, rejected mutations and lost responses without false success.
- Real Chrome with controlled API responses: cart actions, repeated additions, committed order/code, rejected order without success, auto-dismiss, Escape and reload pass alongside the existing guest/manager/Admin, fee/conflict and responsive cart cases. Initial testing exposed overlap with undo; spacing was corrected before the passing rerun.
- Evidence: `/private/tmp/hlf-action-feedback-unit.log`, `/private/tmp/hlf-action-feedback-browser.log`; controlled screenshot directory is recorded by the browser log. Self-review, not independent acceptance or a complete accessibility audit.

Connected checkout PASS on fresh `test_project_recheck_1792872806120`, MySQL9.2.0 with dedicated synthetic storage. Real Chrome → Nest → MySQL covers manager setup, guest login without automatic submission, cash checkout, lost-response/same-key recovery, account isolation, stale quote/unit-price consent, duplicate clicks at five widths and exact buyer/owner notification links. Outbound password-corpus/SMTP remain harness substitutes. Evidence: `/private/tmp/hlf-cart-checkout-connected.log` and screenshots in `hlf-browser-evidence-3Pc1n1` under the system temporary directory. Existing stale numeric-code expectations and settings-panel readiness checks were corrected; bounded CDP calls/checkpoints now prevent an unreported browser hang. No business assertion was removed.

Frontend lint and TypeScript/Vite build pass; the existing large-bundle advisory remains. Backend checks for the related Admin-capability repair are in [cart verification](cart-figma.md#admin-quote403-repair--october-25-2026). Deployment remains on hold; this follow-up has not contacted or changed VPS data.

## Unified floating messages — October 25, 2026

The user approved using the action-feedback card for incoming important events too. `NotificationToast` is now a feature adapter publishing to the single shared viewport, with no independent portal/styles. Its server-owned detail/read/navigation logic stays in notifications. The shared optional title/action/link fields support complete event copy, pending state, retry errors and publisher cancellation without importing feature code upward into shared.

At most two cards mount at once; waiting cards start their expiry only when displayed. Later polls append event batches rather than replacing an earlier popup. A poll burst still uses its newest event plus a link to the other returned messages in the durable inbox. Incoming cards retain8seconds, hover/focus/pending/error pauses, close/Escape and bell focus restoration. Opening the bell, disabling incoming popups, expiry/logout or changing account cancels incoming cards, including queued ones. Ordinary action feedback remains independent of incoming preferences.

The bell retains important order and onboarding/setup events. Local interactions still never create inbox rows. API, database, retained rows and existing read/count behavior are unchanged.

Verification for this consolidation (self-review):

- `npm --prefix frontend run lint` and `npm --prefix frontend run build`: PASS; existing large-bundle advisory remains.
- `node --test frontend/test/feedback.test.mjs`: PASS,3cases for confirmed success/MFA/background filtering and no persistence.
- `npm --prefix frontend run test:cart-browser`: PASS, including actual React repeated additions, order-code feedback, rejection, expiry/Escape/reload and no inbox writes. Log: `/private/tmp/hlf-unified-feedback-cart.log`; screenshots: `hlf-cart-evidence-RwEMz8` in the system temporary directory.
- `npm --prefix frontend run test:notifications`: PASS, including mixed waiting actions/incoming events, two visible cards, no second popup, action feedback with incoming popups disabled, preserved detail/read/error/hover/focus/sound/account/session behavior and360px/desktop bounds. Log: `/private/tmp/hlf-unified-notifications-browser.log`; screenshots: `hlf-notifications-evidence-XHcxP9` in the system temporary directory. Mobile action and incoming-event screenshots visually inspected.
- These Chrome runs use controlled API responses; they do not establish real backend/database or production delivery. Backend was unchanged and its checks were NOT RUN. No deployment.
