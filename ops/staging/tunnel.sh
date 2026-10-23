#!/bin/sh
# Direct, verified VPS SSH destination/alias only; session-selector gateways are unsupported.
set -eu
if [ "$#" -ne 1 ]; then
  echo 'Usage: sh ops/staging/tunnel.sh verified-direct-ssh-alias' >&2
  echo 'Session-selector gateways and remote commands are unsupported.' >&2
  exit 2
fi
case "$1" in
  -*|*[!a-zA-Z0-9_.@:-]*) echo 'A single verified direct SSH destination/alias is required.' >&2; exit 2 ;;
esac
# ssh -G resolves local configuration only; it makes no network connection.
host=$(ssh -G "$1" 2>/dev/null | awk '$1 == "hostname" {print $2; exit}')
if [ -z "$host" ] || [ "$host" = ssh-lab.bcse-vju.com ]; then
  echo 'Cannot tunnel via this session-selector gateway; obtain its supported per-VPS forwarding route.' >&2
  exit 2
fi
exec ssh -N -T -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
  -L 127.0.0.1:14443:127.0.0.1:14443 "$1"
