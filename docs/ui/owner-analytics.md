# Owner dashboard analytics — October 24, 2026

Authority: user requested the backend capabilities missing from the [approved owner UI](owner-dashboard-figma.md). This extension implements US15 completed-order analytics and test case DASH-01. [API contract](../data/api_contract.md), [machine schema](../data/owner-analytics.openapi.json), [database](../data/database.md) and existing monthly finance policy remain authoritative. No finance/fulfillment mutation or production rollout is included.

## Enabled behavior

`GET /api/v1/owner/restaurants/{id}/analytics?days=7|30` defaults to7, rejects unknown/duplicate parameters and returns no-store data only to the current active owner. Authentication, current account state, X-Account-Id and restaurant ownership are rechecked. Other users and Admin have no owner-read bypass; inactive accounts cannot use this operational endpoint.

- Calendar dates use Asia/Ho_Chi_Minh. A7-day window includes today and the preceding6days;30 includes today and29 preceding days. The current day stops at server `as_of`. Date labels/from/to are inclusive; SQL bounds use the corresponding UTC start and exclusive next-day end, capped at as_of.
- Only orders with status completed contribute, using completed_at rather than created_at. Revenue sums immutable subtotal_vnd, excluding delivery. Completed unpaid orders contribute; this gross completed-order measure is independent of payment receipts/refunds and is not a cash-collection or settlement balance.
- The response includes dense daily rows, today's summary, period totals and top3 dish snapshot groups. Empty dates return actual zero strings. IDs, counts, quantities and VND are decimal strings; days is7or30. Decimal SQL sums serialize without exponent notation; application totals use BigInt.
- Top dishes group by dish ID plus case-sensitive accepted dish-name snapshot. Renamed snapshot variants remain separate. Rank uses quantity descending, snapshot line revenue descending, numeric dish ID ascending, then binary snapshot name ascending. Hidden/sold-out dishes remain in historical sales. No buyer details or current menu prices/names/images are joined into the result.

HTTP → OwnerAnalyticsWorkflow → orders public OwnerAnalyticsService → owning repository → Prisma. The workflow locks account then restaurant in one transaction. Existing order mutations share the restaurant lock, preventing a change between daily and top-item aggregates under ReadCommitted. All SQL values are parameterized. Queries are bounded to at most30days and top3 groups.

The additive `20261024020000_owner_analytics` migration creates `orders_owner_analytics_idx(restaurant_id,status,completed_at,id)` only. No data rewrite, applied-migration edit, analytics table or new runtime table grant is needed. Retained/production application is NOT RUN; apply through the existing migration operator workflow before adopting the optimized query path.

## Frontend connection

The restaurants feature owns the API reader, polling hook and revenue chart. The app injects the public reader alongside existing order/dish/guide readers. Today's revenue card,7/30-day chart and top-dish panel now display actual API data; the earlier unsupported states are removed.

Switching periods changes both chart and dish ranking. Abort/scope guards prevent delayed previous-period/account responses from overwriting the selected period. Network errors retain last-good data with a stale warning;401/403/404 clear analytics. Manual refresh/retry, visible/online five-second polling and bounded backoff use the existing scheduler. Data refresh does not write an order or payment.

Chart bars support focus, hover and touch selection with exact VND labels. Only bounded pixel heights convert to Number. A disclosure table exposes every date/count/amount to keyboard and screen-reader users, including all-zero periods. Narrow charts scroll within their panel. Existing owner shell, settings, personal/Admin workspaces and reduced-motion behavior remain.

## Verification and reproduction

All evidence is self-review. New disposable database `test_owner_analytics_20261024` was created in existing `hlf-v04-test-mysql-1`, Oracle MySQL9.2.0 at loopback43316. Existing migrations and the new additive index were applied only there. No retained/dev/production database was modified. The existing browser harness replaces outbound SMTP/password-corpus checks; authentication, Nest HTTP and MySQL are real. Analytics fixture orders are synthetic direct-SQL/Prisma records, not evidence of a newly executed fulfillment journey.

Use the guarded loopback TEST_DATABASE_URL for that disposable database and the existing setup instructions; never point these fixture scripts at retained data.

| Check | Result / evidence |
| --- | --- |
| Backend lint | PASS, no warnings. |
| Backend test | PASS,67unit tests including Vietnam midnight/year/leap boundaries, closed queries and exact/zero daily sums. |
| Backend test:e2e | PASS,9existing HTTP checks; mocked Prisma boundaries remain. |
| Backend build | PASS; Prisma generation also passed. |
| Prisma validate | PASS. |
| Backend test:owner-analytics | PASS, actual MySQL/HTTP: exact large money, completion-window edges/as_of, historical names and hidden dishes, zero fill, schema validation, ownership/unauthenticated/inactive/account mismatch, invalid query, index columns and a concurrent writer blocked by the aggregate restaurant lock. |
| Frontend lint/build | PASS; build retains existing bundle advisory above500kB. |
| Frontend unit checks | PASS,15combined owner/order cases. |
| Frontend test:workspaces | PASS, controlled responses in real Chrome: exact large revenue,7/30 selection, delayed prior-period response, stale/error/forbidden clearing, daily table, large KPI wrapping, settings and personal/Admin regressions. Evidence: `hlf-workspaces-evidence-Nrrep2`. |
| Frontend test:owner-analytics | PASS, real authenticated Nest/MySQL → Chrome:90000VND today's dish revenue,135000VND period total, pending/fee exclusion, completion-vs-creation dates, hidden historical dish with4parts, privacy,7/30chart, keyboard table and360/390/768/1024/1440px. Evidence: `hlf-browser-evidence-McLA6x`. |

The two focused scripts are `npm --prefix backend run test:owner-analytics` and `npm --prefix frontend run test:owner-analytics`. Full backend integration suites and unrelated connected business journeys are NOT RUN for this slice. Connected desktop/mobile and30-day keyboard screenshots were visually inspected. No load benchmark, retained index application, production deployment or V1.0 release acceptance is claimed.

## Changed areas

Backend adds orders-owned analytics policy/repository/service, owner HTTP controller/workflow, public wiring, index/schema, policy tests and the focused integration script. Frontend adds the analytics API/polling hook/chart and connects the dashboard's former placeholders. Existing dashboard KPI/list readers are retained. The OpenAPI contract and affected API/database/migration/testing/status navigation document this extension.

## Local runtime 404 recovery — October 24

A later browser report showed analytics404 while other owner APIs worked. The active localhost3000 process was a long-running `node dist/main.js` started before analytics was added; rebuilding dist had not reloaded its in-memory route registry. The exact local process was stopped gracefully and replaced with the documented `npm --prefix backend run dev` watcher. Compilation reported zero errors; the existing signed-in browser then displayed both7/30-day analytics and historical rankings. Anonymous route probes returned401 rather than404. This recovery changed no retained data or migrations and did not deploy production. When running dist directly, explicitly restart that process after a build; prefer watch mode for local source development.
