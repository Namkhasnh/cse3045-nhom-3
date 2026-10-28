# GitHub Actions demo deployment

Status: implementation and verification evidence below. This is the existing academic demo,
not P35 or commercial V1.0 acceptance. The source repository stays public. The runner belongs
only to [Namkhasnh/hlf-deploy](https://github.com/Namkhasnh/hlf-deploy), a separate private repository.
The public repository has no self-hosted jobs. Deployment-tool CI also runs the disposable real
MySQL recovery rehearsal before publishing is allowed.

**Executed October28:** [final deploy](https://github.com/Namkhasnh/hlf-deploy/actions/runs/40663014113)
PASS for `a0056b586c87a5e783993869300f9b37dd1356a3`;
[live application rollback](https://github.com/Namkhasnh/hlf-deploy/actions/runs/40661830693) PASS.
The rollback retained the expanded schema and data; the final release is running again.
See [sanitized VPS evidence](evidence/github-actions-deploy-vps-20261028.json).

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

After the **first successful publish**, confirm all four packages allow anonymous pulls. If a
package is private, open it under your GitHub profile → Package settings → Change visibility →
**Public** before VPS preflight. A private package returns a pull
failure; no long-lived registry token is installed as a workaround.

Platform and source labels are read from registry config through the verified SHA256 chain
from the pinned manifest/index. This also supports Docker image stores that return empty
platform/config fields when inspecting a digest reference; the validation is never skipped.

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
```

Wait until the prompt changes to `hlf-runner@...`, then run these commands in that shell:

```sh
cd /opt/hlf-actions-runner
# Run GitHub's official download, checksum and extraction commands here.
./config.sh --url https://github.com/Namkhasnh/hlf-deploy \
  --name hlf-demo-vps --labels hlf-demo --work _work
# Enter the short-lived registration token at the interactive prompt.
```

If the official runner reports missing native dependencies, return to `student` and run
`sudo /opt/hlf-actions-runner/bin/installdependencies.sh`, then re-enter the runner account.
Do not give `hlf-runner` general sudo permissions.

After successful registration, return to `student` with this command:

```sh
exit
```

At the `student@...` prompt, install/start the service using root; the runner directory is
intentionally mode0700, so an ordinary `cd` into it is not required:

```sh
sudo bash -c 'cd /opt/hlf-actions-runner && ./svc.sh install hlf-runner && ./svc.sh start && ./svc.sh status'
id hlf-runner
```

Confirm GitHub shows **Idle** and label `hlf-demo`. The account must not belong to `docker`,
`sudo`, `root`, `lxd` or `disk`. Its only passwordless privileged command is the fixed
`/usr/local/sbin/hlf-deploy-request` entrypoint, which accepts four operations and a full SHA.
An empty environment, Python isolated mode and root-owned module paths prevent runner-controlled
proxy/trust-store/import injection.
The runner can request deployment of trusted published code, so protect private-repo write access.

## 4. Daily use

1. Commit the intended application changes and push/merge into `hw1`. Uncommitted changes are excluded.
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

The VPS has19GiB total disk. Preflight requires at least3GiB free **after image pulls**;
this is a real capacity gate, not a deployment failure to bypass by rerunning. No automatic image
or backup pruning runs. On October28, two unused legacy schema images were removed only after
matching their exact IDs, checking all running/stopped container references and verifying the
original recovery archives against their manifests. Archives and all referenced API images
were retained. After the live rollback, only that rolled-back release's unreferenced image cache
was removed after verifying immutable GHCR availability; backups/state/static files remained.

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
  "rollback_compatible": false,
  "rollback_checks": []
}
```

The maps must include the exact complete applied/pending history. Table lists describe permitted
DDL changes only: **every original business column and row must remain equal**, and new tables
must be empty. This first implementation intentionally rejects data-transforming migrations;
they need separately reviewed preservation assertions and tooling. Grants are explicit reviewed
GRANT statements for the actual runtime identity; missing grants are never invented.

Set `rollback_compatible` true only after reviewing old-reader behavior against all new facts.
For data-dependent compatibility, retain false and use a separately reviewed forward repair.
Alternatively supply reviewed scalar SELECT statements in `rollback_checks`: after freezing
writers every check must return exactly zero before any candidate container is removed.
For code-only releases with identical migration history and no review, compatibility defaults
to true under the repository's unchanged application-contract requirement. A root-installed
review with empty pending can explicitly disable rollback or apply reviewed narrow grants.

The observed first VPS release has33completed migrations and only
`20261025020000_restaurant_avatar` pending. Its reviewed hash is
`9579ca1f196c195f8eb051c69b5455c470fae3c2693c585363fa600a5e021198`.
It adds a nullable restaurant column and composite FK, preserving all old columns/rows.
After installation, create the root-only review from the live runtime identity:

```sh
sudo python3 ops/deploy/review_avatar.py FULL_SUCCESSFUL_CI_SHA
```

This helper refuses other SQL/checksums/pending migrations or unexpected runtime identities.
It prepares only an exact avatar-column UPDATE grant; no grant or migration is applied yet.
Rollback is allowed only while **no restaurant references an avatar**, checked after stopping
API writers, because old image-cleanup code does not understand avatar references. Every first
release requires a compatibility review even if its schema was already adopted.

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

## 6. Executed verification and limits

- PASS 27 local deployment safety unit tests and actionlint1.7.12 workflow validation.
- PASS disposable MySQL9.2.0 SQL/schema/row and object/vault restore, reviewed expansion rehearsal,
  source isolation, exact BigInt/signed DECIMAL history, rollback, FK/CHECK rejection and deliberate
  row-drift rejection. This uses the newly built hw1 schema-tool image with synthetic migration files.
- PASS Linux/amd64 builds of all three application/tool targets from a clean hw1 checkout;
  frontend extraction contains index/assets and excludes container runtime files and environment files.
- PASS source CI/publish for `cd52b39cde29ce131847b8dd1886d8d277f757a0`; local anonymous
  pulls verified source/branch/CI and all image config hash chains/platform/revision/digests.
- USER-REPORTED VPS read-only inventory: expected containers/volumes, MySQL9.2.0,33completed
  migrations,4.3GiBfree. Operator re-reads checksums before any mutation.
- PASS disposable runtime grant rehearsal using synthetic passwords and positive/negative
  column-write checks; no production password is copied into the rehearsal DB.
- PASS user-reported SSH installation, private runner registration/service start and reviewed
  first avatar expansion. GitHub deployment completed protected backup/real-data restore/
  migration rehearsal and forward application; old API/data/keys were retained.
- PASS live application rollback of `cd52b39...`, followed by final deploy of `a0056b5...`.
  The avatar-null guard passed; no old dump or schema rollback was applied.
- PASS independent public HTTPS after both deploys and rollback: release HTML after only recognized
  Cloudflare normalization, exact JS/CSS SHA256, catalog200and anonymous-auth401.
- PASS Chrome accessibility observation of the deployed public homepage: two restaurants and
  six dishes. Authenticated buyer/owner/Admin journeys and real order/payment mutations: NOT RUN.
- Scheduled encrypted offsite backup, pilot/load acceptance and commercial release: NOT CLAIMED.

The first adoption attempt stopped before creating the runner or changing the application:
a Python function/module name collision broke loopback HTTP checks, and Cloudflare inserted a
per-request JS-detection bootstrap into public HTML. The client import is now explicit. Public
HTML comparison removes only that recognizable inline bootstrap; all remaining HTML bytes and
all local/public JS/CSS bytes must still match exactly. Unrecognized changes/stale assets fail.

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
