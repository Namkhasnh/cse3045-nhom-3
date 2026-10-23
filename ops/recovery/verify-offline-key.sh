#!/bin/sh
# User-run only: no key values, paths, tokens or ciphertext are printed/uploaded.
set -eu
umask 077
command -v age >/dev/null
command -v age-keygen >/dev/null
printf 'Original local age identity path (not key text): ' >&2
IFS= read -r hlf_original
printf 'Independent offline copy path (attach/unlock it locally first): ' >&2
IFS= read -r hlf_offline
[ -f "$hlf_original" ] && [ -r "$hlf_original" ] || { echo 'ORIGINAL_NOT_READABLE' >&2; exit 2; }
[ -f "$hlf_offline" ] && [ -r "$hlf_offline" ] || { echo 'OFFLINE_COPY_NOT_READABLE' >&2; exit 2; }
# Reject the same file, a symlink to it or a hard link. Copy custody remains a user attestation.
[ ! "$hlf_original" -ef "$hlf_offline" ] || { echo 'DISTINCT_COPY_REQUIRED' >&2; exit 2; }
hlf_keycheck_dir=$(mktemp -d "${TMPDIR:-/tmp}/hlf-offline-key-check.XXXXXX")
trap 'rm -rf -- "$hlf_keycheck_dir"' EXIT HUP INT TERM
# Encrypt to the ORIGINAL recipient; a different/wrong offline key cannot pass.
hlf_recipient=$(age-keygen -y "$hlf_original")
printf 'HLF synthetic offline key recovery verification v1\n' > "$hlf_keycheck_dir/synthetic.txt"
age -r "$hlf_recipient" -o "$hlf_keycheck_dir/synthetic.age" "$hlf_keycheck_dir/synthetic.txt"
age -d -i "$hlf_offline" -o "$hlf_keycheck_dir/recovered.txt" "$hlf_keycheck_dir/synthetic.age"
cmp -s "$hlf_keycheck_dir/synthetic.txt" "$hlf_keycheck_dir/recovered.txt"
printf 'OFFLINE_COPY_DECRYPT_CMP: PASS\n'
printf 'User must confirm this copy is independently stored and return it to offline custody.\n'
