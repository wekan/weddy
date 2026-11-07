#!/usr/bin/env bash
# releases/apply-patches.sh and releases/source-zips.py with stand-in repositories,
# no network: the parts with their history, Caddy's patches as commits on
# branch weddy, reproducible commits, and zips with and without every .git.
#
#   bash tests/apply-patches.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/weddy-test.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT
fail=0
t() { if eval "$2"; then echo "ok   $1"; else echo "FAIL $1"; fail=$((fail + 1)); fi; }
repo() { # <dir> <file> <branch>
  git init -q -b "${3:-main}" "$1"; git -C "$1" config user.name U; git -C "$1" config user.email u@example.org
  echo "$2" > "$1/$2"; git -C "$1" add -A; git -C "$1" commit -q -m "$2"
}
repo "$WORK/caddy" caddy.go master
git -C "$WORK/caddy" tag v2.11.7
echo two > "$WORK/caddy/two"; git -C "$WORK/caddy" add -A; git -C "$WORK/caddy" commit -q -m two
for p in gitea wekan rclone ferretdb; do repo "$WORK/caddy-$p-plugin" "$p.go"; done
repo "$WORK/FerretDB" ferretdb.go main
git -C "$WORK/FerretDB" checkout -q -b main-v1; echo v1 > "$WORK/FerretDB/v1"; git -C "$WORK/FerretDB" add -A; git -C "$WORK/FerretDB" commit -q -m v1
git -C "$WORK/FerretDB" checkout -q main

# weddy itself, with one Caddy patch
W="$WORK/weddy"; mkdir -p "$W"
cp -r "$ROOT/releases" "$W/"; mkdir -p "$W/dist/all"
git clone -q "$WORK/caddy" "$WORK/mk"; git -C "$WORK/mk" config user.name 'Patch Author'; git -C "$WORK/mk" config user.email pa@example.org
echo fix > "$WORK/mk/fix"; git -C "$WORK/mk" add fix; git -C "$WORK/mk" commit -q -m "Fix Caddy."
git -C "$WORK/mk" format-patch -q --stdout -1 > "$W/dist/all/fix.patch"
( cd "$W/dist/all" && sha256sum fix.patch > fix.sha256sum )
git -C "$W" init -q -b main; git -C "$W" config user.name U; git -C "$W" config user.email u@example.org
git -C "$W" add -A; git -C "$W" commit -q -m weddy

run() { CADDY_URL="$WORK/caddy" GITEA_PLUGIN_URL="$WORK/caddy-gitea-plugin" WEKAN_PLUGIN_URL="$WORK/caddy-wekan-plugin" \
  RCLONE_PLUGIN_URL="$WORK/caddy-rclone-plugin" FERRETDB_PLUGIN_URL="$WORK/caddy-ferretdb-plugin" FERRETDB_URL="$WORK/FerretDB" GITHUB_ENV= GITHUB_OUTPUT= GITHUB_STEP_SUMMARY= bash "$W/releases/apply-patches.sh" "$W" "$@"; }
out="$(run "$WORK/s1" 2>&1)" || { echo "$out"; fail=$((fail + 1)); }
S="$WORK/s1"
t "seven parts" '[ "$(ls "$S" | LC_ALL=C sort | tr "\n" " ")" = "FerretDB caddy caddy-ferretdb-plugin caddy-gitea-plugin caddy-rclone-plugin caddy-wekan-plugin weddy " ]'
t "FerretDB: branch main-v1, not its default branch" '[ -f "$S/FerretDB/v1" ] && grep -q "^FERRETDB_COMMIT=[0-9a-f]\{40\}$" <<<"$out"'
t "every part is a git repository with its history" 'for d in "$S"/*; do git -C "$d" rev-parse -q --verify HEAD >/dev/null || exit 1; done'
t "Caddy: master by default, on branch weddy" 'grep -qx "SOURCE_REF=master" <<<"$out" && [ "$(git -C "$S/caddy" symbolic-ref --short HEAD)" = weddy ]'
t "Caddy: the patch is a commit, with its own author" '[ "$(git -C "$S/caddy" log -1 --format="%s|%an")" = "Fix Caddy.|Patch Author" ]'
t "Caddy: version from the nearest tag" 'grep -qx "CADDY_VERSION=2.11.7" <<<"$out" && grep -qx "PATCHES_APPLIED=1" <<<"$out"'
t "the plugin commits are reported" 'grep -q "^RCLONE_PLUGIN_COMMIT=[0-9a-f]\{40\}$" <<<"$out"'
sleep 1; run "$WORK/s2" >/dev/null 2>&1
t "reproducible: the same Caddy commit again" '[ "$(git -C "$S/caddy" rev-parse HEAD)" = "$(git -C "$WORK/s2/caddy" rev-parse HEAD)" ]'
t "negative: refuses an existing destination" '! run "$S" >/dev/null 2>&1'
echo " " >> "$W/dist/all/fix.patch"
t "negative: refuses a patch whose checksum does not match" '! run "$WORK/s3" >/dev/null 2>&1'

python3 -I "$ROOT/releases/source-zips.py" "$S" "$WORK/out" >/dev/null
mkdir "$WORK/n" "$WORK/w"; ( cd "$WORK/n" && unzip -q "$WORK/out/weddy-source-without-history.zip" ); ( cd "$WORK/w" && unzip -q "$WORK/out/weddy-source-with-history.zip" )
t "zips: the top directory is weddy/" '[ "$(ls "$WORK/n")" = weddy ]'
t "negative: the zip without history has no .git anywhere" '[ -z "$(find "$WORK/n" -name .git)" ] && [ -f "$WORK/n/weddy/caddy/caddy.go" ]'
t "the zip with history has every repository" '[ "$(find "$WORK/w" -maxdepth 3 -name .git | wc -l)" = 7 ] && [ -z "$(git -C "$WORK/w/weddy/caddy" status --porcelain)" ]'
python3 -I "$ROOT/releases/source-zips.py" "$S" "$WORK/out2" >/dev/null
t "reproducible: a byte-identical zip without history" 'cmp -s "$WORK/out/weddy-source-without-history.zip" "$WORK/out2/weddy-source-without-history.zip"'

echo; echo "$fail failure(s)"; [ "$fail" -eq 0 ]
