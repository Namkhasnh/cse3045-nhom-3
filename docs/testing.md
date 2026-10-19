# Testing — Hoa Lac Food Ordering Platform

> Purpose: define observable evidence that the system meets its requirements, preserves financial/history invariants, and is ready for its selected delivery milestone.
> Status: implementation-oriented test specification, not executed results. Current scaffold checks are documented in §12; real-MySQL/browser suites and production runtime details remain **TBD**.

## 1. Authority, terminology and scope

Derived from the repository specifications: [requirements.md](requirements.md), [architecture.md](architecture.md), [database.md](data/database.md), [api_contract.md](data/api_contract.md), [ai_integration.md](ai_integration.md), [ui_convertion.md](ui/ui_convertion.md), and [development_guide.md](development_guide.md). Canonical paths are listed in docs/README.md.
Follow the development guide's precedence: requirements → architecture → database → API → UI → AI; use source/manifests for actual implementation and commands. Requirements govern US/FR/BR/AC and scope; mockups do not add capabilities. An unresolved decision stays TBD until reviewed in its owning document.

| Milestone | Test scope |
| --- | --- |
| V1.0 at VJU | Public discovery/guest cart, ordinary buyer-manager identity, sole MFA Admin, opening applications, fixed surveyed points, cash+direct QR/refunds, history/recovery, finance/reports/support/users/audit, AI and tested operations. |
| V1.2 | Regional expansion, free addresses/map pins and route-based quotes/fee tiers. |
| V1.1 | Random, reorder, favorites/reviews after finalized contracts. History/recovery and support are required V1.0. |
| Could | Reviews and favorites, only after their contracts and data design are approved. |
| Excluded | Driver accounts/dispatch, multi-restaurant orders, platform payment processing/splitting/automatic collection, AI conversation or training-data storage. |

Student means ordinary buyer; Owner means current ownership capability, at most one restaurant, retaining buyer rights. Admin is one operator-owned MFA authority with no implicit fulfillment/payment powers. Restaurants deliver and receive money directly; manual platform commission receipts are separate.
Order states: `pending`, `accepted`, `delivering`, `completed`, `rejected`, `cancelled`. Payment states: `unpaid`, `paid`, `refund_pending`, `refunded`. Do not introduce `preparing`, `shipping`, or a Settlement status enum.

## 2. Strategy and test ownership

| Layer | What to execute | Evidence / proposed placement |
| --- | --- | --- |
| Unit (U) | Pure money/rate policies, state transitions, eligibility/hours, canonical fingerprints, DTO parsing, UI state/retry logic; fake clock and injected random source. | Deterministic assertions alongside owning feature/domain; no database or provider dependency. |
| Integration (I) | NestJS HTTP/guards/workflows through Prisma to real MySQL/InnoDB; migrations, constraints, transactions, ownership, adapter boundaries. | `backend/test/`; assert HTTP contracts and committed rows/history, not only mocked service calls. |
| Concurrency (R) | Independent requests/connections against the same MySQL database, with controlled barriers and injected faults. | `backend/test/`; assert permitted serial outcomes and exact durable counts. R is a specialized integration suite. |
| Browser E2E (E) | React → REST → NestJS → MySQL for critical Student, Restaurant Owner and Admin journeys; external services stubbed. | Test location/runner TBD; real browser, role-specific sessions, persisted result assertions. |
| Non-functional (N) | Load, real-provider evaluation, security configuration, responsive/accessibility checks and backup restore. | Versioned run report and artifacts in the team's selected test-report location, TBD. |

Backend tests own authoritative rules; frontend tests verify displayed data, consent, recovery and valid actions. Keep E2E focused on meaningful journeys; do not duplicate every arithmetic permutation in a browser.
Review/automate architecture boundaries: controller → workflow → public service → owning repository; participating writes share one transaction context. No controller Prisma access, cross-module repository imports, browser DB/provider calls, or AI order/payment write tools. Frontend `shared` must not import features/app; features must not deep-import one another.
Each executable test records its case ID, source IDs, milestone, fixture, action, assertions and evidence. Implementation coverage percentages are diagnostic; no percentage target is established by the supplied documents.

## 3. Isolated environment and deterministic data

- Use disposable, explicitly allowlisted local/CI MySQL databases and synthetic accounts. Seeds/reset/cleanup must refuse production/shared targets. Never copy real orders, contacts, bank/QR details or credentials into fixtures.
- Pin verified Node.js/npm/Prisma/MySQL versions from manifests and deployment configuration. Use Oracle MySQL Community Server 9.2.0 and verify CHECK enforcement; use InnoDB, real FKs, strict SQL mode, UTC sessions and documented collation/isolation settings.
- Financial, migration and race suites cannot substitute SQLite or ORM mocks for MySQL. Apply reviewed migrations to an empty database and an upgrade fixture; inspect actual CHECK/FK/UNIQUE definitions and restrictive FK actions.
- Give each parallel worker an isolated database or explicitly isolated fixture scope. Race participants deliberately share one test database and aggregate. Cleanup uses a dedicated test identity; runtime permission tests use the application identity.
- Freeze ordinary tests at `2026-10-16T03:00:00.000Z` (10:00 in `Asia/Ho_Chi_Minh`); inject clocks for closing time, expiry and deadline cases. Real load/latency runs use real clocks.
- Stub AI/map adapters at the boundary. Deny unexpected external requests in deterministic suites. Fault modes include delay, timeout, malformed output, outage, stale data and response loss. Never hold DB locks while waiting for a provider.
- Version fixtures; use exact IDs/money strings and rates. Construct historical aggregates through workflows where possible, preserving snapshots, payment/history/base relationships. Direct SQL is reserved for deliberate integrity probes and controlled setup.
- Capture safe request IDs, case IDs, versions, durations and outcomes. Keep secrets, recipient details, prompts/preferences/candidates/raw AI responses out of logs, traces and CI artifacts.

| Fixture | Required variants |
| --- | --- |
| Accounts/ownership | Users U1/U2; manager U1 owns R1 and can buy, manager U2 owns R2; U3 owns none; sole Admin A1; inactive actor and approved reassignment to U3. Legacy multi-owner/Admin fixtures deliberately fail migration until explicit mapping. |
| Catalog | R1 active/open/accepting with visible available D1/D2; individually hidden/sold-out dishes and inactive/closed/not-accepting restaurants; never-ordered dish/restaurant. |
| Delivery | Active P1 with enabled R1/P1 surveyed distance 450 m and fee `"5000"`; genuine zero-fee pair; missing/disabled pair; inactive point. Values are fictional, not actual surveys. |
| Money | D1 price `"45000"`, quantity 2, rate `"0.10000000"`; small rounding fixtures; IDs above JS safe-integer range; signed adjustment and overflow cases. |
| Orders/finance | Every milestone-appropriate state; completed but unpaid order; assigned/unassigned entries, multiple receipts, negative adjustment and valid snapshot/history records. QR/refund fixtures required V0.6/V1.0 after DEC-06. |

## 4. Requirements-to-test traceability matrix

U/I/R/E/N refer to §2. Each row defines expected behavior, not a pass result. Cases are V1.0 unless labeled **Post**; pending policy-dependent cases remain visible as blocked, not silently skipped.

| Source: US / BR / AC (plus FR/NFR where needed) | Case | Layer | Expected result |
| --- | --- | --- | --- |
| US01; FR01; NFR03; AC8 | AUTH-01 Session and identity | I/E | New registration requires email verification before login; invalid/expired/inactive sessions fail; public privilege/requested-role fields are rejected; registration creates only ordinary user. |
| US01; FR01; AC8 | AUTH-03 Email verification (revised) | I/E | Code expires after 10 minutes/five wrong attempts, resend limited; no Owner/Admin request or promotion. Former role-approval assertions superseded. |
| US01/07/11–17; FR01; AC1/8 | AUTH-02 Ownership and nested IDs | I/R/E | S1 cannot read/change S2 orders; U1 cannot read/change R2 orders, dishes, policies or finance; scope checked on lists and writes. |
| US02/03; FR02; BR05 | CAT-01 Discovery | I/E | Name/category/inclusive price filters work; hidden/inactive excluded; visible sold-out shown as unavailable; documented pagination/scalars preserved. |
| US05; BR01; AC4 | CART-01 Restaurant boundary | U/I/E | Cross-restaurant API items rejected; UI switch requires consent and cancel preserves existing cart. |
| US04/05; BR02/03; NFR04; AC4 | PRICE-01 Totals and consent | U/I/E | Exact server totals; each changed unit price/fee conflicts; explicit reconfirmation before a new intent/key. |
| US03/05/12; BR05; AC4 | ELIG-01 Revalidation | U/I/R | Hidden/sold-out/inactive/closed/not-accepting, disabled point/pair or missing rate prevents new order; no partial aggregate. |
| US04/12; BR08/10; AC4/7 | DEL-01 Surveyed quote | I/E | Exact restaurant–point data only; absent fee blocks confirmation; known zero fee remains valid. |
| US04/12; BR07–09; AC4/7 | DEL-02 Route tiers (**Post**) | U/I/E | Route distance, non-overlapping `[min,max)` tiers and inclusive final max; unknown/out-of-range/expired quote cannot confirm. |
| US05/07; BR06; NFR05; AC9 | IDEM-01 Same intent and response loss | U/I/R/E | One order/result; replay returns original ID/snapshots after reload or later price edits. |
| US05; BR06; AC9 | IDEM-02 Changed intent | U/I/R | Same scoped key with different validated content returns 409; no second resource. |
| US07/13; BR15–17; AC12 | STATE-01 Legal actions | U/I/E | Only documented transitions; rejection needs reason; Student cancels own pending order only. |
| US07/13; BR18/19; AC10/12 | RACE-01 Accept/cancel and no-op | I/R/E | Exactly one winning transition; loser conflicts; authorized current-target repeat adds no history/audit. |
| US06/14; BR11–13 | PAY-01 Cash and independent states | I/E | Only current owner confirms receipt; paid does not complete, completion may remain unpaid. |
| US06/14; BR11–14; AC5 | PAY-02 QR and refund (V0.6/V1.0) | I/R/E | Scan/report is not paid; verified terminal-order transfer creates refund obligation; owner records direct refund, never reopens order. |
| US11/12/17; BR04/24; AC2/3/6 | HIST-01 Immutable snapshots | I/E | Name/price/contact/point/fee/rate edits leave stored and displayed historical snapshots unchanged. |
| US11; requirements §7.1; AC1/2 | CRUD-01 Delete or hide dish | I/R/E | Never-ordered dish deleted; ordered dish hidden; returned outcome and UI agree; history retained. |
| US16; requirements §7.2–7.3; AC3/8 | CRUD-02 Delete or deactivate restaurant | I/R/E | History forces deactivation; active orders/finance remain; unused deletion preserves owner account/buyer access and historical references. |
| US15/17; BR20–22; AC6 | FIN-01 Base calculation | U/I | Completed-order dish subtotal × snapshotted rate, half-up once per order; delivery excluded; cancelled/rejected has no base. |
| US13/17; BR18/23; AC10 | FIN-02 Completion atomicity | I/R | Completion/history/audit and one base commit together; repeat has no new effects; injected failure rolls back all. |
| US17; BR23/27 | FIN-03 Adjustments and receipts | I/R/E | Admin-only append with required reason/positive receipt; durable financial keys deduplicate retries; no external money movement. |
| US15/17; BR25; AC11 | FIN-04 Settlement assignment | I/R | Every entry belongs to at most one same-restaurant Settlement; competing/mixed assignment cannot partially commit. |
| US15/17; BR26 | FIN-05 Reconciliation totals | U/I/E | Base + adjustments − receipts computed without join multiplication or negative-balance clamping; no invented status. |
| US08; BR28/29; AC7 | AI-01 Candidate/output validation | U/I | Real eligible allowlisted IDs only; backend supplies money; invalid output cannot invent a dish or mutate orders. |
| US08; BR30; NFR03 | AI-02 Privacy and injection | U/I | No personal/secret payload or transcript storage; hostile text cannot expand IDs, invoke tools or execute UI content. |
| US08; BR08/31; NFR02; AC7 | AI-03 Outage/manual fallback | I/E/N | Safe error/retry state by 10 s; late output ignored; manual surveyed ordering works with valid delivery data. |
| US08; FR06; AI §2 | AI-04 Budget semantics | U/I/N | Scope/quantity/boundaries remain pending; once approved, exact backend comparisons and live evaluation enforce them. |
| US09; BR28/29 | RANDOM-01 Eligible random (**Post Should**) | U/I/E | Deterministic injected random source, no AI call; current eligibility and normal checkout; final empty-result contract required. |
| US10; BR32 | REORDER-01 Current conditions (**Post Should**) | I/E | History creates new draft; current availability/price/quote and new consent/key required; old order unchanged. |
| US18; BR16; AC12 | SUPPORT-01 Order-linked support (V0.7/V1.0) | I/E | Authorized order link under approved workflow; submitting support does not directly cancel an accepted order. |
| FR01/04/05/09; NFR03–05/07 | DATA-01 DB and API integrity | I/R | CHECK/FK/UNIQUE protections, scalar bounds and full rollback hold; forbidden writes leave no partial facts. |
| US11–17; NFR07 | AUDIT-01 Transactional audit | I | Actor, time, target and redacted change content recorded with mutation; failure rolls back business change. |
| US07/13; NFR05 | UI-01 Recovery and polling | U/E | Stable intent through unknown result; one poll owner; stale responses cannot overwrite newer independent order/payment versions. |
| NFR01 | PERF-01 List load | N | At least 95% of restaurant/dish list loads finish within 2 s at 50 concurrent users in documented environment. |
| NFR02 | PERF-02 AI latency | N | At least 95% within 5 s; retry/manual state at 10 s, with failures/timeouts included in reporting. |
| NFR03 | SEC-01 Deployment security | I/E/N | HTTPS, password hashing, server-only secrets and approved JWT/CSRF/CORS behavior verified. |
| NFR06; UI §§11/13 | UI-02 Mobile/accessibility | E/N | Browse → select point → order → track at 360 px without page horizontal scroll; keyboard/focus/contrast checks pass. |
| NFR08 | OPS-01 Backup restore | I/N | Daily backups evidenced; isolated restore successfully recovers relational/financial/history invariants before go-live. |

New/revised commercial test IDs (all target cases, **NOT RUN** in this documentation task):

| Requirement | Case | Required evidence |
| --- | --- | --- |
| US02/03; FR02; AC18 | PUBLIC-01 Public catalog privacy | Anonymous real list/menu APIs and browser work without auth/me; reject hidden/inactive/setup-required data; exact field allowlist excludes account/application/finance |
| US05; AC13 | GUEST-01 Login continuity | Cart survives login/reload, safe internal return, fresh price/quote, explicit confirmation; no automatic submit/private intent leakage on account switch |
| FR01; AC14 | AUTH-04 Shared identity and cap | Manager buys, current ownership scopes all resources; direct SQL and concurrent create/approve enforce max one including inactive/setup-required |
| US26; AC16 | ADMIN-01 Sole authority/migration | At-most-one DB + existence readiness; explicit primary legacy choice; duplicates/missing mapping blocked; old identities/history retained |
| US26; AC17 | ADMIN-02 MFA and recovery | Password alone cannot enter Admin; approved factor/recovery limits, single-use codes, audit and session revocation; recovery drill preserves one authority |
| US23; AC15 | ONBOARD-01 Terms/privacy/history | Exact immutable Vietnamese terms/version/hash consent and own submission/review history; private cross-account reads denied |
| US24/16; AC15 | ONBOARD-02 Atomic approval/manual create | MySQL approval/approval/manual races, key replay/change and audit-failure rollback; one restaurant/link/review/result, no ownerless/second partner |
| US12/23; AC15 | ONBOARD-03 Setup readiness | Approval starts setup_required/not accepting; incomplete profile/hours/menu/survey/rate/consent blocks sale; ready still checks current eligibility |
| US25; FR12; AC17 | USER-01 User/support/audit controls | Approved suspension effects and session revoke/audit atomic; sole Admin protected; scoped support/redacted audit; no role grant/hard deletion |
| AC19; NFR01–08 | PILOT-01 Operational VJU pilot | Explicit cohort/traffic authorization, verified partner/fee/QR/rate/terms and real journey/support/incident evidence, defect closure |

US19–20 are Could: add detailed cases only when selected and specified. US21–22 remain excluded; ensure neither is exposed as an enabled feature.

## 5. Authorization and HTTP contract checks

- Exercise owning/non-owning Student, current/former Restaurant Owner, Admin, unauthenticated and inactive actor on every protected resource. Test guessed IDs, swapped nested IDs, filter/cursor scope, crafted bodies and idempotent replays; hidden UI controls are not evidence of enforcement.
- Own reads/writes succeed as permitted. Private cross-Student/Owner resources are concealed as 404; forbidden role operations return 403; invalid/expired credentials return applicable 401. Assert safe envelopes with no foreign data in details, lists or errors.
- U1 manages R1 only and can buy; U2 manages R2 only. A second ownership must fail under direct SQL and races. Approved reassignment to eligible U3 revokes U1 management immediately while preserving buyer rights/history. Inactive/setup-required restaurants count toward the cap. Deactivation preserves current-owner access to existing orders/finance.
- Admin cannot fulfill orders, confirm payment or acquire dish-owner powers implicitly. Restaurant Owners cannot assign owners, change commission rates or record receipts/adjustments. Public registration rejects role/actor overrides.
- Verify `/api/v1`, `snake_case`, success/list/error envelopes, documented HTTP status and replay headers. Reject unknown fields, server-controlled totals/rates/status/actor fields, duplicate dish IDs and unsupported filters/sorts.
- Preserve canonical string IDs/money, eight-decimal fraction rates, UTC instants and integer counts/metres/versions. Test negative/exponent/decimal/leading-zero IDs, bounds, rate excess precision and aggregate overflow. Signed adjustments/balances are valid; receipt amounts must be positive.
- Verify stable keyset ordering/tie-breakers, limit 20/default and 100/max, scope/filter-bound cursors and 422 for invalid/mismatched cursors. Search collation expectations remain pending until deployment collation is recorded.
- Validate enabled schemas/examples against [OpenAPI](data/openapi.yaml). V0.1 auth/profile examples/references and actual HTTP/SMTP exchanges are checked by `test:e2e`/`test:smtp` with Ajv. Client SDK generation and later endpoint contracts are not claimed. Auth tests follow API §2 username/Argon2id, 15-minute cookie JWT, versioned logout and bound CSRF protocol. Cover wrong Origin, missing/mismatched CSRF, expired/revoked JWT, key rotation and no refresh endpoint.

## 6. Pricing, quotes and historical records

Use arbitrary-precision integer/decimal reference calculations independent of the implementation under test. Money is integer VND; REST representations are strings. No binary floating-point rounding.

| Fixture/action | Expected oracle |
| --- | --- |
| 2 × `45000`, fee `5000`, rate `0.10000000` | Subtotal `90000`, total `95000`; on completion base commission `9000`, not `9500`. |
| Subtotal 104 / 105 / 106, rate 10% | Commission 10 / 11 / 11 VND (below/at/above half). |
| Two lines of 5 VND each, rate 10% | Order-level commission 1 VND; not 2 from per-line rounding. Zero subtotal/rate produces exact zero. |
| Price 45000→48000 and fee 5000→8000, quantity 2 | 409 `PRICE_OR_FEE_CHANGED`; accepted total `95000`, current `104000`; all lines and fresh quote returned for explicit consent. |
| Two unit-price changes cancel out in subtotal | Still conflict: compare each accepted price, not aggregate total only. |
| Base 9000, adjustment −1000; receipts 3000 and 2000 | Receivable 8000, collected 5000, outstanding 3000; multiple entries/receipts cannot multiply aggregates. |
| Read-model fixture with receivable 8000, collected 9000 | Outstanding −1000, not zero. This tests arithmetic only, not approval of a TBD overcollection write policy. |

Base formula: `(subtotal_vnd × scaled_rate + 50000000) div 100000000`, where `scaled_rate = rate × 100000000`. Test technical bounds; do not impose an invented 100% business maximum.
Order creation validates authenticated actor, ready/active/open/accepting restaurant, visible/available dishes, active point/enabled pair, quote and configured commission policy in its transaction. Test each condition independently, opening/closing boundaries and overnight hours in `Asia/Ho_Chi_Minh`.
Tampered quote/artifact or mismatched bound fields yields 422; a valid superseded quote yields 409 `QUOTE_STALE`, or `PRICE_OR_FEE_CHANGED` when amounts changed and a fresh valid quote is available. Unknown current fee yields applicable 422/503 and no confirmable replacement. Artifact protection and route TTL must be approved before their implementation tests become runnable.
After successful creation, change dish name/price, account contact, point label/coordinates, delivery policy and commission rate; hide dish/deactivate restaurant. Read/replay the old order and compare every immutable snapshot, item, total and rate to the original. Current state may progress. Do not require a restaurant-name/address snapshot not defined in the schema.
Test DELETE outcomes `deleted`, `hidden`, `deactivated` and corresponding reason fields; UI confirms beforehand and describes actual result. In-progress orders remain fulfillable after deactivation. Deleting an unused restaurant explicitly removes unused configuration/menu and only its management relationship, preserving audit and owner account/other restaurants.

## 7. Durable retries, races and rollback

Run R cases with independent connections and at least two backend processes sharing MySQL where cross-instance protection matters. Synchronize at known read/write boundaries; avoid relying on arbitrary sleeps. Force each winner ordering, repeat with a recorded seed/iteration count, and bound waits. Record actual isolation/lock settings.
For each case assert HTTP results **and** rows, versions, history, audit and request-result links after commit. Inspect a consistent final DB view. A UI disabled button or in-process mutex is insufficient.

| Case/action | Required durable result |
| --- | --- |
| Concurrent same actor/operation/key/content | One order and one successful request record, all children once; first 201, replay 200 with original ID and `Idempotency-Replayed: true`; bounded unresolved wait may return 503 `IDEMPOTENCY_IN_PROGRESS` plus `Retry-After`. |
| Same key/content with reordered JSON/items | Canonical hash remains identical; item ordering uses numeric dish ID, not lexicographic order; duplicate dish IDs rejected. |
| Same scoped key, changed recipient/quantity/price/quote/target | 409 `IDEMPOTENCY_KEY_REUSED`; successful hash/result never overwritten. Same total alone does not mean same intent. |
| Same key across different actors/operations | Independent authorized scope; no disclosure or replay of another actor's result. Key comparison is case-sensitive. |
| Commit then drop response; restart/reload; retry original payload/key | Return original order even after price/quote changes; no new order, snapshot or successful key. Changed/reconfirmed intent alone gets a new key. |
| Accept versus Student cancel | One transition from pending; losing incompatible action gets 409 `ORDER_STATE_CONFLICT`; no contradictory history/base. UI refetches current state. |
| Two accepts / two completions / two payment confirmations | One effective transition; authorized current-target request is no-op; one base on completion, no extra history/audit/payment side effect. |
| Backward/invalid transition; rejection without reason | Rejected without mutation. `completed`, `cancelled`, `rejected` remain terminal; authorization and input validation precede no-op. |
| Create versus price/fee/rate/hide/deactivate/delete/point update | Valid serial result at the locking point or rejection; never mixed snapshots, stale consent acceptance or broken history references. |
| Owner reassignment or account deactivation versus write | Current authority is rechecked under shared locking; no write authorized solely from an earlier read/token claim. |
| Two config edits using same expected version | One succeeds; stale edit returns 409 `VERSION_CONFLICT`, no lost update. |
| Two Settlements claim same/overlapping entries | One-time assignment; loser `ENTRY_ALREADY_ASSIGNED`; entire losing selection rolls back, including previously unassigned entries and new Settlement/audit. |
| Retry receipt/adjustment with same or changed content | Same key/content returns one original fact; changed amount/reason/target conflicts; result/audit/key atomic. |
| Inject transient deadlock/lock timeout | Bounded whole-transaction retry using same intent; eventual single effect or safe failure. Exact attempt/backoff policy TBD; architecture's three-attempt example is not a confirmed setting. |

Inject failures after order insertion, after items/payment/history, at audit insertion, during base insertion on completion and midway through Settlement assignment. Assert rollback leaves no partial order, success key without result, completed-without-base state, reassigned entry or orphan financial fact. A later valid retry can succeed once.
Probe DB constraints directly: mixed-restaurant item/order/dish FKs, mismatched entry/order/Settlement restaurants, invalid quantity/row total, duplicate base/history/request result, base with null/mismatched `base_order_id`, blank adjustment/rejection reason and nonpositive receipt. Verify explicit null guards, restrictive deletes and runtime denial of append-only history edits. Service tests separately prove cross-row sums and lifecycle permissions that SQL cannot enforce alone.
Verify all writes follow database §10's concrete lock order (including account prefix), and that public services share the workflow transaction. Do not call AI/maps/storage/money services inside retried transactions. Operational log-collector failure is distinct from required transactional audit failure.
Settlement creation has no promised durable key: after a lost response inspect existing assignments/results before attempting another create. Do not generalize receipt/adjustment idempotency to every POST.

## 8. Payment and manual reconciliation

- Cash: owner confirmation changes `unpaid→paid` with actor/time/history/audit. Student/Admin attempts fail. Payment confirmation neither completes the Order nor creates a Settlement receipt; completed-but-unpaid still accrues its base.
- Adjustments require a completed Order with an existing base and a nonblank reason; append a signed integer fact, preserve original base. Cancelled/rejected Orders cannot acquire base commission or qualifying adjustments.
- Settlement creation selects nonempty unique unassigned entries from one restaurant and validates period boundaries. Receipts append only, Admin only, positive amount; totals derive from entries and receipts separately. Never edit/delete financial history to correct a test.
- **V0.6/V1.0 QR:** scanning/showing QR or clicking “I transferred” leaves payment unconfirmed. Only verified owner confirmation changes payment. Paid QR cancellation/rejection records `refund_pending` atomically; late verified transfer on a terminal order records confirmation plus refund obligation without reopening it.
- Race owner QR confirmation against cancellation/rejection in both orders; terminal result has the required refund obligation once. Owner records external `refund_pending→refunded`; repeating it produces no duplicate event. Inject audit failure to verify complete rollback.
- QR evidence/representation and exceptional refund rules are pending. Settlement overlap/closure, late-adjustment membership, overcollection and receipt correction/reversal remain explicit release gates; tests must not invent policies.
- For enabled reports, use `completed_at` for completed-order revenue, `created_at` for order lists/entries and `received_at` for receipts. Assert inclusive `from`, exclusive `to`; local October 2026 boundaries are `2026-09-30T17:00:00.000Z` to `2026-10-31T17:00:00.000Z`. Settlement membership is not inferred from these filters.

## 9. AI, delivery failure and later recommendations

Mock `AiGateway` and delivery services with a fixed candidate set. Observe outbound allowlisted payloads, public response, provider call counts and absence of order/payment/financial/transcript writes.

| Input/fault | Assertion |
| --- | --- |
| Normal candidate response | Only supplied real eligible IDs; backend computes restaurant mapping/price/fee/estimate; selecting a result uses normal cart, fresh quote and consent. |
| No candidates / valid empty provider output | Empty candidate set makes no provider call; valid empty result is 200 with `suggestions: []`, no invented replacement. |
| Malformed/truncated JSON, wrong types, duplicate/unknown/real-but-unsent IDs, extra price/URL/action fields | Strictly reject unsafe output. Proposed AI mapping is 503 `AI_UNAVAILABLE`, pending its approval; no raw provider diagnostics or fabricated fallback. |
| Hidden/sold-out/closed/non-accepting/inactive, point disabled or pair missing before/after AI | Excluded independently; re-read after provider return, remove invalid candidates, return only valid survivors or empty. Closing during delay is covered. |
| Price/fee changes during AI | Recompute current estimates and approved budget rules; suggestions never constitute accepted checkout prices. |
| Preferences/catalog content contains fake system instructions, PII or secrets | No arbitrary tool/action/URL execution; no forbidden data reaches adapter. Fail closed if approved minimization cannot make input safe. |
| Script/HTML, payment/price or unsupported dietary guarantees in reason | Safe plain text with unsafe/unsupported claims rejected/suppressed under approved validator; no invented allergen inventory. |
| Timeout/outage/quota/late reply | 504 `AI_TIMEOUT` or applicable 503; platform throttling 429 respects `Retry-After`; bounded calls share deadline/cost allowance; late reply cannot replace current intent. |
| AI unavailable; map unavailable | Manual ordering at a valid surveyed pair still works. Unknown delivery fee blocks confirmation; do not substitute straight-line distance or zero fee. |

Budget discriminator: dish `45000` + fee `5000`, budget `47000`. The expected eligible result remains **pending** until dish-only versus delivery-inclusive scope, quantity and boundaries are approved. Then test below/equal/above limits with exact arithmetic. AI readiness gates cannot be waived by a mock passing.
**Post-V1.0 route tests:** route-versus-straight-line discriminator, each tier minimum/maximum, final inclusive maximum, overlap/gap/out-of-range, provider failure, expired/tampered/mismatched quote and configuration changes. TTL, provider and distance normalization must be finalized first.
**V1.1 random/reorder:** random uses injected ordinary randomness and no AI call; final sampling/retry/empty-result contract is pending. Reorder revalidates current dishes/quote into a new intent. V0.7/V1.0 support is linked to an authorized order and does not mutate accepted status by itself; exact DEC-08 workflow must be approved.

## 10. Browser journeys and UI acceptance

| Journey | Required checkpoints |
| --- | --- |
| E-01 Student cash order | Anonymous browse/filter → guest cart → login/retain/revalidate → select point → single-restaurant cart → valid quote → confirm → reload/recover same Order → track; no optimistic success before commit. |
| E-02 Conflict and disconnection | Change price/fee after review; show old→new values and total, preserve input, require explicit reconfirmation/new key. Drop response after commit; retry original key and recover one Order. |
| E-03 Fulfillment | Separate owner session accepts/rejects with reason or delivers/completes; Student gets current state; losing cancellation refetches; order/payment badges stay independent. |
| E-04 Catalog/history | Owner edits/hides; Admin deactivates; outcomes match response, old snapshots persist; unused restaurant deletion preserves owner's other access. |
| E-05 Reconciliation | Admin groups eligible entries, appends adjustment/receipt with retry protection; owner reads own authoritative totals, denied on another restaurant. |
| E-06 AI unavailable | Retry/manual fallback by 10 s, cart preserved; valid surveyed cash order remains possible. No random suggestion substituted without approved policy. |

Test loading, background refresh, empty/no-match, network/offline, session expiry, forbidden access, validation, pending mutation, conflict and broken-image states. Clear prior protected account data on session change. Do not expose stack traces/raw enums/codes as Student copy or present demo fixtures as production data.
Use fake timers for polling: about 5 s while visible, no overlapping calls, one page-level owner per order, backoff on error, pause hidden/offline, refresh on return. Stop Order polling at terminal status; Payment may continue independently. Delayed older versions cannot overwrite newer state; show real last-updated/connectivity information.
Compare Student screenshots at 390 px and dashboards at 1440 px to the corresponding UI board; additionally test 360/768/1024 px. Preserve shared tokens, Be Vietnam Pro, role layouts and Vietnamese copy. No export wrapper/phone frame; wide tables scroll internally and sticky bars do not cover content.
Verify keyboard-only flow, semantic controls/labels, inline error associations, first-invalid-field focus, named dialogs/focus trap/return, accessible icon controls, text status labels, live regions, 200% zoom, long Vietnamese names, reduced motion and normal-text contrast at least 4.5:1. Automated accessibility checks supplement manual keyboard/screen-reader review.

## 11. NFR measurement and recovery evidence

The requirement thresholds are proposed acceptance targets to measure, not achieved guarantees. Report failures openly; do not replace targets with measurements or loosen them silently.

| Requirement | Measurement protocol and pass evidence |
| --- | --- |
| NFR01 | In a documented staging-like environment run restaurant/dish list loads with 50 concurrent user sessions. Record dataset size, filter mix, browser/network/server/DB resources, polling background load, warm-up, measured duration, cache state, sample count and failures. Measure from user load action to usable rendered list; API/DB timings diagnose. At least 95% of measured loads finish successfully within 2 s; include errors/timeouts in denominator. Duration/dataset are agreed run parameters, not invented product thresholds. |
| NFR02 | Measure recommendation request-to-result at client plus backend/provider stages. Report all requests, completion/error/timeout rates and latency distribution; target ≥95% within 5 s, visible retry/manual state at 10 s. Mock clocks verify control flow; selected live provider with synthetic fixtures establishes real latency/quality/cost. Record prompt/schema/model/config versions, workload and billed retries; rubric/cost limits remain TBD. |
| NFR03 | Verify HTTPS deployment and redirects, approved password hash configuration (no plaintext), JWT signature/expiry/issuer/audience, active-account/ownership checks and no backend secrets in bundle. Verify `__Host-` cookie flags, exact Origin and session-bound CSRF rejection, versioned logout, and no refresh endpoint; no permissive credentialed CORS. |
| NFR04/05 | PRICE, HIST, IDEM, STATE and FIN suites supply exact arithmetic, durable recovery and repeat/race evidence; retain invariant assertions and safe response references. |
| NFR06 | Record viewport/browser and screenshots for complete browse → point → order → track at 360 px with no full-page horizontal scroll. |
| NFR07 | Inspect redacted audit facts for actor/time/target/change content and injected audit rollback. Operational telemetry does not replace business audit. |
| NFR08 | Verify daily backup schedule and successful run evidence. Restore a backup of synthetic representative data into a separate isolated target before go-live; apply documented recovery procedure, start compatible app and compare snapshot/history/ledger/request counts and financial totals. Check relational integrity, login/reads, same-key recovery and one safe new test order. Record backup timestamp/checksum, versions, restore duration, failures and validation results. Never restore over production to test recovery. |

Backup retention, RPO/RTO, hosting and optional image-object recovery policy remain TBD; measure observed recovery without claiming unapproved targets. A backup file existing is not proof that restoration works.

## 12. Commands, CI gates and reporting

Repository check on October 16, 2026: both application packages and CI exist. The current checks below verify the scaffold and the shared HTTP/audit foundation; most acceptance suites in §§4–11 remain to implement. Recheck package manifests and CI before running.

```bash
# Inspect current package scripts from the repository root:
npm --prefix frontend run
npm --prefix backend run
# Install from the corresponding reviewed lockfiles:
npm --prefix frontend ci
npm --prefix backend ci
```

CI targets hw1/main, uses Node.js 24.x and configures frontend/backend checks plus audit/auth integration on **mysql:9.2.0**. This matches the selected **9.2.0** release across environments; the updated CI run is NOT RUN/NOT OBSERVED, not passing evidence. The table also lists local Prisma/connectivity checks; commands are shown with repository-root package prefixes.

| Existing check | Command / evidence boundary |
| --- | --- |
| Frontend lint/build | `npm --prefix frontend run lint`; `npm --prefix frontend run build` (includes TypeScript) |
| Backend lint/unit/build | `npm --prefix backend run lint`; `npm --prefix backend test`; `npm --prefix backend run build` |
| Backend HTTP E2E | `npm --prefix backend run test:e2e`; mocks Prisma, checks `/api/v1` and envelope behavior |
| Real-MySQL audit integration | `TEST_DATABASE_URL=... npm --prefix backend run test:integration`; requires loopback MySQL and a `test_*` or `*_test` database; applies reviewed migrations without reset, then checks audit commit/rollback |
| Browser fixture smoke | `npm --prefix frontend run test:smoke`; requires local Chrome or `BROWSER_BIN`, checks rendered fixture content at 360 px; no connected business flow |
| Prisma validation/generation | `npm --prefix backend run prisma:validate`; `npm --prefix backend run prisma:generate` |
| Actual DB connectivity | `npm --prefix backend run db:check`; builds then `SELECT 1`, requires configured local MySQL; not a constraint/race test |

Not yet configured: business MySQL constraint/race suites, connected browser E2E/accessibility, OpenAPI/examples, import-boundary automation, load/live-AI and restore harnesses. Four account/audit/version/login/email-role SQL migrations exist; no business seed exists. The Chrome fixture smoke script is local tooling, not a CI browser gate. Add tooling when implementing affected features; do not use `--if-present` to make a required missing check green. Migration commands must explicitly use the checked-in `prisma7.config.ts`; never reset retained/shared data.
For documentation-only changes, verify links, section references, canonical paths, line limits and command/source consistency. Application checks apply when executable behavior/config changes.

If absent, report `NOT CONFIGURED: <check/tool>`; a configured but unrun check is `NOT RUN`, not passed. Policy-dependent cases are `BLOCKED: <decision and source>`. Future-scope cases are `NOT APPLICABLE: <milestone>`.

| Gate | Required checks |
| --- | --- |
| Every implementation PR | Relevant lint/type/build and unit tests; affected API/example/boundary checks; MySQL integration for changed data/workflows/auth; deterministic critical race suite for affected invariants; critical checkout/recovery/fulfillment browser smoke; safe-secret/artifact checks. No live AI dependency. |
| UI or shared-component PR | Applicable browser conflict/fallback/authorization paths, responsive/accessibility and visual comparisons across affected roles. |
| Schema/finance/security PR | Empty + upgrade migration fixtures, actual SQL constraints/runtime grants, full affected finance/auth/race/rollback tests, explicit migration and security review. |
| AI prompt/model/adapter PR | Versioned fixed validation/privacy/injection/fallback suite; approved live synthetic evaluation comparison before deploying provider/model behavior changes. |
| Before milestone release | Full enabled-scope U/I/R/E suite, agreed browser checks, NFR01–08 evidence including load/live AI where enabled and isolated restore; finalized contracts/security/config and migration rehearsal. Future scope stays disabled. |

The existing CI checks do not establish configured branch protection or completion of these planned gates. Missing required tooling/evidence blocks claiming the affected release gate passed. Do not hide failed race/financial/security tests with blanket retries; record first failure and fix its cause. Changes unrelated to an established green suite do not require repeated broad runs without new risk.

## 13. Release decisions and completion evidence

Resolve in owning documents before enabling affected capabilities: quote artifact protection and route TTL/normalization; point provisioning; AI budget/preferences/privacy/limits/provider/evaluation; QR evidence/refunds; financial period/exception/correction policies; post-V1.0 DTOs; real-MySQL/browser tooling, additional CI gates, exact production Node/npm toolchain and backup operations. Required V1.0 decisions remain V1.0 blockers, not scope deferrals disguised as green tests.
For each run retain commit, milestone/feature flags, exact commands, runtime/DB/browser/provider versions, fixture seed, timestamps, case/source IDs, pass/fail/blocked counts and sanitized artifacts. Distinguish automated results, manual observation and source inspection. Record defects with reproduction and invariant impact; do not claim browser, production-load or backup verification from document review.
Done for a milestone means its enabled cases pass, necessary NFR measurements and restore evidence exist, required policies are resolved, failures/missing checks are visible, and excluded/future features remain disabled. This file defines that evidence; it does not certify an implementation that has not been tested.

[Roadmap](roadmap.md) owns version completion; [launch checklist](release-checklist.md) owns the V1.0 evidence dossier. Older role-approval/multi-owner/cash-only evidence proves only the former design, not these revised cases.

## Scoped V0.1 verification follow-up — October 19, 2026

[P01](progress/P01.md), [P02](progress/P02.md) and [P03](progress/P03.md) record clean-lockfile local results and actual acceptance gaps. No new test IDs or production pass is inferred.

- `npm --prefix backend run test:cli`: real signed Ed25519 manifest + Python PTY + CLI + MySQL 9.2.0; 18 initialization/re-enrollment/rejection cases. Requires a fresh empty loopback `test_*` DB, DB-create privileges for disposable rehearsal schemas, Python 3 PTY and MySQL clients. No retained DB writes, human signatures or raw secret logging. Only outbound password-corpus lookup is replaced.
- `npm --prefix backend run test:smtp`: migrated loopback `test_*` DB, OpenSSL and Python-independent Node SMTP harness. Actual Nodemailer STARTTLS/AUTH delivery to an ephemeral local mailbox, random codes, expiry/resend/verification and logout checks. Test CA is trusted only in the child process; no external mail or production TLS bypass.
- Existing `test:integration` now also checks two concurrent creates for one unassigned owner yield one inactive/setup-required restaurant. Existing browser `test:connected` uses a separate migrated disposable DB; its SMTP/code replacement is not real email evidence.

The [October 19 follow-up](auth-followup.md) adds previous-backend expansion-window compatibility, safe internal returns, expired-email Chrome coverage and real runtime/provision grants/CLI/browser evidence, including authorized local configuration. The subsequent [final review](progress/V0.1.md) accepts V0.1 after confirming the complete P01–P03 gates. Remote CI and production deployment remain NOT RUN.

`test:compatibility` builds the previous backend/client and exercises actual HTTP reads/auth/profile/logout after expansion on a fresh empty loopback `test_*` DB. `test:permissions` requires a fresh migrated fixture without an authority and creates restricted synthetic users. `test:connected` accepts `TEST_RUNTIME_DATABASE_URL` only for a distinct user on its same disposable DB; fixture setup uses the test operator, HTTP uses runtime. See [exact evidence](auth-followup.md#exact-verification).
