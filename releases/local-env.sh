# Sourced by build.sh for a local build and the tests: the tools WeKan keeps in
# .tools/ when Weddy is checked out in WeKan's .tools/w/ - Go in .tools/bin/go,
# Node.js in .tools/node-*, Go's caches in .tools/go, temporary files in
# .tools/tmp - else what PATH has. TOOLS overrides where .tools is.
WEDDY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOOLS="${TOOLS:-$(cd "$WEDDY_ROOT/../.." 2>/dev/null && pwd)}"
if [ -x "$TOOLS/bin/go/bin/go" ]; then
  PATH="$TOOLS/bin/go/bin:$PATH"
  export GOPATH="${GOPATH:-$TOOLS/go/gopath}" GOCACHE="${GOCACHE:-$TOOLS/go/gocache}"
  export GOMODCACHE="${GOMODCACHE:-$TOOLS/go/gomodcache}" GOFLAGS="${GOFLAGS:--modcacherw}"
else
  TOOLS="${TOOLS_FALLBACK:-}"
fi
for n in "$TOOLS"/node-v*/bin; do [ -x "$n/node" ] && PATH="$n:$PATH"; done
export PATH TOOLS GOTELEMETRY=off
if [ -n "$TOOLS" ]; then
  export TMPDIR="$TOOLS/tmp" npm_config_cache="${npm_config_cache:-$TOOLS/tmp/npm-cache}"
  mkdir -p "$TMPDIR"
fi
# The repositories Weddy is built from, side by side with it: .tools/w/ in WeKan.
export WEDDY_LOCAL_SRC="${WEDDY_LOCAL_SRC:-$(cd "$WEDDY_ROOT/.." && pwd)}"
