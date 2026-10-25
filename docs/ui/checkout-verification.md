# Checkout and voucher verification — October 25, 2026

Authority: [approved contract](../checkout-vouchers.md), [API](../data/vouchers.openapi.json), [database](../data/database.md), [payments](../payments-policy.md), [finance](../finance-policy-proposal.md). This is scoped implementation/self-review evidence, not independent review, real partner consent, retained adoption or release acceptance.

## Implemented behavior

Checkout follows the Figma Make file `xfAu5VZ9550JhtiOcKjCGA`, reviewed directly in Chrome after the connector returned unreadable resource links. Keep the existing navbar/cart and approved Be Vietnam Pro/semantic palette. The demo state toolbar, fictional values, Manrope import and sample voucher arithmetic are excluded. Repository icons/images are reused; unavailable dish photos use the existing fallback.

The page presents read-only profile recipient, inherited point/quote, item review, real voucher application and cash/approved QR. Automatic preview validates authoritative prices/fee/voucher without creating or reserving an order. Expired quotes refresh; changed unit prices/fee require explicit submission consent. Server-side profile checks protect new snapshots; successful key replay precedes current profile/price/voucher checks.

Confirmed success replaces the form, focuses its heading and briefly guards navigation against the old submit coordinate. It shows the actual order code, current restaurant label, persisted total, order state and independent payment state, with tracking/discovery/history links. Missing profile/point, errors, stale consent and uncertain outcomes have recovery actions. Saved uncertain requests retain their exact payload/key and account binding.

Owners manage restaurant-funded codes at `/owner/vouchers`; MFA Admin manages platform-funded global codes at `/admin/vouchers`. Configuration is immutable; activation uses version/idempotency. Quota consumption commits with creation and survives cancellation/rejection. Zero-total new orders are `not_required`, without QR instructions or cash confirmation. Pre-discount commission and the unique negative platform subsidy commit with completion; reports and collection guards retain signed credit.

## Changed areas

| Area | Files / responsibility |
| --- | --- |
| Checkout | `frontend/src/app/hooks/useCheckout.ts`, `app/pages/CheckoutPage.tsx`, `app/pages/checkout.css` |
| Cart handoff | `frontend/src/features/delivery/cart-point.ts`, `use-cart-delivery.ts`, `index.ts`; app cart recovery copy |
| Voucher management | `frontend/src/features/vouchers/`; App routes, workspace links and safe auth return paths |
| Order/payment/finance display | Order DTO/status/detail/history, shared payment type, QR rendering guards and finance report/types |
| Backend voucher ownership | `backend/src/modules/vouchers/`, `workflows/vouchers.workflow.ts`, HTTP voucher controller/module wiring |
| Order workflow | Shared preview/create validation, recipient binding, voucher consent/redemption/snapshots and independent zero payment |
| Finance/payment | Payment creation, commission subsidy creation, finance aggregation/filter and policy version |
| Persistence | Prisma schema, forward migration `20261025000000_checkout_vouchers`, runtime grants and startup schema gate |
| Tests | Voucher unit/integration/upgrade, existing order/profile fixtures and contract schemas; connected checkout/cart/fulfillment/tracking/payment browser adapters |
| Contracts/navigation | Requirements, architecture, API/OpenAPI, database/migration, payment/finance policies, UI/cart guidance and documentation map |

Existing working-tree work was retained; this task does not claim authorship of unrelated changes already present.

## Verification results

| Check | Result / boundary |
| --- | --- |
| Backend unit (`npm --prefix backend test`) | PASS, 75 cases including exact discount/closed DTO/fingerprint coverage |
| Backend HTTP (`npm --prefix backend run test:e2e`) | PASS, 9 cases; Prisma mocked, not persistence proof |
| Backend integration (`npm --prefix backend run test:integration`) | PASS, 23 suites/cases on disposable MySQL9.2.0 and private synthetic MinIO |
| Voucher independent-process integration | PASS; quota, per-account cap, rollback, replay after profile change/lost response, zero payment, unique completion subsidy, negative finance balance and actual response/OpenAPI validation |
| Finance regression after v2 extension | PASS; historical v1 and new v2 wire facts, immutable ledger/reconciliation/collection rules |
| Upgrade (`npm --prefix backend run test:voucher-upgrade`) | PASS; original order/payment/history/key/ledger columns preserved, historical zero not reclassified; restricted runtime cannot edit voucher economics, snapshots or redemptions |
| Backend lint/build, Prisma validate/generate | PASS; completed on the final source; build also generates Prisma Client |
| Frontend lint/build | PASS; Vite reports the existing large-bundle advisory |
| Frontend cart/order/finance/voucher unit | PASS; cart7, orders10, finance3 and vouchers4 cases, including exact percentages, scoped/minimized handoff, independent payment status and allowed login return paths |
| Connected checkout Chrome (`npm --prefix frontend run test:checkout`) | PASS; real cookie auth/CSRF/MFA, API/MySQL, profile recovery, both voucher creation roles, apply/remove/error, changed price/fee, cash/zero, native duplicate clicks, focus, lost response replay and tracking/history/discovery;360/390/768/1024/1440px, keyboard/reduced motion |
| Cart browser (`npm --prefix frontend run test:cart-browser`) | PASS; controlled responses, four widths, handoff, Admin buyer denial, fee races/expiry, explicit consent, keyboard/zoom/reduced motion |
| Payment browser (`npm --prefix frontend run test:payments`) | PASS; real API/MySQL/MinIO cash baseline, owner/Admin QR approval, QR checkout/claim remains unpaid, late receipts, complete refund response-loss recovery, disputes and account privacy at five widths |

Real-DB targets were explicitly created new: `test_checkout_vouchers_20261025`, `test_checkout_browser_20261025`, `test_checkout_upgrade_20261025` and strengthened ledger upgrade target `test_checkout_upgrade_finance_20261025` on isolated `hlf-v04-test-mysql-1` (`mysql:9.2.0`, loopback43316). Upgrade preparation refuses a nonempty target. Private fixture buckets are `checkout-voucher-evidence` and `checkout-voucher-dishes` on the existing isolated MinIO. No retained/development/production schema or rows were migrated/reset. Error logs from rollback tests intentionally include synthetic500 responses.

Protected local logs use `/private/tmp/checkout-*.log`; they are not production operational evidence. Browser profiles are temporary and removed by the harness. The existing password-corpus and SMTP substitutes in `backend/test/browser-server.ts` remain the only external auth-service replacements for connected browser tests. The long browser runners were updated to await completed login/preview and disable test-only background throttling/back-forward cache; earlier intermediate failures were corrected before recording PASS. Controlled-response cart browser evidence is separate from real API/MySQL checkout evidence.

Selected synthetic browser evidence: [desktop review](../evidence/checkout-vouchers/review-desktop.png), [mobile review](../evidence/checkout-vouchers/review-mobile.png), [desktop success](../evidence/checkout-vouchers/success-desktop.png), [mobile success](../evidence/checkout-vouchers/success-mobile.png). The QR suite capture directory is `/var/folders/pn/4h65x5kx5sj8_4q9lkdj48k00000gn/T/hlf-browser-evidence-6nlcRK`; cart regression uses `/var/folders/pn/4h65x5kx5sj8_4q9lkdj48k00000gn/T/hlf-cart-evidence-Smt0m8`. Full successful checkout capture directory: `/var/folders/pn/4h65x5kx5sj8_4q9lkdj48k00000gn/T/hlf-browser-evidence-eNjzIj`.

## Manual acceptance

1. Start against a separately authorized schema with the forward migration and updated runtime grants applied. A backend with the old schema intentionally fails its read-only startup gate; it does not migrate automatically.
2. As a manager, open **Mã ưu đãi**, enter explicit percentage/cap/minimum/start/end/limits and create a code. Confirm only that restaurant's codes appear. As MFA Admin, create a platform-funded global code; verify pause/resume and immutable economics.
3. As a buyer with missing phone, select a dish and point in the cart and continue. Checkout must require profile completion. Save the phone in `/account`, return and refresh; name/phone must be read-only, with no point dropdown or quote button.
4. Apply an invalid/expired/out-of-scope code, then remove it. Apply each funding type and inspect the exact discount and total. Preview must create no order or redemption. Enter in the voucher field applies the code rather than placing an order.
5. Place one order with repeated click/Enter and verify one order/redemption. Success must replace the form, show pending/unpaid independently and navigate to tracking/history/discovery. Simulate a lost response and retry the original saved request; the ID must remain identical.
6. Change a dish price or surveyed fee after review. Creation must reject without partial writes, show the old/new breakdown and require a new explicit confirmation/key. Disable the point/dish/restaurant and verify actionable recovery.
7. Apply100% with sufficient cap and zero surveyed fee. Verify total0, `not_required`, no transfer instructions and no receipt confirmation. Historical zero orders retain their original payment status.
8. Complete one platform-voucher order twice. Verify one pre-discount base and one negative subsidy; compare statement/report/account balances, including negative credit. Restaurant-voucher orders have no platform subsidy; cancelled/rejected orders retain usage but accrue no subsidy.

## Adoption boundary

Standalone `test:tracking` and `test:fulfillment` were adapted but NOT RUN separately; the connected checkout/payment runs exercise tracking, cash fulfillment and history. This does not claim standalone or full roadmap acceptance.

Migration and grants are prepared and rehearsed only. Applying them to the retained local database, staging or production, restarting services against that target, publishing partner terms, transferring money and deployment require separate authorization. Negative platform obligations remain visible for manual offset; no automatic payout is implemented.

Subsequent authorized local502repair: [adoption and runtime evidence](../local-checkout-runtime-repair.md) supersedes this local boundary only for `hlf_dev_flow` on3307. The migration/grants are now applied there after backup/restore and clone rehearsal; original62business tables are preserved and actual Edge login succeeds. Production and retained financial writes remain outside this evidence.
