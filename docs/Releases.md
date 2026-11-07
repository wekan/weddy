# Releases

Like [wekan/gitea-patches](https://github.com/wekan/gitea-patches), this repository
carries no Caddy source - only patches (`dist/all/`) and the build. Each release
([.github/workflows/release-all.yml](../.github/workflows/release-all.yml)):

1. assembles the source ([releases/apply-patches.sh](../releases/apply-patches.sh)):
   upstream Caddy `master` (or a ref) with `dist/all/*.patch` as commits on branch
   `weddy`, the four plugins and wekan/FerretDB `main-v1` - each a git repository
   with its history;
2. attaches `weddy-source-with-history.zip` and `weddy-source-without-history.zip`;
3. builds every platform in [releases/platforms.txt](../releases/platforms.txt) with
   xcaddy from the content of the zip without history
   ([releases/build-weddy.sh](../releases/build-weddy.sh)) - one job per OS, each
   attaching `weddy-<version>-<os>-<arch>` and its `.xz` as soon as it is done, with a
   `.sha256` and a keyless cosign signature of every file.

Release All Missing completes a release from the source zip already on it.

```sh
gh workflow run release-all.yml -R wekan/weddy                  # Caddy master
gh workflow run release-all.yml -R wekan/weddy -f ref=v2.11.9   # a Caddy release
gh workflow run release-all-missing.yml -R wekan/weddy
```

`./build.sh` does the same locally: assemble, and build this computer's platform.

## Building locally

`./build.sh local` (menu 3) builds this computer's Weddy, and `./build.sh local all`
(menu 4) every platform, into `out-local/` - straight from the repositories beside
this one, uncommitted changes included: in WeKan's `.tools/w/`, caddy-wekan-plugin,
caddy-ferretdb-plugin, caddy-gitea-plugin, caddy-rclone-plugin and FerretDB. Caddy is
its newest release from the Go module proxy (`CADDY_REF`). Go is WeKan's
`.tools/bin/go/`, with its caches in `.tools/go/` and temporary files in
`.tools/tmp/` ([releases/local-env.sh](../releases/local-env.sh)); outside WeKan's
`.tools/`, the Go in `PATH`.
