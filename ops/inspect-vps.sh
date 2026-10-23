#!/bin/sh
# Read-only metadata only. No environment files, process argv, logs, data rows or mutations.
set -eu
profile=${1:-sv26}
case "$profile" in ''|-*|*[!A-Za-z0-9._-]*) echo 'Expected configured SSH profile name' >&2; exit 2;; esac
exec ssh -T -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=10 "$profile" 'sh -s' <<'REMOTE'
set -u
printf 'section=os\n'
if test -r /etc/os-release; then
  sed -n '/^ID=/p; /^VERSION_ID=/p; /^PRETTY_NAME=/p' /etc/os-release
fi
uname -m
printf 'section=resources\n'
getconf _NPROCESSORS_ONLN
free -m
df -Pk /
printf 'section=versions_client_not_database_server\n'
command -v node >/dev/null 2>&1 && node --version
command -v npm >/dev/null 2>&1 && npm --version
command -v mysql >/dev/null 2>&1 && mysql --version
command -v nginx >/dev/null 2>&1 && nginx -v 2>&1
command -v caddy >/dev/null 2>&1 && caddy version
printf 'section=service_status\n'
if command -v systemctl >/dev/null 2>&1; then
  for service in nginx caddy mysql mysqld docker; do
    printf '%s=' "$service"
    systemctl is-active "$service" 2>/dev/null || true
  done
fi
printf 'section=container_images_not_server_sql_proof\n'
if command -v docker >/dev/null 2>&1; then
  docker ps --format '{{.Image}} | {{.Status}}' 2>/dev/null || printf 'NOT_ACCESSIBLE\n'
fi
printf 'section=listen_addresses_no_process_arguments\n'
command -v ss >/dev/null 2>&1 && ss -lnt
printf 'section=sql_server_readonly_no_data_rows\n'
# Uses an existing local socket identity only; never prompts for or reads credentials.
if command -v mysql >/dev/null 2>&1; then
  mysql --no-defaults --connect-timeout=5 --batch --skip-column-names -e 'SELECT VERSION(), @@version_comment, @@default_storage_engine, @@log_bin, @@sync_binlog, @@innodb_flush_log_at_trx_commit;' 2>/dev/null || printf 'NOT_ACCESSIBLE_WITHOUT_CREDENTIALS\n'
fi
REMOTE
