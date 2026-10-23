# V0.8 — Approved DEC-09 and implementation contract

Approved October 22, 2026 by the repository operator through explicit planning answers and “PLEASE IMPLEMENT THIS PLAN”. P25 is accepted for local synthetic scope. This decision does not authorize production publication, pilot traffic, billing activation or retained-data migrations.

## Provider, privacy and product semantics

- Google Gemini Developer API, stable `gemini-3.5-flash-lite`, Standard free tier only, USD0 spend. Never switch models, tiers or enable billing automatically. Operator must verify a dedicated project has no billing and record its actual model RPM/TPM/RPD in backend configuration before enabling calls. Missing configuration fails closed. App limits do not prove the remote project billing state.
- Sources checked October22: [model](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), [pricing](https://ai.google.dev/gemini-api/docs/pricing), [terms](https://ai.google.dev/gemini-api/terms), [quotas](https://ai.google.dev/gemini-api/docs/rate-limits).
- One dish, quantity1, inclusive ceiling: current dish price + verified delivery fee <= budget; integer VND strings, budget1–1000000. Suggestions are alternatives, never a combined order or accepted quote.
- Preferences are zero to three unique existing category IDs, soft ranking preferences. No free text, allergy/dietary guarantees or random fallback.
- Free-tier provider content may be used to improve Google products and reviewed by humans. User explicitly selected real catalog use after this disclosure. This is an explicit provider-use exception to previous blanket training-storage wording; the application still stores no conversations/training data. No claim of zero Google retention is made. Paid service, provider change or confidential data requires a new decision.
- Before submitting, UI displays the Vietnamese notice below. Choosing manual ordering sends nothing to Google.

> Gợi ý dùng Gemini miễn phí. Google có thể dùng nội dung gửi đi và câu trả lời để cải thiện sản phẩm, có thể có người đánh giá. Chỉ gửi dữ liệu món đã giới hạn; không gửi thông tin tài khoản hoặc địa chỉ nhận. Gợi ý không bảo đảm thành phần hay an toàn dị ứng.

## Public API and validation

POST `/api/v1/ai/recommendations`, active buyer capability including managers; session, Origin and CSRF required. Request: `{"pickup_point_id":"3","budget_vnd":"50000","preferences":{"category_ids":["1"]}}`. Exact closed objects; IDs canonical signed-BIGINT positive decimal strings. No extra fields. Maximum3 distinct categories, each must exist.

Response envelope: `data.suggestions[]` contains `dish_id,restaurant_id,dish_name,restaurant_name,image_reference,quantity:1,unit_price_vnd,delivery_fee_vnd,estimated_total_vnd,reason`; `data.generated_at` is UTC ISO8601. All money/IDs strings. Empty eligible set or valid empty provider output gives200 empty, with no invented replacement.

422 invalid input/destination;429 `RATE_LIMITED` with Retry-After for account/IP limits;503 `AI_UNAVAILABLE` for config/quota/concurrency/provider/schema/content failure;504 `AI_TIMEOUT`. Never expose provider diagnostics. Responses are no-store. Selection uses normal cart, fresh quote and explicit checkout.

## Candidate, adapter and concurrency controls

- Catalog owns current dish/restaurant read projection; delivery owns verified surveyed fee inspection without issuing/storing quote artifacts. Account checks happen before and after the call. Catalog/readiness/open hours and delivery validity are re-read after the call.
- Before sending: select preferred category first, then exact total ascending, then numeric dish ID. Maximum30; maximum3 returned. No call for zero candidates.
- Provider never receives raw preferences, DB/account/restaurant IDs, restaurant names, descriptions, addresses, contacts, coordinates, quote artifacts, credentials or prior messages. Request-local candidate aliases only.
- Fail-closed text minimization: derive dish/category labels exclusively from a fixed food vocabulary, never copy arbitrary catalog text. Omit candidates without usable safe food labels. This intentionally reduces recall; unsafe/unknown names never become a privacy gamble. Public response still shows real catalog names locally.
- Static prompt/schema `recommendation-v1`, structured JSON only, no tools/Search/Maps/cache. Reasons restricted to approved factual Vietnamese templates (preference match or budget fit), verified against the candidate. No generated unsupported narrative.
- Limits:16KiB provider payload,4KiB generated JSON,1024 output tokens;7s provider timeout inside10s workflow deadline;1 generate call, zero automatic retries. Ignore late output.
- Account2/minute and10/day; HMAC-IP10/minute; global100/day,2 in-flight; use lower actual Google project RPM/TPM/RPD and application limits. Daily project window resets at midnight America/Los_Angeles, matching Google. Minute buckets are fixed UTC minute windows.
- Quota reservation is durable and atomic before network I/O; uncertain calls consume reservations, no refunds. Global leases survive process crashes, expire after30s. No transaction/locks span provider calls. Shared global lock serializes admission; account-first lock order. Persist neither request body nor output. Counter/lease rows and numeric metadata are deleted after7days by bounded cleanup.
- Config is backend-only, AI disabled by default. Dedicated unbilled project and verified free-tier attestation are operator requirements; USD0 app setting is not a Google billing control. No missing limit means unlimited. Manual browsing/ordering works when config is absent.

## Evaluation and acceptance

AI-01/04: exact budget boundaries, zero versus missing fee, every operational flag, unknown/duplicate/unsent IDs, malformed/truncated/extra-field JSON, price/fee/status/point changes during call. AI-02/AUTH-02: projection inspection, hostile catalog content, no PII/secrets, no content logs/storage, active buyers/managers only. AI-03/UI-02: five widths360/390/768/1024/1440, keyboard, timeout/outage/quota/stale input and manual checkout. MySQL9.2: two-process quota/lease races, restart/expiry, forward migration and restricted grants.

Fixed100 synthetic live cases, compared to deterministic preference/cost baseline; split across days under global/project quotas.100% displayed results eligible and within budget; >=90% clear-preference cases have a matching top3; >=95% requests within5s, errors/timeouts included. At10s fallback. Metadata records case number/model/prompt version/status/latency/token counts only. Content fixtures are static synthetic artifacts, never runtime transcripts. Missing key/quota/live evidence is NOT CONFIGURED/NOT RUN and prevents P27/P28 full acceptance. Deterministic mocks prove safety/failure handling, not Gemini quality or latency.

## Alternatives and compatibility

Rejected: paid provider (cost), free text (privacy), food-only budget (hidden delivery overspend), process-local quotas (multi-instance bypass), arbitrary reasons (ungrounded claims). DTO changes replace the previously unimplemented plain-text preference draft; no enabled recommendation clients exist. Forward metadata-only tables preserve existing history. Requirements/API/AI/UI/testing and progress link here rather than competing policy copies.

## Subsequent explicit local adoption authorization

October22 the operator selected “Áp dụng trên database local hiện tại” after reviewing the single pending metadata migration, narrow grants, protected verified backup/restore and quota carry. [Completed local adoption](ai-local-adoption-review.md) preserves all58 original tables/173 rows and adds only AI metadata plus expected migration history. This extends local operational authorization only, without changing DEC-09 semantics, limits, billing, pilot or production boundaries.
