# GitHub Actions demo deployment

Status: implementation and verification evidence below. This is the existing academic demo,
not P35 or commercial V1.0 acceptance. The source repository stays public. The runner belongs
only to [Namkhasnh/hlf-deploy](https://github.com/Namkhasnh/hlf-deploy), a separate private repository.
The public repository has no self-hosted jobs. Deployment-tool CI also runs the disposable real
MySQL recovery rehearsal before publishing is allowed.

## 1. Release path and trust

Push to `hw1` → existing frontend/backend/MySQL CI plus deployment-tool tests → publish four
GHCR images → manually run the private workflow → server preflight → systemd deployment.
`main`, pull requests and forks cannot publish through this job. CI publishes only its exact
checked-out commit. The server independently checks successful CI jobs, source branch ancestry,
image repository/platform/revision and digest, applied migration history and root-installed reviews.

| Package | Contents |
| --- | --- |
| `ghcr.io/namkhasnh/hlf-backend` | Non-root backend runtime |
| `ghcr.io/namkhasnh/hlf-frontend` | Static assets in a scratch image |
| `ghcr.io/namkhasnh/hlf-schema` | One-shot Prisma migration tooling |
| `ghcr.io/namkhasnh/hlf-release` | Manifest with image digests, commit, CI run and migration checksums |

Only public code/build output belongs in these packages. The existing deny-by-default Docker
context excludes local data, environment files and operator secrets. No build args carry secrets.
Publishing uses the source workflow's `GITHUB_TOKEN`; the VPS pulls anonymously.

After the **first successful publish**, open each package under your GitHub profile → Package
settings → Change visibility → **Public**. Packages are initially private even when source is
public. Do this for all four packages before VPS preflight. A private package returns a pull
failure; no long-lived registry token is installed as a workaround.

The private repository must retain `main` as its default branch. Copy
[`private-workflow.yml`](../ops/deploy/private-workflow.yml) to `.github/workflows/deploy.yml`
there. It supports manual dispatch only and checks the repository and `main` ref. It does not
checkout source or run arbitrary image commands. Restrict write access to trusted operators.

## 2. First-time VPS installation

Prerequisites: existing demo healthy, Linux/amd64, Python **3.12+**, Docker, systemd, nginx,
sudo/visudo, HTTPS route and at least **3 GiB free** after pulls. Additional memory is needed
for the bounded disposable MySQL rehearsal. No database/storage/network topology conversion
is included. Installer defaults are inventory candidates, never proof of actual ownership.

Run in your already authenticated SSH session. Set `HLF_SHA` to the full **reviewed infrastructure
commit** containing this tooling, not a branch name. Do not paste any credentials into chat.

```sh
HLF_SHA=REPLACE_WITH_FULL_REVIEWED_COMMIT
case "$HLF_SHA" in *[!a-f0-9]*|'') exit 2;; esac
[ "${#HLF_SHA}" -eq 40 ] || exit 2
HLF_SETUP=$(mktemp -d /tmp/hlf-deploy-setup.XXXXXX)
curl --fail --location --proto '=https' --tlsv1.2 \
  "https://codeload.github.com/Namkhasnh/cse3045-nhom-3/tar.gz/$HLF_SHA" \
  -o "$HLF_SETUP/source.tar.gz"
tar -xzf "$HLF_SETUP/source.tar.gz" -C "$HLF_SETUP"
cd "$HLF_SETUP/cse3045-nhom-3-$HLF_SHA"
sudo python3 ops/deploy/install.py inventory
```

Share only this sanitized JSON for review. It lists image IDs, named volume destinations,
memory limits, actual MySQL version and migration names/checksums/status. It omits container
environments, rows, secret paths and nginx contents. A mismatch requires inspection before adoption.

After inventory matches the selected existing server, install:

```sh
sudo python3 ops/deploy/install.py install
```

If names differ, use the install script's `--help` and supply the verified `--api`, `--db`,
`--storage`, `--database`, `--vault-volume`, `--objects-volume`, `--host` and `--nginx` values.
Unsupported mounts, network layouts, multiline environment values or externally edited routes
must be adapted and tested first. Do not weaken the guards or rerun the old demo installer.

The installer captures live fingerprints and nginx root, discovers the existing MySQL secret
mount, creates `hlf-runner` and installs root-owned tooling. It does not restart containers,
replace runtime keys, edit nginx, migrate data or register a runner. Repeat installation refuses
to overwrite adopted state. Preserve `/etc/hlf-deploy` and `/var/lib/hlf-deploy` as private operator state.

## 3. Register the private runner once

In **hlf-deploy → Settings → Actions → Runners → New self-hosted runner**, choose Linux/x64.
Use the current official GitHub download and SHA256 verification commands shown there.
Never register this runner with the public source repository.

```sh
sudo install -d -o hlf-runner -g hlf-runner -m 700 /opt/hlf-actions-runner
sudo -iu hlf-runner
cd /opt/hlf-actions-runner
# Run GitHub's official download, checksum and extraction commands here.
./config.sh --url https://github.com/Namkhasnh/hlf-deploy \
  --name hlf-demo-vps --labels hlf-demo --work _work
# Enter the short-lived registration token at the interactive prompt.
exit
cd /opt/hlf-actions-runner
sudo ./svc.sh install hlf-runner
sudo ./svc.sh start
sudo ./svc.sh status
id hlf-runner
```

Confirm GitHub shows **Idle** and label `hlf-demo`. The account must not belong to `docker`,
`sudo`, `root`, `lxd` or `disk`. Its only passwordless privileged command is the fixed
`/usr/local/sbin/hlf-deploy-request` entrypoint, which accepts four operations and a full SHA.
Python isolated mode and root-owned module paths prevent runner-controlled import injection.
The runner can request deployment of trusted published code, so protect private-repo write access.

## 4. Daily use

1. Commit the intended application changes and push to `hw1`. Uncommitted changes are excluded.
2. Wait for source **CI** to finish successfully, including **publish**. Copy the full SHA from
   its release summary. A green app build without a successful publish is not deployable.
3. Open **hlf-deploy → Actions → Demo deployment → Run workflow**.
4. Keep branch **main**, choose **Deploy**, paste the SHA and run.
5. The workflow runs preflight and requests a fixed systemd service. It polls sanitized status.
   `PASS` means local nginx and public HTTPS frontend/assets/catalog/anonymous-auth smoke passed.

The command interface is also available in SSH:

```sh
sudo /usr/local/sbin/hlf-deploy-request preflight FULL_SHA
sudo /usr/local/sbin/hlf-deploy-request deploy FULL_SHA
sudo /usr/local/sbin/hlf-deploy-request status FULL_SHA
sudo journalctl -u hlf-deploy-operation.service -n 50 --no-pager
```

GitHub concurrency and server locks serialize requests. A successful current-release repeat
does not replace containers again. An attempted/failed release refuses blind retries; inspect
its protected state before any operator recovery. Cancellation, runner disconnect or workflow
timeout does not cancel the systemd operation. A dead service with unfinished state reports BLOCKED.

## 5. Migration review and recovery

Unknown/modified/unfinished migrations stop before maintenance. For pending migrations, install
a reviewed, root-owned `/etc/hlf-deploy/reviews/FULL_SHA.json`. Never copy a review or SQL supplied
by an untrusted workflow. Required structure:

```json
{
  "commit": "FULL_40_CHARACTER_SHA",
  "applied": {"EXISTING_MIGRATION_NAME": "EXISTING_64_CHARACTER_CHECKSUM"},
  "pending": {"NEW_MIGRATION_NAME": "REVIEWED_64_CHARACTER_CHECKSUM"},
  "changed_tables": ["REVIEWED_EXISTING_TABLE"],
  "new_tables": ["REVIEWED_NEW_EMPTY_TABLE"],
  "grants": [],
  "rollback_compatible": false
}
```

The maps must include the exact complete applied/pending history. Table lists describe permitted
DDL changes only: **every original business column and row must remain equal**, and new tables
must be empty. This first implementation intentionally rejects data-transforming migrations;
they need separately reviewed preservation assertions and tooling. Grants are explicit reviewed
GRANT statements for the actual runtime identity; missing grants are never invented.

Set `rollback_compatible` true only after reviewing old-reader behavior against all new facts.
For data-dependent compatibility, retain false and use a separately reviewed forward repair.
For code-only releases with identical migration history and no review, compatibility defaults
to true under the repository's unchanged application-contract requirement. A root-installed
review with empty pending can explicitly disable rollback or apply reviewed narrow grants.

During maintenance the service stops API/storage writers, backs up SQL/object/vault contents,
restores and compares them, rehearses migrations on disposable MySQL **9.2.0**, then applies
the reviewed expansion/grants to the real DB. App update retains the old API container and
assets. Backups are root-only local recovery points, not encrypted offsite/scheduled backups;
existing backup policy and manual encrypted VPS backups remain separate.

For an eligible successful release, choose **Rollback** in the private workflow and enter the
**current release's SHA being undone**. It returns to that release's recorded previous app:

```sh
sudo /usr/local/sbin/hlf-deploy-request rollback CURRENT_RELEASE_SHA
```

Rollback checks drift and migration history and never restores an old dump over subsequent writes.
A failed/unverified migration or incompatible rollback keeps maintenance for operator forward
repair. If deployment smoke fails, automatic recovery only runs when compatibility permits it;
the deploy workflow still fails even if recovery succeeds. Failed rollback smoke also leaves
maintenance. Do not delete volumes, reset schemas, seed, force-push migrations or rerun old scripts.

Private evidence: `/var/lib/hlf-deploy/releases/FULL_SHA/state.json`, `manifest.json`, `review.json`,
SQL/assets recovery files and rehearsal inventory. Do not upload these directories or runtime.env
to GitHub. Only sanitized status is printed to Actions. No automated retention/pruning is enabled.

## 6. Verification and remaining handoff

- PASS 16 local deployment safety unit tests and actionlint1.7.12 workflow validation.
- PASS disposable MySQL9.2.0 SQL/schema/row and object/vault restore, reviewed expansion rehearsal,
  source isolation, exact BigInt/signed DECIMAL history, rollback, FK/CHECK rejection and deliberate
  row-drift rejection. This uses the newly built hw1 schema-tool image with synthetic migration files.
- PASS Linux/amd64 builds of all three application/tool targets from a clean hw1 checkout;
  frontend extraction contains index/assets and excludes container runtime files and environment files.
- NOT RUN on VPS: adoption, runner registration, actual deploy, HTTPS smoke and rollback.
- GitHub CI/publish and anonymous GHCR pulls require an actual pushed commit and public packages;
  their observed status must be recorded separately. This document alone does not certify them.

Reproduce from repository root:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s ops/deploy -p 'test_*.py' -v
node --check ops/deploy/db-operator.mjs
python3 ops/deploy/integration.py --schema-image LOCAL_SCHEMA_OPERATOR_IMAGE
```

Application tests are unchanged; existing CI remains the gate for the exact published source.
See [deployment](deployment.md), [existing demo](demo-deployment.md),
[COD update preservation](demo-cod-update.md) and [local evidence](evidence/github-actions-deploy-local-20261028.json).

Official references: [manual workflows](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow),
[self-hosted runner setup](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners),
[publishing images](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images).
