# Personal, restaurant owner and Admin workspaces

Authority: [UI guide §5.9](ui_convertion.md#59-approved-personal-and-owner-workspaces--october-24-2026), [account security](../account-security.md), [restaurant setup](../restaurant-setup-v04-contract.md), and [notifications](../notifications-contract.md). The user explicitly approved this implementation plan on October 24, 2026.

The later [owner dashboard/settings redesign](owner-dashboard-figma.md) replaces the owner checklist overview with operational KPIs and moves the full checklist into settings. Its data/verification rules supersede the owner-specific overview details below; historical evidence remains dated.

## Approved design and scope

[Figma Make reference](https://www.figma.com/make/XymiDbnoGxZqEB2oY2bP45/Redesign-Restaurant-Detail-Page?preview-route=%2Fowner) supplies the account and owner composition: light grouped sidebar, cream content, white cards, orange active navigation, dark owner banner, progress/checklist and quick actions. Keep Be Vietnam Pro and semantic project colors. The existing header, cart and buyer rights remain available. The user subsequently requested the same layout for Admin: a light sidebar with navy identity/active accents keeps administrative context distinct.

The Figma connector returned Make source resource links but could not read them or export a screenshot for this file type. The actual Make preview and its App.tsx/index.css were inspected through the browser. Neither screenshots nor unrelated Make bitmap resources are used as implementation assets. Icons compose the project's shared SVG component; the existing brand stays in the header.

The personal profile, owner overview, Admin overview and navigation are redesigned. Existing menu, order, payment, delivery, finance, support and privacy page contents are retained. No backend, database, REST DTO or permission changes are introduced.

## Routes and component boundaries

| Destination | Behavior |
| --- | --- |
| `/account` | Personal shell for all authenticated accounts, including owners and Admin; identity and verification come from the current user; login/email are read-only. |
| `/orders`, `/orders/{id}`, `/notifications`, `/support`, `/privacy` | Personal navigation by default; existing business contents and capability gates remain. |
| `/owner` | Owner-only overview using the existing setup guide, with no configuration forms or automatic writes. |
| `/owner/settings` | Existing profile, cover/introduction, hours and receiving forms. Included in the safe login-return allowlist. |
| `/owner#profile`, `#hours`, `#accepting` | Redirect to the matching `/owner/settings` anchor after current access checks. Loaded forms reveal/focus the target. |
| `/support?workspace=owner` | Existing support workflow with owner navigation only when the current account manages a restaurant. Other accounts get personal navigation. |
| `/admin` and Admin pages | Shared light workspace layout with grouped Admin-only navigation; existing permissions and workflows. |
| `/notifications?workspace=admin` | Admin workspace only for the current Admin; other accounts retain their personal layout. |
| `/admin/support` | Existing administrative support workflow in the Admin workspace. |

`WorkspaceLayout` owns desktop collapse/tooltips, navigation groups and the mobile modal drawer. App composition selects personal/owner/Admin contexts; domain widgets stay in their features. `SetupChecklist` has an optional `overview` presentation while its default compact variant remains usable by inbox, onboarding and Admin.

The owner sidebar groups overview, restaurant management, operations, finance and support; its bottom action switches to the personal account. Personal navigation includes profile, authorized purchase history, active-account notifications, support and privacy. Its separate bottom action opens management only for an authorized active owner, or the existing opening-application workflow for an eligible user. The header dropdown provides workspace links and real logout with visible failure feedback.

## Data and interaction rules

- Profile uses existing `PATCH /profile` with the current `expected_version`. Validate name/phone, focus associated field errors, prevent pending duplicate saves and retain drafts on errors/conflicts. Success updates session identity only after the API confirms. Logout failure retains the session.
- Overview reads `/notifications/setup/{restaurant_id}`. Count completed `Guide.steps` against the returned total for the bar and ring. Keep activation, configured/public visibility, receiving and current opening hours distinct. An all-complete checklist outside opening hours does not imply orderability.
- Row statuses and responsibility use the API's `complete`, `status` and `assignee`; owner actions navigate to existing workflows. Refresh has pending feedback, retains last-good data on network failure with a stale warning, and clears protected details on 401/403/404.
- The actual project permits at most one managed restaurant. Display its name as a static identity card; omit the prototype's multiple-restaurant selector. Never copy sample account details, progress or unsupported metrics into application data.
- Sidebar/content/dropdown/button transitions take 150–280 ms; CSS disables motion when reduced motion is requested. No animation delays business mutations.
- At 1024 px and above, use a 256 px expanded sidebar or 76 px collapsed rail. Below 1024 px, use a native modal dialog drawer with backdrop, Escape, explicit Tab/Shift+Tab wrap, inert background, scroll lock and focus return. Resize to desktop closes it.
- Profile and overview reflow into one column on narrow screens. Forms use visible labels and touch controls; the footer is a short copyright/location line. Existing business-page tables retain their own scrolling behavior.

## Admin extension — October 24, 2026

The user's follow-up explicitly extends the shared visual/interaction system to Admin. It supersedes the earlier instruction to retain the old navy sidebar shell. `/account` and `/privacy` now use personal navigation even for Admin; the personal sidebar provides a separate return to `/admin`. `/admin/*` uses grouped management navigation and the compact workspace footer. No buyer, owner-fulfillment or owner-payment rights are added.

`AdminTasksPage` uses a navy guidance banner, current task list and quick actions to existing application, restaurant, delivery, user, audit and support pages. Group selection, refresh, pagination, loading/error/empty feedback and backend task links remain connected to the existing API. No total counts, revenue or pending statistics are invented. The shared desktop collapse/tooltips and mobile dialog/focus/reduced-motion behavior also apply to Admin.

Follow-up verification:

- Frontend lint/build: PASS; the existing bundle-size warning remains.
- `test:workspaces`: PASS; includes Admin profile/overview at 360/390/768/1024/1440 px, management separation, task groups/pagination/empty/error/retry, report navigation alias, notifications/support context, non-Admin guards, collapsed tooltips, mobile focus/Escape and 200% zoom.
- Admin overview, profile and mobile screenshots visually inspected: `hlf-workspaces-evidence-ZKfo2R` in the host temporary directory.
- `test:homepage`: PASS; `hlf-home-evidence-YrdrGG`, controlled API responses.
- Connected `test:setup`: PASS; `hlf-browser-evidence-tMykT7`, actual Admin activation/survey/rate and owner consent/explicit receiving on the existing dedicated test database below. Backend source/MFA/permission policies are unchanged.

## Verification — October 24, 2026

Evidence is self-review, not independent acceptance. No release or production deployment is implied.

| Check | Result |
| --- | --- |
| Frontend lint/build | PASS; lint has no warnings. Build retains the bundle-size warning above 500 kB. |
| `test:workspaces` | PASS; controlled API responses, real isolated Chrome. Five widths, identity separation, profile validation/save/pending/conflict/error/logout, guide refresh/stale/403, routes/anchors, support context, drawer focus/Escape/backdrop/resize, collapse/tooltips, long text, zoom/reduced motion and capability guards. |
| `test:settings` | PASS; actual personal profile update/reload and SQL assertion, configuration draft preservation, field validation/focus and five widths. |
| `test:setup` | PASS; actual setup-required partner → profile/hours/menu → Admin activation/survey/rate → owner consent/replay → ready → explicit receiving. |
| `test:homepage` | PASS; five widths, shared header/footer, guest/buyer/owner/Admin, auth, filters, states, keyboard, reduced motion and zoom; controlled API responses. |
| `test:storefront` | PASS; cover/grid/cart drawer, owner-content route, consent, states, keyboard and zoom; controlled API responses. |
| `test:cart` | PASS; 7 existing cart persistence/consent/safe-return/undo unit checks. |
| `test:cart-browser` | PASS; cart/quote/undo/checkout handoff, consent and states; controlled API responses. |

Connected checks use only the new `test_workspace_ui_20261024_01` database in the existing `hlf-v04-test-mysql-1` Oracle MySQL Community Server 9.2.0 container at loopback 43316. Existing reviewed migrations were applied to that new database; no new migration was authored. The existing browser harness replaces outbound SMTP/password-corpus checks; authentication, API and SQL are real. Development data at port 3307 was not used.

Screenshot directories under the host temporary directory:

- Workspace fixture checks: `hlf-workspaces-evidence-8TZMB9` (desktop/mobile account and owner, collapsed rail, drawer, states, long text, zoom and Admin).
- Connected profile/settings: `hlf-browser-evidence-2fM6ix`.
- Connected readiness/setup: `hlf-browser-evidence-T6ihWE`.
- Homepage/header: `hlf-home-evidence-uf4mA9`.
- Storefront: `hlf-storefront-evidence-U3oXBP`.
- Cart: `hlf-cart-evidence-Iptxcp`.

Documentation checks: PASS for local link paths, the new UI anchor, four changed Markdown files below 500 lines, and `git diff --check`. Desktop/mobile profile, overview, drawer and zoom screenshots were visually inspected against the Make composition.

Existing browser journeys that configure the restaurant now enter `/owner/settings`, retaining their original assertions. Backend application suites and unrelated full connected business journeys are NOT RUN for this frontend-only change. Scope-specific setup and profile persistence evidence does not prove production readiness.
