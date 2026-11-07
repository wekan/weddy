#!/usr/bin/env bash
# Run Gitea's own Go tests against the Gitea that Weddy builds in: the gitea/
# directory of caddy-gitea-plugin, compiled the way xcaddy compiles it into Weddy
# (CGO off, no build tags, assets embedded, the embedded-in-a-host patch).
#
#   tests/gitea/run.sh [go test flags...]      e.g. tests/gitea/run.sh -run TestRepo
#
# 1. The Gitea source gitea/ was copied from - the "Resulting Gitea commit" of
#    caddy-gitea-plugin's gitea/SOURCE.md: an existing checkout at that commit
#    (GITEA_SRC, releases/sync-gitea.sh's SYNC_WORK, or an earlier run's), else
#    made again like sync-gitea.sh makes it: upstream go-gitea/gitea + the
#    recorded wekan/gitea-patches commit + the plugin's dist/gitea/*.patch.
# 2. A copy of caddy-gitea-plugin, and releases/copy-gitea-tests.py copies
#    Gitea's tests, the packages only they need and their fixtures into it. The
#    plugin itself stays free of tests.
# 3. go test, the way Gitea's Makefile runs it with SQLite (modernc, pure Go - the
#    driver the plugin builds with):
#      - unit tests: every package except modelmigration/ (make test-backend);
#      - migration tests: modelmigration/..., one package at a time
#        (make migrations.individual.test), GITEA_TEST_DATABASE=sqlite.
#    Tests listed in tests/gitea/skip.txt are skipped, each with its reason.
#
# Local only: needs Go, git and Python 3, and the network only when step 1 has to
# clone. Nothing runs on GitHub or Gitea CI.
#
# Environment:
#   CADDY_GITEA_PLUGIN  caddy-gitea-plugin checkout (default: ../caddy-gitea-plugin)
#   GITEA_SRC           a Gitea checkout at the resulting commit to use
#   GITEA_PATCHES       wekan/gitea-patches checkout or URL (default: ../gitea-patches,
#                       else its GitHub URL)
#   UPSTREAM_URL        upstream Gitea to clone (default: ../gitea when it has the
#                       upstream commit, else GitHub)
#   GITEA_TESTS_WORK    work directory, kept between runs (default: $TMPDIR/weddy-gitea-tests)
#   GITEA_TESTS_ONLY    unit | migration - run only one of the two
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
WEDDY="$(cd "$HERE/../.." && pwd)"
PLUGIN="$(cd "${CADDY_GITEA_PLUGIN:-$WEDDY/../caddy-gitea-plugin}" && pwd)"
export TMPDIR="${TMPDIR:-/tmp}"
WORK="${GITEA_TESTS_WORK:-$TMPDIR/weddy-gitea-tests}"
mkdir -p "$WORK"
WORK="$(cd "$WORK" && pwd)"
SOURCE_MD="$PLUGIN/gitea/SOURCE.md"
[ -f "$SOURCE_MD" ] || { echo "$SOURCE_MD is missing" >&2; exit 1; }

GITEA_COMMIT="$(sed -n 's/^| Resulting Gitea commit | `\([0-9a-f]*\)` |$/\1/p' "$SOURCE_MD")"
UPSTREAM_COMMIT="$(sed -n 's/^| Upstream |.* commit \[`\([0-9a-f]*\)`\].*/\1/p' "$SOURCE_MD")"
GP_COMMIT="$(sed -n 's/^| wekan\/gitea-patches | commit `\([0-9a-f]*\)` |$/\1/p' "$SOURCE_MD")"
[ -n "$GITEA_COMMIT" ] && [ -n "$UPSTREAM_COMMIT" ] && [ -n "$GP_COMMIT" ] ||
  { echo "$SOURCE_MD does not name the commits gitea/ was made from" >&2; exit 1; }

at_commit() { [ "$(git -C "$1" rev-parse HEAD 2>/dev/null)" = "$GITEA_COMMIT" ]; }

echo "== 1. Gitea source at ${GITEA_COMMIT:0:10}"
SRC=""
if [ -n "${GITEA_SRC:-}" ]; then
  at_commit "$GITEA_SRC" || { echo "GITEA_SRC=$GITEA_SRC is not at $GITEA_COMMIT" >&2; exit 1; }
  SRC="$(cd "$GITEA_SRC" && pwd)"
else
  for c in ${SYNC_WORK:+"$SYNC_WORK/gitea"} "$TMPDIR/caddy-gitea-sync/gitea" "$WORK/gitea"; do
    if at_commit "$c"; then SRC="$(cd "$c" && pwd)"; break; fi
  done
fi
if [ -z "$SRC" ]; then
  rm -rf "$WORK/gitea" "$WORK/gitea-patches"
  GP="${GITEA_PATCHES:-}"
  if [ -z "$GP" ]; then
    if [ -d "$PLUGIN/../gitea-patches/releases" ]; then GP="$PLUGIN/../gitea-patches"
    else GP=https://github.com/wekan/gitea-patches.git; fi
  fi
  # gitea-patches at the commit gitea/ was made from, not at its newest.
  git clone --quiet "$GP" "$WORK/gitea-patches"
  git -C "$WORK/gitea-patches" checkout --quiet "$GP_COMMIT"
  if [ -z "${UPSTREAM_URL:-}" ] && git -C "$PLUGIN/../gitea" cat-file -e "${UPSTREAM_COMMIT}^{commit}" 2>/dev/null; then
    export UPSTREAM_URL="$(cd "$PLUGIN/../gitea" && pwd)"
  fi
  bash "$WORK/gitea-patches/releases/apply-patches.sh" "$WORK/gitea-patches" "$WORK/gitea" "$UPSTREAM_COMMIT"
  (
    cd "$WORK/gitea"
    export GIT_COMMITTER_NAME="Lauri Ojansivu" GIT_COMMITTER_EMAIL="x@xet7.org"
    export GIT_COMMITTER_DATE="$(git log -1 --format=%cI "$UPSTREAM_COMMIT")"
    for p in "$PLUGIN"/dist/gitea/*.patch; do
      [ -e "$p" ] || continue
      git am --quiet --3way --committer-date-is-author-date "$p"
    done
  )
  at_commit "$WORK/gitea" || {
    echo "rebuilt Gitea is $(git -C "$WORK/gitea" rev-parse HEAD), not $GITEA_COMMIT: the source differs from gitea/" >&2
    exit 1
  }
  SRC="$WORK/gitea"
fi
echo "Gitea source: $SRC"

echo "== 2. caddy-gitea-plugin copy with Gitea's tests"
COPY="$WORK/plugin"
rm -rf "$COPY"
mkdir -p "$COPY"
tar -C "$PLUGIN" -c --exclude=./.git --exclude=__pycache__ . | tar -C "$COPY" -x
python3 -I "$PLUGIN/releases/copy-gitea-tests.py" "$SRC" "$COPY"
# Gitea's tests run in a git checkout of Gitea, and some run git there (git grep
# in modules/git/gitcmd): the copy is a repository of its own, its files tracked,
# rather than an untracked corner of whatever repository holds $TMPDIR.
git -C "$COPY" init --quiet
git -C "$COPY" add -A

echo "== 3. go test"
cd "$COPY"
export CGO_ENABLED=0
unset GITEA_TEST_CONF GITEA_TEST_ROOT
LOG="$WORK/log"
rm -rf "$LOG"
mkdir -p "$LOG"
MOD="github.com/wekan/caddy-gitea-plugin/gitea"

# skip.txt: "<package under gitea/> <TestName | *>  # reason". * skips the package.
declare -A SKIP=()
SKIP_PKGS=" "
while read -r pkg test _; do
  case "$pkg" in ''|'#'*) continue ;; esac
  if [ "$test" = "*" ]; then SKIP_PKGS+="$MOD/$pkg "
  else SKIP["$MOD/$pkg"]="${SKIP["$MOD/$pkg"]:+${SKIP["$MOD/$pkg"]}|}$test"; fi
done < "$HERE/skip.txt"

# go test of a package list: those with skipped tests one by one with -skip, the
# rest together. $1 = log name; then go test flags; then -- and the packages.
run_tests() {
  local name="$1"; shift
  local flags=() pkgs=() plain=() n=0
  while [ "$1" != "--" ]; do flags+=("$1"); shift; done; shift
  for p in "$@"; do
    case "$SKIP_PKGS" in *" $p "*) echo "skipped package ${p#"$MOD"/} (skip.txt)"; continue ;; esac
    if [ -n "${SKIP[$p]:-}" ]; then
      n=$((n + 1))
      go test -count=1 -json "${flags[@]}" -skip "^(${SKIP[$p]})\$" "$p" > "$LOG/$name-skip$n.json" 2>&1 || true
    else plain+=("$p"); fi
  done
  [ "${#plain[@]}" -eq 0 ] || go test -count=1 -json "${flags[@]}" "${plain[@]}" > "$LOG/$name.json" 2>&1 || true
}

mapfile -t ALL < <(go list ./gitea/...)
UNIT=() MIGRATION=()
for p in "${ALL[@]}"; do
  case "$p" in "$MOD"/modelmigration|"$MOD"/modelmigration/*) MIGRATION+=("$p") ;; *) UNIT+=("$p") ;; esac
done
ONLY="${GITEA_TESTS_ONLY:-}"
if [ "$ONLY" != migration ]; then
  echo "unit tests: ${#UNIT[@]} packages"
  run_tests unit "$@" -- "${UNIT[@]}"
fi
if [ "$ONLY" != unit ]; then
  echo "migration tests: ${#MIGRATION[@]} packages"
  GITEA_TEST_DATABASE=sqlite run_tests migration -p 1 "$@" -- "${MIGRATION[@]}"
fi

echo "== results (logs: $LOG)"
echo "skip.txt: $(grep -cv '^[[:space:]]*\(#\|$\)' "$HERE/skip.txt" || true) entries not run (go test does not count them)"
python3 -I "$HERE/summary.py" "$LOG"/*.json
