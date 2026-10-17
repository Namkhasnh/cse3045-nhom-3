# API Contract — Hoa Lac Food Ordering Platform

## 1. Authority, status and scope

This is the English business/API contract for implementation, not evidence of an existing API.
Sources: [requirements.md](../requirements.md) (business authority), [architecture.md](../architecture.md) (technical boundaries), [database.md](database.md) (data semantics), and [ui_convertion.md](../ui/ui_convertion.md) (UI behavior). The HTML reference informs interaction states only, after the corrections in UI §10.
Requirements override conflicting mockups. Architecture proposals remain proposals where not settled; the documentation index records canonical paths. Paths, DTO names, envelopes, error codes and pagination defaults below are transport decisions proposed by this contract, not endpoints claimed to exist in the sources.
All example IDs, names, prices, coordinates and rates are fictional fixtures, not production configuration. Unresolved product/security decisions are explicitly **TBD** and must be settled before the affected capability ships.

| Milestone | Contract coverage |
| --- | --- |
| MVP at VJU | Authentication/profile; discovery; frontend cart; fixed surveyed pickup points; cash orders/tracking; owner fulfillment/payment confirmation; dish CRUD; admin restaurant CRUD; AI; base commissions and minimal manual settlement/receipts/adjustments; transactional audit. |
| Post-MVP Must | Free address/map pin, route quotes/fee tiers, restaurant QR and recorded transfer refunds, expanded owner/admin financial reports. |
| Post-MVP Should | Random dish selection, history UI/reorder, order-linked support. Persisting and recovering MVP orders is already required. |
| Post-MVP Could | Reviews and favorites; detailed contracts TBD. |
| Excluded | Driver accounts/dispatch, multiple restaurants per order, platform payment gateway/splitting/automatic collection, AI conversation storage. |

## 2. General transport and authentication

- Base prefix: **`/api/v1`**; all endpoint paths below are relative to it. Production is HTTPS, preferably same-origin with the SPA; host and deployment origins are TBD. Breaking contract changes require a new major prefix; compatible additions stay in v1.
- Requests/responses use UTF-8 `application/json`; JSON keys are `snake_case`. GET has no body. Reject unknown input fields, wrong types and client-supplied server-controlled fields. PATCH omits unchanged fields; explicit `null` clears only documented nullable fields.
- Single success envelope: `{"data":{...}}`; lists: `{"data":[],"page":{"next_cursor":null,"has_more":false}}`. Collection totals are not promised. Mutations return committed server data; never optimistically report financial success.
- JWT is decided. Verify signature, expiry and configured issuer/audience; derive actor from the verified token and recheck active account/current ownership server-side. Public registration assigns `student` regardless of the selected requested role. An email-verified applicant may request Owner/Admin; only a current Admin may approve the request. The initial Admin still uses deployment §6.
- Web transport: sign access JWTs with HS256 and a backend-only random 256-bit key; include `sub` (account ID), `jti` (random 128-bit minimum), `ver` (account `auth_version`), `iss`, `aud`, `iat`, `exp`. Pin accepted algorithm and key ID; reject `none`, unknown key IDs, wrong issuer/audience and clock skew beyond 30 seconds. Access lifetime is 15 minutes. Set only a `__Host-hlf_access` cookie (`HttpOnly; Secure; SameSite=Lax; Path=/`, no Domain); never return or store JWTs in JSON, localStorage or sessionStorage. Same-origin HTTPS is required for production. A separate-origin SPA needs a reviewed contract change, not permissive CORS.
- No refresh token or endpoint in MVP: expiry requires login. `POST /auth/logout` increments `accounts.auth_version` atomically, invalidating all outstanding access JWTs for that account, and clears auth/CSRF cookies. A deactivated account fails on every authenticated request. Signing key rotation uses a current key ID plus bounded verification of old keys for at most 15 minutes; emergency compromise removes the old key immediately and forces login. `Cache-Control: no-store` applies to auth responses.
- CSRF uses a signed double-submit token bound by HMAC-SHA-256 to the access JWT `jti`, with a separate backend-only key. Login sets a JavaScript-readable `__Host-hlf_csrf` cookie (`Secure; SameSite=Lax; Path=/`, no Domain); clients copy its exact value to `X-CSRF-Token` on every authenticated POST/PUT/PATCH/DELETE, including logout. Check the cookie/header match in constant time, verify signature and binding, and reject absent/invalid values with 403 `CSRF_FAILED`. Rotate it on login and clear it on logout. Validate `Origin` against the configured exact public origin on every unsafe request, including register/login; reject missing/mismatched Origin. Require JSON content type for body-bearing writes and never mutate on GET. SameSite/CORS alone do not replace these checks.
- Login identifier is a username, not email or phone: 3–32 ASCII characters matching `[a-z0-9][a-z0-9._-]{2,31}` after ASCII lowercase conversion; reject leading/trailing whitespace, Unicode lookalikes and all other characters. Store canonical lowercase value with binary unique comparison; registration conflict is 409 `LOGIN_IDENTIFIER_TAKEN`. Password is 12–128 Unicode code points and at most 1024 UTF-8 bytes, accepted verbatim without trimming or normalization; reject control characters and known compromised passwords before registration/provisioning. The backend checks the [Pwned Passwords range corpus](https://haveibeenpwned.com/API/v3#PwnedPasswords) by sending only five SHA-1 prefix characters, with response padding. An unavailable or invalid corpus response fails closed with 503 `PASSWORD_CHECK_UNAVAILABLE`; the backend never sends the password or complete digest. Hash with Argon2id (`m=65536 KiB,t=3,p=1`, random 16-byte minimum salt, PHC encoding); verify in constant time and rehash on login when parameters increase. Never log, echo or truncate password/hash. Provision privileged accounts only through the controlled workflow in [deployment §6](../deployment.md#6-first-admin-and-initial-partner-bootstrap). The Argon2id floor and session-bound CSRF choice follow [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) and [OWASP CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html); the higher hash cost is this project’s chosen policy.
- Login backoff: count failures for 15 minutes starting with the first failure for each canonical username and client IP. After five failures in either scope, reject subsequent login attempts with 429 `RATE_LIMITED` and `Retry-After` until that window ends. A success does not erase recorded failures. Counters are shared through MySQL. Use the socket peer IP unless it matches a configured `TRUSTED_PROXY_IPS` address; only then accept the first valid `X-Forwarded-For` IP. The trusted reverse proxy must overwrite the incoming header, never append an untrusted value. This quota applies only to login; other endpoint quotas remain TBD.
- Authenticated shorthand: `S` student; `O` current responsible owner of the path/resource's restaurant; `A` admin; `Self` current account. One owner can manage multiple restaurants. `B` means authenticated browsing by any of the three roles; anonymous browsing is **TBD**, not granted by this contract.
- `O` retains access to existing orders/finance when a restaurant is deactivated, subject to current ownership. Admin has no implicit owner powers to change order/payment status. Never trust client `user_id`, role or restaurant scope.

## 3. Scalar, validation and list conventions

| Type | Wire format and validation |
| --- | --- |
| ID | Positive canonical decimal **string**, e.g. `"2048"`; no leading zero/sign/exponent; maximum signed BIGINT `9223372036854775807`. Never serialize JS BigInt or coerce IDs to Number. |
| Money | Canonical integer VND **string**, e.g. `"45000"`; no separators/decimals/exponents. Dish price 0–1000000000; surveyed fee 0–100000000; computed order total ≤ 1000000000000. Receipts > 0; adjustments and derived balances may be negative. Validate signed BIGINT storage bounds and aggregate overflow. |
| Rate | Exact decimal fraction string with eight fractional digits, e.g. `"0.10000000"` = 10%. Reject excess precision; no binary floats. Business range `0.00000000`–`1.00000000` inclusive; storage still uses DECIMAL(12,8). |
| Instant | UTC ISO 8601 with milliseconds and `Z`, e.g. `"2026-10-16T03:00:00.000Z"`. Display/report business time in `Asia/Ho_Chi_Minh`. |
| Local hours | `weekday` integer 1=Monday..7=Sunday, `opens_at`/`closes_at` strings `HH:mm:ss`, `closes_next_day` boolean. Reject empty/overlapping intervals; no interval means closed. No holiday exceptions are implied. |
| Count/distance/version | JSON integers, no strings/fractions; quantity 1–99 per item, at most 50 distinct dishes and 200 total units per order; distance metres 0–1000000; version ≥ 1 and ≤ 2147483647. Reject aggregate overflow. |
| Coordinates | Exact decimal strings with six places; latitude −90..90, longitude −180..180. Restaurant coordinates are both null or both present; route delivery requires both. |
| Text | Plain text, no executable HTML. Required names/reasons are nonblank after Unicode whitespace trim; preserve accepted content. Limits in Unicode code points: names 200, username 32 (§2), phone 16 (`+` optional, then 9–15 ASCII digits; no separators), address 1000, category name 100, reason/note 1000, image/evidence/QR reference 2048, receipt reference 255. Dish description ≤ 2000 code points and ≤ 8000 UTF-8 bytes. |

- Defaults: `limit=20`, maximum 100; `cursor` is opaque and optional. Use stable **keyset** pagination, not offset/page numbers. Cursor binds filters, sort and authorized scope; reject mismatched/invalid cursor with 422. Lists are live, not a multi-page snapshot.
- `q` is trimmed, nonempty name-prefix search, maximum 200 characters; case/diacritic matching follows a documented deployment collation (**TBD**). Restaurant category/price filters mean “has a matching visible dish,” not a stored restaurant price. Do not promise fuzzy search.
- Catalog filters: `restaurant_id` (dishes), `category_id`, `min_price_vnd`, `max_price_vnd`, `is_available` (dishes), `is_open` (restaurants). Price bounds inclusive; minimum ≤ maximum. Public-facing results exclude inactive restaurants/hidden dishes; visible sold-out dishes remain discoverable unless filtered.
- Catalog sort allowlist: `name,-name` and dishes additionally `price_vnd,-price_vnd`; default `name`, with ascending numeric ID as tie-breaker. Orders/ledger/settlements default `-created_at`, descending ID tie-breaker; allowed `created_at,-created_at`. Reject unsupported sort/filter keys.
- Management filters: restaurant `is_active,owner_id` (admin), dish `is_visible,is_available`, orders `status,payment_status`, entries `kind,assigned`, settlements `restaurant_id`. Every query remains server-scoped to the actor.
- Time filters use inclusive `from` and exclusive `to` instants. Orders use `created_at`, completed-order reports use `completed_at`, entries use `created_at`, receipts use `received_at`; these are not interchangeable settlement-membership rules. Monthly boundaries are converted from local business time to UTC.

## 4. Errors, HTTP and retry

```json
{"error":{"code":"VALIDATION_ERROR","message":"Check the highlighted fields.","field_errors":[{"path":"items[0].quantity","code":"MIN_VALUE","message":"Quantity must be at least 1."}],"details":{},"request_id":"req_example","retryable":false}}
```

`code` and field `code` are stable machine-readable identifiers; messages are safe display text. `field_errors` is always an array and `details` always an object. Do not expose stack traces, SQL, secrets or another actor's data. UI maps codes to localized copy and shows the request reference when useful.

| HTTP | Meaning / codes / UI behavior |
| --- | --- |
| 200 | Read, command, update, authorized no-op, idempotent replay or deletion outcome with body. |
| 201 | Newly committed resource; return `Location` for resources with a GET route. |
| 400 | `MALFORMED_REQUEST`: unreadable JSON/transport syntax; fix request. |
| 401 | `AUTH_REQUIRED`, `TOKEN_INVALID`, `TOKEN_EXPIRED`: clear protected view and re-authenticate. |
| 403 | `FORBIDDEN`, `ACCOUNT_INACTIVE`, `CSRF_FAILED`: no retry; show permitted navigation. |
| 404 | `NOT_FOUND`: missing resource; conceal cross-owner/student private resources as 404. |
| 409 | `PRICE_OR_FEE_CHANGED`, `QUOTE_STALE`, `ORDER_STATE_CONFLICT`, `PAYMENT_STATE_CONFLICT`, `VERSION_CONFLICT`, `IDEMPOTENCY_KEY_REUSED`, `ENTRY_ALREADY_ASSIGNED`, `LOGIN_IDENTIFIER_TAKEN`: explain conflict, refetch/reconfirm as specified. |
| 422 | `VALIDATION_ERROR`, `RESTAURANT_NOT_ORDERABLE`, `DISH_NOT_ORDERABLE`, `DESTINATION_NOT_SERVICEABLE`, `DELIVERY_QUOTE_UNAVAILABLE`, `COMMISSION_POLICY_MISSING`, `FEATURE_NOT_ENABLED`, `BASE_COMMISSION_REQUIRED`: valid JSON but invalid/unsupported intent; correct or choose another option. |
| 429 | `RATE_LIMITED`: respect `Retry-After`; preserve intent/key. Login uses §2's quota; other quotas TBD. |
| 503 | `TEMPORARILY_UNAVAILABLE`, `PASSWORD_CHECK_UNAVAILABLE`, `IDEMPOTENCY_IN_PROGRESS`, `AI_UNAVAILABLE`, `DELIVERY_PROVIDER_UNAVAILABLE`: bounded backoff; same key for a durable keyed mutation. |
| 504 / 500 | `AI_TIMEOUT` or `INTERNAL_ERROR`: AI permits manual fallback; unknown mutation outcome requires recovery, not a new intent/key. |

All endpoints inherit applicable auth/validation/not-found/rate-limit/server errors; endpoint sections add business errors. Do not use 204 for delete/hide/deactivate because the UI needs the outcome. `retryable=true` is guidance, never permission to bypass idempotency or reconfirmation.

## 5. Durable idempotency and concurrency

- Required `Idempotency-Key`: 1–128 visible ASCII characters, case-sensitive, no whitespace. Generate a unique opaque key per intent; keep it with the draft through timeout/reload. No server-generated key replacement on retry.
- Keyed operations: `POST /orders` (`create_order`), `POST /commission-adjustments` (`create_adjustment`), and `POST /settlements/{settlement_id}/receipts` (`record_receipt`). Scope is **authenticated actor + operation + key**, not restaurant or URL alone; target IDs are part of hashed content.
- Hash the validated canonical DTO with SHA-256. Sort object keys and order items by numeric dish ID; reject duplicate dish IDs rather than merging them. Canonical scalar strings and omitted/default-null optional fields normalize consistently. Preserve recipient/preference text as validated; no hidden text rewriting. Headers/JSON key order do not change intent.
- Order fingerprint includes restaurant, sorted dish IDs/quantities/**accepted unit prices**, pickup/destination, recipient, payment method and exact accepted quote artifact plus its accepted fee/distance/versions. Financial fingerprints include target IDs, amount, reason/reference/note and receipt instant as applicable. Never hash only the final total.
- Same key/same content after success: **200**, original resource ID and current authorized representation, `Idempotency-Replayed: true`; order snapshots stay unchanged, although order/payment status may have progressed. Do not revalidate today's prices/quote to create another order. First success: **201**, `Idempotency-Replayed: false`.
- Same key/different content: **409 `IDEMPOTENCY_KEY_REUSED`** with `details:{"operation":"create_order"}`; no mutation. Retrieve the original result by resending original content/key. Do not overwrite the saved fingerprint or silently create a new order.
- Concurrent same-key calls serialize through the database unique constraint; wait only boundedly, then return **503 `IDEMPOTENCY_IN_PROGRESS`**, `retryable:true`, and `Retry-After`. Retry the unchanged intent/key. The eventual winner is the only committed result.
- Resource, snapshots/history, audit and successful key/result commit atomically. Rollback leaves no successful key or partial resource. Retain successful keys for the order/financial history lifetime, not a short TTL. Failed validation/conflicts are not persisted as successful results.
- A changed/reconfirmed quote or edited intent gets a **new key**, only after the user confirms. A lost response is not evidence that creation failed: resend the original payload/key, then use `GET /orders/{order_id}` for recovery. No separate key-lookup endpoint is assumed.
- `expected_version` is required on catalog/config PATCH/PUT commands below, preventing lost edits; mismatch returns 409 with current resource/version. State commands instead serialize and validate the latest state; requesting the current allowed target is an authorized no-op.
- Completion and its single base commission commit together. Accept/cancel races yield exactly one valid transition. No-op status/payment requests append no duplicate history/audit/commission. Only transient database failures are retried internally, boundedly and without external side effects.

## 6. Shared DTOs and success examples

The following compact JSON objects define shared success shapes. `One<T>` means `{"data":T}`; `List<T>` uses §2's list envelope. Fields shown are required in responses unless explicitly marked optional. Server timestamps/version appear on mutable resources; no password hash, token or raw provider response is exposed.

```json
{"User":{"id":"1","login_identifier":"example-login","display_name":"Example Student","phone":null,"email":"example@example.com","email_verified":true,"role":"student","is_active":true,"version":1,"updated_at":"2026-10-16T03:00:00.000Z"}}
{"Restaurant":{"id":"10","name":"Example Restaurant","address":"Example campus road","latitude":null,"longitude":null,"contact_phone":"example-phone","is_active":true,"is_accepting_orders":true,"is_open":true,"hours":[{"weekday":5,"opens_at":"08:00:00","closes_at":"20:00:00","closes_next_day":false}],"version":1,"updated_at":"2026-10-16T03:00:00.000Z"}}
{"Dish":{"id":"101","restaurant_id":"10","category_id":"2","name":"Example rice dish","description":"Rice and vegetables","price_vnd":"45000","image_reference":null,"is_visible":true,"is_available":true,"version":1,"updated_at":"2026-10-16T03:00:00.000Z"}}
{"PickupPoint":{"id":"3","name":"Example VJU gate","latitude":"21.000000","longitude":"105.500000","is_active":true,"version":1}}
{"Payment":{"order_id":"2048","method":"cash","status":"unpaid","confirmed_by":null,"confirmed_at":null,"refunded_by":null,"refunded_at":null,"version":1,"updated_at":"2026-10-16T03:00:00.000Z"}}
{"CommissionEntry":{"id":"301","restaurant_id":"10","order_id":"2048","kind":"base","amount_vnd":"9000","reason":null,"actor_id":"5","settlement_id":null,"created_at":"2026-10-16T04:00:00.000Z"}}
{"Settlement":{"id":"401","restaurant_id":"10","period_start_at":"2026-09-30T17:00:00.000Z","period_end_at":"2026-10-31T17:00:00.000Z","created_by":"9","created_at":"2026-11-01T03:00:00.000Z","receivable_vnd":"9000","collected_vnd":"5000","outstanding_vnd":"4000"}}
{"Receipt":{"id":"501","settlement_id":"401","amount_vnd":"5000","received_at":"2026-11-01T02:00:00.000Z","recorded_by":"9","reference":null,"note":null,"created_at":"2026-11-01T03:00:00.000Z"}}
```

Management `Restaurant` adds `owner_id`; browsing omits it. Financial policy/rate is exposed through authorized finance endpoints, not public catalog data. `Order` below is shared between its student and current owner; `commission_rate_snapshot` is included only in the owner projection. The stored snapshot always exists.
Write schemas: `Register` = required `login_identifier,password,display_name,email,requested_role`, optional nullable `phone`; `requested_role` is `student|restaurant_owner|admin` and does not set the account's role. `Login` = required `login_identifier,password`. Apply §2 username/password policy and §3 text limits; never truncate passwords to a database hash-column length. A repeated password is checked by the browser and is never sent.
`RestaurantCreate` = required `name,address,contact_phone,owner_id`; optional paired nullable coordinates and `is_active` (default true). Server sets `is_accepting_orders=false`, hours empty and version 1. Owner must be a valid active `restaurant_owner`; no ownerless create or implied commission default.
`RestaurantAdminPatch` = `expected_version` plus at least one of `name,address,contact_phone,latitude,longitude,owner_id,is_active`. `RestaurantOwnerPatch` = `expected_version` plus at least one of `name,address,contact_phone,latitude,longitude,hours,is_accepting_orders`; no owner/rate/activation reassignment. Changes to location invalidate relevant delivery quotes; surveyed data must remain valid before accepting orders.
`DishCreate` = required `name,description,price_vnd,category_id`, optional `image_reference:null,is_visible:true,is_available:true`. `DishPatch` = `expected_version` plus any create fields; restaurant ID is immutable. Image-reference validation/storage/upload design TBD; no upload endpoint or 5 MB rule is implied.
`SurveyPolicy` = `{"restaurant_id":"10","version":1,"pickup_rates":[{"pickup_point_id":"3","distance_m":450,"delivery_fee_vnd":"5000","is_enabled":true}]}`. PUT takes `expected_version` and a complete `pickup_rates` array; unique active point IDs, required row fields, omitted pairs become unserviceable; empty array disables all surveyed delivery. Version 0 means create-only if no policy exists.
`AdjustmentCreate` = required `order_id,amount_vnd,reason`; signed amount, nonblank reason; referenced completed order must already have a base entry. `ReceiptCreate` = required `amount_vnd,received_at`, optional nullable `reference,note`; amount positive. `SettlementCreate` = required `restaurant_id,period_start_at,period_end_at,entry_ids`; nonempty unique entry IDs, end > start, same restaurant and currently unassigned entries.

## 7. Endpoint template and catalog

Every endpoint uses the same eight fields in the tables: **Purpose/trace**, **Method/path**, **Permission**, **Input**, **Success (status/JSON shape)**, **Failure/UI**, **Effects**, **Retry**. Named DTOs and their examples in §§6, 8–10 are part of every referencing endpoint. Path IDs are required; unspecified body fields are forbidden. List query rules are §3.
Retry codes: `R` read/recompute safe; `V` version-checked mutation—after an unknown result, GET before retry; `K` durable key required (§5); `N` naturally repeatable authorized state/no-op; `C` unkeyed create—do not blindly repeat after an unknown result. All writes include transactional audit where required by architecture.

### 7.1 Authentication and profile — MVP

| Purpose/trace | Method/path | Permission | Input | Success | Failure/UI | Effects | Retry |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Register; US01/FR01 | POST `/auth/register` | Unauthenticated | `Register` | 201 `One<User>`; login after email verification | 409 username/email taken; 422 fields; 503 SMTP unconfigured → no account, delivery failure → resend | Hash password, create unverified Student and optional pending role request; send email code | C; recover through verification/resend |
| Verify email | POST `/auth/verify-email` | Unauthenticated | `login_identifier,code` | 200 `One<User>` | 422 invalid/expired/exhausted code | Mark email verified; code single-use | C |
| Resend email code | POST `/auth/resend-email-code` | Unauthenticated | `login_identifier` | 200 `One<{accepted:true}>` | 429 within 60 seconds; 503 SMTP delivery | Replace code for an unverified account; generic response for absent/verified account | C |
| Authenticate; US01 | POST `/auth/login` | Unauthenticated | `Login` | 200 `One<User>`; set access and CSRF cookies per §2 | 401 `INVALID_CREDENTIALS`, generic message for unknown/wrong/inactive/unverified account; 429 backoff | Issue new 15-minute JWT and bound CSRF token | Safe retry; each success replaces browser session cookies |
| Recover identity; US01 | GET `/auth/me` | Self | None | 200 `One<User>` | 401 → login | None | R |
| End browser session; US01 | POST `/auth/logout` | Self + CSRF | Empty JSON object | 200 `One<User>`; clear both cookies | 401 expired → clear client view | Increment `auth_version`; all account JWTs become invalid | N; repeated logout after clearing cookies is locally complete |
| Contact profile; US01 | PATCH `/profile` | Self | `expected_version`; one or both `display_name,phone` | 200 `One<User>` | 409 version → reload; 422 fields | Update contact only; old order recipients unchanged | V |

Email codes are six digits, expire after 10 minutes, allow five incorrect attempts, and may be resent after 60 seconds. Hash codes with a backend-only HMAC key; never store/log plaintext. Email is canonical lowercase ASCII, unique, and required for new registrations. Existing accounts retain nullable email for a forward migration; they keep their existing login access. SMTP settings are backend-only. The `User` projection adds nullable `email` and `email_verified`; an existing account without email reports verified for legacy compatibility. A failed SMTP send leaves the unverified account available for resend.

| Purpose/trace | Method/path | Permission | Input | Success | Failure/UI | Effects | Retry |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pending role requests; US16 | GET `/admin/role-requests` | Admin | None | 200 first 100 pending, email-verified active applicants | 403 for other roles | None | R |
| Review role request; US16 | PATCH `/admin/role-requests/{id}` | Admin + CSRF | `decision: approve|reject` | 200 reviewed status | 409 stale/ineligible; 403 non-Admin | Approval changes role, increments auth version, and audits; rejection retains Student | V |

No `/auth/refresh` exists. Initial privileged account creation uses the controlled, audited provisioning mechanism in deployment §6. Restaurant assignment accepts an existing active owner ID. Credential reset remains a controlled operator procedure until a separate recovery contract is approved.

### 7.2 Restaurants and dishes — MVP

| Purpose/trace | Method/path | Permission | Input | Success | Failure/UI | Effects | Retry |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Discover restaurants; US02–03 | GET `/restaurants` | B | Catalog query | 200 `List<Restaurant>` | 422 filters → fix | None; active catalog only | R |
| Menu context; US03 | GET `/restaurants/{restaurant_id}` | B | Path ID | 200 `One<Restaurant>` | 404 hidden/missing → browse | None | R |
| Discover/menu dishes; US02–03 | GET `/dishes` | B | Catalog query; `restaurant_id` selects menu | 200 `List<Dish>` | 422 filters → fix | None; visible catalog only | R |
| Dish detail; US03 | GET `/dishes/{dish_id}` | B | Path ID | 200 `One<Dish>` | 404 hidden/inactive parent/missing | None | R |
| Category choices; FR02/07 | GET `/dish-categories` | B | `limit,cursor,sort=name` | 200 `{"data":[{"id":"2","name":"Rice"}],"page":{"next_cursor":null,"has_more":false}}` | Common errors | None; taxonomy/write permissions TBD | R |
| Owner restaurant switcher; US12 | GET `/owner/restaurants` | restaurant_owner | List query | 200 `List<Restaurant>` with `owner_id` | Common errors | None; current owned active/inactive restaurants | R |
| Operate own restaurant; US12 | PATCH `/owner/restaurants/{restaurant_id}` | O | `RestaurantOwnerPatch` | 200 `One<Restaurant>` management projection | 409 version; 422 hours → fix | Operational fields/hours only, invalidate relevant quotes | V |
| Admin partner list; US16 | GET `/admin/restaurants` | A | List query, admin filters | 200 `List<Restaurant>` management projection | Common errors | None, includes inactive | R |
| Create partner; US16 | POST `/admin/restaurants` | A | `RestaurantCreate` | 201 `One<Restaurant>` management projection | 422 invalid owner → select valid owner | Create partner; commission/survey setup separate | C |
| Edit/assign/reactivate partner; US16 | PATCH `/admin/restaurants/{restaurant_id}` | A | `RestaurantAdminPatch` | 200 `One<Restaurant>` management projection | 409 version; 422 invalid owner | New current owner scope, partner changes; retain history | V |
| Delete/deactivate partner; US16/§7 | DELETE `/admin/restaurants/{restaurant_id}` | A | Path ID; no body | 200 `DeletionOutcome` (§10) | 404 absent; explain actual outcome | Delete only if no orders/settlements; otherwise deactivate | N; GET after unknown result; deleted ID later 404 |
| Manage entire menu; US11 | GET `/owner/restaurants/{restaurant_id}/dishes` | O | List query, visibility/availability filters | 200 `List<Dish>` | Common errors | None; includes hidden/sold-out | R |
| Add dish; US11 | POST `/owner/restaurants/{restaurant_id}/dishes` | O | `DishCreate` | 201 `One<Dish>` | 422 category/price/reference → fix | Create dish in path restaurant | C |
| Edit/hide/show dish; US11 | PATCH `/owner/restaurants/{restaurant_id}/dishes/{dish_id}` | O | `DishPatch` | 200 `One<Dish>` | 409 version; 422 fields | Update current menu; preserve order snapshots | V |
| Delete/hide dish; US11/§7 | DELETE `/owner/restaurants/{restaurant_id}/dishes/{dish_id}` | O | Both path IDs; no body | 200 `DeletionOutcome` (§10) | 404 missing/wrong restaurant | Physical delete only if never ordered; otherwise hide | N; deleted ID later 404 |

### 7.3 Pickup points and delivery quotes — MVP

| Purpose/trace | Method/path | Permission | Input | Success | Failure/UI | Effects | Retry |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Select fixed destination; US04/BR10 | GET `/pickup-points` | B | `limit,cursor,sort=name` | 200 `List<PickupPoint>` | Common errors | None; active points only | R |
| Read survey policy; US12/BR10 | GET `/owner/restaurants/{restaurant_id}/delivery-policy` | O | Path ID | 200 `One<SurveyPolicy>` | 404 absent policy | None | R |
| Set surveyed fees; US12/BR09–10 | PUT `/owner/restaurants/{restaurant_id}/delivery-policy` | O | SurveyPolicy write schema §6 | 200 `One<SurveyPolicy>` | 409 version; 422 invalid/missing point | Replace surveyed configuration; bump policy/survey versions | V |
| Quote exact pair; US04/BR07–10 | POST `/delivery-quotes` | S | Required `restaurant_id,pickup_point_id` | 200 `One<DeliveryQuote>` (§8) | 422 unavailable/unserviceable → choose point/retry; never display unknown as zero | Compute/authenticate quote; no order/payment | R; new quote requires renewed consent if changed |

Pickup-point creation/edit/deactivation permissions and provisioning workflow are **TBD**; do not infer an admin CRUD API from the mockup. An enabled surveyed pair is required. Missing fee/distance is 422, not a successful quote with invented zero values. AI/map outage does not block a valid surveyed MVP quote.

### 7.4 Orders and payments — MVP

| Purpose/trace | Method/path | Permission | Input | Success | Failure/UI | Effects | Retry |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Place order; US05–07/BR01–06 | POST `/orders` | S | `Idempotency-Key`; exact §8 payload | 201 `One<Order>`; replay 200 | 409 price/quote/key; 422 eligibility/policy; preserve draft/reconfirm | Atomic pending order, items/snapshots, unpaid payment, history/audit/key | K |
| Recover own orders; US07/NFR05 | GET `/orders` | S | Order query §3 | 200 `List<OrderSummary>` (§8) | Common errors | None; only actor's orders; history/reorder UI later | R |
| Track durable order; US07 | GET `/orders/{order_id}` | Owning S or O | Path ID | 200 `One<Order>` (§8) | 404 other actor/missing | None; snapshots plus current independent states | R |
| Incoming/active orders; US13 | GET `/owner/restaurants/{restaurant_id}/orders` | O | Order query §3 | 200 `List<OrderSummary>` | Common errors | None; include existing orders if restaurant deactivated | R |
| Cancel own pending; US07/BR15–19 | POST `/orders/{order_id}/cancel` | Owning S only | Empty object `{}` | 200 `One<Order>`; cancelled is no-op | 409 state → refetch; after acceptance no direct cancel | pending→cancelled, history/audit; QR rules later | N |
| Fulfill/reject; US13/BR17–19 | POST `/orders/{order_id}/transitions` | O only | `{"status":"accepted"}`; rejection also requires `reason` ≤1000 | 200 `One<Order>` | 409 state → refresh actions; 422 missing reason | Legal transition; completed + unique base commission atomic | N |
| Read separate payment; US06/14 | GET `/orders/{order_id}/payment` | Owning S or O | Path ID | 200 `One<Payment>` | Common errors | None | R |
| Verify cash received; US14/BR11–13 | POST `/orders/{order_id}/payment/confirm` | O only | `{}`; optional nullable `evidence_reference` ≤2048 | 200 `One<Payment>` | 409 payment state → refresh; 422 unsupported method | unpaid→paid, actor/time/history/audit after real verification | N; repeat paid no-op |

No server cart API is needed: cart is a frontend draft. No general order PATCH, student payment-confirmation, admin fulfillment or payment-method-change endpoint exists in this contract. Evidence references are protected metadata, not proof accepted solely from a student.

### 7.5 Commission and settlement — MVP minimal operations

| Purpose/trace | Method/path | Permission | Input | Success | Failure/UI | Effects | Retry |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Read current rate; US15/17 | GET `/restaurants/{restaurant_id}/commission-policy` | O or A | Path ID | 200 `{"data":{"restaurant_id":"10","rate":"0.10000000","version":1}}` | 404 missing → setup needed | None | R |
| Configure future rate; US17/BR24 | PUT `/restaurants/{restaurant_id}/commission-policy` | A only | `rate,expected_version`; 0=create-only | 200 policy shape above | 409 version; 422 precision/range | Versioned rate; never recalculate old orders | V |
| Read financial entries; US15/17 | GET `/commission-entries` | O scoped to owned restaurants or A all | List query; `restaurant_id,order_id,settlement_id,kind,assigned` | 200 `List<CommissionEntry>` | 404 forbidden target; 422 filters | None; base/adjustment and signed amounts | R |
| Correct commission; US17/BR23 | POST `/commission-adjustments` | A | `Idempotency-Key`; `AdjustmentCreate` | 201 `One<CommissionEntry>` kind adjustment; replay 200 | 422 base required; 409 key reuse | Append adjustment linked to completed order; no overwrite | K |
| List reconciliation periods; US17 | GET `/settlements` | O own or A all | List query; restaurant filter | 200 `List<Settlement>` | Common errors | None; no invented settlement status | R |
| Group entries; US17/BR25 | POST `/settlements` | A | `SettlementCreate` | 201 `One<Settlement>` | 409 entry assigned → refetch; 422 mixed restaurants/period | Atomic settlement and one-time assignment of all selected entries | C; inspect existing assignments after unknown result |
| Reconcile one period; US15/17 | GET `/settlements/{settlement_id}` | O for settlement's restaurant or A | Path ID | 200 `One<Settlement>` | 404 other owner's period | None; authoritative totals | R |
| Read receipt history; US17/BR26 | GET `/settlements/{settlement_id}/receipts` | O for restaurant or A | List query; sort `received_at,-received_at` (default descending, ID tie-breaker) | 200 `List<Receipt>` | Common errors | None; append-only history | R |
| Record manual collection; US17/BR27 | POST `/settlements/{settlement_id}/receipts` | A | `Idempotency-Key`; `ReceiptCreate` | 201 `One<Receipt>`; replay 200 | 409 key reuse; 422 amount/reference | Append receipt/audit/key; does not transfer money | K |

Commission is rounded half-up **once per completed order**: `(subtotal_vnd × scaled_rate + 50000000) div 100000000`, where `scaled_rate=rate×100000000`; delivery is excluded. No payment prerequisite for completion/base accrual. Cancelled/rejected orders have no base. Each completed order has at most one base; each entry at most one same-restaurant settlement.
Receivable = assigned base + adjustments; collected = receipts; outstanding = receivable − collected. Do not clamp negative balances or multiply joined receipts/entries. No edit/delete financial-history endpoints. Settlement creation has no promised durable key because the source request table supports only receipts/adjustments; uncertain results must be reconciled before a new create.
Settlement overlap/closure, late-adjustment period membership, overcollection limits and receipt correction/reversal are **TBD**. Do not silently choose a period algorithm or enable unresolved exceptions. Explicit entry selection does not establish those policies; approved membership rules remain a rollout gate for affected reconciliation cases.

### 7.6 AI recommendations — MVP

| Purpose/trace | Method/path | Permission | Input | Success | Failure/UI | Effects | Retry |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Suggest eligible dishes; US08/BR28–31 | POST `/ai/recommendations` | S | Required `pickup_point_id,budget_vnd,preferences`; preferences plain-text string (limit TBD) | 200 `RecommendationResult` below; empty suggestions permitted | 422 destination/budget; 503 AI unavailable; 504 AI timeout → manual browsing/retry | Backend candidate validation only; no order/chat storage | R; suggestions can change |

```json
{"data":{"suggestions":[{"dish_id":"101","restaurant_id":"10","quantity":1,"unit_price_vnd":"45000","delivery_fee_vnd":"5000","estimated_total_vnd":"50000","reason":"Matches the supplied preferences."}],"generated_at":"2026-10-16T03:00:00.000Z"}}
```

Budget meaning (dish-only versus delivery-inclusive), preference schema/limits and provider are **TBD** before finalizing this DTO in OpenAPI; `estimated_total_vnd` always displays dish + delivery and is not consent or a quote artifact. Do not silently choose the budget filtering rule. Never pass names, phones, detailed addresses or identifying destination coordinates to AI. Backend sends minimal eligible candidate data/coarse pickup context, validates returned IDs and rechecks availability/deliverability. AI supplies no authoritative price/fee and cannot create orders.
Target ≥95% within 5 seconds; at 10 seconds show retry/manual fallback, not an absolute guaranteed latency. Selecting a suggestion follows the normal cart, fresh quote and checkout contract.

## 8. Exact checkout, quote and conflict contracts

### 8.1 Successful delivery quote

`POST /delivery-quotes` body: `{"restaurant_id":"10","pickup_point_id":"3"}`. Success is 200:

```json
{"data":{"quote_artifact":"opaque-server-authenticated-quote-A","schema_version":1,"source":"survey","restaurant_id":"10","policy_version":4,"pickup_point_version":1,"survey_version":2,"destination":{"pickup_point_id":"3","pickup_point_name":"Example VJU gate","text":"Example VJU gate","latitude":"21.000000","longitude":"105.500000"},"distance_m":450,"delivery_fee_vnd":"5000","issued_at":"2026-10-16T03:00:00.000Z","expires_at":null,"matched_tier":null}}
```

The artifact is an opaque **server-authenticated** representation binding all quote fields, destination and configuration versions; clients return it unchanged. Its encoding/authentication algorithm is **TBD**, not necessarily JWT, and is not a provider token. The parsed object is `DeliveryQuote`; the stored `delivery_quote_snapshot` contains its explanation fields without the opaque artifact. Survey expiry may be null; every new order still checks current versions, eligibility and surveyed values. Route quotes must expire; TTL and route-distance normalization are TBD.

### 8.2 Exact create-order request

`POST /api/v1/orders`, `Content-Type: application/json`, `Idempotency-Key: checkout-example-01`, with finalized JWT/CSRF transport:

```json
{
  "restaurant_id":"10",
  "items":[{"dish_id":"101","quantity":2,"accepted_unit_price_vnd":"45000"}],
  "pickup_point_id":"3",
  "recipient":{"name":"Example Student","phone":"example-phone"},
  "payment_method":"cash",
  "accepted_delivery_quote":{
    "quote_artifact":"opaque-server-authenticated-quote-A",
    "policy_version":4,"pickup_point_version":1,"survey_version":2,
    "distance_m":450,"delivery_fee_vnd":"5000"
  }
}
```

All displayed fields are required for MVP. `items` must be nonempty, dish IDs unique, quantities positive, and all dishes from the specified restaurant. Recipient name/phone are required with §3 limits; phone syntax TBD. No total, rate, student ID or order status is accepted from the client. The accepted price/fee express consent, not authority. The server verifies the artifact and matches restaurant, point, versions, distance and fee to its decoded content/current configuration.
Under one transaction, recheck active account, active/open/accepting restaurant, visible/available dishes, active pickup point/enabled surveyed pair, valid quote and configured commission rate. Compute exact amounts and compare **each** accepted unit price and fee (not only aggregate total). Invalid/tampered artifact → 422 `VALIDATION_ERROR`; valid but superseded quote → 409 `QUOTE_STALE`; changed price/fee → 409 `PRICE_OR_FEE_CHANGED` (takes precedence when a new valid quote can be returned). No partial order on any failure.

### 8.3 Exact 409 changed-price/fee response

This fixture changes unit price 45000→48000 and delivery 5000→8000; quantity remains 2. All `current` values are backend-authoritative at response time, still revalidated upon resubmission.

```json
{
  "error":{
    "code":"PRICE_OR_FEE_CHANGED",
    "message":"Prices or delivery fees changed. Review and confirm again.",
    "field_errors":[],"request_id":"req_conflict_example","retryable":false,
    "details":{
      "restaurant_id":"10","pickup_point_id":"3","requires_reconfirmation":true,
      "items":[{"dish_id":"101","dish_name":"Example rice dish","quantity":2,"accepted_unit_price_vnd":"45000","current_unit_price_vnd":"48000","current_line_total_vnd":"96000"}],
      "accepted":{"subtotal_vnd":"90000","delivery_fee_vnd":"5000","total_vnd":"95000"},
      "current":{"subtotal_vnd":"96000","delivery_fee_vnd":"8000","total_vnd":"104000"},
      "current_delivery_quote":{
        "quote_artifact":"opaque-server-authenticated-quote-B","schema_version":1,"source":"survey",
        "restaurant_id":"10","policy_version":5,"pickup_point_version":1,"survey_version":3,
        "destination":{"pickup_point_id":"3","pickup_point_name":"Example VJU gate","text":"Example VJU gate","latitude":"21.000000","longitude":"105.500000"},
        "distance_m":450,"delivery_fee_vnd":"8000","issued_at":"2026-10-16T03:01:00.000Z","expires_at":null,"matched_tier":null
      }
    }
  }
}
```

Return every requested item with accepted/current unit prices and current line totals, including unchanged items. UI shows old→new amounts and total, then explicit confirmation or return-to-cart. After consent, replace each accepted unit price and all accepted quote fields from `current_delivery_quote`, retain recipient/quantities, and submit with a **new key**. Never auto-accept/resubmit new prices.
`QUOTE_STALE` uses the same details shape when a replacement quote is available, even if amounts stayed equal. When no valid current quote exists, return the relevant 422/503 with `details:{"restaurant_id":"10","pickup_point_id":"3","current_delivery_quote":null}` and block confirmation; do not fabricate authoritative totals/fee. If a dish or restaurant is no longer orderable, return 422 with affected IDs/reason, not a purchasable replacement quote.

### 8.4 Created/read Order representation

201 new / 200 read or replay; `Location: /api/v1/orders/2048` on creation. This is the student projection:

```json
{"data":{
  "id":"2048","restaurant_id":"10","status":"pending","version":1,
  "items":[{"dish_id":"101","dish_name_snapshot":"Example rice dish","unit_price_vnd":"45000","quantity":2,"line_total_vnd":"90000"}],
  "recipient":{"name":"Example Student","phone":"example-phone"},
  "destination":{"pickup_point_id":"3","pickup_point_name":"Example VJU gate","text":"Example VJU gate","latitude":"21.000000","longitude":"105.500000"},
  "distance_m":450,"subtotal_vnd":"90000","delivery_fee_vnd":"5000","total_vnd":"95000",
  "delivery_quote_snapshot":{"schema_version":1,"source":"survey","restaurant_id":"10","policy_version":4,"pickup_point_version":1,"survey_version":2,"destination":{"pickup_point_id":"3","pickup_point_name":"Example VJU gate","text":"Example VJU gate","latitude":"21.000000","longitude":"105.500000"},"distance_m":450,"delivery_fee_vnd":"5000","issued_at":"2026-10-16T03:00:00.000Z","expires_at":null,"matched_tier":null},
  "payment":{"order_id":"2048","method":"cash","status":"unpaid","confirmed_by":null,"confirmed_at":null,"refunded_by":null,"refunded_at":null,"version":1,"updated_at":"2026-10-16T03:00:00.000Z"},
  "history":[{"from_status":null,"to_status":"pending","order_version":1,"reason":null,"created_at":"2026-10-16T03:00:00.000Z"}],
  "created_at":"2026-10-16T03:00:00.000Z","updated_at":"2026-10-16T03:00:00.000Z","completed_at":null
}}
```

Owner projection adds `commission_rate_snapshot:"0.10000000"`; no student can select another projection. `OrderSummary` is exactly `id,restaurant_id,status,version,subtotal_vnd,delivery_fee_vnd,total_vnd,payment,created_at,updated_at,completed_at` from this object; fetch detail for recipient/items/history. Recipient/destination, dish names/prices, quote/distance/fee, totals and rate are immutable snapshots. A live restaurant label is not a historical snapshot. A profile/menu/policy edit cannot change an old order.

## 9. Order and payment state commands

| Endpoint/target | Allowed source | Authorized actor | Result |
| --- | --- | --- | --- |
| `/orders/{order_id}/cancel` → cancelled | pending | Student owning order | Cancel; no commission. |
| `/orders/{order_id}/transitions` → accepted | pending | Current owner of restaurant | Accept. |
| Same → rejected | pending | Current owner; nonblank reason mandatory | Reject with reason visible to student; no commission. |
| Same → delivering | accepted | Current owner | Start restaurant's delivery. |
| Same → completed | delivering | Current owner | Mark completed and create one base commission atomically. |

Only these edges exist; `completed,rejected,cancelled` are terminal. Requesting the current target is a no-op after role/ownership/input checks. `status` accepts only `accepted,rejected,delivering,completed` on the owner endpoint; only rejection accepts/requires `reason`. Student after acceptance uses support only when that post-MVP feature exists. Never add `preparing`, `shipping`, admin override or completed→cancelled.
State conflict example: `{"error":{"code":"ORDER_STATE_CONFLICT","message":"This action is no longer available.","field_errors":[],"details":{"order_id":"2048","requested_status":"cancelled","current_status":"accepted","current_version":2,"allowed_actions":[]},"request_id":"req_race","retryable":false}}`. Allowed actions are actor-specific path action names (`cancel`,`accepted`,`rejected`,`delivering`,`completed`), not global permissions. Refetch the order; never force a losing transition.
Cash confirmation is owner-verified `unpaid→paid`; repeated paid confirmation is a no-op. Payment confirmation neither completes the order nor records a platform settlement receipt. Completion does not imply payment, and unpaid does not prohibit completion. Invalid payment changes return 409 with `order_id,current_status,current_version` for the payment resource.
Poll active order details/owner lists about every 5 seconds while visible, without overlapping calls; pause hidden/offline, back off on failure, refresh on return. Stop order polling at terminal status; payment can continue separately. Compare order/payment versions independently so stale responses never overwrite newer state.

## 10. Delete outcomes and UI behavior

Each DELETE returns exactly one discriminated `DeletionOutcome`; `resource_type` is `dish` or `restaurant`:

```json
{"data":{"resource_type":"dish","id":"102","outcome":"deleted","reason":"NO_ORDER_HISTORY"}}
{"data":{"resource_type":"dish","id":"101","outcome":"hidden","reason":"ORDER_HISTORY_EXISTS","is_visible":false}}
{"data":{"resource_type":"restaurant","id":"10","outcome":"deactivated","reason":"ORDERS_OR_SETTLEMENTS_EXIST","is_active":false}}
{"data":{"resource_type":"restaurant","id":"11","outcome":"deleted","reason":"NO_ORDERS_OR_SETTLEMENTS"}}
```

UI obtains confirmation before DELETE and reports the actual returned outcome. Hidden dishes accept no new orders; deactivated restaurants disappear from student discovery and accept no new orders. Existing orders, current owner's historical access and unpaid commissions remain. Deleting an unused restaurant removes unused menu/configuration and only that management relationship; never delete its owner's account or other restaurants. History checks and audit share the transaction/locks with deletion, including concurrent order creation.

## 11. Post-MVP contracts and unresolved extensions

These paths are reserved proposals, not enabled MVP capabilities. Do not enable them until their TBD schemas/security/business rules are finalized in OpenAPI.

| Purpose/trace | Method/path | Permission | Input | Success | Failure/UI | Effects | Retry |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Route quotes; US04 | POST `/delivery-quotes` extension | S | `restaurant_id` plus free address/map-pin destination instead of pickup point; exact union/geocoding DTO TBD | 200 `One<DeliveryQuote>` source route, nonnull expiry/matched tier | 422 outside range/coverage; 503 provider → retry/valid fixed point | Route calculation before transaction; no order | R |
| Route policy; US12 | PUT `/owner/restaurants/{restaurant_id}/delivery-policy` extension | O | expected version, route limit and fee tiers; mode/union DTO TBD | 200 policy DTO TBD | 422 overlap/gap/invalid range → fix | Versioned policy; `[min,max)`, final max inclusive | V |
| Configure QR; US14 | PUT `/owner/restaurants/{restaurant_id}/qr-settings` | O | `qr_reference,expected_version`; representation/security TBD | 200 QR settings DTO TBD | 422 invalid QR reference | Restaurant-provided payment reference only | V |
| Read QR for own order; US06 | GET `/orders/{order_id}/payment-instructions` | Owning S or O | Path ID | 200 instructions DTO TBD | 422 QR disabled/unconfigured | No payment status effect | R |
| Confirm transfer; US14 | POST `/orders/{order_id}/payment/confirm` extension | O | Evidence requirements TBD | 200 `One<Payment>` | 409 state; no student self-confirm | Record verified receipt; terminal cancelled/rejected order becomes refund_pending, never reopens | N |
| Record direct refund; BR14 | POST `/orders/{order_id}/payment/confirm-refund` | O | Evidence/reason DTO TBD | 200 `One<Payment>` refunded | 409 not refund_pending | Restaurant refunds externally; record actor/time/history | N; refunded repeat no-op |
| Completed-order report; US15/17 | GET `/restaurants/{restaurant_id}/commission-report` | O or A | `from,to` based on completed_at | 200 report DTO TBD | 422 invalid period | Read backend dish revenue/commission, never current-rate reconstruction | R |
| Random eligible dish; US09 | POST `/recommendations/random` | S | Eligibility/budget/destination DTO TBD | 200 selection DTO TBD | 422 no eligible result | No order; same real-data validation as AI | R; selection may differ |

Paid QR cancellation/rejection records `refund_pending` in the same order transition transaction. Late verified QR receipt on a cancelled/rejected order records confirmation and refund obligation together; only owner records `refund_pending→refunded`. Other refund transitions and exceptional cash refunds remain TBD. Scanning QR or “I transferred” never marks paid; there is no payment-gateway webhook assumed.
Reorder (US10) builds a new client intent from history, refreshes current catalog/quote and calls the existing order endpoint with new consent/key; a convenience reorder endpoint/DTO is TBD. Support (US18) requires an order link; workflow/endpoints TBD. Reviews/favorites (US19–20), audit-log browsing permissions/DTOs, image uploads and category management are TBD; audit **writing** is already mandatory in MVP. Do not create extra APIs solely because controls appear in HTML.

## 12. OpenAPI handoff and implementation gates

The companion **`docs/data/openapi.yaml` (to be authored; not included or claimed to exist)** is the detailed machine-readable contract: every enabled path, request/response schema, conditional field, enum, format, error code, security scheme, header, pagination rule and example must match this Markdown. Generate client/server DTO checks from it. Markdown remains the business explanation; OpenAPI must not override requirements or silently resolve a TBD.
Before enabling each group, resolve its remaining TBDs and update both documents in one reviewed change: quote artifact protection and any TTL; point provisioning; AI budget/preference meaning; selected AI/map/media providers; post-MVP QR evidence/representation and financial exception/period policies. Do not choose providers or auth/session mechanisms from mockup data.
Required implementation verification: shared JSON schema/examples; exact integer/rate/half-up arithmetic; changed-price/fee reconfirmation; concurrent same-key same/different content; response-loss recovery; accept/cancel race; cross-account/nested-resource access; repeated completed/payment with no duplicate effects; rollback on failed audit/base commission; competing settlement assignment; financial retry deduplication; history-preserving deletion; AI/map failure with manual surveyed ordering intact.
These are acceptance requirements, not claims that backend tests have run. Next handoff: settle the relevant TBDs, author/validate OpenAPI, then implement frontend and backend against the same enabled schemas and examples.
