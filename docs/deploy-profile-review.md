# Exact VPS personal-profile migration review

Parent: [demo deploy runbook](github-actions-deploy.md), [personal-profile contract](profile-identity.md).
Scope: the explicitly requested academic demo update preserving VPS data, not P35 acceptance.
This is a one-time schema gate, independent from the automatic image-cache policy.

## Selected release and preservation

- Target: `7e4ff90ee25181e4220dbd603b74fa29f63719b6`; [all source CI/publish jobs passed](https://github.com/Namkhasnh/cse3045-nhom-3/actions/runs/40912718508).
- Previous old reader: `a0056b586c87a5e783993869300f9b37dd1356a3` only. Other current versions stop for review.
- Only allowed pending migration: `20261027010000_account_profile_identity`.
- Exact SQL SHA256: `4db724976113b26e91fd706c82b437d5233826b633237df0ee1ef34a8693ea36`.
- Changes: nullable avatar/email-proof columns plus default-zero attempts on accounts; empty account_avatar_media
  with same-account FK, image and lifecycle CHECK constraints. No historical avatar, pending proof or email is invented.
- Required narrow grants: UPDATE only new account columns; SELECT/INSERT avatar rows and UPDATE only lifecycle markers.
  No DELETE, immutable avatar metadata UPDATE, DDL, authority or global rights are added.

The existing service must compare every old business column/row, backup SQL/media/vault, restore/compare and rehearse
this exact expansion on MySQL9.2.0 before touching the real schema. A failed expansion keeps maintenance for forward
repair; no dump is automatically restored over subsequent writes.

Old signup/profile writers can omit the new fields because defaults satisfy the constraints. Old sessions/readers
retain existing ID/email/auth-version semantics. The selected previous code sweeps dish/cover prefixes, not personal
avatars. Rollback is deliberately more conservative: after freezing writers, account_avatar_media must be empty and
all new account fields must still be NULL/default zero. A new personal avatar or outstanding email proof blocks
rollback; use forward repair. Completed email changes preserve the ordinary email/verified/auth-version fields that
old readers understand. There is no schema downgrade or deletion of new facts.

## Install the root review once

Download the exact reviewed helper source snapshot supplied in the handoff, then run from its source root:

```sh
sudo python3 ops/deploy/review_profile.py 7e4ff90ee25181e4220dbd603b74fa29f63719b6
```

The helper takes request/operation locks, checks the existing server fingerprint/capacity and previous app, validates
source CI/manifest/digests and actual migration history, derives the existing runtime identity without printing its
URL/password, and writes `/etc/hlf-deploy/reviews/TARGET_SHA.json` root-only. It refuses altered SQL, another pending
migration, another previous app or a different existing review. It does not migrate, grant privileges, backup, stop
containers or modify application data. No runner/controller reinstall is necessary.

After PASS, run the private workflow with **Deploy** and the exact target SHA above. Preflight can now pass; the
service still performs all real-data backup/restore/rehearsal and compatibility gates before application. Do not
substitute a newer SHA: the review is intentionally commit-specific. Future code-only releases with unchanged
migration history normally need no new SSH review. Another migration needs its own reviewed preservation profile.

## Evidence and limits

[Local receipt](evidence/deploy-profile-review-local-20261030.json) records50passing safety tests and a disposable
real MySQL9.2.0 backup/restore/rehearsal of this actual SQL, preserving signed DECIMAL/BigInt/old rows. Runtime new-column
writes passed; unrelated writes, avatar metadata UPDATE and DELETE were denied. The avatar data guard became nonzero
when a synthetic new row was inserted inside a rolled-back runtime transaction; the pending-email guard also
became nonzero for a valid synthetic proof. The synthetic schema/data were removed.

VPS review creation, actual retained-schema expansion and application deployment are not established by local proof;
record their actual output separately. Live SMTP delivery/authenticated profile changes are not smoke-test claims.
