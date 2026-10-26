# COD cutover — implementation and verification

Date: October25,2026. Authority: [approved COD contract](cod-ordering.md). This is scoped implementation/self-verification, not independent review, roadmap acceptance, retained-data adoption or production release.

## Implemented behavior

- Fresh preview/create accepts COD only. Nonzero COD is not_tracked; zero total is not_required. No financial confirmation/claim/dispute may mutate a COD payment. Fulfillment does not confirm collection.
- Original successful legacy cash/QR requests recover under their original payload/hash/key before retired-method or current profile/voucher checks. New legacy intents fail definitively. History and existing QR receipt/refund/dispute/evidence/cleanup operations survive.
- QR proposal/review/uploads are retired; settings are historical read-only UI. Authorized config replays and safety suspension remain API capabilities. Public options advertise COD without looking up QR configuration.
- Only owner-funded restaurant vouchers price new orders. Admin create/toggle is retired; historical lists and accepted platform-voucher orders/subsidies remain. Quotas, money conflicts, exact rounding and pre-discount dish-only commission are preserved.
- Checkout no longer requests QR options. Order success/detail/cards/history/filters distinguish COD and legacy payments. Admin voucher authoring/navigation is removed, including direct route access to the former form.

## Automated evidence

| Check | Result |
| --- | --- |
| Backend lint | PASS — npm --prefix backend run lint |
| Backend units | PASS — npm --prefix backend test;75 tests |
| HTTP E2E | PASS — npm --prefix backend run test:e2e;9 tests; loopback listener requires sandbox escalation |
| Backend build | PASS — npm --prefix backend run build |
| Prisma validate/generate | PASS — current schema validates and client generates |
| Real MySQL integration | PASS —23 tests, MySQL9.2.0/MinIO, including independent-process quota/fulfillment/legacy receipt/refund races, audit rollback and lost-response recovery |
| COD upgrade | PASS — npm --prefix backend run test:cod-upgrade on fresh test_cod_upgrade_20261025_1792916037296 |
| Frontend lint/build | PASS — existing lint/build scripts; Vite retains its >500kB chunk advisory |
| Frontend units | PASS —12 durable checkout/polling,4 voucher,3 finance,3 owner-order and3 transient-feedback tests |
| Connected Chrome checkout | PASS — owner voucher creation, retired Admin route, active historical platform-code rejection, profile/quote/price consent, COD/zero totals, duplicate clicks, lost-response replay, five widths, keyboard and reduced motion |
| Connected Chrome fulfillment | PASS — COD cancellation/acceptance/privacy/food-ready/delivery/completion, one base commission, absent collection controls, reasoned rejection and deactivated-restaurant existing orders; five widths |
| Connected Chrome tracking | PASS — offline/hidden pause, nonoverlapping polls, immutable snapshots/pagination, manager buyer profile and legacy late-collection version handling; five widths |
| Connected Chrome legacy payments | PASS — QR authoring retirement, historical instructions/claim, cancel/late receipt, full refund response-loss/reload/replay, protected bank evidence, scoped disputes/Admin review and account-switch denial; five widths/keyboard |
| Connected Chrome finance | PASS — manual statements/receipts/reversals/replacement, reasoned adjustment by public order code, signed balances, owner isolation and recovery/responsive controls |

## Database and compatibility boundaries

Integration used newly created test_cod_20261025_1792915663086 on loopback43316. Checkout/fulfillment Chrome used separate test_cod_browser_20261025_1792916057137, avoiding unrelated integration fixtures in paginated Admin setup. Subsequent suites use a newly created database per suite so synthetic MFA quotas are not shared. All identities/points/fees/evidence are synthetic. The disposable container version was verified as9.2.0. No bank transfer or real shipper/partner fact is asserted.

The upgrade harness creates the pre-COD schema, inserts historical cash/QR/zero-total orders, payment histories, original keys, protected evidence metadata, approved instruction snapshot, a verified wrong-amount receipt with pending full refund, platform voucher/redemption and signed base/adjustment/subsidy ledger. It snapshots every original column, applies only the forward COD migration, compares all rows and prior migration checksums, then probes enum/check behavior and restricted SQL permissions. Historical zero remains unpaid. It refuses nonempty or nonlocal/non-test targets.

Initial isolated runs exposed a MySQL CHECK/FK referential-action restriction and fixture-only schema/expectation issues; corrected before the successful runs. Browser setup initially encountered unrelated integration pagination, a saved-editor close race and shared synthetic MFA quotas; verification now isolates databases and waits for the saved editor to close. Tracking expectations use the current account profile, instant native-click scrolling and explicit historical cash fixtures; finance input uses the current public order code. Prior failed test databases were not reset or adopted.

At this implementation checkpoint, retained local database and VPS migrations/restarts/deployment were **NOT RUN**, outside the plan's adoption boundary. The subsequent user-reported502 repair separately authorized and completed retained-local COD adoption/restart; see [local repair receipt](local-cod-runtime-repair.md). VPS/production remains NOT RUN. The new backend runtime gate requires completed migration20261025010000_cod_ordering; it never auto-migrates. Apply through a separately authorized, backed-up operator workflow before serving this backend against retained data. Existing versioned partner terms and recorded consents are not rewritten or republished.

## Reproduction

Run commands from the repository root with explicit disposable loopback TEST_DATABASE_URL and synthetic storage settings; never use a retained DATABASE_URL:

- npm --prefix backend run test:integration (prepares only guarded test databases).
- npm --prefix backend run test:cod-upgrade against a different, new empty test_* database.
- npm --prefix frontend run test:checkout, then test:fulfillment, test:tracking, test:payments and test:finance sequentially against a separate migrated test_* database. Browser scripts share ports43127–43129 and require compiled backend test tooling and Chrome. Use a fresh migrated test database per suite to isolate account/IP MFA quotas.

Representative connected checkout screenshots: [mobile](evidence/cod-ordering/checkout-mobile.png), [desktop](evidence/cod-ordering/checkout-desktop.png), [success](evidence/cod-ordering/success-mobile.png), [retired Admin authoring](evidence/cod-ordering/admin-voucher-retired.png). These are synthetic local observations, not published artifacts. Raw suite evidence remains in temporary directories; additional results follow below.

## Final browser evidence and review

- Checkout: temporary directory hlf-browser-evidence-6pXBqW; representative screenshots retained above.
- Fulfillment: hlf-browser-evidence-m7vqHO.
- Tracking: hlf-browser-evidence-lUjNr8; database test_cod_browser_20261025_1792916707352.
- Legacy payments: hlf-browser-evidence-2ai3Dp; database test_cod_browser_20261025_1792916547610.
- Finance: hlf-browser-evidence-aroc5F; database test_cod_browser_20261025_1792916815747.

Temporary suite directories are under the macOS task temp root returned by each command. Independent voucher-upgrade tooling also passed against fresh test_cod_upgrade_20261025_1792916615481, preserving the pre-voucher baseline through both forward migrations. Independent golden cash/QR canonical fingerprint assertions passed in the75backend units. Source self-review checked new-method gating/replay ordering, owner-only voucher eligibility, historical subsidy completion and absent new COD money mutations. Mobile checkout screenshot was visually inspected. Scoped documentation validation checked19 Markdown files/594 relative paths (before adding screenshot links), all under500 lines; final checks also include those screenshot paths, JSON parsing and git diff --check. Original packaged HTML is unchanged.
