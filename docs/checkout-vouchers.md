# Checkout and voucher contract

> October29 revision: [approved single-restaurant cart and checkout](ui/purchase-history-figma.md) supersedes October25 grouped cart/new multi-order confirmation. Adding valid dishes from another restaurant replaces the old cart; new checkout confirms one order. Legacy uncertain requests retain recovery.

> October25 COD cutover: [approved operating/API/history contract](cod-ordering.md) supersedes new-order cash/QR selection, QR authoring/review and platform voucher issuance/redemption. Legacy payment/refund and accepted voucher subsidy obligations remain. Prior verification is historical.

Approved by the repository operator/user on October 25, 2026 in the checkout implementation request. This scoped extension supersedes earlier no-discount total formulas; it does not authorize retained-data migration, deployment, publication of partner terms or money transfers.

## Checkout and consent

Authenticated checkout displays current profile name/phone read-only. Missing/invalid contact blocks new orders; the server validates recipient against the locked current account. Existing successful idempotency replays precede profile checks. Encrypted recipient snapshots remain immutable.

Cart hands off its selected point and reviewed quote, expiration and cart fingerprint in account-scoped session storage, never in the public cart. Checkout has no independent point selector or manual quote step. Missing handoff returns to cart; expiration refreshes in the background and changed money requires explicit confirmation. Success replaces the form only after server acknowledgement; fulfillment and payment are independent.

## Voucher policy

Owners create restaurant-only vouchers funded by that restaurant. Platform-wide Admin vouchers are historical only after the COD cutover; fresh creation/toggling and new redemption are retired. Codes are globally unique, trimmed uppercase ASCII letters/digits/hyphen/underscore, 3–32 characters. Financial configuration is immutable; only active state changes with expected_version. Create/toggle are audited and idempotent; current ownership/MFA is rechecked on replay.

Fields: rate (eight-place fraction, >0 through 1), max_discount_vnd (>0), min_subtotal_vnd (>=0), starts_at/ends_at (UTC milliseconds, start inclusive/end exclusive), total_limit and per_account_limit (positive integers). Creator enters all values; no real promotion is seeded. One voucher per order, no stacking or delivery discount. Preview never reserves a use. Usage is consumed atomically only by successful order creation and is not returned on cancellation/rejection.

Discount = min(subtotal, cap, round-half-up(subtotal × rate)). Subtotal remains pre-discount accepted dish value; total = subtotal - discount + surveyed delivery fee. All money is integer-string VND and exact BigInt/Decimal. Server rechecks prices/fee/voucher/quota on submission; changed accepted money or voucher version returns an actionable conflict. Invalid/exhausted voucher never silently disappears.

Zero-total orders have payment status not_required with no receipt confirmation or QR transfer instructions. Existing zero-total historical orders are not reclassified. New nonzero orders use COD/not_tracked. Historical QR orders retain approved receipt/refund semantics and refunds use actual received amounts.

## Financial ledger

New financial facts/report policy use `DEC-07.2026-10-25.v2`; historical v1 facts retain their version. Base commission remains pre-discount dish subtotal × accepted commission rate, half-up once per order, delivery excluded. On completion, platform voucher subsidy creates one negative voucher_subsidy entry for the snapshotted discount, atomically with completion/base/audit. Restaurant vouchers create no subsidy. Cancelled/rejected orders create neither base nor subsidy. Completion may remain unpaid.

Subsidies book in the completion month and are included in all signed period/account balances, eligible-entry finalization and collection guards. They are separately reported from manual adjustments. Negative balances carry obligations/credit for manual offset; no automatic payout or duplicate carry entry. Historical financial facts are preserved.

## Transactions and storage

Forward migration adds vouchers, voucher_redemptions, order discount/snapshot and unique subsidy order linkage, and extends amount/payment/ledger constraints. Old orders default to zero discount/null voucher. No historical recipient/voucher/subsidy is inferred.

Lock order extends database §10: account(s), authority if needed, restaurant, dishes, voucher, delivery dependencies, order/payment/ledger; IDs sorted within each group. Completion reads immutable order voucher snapshot and does not acquire voucher locks after order locks. Voucher row serializes quota across accounts/processes. Redemption order uniqueness and subsidy-order uniqueness guard repeats. All owning repositories use the same transaction context; no process mutex or external call inside retries.

## API additions

POST /api/v1/orders/preview accepts the create-order DTO, validates current authoritative breakdown and returns current items, quote, voucher and amounts without creating orders/payment/redemptions. Recipient validation is required for creation, not preview. An optional voucher_code plus accepted_voucher {id,version,discount_vnd} extends create-order; absent fields preserve legacy canonical fingerprints. Preview may omit accepted_voucher when applying a code.

GET/POST /api/v1/admin/vouchers and GET/POST /api/v1/owner/restaurants/{id}/vouchers manage their respective scope. PATCH their /{voucher_id} accepts expected_version,is_active. Mutations require Idempotency-Key, existing CSRF/account transport and closed DTOs. Lists paginate ascending IDs with after_id.

Order projection adds current restaurant_name (not a historical name claim), discount_vnd and voucher_snapshot. Conflicts extend existing PRICE_OR_FEE_CHANGED/QUOTE_STALE details with discount and current_voucher. VOUCHER_UNAVAILABLE identifies invalid/suspended/out-of-scope/expired/exhausted codes; PROFILE_INCOMPLETE and PROFILE_CHANGED identify contact recovery. New financial kind voucher_subsidy is immutable and system-derived.

## Verification

VOUCHER-01 covers exact arithmetic, limits, authority, scope, lifecycle, snapshot and zero totals. VOUCHER-RACE-01 covers independent MySQL transactions, last use, per-account limits, rollback and replay. Existing PRICE-01, IDEM-01/02, HIST-01, PAY-01/02 and FIN-01/02 remain applicable. Source, unit, real MySQL and browser evidence are reported separately in checkout verification; this contract is not a passing-test record.

Implementation and measured evidence: [checkout verification](ui/checkout-verification.md).
