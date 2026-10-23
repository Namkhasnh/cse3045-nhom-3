#!/bin/sh
# Read-only: no install, sudo, Docker writes, config reads, data queries or credential prompts.
set -u
blocked=0
printf 'scope=isolated_synthetic_staging_preflight\n'
if [ "$(uname -s)" != Linux ]; then printf 'BLOCKED: expected Linux VPS\n'; exit 2; fi
printf 'architecture=%s\n' "$(uname -m)"
if [ "$(uname -m)" != x86_64 ]; then printf 'BLOCKED: amd64 candidate requires x86_64\n'; blocked=1; fi
available=$(awk '/^MemAvailable:/ {printf "%.0f", $2/1024}' /proc/meminfo)
printf 'memory_available_mib=%s\n' "$available"
case "$available" in ''|*[!0-9]*) blocked=1;; *) if [ "$available" -lt 1344 ]; then printf 'BLOCKED: below proposed960MiB cap plus384MiB reserve\n'; blocked=1; fi;; esac
printf 'section=root_disk_metadata\n'
df -Pk /
if command -v ss >/dev/null 2>&1; then
  for port in 14300 14443; do
    if [ -n "$(ss -H -lnt "sport = :$port")" ]; then printf 'BLOCKED: proposed_port_%s_in_use\n' "$port"; blocked=1
    else printf 'proposed_port_%s=currently_unbound\n' "$port"; fi
  done
else printf 'BLOCKED: listener tool unavailable\n'; blocked=1; fi
if command -v docker >/dev/null 2>&1 && docker info --format '{{.OSType}}/{{.Architecture}}' 2>/dev/null; then
  printf 'section=compose_version\n'
  docker compose version --short 2>/dev/null || { printf 'BLOCKED: compose unavailable\n'; blocked=1; }
  existing=$(docker ps -a --filter label=com.docker.compose.project=hlf-staging --format '{{.Names}}')
  volumes=$(docker volume ls --filter label=com.docker.compose.project=hlf-staging --format '{{.Name}}')
  if [ -n "$existing$volumes" ]; then printf 'BLOCKED: staging project already has resources; inspect before reuse\n'; blocked=1; fi
  printf 'section=existing_container_metadata\n'
  docker ps --format '{{.Names}} | {{.Image}} | {{.Ports}}'
  docker stats --no-stream --format '{{.Name}} | {{.MemUsage}} | {{.CPUPerc}}'
else printf 'BLOCKED: Docker inaccessible to this session; no permissions changed\n'; blocked=1; fi
if [ "$blocked" -ne 0 ]; then printf 'result=BLOCKED\n'; exit 2; fi
printf 'result=READONLY_PREFLIGHT_ONLY; image sizes/origin/services/approval still required\n'
