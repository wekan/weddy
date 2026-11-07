#!/usr/bin/env bash
# Assemble Weddy's source: its git repositories WITH their history, side by side,
# which the binaries and both source zips are made from.
#
#   apply-patches.sh <weddy-root> <dest-dir> [caddy-ref]
#
#   <dest-dir>/caddy                upstream caddyserver/caddy at caddy-ref, plus
#                                   dist/all/*.patch as commits (git am --3way), on
#                                   branch weddy
#   <dest-dir>/caddy-gitea-plugin   wekan/caddy-gitea-plugin
#   <dest-dir>/caddy-wekan-plugin   wekan/caddy-wekan-plugin
#   <dest-dir>/caddy-rclone-plugin  wekan/caddy-rclone-plugin
#   <dest-dir>/caddy-ferretdb-plugin wekan/caddy-ferretdb-plugin: WeKan's database
#   <dest-dir>/FerretDB             wekan/FerretDB, branch main-v1, which it embeds
#   <dest-dir>/weddy                this repository: its build scripts and the
#                                   platform list
#
#   caddy-ref   upstream branch, tag or commit; empty = master, including changes not
#               in a release yet - as wekan/gitea-patches builds Gitea's main.
#
# releases/build-weddy.sh then builds with xcaddy from these directories.
#
# Environment: CADDY_URL, GITEA_PLUGIN_URL, WEKAN_PLUGIN_URL, RCLONE_PLUGIN_URL,
# FERRETDB_PLUGIN_URL, FERRETDB_URL (a URL or a local path) and GITEA_PLUGIN_REF,
# WEKAN_PLUGIN_REF, RCLONE_PLUGIN_REF, FERRETDB_PLUGIN_REF (default: their default
# branch), FERRETDB_REF (default main-v1) say where the parts come from;
# PATCH_AUTHOR is the committer.
#
# Commits made here are dated with Caddy's commit date, so the same inputs give the
# same commit hashes. Prints, and under GitHub Actions also writes to GITHUB_ENV and
# GITHUB_OUTPUT: SOURCE_REF, CADDY_COMMIT, CADDY_SHORT, CADDY_VERSION,
# GITEA_PLUGIN_COMMIT, WEKAN_PLUGIN_COMMIT, RCLONE_PLUGIN_COMMIT,
# FERRETDB_PLUGIN_COMMIT, FERRETDB_COMMIT, WEDDY_COMMIT, PATCHES_APPLIED.
set -euo pipefail

ROOT="$(cd "${1:?usage: apply-patches.sh <weddy-root> <dest-dir> [caddy-ref]}" && pwd)"
DEST="${2:?usage: apply-patches.sh <weddy-root> <dest-dir> [caddy-ref]}"
REF="${3:-}"
CADDY_URL="${CADDY_URL:-https://github.com/caddyserver/caddy.git}"
GITEA_PLUGIN_URL="${GITEA_PLUGIN_URL:-https://github.com/wekan/caddy-gitea-plugin.git}"
WEKAN_PLUGIN_URL="${WEKAN_PLUGIN_URL:-https://github.com/wekan/caddy-wekan-plugin.git}"
RCLONE_PLUGIN_URL="${RCLONE_PLUGIN_URL:-https://github.com/wekan/caddy-rclone-plugin.git}"
FERRETDB_PLUGIN_URL="${FERRETDB_PLUGIN_URL:-https://github.com/wekan/caddy-ferretdb-plugin.git}"
FERRETDB_URL="${FERRETDB_URL:-https://github.com/wekan/FerretDB.git}"
PATCH_AUTHOR="${PATCH_AUTHOR:-Lauri Ojansivu <x@xet7.org>}"
NAME="${PATCH_AUTHOR% <*}"
EMAIL="${PATCH_AUTHOR##*<}"; EMAIL="${EMAIL%>}"

[ ! -e "$DEST" ] || { echo "apply-patches.sh: $DEST already exists" >&2; exit 1; }
mkdir -p "$DEST"
DEST="$(cd "$DEST" && pwd)"

# 1. Caddy, with its whole history and tags.
echo "Cloning ${CADDY_URL} with its whole history..."
git clone --quiet --no-checkout "$CADDY_URL" "$DEST/caddy"
cd "$DEST/caddy"
REF="${REF:-master}"
if COMMIT="$(git rev-parse --verify -q "origin/$REF^{commit}")"; then :
elif COMMIT="$(git rev-parse --verify -q "$REF^{commit}")"; then :
else
  git fetch --quiet origin "$REF"
  COMMIT="$(git rev-parse --verify 'FETCH_HEAD^{commit}')"
fi
git checkout --quiet -B weddy "$COMMIT"
SHORT="${COMMIT:0:10}"
BASE_TAG="$(git describe --tags --abbrev=0 --match 'v2*' "$COMMIT" 2>/dev/null || echo v2.0.0)"
CADDY_VERSION="${BASE_TAG#v}"; CADDY_VERSION="${CADDY_VERSION%%-*}"
echo "Caddy ${REF} is ${COMMIT} (version ${CADDY_VERSION})."

DATE="$(git log -1 --format=%cI "$COMMIT")"
export GIT_COMMITTER_NAME="$NAME" GIT_COMMITTER_EMAIL="$EMAIL" GIT_COMMITTER_DATE="$DATE"
identity() { git -C "$1" config user.name "$NAME"; git -C "$1" config user.email "$EMAIL"; }
identity .
applied=0
for p in "$ROOT"/dist/all/*.patch; do
  [ -e "$p" ] || continue
  n="$(basename "$p")"
  ( cd "$ROOT/dist/all" && sha256sum --quiet -c "${n%.patch}.sha256sum" )
  echo "Applying all/${n}"
  before="$(git rev-list --count HEAD)"
  git am --quiet --3way --committer-date-is-author-date "$p" || {
    git am --abort || true
    echo "::error::dist/all/${n} does not apply to Caddy ${REF} (${COMMIT}). Re-port it; see docs/Design/Patch-format.md." >&2
    exit 1
  }
  applied=$((applied + $(git rev-list --count HEAD) - before))
done

# 2. The plugins, with their history.
clone_plugin() { # <url> <dir> <ref>
  git clone --quiet "$1" "$DEST/$2"
  if [ -n "$3" ]; then
    git -C "$DEST/$2" checkout --quiet -B "$3" "origin/$3" 2>/dev/null || git -C "$DEST/$2" checkout --quiet --detach "$3"
  fi
  git -C "$DEST/$2" rev-parse HEAD
}
GITEA_PLUGIN_COMMIT="$(clone_plugin "$GITEA_PLUGIN_URL" caddy-gitea-plugin "${GITEA_PLUGIN_REF:-}")"
WEKAN_PLUGIN_COMMIT="$(clone_plugin "$WEKAN_PLUGIN_URL" caddy-wekan-plugin "${WEKAN_PLUGIN_REF:-}")"
RCLONE_PLUGIN_COMMIT="$(clone_plugin "$RCLONE_PLUGIN_URL" caddy-rclone-plugin "${RCLONE_PLUGIN_REF:-}")"
FERRETDB_PLUGIN_COMMIT="$(clone_plugin "$FERRETDB_PLUGIN_URL" caddy-ferretdb-plugin "${FERRETDB_PLUGIN_REF:-}")"
FERRETDB_COMMIT="$(clone_plugin "$FERRETDB_URL" FerretDB "${FERRETDB_REF:-main-v1}")"
echo "caddy-gitea-plugin ${GITEA_PLUGIN_COMMIT}, caddy-wekan-plugin ${WEKAN_PLUGIN_COMMIT}, caddy-rclone-plugin ${RCLONE_PLUGIN_COMMIT}, caddy-ferretdb-plugin ${FERRETDB_PLUGIN_COMMIT}, FerretDB ${FERRETDB_COMMIT}."

# 3. Weddy itself: the build scripts and platform list the binaries are made with.
git clone --quiet "$ROOT" "$DEST/weddy"
git -C "$DEST/weddy" remote set-url origin https://github.com/wekan/weddy.git
WEDDY_COMMIT="$(git -C "$DEST/weddy" rev-parse HEAD)"

out="$(printf 'SOURCE_REF=%s\nCADDY_COMMIT=%s\nCADDY_SHORT=%s\nCADDY_VERSION=%s\nGITEA_PLUGIN_COMMIT=%s\nWEKAN_PLUGIN_COMMIT=%s\nRCLONE_PLUGIN_COMMIT=%s\nFERRETDB_PLUGIN_COMMIT=%s\nFERRETDB_COMMIT=%s\nWEDDY_COMMIT=%s\nPATCHES_APPLIED=%s\n' \
  "$REF" "$COMMIT" "$SHORT" "$CADDY_VERSION" "$GITEA_PLUGIN_COMMIT" "$WEKAN_PLUGIN_COMMIT" "$RCLONE_PLUGIN_COMMIT" "$FERRETDB_PLUGIN_COMMIT" "$FERRETDB_COMMIT" "$WEDDY_COMMIT" "$applied")"
printf '%s\n' "$out"
[ -z "${GITHUB_ENV:-}" ] || printf '%s\n' "$out" >> "$GITHUB_ENV"
if [ -n "${GITHUB_OUTPUT:-}" ]; then
  printf '%s\n' "$out" | while IFS='=' read -r k v; do
    printf '%s=%s\n' "$(printf '%s' "$k" | tr 'A-Z' 'a-z')" "$v"
  done >> "$GITHUB_OUTPUT"
fi
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    echo "### Source"
    echo ""
    echo "| Part | Commit |"
    echo "|------|--------|"
    echo "| caddyserver/caddy \`${REF}\` (${CADDY_VERSION}) + ${applied} patch commit(s) | \`${COMMIT}\` |"
    echo "| wekan/caddy-gitea-plugin | \`${GITEA_PLUGIN_COMMIT}\` |"
    echo "| wekan/caddy-wekan-plugin | \`${WEKAN_PLUGIN_COMMIT}\` |"
    echo "| wekan/caddy-rclone-plugin | \`${RCLONE_PLUGIN_COMMIT}\` |"
    echo "| wekan/caddy-ferretdb-plugin | \`${FERRETDB_PLUGIN_COMMIT}\` |"
    echo "| wekan/FerretDB | \`${FERRETDB_COMMIT}\` |"
  } >> "$GITHUB_STEP_SUMMARY"
fi
