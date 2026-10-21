# P25 — Synthetic verification and adoption boundary

Authority: [approved DEC-08](account-support-policy-proposal.md), [technical contract](account-support-v07-contract.md), [P25 evidence](progress/P25.md). All actors, order contacts, QR/bank references and proof metadata are explicit synthetic fixtures. No real partner, survey, consent, message or money movement is proven by them.

## Reproduce

Run package commands from repository root. Backend/frontend are separate packages. Use the existing private MySQL9.2.0/InnoDB container at loopback43316 and optional private MinIO43317 as documented in [payment verification](payments-local-verification.md). Never point these commands at retained3307. Preserve existing DBs; create a new local `test_p25_*` database, never reset/reuse an old initialization fixture database.

Configure `TEST_DATABASE_URL` and `DATABASE_URL` to that same new database. Storage configuration follows the linked synthetic guide; evidence and dish buckets must differ. Local tests replace outbound SMTP/password-corpus calls only where their harness explicitly says so; production credentials/services remain DEC-10.

```sh
DATABASE_URL="$TEST_DATABASE_URL" npm --prefix backend run test:prepare
npm --prefix backend run prisma:validate
npm --prefix backend run prisma:generate
npm --prefix backend run lint
npm --prefix backend test
npm --prefix backend run test:e2e
npm --prefix backend run build
npm --prefix backend run test:integration
npm --prefix backend run test:administration-permissions
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend run test:cart
npm --prefix frontend run test:orders
npm --prefix frontend run test:finance-unit
npm --prefix frontend run test:administration
```

Backend test commands clear `.test-dist`; run compile/test/build sequentially and never clear output while a browser/backend worker uses it. Once compiled, `node test/integration/run.mjs` from backend executes the same guarded prepare/migrate/full-suite phase without recompiling; this permits Chrome on a different DB concurrently. Do not mistake source lint or HTTP mocks for SQL/browser evidence.

The whole suite's sole-Admin initialization inventories all legacy classifications; use a new DB for a new whole-suite run. Later fixtures intentionally preserve history and may make repeated initialization on the old DB inappropriate. A failed repeat is not a successful verification or permission to delete those fixtures.

Use another **new empty** DB with `TEST_DATABASE_URL` for `npm --prefix backend run test:onboarding-upgrade`. It installs old schema/synthetic rows, records every original column, deploys all forward migrations and compares snapshots; asserts zero invented P25 rows and no inferred compromised credentials.

`test:administration-permissions` needs an operator identity on that synthetic DB to create/drop temporary restricted runtime/provision users. It verifies SQL cannot rewrite messages/events/availability reasons/private ciphertext, purge personal data or delete audit. Real HTTP runs with that runtime identity; retention uses a separate operator application context. Temporary identities are removed afterward. Never grant operator purge rights to the website identity.

## What the P25 integration proves

USER-01/SUPPORT-01/AUDIT-01/AUTH-02/ADMIN-02 integration uses actual HTTP/MySQL and an independent backend worker. It checks suspension versus delivery, old-session revocation, explicit restricted-route denial, no pending acceptance/configuration/new checkout, current-owner completion/one base/cash receipt, suspended-owner late QR receipt/full refund and same-key races. QR proof metadata in this P25 fixture is synthetic; P20 independently exercises actual decoded image upload/private MinIO/proof lifecycle.

Support checks same-key/changed-intent recovery, duplicate-case uniqueness, current buyer/manager scope and actual foreign nested IDs, internal-note isolation, expected-version states, waiting reply, escalation, resolution/creator closure, no reply after close, hold/reveal authorization and safe access audit. Actual success/error responses are validated by Ajv against [enabled P25 OpenAPI](data/administration.openapi.json).

Privacy checks encrypted personal reads, no contact in the synthetic business row, active hold blocking expiry, hold/dispute versus a deliberately paused deletion claim in another process, key erasure after claim, support/profile retention and restored DB metadata failing to resurrect the erased key. Unknown payment or unpaid completed payment prevents cleanup. Profile due time derives from known closure facts; maintenance does not grant a fresh30day window merely because it ran late.

Compromised-credential checks use synthetic email delivery/password-corpus substitutes: old sessions and old-password login fail, Admin cannot resume early, OTP failure counts persist, a recovery audit outage rolls back password/unblocking, successful single-use recovery revokes sessions and keeps suspension. Standard password policy/SMTP mechanism retains its separate existing unit/operational evidence. This is not proof of live email delivery for a real customer.

Audit checks legacy redaction, actor/filter-bound cursor tampering, time-window/unknown-filter denial, no private response when access audit fails, and stable bounded projection. Support cannot mutate fulfillment, receipts, refunds or settlements.

## Browser and operations

`browser-administration.mjs` launches actual Chrome/Vite/NestJS against a separate new MySQL DB. The browser-server harness supplies synthetic password/MFA/email fixtures. It verifies support after committed-response loss/reload with one durable case, cookie account switch while that intent is uncertain, no foreign intent display, and recovery with the original actor/body/key after return. Admin self-suspension is refused through UI and an actual HTTP attempt; cancellation performs no write. It also verifies account suspension, hold recovery after committed-response loss without duplicate holds/exceptional reveal/redacted audit, restricted manager delivery with pending acceptance disabled, a real foreign support ID404, compromised-account email-code/password recovery without account resumption, native dialog keyboard focus and360/390/768/1024/1440px without full-page overflow. Screenshots require visual inspection in addition to assertions.

Routes: `/support`, `/privacy`, `/recover-access`; Admin `/admin/users`, `/admin/support`, `/admin/audit`. Ordinary buyers use the student shell, managers/Admin their existing distinct shells. Restricted navigation shows obligations only; font/tokens and original bundled reference remain unchanged. The named reference “Admin: Nhật ký hành động” is visual guidance; its fictional rates/contacts/ownership examples are not policy/data.

Local retention command:

```sh
P25_LOCAL_MAINTENANCE=true P25_MAINTENANCE_ACTOR="$SYNTHETIC_ADMIN_ID" npm --prefix backend run privacy:cleanup:local
```

Use the configured synthetic operator DB/JWT/MFA environment only. The command rejects nonlocal/non-`test_*` targets and website access; it does not bootstrap an Admin. A private temporary key directory is database-namespaced, separate from MySQL. `P25_PRIVATE_KEY_DIR` optionally selects an operator-controlled test directory. Losing an undeleted key is unavailable, not erasure. Keep deletion tombstones independently of DB rollback/restore. No production filesystem/KMS/backup/provider deployment or retained plaintext conversion is enabled by these tests.

P25 contains no external support notification/escalation integration, second Admin, owner reassignment, arbitrary financial recovery charge, automatic debt suspension or transfer/refund. Production duty staffing, key custody, backup expiration/restore enforcement, actual published notices and legal/operational review remain DEC-10/11/12. Remote CI and retained adoption are recorded separately in the evidence, never inferred from local success.
