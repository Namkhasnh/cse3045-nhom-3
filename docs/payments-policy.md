# Direct QR Payment and Refund Policy

Authority: requirements BR11–14; API §§7.4/9/11; database §4.4. DEC-06 approved by the repository operator/user on October 20, 2026 through explicit policy answers, full contract approval and implementation request. Local synthetic implementation only; no production/retained-data adoption or DEC-08 general support authorization.

## Approved choices and invariants

Cash/QR funds go directly to the restaurant. The platform never transfers, holds or splits funds. Fulfillment, verified receipts, refund obligations and disputes remain independent. Scanning/showing QR and buyer claims never prove receipt; completion may remain unpaid. No partial refunds or exceptional cash refunds. Existing approved full direct refund within24h is preserved.

- Static JPEG/PNG QR, manually checked by the sole MFA Admin against bank/payee fields. Owner attests the account belongs to the owner/business or is authorized for that business. No live bank check/test transfer. Alternative offline dynamic QR rejected for this increment.
- Owner submits `{expected_version,bank_code,bank_name,account_number,account_name,qr_image_id,authorized_payee:true}`. QR proposal states `pending→approved/rejected`, approved→suspended. Payee/image immutable; current pointer/version is separate. New approval affects new orders only; old approved snapshots remain usable unless suspended. Owner or MFA Admin may suspend with reason. Reactivation needs a new approved proposal.
- Each QR order stores immutable approved QR ID/version, bank/payee fields, image, total VND and reference `HLF` + decimal order ID. `accepted_qr_version` is required at create; changed active version is a409 explicit-reconfirmation conflict. QR checkout unavailable without approved active configuration; cash unaffected.
- Static QR does not promise amount/reference encoding. Display exact order amount/reference for manual entry. Stop inviting transfers after matched payment, cancellation/rejection or QR suspension. Keep history and allow verified late receipts. Completed-but-unpaid orders may still be paid.
- Instructions (including historical bank details/image) visible only to owning buyer, current restaurant owner and MFA Admin; no-store, no public links. Bank receipt/refund transaction references and evidence visible only to current owner/MFA Admin. Buyer sees amounts/times/classification/outcomes, never bank proof images.

## Receipt, refund and dispute facts

Verified receipts are append-only and classified by backend: `late` on cancelled/rejected orders; otherwise `wrong_amount`, `wrong_reference`, `duplicate` when a matching applied receipt already exists, else `matched` (that precedence). Each receipt records actual amount, bank transaction reference/time, instruction version, protected evidence and verifying actor/time. Receipt identity is canonical bank code+payee account+transaction reference across QR versions and orders. Same identity/content is a no-op; conflicting content is409. A transaction cannot fund two orders. Receipt/reference/time never derive from a buyer claim.

Each nonmatched receipt immediately creates one obligation to refund its entire received amount. Cancellation/rejection creates an obligation for every still-retained matched receipt atomically. Late receipt creates its fact and obligation together. No offsets, topups or partial allocation. One receipt has at most one refund obligation. A later matching payment may pay a noncancelled/nonrejected order while wrong/duplicate receipts remain independently refundable.

Refund `pending→refunded` requires current owner, exact full receipt amount, actual refund transaction reference/time, mandatory image and `returned_to_original_sender:true` after external verification. One refund transfer cannot discharge two obligations. Same successful request or same effective fact adds no history/audit. Changed facts conflict. Owner records completion; neither buyer nor Admin can confirm funds. Facts and audit/key/result roll back together. No arbitrary payment-state PATCH or state reopening.

Due instant is server time when both verified receipt and obligation exist, plus24h; client backdating does not move it. Disputes do not extend it. Overdue is computed and displayed to owner/Admin, without external messages. Restaurant owns refund execution; Admin reviews/escalates overdue disputes and records conclusions, not financial facts. No automatic compensation, account suspension, banking calls or guaranteed support-response SLA.

Disputes are order-linked `open→resolved` with version, reason and Admin resolution note. Owning buyer/current owner/MFA Admin can open/read; only MFA Admin resolves. New issues may open a new case. Erroneous receipt/refund assertions are disputed without editing/deleting money history or fabricating reversals. General support/suspension remains DEC-08/P25; launch publication remains DEC-12.

Projection: any pending obligation→`refund_pending`; otherwise any retained matching receipt→`paid`; otherwise receipts exist and all refunded→`refunded`; otherwise `unpaid`. `order_paid` independently means a retained matching receipt exists. Return receipts/refunds separately; legacy unknown payment stays unknown. Cash uses its preserved independent confirmation contract.

## DTO, retry and protection

[Payment OpenAPI](data/payments.openapi.json) owns exact wire schemas. Extend existing QR settings, instructions, confirm and confirm-refund routes from API §11; add QR review/suspend, protected upload/read, claims and payment disputes. JSON unknown fields rejected. IDs/integer VND strings; UTC milliseconds; versions positive integers (initial configuration0); exact BigInt/Decimal/rates unchanged.

- QR confirm: `{instruction_version,transaction_reference,amount_vnd,received_at,observed_reference,evidence_id,verified_received:true}`.
- Refund: `{refund_id,amount_vnd,transaction_reference,refunded_at,evidence_id,returned_to_original_sender:true}`.
- Claim: `{instruction_version,reported_sent:true}`. One claim per buyer/order/version, no payment effect.
- Dispute create: `{receipt_id?,refund_id?,reason}`; resolve: `{expected_version,resolution_note}`. Referenced facts must belong to the order.
- New mutations require actor+operation+Idempotency-Key/hash/result atomically with history/audit; config/review also expected_version. Original uncertain request retains payload/key across reload; changed confirmed intent gets new key. Reauthorize replay under current ownership; never return cross-account stored private payload.
- Receipts/refunds keep actor/time and projection version even when status stays the same. Bank references are canonical trimmed text, case-sensitive; bank codes uppercase ASCII; account numbers ASCII digits with leading zeroes preserved. No coercion to Number.
- Evidence images JPEG/PNG≤5MiB,≤4096 per side/16million pixels, decode/reencode strips metadata. Mandatory redaction of unrelated bank information is an owner responsibility; no assertion that automated processing proves redaction. Storage outside retried transactions; recheck authority before attaching/reading. No bank/contact/evidence contents in logs/audit.

## Retention and lifecycle

Private local MinIO only (DEC-10). QR image survives while referenced by instructions/history; never public. Unattached uploads expire after24h. Receipt/refund evidence expires90days after order financial handling is finished (terminal fulfillment and all receipt refund obligations settled), unless any dispute remains open; resolution restarts the90day grace. Pending refund/active order evidence does not expire. Preserve metadata/hash, payment facts, instruction snapshots, successful keys and audit for existing order-history lifetime. Alternative180days/no-image proof rejected.

Cleanup claims metadata under the same authority/restaurant/order/payment locks; attaching/opening dispute checks the deletion claim. Remove object outside transaction, then record deletion/audit; retry safely after storage/audit failure. No cleanup may erase live QR snapshots, pending refunds or held evidence.

## Approved Vietnamese notices

- Tiền được chuyển trực tiếp cho quán. Hãy kiểm tra ngân hàng, số tài khoản và tên người nhận.
- QR này không điền sẵn số tiền và nội dung. Vui lòng nhập đúng thông tin của đơn.
- Bạn đã báo chuyển khoản. Quán chưa xác minh nhận tiền.
- Đơn đã hủy hoặc bị từ chối. Vui lòng không chuyển thêm tiền.
- Quán xác nhận đã nhận tiền. Xác nhận này không thay đổi trạng thái giao hàng.
- Khoản chuyển sai hoặc trùng sẽ được hoàn toàn bộ, không tự bù vào đơn.
- Quán có trách nhiệm hoàn trực tiếp toàn bộ khoản tiền trong 24 giờ kể từ khi hệ thống ghi nhận đủ điều kiện hoàn.
- Hoàn tiền đã quá hạn. Hồ sơ cần được chủ quán và quản trị viên xem xét.
- Hệ thống ghi nhận xác nhận hoàn của quán; không thực hiện chuyển tiền.

## Acceptance examples and evidence plan

PAY-02:50000 matched→cancel creates50000 due24h; cancel→late50000 creates the same obligation without reopening.49000/51000 wrong amount each fully refundable, never pays50000 order; a second genuine50000 after payment is a separate duplicate receipt/refund. Same bank event replay never creates a second receipt. Refunded duplicate plus retained matched receipt projects paid. Audit outage rolls back receipt/refund/cancel and successful key. Cash remains unaffected.

P20 verifies both serial orders and actual races on disposable MySQL9.2.0, independent pools/processes, ownership, evidence privacy/cleanup, immutable QR versions and audit rollback. P21 verifies real APIs/cash/QR/claims/refunds/retry/reload/account switch, stale responses and five widths. Fixtures are synthetic, never real partner/survey/consent/transaction evidence. No P20/P21 acceptance from this policy document.
