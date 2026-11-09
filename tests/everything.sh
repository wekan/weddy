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
#   6. WeKan's tests that need the server started with other mail settings
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
stage scripts bash -c "bash '$ROOT/tests/apply-patches.sh' && python3 -I '$ROOT/tests/syncFromWekan.test.py' && python3 -I '$ROOT/tests/changelogShort.test.py'"
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
# WeKan's tests that need the server started otherwise skip themselves in the
# run above; each gets a Weddy of its own here: the SMTP phase limits, the
# total SMTP deadline, and e-mail receipt retention.
spec=tests/playwright/specs/email-recovery-controls.e2e.js
stage wekan-mail-settings bash -c "
  export WEDDY_WEKAN_SPECS=all
  MAIL_GREETING_TIMEOUT_MS=1000 MAIL_SOCKET_TIMEOUT_MS=1000 MAIL_TOTAL_TIMEOUT_MS=30000 WEKAN_TEST_MAIL_TIMEOUTS=1000 \\
    LOG_DIR='$LOG_DIR/mail-phase-timeouts' bash '$ROOT/tests/wekan/run.sh' '' $spec -g 'greeting timeout|idle timeout' &&
  MAIL_TOTAL_TIMEOUT_MS=1000 WEKAN_TEST_MAIL_TOTAL_TIMEOUT=1000 \\
    LOG_DIR='$LOG_DIR/mail-total-timeout' bash '$ROOT/tests/wekan/run.sh' '' $spec -g 'total timeout|slow SMTP' &&
  EMAIL_RECEIPT_SWEEP_INTERVAL_MS=1000 WEKAN_TEST_EMAIL_RETENTION=1 \\
    LOG_DIR='$LOG_DIR/mail-receipt-retention' bash '$ROOT/tests/wekan/run.sh' '' $spec -g 'compacted cancellation'"
echo
echo "===== EVERYTHING: ${#passed[@]} passed, ${#failed[@]} failed - logs in $LOG_DIR"
for f in "${failed[@]}"; do echo "  x $f"; done
[ ${#failed[@]} -eq 0 ]
