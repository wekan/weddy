#!/usr/bin/env bash
# Weddy menu.
#
#   ./build.sh source [caddy-ref]   assemble the source into ./src, and zip it into ./out
#   ./build.sh build                build this computer's platform from ./src into ./out
#   ./build.sh local [all]          build from the repositories beside this one (WeKan's
#                                   .tools/w/), uncommitted changes included, into
#                                   ./out-local: this computer's platform, or all
#   ./build.sh test                 the offline script tests
#   ./build.sh everything           EVERYTHING: every test of Weddy and its parts, and
#                                   WeKan's tests against a local Weddy - locally only
#   ./build.sh sync-wekan-tests [wekan-dir]   copy WeKan's tests into tests/wekan
#   ./build.sh release-all [ref]    run Release All on GitHub
#   ./build.sh release-all-missing [tag]
set -euo pipefail
root="$(cd "$(dirname "$0")" && pwd)"
cd "$root"
command="${1:-}"
if [ -z "$command" ]; then
  printf '1) Assemble the source into ./src and zip it into ./out
2) Build this computer'"'"'s platform from ./src
3) Build locally for this computer, from the repositories beside Weddy
4) Build locally for all platforms, from the repositories beside Weddy
5) Run the script tests
6) Run EVERYTHING tests (locally only)
7) Copy WeKan'"'"'s tests into tests/wekan
8) Release All (GitHub Actions)
9) Release All Missing (GitHub Actions)
0) Exit
Selection: '
  read -r choice
  case "$choice" in
    1) command=source;; 2) command=build;; 3) command=local;; 4) command=local; set -- local all;;
    5) command=test;; 6) command=everything;; 7) command=sync-wekan-tests;;
    8) command=release-all;; 9) command=release-all-missing;; 0) exit 0;;
    *) echo 'Invalid selection' >&2; exit 2;;
  esac
  [ "$command" = local ] && [ "${1:-}" = local ] && shift || true
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
  local)
    source releases/local-env.sh
    if [ "${1:-}" != all ]; then export WEDDY_PLATFORMS="$(go env GOOS)/$(go env GOARCH)"; fi
    WEDDY_PLATFORMS_FILE="$root/releases/platforms.txt" \
      bash releases/build-weddy.sh "$WEDDY_LOCAL_SRC" out-local "local-$(git rev-parse --short HEAD)"
    [ ! -s out-local/failed.txt ] ;;
  test)
    bash tests/apply-patches.sh
    python3 -I tests/syncFromWekan.test.py
    python3 -I tests/changelogShort.test.py ;;
  everything)
    exec bash tests/everything.sh ;;
  sync-wekan-tests)
    python3 -I tests/wekan/sync-from-wekan.py "${1:-$root/../../..}" ;;
  release-all)
    exec gh workflow run release-all.yml -R wekan/weddy ${1:+-f ref="$1"} ;;
  release-all-missing)
    exec gh workflow run release-all-missing.yml -R wekan/weddy ${1:+-f tag="$1"} ;;
  *) echo "Usage: $0 [source [ref]|build|local [all]|test|everything|sync-wekan-tests [wekan-dir]|release-all [ref]|release-all-missing [tag]]" >&2; exit 2 ;;
esac
