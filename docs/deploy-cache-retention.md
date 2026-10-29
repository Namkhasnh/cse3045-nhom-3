# Demo deploy image footprint and cache retention

Scope: the existing academic demo deployment, not production/P35 acceptance. Parent runbook:
[GitHub Actions deployment](github-actions-deploy.md). The three-GiB free-space guard stays
in place before/after pulls and before maintenance; it is disk space, not RAM.

## Image changes

- Runtime uses the pinned Node24 Debian slim base directly; the npm build toolchain and its
  install/cache layers do not enter either deploy image.
- Backend installs a fresh locked production dependency tree with dev/peer dependencies omitted.
  Its install manifest excludes dev dependencies before resolving the existing lock; this avoids
  Prisma's optional CLI/compiler peers surviving a prune of the build tree. Generated application
  output still comes from the normal Prisma/Nest build. Native sharp and real runtime imports
  are checked inside the resulting Linux/amd64 image.
- Schema tooling is a separate minimal install of the existing pinned Prisma, mariadb and dotenv
  versions, with its own Prisma config/schema/migrations. No application source/dist, Nest CLI,
  test suite or build output is copied into it. Prisma's engine is rebuilt and verified there.
- No API, SQL migration, MySQL version, runtime key or package version is changed.

Local Docker reports backend **1.01GB →576MB** and schema **1.49GB →744MB** on the same
engine. Shared layers mean these are image figures, not guaranteed freed disk bytes. Actual VPS
space is measured after upgrading; existing published images remain immutable.

## Automatic retention

`cache.py` runs under the same exclusive operation lock as deployment. Server fingerprint checks
run first; drift cannot authorize cache mutation. The protected set includes:

1. Current and immediate predecessor backend/frontend image digests and the previous API container.
2. Every image referenced by any container, including stopped/manual/legacy containers.
3. Every failed/unfinished release's manifest images and recovery containers/state.
4. All images for the candidate between preflight and worker, so the worker reuses preflight pulls.

After a successful update, an older stopped `hlf-before-SHA` container may be retired only when
its recorded ID and full config fingerprint match, it is not the current predecessor, and no
unresolved release needs investigation. It is removed without force or volume deletion. This
bounds controller-created rollback containers; existing manual/legacy containers remain untouched.

Only image digests in validated root-held release/cache manifests may be evicted. The operator
checks the exact registry config hash chain/revision and local RepoDigests, then rechecks all
container references immediately before a non-forced digest-reference removal. Registry failure,
unknown drift or changed references retains the image. Old preflight-only caches are discovered
from full-SHA release tags and adopted only after successful source-CI/branch/manifest validation.

Schema images are disposable tooling and are not pinned for every historical release. Their
immutable digests and migration checksums remain recorded; later operations can pull them again.
Backups, SQL, keys, volumes, media, frontend releases/old assets and unrelated Docker resources
are never deleted by cache cleanup. The latest sanitized receipt is
`/var/lib/hlf-deploy/cache-cleanup.json`; Actions logs show removal counts and actual free bytes.

Housekeeping failure after successful application smoke produces a cache warning and preserves
application PASS. The workflow waits until housekeeping finishes; an interrupted service still
needs inspection. Cache cleanup cannot bypass the three-GiB gate or a migration review.

This is bounded image retention, not unlimited disk capacity. Backups and historical assets grow
by design and still need an explicitly reviewed retention/offsite policy. Unmanaged legacy
containers also keep their images. If safe cleanup cannot free enough space, preflight stops
before maintenance and the operator must inspect storage or enlarge the disk.

## One-time upgrade on the existing VPS

A root-owned controller does not update itself from a public workflow. Install this change once
in the already authenticated student SSH session. Use the exact reviewed source commit supplied
with this change, not a mutable branch or an application SHA from an unrelated release:

```sh
HLF_SHA=REPLACE_WITH_FULL_REVIEWED_INFRASTRUCTURE_SHA
HLF_SETUP=$(mktemp -d /tmp/hlf-cache-upgrade.XXXXXX) &&
curl --fail --location --proto '=https' --tlsv1.2 \
  "https://codeload.github.com/Namkhasnh/cse3045-nhom-3/tar.gz/$HLF_SHA" \
  -o "$HLF_SETUP/source.tar.gz" &&
tar -xzf "$HLF_SETUP/source.tar.gz" -C "$HLF_SETUP" &&
cd "$HLF_SETUP/cse3045-nhom-3-$HLF_SHA" &&
sudo python3 ops/deploy/upgrade.py
```

The upgrader takes both deployment locks, rejects an active service, verifies exact known hashes
of the original installed bundle and validates every new source hash against `tooling-sha256.json`.
It replaces only the fixed controller files with root-owned atomic file writes. A write failure
restores earlier files; the previous code is also saved root-only under `/etc/hlf-deploy`.
It does not run cleanup, migrate, restart containers, change nginx, alter sudoers or register a
runner. Unknown installed changes stop for review. A first-time installation uses `install.py`
and includes the new cache module directly.

After PASS, use the existing private workflow normally. The next preflight cleans eligible cache.
Compact images are published for new successful `hw1` builds; installing the controller alone
cannot shrink previously published immutable images. A new application migration still needs
its own reviewed backup/restore/rehearsal and grant/compatibility profile.

## Executed verification

Local evidence is recorded in [the sanitized receipt](evidence/deploy-cache-local-20261029.json).
It separates automated safety regressions, real Linux/amd64 image smoke and disposable real
MySQL9.2.0 backup/restore/migration checks from the separately reported VPS controller upgrade/cache results. These checks
do not mutate retained local/VPS databases and do not certify new business migrations.

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s ops/deploy -p 'test_*.py' -v
python3 ops/deploy/check_images.py --backend LOCAL_BACKEND_IMAGE --schema LOCAL_SCHEMA_IMAGE
python3 ops/deploy/integration.py --schema-image LOCAL_SCHEMA_IMAGE
```

## VPS receipt — October30

The user reported PASS for the final controller upgrade, then cache PASS with three images
removed and zero containers retired. Free space was5,197,791,232bytes immediately after cleanup
and `df` showed4.3G after candidate pulls. Preflight correctly stopped at the unreviewed personal
profile migration, before maintenance/application/schema changes. The source CI/publish for
`7e4ff90...` passed all five jobs. [Profile review](deploy-profile-review.md) handles that separate gate.
