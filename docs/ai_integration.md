# AI Integration — Hoa Lac Food Ordering Platform

Approved October22,2026: [DEC-09 and V0.8 contract](ai-v08-contract.md) supersedes the former proposed provider, plain-text preferences, budget and limit TBDs. [Requirements](requirements.md) governs behavior; [verification](ai-local-verification.md) separates implementation from live acceptance.

## 1. Sources, terminology and scope

US08, FR06, BR28–31, AC7; architecture §5.5, API §7.6 and UI §9.4. V0.8 recommendations only. US09 random selection remains V1.1, disabled. Restaurant delivery, surveyed points and normal cash/QR checkout are unchanged.

## 2. Objective and exact budget semantics

Each suggestion is one dish, one portion. Backend computes current price plus verified surveyed delivery fee with BigInt; total must be <= budget, a canonical integer VND string from1 to1000000. Alternatives never form a multi-restaurant order. Estimates are neither quotes nor accepted prices. Zero to three category IDs are soft preferences, no dietary guarantees.

## 3. Responsibilities and out of scope

HTTP → RecommendationWorkflow → public account/catalog/delivery/commission/recommendation services → owning repositories. `AiGateway` is a provider-neutral port; Gemini REST lives in integrations. AI cannot write orders/payments, determine money, access tools, select an unknown destination or replace manual ordering.

## 4. Data minimization and privacy

[DEC-09](ai-v08-contract.md) explicitly permits Google free-tier content improvement/human review for minimized catalog data. The application still stores no conversations/training content and sends no PII, credentials or private data. No Google zero-retention promise is made.

Provider receives only request-local aliases, fixed-food-vocabulary labels derived from names/categories, and a preferred boolean. Arbitrary source text, descriptions, restaurant names/IDs, exact destination, contact/account/order/payment/quote fields never enter the request. Unknown labels are excluded. Static allowlisted food labels can reduce recall; the system does not weaken privacy filtering to fill results. UI displays the approved Vietnamese disclosure before the explicit submission.

## 5. End-to-end backend-controlled flow

1. Validate closed request, active buyer capability, session/Origin/CSRF and configuration.
2. Read eligible real catalog and current verified delivery fees through public services; require current accepted commission configuration as well as readiness/open/active/accepting flags.
3. Rank preferred category, exact estimated total and numeric ID; retain at most30. Skip provider for an empty set.
4. Atomically reserve durable quota and a shared lease; commit before network I/O.
5. Call AiGateway once under timeout; validate closed output/aliases/reasons.
6. Re-read current selected catalog, operational/delivery/commission data and account/session authority. Drop newly ineligible/over-budget results; construct all public prices locally.
7. Selection follows normal cart, fresh quote and explicit checkout, including changed-price/fee consent. No automatic order.

## 6. Structured AI output and public response

Static prompt/schema version `recommendation-v1` lives in `backend/src/integrations/ai/gemini.ts`. Provider output is exactly `{"suggestions":[{"dish_id":"c0","reason":"Trong ngân sách gồm phí giao."}]}`. Maximum3 unique aliases from this request. The only other allowed reason is the approved category-match template, accepted only for a preferred candidate. Reject malformed/truncated JSON, extra keys, unknown/real-but-unsent IDs and unsupported reasons. No free narrative, HTML, tools or model-generated money.

[OpenAPI](data/recommendations.openapi.json) owns the enabled public request/response schema; API §7.6 describes errors and semantics. Returned real names/images and string IDs/money are current backend facts. Quantity is always1.

## 7. Candidate eligibility and races

Catalog must be ready/active/open/accepting, dish visible/available, current commission accepted by the current owner, pickup point active, and surveyed pair enabled with approval, matching restaurant location hash and point version. Missing fee is not zero; genuine verified zero fee is eligible. Opening-hours checks include overnight intervals. Revalidation never authorizes checkout, which repeats its own current-state validation.

## 8. Provider, configuration and operating limits

Gemini `gemini-3.5-flash-lite`, Standard free tier, no billing/model fallback. Backend `.env.example` lists disabled-by-default keys and required project quota/free-tier attestation. Actual project billing status is an operator prerequisite; an application setting cannot enforce Google's billing configuration.

[DEC-09](ai-v08-contract.md) owns exact quota/payload/token/deadline values. Effective quota is the lower of approved app limits and verified project RPM/TPM/RPD. Pacific-midnight day buckets match Google; minute buckets are fixed UTC windows. Socket-peer IP hashes deliberately do not trust arbitrary forwarded headers; behind an unconfigured proxy, callers may share that conservative IP limit.

Metadata tables `ai_admission`, `ai_counters`, `ai_leases` contain only admission/counters/outcomes/timing/token counts. Account locks precede admission locks. No external calls in a transaction. Failed/uncertain attempts consume quota and retain their30s lease; success releases the lease. Crash leases expire durably. Bounded startup/hourly cleanup and admission cleanup remove metadata older than7days; `ai:cleanup` provides an operator command. Expired metadata is removed on next startup if the application was offline.

## 9. Versioned prompt and controlled changes

Prompt/schema/model/semantics changes require owning-contract updates, deterministic regression checks and a new fixed-suite live comparison before acceptance. No prompt change can change money, eligibility or approved privacy policy. Static artifacts are versioned; runtime transcripts are not stored.

## 10. Errors and fallback

422 invalid input/destination;429 account/IP quota with Retry-After;503 configuration/provider/project quota/concurrency/invalid-output failure;504 timeout. Responses are no-store and reveal no provider diagnostics. UI calls only on submit, aborts/invalidates stale inputs and shows retry/manual fallback by10s. Manual browsing, quotes and ordering do not depend on Gemini readiness.

## 11. Storage and operational evidence

No conversation/session/chat table. Metadata only,7day retention; unknown usage remains null. Dedicated free-tier project has expected paid cost USD0; billed cost is not falsely reported as measured zero. Provider pricing/terms/quota must be rechecked before changing the enabled configuration. No billing activation, deployment, retained migration or real pilot is authorized by source completion.

## 12. Evaluation, tests and acceptance

[DEC-09](ai-v08-contract.md) fixes100 synthetic cases and quality/latency thresholds. `test:ai-evaluation` runs a resumable metadata-only comparison against deterministic category/cost ranking, under the same durable quotas. `AI_EVAL_BATCH` defaults2, `AI_EVAL_REPORT` is an explicit report path; resume the same report across quota windows/days. Never substitute mock results for live quality or latency. No key/project quotas → NOT CONFIGURED, not accepted.

AI-01/04: budget/eligibility/fees, exact IDs, output schema, races. AI-02/AUTH-02: closed category-only input, minimized projection, injection, PII/secrets and current authority. AI-03/UI-02: errors/timeout/quota/late response and manual cash checkout. MySQL evidence includes multi-process admission, rollback, expiry, daily/token quotas and restricted runtime grants. PERF-02 requires actual provider measurements. [Verification](ai-local-verification.md) owns exact commands and observed scope.

## 13. Separate non-LLM random-dish selection

US09 remains post-V1.0/V1.1. Its reserved endpoint DTO, sampling policy and acceptance remain undecided; no route/UI/fallback is enabled by V0.8.

## 14. Remaining gates

P26/P27/P28 are accepted for isolated local synthetic scope after the recorded100case live evaluation. Deterministic Chrome evidence, provider-stage live metrics and retained/production readiness remain distinct. [Progress](progress/V0.8.md) records the current result. Explicitly authorized local metadata migration/server activation completed in the [adoption receipt](ai-local-adoption-review.md); production remains separate; no billing fallback is permitted.
