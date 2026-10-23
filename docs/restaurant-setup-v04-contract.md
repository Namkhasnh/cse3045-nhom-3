# V0.4 restaurant setup contract

Authority: requirements US11/12/17, FR03/07/09, AC15; DEC-04/05 and scoped P13 media approval. User approved the V0.4 implementation plan October 19, 2026. Acceptance uses synthetic local data only.

## P11 settings and readiness

`GET /owner/restaurants` returns zero-or-one management context (currently 404 when none); `GET/PATCH /owner/restaurants/{id}` are current-owner only. `GET /admin/restaurants?cursor={id}` lists 20 by ascending ID; `GET/PATCH /admin/restaurants/{id}` require sole MFA Admin. Reads and writes recheck active actor and ownership/authority transactionally. Management reads are no-store.

Owner PATCH requires `expected_version` and one or more name/address/contact_phone/paired latitude-longitude/hours/is_accepting_orders. Admin PATCH permits profile fields and is_active only. No owner reassignment, direct readiness or rate writes. Existing API text limits apply; coordinates are paired nulls or decimal strings with six places. Business contact is explicitly published, never copied from an account implicitly.

Hours are a whole replacement array, maximum 56 intervals, weekday1=Monday..7=Sunday and HH:mm:ss local times. Empty array means closed. Positive intervals up to24h, explicit closes_next_day, no overlap including Sunday/Monday; adjacent intervals permitted. Open boundary inclusive, close exclusive in Asia/Ho_Chi_Minh.

Management projection: profile, hours, active/accepting/open, version/timestamp, readiness and checklist booleans profile/hours/menu/delivery/commission. Readiness is derived by backend; active/open/accepting are separate. Until P12–P14 supply their validated ports, corresponding dependencies remain false. P11 acceptance therefore never enables sales.

PATCH uses account→authority when needed→restaurant locks and conditional version update. Conflict409 requires GET and deliberate resubmission. Unknown results require GET before another write. Audit failure rolls back profile/hours/version/readiness together. Runtime receives scoped profile/readiness UPDATE and hours INSERT/DELETE; ownership remains protected. Production grants are reviewable artifacts only.

## Approved subsequent decisions

DEC-05: owner proposes surveyed restaurant–point fees/distances; Admin verifies/approves or rejects with reason. Current approved version remains usable while replacement waits. Restaurant address/coordinate or point location edits invalidate affected surveys. Known zero is valid; missing never becomes zero. Quote uses a random opaque token, hash at rest, immutable bound fields/versions and15minute expiry. No recipient/contact information in quote persistence.

P13: Admin manages shared categories (create/rename only). Dish media uses separate local MinIO storage from private onboarding evidence; JPEG/PNG at most5MiB,4096×4096 and16million pixels, decode/reencode without metadata, one current image per dish. No arbitrary URL input. Production provider remains DEC-10.

DEC-04: negotiated3–5%, cap5%, no default. Admin proposes exact rate and agreement, current owner explicitly confirms its version/hash. Old agreed rate remains effective until confirmation; first proposal cannot enable sale before confirmation. Changes affect future orders only.

## Acceptance boundaries

P11→P12→P13→P14 acceptance is sequential. Orders/checkout/ledger creation remain P15/P16 and later scope. No retained database migration, real partner configuration, production upload or commercial launch is authorized by local acceptance. See progress records for actual evidence.

## P12 enabled interfaces

Public `GET /pickup-points`; Admin `GET/POST /admin/pickup-points`, `PATCH /admin/pickup-points/{id}`. Lists ascending ID, limit100 and cursor; inactive points only in Admin projection. POST/PATCH require Idempotency-Key; patch requires expected_version. Name≤200 and coordinate strings with six decimal places. No point deletion API.

Owner `GET/PUT /owner/restaurants/{id}/delivery-policy`; PUT requires key, expected_version (0=create) and complete pickup_rates array≤100. Each row has point ID, whole metres0–1000000, exact fee string0–100000000VND and enabled boolean. PUT creates an immutable proposal, not active rates. Omitted pairs become disabled only after approval. Read includes current rates with is_verified and proposal/review history.

Admin `GET /admin/delivery-proposals?cursor`, `POST /admin/delivery-proposals/{id}/review` with key, expected_version, decision approved/rejected and nonblank note≤1000. Approval rechecks captured restaurant location hash, every point/version and base policy version; stale proposal409. Approval, rate replacement/version bump, review, audit and durable result commit together. Reject leaves current approved policy unchanged.

Authenticated `POST /delivery-quotes` keeps its existing request/response shape, now expires_at always nonnull. Only active/ready public restaurant configuration is quoted; quote availability is not order authorization. Internal validation takes transaction context after caller locks account/restaurant, checks token hash/bound IDs/accepted fields, expiry and current point/policy/survey/location versions. Tampering422; superseded/expired409 QUOTE_STALE. No public validation endpoint or order write. Point edits lock affected restaurants ascending before point and recheck membership.

## P13 enabled interfaces

Owner `GET/POST /owner/restaurants/{id}/dishes`, `PATCH/DELETE /owner/restaurants/{id}/dishes/{dish_id}`: current ownership, nested IDs and expected_version on patch. Create requires Idempotency-Key. No client restaurant reassignment. Name≤200, description≤2000code points/8000UTF8bytes, exact price string0–1000000000, existing category; visibility/availability independent. Delete returns outcome deleted/hidden after transactional history-reference check; existing snapshots unchanged. Read includes hidden/sold-out.

Admin `GET/POST /admin/dish-categories`, `PATCH /admin/dish-categories/{id}`: shared category create/rename only, keys on mutations and expected_version on rename. Duplicate label409; no category deletion/lifecycle expansion.

Owner `POST /owner/restaurants/{id}/dish-media` accepts mime_type/content_base64 JSON, bounded8MiB route body and5MiB decoded file. JPEG/PNG only, maximum4096×4096 and16million pixels; reject corrupt/recognized multi-page input, decode/reencode without metadata using pinned sharp. Response contains opaque media ID/reference/MIME/size/dimensions, never object key. Dish create/patch accepts image_reference null or only a generated `/api/v1/dish-media/{id}` reference to a live asset in the same restaurant. Unattached assets are not public.

`GET /dish-media/{id}` returns sanitized bytes only while linked to a visible dish in an active/ready restaurant. Dedicated private local MinIO bucket, separate config/credentials from onboarding; backend serves public bytes with nosniff/no-store. No private-evidence fallback. Storage calls occur outside retried MySQL transactions. Superseded assets are reference-checked under restaurant lock, claimed before deletion and reject reattachment; failed deletion is retryable. Unused uploads and compensated-upload orphans age24h before local maintenance cleanup. Maintenance CLI refuses retained/nonlocal/non-test targets; production scheduler/provider remain DEC-10.

## P14 enabled interfaces and completed readiness

`GET /restaurants/{id}/commission-policy` is current-owner or sole MFA Admin only; owner alias `GET /owner/restaurants/{id}/commission-policy` remains owner-only. Both return no-store policy `{restaurant_id,version,active,proposals}`; absent consent gives active:null, never a default. Legacy rate rows are preserved but cannot satisfy readiness without matching current-owner acceptance.

Admin `PUT /restaurants/{id}/commission-policy` now creates a proposal, never immediately changes an agreed rate. Requires key, expected_version (0=no existing policy), exact rate0.03000000–0.05000000, current terms_version/terms_hash. Backend derives immutable Vietnamese agreement text from approved partnership terms plus specific percentage and future-order timing; stores SHA256 binding rate/terms/text. A new pending proposal supersedes the previous pending one under restaurant lock; agreed policy remains unchanged.

Owner `POST /owner/restaurants/{id}/commission-policy/confirm` requires key, proposal_id, expected_version, agreement_hash and consent:true. Only the current owner may confirm a still-pending version. Proposal acceptance, immutable consent, active rate/version, readiness, audit and durable result commit atomically. Confirmation makes the new rate immediately available to future order snapshots; existing orders are never updated. Accepted/superseded proposal or changed hash/base policy returns409. Same successful key/payload replays original result without duplicate consent.

Readiness now derives profile/valid weekly hours/visible available menu/current enabled verified delivery/accepted specific commission in that order under shared restaurant locking. Config changes recompute stored readiness; incomplete configuration turns accepting off; becoming ready never turns it on. Admin activation is separate; deactivation turns accepting off. Owner must explicitly enable receiving orders after active and ready. Readiness changes increment restaurant version. Point edits reserve all relevant point locks before commission reads. Cash setup readiness does not prove later QR readiness or launch acceptance.

`commissionAmount(subtotal,rate)` uses exact scaled integer arithmetic, half-up once per order, delivery excluded by its subtotal-only interface. Generic arithmetic tests may use10%; commercial configuration rejects values outside3–5%. No ledger/settlement/order execution is enabled. Existing API §3 caps and signed scalar parsing remain authoritative.

Owner survey and commission context embeds the latest100 proposals; Admin survey history has a cursor for the complete stored history. Public cart remains available to Admin, but quote issuance requires buy capability and explicitly denies sole Admin; no implicit buyer authority is introduced.
