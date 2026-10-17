# MVP Backlog

Implementation order for the VJU MVP. Use each numbered item as one scoped task;
split large items into smaller prompts without weakening their acceptance criteria.
This checklist tracks delivery, not new business rules. Follow [AGENTS.md](AGENTS.md)
and the owning contracts in [docs/README.md](docs/README.md).

## Current progress

Source inspected on October 17, 2026:

- Backend scaffold, account/audit migrations, email-verified Student auth/profile, pending Owner/Admin review and signed-manifest initial privileged provisioning are present.
- Frontend auth/profile routes and role navigation are present; Student discovery still uses labeled fixtures.
- Steps 00 and 01 have been implemented; step 02 now has Student/auth source, a Pwned Passwords range check, a MySQL-backed five-failures/15-minutes login backoff, and passing audit/AUTH-01 integration on a disposable MySQL 8.4.11 container. Restaurant ownership checks depend on step 03's restaurant model. The real-MySQL CI job is configured but has not been observed running in CI. Step 07 has presentation work only.
- Order/financial models, connected business APIs and ordering are not implemented.
- Next: add restaurant ownership in step 03 and automate the already observed connected browser auth journey.

## Implementation checklist

Complete in order. Add the needed schema, reviewed forward migrations, API/OpenAPI
contracts, UI, audit and meaningful tests with each feature. Do not defer all testing
to step 18. Resolve necessary TBDs before implementing dependent behavior.

- [x] **00 — Foundation decisions.** Settle login identifier/password/hash policy,
  JWT transport/lifecycle, CSRF, privileged provisioning, MySQL version and relevant
  validation limits in the owning documents.
- [x] **01 — Technical foundation (partial).** Add `/api/v1`, response/error
  envelopes, exact scalar handling, transaction context and transactional audit.
  Configure real-MySQL integration and browser smoke tooling incrementally.
- [ ] **02 — Accounts and authentication (partial).** Student registration, login, identity
  recovery, profile, approved Admin/Owner provisioning, router and role navigation.
  Enforce current account/ownership checks server-side. (US01, FR01)
- [ ] **03 — Restaurants and ownership.** Admin creates/edits partners and assigns
  owners; owners switch between their restaurants and edit operational settings
  and hours. Deletion follows in step 13. (US12, US16)
- [ ] **04 — Menu management.** Approved category provisioning; owner creates/edits
  dishes, prices, visibility and availability. Images are optional references;
  physical deletion follows in step 13. (US11)
- [ ] **05 — Pickup points and delivery quotes.** Settle point provisioning and
  quote artifact protection; implement fixed VJU points and surveyed restaurant–point
  distance/fee configuration. Missing fee must block ordering, not mean zero. (BR07–10)
- [ ] **06 — Commission policy and exact money.** Settle the business rate limit;
  Admin configures future rates, Owner reads them. Implement exact totals and
  half-up commission arithmetic with rounding/overflow tests. (BR02, BR20–24)
- [ ] **07 — Connected discovery (UI preview exists).** Connect restaurant/dish
  search, filters, pagination and menu detail to real APIs; reuse the existing UI
  and replace fixture data at its boundary. (US02–03)
- [ ] **08 — Single-restaurant cart.** Add/remove dishes, edit quantities, show
  estimated totals and confirm switching restaurants. Keep the draft in the
  frontend and prevent cross-account leakage. (US05, BR01)
- [ ] **09 — Order creation backend.** Revalidate eligibility, quote, price/fee and
  rate; atomically persist snapshots, pending order, unpaid payment, histories,
  audit and durable idempotency result. Verify retries/races on MySQL. (BR01–06)
- [ ] **10 — Checkout, recovery and tracking.** Connect cash checkout; require
  explicit changed-price/fee consent. Preserve original intent/key after unknown
  results; recover after reload and poll authorized order details safely. (US05–07)
- [ ] **11 — Fulfillment and base commission.** Owner accepts/rejects with reason,
  delivers and completes; Student cancels pending only. Completion and one base
  commission commit together. Test accept/cancel races and rollback. (BR15–23)
- [ ] **12 — Cash confirmation.** Current Owner confirms receipt with history and
  audit. Payment and order states remain independent; repeats have no duplicate
  effects. (US06/14 MVP cash subset, BR11–13)
- [ ] **13 — History-preserving deletion.** Delete never-ordered dishes, otherwise
  hide; delete restaurants only without orders/settlements, otherwise deactivate.
  Preserve snapshots, active orders, owner accounts and other access. (US11/16)
- [ ] **14 — Reconciliation decisions.** Settle period membership, overlap/closure,
  late adjustments, overcollection and receipt correction policies before enabling
  dependent reconciliation behavior.
- [ ] **15 — Minimal manual reconciliation.** Ledger reads, reasoned adjustments,
  same-restaurant one-time settlement assignment, manual receipts and signed totals.
  Admin writes; Owner reads own data. Deduplicate financial retries. (BR23–27)
- [ ] **16 — AI decisions.** Settle budget/quantity/preferences, provider/model,
  privacy filtering, grounded output validation, limits/timeouts/quotas/cost and
  evaluation criteria. (US08, AI integration contract)
- [ ] **17 — AI recommendations.** Build eligible candidates server-side, call the
  adapter, validate/revalidate output and send selections through normal checkout.
  No personal data/transcripts or AI money/order writes; manual ordering survives
  AI failure. (BR28–31)
- [ ] **18 — MVP acceptance.** Verify enabled auth, catalog, quote, checkout/recovery,
  race/rollback, fulfillment, cash, finance, history and AI scenarios. Include mobile
  360 px, accessibility and measured NFR evidence. Fix failures. (testing.md)
- [ ] **19 — Staging and release.** Finalize hosting/HTTPS/secrets, migration release,
  monitoring and real partner bootstrap/survey data. Evidence daily backups and a
  successful isolated restore before go-live. (deployment.md, NFR08)

## Task prompt

```text
Implement step XX in BACKLOG.md only.
Read AGENTS.md and relevant owning contracts; inspect current source and git status.
Check prerequisites and resolve necessary TBDs before dependent implementation.
Preserve existing work; reuse completed components.
Update affected contracts and add/run appropriate verification with the feature.
Report completed scope, exact check results and remaining blockers.
```

For decision steps 00, 14 and 16, request concrete options and record the user's
decision before implementing behavior that depends on it.

## Completion and scope

Check an item only after its required behavior and verification are complete.
Report absent tooling as `NOT CONFIGURED`, unexecuted checks as `NOT RUN`, and
policy-dependent work as `BLOCKED` with its source. A disabled required feature
does not make the MVP complete.

Post-MVP: free addresses/maps, route fee tiers, QR/refunds, expanded financial
reports, random selection, history/reorder UI, support, reviews/favorites and audit
browsing. Durable order recovery/history and transactional audit writing are MVP.
