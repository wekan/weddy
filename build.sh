#!/usr/bin/env bash
# Weddy menu.
#
#   ./build.sh source [caddy-ref]   assemble the source into ./src, and zip it into ./out
#   ./build.sh build                build this computer's platform from ./src into ./out
#   ./build.sh test                 the offline tests
#   ./build.sh release-all [ref]    run Release All on GitHub
#   ./build.sh release-all-missing [tag]
set -euo pipefail
root="$(cd "$(dirname "$0")" && pwd)"
cd "$root"
command="${1:-}"
if [ -z "$command" ]; then
  printf '1) Assemble the source into ./src and zip it into ./out
2) Build this computer'"'"'s platform from ./src
3) Run the tests
4) Release All (GitHub Actions)
5) Release All Missing (GitHub Actions)
0) Exit
Selection: '
  read -r choice
  case "$choice" in
    1) command=source;; 2) command=build;; 3) command=test;;
    4) command=release-all;; 5) command=release-all-missing;; 0) exit 0;;
    *) echo 'Invalid selection' >&2; exit 2;;
  esac
else
  shift
fi
case "$command" in
  source)
    rm -rf src out
    bash releases/apply-patches.sh . src "${1:-}"
    python3 -I releases/source-zips.py src out ;;
  build)
    WEDDY_PLATFORMS="$(go env GOOS)/$(go env GOARCH)" bash releases/build-weddy.sh src out local ;;
  test)
    bash tests/apply-patches.sh
    python3 -I tests/changelogShort.test.py ;;
  release-all)
    exec gh workflow run release-all.yml -R wekan/weddy ${1:+-f ref="$1"} ;;
  release-all-missing)
    exec gh workflow run release-all-missing.yml -R wekan/weddy ${1:+-f tag="$1"} ;;
  *) echo "Usage: $0 [source [ref]|build|test|release-all [ref]|release-all-missing [tag]]" >&2; exit 2 ;;
esac
