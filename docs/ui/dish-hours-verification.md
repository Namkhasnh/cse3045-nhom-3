# Homepage Dish Selling Hours — Verification

Date: October 28, 2026. Scoped CAT-01 / US02–03 fix; self-review, not a release or deployment approval.

## Behavior and interfaces

- Public dish list/detail now carry boolean `restaurant_is_open` and `restaurant_is_accepting_orders`. The existing catalog `openSql` evaluates `Asia/Ho_Chi_Minh` hours, overnight intervals and exclusive closing boundaries. No database schema change is needed.
- Homepage badges prioritize closed hours → paused acceptance → sold out → available. Closed hours display “Ngoài giờ bán” with the existing red danger token. Only open, accepting, available dishes enable adding; the existing add-time revalidation remains.
- The discovery hook refreshes every 60 seconds while visible/online and on visibility/reconnection events. It replays the number of loaded pages using fresh pagination cursors, preserves filters and avoids overlapping requests. Generation/abort guards discard superseded responses.
- Refresh failure retains cards but shows an unverified label and disables adding. Successful refresh restores authoritative badges/actions. Detail links remain available.

## Automated verification

| Command / evidence | Result |
| --- | --- |
| `npm --prefix frontend run lint` | PASS |
| `npm --prefix frontend run build` | PASS; existing large bundle warning remains |
| `npm --prefix backend run lint` | PASS |
| `npm --prefix backend test` | PASS — 77 unit tests |
| `npm --prefix backend run test:e2e` | PASS — 9 tests; Prisma is mocked |
| `npm --prefix backend run build` | PASS |
| `node --test .test-dist/test/integration/public-catalog.integration-spec.js` from backend, with `TEST_DATABASE_URL` | PASS — CAT-01 HTTP/schema/scalar checks on disposable MySQL 9.2.0 database `test_dish_hours_20261028` |
| `npm --prefix frontend run test:homepage` | PASS — real headless Chrome, controlled API responses; seven widths including 360 px, refresh/error/recovery and loaded-page refresh |
| `git diff --check` | PASS |

MySQL assertions execute the production opening-hours SQL at explicit instants: Monday 19:59:59 open, 20:00 and 21:00 closed; an unscheduled day closed; Sunday 23:00 and Monday 01:59:59 open for a Sunday overnight interval, Monday 02:00 closed. HTTP checks confirm available stock can coexist with closed restaurant hours and enabled acceptance, for list and detail projections. Fixtures are cleaned up; retained development/VPS data is untouched.

Chrome invokes the captured 60-second interval callback to test refresh deterministically, and dispatches visibility/online/offline events. It verifies red closed badges, paused/sold-out disabled actions, recovery after a failed refresh, retention of six loaded cards, and fresh cursors for both loaded pages. This is rendering/interaction evidence with mocked APIs, not a connected production journey or a wall-clock one-minute endurance test.

## Limits

Physical iPhone/Safari and production deployment: NOT RUN. Full backend integration suite: NOT RUN; the affected public catalog suite was run. No full accessibility or performance audit is claimed.
