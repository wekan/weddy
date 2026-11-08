#!/usr/bin/env bash
# Build Weddy with xcaddy from the source apply-patches.sh assembled (or the content
# of weddy-source-without-history.zip): Caddy from ./caddy, with the Gitea, WeKan,
# rclone and FerretDB plugins from ./caddy-gitea-plugin, ./caddy-wekan-plugin,
# ./caddy-rclone-plugin and ./caddy-ferretdb-plugin, and wekan/FerretDB from
# ./FerretDB.
#
# A local build (build.sh local) gives the directory the plugins are checked out in
# side by side - WeKan's .tools/w/ - with their uncommitted changes. Without
# ./caddy there, Caddy is CADDY_REF from the Go module proxy - default latest, the
# newest release: master's pseudo-version can be older than the release the
# plugins require.
#
#   build-weddy.sh <source-dir> <out-dir> <version> [group]
#
#   group   linux, windows, darwin, freebsd, openbsd or netbsd: only those
#           platforms of releases/platforms.txt; empty = all of them
#
# Writes <out-dir>/weddy-<version>-<os>-<arch>[.exe], an .xz of each and a .sha256 of
# every file, and <out-dir>/failed.txt naming platforms that did not compile.
# WEDDY_PLATFORMS, space-separated, replaces the platform list (a local build of one).
# XCADDY is the xcaddy program (default: xcaddy from PATH, else this computer's build of the
# pinned version below).
set -euo pipefail

SRC="$(cd "${1:?usage: build-weddy.sh <source-dir> <out-dir> <version> [group]}" && pwd)"
OUT="${2:?}"; VERSION="${3:?}"; GROUP="${4:-}"
XCADDY_VERSION=v0.4.7
mkdir -p "$OUT"; OUT="$(cd "$OUT" && pwd)"
for d in caddy-gitea-plugin caddy-wekan-plugin caddy-rclone-plugin caddy-ferretdb-plugin FerretDB; do
  [ -d "$SRC/$d" ] || { echo "build-weddy.sh: $SRC/$d is missing" >&2; exit 1; }
done
# xcaddy runs on THIS computer, so it is built for this computer once - never with
# the target's GOOS/GOARCH, which `go run` under the loop below would use: that
# made xcaddy itself a Windows, macOS or BSD program here ("exec format error",
# or a crash under qemu).
if [ -z "${XCADDY:-}" ]; then
  if command -v xcaddy >/dev/null; then XCADDY=xcaddy
  else
    XCADDY="$OUT/.xcaddy/xcaddy"
    [ -x "$XCADDY" ] || GOOS= GOARCH= GOARM= GOBIN="$OUT/.xcaddy" go install "github.com/caddyserver/xcaddy/cmd/xcaddy@$XCADDY_VERSION"
  fi
fi
if [ -d "$SRC/caddy" ]; then CADDY=(--with "github.com/caddyserver/caddy/v2=$SRC/caddy")
else CADDY=("${CADDY_REF:-latest}"); fi
PLATFORMS_FILE="${WEDDY_PLATFORMS_FILE:-$SRC/weddy/releases/platforms.txt}"
# The version Weddy reports (`weddy version`), and xcaddy's own defaults kept: no
# debug symbols, no build paths, and its storage-module tags.
export XCADDY_GO_BUILD_FLAGS="-trimpath -ldflags='-w -s -X github.com/caddyserver/caddy/v2.CustomVersion=Weddy-$VERSION' -tags=nobadger,nomysql,nopgx"
export CGO_ENABLED=0 GOTELEMETRY=off

: > "$OUT/failed.txt"
platforms() {
  if [ -n "${WEDDY_PLATFORMS:-}" ]; then printf '%s\n' $WEDDY_PLATFORMS
  else grep -v '^\s*#' "$PLATFORMS_FILE" | grep .; fi
}
platforms | while read -r p; do
  os="${p%%/*}"; arch="${p##*/}"
  [ -z "$GROUP" ] || [ "$os" = "$GROUP" ] || continue
  goarch="$arch"; goarm=""
  case "$arch" in arm-*) goarch=arm; goarm="${arch#arm-}" ;; esac
  name="weddy-$VERSION-$os-$arch"; [ "$os" = windows ] && name="$name.exe"
  # NetBSD: github.com/coreos/go-systemd/v22 v22.7.0 (under rclone and step-ca) added
  # SdNotifyMonotonicUsec, which calls unix.CLOCK_MONOTONIC - golang.org/x/sys does
  # not define it for NetBSD, so nothing builds. Nothing in Weddy calls that function,
  # and everything that is called is in v22.6.0, which NetBSD builds use.
  extra=()
  [ "$os" = netbsd ] && extra=(--replace "github.com/coreos/go-systemd/v22=github.com/coreos/go-systemd/v22@v22.6.0")
  echo "== $p"
  if GOOS="$os" GOARCH="$goarch" GOARM="$goarm" $XCADDY build "${CADDY[@]}" --output "$OUT/$name" \
      --with "github.com/wekan/caddy-gitea-plugin=$SRC/caddy-gitea-plugin" \
      --with "github.com/wekan/caddy-wekan-plugin=$SRC/caddy-wekan-plugin" \
      --with "github.com/wekan/caddy-rclone-plugin=$SRC/caddy-rclone-plugin" \
      --with "github.com/wekan/caddy-ferretdb-plugin=$SRC/caddy-ferretdb-plugin" \
      --replace "github.com/FerretDB/FerretDB=$SRC/FerretDB" ${extra[@]+"${extra[@]}"} > "$OUT/$name.log" 2>&1; then
    xz -k -9 -T0 "$OUT/$name"
    rm -f "$OUT/$name.log"
  else
    echo "  skipped $p (does not compile):"; tail -n 3 "$OUT/$name.log" | sed 's/^/    /'
    echo "$p" >> "$OUT/failed.txt"
    rm -f "$OUT/$name" "$OUT/$name.log"
  fi
done
rm -rf "$OUT/.xcaddy"
( cd "$OUT" && shopt -s nullglob && for f in weddy-*; do case "$f" in *.sha256) ;; *) sha256sum "$f" > "$f.sha256" ;; esac; done ) 2>/dev/null || true
echo "Built: $(ls "$OUT" | grep -vc '\.sha256$\|\.xz$\|failed.txt') binaries; not compiled: $(wc -l < "$OUT/failed.txt")."
