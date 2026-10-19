# Direct QR Payment and Refund Policy Gate

Authority: requirements BR11–14, API §§7.4/9 and database §4.4. V0.6 P19 settles DEC-06 before P20/P21. Cash/QR money goes directly to the restaurant; the platform records facts and obligations, never holds or splits funds.

## Fixed invariants

- Order fulfillment, payment receipt and refund obligation/progress are independent dimensions. A payment change cannot reopen a terminal order or generate platform commission receipts.
- Owner verifies actual receipt before confirming. Scanning/showing QR and customer “Đã chuyển khoản” are unverified claims only.
- Existing payment status projection remains `unpaid|paid|refund_pending|refunded`. Internally retain receipt confirmation and separate refund-obligation/history facts so `refund_pending` does not erase when/how receipt occurred. No new combined fulfillment/payment enum.
- A paid QR order cancelled/rejected while pending creates `refund_pending` atomically with the order transition. A late verified receipt on a cancelled/rejected order records receipt and refund obligation together; order stays terminal.
- Restaurant refunds externally; authorized owner records completion/evidence. Repeated confirmation/refund has no duplicate history/audit; failure rolls back the fact and audit together.
- Completed orders may remain unpaid; payment confirmation does not complete orders. Commission remains completed-order dish subtotal × snapshotted rate.

## P19 decisions required

Approve exact QR/bank configuration fields and verification, how instructions bind to an order/payee/reference/amount, protection/versioning of instruction history, who may see each field, proof collection/retention, duplicate/late/wrong-amount transfer handling, full versus partial refunds, exceptional cash refund policy, deadlines/responsibility, dispute/support escalation and Vietnamese customer notices. No bank data, vendor or refund deadline is selected here.

P19 must define whether a separate refund record is required beyond independent retained receipt/refund facts/history, and finalize request/response/evidence schemas plus state guards. If partial refunds are selected, define exact amounts and aggregate invariants before extending statuses. No arbitrary manual payment-state PATCH.

## API and evidence handoff

Target QR settings, order payment-instructions, owner confirm and confirm-refund routes remain in API §11 but are **V0.6 required**, not post-V1.0 scope. P19 moves finalized schemas into enabled API/OpenAPI contracts; P20 adds storage/transactions and P21 connects UI. No claim of existing QR support is made.

PAY-02 must cover actual-owner checks, instructions privacy, QR scans/unverified claims, late confirmations, paid-cancel race in both serial orders, refund completion/repeat/failure rollback, immutable history and independent fulfillment/payment/refund display. Use real MySQL 9.2.0 and browser evidence before V0.6 acceptance. Refund policy cannot be inferred from a mockup.
