# Demo Gemini activation — October 26, 2026

The user explicitly requested activating Gemini on `https://sv26.bcse-vju.com` using the existing local backend configuration, and supplied SSH access. This extends the original [demo deployment](demo-deployment.md) authorization for AI configuration and bounded synthetic provider checks only. [DEC-09](ai-v08-contract.md) still owns model, privacy, quotas and application deadlines.

## Executed configuration change

- Authenticated to the selected VPS and confirmed `hlf-demo-api` runs the October 25 COD image. Before activation, AI was disabled and the Gemini key, model and project limits were absent.
- Transferred only the existing backend Gemini key, enabled/free-tier attestation, approved model and project limits through authenticated SSH with terminal echo disabled. The existing free-tier attestation was reused; remote Google billing status was not independently inspected.
- Preserved the server quota HMAC key, other runtime credentials, image, DB/storage containers, vault volume, network namespace and resource/security settings. No billing activation, model switch, migration, account/order/payment mutation or quota reset occurred.
- Updated both protected runtime environment files used by the original deployment and October 25 update. Created a replacement API container and retained the stopped prior container for recovery. Public catalog readiness passed after replacement.
- The first candidate-create request was rejected by Docker before any running-container or environment-file change because it included inherited container-network fields. Creation succeeded after omitting those fields; the runtime network mode was verified unchanged.

Protected VPS recovery evidence: `/opt/hlf-ai-20261026-151833/receipt.json`, prior container inspection and two environment backups in the same root-only directory. Previous container: `hlf-demo-api-before-ai-20261026-151833`. These protected files contain credentials and must never be published or committed. Inspect current state before recovery; stop the replacement before restoring the previous container name/start and the two backed-up environment files. Business data is retained.

## Actual verification and remaining limitation

- Google model lookup using the transferred key: HTTP 200; generation is supported. A lookup from inside the backend container also returned HTTP 200 in 345 ms.
- Two one-candidate synthetic generation probes exceeded the unchanged 7-second application provider deadline (7003 and 7022 ms).
- A separate diagnostic with a 25-second deadline returned HTTP 200, `STOP`, and one suggestion accepted by the application's output validator, in 17809 ms. This diagnostic did not change application configuration or deadlines.
- All three generation attempts reserved the existing durable global daily/minute/token counters and concurrency leases before external I/O, using the shared admission lock. Failed attempts remained counted. No account was created or impersonated. Request/response contents were not stored.
- Independent HTTPS after activation: homepage, `/recommendations` and public restaurant API all returned HTTP 200. This does not prove an authenticated recommendation journey; that browser journey is **NOT RUN**.

Result: **CONFIG ACTIVATED; PROVIDER GENERATION VERIFIED; APPLICATION LATENCY UNRESOLVED**. The current provider deadline is 7 seconds and workflow/frontend deadline is 10 seconds. The successful diagnostic would time out on the website. Three synthetic requests do not establish provider reliability or replace the existing 100-case evaluation.

Increasing the deadlines requires an explicit revision to DEC-09 and coordinated backend/frontend changes and verification. No timeout increase, automatic retry, paid tier or alternative model was enabled. Application tests were not rerun because application source was unchanged; evidence above is actual remote configuration/provider/public-HTTP verification.
