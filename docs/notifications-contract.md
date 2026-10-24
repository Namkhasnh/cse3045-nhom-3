# In-site onboarding and order notifications

Approved implementation scope: user plan October22, 2026; requirements US27/FR13/AC18. Existing onboarding/setup, consent, sole MFA Admin and operating rules remain authoritative. No external delivery provider or business state change from reading.

## Interfaces

Machine-readable shapes: [OpenAPI](data/notifications.openapi.json).

All routes below use `/api/v1/notifications`, cookie session, current active account and no-store; writes retain Origin/CSRF. Admin mailbox/task/setup access additionally rechecks current sole enrolled authority and MFA session. IDs are positive decimal strings and timestamps UTC.

| Method/path | Contract |
| --- | --- |
| GET `/` | Optional cursor (descending ID), unread=true/false; 20 rows with standard data/page envelope |
| GET `/summary` | unread_count; one first-access current-state summary for eligible applicant/manager or Admin |
| GET `/:id` | Own message only; 404 outside mailbox; does not mark read |
| POST `/:id/read` | Empty object; idempotent mark read, returns own message |
| POST `/read-all` | ids array of 1–100 string IDs actually loaded by client; scope-filtered and idempotent; does not mark newly arriving/unloaded rows |
| GET `/setup/:restaurant_id` | Current manager or sole MFA Admin; current public_visible/orderable/is_open and seven steps with completion/status/responsibility/description/link |
| GET `/tasks` | Sole MFA Admin; kind=applications/delivery/restaurants, optional descending ID cursor, 20 rows; includes waiting-on-owner tasks explicitly labeled |

Notification DTO: id,type,title,body,href,restaurant_id,source_id,source_version,created_at,read_at. Detail additionally returns current_context (restaurant_id,status,description,href), resolving the current application result even for a message created before the restaurant existed. Snapshot text is plain text; backend-generated local links only. No raw documents, account contacts, tokens or payment information. Read operations do not consent to terms/rates or grant permission to linked resources. Backend authorizes every destination normally.

## Persistence and delivery

Additive `20261022000000_notifications` creates notifications with immutable payload, logical recipient_key, unique(recipient_key,event_key), inbox and unread indexes; only read_at updates. Workflows append after their authorized mutation in the same transaction; rollback removes both, retries deduplicate per source transition/version. Business services access only public module ports and pass the existing context. No provider/network calls or account locks are added after restaurant/application locks.

Logical keys are account:<id> or admin. No account FK is intentional: a notification insert's implicit FK lock must not invert account-first business lock ordering. Account identities are retained; key construction is server-only using authorized source ownership. The admin key is an organizational mailbox readable only by the current sole MFA Admin, never by a former operator. Notification rows grant no authority and have no delete API/automatic purge. Production retention remains an operations decision before release.

First-access summary uses a stable summary.v1 key and account-first serialization. Existing state is summarized, never backfilled as historical events. GET summary/list can insert that one summary. Message detail obtains current checklist separately; old snapshot content remains unchanged. Reading an old message cannot restore stale surveys/agreements.

One provider per active frontend session polls count/recent data every5seconds when visible/online, exponential error backoff up to30seconds; stops on unmount/logout/expiry. Requests bind X-Account-Id; stale/aborted replies are discarded. Inbox pagination and reading are explicit; opening the bell never marks messages read. Native disclosure supports keyboard/Escape; mobile uses the approved identity.

## Order events — October23 scoped extension

The user's request to use existing real local data follows the reported missing order/history/notification behavior. New order creation and effective accepted/delivering/completed/cancelled/rejected/food-ready changes append messages to the buyer and current owner's account mailboxes in the same transaction as the order/history/audit. Each mailbox event includes order ID/version and recipient role in its durable uniqueness key; replay, repeated state commands and concurrent completion never duplicate messages. A notification failure rolls back the order mutation. No historical event backfill or external push/email/SMS is implied.

Messages include only order ID, safe status copy and restaurant/source/version IDs; never recipient contacts, item details, payment proof or rejection free text. Buyer links use `/orders/{id}`; current-owner links use `/owner/restaurants/{restaurant_id}/orders?order={id}`. Order notification detail returns the message's order link in current_context and asks the user to open it for current state; it never labels an order event as an opening/setup task. The order endpoint independently reauthorizes current access, including changed ownership. No schema migration is needed.

## Verification and adoption

NOTIFY-01: authorization/MFA/privacy, event coverage/deduplication/rollback, bootstrap, read-loaded race and pagination on real MySQL9.2.0. NOTIFY-02: two-role browser opening/setup journey, all seven conditions, current versus snapshot guidance, exact links, unread state, offline/expired session, keyboard and360px/desktop. Existing frontend/backend checks and Prisma validation/generation remain required.

Implementing source and disposable tests does not imply retained migration/production deployment or release readiness. Evidence is recorded in [notification verification](notifications-verification.md).
