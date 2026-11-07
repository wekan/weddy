#!/usr/bin/env bash
# EVERYTHING: every test of Weddy and its parts, on this computer - never on GitHub
# or Gitea. Runs each stage, keeps going after a failure, and lists them all at
# the end. Logs: log/<datetime>/ (LOG_DIR).
#
#   1. Weddy's own script tests (source assembly, changelog)
#   2. go vet and go test of caddy-wekan-plugin, caddy-ferretdb-plugin,
#      caddy-rclone-plugin and caddy-gitea-plugin, side by side in WEDDY_LOCAL_SRC
#   3. Gitea's own tests, for the Gitea Weddy compiles in (tests/gitea/run.sh)
#   4. a local Weddy for this computer (build.sh local)
#   5. WeKan's browser and API tests against it (tests/wekan/run.sh)
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT/releases/local-env.sh"
LOG_DIR="${LOG_DIR:-$ROOT/log/$(date +%Y-%m-%d_%H-%M-%S)}"; mkdir -p "$LOG_DIR"; export LOG_DIR
failed=(); passed=()
stage() { # <name> <command...>
  local name="$1"; shift
  echo "===== $name"
  if "$@" > "$LOG_DIR/$name.log" 2>&1; then passed+=("$name"); echo "      ok"
  else failed+=("$name"); echo "      FAILED - $LOG_DIR/$name.log"; tail -n 15 "$LOG_DIR/$name.log" | sed 's/^/      /'; fi
  echo "===== $name finished" >> "$LOG_DIR/$name.log"
}
stage scripts bash -c "bash '$ROOT/tests/apply-patches.sh' && python3 -I '$ROOT/tests/changelogShort.test.py'"
for p in caddy-ferretdb-plugin caddy-wekan-plugin caddy-rclone-plugin caddy-gitea-plugin; do
  if [ -d "$WEDDY_LOCAL_SRC/$p" ]; then
    stage "go-$p" bash -c "cd '$WEDDY_LOCAL_SRC/$p' && CGO_ENABLED=0 go vet ./... && CGO_ENABLED=0 go test -count=1 ./..."
  else
    failed+=("go-$p (not in $WEDDY_LOCAL_SRC)")
  fi
done
if [ -x "$ROOT/tests/gitea/run.sh" ]; then stage gitea-tests bash "$ROOT/tests/gitea/run.sh"
else failed+=("gitea-tests (tests/gitea/run.sh missing)"); fi
stage build-local bash "$ROOT/build.sh" local
stage wekan-tests bash "$ROOT/tests/wekan/run.sh"
echo
echo "===== EVERYTHING: ${#passed[@]} passed, ${#failed[@]} failed - logs in $LOG_DIR"
for f in "${failed[@]}"; do echo "  x $f"; done
[ ${#failed[@]} -eq 0 ]
