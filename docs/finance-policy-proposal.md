# DEC-07 — Approved reconciliation policy

> October25 COD cutover: [approved operating/API/history contract](cod-ordering.md) supersedes new-order cash/QR selection, QR authoring/review and platform voucher issuance/redemption. Legacy payment/refund and accepted voucher subsidy obligations remain. Prior verification is historical.

Status: **APPROVED by the repository operator/user**, October 21, 2026. Decision package `DEC-07.2026-10-21.v1`.
Owner: [DEC-07](decisions.md), requirements US15/17, BR20–27, AC10/11.
Scope: [P22](prompts/v0.7.md#p22), followed by P23 backend and P24 UI/reports after explicit approval.
Explicit approval: “Duyệt toàn bộ gói DEC-07, triển khai P23–P24”. Implementation acceptance is separate. This policy does not itself enable endpoints, publish terms, record partner consent or authorize retained-data adoption.

## 1. Already approved baseline

Preserve [partnership terms §8](terms/partnership-2026-10-19.v1.txt): calendar months in `Asia/Ho_Chi_Minh`, prior-month statement by the 3rd, payment by 23:59:59 on the 7th including holidays/weekends. No automatic penalty or suspension. Corrections append in a later period; preserve signed balances; do not collect above the amount due.

Preserve negotiated DEC-04 rates, immutable order snapshots, completed-only base commission, delivery exclusion and half-up rounding once per order. Completion may be unpaid. No commission on cancelled/rejected orders. Anti-evasion recoveries require a separate approved receivable design and are outside this package.

## 2. Period membership and finalization

- A period is one whole local calendar month, stored as a half-open UTC interval `[start,end)`. October 2026 is `2026-09-30T17:00:00.000Z` through `2026-10-31T17:00:00.000Z`.
- Base entry membership follows the immutable order `completed_at`, never order creation, receipt time or today's rate. Completion and its base still commit atomically.
- An adjustment references the same restaurant's completed order and existing base. Its signed amount is nonzero; a reason and verified supporting reference are mandatory. Its booking month is the later of its server-recorded local month and the month immediately after the base's completion month. Clients cannot backdate booking membership. Thus even an adjustment entered before the base month ends belongs to a later month.
- Only the sole MFA Admin finalizes a month after its end. Finalization creates the settlement and assigns **all** eligible, unassigned entries for that restaurant/month in one transaction. The submitted unique entry IDs must equal the server's eligible set; reject omitted, foreign, future-month or already-assigned entries. Never silently ignore invalid IDs.
- Finalize the earliest unfinalized nonempty month first. Months without entries display a zero report and require no empty settlement. A nonempty net-zero month can be finalized.
- At most one settlement per restaurant/month; arbitrary or overlapping intervals are rejected. A unique restaurant/start boundary plus whole-month validation protects competing creates. Losing mixed/overlapping assignment rolls back settlement, assignments and audit in full.
- Creation is finalization: membership, boundaries and original facts are immutable. There is no draft/closed/paid settlement enum, reopen, deletion, reassignment, automatic close job or cached balance. Later receipt facts remain appendable to that settlement.
- The monthly statement deadline is an operational obligation; no automatic outbound message is introduced. The UI identifies missing/late statements and overdue positive debt from dates and amounts, without automatic collection or suspension.

## 3. Corrections, receipts and signed credit

### Commission corrections

Admin appends a signed adjustment with `order_id,amount_vnd,reason,evidence_reference`. Negative adjustments may exceed a base and create credit; do not clamp or change the base. Correct an erroneous adjustment by another reasoned adjustment referencing it (`corrects_entry_id`); original history survives. Correction booking is also no earlier than the month after the corrected entry's booking month. The server verifies same order/restaurant and rejects correction cycles.

No UI/API may turn an allegation into an anti-evasion charge, reopen a terminal order or edit an accepted rate. Subsequent refunds do not automatically reverse commission; a verified financial correction is a separate Admin decision with evidence/reason.

### Manual receipts

- Admin records money actually received from a restaurant, using a positive integer VND amount, actual `received_at`, method `cash|bank_transfer`, nonblank reference and verified supporting reference. `received_at` cannot be in the future; server `created_at` remains the recording instant. Recording never initiates a transfer.
- The settlement must already exist. At the shared restaurant/settlement lock, require amount ≤ positive settlement outstanding **and** amount ≤ positive restaurant-wide outstanding. If either outstanding is ≤0, reject collection. The restaurant-wide figure includes all recorded base/adjustment facts, assigned or unassigned, minus effective receipts; future-booked negative adjustments therefore protect existing credit immediately. Unassigned positive facts do not bypass the individual-settlement limit.
- Both checks use exact signed arithmetic and serialize with adjustments/other receipts/reversals under the restaurant lock. Negative figures remain visible; the positivity test is a write guard, not a report clamp.
- Credit is carried by the signed restaurant-wide balance. Do not insert duplicate carry-forward entries or duplicate old credit into a new settlement. Show period outstanding alongside account outstanding and the currently collectible amount, explaining why these can differ.
- A later valid negative adjustment can make an already-collected account negative. Retain the credit for offset against future dues. No automatic cash payout, write-off, penalty or cross-restaurant offset is authorized.

### Receipt corrections

- Never UPDATE/DELETE an original receipt. Admin appends **one full reversal** referencing the original receipt, with mandatory reason and supporting reference; amount is derived from the receipt, never client-entered or negative in storage.
- Reversal corrects a recording error; it does not state that money was sent back to the partner. Partial reversals, reversal of a reversal and cash refunds of commission credit are outside scope.
- A corrected replacement is a new ordinary receipt, linked through `replaces_receipt_id` to the reversed original and subject to the same amount/authority/evidence guards. At most one direct replacement per original; later errors reverse the replacement. Original reference and actual receipt time remain visible in the chain.
- If only an erroneous time/reference/settlement was entered, reverse then record the corrected replacement. Display the unfinished correction chain explicitly if replacement fails. Each action is independently durable and auditable; no optimistic success.
- Effective collected for a settlement = sum(original receipts) − sum(full reversals). A reversal belongs to its original settlement even when recorded later. No changes to original settlement membership occur.
- Identical normalized method/reference within a restaurant identifies the same collection event. Reject a second active receipt for it; a replacement may reuse its reversed ancestor's reference. Do not expose or assume global uniqueness across restaurants. Keys still protect retries even when references differ.

## 4. Authority, evidence and recovery

Only the current sole MFA Admin writes finance facts. Current owner reads their own restaurant, including inactive restaurants; buyers and other owners cannot read it. Reauthorize nested IDs, lists/cursors and replays. General suspension handling/support escalation stays **DEC-08/P25**, without granting Admin fulfillment/payment powers.

Evidence is a protected, verified voucher/bank-event reference, not an arbitrary URL or publicly served image. Require trimmed reason ≤1000 characters where specified, reference ≤255 and evidence reference ≤255. Do not accept raw bank account details, recipient contacts or uploaded proof files in these fields. Admin sees supporting references; owners see amounts, method, ordinary collection reference, reason and correction links, with supporting references redacted. Audit stores safe IDs/action/reason, not evidence contents or bank details. No new external storage/provider/cost is introduced; attachment workflows/retention remain outside this package.

Finance facts, exact decision version, actors, recording times, request results and audit survive corrections. No new purge job or retention duration is invented; production retention/publication remains DEC-08/12. Proposed Vietnamese addendum below needs explicit approval; existing accepted terms/hash/consents must remain byte-for-byte unchanged. Future real partner adoption needs versioned publication and explicit consent; synthetic testing must never be represented as that consent.

Receipt, reversal and adjustment use durable actor+operation+key+canonical-payload-hash+result committed with fact/audit. Same key/content replays the original result; changed content returns `IDEMPOTENCY_KEY_REUSED`. Retain original actor/target/body/key on timeout, offline, reload or lost response. Reconcile that intent before a new one. All financial writes obey [database §10](data/database.md#10-transaction-and-concurrency-recipes); reversal rows lock after their receipt under the restaurant/settlement prefix.

Settlement creation retains retry category C: **no promised durable create key**. On unknown result, fetch the unique restaurant/month settlement and its complete sorted assigned IDs. Exact match recovers success; different assignment or unresolved read requires reconciliation and blocks another create. An authoritative read showing no settlement and all original entries unassigned permits an explicitly confirmed retry; a concurrent competing create still yields a safe conflict. Never auto-generate a new period or selection to escape uncertainty.

## 5. Approved DTOs and report definitions

All operations remain TARGET until implemented and verified. Extend the canonical [API](data/api_contract.md#75-commission-and-settlement--v10-minimal-operations); base path `/api/v1`. Unknown request fields rejected. IDs/integer VND are canonical strings; signed adjustment/balance strings allow negatives, not `-0`. Rates remain eight-place fractions. UTC instants use millisecond ISO strings. List limit20/default,100/max with scope/filter-bound keyset cursors.

| Operation | Proposed contract |
| --- | --- |
| POST `/commission-adjustments` | Key; `order_id,amount_vnd,reason,evidence_reference`, optional `corrects_entry_id`; server derives restaurant/base/booking month |
| POST `/settlements` | `restaurant_id,period_start_at,period_end_at,entry_ids`; server validates full eligible set; 201 or safe conflict |
| GET `/settlements` / `/{id}` | Existing own/Admin projections, period boundaries, assigned entry IDs and totals; restaurant/month filter supports uncertain-create recovery |
| POST `/settlements/{id}/receipts` | Key; `amount_vnd,received_at,method,reference,evidence_reference`, optional `note,replaces_receipt_id` |
| POST `/settlements/{id}/receipts/{receipt_id}/reversals` | Key; `reason,evidence_reference`; full amount and target restaurant derived |
| GET `/settlements/{id}/receipts` | Original receipts plus linked reversal/replacement facts, actor/recording time and owner-redacted evidence |
| GET `/reports/commissions` | Owner own/Admin; `restaurant_id,from,to,as_of` and bounded cursor; monthly rows with exact fields below |

Approved common errors: 404 concealed foreign target; 403 forbidden operation; 422 invalid scalar/period/set/context; 409 `ENTRY_ALREADY_ASSIGNED`, `PERIOD_ALREADY_FINALIZED`, `ELIGIBLE_ENTRIES_CHANGED`, `COLLECTION_EXCEEDS_OUTSTANDING`, `RECEIPT_ALREADY_REVERSED`, `COLLECTION_REFERENCE_REUSED` or `IDEMPOTENCY_KEY_REUSED`; unresolved request503 with existing retry contract. Error details contain no foreign IDs/evidence.

Reports carry `policy_version,as_of,timezone,restaurant_id,period_start_at,period_end_at,settlement_id` (nullable), and a current restaurant label explicitly identified as current. The server returns an `as_of` on first read; subsequent pages bind the same cutoff and filters. Derive from a consistent DB snapshot, facts recorded at/before `as_of` and membership/assignment existing at that cutoff. Historical `as_of` before finalization must not display the later settlement assignment.

| View / exact fields | Time basis and formula |
| --- | --- |
| Order revenue: `completed_order_count,dish_revenue_vnd,delivery_fee_vnd,order_total_vnd` | Completed orders by `completed_at` in `[from,to)`; snapshot subtotal and fees. Cancelled/rejected excluded; unpaid completed included. Delivery separate from commission basis. |
| Period ledger: `base_vnd,adjustment_vnd,receivable_vnd,collected_vnd,outstanding_vnd` | Booking-month entries, and receipts/reversals linked to its settlement at `as_of`. Receivable=base+adjustment; collected=receipts−reversals; outstanding=receivable−collected. Before finalization show eligible ledger totals and `settlement_id:null`, with no collection action. |
| Collection activity: `gross_receipts_vnd,receipt_reversals_vnd,net_recorded_collection_vnd` | Gross receipts use actual `received_at` in interval; reversals use server recording time in interval. Net recorded activity=gross−reversals; this is not a claim of bank cash movement for reversals. |
| Account summary: `account_receivable_vnd,account_collected_vnd,account_outstanding_vnd,collectible_vnd` | All recorded account facts at `as_of`, without duplicating period carry; collectible is zero if account/target-period outstanding≤0, otherwise their lesser amount. Show one account summary outside paginated period subtotals. |

Aggregate entries, receipts, reversals and orders separately before combining; do not multiply joins or sum the repeated account summary. Historical receipt-time views consider only facts recorded by `as_of`; backdated receipts never rewrite a previously reproducible cutoff. Successful outputs are 200 reads, 201 creates / 200 keyed replays with existing envelopes/headers. No financial mutation becomes public.

## 6. Independent arithmetic and verification plan

Fixtures below are fictional integer arithmetic examples, not commercial rates/partner data or executed application tests.

| Case | Expected result |
| --- | --- |
| Two completed orders: subtotal90000/105, fees5000/0, negotiated rate5% | Dish revenue90105, delivery5000, order total95105; base4500+5=4505 (105×5%=5.25), independent of customer-paid status. |
| Bases9000+4000; adjustment−1000; receipts3000+2000 | Receivable12000; collected5000; outstanding7000. Four fact groups must not multiply each other. |
| Base8000; receipt8000; subsequent next-month adjustment−1000 | Old period outstanding0; next period−1000; account−1000; collectible0. Credit is not copied as another entry. |
| Prior credit−1000; new finalized period base4000 | Account outstanding3000, period4000; collection3001 rejected,3000 allowed. After3000 account0, period1000; UI explains the prior credit. |
| Period receivable8000; receipt3000 reversed; replacement2000 | Gross receipts5000; reversals3000; effective collected2000; outstanding6000. Original rows remain. |
| September receipt3000 recorded October2; reversed October5 | September activity gross3000 once the receipt is recorded; October activity reversal3000. `as_of` October1 includes neither; October3 includes receipt only. Period ledger uses the original settlement throughout. |
| Completion exactly October31 17:00 UTC | November base membership; one millisecond earlier is October. Adjustment to October base recorded October21 books November; September-base adjustment on October21 books October. |

FIN-03: keyed same/changed receipt/adjustment/reversal requests; one effective correction chain; authority and foreign nested ID denial; duplicate event reference; injected audit/result failures; amount guard versus simultaneous negative adjustment/collection/reversal. Verify actual MySQL9.2.0 durable rows and restricted runtime cannot edit facts.

FIN-04: month boundaries, duplicate/overlapping/full-set finalization, earliest nonempty month, competing mixed selection with complete rollback, adjustment created during finalization, immutable historical assignment, uncertain create after response loss/reload. Two independent connections/processes where relevant.

FIN-05: independent BigInt oracle for examples above, signed credit without duplicated carry, separate aggregation, booking/receipt/completion/recording clocks, stable cutoff across pages and historical pre-finalization cutoff. Browser real APIs: owner isolation, Admin confirmations, unknown outcomes, keyboard/dialog focus,360/390/768/1024/1440px.

P23 must extend forward SQL/Prisma/grants, financial request operations and enabled OpenAPI schemas without editing applied migrations or fabricating old settlement/receipt facts. P24 connects approved reports/UI only after P23 acceptance. At the P22 preparation checkpoint, finance-specific tooling was NOT CONFIGURED and application tests were NOT RUN. Subsequent implementation/evidence is recorded in [P23](progress/P23.md), [P24](progress/P24.md) and the [local verification guide](finance-local-verification.md).

Source compatibility at the P22 checkpoint: `commission_entries.order_id` was unique and supported bases only. A reviewed forward migration must preserve each existing ID/amount/actor/time, replace that uniqueness with nullable unique `base_order_id` plus the explicit-null kind guard, and add same-restaurant composite order/settlement constraints. Do not infer missing receipts. Add immutable booking/correction links, one-time settlement assignment grants, full-reversal uniqueness and replacement/event-reference constraints. Facts and successful financial request results cannot be overwritten. Record `DEC-07.2026-10-21.v1` on new policy facts. Actual constraint/race/upgrade evidence is required in P23.

## 7. Approved Vietnamese addendum (publication separate)

Approved text version `finance-2026-10-21.v1`; not published/effective/consented by any real partner:

> Mỗi quán có tối đa một bảng đối soát cho mỗi tháng dương lịch theo giờ Việt Nam. Bảng được chốt sau khi hết tháng, gồm toàn bộ khoản đủ điều kiện của kỳ và không sửa lại. Hoa hồng cơ bản theo thời điểm hoàn thành đơn; khoản điều chỉnh có lý do và bằng chứng được ghi vào kỳ sau, không sửa hoặc xóa khoản cũ. Quán nhận bảng tháng trước chậm nhất ngày 3 và thanh toán chậm nhất 23:59:59 ngày 7, kể cả cuối tuần, ngày lễ.
>
> Tiền thu được ghi thủ công sau khi kiểm tra thực nhận. Không thu vượt dư nợ dương của kỳ hoặc toàn quán sau bù trừ; số dư âm được giữ để trừ vào nghĩa vụ tiếp theo, không tự động hoàn tiền hoặc xóa nợ. Sai biên nhận được sửa bằng bản ghi đảo toàn bộ có liên kết, lý do và bằng chứng; nếu cần, lập biên nhận thay thế. Đảo biên nhận chỉ sửa sổ, không xác nhận đã hoàn tiền. Lịch sử gốc được giữ nguyên. Không tự động phạt, khóa quán hoặc chuyển tiền vì quá hạn.

## 8. Decision and alternatives

The repository operator/user approved this complete package on October21: “Duyệt toàn bộ gói DEC-07, triển khai P23–P24”. The decision is recorded in DEC-07 and the owning requirements/database/API references; implementation acceptance is separate. Approval does not mean production publication, real partner agreement, external messaging or retained migration.

Alternatives considered: partial/custom periods permit omitted debt/overlaps and complicate recovery; mutable reopen erases accepted history; receipt editing destroys auditability; clamped credit can overcharge; keying settlement creates would require an additional request-result design (not necessary with unique-month recovery). Full reversal is simpler to audit than partial reversal but needs a separate replacement step. Mandatory evidence references minimize new storage/retention exposure; attachments can be designed separately. No provider fee or new commercial rate is introduced.

DEC-08 stays unresolved until P25: suspension with active orders/refunds/debt, scoped support statuses/escalation/response targets, audit lookup/access, and privacy/retention/deletion rules need their own concrete package and explicit choice. DEC-07 approval does not approve those controls or the separate anti-evasion receivable.

## Approved voucher subsidy extension

The October 25, 2026 user-approved [checkout/voucher contract](checkout-vouchers.md) extends this specification: owner-funded restaurant codes, historical platform-funded global codes (no new issuance/redemption), pre-discount commission, preserved legacy completion subsidies, exact discounted totals and independent `not_required` payment for new zero-total orders. It supersedes earlier conflicting no-discount formulas only within this capability. Vouchers own definitions/redemptions; orders own immutable discount snapshots; commissions own subsidy ledger entries.
