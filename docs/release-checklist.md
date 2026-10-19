# V1.0 Commercial Launch Checklist

Authority: [roadmap](roadmap.md) V0.9/V1.0, P29–P36; [requirements](requirements.md) AC19; operations in [deployment](deployment.md). This is an unexecuted acceptance checklist, not approval to release.

Each item requires exact candidate commit/artifact/config/migration references, date, operator/reviewer, actual result and sanitized evidence link. All initial values are **NOT RUN** or **BLOCKED** by the relevant [decision](decisions.md). No box may be checked from planned tests, mock success, old-model reports or completing documentation/prompts.

## Product and policy — P34

- [ ] P01–P33 accepted with required evidence; no unresolved money/security/data-loss blocker; required V1.0 functionality cannot be silently disabled.
- [ ] Public homepage/list/menu works without auth, protects account/application/finance data; guest cart survives login and never auto-submits.
- [ ] Ordinary manager can buy; at most one restaurant per account; explicit primary Admin selected, no website Admin grant, sole MFA authority/recovery drill accepted.
- [ ] Opening/manual-creation consent records exact Vietnamese partnership version; review/history/link creation atomic; setup-required partners cannot sell early.
- [ ] Verified real partner identity/consent/menu/hours/images/pickup surveys/fees and explicit commercial commission agreed; no demo values used as defaults.
- [ ] Cash plus direct QR instructions/verified receipt/refund obligations pass approved policy; no scan/claim marks paid; order/payment/refund facts stay independent.
- [ ] Manual ledger/adjustments/settlements/receipts/reports and signed balances accurate; support and scoped user/audit operations usable.
- [ ] AI provider/budget/privacy/quota/cost/evaluation accepted; no contacts/transcripts/secrets sent or stored; valid manual ordering works during failures.
- [ ] Approved Vietnamese privacy, partnership, payment/refund/support notices match actual behavior and retained data; DEC-03/04/06/07/08/09/12 closed for launch.

## Quality evidence — P30–P33

- [ ] MySQL **9.2.0** everywhere, including CI/staging; empty and upgrade migration, real CHECK/FK/UQ, transactional audit/rollback and cross-instance races verified.
- [ ] Current auth/MFA/ownership/private nested/list/replay tests pass; no role injection or extra Admin provisioning; secrets absent from bundle/logs/artifacts.
- [ ] Price/fee explicit consent, immutable snapshots, original intent/key recovery after commit-response loss, accept/cancel, payment/refund and settlement assignment races verified.
- [ ] Real browser anonymous→login→checkout→tracking/history plus applicant/manager/Admin/QR/finance/support journeys pass; actual screenshots/state observations retained.
- [ ] 360 px complete flow, 390/768/1024/1440, keyboard/focus/labels/contrast/zoom/reduced motion and accessibility evidence accepted.
- [ ] NFR01 lists ≥95% within 2s at 50 concurrent users; NFR02 AI ≥95% within 5s and fallback at 10s measured in approved environment, including errors/timeouts.
- [ ] Approved VJU pilot cohort/window/limits ran with real partners; cash/QR/refund/commission/support observations reconciled; blocking defects fixed and affected checks rerun.

## Operations and recovery — P29/P30/P34

- [ ] Hosting/domain/HTTPS, same-origin routing/SPA fallback, runtime/toolchain, health checks and secret custody approved; migration/runtime/backup identities separated.
- [ ] CI gates/branch controls and exact release artifacts reviewed; compatibility/forward migration rehearsed without resetting retained data.
- [ ] Daily protected backups and freshness/failure alerts evidenced; approved retention/encryption/access and RPO/RTO recorded.
- [ ] Successful isolated restore on 9.2.0 recovers schema/constraints, snapshots, histories, payments, ledger/receipts, audit, keys/results and media; counts/totals/replay verified.
- [ ] Recovery gap reconciliation handles external direct restaurant receipts and manual commission receipts after backup; no blind replay from a stale restored key store.
- [ ] App rollback/schema compatibility, traffic/write controls, named incident/support/partner/recovery owners, alerts/acknowledgement/escalation and isolated drill accepted.
- [ ] Single Admin recovery custody/availability is workable; operational backup people do not imply additional application Admins.

## Approval and controlled release — P35

- [ ] Dossier identifies exact candidate, environment, decision versions, evidence/known risks, rollout window/cohort/limits, stop/rollback thresholds and named release authority.
- [ ] Explicit approval for that candidate/window recorded **before** any production migration/config/deploy/traffic mutation. Running P35 or silence is not approval.
- [ ] Pre-change backup/recovery point verified; controlled rollout records actual commands/outcomes/timestamps; safe smoke/health/security checks and authorized supervised orders succeed.
- [ ] Any failure stops rollout and uses reviewed compatibility/incident plan; history and unknown outcomes retained/reconciled.

## Post-release acceptance — P36

- [ ] Agreed observation window met with real availability/latency/error/cost/backup/alert/support evidence and partner cash/QR/commission reconciliation.
- [ ] Incident/restore exercise runs on an isolated target; production is not overwritten for a drill.
- [ ] Known residual issues have owners/dates; no unresolved integrity/security/mandatory product blocker; operational handoff and next review recorded.
- [ ] Named authority accepts V1.0 actual results and links final release record. Deployment alone is insufficient.

## Release record template

Candidate commit/artifacts/config/migrations: TBD. Decision/terms versions: TBD. Test/pilot/restore evidence: NOT RUN. Blockers/defects: see decisions and actual acceptance records. Operator/reviewer/release authority: TBD. Approval date/window/scope: NOT APPROVED. Actual rollout/rollback/post-release evidence: NOT RUN. V1.0 acceptance: **NOT ACCEPTED**.
