#!/usr/bin/env bash
# Build Weddy with xcaddy from the source apply-patches.sh assembled (or the content
# of weddy-source-without-history.zip): Caddy from ./caddy, with the Gitea, WeKan and
# rclone plugins from ./caddy-gitea-plugin, ./caddy-wekan-plugin and
# ./caddy-rclone-plugin.
#
#   build-weddy.sh <source-dir> <out-dir> <version> [group]
#
#   group   linux, windows, darwin, freebsd, openbsd or netbsd: only those
#           platforms of releases/platforms.txt; empty = all of them
#
# Writes <out-dir>/weddy-<version>-<os>-<arch>[.exe], an .xz of each and a .sha256 of
# every file, and <out-dir>/failed.txt naming platforms that did not compile.
# WEDDY_PLATFORMS, space-separated, replaces the platform list (a local build of one).
# XCADDY is the xcaddy program (default: xcaddy from PATH, else `go run` of the
# pinned version below).
set -euo pipefail

SRC="$(cd "${1:?usage: build-weddy.sh <source-dir> <out-dir> <version> [group]}" && pwd)"
OUT="${2:?}"; VERSION="${3:?}"; GROUP="${4:-}"
XCADDY_VERSION=v0.4.7
mkdir -p "$OUT"; OUT="$(cd "$OUT" && pwd)"
for d in caddy caddy-gitea-plugin caddy-wekan-plugin caddy-rclone-plugin weddy; do
  [ -d "$SRC/$d" ] || { echo "build-weddy.sh: $SRC/$d is missing" >&2; exit 1; }
done
if [ -z "${XCADDY:-}" ]; then
  if command -v xcaddy >/dev/null; then XCADDY=xcaddy
  else XCADDY="go run github.com/caddyserver/xcaddy/cmd/xcaddy@$XCADDY_VERSION"; fi
fi
# The version Weddy reports (`weddy version`), and xcaddy's own defaults kept: no
# debug symbols, no build paths, and its storage-module tags.
export XCADDY_GO_BUILD_FLAGS="-trimpath -ldflags='-w -s -X github.com/caddyserver/caddy/v2.CustomVersion=Weddy-$VERSION' -tags=nobadger,nomysql,nopgx"
export CGO_ENABLED=0 GOTELEMETRY=off

: > "$OUT/failed.txt"
platforms() {
  if [ -n "${WEDDY_PLATFORMS:-}" ]; then printf '%s\n' $WEDDY_PLATFORMS
  else grep -v '^\s*#' "$SRC/weddy/releases/platforms.txt" | grep .; fi
}
platforms | while read -r p; do
  os="${p%%/*}"; arch="${p##*/}"
  [ -z "$GROUP" ] || [ "$os" = "$GROUP" ] || continue
  goarch="$arch"; goarm=""
  case "$arch" in arm-*) goarch=arm; goarm="${arch#arm-}" ;; esac
  name="weddy-$VERSION-$os-$arch"; [ "$os" = windows ] && name="$name.exe"
  echo "== $p"
  if GOOS="$os" GOARCH="$goarch" GOARM="$goarm" $XCADDY build --output "$OUT/$name" \
      --with "github.com/caddyserver/caddy/v2=$SRC/caddy" \
      --with "github.com/wekan/caddy-gitea-plugin=$SRC/caddy-gitea-plugin" \
      --with "github.com/wekan/caddy-wekan-plugin=$SRC/caddy-wekan-plugin" \
      --with "github.com/wekan/caddy-rclone-plugin=$SRC/caddy-rclone-plugin" > "$OUT/$name.log" 2>&1; then
    xz -k -9 -T0 "$OUT/$name"
    rm -f "$OUT/$name.log"
  else
    echo "  skipped $p (does not compile):"; tail -n 3 "$OUT/$name.log" | sed 's/^/    /'
    echo "$p" >> "$OUT/failed.txt"
    rm -f "$OUT/$name" "$OUT/$name.log"
  fi
done
( cd "$OUT" && for f in weddy-*; do case "$f" in *.sha256) ;; *) sha256sum "$f" > "$f.sha256" ;; esac; done ) 2>/dev/null || true
echo "Built: $(ls "$OUT" | grep -vc '\.sha256$\|\.xz$\|failed.txt') binaries; not compiled: $(wc -l < "$OUT/failed.txt")."
