# V0.3 onboarding implementation contract

Authority: [onboarding](onboarding.md), [decisions](decisions.md). Explicit user approval: October 19, 2026 implementation request following policy answers. No real partner, production publication or release authorization.

## Policy and terms

Canonical Vietnamese bytes: [2026-10-19.v1](terms/partnership-2026-10-19.v1.txt). SHA-256: `52498bc3ba2e3adf2545a4ee28f0a6173469f33b7c9893c274e8e0292ec8be12`. Publication/effective time for isolated local acceptance: `2026-10-19T00:00:00.000Z`; production publication NOT AUTHORIZED. Migration registers this exact immutable version in the target test installation. Never modify it after consent; publish a new version instead.

Required name/contact name ≤200 Unicode code points, address ≤1000, phone optional `+` and 9–15 digits. Evidence: exactly one front image JPEG/PNG and one business document JPEG/PNG/PDF, ≤5 MiB each. Server validates bytes and MIME, forbids arbitrary URLs. Upload JSON carries `kind`, `mime_type`, `content_base64`, and optional `applicant_id` only for MFA Admin preparing a manual invitation. File bytes go to private S3-compatible storage, metadata/hash to MySQL. Application bodies contain evidence IDs, never bytes or URLs. Max JSON body is 8 MiB only on evidence upload; other routes retain default bound.

## DTO and routes

All routes use `/api/v1`, standard envelopes, string IDs, UTC instants, closed DTOs, current account checks and CSRF/Origin on writes.

- `GET /partnership-terms/current`, `GET /partnership-terms/:version`: immutable published text/version/hash/timestamps. 503 when no current terms; 404 unknown version.
- `POST /onboarding-evidence`: upload DTO above, returns opaque evidence ID/kind/hash/MIME/size; eligible active verified applicant or MFA Admin for eligible selected user. No public file route.
- `GET /onboarding-evidence/:id`: authorized applicant/Admin only; base64 content + MIME; no-store. Uploaded but unsubmitted files readable only by uploader and applicant; other Admin access requires a submitted/proposed reference.
- `POST /restaurant-applications`: `restaurant_name,address,contact_name,contact_phone,front_image_id,business_document_id,terms_version,terms_hash,consent:true`. Current terms required on new submission. Authenticated actor is applicant; no client owner/status/rate. 201 new, 200 replay.
- `GET /restaurant-applications[/:id]`: own application/manual invitation history. Stable descending ID keyset; default limit20/max100; cursor is last canonical positive ID. No cross-user access (404).
- `POST /restaurant-applications/:id/confirm`: `expected_version,terms_hash,consent:true`; selected user confirms immutable manual invitation and retained terms. No mutation of submitted payload. 200.
- `GET /admin/restaurant-applications[/:id]`: MFA Admin protected list/detail; same pagination, optional status filter.
- `POST /admin/restaurant-applications/:id/review`: `expected_version,decision:approved|rejected,reason?`; reject requires nonblank ≤1000 reason, approve forbids reason. Manual approval uses create route below.
- `GET /admin/onboarding-users?q=...`: bounded exact username lookup only, allowlisted eligible account ID/display/username; no contacts or general account export.
- `POST /admin/restaurant-invitations`: `applicant_id` plus application fields except consent. Requires valid selected account, current terms and same evidence. Returns awaiting_confirmation record; same one-pending cap as direct applications.
- `POST /admin/restaurants`: `application_id,expected_version`; requires confirmed manual invitation, no replacement fields or silently forged consent. 201 new, 200 replay.

Each write except evidence upload has durable actor+operation+Idempotency-Key (1–128 visible ASCII), normalized closed-DTO SHA-256 and immutable result. Canonical keys sorted; IDs normalized decimal strings; preserve validated text; JSON key order does not affect hash. Evidence uploads use generated immutable storage keys; uncertain upload may leave an orphan but cannot create ownership.

Errors: 401 session, 403 authority/MFA, 404 scope concealment, 409 `RESTAURANT_LIMIT_REACHED`, `APPLICATION_PENDING`, `APPLICATION_STATE_CONFLICT`, `TERMS_VERSION_CONFLICT`, `VERSION_CONFLICT`, `IDEMPOTENCY_KEY_REUSED`; 422 validation/consent/evidence; 503 unavailable DB/storage/terms. A valid repeated approved action returns existing result after current authorization; conflicting terminal decisions return409.

## Storage and transactions

Forward migration: immutable terms; evidence metadata (owner/uploader/kind/MIME/hash/size/object key/created/deleted timestamps); applications with immutable JSON payload, terms FK/hash, applicant/proposer FKs, kind, status/version, consent/review times and resulting restaurant FK; append-only reviews; durable request hash/result. Generated nullable active applicant guard enforces one awaiting_confirmation/submitted record across both paths. Resulting restaurant unique. All FKs RESTRICT.

States: direct submitted → approved|rejected; manual awaiting_confirmation → submitted → approved|rejected. No draft rows, withdrawal, expiry, reassignment or role promotions. Terminal payload/consent/reviews remain unchanged. One restaurant per owner uses existing DB uniqueness including inactive/setup-required.

Accounts public service locks all actor/applicant accounts ascending and rechecks current availability/email/admin authority. Then lock request, singleton authority (`FOR SHARE`, read-only runtime authority) if privileged, application, evidence and restaurant groups. The account prefix serializes authority replacement; a shared singleton lock blocks replacement without granting authority UPDATE. Recheck consent/one pending/ownership under locks. Onboarding and restaurant repositories own their tables; workflow coordinates public services with one transaction context. Restaurant creation, result, review and audit commit together; no storage call in a retried transaction. Replay is authorized before returning any stored result.

Unreferenced upload cleanup after24h; referenced files excluded. Rejected file deletion due90days; approved file deletion due one calendar year after explicit cooperation-ended time. Storage delete outside transaction, retryable; timestamp marked only after success and rechecking references. History stores opaque evidence references/hash and deletion metadata, not file copies. V0.3 has no termination UI; do not invent an end time or delete active-partner files.

## Local acceptance and future gates

MinIO private local bucket/volume and disposable MySQL9.2.0 with synthetic data only. Production region/provider/credentials/backups remain DEC-10/11. Runtime cannot edit/delete terms, reviews or successful request records; test migration identity is separate from production grant proof.

P07 records order privacy milestone and anti-evasion principles in owning requirements/API/UI/testing. P15–P18 implement order milestones/projections, P22–P25 define verified recovery claims/disputes and separate receivables; do not apply completed-only adjustment semantics to rejected/cancelled orders. Detailed QR/refund proofs, financial corrections and suspension remain gated by DEC-06/07/08. V0.3 does not claim those controls run.

Acceptance: ONBOARD-01/02/03, AUTH-04, ADMIN-02, UI-02. Real MySQL races/SQL constraints/rollback; real private MinIO roundtrip and cleanup; Chrome mobile/privacy/replay/conflict journeys; empty/upgrade migration; documentation/schema/example checks. V0.3 acceptance requires all evidence, not code alone.
