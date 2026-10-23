# MVP ordering and three-role UX verification

Date: October 23, 2026. Scoped user request: complete/review the current MVP ordering experience for buyer, restaurant manager and sole MFA Admin, fix found defects and run meaningful checks. This is ordinary feature/UX work under [requirements](requirements.md), [API](data/api_contract.md), [payment policy](payments-policy.md) and [UI](ui/ui_convertion.md), not execution or acceptance of the blocked P29–P33 roadmap.

## Scope and changes

- Buyer: anonymous discovery/cart/login without automatic ordering; explicit quote/price consent; cash/QR; missing-response recovery with original key/body; tracking/cancellation/history; support.
- Manager: actual setup/approval/rate consent and explicit accepting switch; incoming orders, food-ready/contact release, delivery/completion and separate verified payment/refund; manager retains buying capability under the same account.
- Admin: real MFA/configuration/review, QR review, reconciliation/support/account/audit. No owner fulfillment or customer-payment authority is added.
- UX fix: [owner orders](../frontend/src/features/orders/OwnerOrdersPage.tsx) now offers “Về đơn mới nhất” after advancing a page, preserving existing keyset filtering and selected detail behavior.
- UX fix: [management shell](../frontend/src/app/layouts/RoleLayout.tsx) now marks every actual current navigation item with `aria-current=page`, including `/admin/reports` as the finance alias; existing sidebar theme/focus styles apply.
- UX fix: order detail renders a surveyed pickup-point name once when the historical destination text is identical, while retaining distinct destination text and all original snapshot values.
- Check repair: [tracking runner](../frontend/scripts/browser-tracking.mjs) and [payment runner](../frontend/scripts/browser-payments.mjs) follow the current setup UI's actual headings/save acknowledgement rather than removed legacy checklist prose. Existing backend state/readiness checks remain. Tracking additionally checks manager buying, owner return-to-newest and active navigation; deactivated restaurants must expose no add-to-cart action.
- Lint repair: [evaluation script](../backend/scripts/evaluate-ai.mjs) removes an initial assignment overwritten before use; per-attempt reset/measurement remains. No Gemini evaluation/counter change is run.

No application schema/API/money/authorization policy changed. Substantial pre-existing working-tree work is preserved; changed files are not claimed wholly authored by this task. Existing cream/orange/Be Vietnam Pro and distinct role shells are retained; no visual redesign or new provider/dependency.

## Environment and method

Existing Node24.21.0/npm11.19.0, Chrome155.0.8059.86 and installed lockfile dependencies. A uniquely labelled new MySQL9.2.0 container uses a random loopback port, synthetic password and one fresh `test_mvp_*` database per browser journey; no retained3307 or existing43316 DB is written. Container cleanup checks the label. Synthetic MinIO at43317 uses unique evidence/dish bucket names. No retained/VPS/order/payment/partner action or external email. Newly created synthetic object buckets are left in the isolated local fixture store; no pre-existing objects are deleted.

Actual Chrome + Vite + NestJS + MySQL runs existing browser scripts sequentially on shared43127/43128/43129 ports. SMTP delivery and password-corpus lookup are replaced only in the browser fixture harness. QR/receipt images and identities are synthetic. Finance/account-support scripts explicitly insert synthetic reporting/history fixtures; that is not evidence of those orders' fulfillment. Tracking drives actual setup/ordering/fulfillment APIs. AI is disabled and no live provider request is permitted; deterministic AI tests do not establish live quality/latency.

Backend commands run sequentially because test compilation clears `.test-dist`. Run from repository root; there is no root npm workspace/test command. Browser preparation uses `DATABASE_URL="$TEST_DATABASE_URL" npm --prefix backend run test:prepare` on a newly created guarded test database. Full environment/reproduction boundaries are in [cash verification](cash-ordering-local-verification.md), [payments](payments-local-verification.md), [finance](finance-local-verification.md) and [account support](account-support-local-verification.md).

## Actual check record

| Command | Result |
| --- | --- |
| `npm --prefix backend run lint` | PASS after correcting unused initial assignment |
| `npm --prefix backend test` | PASS57tests |
| `npm --prefix backend run test:e2e` | PASS9tests; mocked persistence boundary |
| `npm --prefix backend run test:integration` | PASS20groups on actual disposable9.2.0, including cross-process races/rollback/constraints |
| `npm --prefix backend run build` | PASS |
| `npm --prefix backend run test:ai-evaluation-unit` | PASS3summary tests; no provider call |
| `npm --prefix frontend run lint` / `run build` | PASS after UX changes |
| `npm --prefix frontend run test:cart` | PASS6tests |
| `npm --prefix frontend run test:orders` | PASS10tests |
| `npm --prefix frontend run test:finance-unit` | PASS3tests |
| `npm --prefix frontend run test:tracking` | PASS final run, including360px native pointer hit-test, manager buying, deactivation refusal, pagination and destination regression |
| `npm --prefix frontend run test:payments` | PASS actual Chrome/HTTP/MySQL; private image/QR/receipt/refund/recovery cases |
| `npm --prefix frontend run test:finance` | PASS actual Chrome/HTTP/MySQL; signed balances/recovery/overcollection/scope/dialog/five widths |
| `npm --prefix frontend run test:administration` | PASS final Chrome journey: support/recovery/holds/reveal/audit/restricted accounts/privacy and five widths |
| `npm --prefix frontend run test:onboarding` | PASS applicant/terms/evidence/approval/manual-create, scopes and five widths |

Meaningful test IDs: PUBLIC-01/GUEST-01/AUTH-04, PRICE-01/IDEM-01/02, STATE/HIST/DATA, PAY/FIN, ADMIN/support/AUDIT and UI-02 within each runner's actual boundary. Review source/logs for precise cases rather than treating one script as blanket acceptance.

Initial browser run failed waiting for obsolete “Hoa hồng đã đồng ý: Còn thiếu”/“Giờ mở cửa: Đã đủ” copy. Repair follows actual current configuration/acknowledgement, not a weakened backend readiness condition. A newly added manager-buying check initially ran after the fixture deliberately deactivated the restaurant; the app correctly returned “Quán chưa khả dụng”. The positive check now runs while open, with that negative ordering case retained. Neither was diagnosed as a production ordering failure.

## UX observations and limits

Tracking/payment/finance runners cover360/390/768/1024/1440px and keyboard/dialog behavior within their asserted pages. Screenshots are reviewed separately; automated no-overflow assertions alone are insufficient visual evidence. The manager-as-buyer screenshot in an early run carried a misleading360filename while the viewport was1440; the final runner uses a neutral filename. No mobile evidence is inferred from that early filename. Primary token contrast calculations: ink/surface16.04, muted/surface5.88, muted/cream5.58, white/brand4.65, dark-brand/surface6.66, owner-sidebar13.63 and Admin-sidebar12.05. These are measured static token pair ratios, not a full computed-style/opacity/browser accessibility audit.

Recorded visual inspection initially includes buyer checkout360, manager order360 and Admin commission360 from the current synthetic run. No horizontal clipping was observed in those screenshots; management navigation visibly marks the current section. Full-page screenshots can include fixed navigation at the capture viewport; native scroll/tap accessibility is distinct from scripted DOM clicks. Full screen-reader, all-page200%zoom/reduced-motion and50-user rendered-list performance acceptance remain NOT RUN; do not claim comprehensive accessibility/NFR certification.

Acceptance: **verified for the recorded local synthetic MVP ordering/three-role scope**, with all five browser journeys passing. [Durable sanitized receipt](evidence/mvp-ordering-verification.json) records results, source/log/image hashes and boundaries. This is not full-version/commercial acceptance. Codex self-review only; no user/independent review fabricated. No deploy/commit/pilot/production migration. Backup/V0.9 operational gates remain separately BLOCKED; this scoped task must not silently check them off.

## Reproducible runner

[Scoped runner](../ops/verify-mvp.mjs) creates a fresh labelled9.2.0 container, fresh per-journey databases and unique synthetic MinIO buckets, executes existing checks sequentially, stores logs/screenshots in a protected `/private/tmp/hlf-mvp-check-*` directory and removes only its labelled DB container. Existing local MinIO43317 and Chrome must be available; see the linked environment guides. It never reads retained DB credentials.

```sh
node ops/verify-mvp.mjs
# Repeat only selected browser journeys after a scoped change:
MVP_BROWSER_ONLY=1 MVP_ONLY=tracking,administration,onboarding node ops/verify-mvp.mjs
```

The optional filter selects from the fixed test list, not database or API inputs. Initial runner failures and corrective reruns are preserved in the receipt/log references; no initial failure is relabelled PASS.

Selected synthetic screenshots: [buyer checkout](evidence/mvp-ordering/buyer-checkout.png), [manager incoming orders](evidence/mvp-ordering/manager-orders.png), [Admin finance](evidence/mvp-ordering/admin-finance.png), [manager buying with same account](evidence/mvp-ordering/manager-buying.png). Screenshots are evidence artifacts, not production data or a replacement for executing the journeys.

Final observations:360px submit was scrolled into view; `elementFromPoint` confirmed its center was not covered by fixed navigation, and native pointer events triggered the intended storage-failure refusal with zero new orders. Final tracking verifies same-account manager buying, no add action after deactivation, owner return to the original newest row set and nonduplicated destination text. All five journey results are PASS in the receipt.
