# Auth Compatibility, Return Navigation and DB Identities

Scoped follow-up, October 19, 2026. User requested previous-application compatibility after migration, login return continuity, expired-email browser evidence and runtime/provision separation. This historical record verified a slice; the later [final review](progress/V0.1.md) accepts P01–P03/V0.1. Neither record authorizes production. Existing unrelated work was preserved.

## Delivered behavior

- `returnTo` accepts only implemented internal destinations: `/`, `/account`, `/owner`, `/admin`, `/restaurants/{positive integer}`. Preserve query/hash. Reject external/protocol-relative/backslash/control-character/auth-loop/unknown routes. Current authorization still controls the destination.
- Anonymous protected navigation and public menu login/signup links retain the destination. Registration, verification, resend recovery and MFA retain it until successful login. No order submission or cart/checkout implementation was added.
- Expired email shows the Vietnamese error while retaining username/code and a working resend action. Resend clears stale feedback and disables duplicate requests while pending. Chrome exercises an expired DB fixture, denial without session, resend, verification and login.
- Provisioning requires `PROVISION_DATABASE_URL`, a distinct user on the same host/port/database as runtime `DATABASE_URL`; no fallback. Nest runtime reads only `DATABASE_URL`. Restore-evidence inventory in the CLI uses the provision connection.
- [SQL grants](../backend/prisma/permissions/grants.sql) allow runtime auth/MFA state changes and audit append, but deny authority creation/update/delete, factor replacement, role update, history mutation and DDL. Provision may insert the sole authority and enroll/recover factors, with no authority delete or DDL. The grants support the currently enabled auth/read-only catalog slice; new business writers require reviewed additions.

## Previous-application compatibility boundary — DATA-01

`test:compatibility` archives previous backend commit `0e27bf9` into a temporary directory, generates its own old Prisma client, compiles its actual source, expands a fresh synthetic legacy fixture through current forward migrations, then starts the old HTTP application. All original columns/rows are hashed before/after expansion. Buyer, legacy owner and legacy Admin login/me/profile/logout/session revocation pass; IDs, credentials and ownership remain readable. No retained data or applied migration was rewritten.

This proves application rollback/read compatibility during the **expansion, before authority cutover** window. It does not authorize restarting the legacy role-based app after cutover: it lacks current singleton/MFA enforcement and still has retired privilege-writing routes. After cutover, keep old writers stopped; recover forward using a build that enforces capabilities/MFA. Never downgrade DB facts or re-enable old privilege/session semantics. Synthetic compatibility fixtures do not replace the prior retained-data restore evidence.

## Local operational configuration — SEC-01

The user explicitly approved applying fresh runtime/provision users to local `hlf_dev_flow` at `127.0.0.1:3307`, updating `backend/.env` and storing operator credentials outside the repository. Automatic approval review initially rejected the operation for missing explicit target authorization; no operation ran at that point. After the user's explicit approval, configuration was applied using the container operator credential. The old application user lacked CREATE USER; its failed attempt made no account/grant/config change.

- `backend/.env` now contains the restricted runtime connection and preserves other settings; mode `0600`.
- Protected operator file originally at `/private/tmp/hlf-local-db-operators-final-20261019/operator.env`; final acceptance moved it to `/Users/namkhanh/.config/hoa-lac-food/operator.env`, parent `0700`, file `0600`, verified identical and removed the temporary original. It contains `PROVISION_DATABASE_URL`, `MIGRATION_DATABASE_URL` and `DB_OPERATOR_URL`. Values are never printed or tracked. Use the durable location for future authorized operator commands.
- Existing users/grants and business rows remain unchanged. The previous broad credential is no longer the configured runtime identity. No Admin enrollment/recovery or migration was performed on retained data.
- Direct local verification: both new identities have restricted grants, runtime authority update/delete and secret replacement are denied, one authority remains, and runtime `db:check` passes SELECT 1. No backend listener on port 3000 was present; a future backend start loads the new `.env`. Existing processes elsewhere require restart to load changed credentials.

Operator commands run in a private **subshell** after exporting the protected file's values. Provisioning uses normal runtime `.env` plus `PROVISION_DATABASE_URL`. For migration/rehearsal commands, set `DATABASE_URL="$MIGRATION_DATABASE_URL"` for that command only. Never launch the HTTP runtime from a shell exporting operator credentials. Migration/provision/backup identities are operational credentials, not application Admin identities. Production configuration remains NOT RUN.

[Local configuration tool](../backend/scripts/configure-local-db-identities.mjs) requires explicit `--apply-local`, an operator connection through `DB_OPERATOR_URL` and a new private `DB_IDENTITY_OUTPUT` directory. It creates fresh identities, applies reviewed grants, checks runtime denials, writes the operator file before switching `.env`, and preserves existing grants. Its isolated rehearsal used only synthetic `.env`/DB data. Do not rerun against retained storage merely to reproduce evidence.

## Exact verification

HEAD `0e27bf9` plus existing dirty work and this scoped change. Source basis SHA-256: `1353e410cab607e019825b91c2b6d9d950cc1d6e0d05c8ee81b4a0e00d1c531d`; recipe in [P01](progress/P01.md#source-and-authorization). Node 24.21.0; npm 11.19.0; Prisma 7.10.0; Oracle MySQL 9.2.0; real headless Chrome. Dependencies/lockfiles were not changed by this follow-up.

Commands from repository root unless noted. `TEST_DATABASE_URL` was supplied privately for isolated loopback `test_*` databases on dedicated container `hlf-followup-20261019`, port 43317. The retained source used port 3307 only for the approved identity configuration/read-only/no-op permission checks.

| Command | Result |
| --- | --- |
| `npm --prefix backend run lint` | PASS |
| `npm --prefix backend test` | PASS, 26 tests |
| `npm --prefix backend run test:e2e` | PASS, 5 tests; mocked Prisma |
| `npm --prefix backend run test:integration` | PASS, 3 real-MySQL groups, `test_followup` |
| `npm --prefix backend run build` | PASS |
| `npm --prefix backend run prisma:validate`; `run prisma:generate` | PASS; generation also runs before build/test compilation |
| `npm --prefix backend run test:compatibility` | PASS final command including automatic build; actual old revision compiled and ran on `test_compatibility_final` |
| `npm --prefix backend run test:permissions` | PASS on fresh migrated `test_browser_final` |
| `npm --prefix backend run test:cli` | PASS, 18 signed-manifest/PTY scenarios on `test_cli_final`, restricted provision identity |
| `npm --prefix frontend run lint`; `run build` | PASS |
| `npm --prefix frontend run test:smoke` | PASS after making the offline API target deterministic |
| `npm --prefix frontend run test:connected` | PASS using real MySQL and restricted runtime; only SMTP/password corpus replaced |
| `npm --prefix backend run db:check` | PASS, local restricted runtime SELECT 1 only |
| Local operator configuration tool | PASS isolated rehearsal, then approved retained-local configuration; private file modes and SQL denials checked |
| Documentation checks; `git diff --check` | PASS, 13 Markdown files under 500 lines, 173 local links/anchors resolved |

Chrome assertions cover expired email/resend, register→verify→login return continuity including query/hash, protected redirects, menu login return, manager buyer navigation, malicious destination rejection and Admin MFA/recovery. Widths 360/1440 px, keyboard focus and overflow are checked. The expired-email 360 px screenshot was visually inspected. This is automated browser evidence plus a focused visual check, not full accessibility certification.

Initial restricted-browser signup exposed missing INSERT privileges for Prisma's explicit defaults; the final template grants account INSERT while still forbidding authority writes/role updates. A repeat permission run against an already used fixture was rejected by its unique synthetic account; the final run used a fresh migrated fixture. Initial offline smoke depended on any backend on the default target; its Vite process now pins an unreachable API target. Earlier failing attempts are excluded from passing evidence.

Temporary sanitized logs: `/private/tmp/hlf-followup-*.log`. Final screenshots: `/var/folders/pn/4h65x5kx5sj8_4q9lkdj48k00000gn/T/hlf-browser-evidence-9LS8lY`. Test credentials and synthetic signing/enrollment artifacts are not published. Dedicated disposable DBs are retained for inspection and the test container is stopped after verification.

Self-review: Codex, October 19, 2026. This scoped task recorded no independent/user roadmap acceptance. The later final review records Codex self-review acceptance; remote CI, external SMTP delivery and production deployment remain NOT RUN. No P04/P06 business workflow or production release is implied.
