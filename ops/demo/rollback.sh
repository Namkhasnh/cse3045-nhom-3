#!/bin/sh
set -eu
hlf_release_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
python3 "$hlf_release_dir/switch-nginx.py" --rollback "$hlf_release_dir"
for hlf_name in hlf-demo-api hlf-demo-storage; do
  hlf_label=$(docker inspect --format '{{index .Config.Labels "hlf.demo.release"}}' "$hlf_name")
  hlf_expected=$(node -e 'console.log(require(process.argv[1]).id)' "$hlf_release_dir/release.json")
  [ "$hlf_label" = "$hlf_expected" ] || { echo 'Unowned container; stop refused'; exit 2; }
  docker stop "$hlf_name" >/dev/null
done
echo 'PASS: previous website restored; demo DB and all data retained.'
