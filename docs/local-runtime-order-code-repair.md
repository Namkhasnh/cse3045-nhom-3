# Local order API repair and project regression — October 24, 2026

Scope: the user's screenshots show owner order-list500s on `localhost:5173`, followed by a request to recheck the project. This follow-up includes safely adopting the missing local schema. It does not deploy to VPS or certify a release. Existing unrelated changes were preserved.

## Root cause and concrete repair

The running Prisma client selected `orders.order_code`, but retained local MySQL had only29completed migrations, ending at `20261024010000_restaurant_storefront`. The order-code column did not exist; read-only runtime SQL reproduced MySQL1054. Owner list/detail and dashboard order counts failed, while analytics/summary queries that did not select the column continued returning data.

The startup schema gate still checked only storefront columns and the storefront migration marker. It now requires the public-code column and the completed `20261024030000_order_codes` release marker, alongside the existing storefront/mapped account checks. The manifest remains a release compatibility check, not a complete schema-diff tool; future schema-dependent changes must advance it. Regression tests explicitly reject the pre-code schema and an incomplete migration marker without applying any SQL writes.

The identified local Nest watcher was restarted after adoption. The actual signed-in Chrome session then displayed the owner dashboard's3orders today and5recent orders, and the order board displayed5completed cards with public codes. Earlier UI tests used disposable databases; those results did not establish that retained local schema was ready. This repair closes that specific gap.

## Protected adoption and preservation

- Verified the exact local target: MySQL Community Server9.2.0/InnoDB, loopback3307, database `hlf_dev_flow`. All29prior migration checksums match repository files.
- Stored a full SQL backup in a private0700directory with0600files. Restored it into a new MySQL9.2.0test database; compared original schema/row fingerprints before rehearsal.
- Rehearsed exactly `20261024020000_owner_analytics` and `20261024030000_order_codes`. The old clone failed the updated gate; the upgraded clone passed.
- Rechecked the source before adoption, then applied those same forward migrations with operator credentials. No reset, destructive push, seed, account reassignment or historical payment/fulfillment fabrication occurred.
- Compared all62original business tables by their original columns after adoption: original row counts/content hashes are unchanged. All6orders have6distinct valid codes. All31migration checksums match.
- Runtime `SELECT order_code` and the updated startup gate pass. Existing runtime grants already cover this additive column; no permission expansion or runtime-credential replacement was needed.
- Protected local receipt: `/private/tmp/hlf-orders-live-repair-EJBM3D/evidence.json`; backup/state/restore logs remain in that directory and are not committed. Initial rehearsal-only normalization/SQL-aggregate assertion issues were corrected on fresh clones before any source DDL.

## Project checks

| Check | Result and boundary |
| --- | --- |
| Backend lint, unit, HTTP E2E, build, Prisma validate/generate | PASS;71unit tests and9HTTP E2E cases; E2E persistence is mocked |
| Frontend lint, TypeScript/Vite build and every `frontend/test/*.test.mjs` | PASS;34unit cases; existing bundle-size advisory above500kB remains |
| Full `test:integration` | PASS22/22 on fresh `test_project_recheck_1792858736372`, MySQL9.2.0 and two dedicated synthetic MinIO buckets |
| Real local runtime | Missing-column reproduction before repair; actual owner dashboard/order board render after repair; finance report/ledger read workflows succeed against retained data |
| Browser regression | PASS9/9:8controlled suites and1connected owner-analytics journey; final rollup `/private/tmp/hlf-live-browser-final-results.json` |

Browser suites: `test:smoke`, `test:homepage`, `test:storefront`, `test:cart-browser`, `test:workspaces`, `test:notifications`, `test:menu`, `test:owner-orders`, and connected `test:owner-analytics`. Final reruns corrected only outdated owner-heading/footer readiness expectations and added a bounded CDP command timeout to the menu harness. An initial socket error/orphan test runtime and the missing analytics test environment were resolved without weakening business assertions or changing production UI. Analytics uses fresh `test_analytics_recheck_1792859637823`; the other eight suites use controlled API responses.

Full integration covers auth/MFA/capabilities, public discovery, onboarding, setup/delivery/media, durable order recovery, food-ready disclosure, independent cash/QR/refunds, commission/reconciliation, support/privacy/audit, notifications, analytics and deterministic AI failure/admission cases. Expected injected500/503/504logs are asserted failure scenarios. No actual provider call, real payment, real order transition or real account mutation was used to prove these synthetic journeys.

Read-only native page observations additionally covered owner settings/menu/delivery/QR and support. Further native navigation became intermittent (`cgWindowNotFound`/AX timeout); only completed observations are claimed. During compilation/generated-client hot reload, interrupted runtime requests produced transient transaction/API failures. Final retained finance workflow probes succeeded in under100ms per read, without changing financial state. No blanket transaction timeout increase or permission widening was added to hide those errors.

## Reproduction and remaining boundary

Run package commands from the repository root. Backend compilation shares `.test-dist`; keep it separate from connected browser runs. Integration requires a newly created loopback `test_*` database and documented synthetic storage credentials, never the retained target. [Earlier regression setup](website-local-verification.md) and [owner order checks](ui/owner-orders-figma.md) describe these boundaries.

Final read-only HTTP sweep on the actual `localhost:5173` proxy passed11/11: restaurants/dishes/categories/pickup points200; anonymous auth/order/owner-summary/analytics/notifications/Admin requests401. No cookies or private response bodies were exported.

Anonymous public API and signed-in native observation are read-only. Admin write journeys and order/payment mutations remain synthetic. `test:local-demo`, external SMTP/operator acceptance, live Gemini, real pilot and VPS/production release are NOT RUN in this follow-up. Source/tests and local-runtime repair do not claim that every possible network/browser/data condition is covered.
