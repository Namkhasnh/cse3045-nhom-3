# In-site onboarding and order notifications

Approved implementation scope: user plan October22, 2026; requirements US27/FR13/AC18. Existing onboarding/setup, consent, sole MFA Admin and operating rules remain authoritative. No external delivery provider or business state change from reading.

## Interfaces

Machine-readable shapes: [OpenAPI](data/notifications.openapi.json).

All routes below use `/api/v1/notifications`, cookie session, current active account and no-store; writes retain Origin/CSRF. Admin mailbox/task/setup access additionally rechecks current sole enrolled authority and MFA session. IDs are positive decimal strings and timestamps UTC.

| Method/path | Contract |
| --- | --- |
| GET `/` | Optional cursor (descending ID), read_state=all/unread/read and category=all/order/system; 20 rows with standard data/page envelope. Legacy unread=true means unread, false means all; cannot combine unread with read_state |
| GET `/summary` | unread_count; one first-access current-state summary for eligible applicant/manager or Admin |
| GET `/:id` | Own message only; 404 outside mailbox; does not mark read |
| POST `/:id/read` | Empty object; idempotent mark read, returns own message plus authoritative unread_count |
| POST `/read-all` | Empty object marks the entire current authenticated mailbox through a server-captured maximum ID, including unloaded rows; later IDs remain unread. Returns unread_count, read_through_id and read_at. Legacy ids array of 1–100 IDs retains loaded-ID semantics; no recipient input |
| GET `/setup/:restaurant_id` | Current manager or sole MFA Admin; current public_visible/orderable/is_open and seven steps with completion/status/responsibility/description/link |
| GET `/tasks` | Sole MFA Admin; kind=applications/delivery/restaurants, optional descending ID cursor, 20 rows; includes waiting-on-owner tasks explicitly labeled |

Notification DTO: id,type,title,body,href,restaurant_id,source_id,source_version,created_at,read_at. Detail additionally returns nullable destination {kind:order/task,href} and current_context (restaurant_id,status,description,href), resolving the current application result even for a message created before the restaurant existed. Snapshot text is plain text; backend-generated local links only. No raw documents, account contacts, tokens or payment information. Read operations do not consent to terms/rates or grant permission to linked resources. Backend authorizes every destination normally.

## Persistence and delivery

Additive `20261022000000_notifications` creates notifications with immutable payload, logical recipient_key, unique(recipient_key,event_key), inbox and unread indexes; only read_at updates. Workflows append after their authorized mutation in the same transaction; rollback removes both, retries deduplicate per source transition/version. Business services access only public module ports and pass the existing context. No provider/network calls or account locks are added after restaurant/application locks.

Logical keys are account:<id> or admin. No account FK is intentional: a notification insert's implicit FK lock must not invert account-first business lock ordering. Account identities are retained; key construction is server-only using authorized source ownership. The admin key is an organizational mailbox readable only by the current sole MFA Admin, never by a former operator. Notification rows grant no authority and have no delete API/automatic purge. Production retention remains an operations decision before release.

First-access summary uses a stable summary.v1 key and account-first serialization. Existing state is summarized, never backfilled as historical events. GET summary/list can insert that one summary. Message detail obtains current checklist separately; old snapshot content remains unchanged. Reading an old message cannot restore stale surveys/agreements.

One provider per active frontend session polls count/recent data every5seconds when visible/online, exponential error backoff up to30seconds; stops on unmount/logout/expiry. Requests bind X-Account-Id; stale/aborted replies are discarded. Inbox pagination and reading are explicit; opening the bell never marks messages read. A button-controlled popover supports outside click/Escape, focus restoration, mobile focus containment, scrolling and reduced motion. A successful item click marks only that message read before opening its authorized destination or details; opening the popover never writes read state. The standalone /notifications page has no personal/owner/Admin sidebar; header navigation remains shared. The UI uses Vietnamese read/category filters, date grouping and cursor loading. See [approved redesign](ui/notifications-figma.md).

## Order events — October23 scoped extension

The user's request to use existing real local data follows the reported missing order/history/notification behavior. New order creation and effective accepted/delivering/completed/cancelled/rejected/food-ready changes append messages to the buyer and current owner's account mailboxes in the same transaction as the order/history/audit. Each mailbox event includes order ID/version and recipient role in its durable uniqueness key; replay, repeated state commands and concurrent completion never duplicate messages. A notification failure rolls back the order mutation. No historical event backfill or external push/email/SMS is implied.

Messages include only order ID, safe status copy and restaurant/source/version IDs; never recipient contacts, item details, payment proof or rejection free text. Buyer links use `/orders/{id}`; current-owner links use `/owner/restaurants/{restaurant_id}/orders?order={id}`. Order notification detail reconstructs a destination from source_id, restaurant_id, durable buyer/owner event role and current resource ownership through the orders/restaurants public ports. Stored href never determines an order destination. Missing or unauthorized resources return destination=null and no actionable context URL; linked endpoints independently reauthorize. It it never labels an order event as an opening/setup task. The order endpoint independently reauthorizes current access, including changed ownership. No schema migration is needed.

## Verification and adoption

NOTIFY-01: authorization/MFA/privacy, event coverage/deduplication/rollback, bootstrap, read-loaded race and pagination on real MySQL9.2.0. NOTIFY-02: two-role browser opening/setup journey, all seven conditions, current versus snapshot guidance, exact links, unread state, offline/expired session, keyboard and360px/desktop. Existing frontend/backend checks and Prisma validation/generation remain required.

Implementing source and disposable tests does not imply retained migration/production deployment or release readiness. Evidence is recorded in [notification verification](notifications-verification.md).

## October 24 redesign compatibility

The approved user request replaces the read-loaded-only UI with true mailbox-wide read-all and adds a Read filter. The optional legacy ids payload and unread flag remain supported. Single-read and full-read timestamps never rewrite prior read_at values. Successful mutations invalidate older in-flight polls; local confirmed read state and the server cutoff keep the bell and already-loaded cards consistent until refresh. Existing pagination depth is reloaded after invalidation. Generic messages without a verified task/order destination open their plain-text details, never an invented route. Unsafe legacy href values serialize to the notification's own detail route.

No schema migration, historical backfill, data reset, external notification service or order lifecycle change is required. All test writes use disposable synthetic scope; no VPS deployment is authorized.

## Incoming popup and optional sound — October 24

Authority: the user's approved incoming-alert implementation plan. One visible/online session poll remains the sole incoming-message source; no new API, migration, provider or background push is added. The first successful page establishes an exact BigInt ID high-water mark (including read records); later polls advance it even when alerts are disabled. Only unread records newer than that mark produce alerts. A burst uses the newest returned message, a link for the other returned new messages, and at most one chime. Subsequent batches queue in the shared floating viewport instead of replacing an earlier visible or waiting batch. This is bounded by the existing recent-page API, not a guaranteed replay of every message during long absences.

The popup closes after 8 seconds of unpaused display time; hover, keyboard focus, pending opening and opening errors pause expiry. Closing never marks a message read. Opening the bell dismisses the popup and suppresses further popups while its panel is open. The detail action uses the existing confirmed read/detail/authorized-destination flow, with an explicit retry on failure. Logout, account changes and session expiry remove session alerts. Popup presence does not change mailbox counters or business actions.

The bell contains independent “Hiện thông báo nổi” (default on) and “Âm thanh thông báo” (default off) switches. Preferences are account-scoped in this browser's localStorage, with an in-memory fallback. Re-enabling never replays prior messages. Sound can remain enabled with popups disabled. A short local Web Audio sine chime is activated/tested by an explicit click; no audio assets or external requests are used. Reloaded or suspended audio requires “Kích hoạt âm thanh” when not running. Blocked audio is never queued for later playback; disabling sound cancels current voices and pending activation.

Following the October25 user-approved consolidation, incoming events use the same top-right cards and single viewport as [action feedback](ui/action-feedback.md#unified-floating-messages--october-25-2026), at most400px wide with mobile12px margins, polite live announcements, keyboard close/focus return and reduced motion. At most two cards display; waiting cards start expiry on display. Complete title/body, detail/retry and burst links are preserved. Local interaction feedback never enters the mailbox and remains enabled independently of the incoming-popup preference. No OS notification permission, closed-tab delivery or deployment is included.
