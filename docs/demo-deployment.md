# Academic MVP demo — October24,2026

User requests deployment for the next-day teacher demo, **not commercial V1.0 acceptance**. User explicitly selected `https://sv26.bcse-vju.com`, approved switching that hostname while retaining rollback, approved encrypted SMTP/MFA/media transfer, then approved a temporary Cloudflare ciphertext-download URL. Earlier private-only staging choice is superseded for this demo route. No paid service, original age identity transfer, old DB migration/reset, Gemini calls or pilot are authorized by this handoff.

## Candidate and executed evidence

Current working-tree backend/frontend candidate, Linux/amd64 Node24.22.0/npm11.19.1 and MySQL**9.2.0**; no host upgrade/build is required. [Prior MVP verification](mvp-ordering-verification.md) owns108reported cases/five connected local browser journeys. [Linux candidate](evidence/p29-linux-candidate.json) owns native-module/runtime evidence. App source is unchanged by this deployment tooling.

[Demo receipt](evidence/demo-deployment.json) records actual local end-to-end package rehearsal: source snapshot62tables/203rows restored into a new Docker DB with exact schema/all-row comparisons;205objects restored/read back; restricted runtime grants; real backend startup and public200/anonymous401/invalid-login401. Observed DB223.7MiB/API220.8MiB/storage96.82MiB; caps384/384/192MiB respectively. Synthetic MFA/SMTP values were used in the local runtime probe, never the source secrets; this probe is **not authenticated remote Admin/browser evidence**. Probe containers/volumes were label-checked and removed.

Three Python routing/rollback-plan tests, scoped ESLint, Node/shell syntax and artifact/key-exclusion checks PASS. Actual nginx syntax/reload and routed smoke occur on the VPS, with rollback on routed-smoke failure. Production NFR/load/pilot/operational recovery remain unaccepted.

## Selected topology and data boundaries

- User-reported live site: `/etc/nginx/sites-enabled/hlf`, server_name sv26.bcse-vju.com, IPv4/IPv6 port80, root `/var/www/hlf`; only old `hlf-mysql` was listed. Existing public HTTPS termination is reused; this does not prove its renewal/ownership arrangement.
- Keep old `hlf-mysql`/`hlf_mysql_data`/`cse3045`/3306, old `hlf-backend.service`/3000 and original frontend files intact. Change only the selected HTTP server block for sv26; save original text/hash for rollback. Refuse ambiguous/local443 configurations. Existing default hosts are not broadly replaced.
- New Docker DB `hlf-mac-copy-mysql`/`hlf_mac_copy_data`; refuse an unowned target. If the prior authorized import exists, preserve its volume/hlf_dev_flow and recreate only its owned container to add API publication. Copy the approved snapshot into a **new `test_hlf_demo` database**; existing schema causes refusal. This isolated academic namespace keeps the existing test-only PersonalVault guard; it is not production storage adoption. Do not run destructive test/cleanup tools against this retained copy.
- Backend and MinIO share the new DB network namespace: DB/S3 are loopback inside it; only host127.0.0.1:13307(SQL) and127.0.0.1:14300(API) are published. nginx serves the built frontend and proxies `/api` to14300 under the one HTTPS origin. Secure/__Host cookies, CSRF and Admin MFA stay enabled.
- Runtime has fresh limited DB grants and fresh JWT/CSRF/quote keys, original approved MFA encryption key and SMTP config, separate local media credentials, persistent object/vault volumes. No original age identity is copied. Source private-payload table was empty; installer refuses nonempty source private payloads rather than guessing missing vault keys.
- AI and dev role switching stay OFF, no Gemini key copied, source quota counters preserved by SQL copy. No account/password/ownership reset or demo seed is performed. Source restaurant/order snapshots and credentials are retained as selected by the user.
- No original SMTP/MFA or media plaintext file is created on Mac: private data is compressed/encrypted in memory. A separate generated unlock key is held in a mode0600 Mac file and entered at a hidden SSH prompt. On the VPS, required runtime config is placed in protected state files; Docker operator access can read runtime secrets. Do not paste .env/inspect outputs into chat.

## Executed user-run deployment

The agent cannot authenticate the session-selector SSH gateway. The user executed the generated script through the existing authenticated VPS shell, then entered the separate unlock key at its hidden prompt. The user confirmed authenticated encrypted download; the temporary ciphertext-only Cloudflare endpoint and Mac file server are **CLOSED**. The demo runs independently on the VPS; Mac does not need to remain awake.

Initial install started the application but failed routed nginx verification and restored the previous route. A targeted repair changed only routing/readiness checks without repeating DB/media import. The final user output is **PASS / stage complete**, with the previous nginx configuration saved. Do not rerun the old download/bootstrap command.

Independent public HTTPS checks on October23 at14:13UTC: login200, restaurants200(one), dishes200(four), anonymous auth/me401, JS200 and CSS200. Both JS/CSS bytes match the packaged frontend exactly. Native Edge observation confirms homepage discovery, restaurant menu and login form rendering with source sample-data labels, prices and add-to-cart controls. Public dishes have no image references and correctly show placeholders; original private-object reads were not independently tested remotely. Authenticated buyer/manager/Admin journeys and mobile viewport checks on this VPS remain **NOT RUN**; prior local journey evidence is separate. Existing passwords and Admin Authenticator are retained; no accounts were reset.

## Rollback and completion evidence

```sh
sudo sh /opt/hlf-demo-20261023/rollback.sh
```

Rollback restores only the hash-owned nginx change and stops the release-owned new API/storage containers; it retains all DB/object/vault data. Old backend/DB/frontend were never removed. Config edited after install requires inspection rather than forced overwrite. Do not rerun the installer blindly after failure; inspect the sanitized stage/receipt.

The first installer used Node fetch, which ignored the supplied Host header in local reproduction. The first explicit-Host remote repair still failed and restored the original route; that attempt did not capture its exact failing status. Actual disposable nginx1.24 with the packaged frontend/selected hostname and a stub API passed200/200. The final bounded-readiness repair passed on the VPS by user report; public HTTPS and browser discovery/menu checks then passed independently. This does not establish the exact cause of the intermediate failure.

VPS scheduled backup remains **NOT CONFIGURED**. Manual source recovery evidence exists, but operational15minRPO/4hRTO, offline-key custody (deferred), load/pilot and V0.9/V1.0 acceptance remain separate. Academic deployment PASS does not imply release acceptance.
