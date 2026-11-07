# Weddy: Caddy webserver with Caddy plugins: WeKan kanban and Gitea version control

One binary, no Node.js: WeKan written in Go and Gitea, both inside Caddy.

- Caddy: https://github.com/caddyserver/caddy
- Caddy plugin: Gitea version control https://github.com/wekan/caddy-gitea-plugin
  - Gitea Patches: https://github.com/wekan/gitea-patches
    - Translations to Finnish
    - Mirroring
- Caddy plugin: WeKan kanban https://github.com/wekan/caddy-wekan-plugin
- Caddy plugin: RClone https://github.com/wekan/caddy-rclone-plugin
- Caddy plugin: FerretDB, WeKan's database https://github.com/wekan/caddy-ferretdb-plugin
  - FerretDB v1 fork: https://github.com/wekan/FerretDB (branch main-v1)

# Design

- Caddy plugins add parts that are not yet at Caddy itself
- Caddy plugins can use parts of other Caddy plugins
- Weddy uses xcaddy to add these plugins to Caddy

| Plugin | How it runs |
|--------|-------------|
| [caddy-gitea-plugin](https://github.com/wekan/caddy-gitea-plugin) | Gitea **inside** Caddy: the needed parts of Gitea's source, with gitea-patches applied, are in the plugin |
| [caddy-wekan-plugin](https://github.com/wekan/caddy-wekan-plugin) | WeKan **written in Go** inside Caddy - Go Pug pages, Unpoly, interact.js MultiDrag, Server-Sent Events, WeKan's REST API - over the same documents and `files/db/wekan.sqlite` as Node.js WeKan, with WeKan's own translations |
| [caddy-ferretdb-plugin](https://github.com/wekan/caddy-ferretdb-plugin) | FerretDB over SQLite **inside** Caddy: WeKan's database, also on TCP for MongoDB tools when asked |
| [caddy-rclone-plugin](https://github.com/wekan/caddy-rclone-plugin) | rclone **inside** Caddy: any rclone remote served as files, or as WebDAV |

```caddyfile
{
	gitea {
		work_path /var/lib/gitea
	}
	wekan {
		data /var/lib/weddy
	}
}
git.example.org {
	gitea
}
wekan.example.org {
	wekan
}
files.example.org {
	rclone s3:my-bucket/public
}
```

# Many domains: the Cloud Panel

One Weddy can replace a host of WeKan Docker containers: with the wekan option's
`data` and `primary`, every domain is a WeKan of its own in the Weddy process, in
`<data>/domains/<domain>/` with its own database, and nothing of one domain is seen
at another. The **Cloud Panel** - the SuperAdmin's table of customer domains with
their hosting dates, and a CloudFlare API key from which each domain gets a
CloudFlare Origin certificate, or else a Let's Encrypt one - is Weddy's, not WeKan's:
all the domains are in one process here, where Node.js WeKan would have to work
together across many containers. Its pages are being written in Go; until they
are, `<data>/cloud/domains.json` and `cloudflare.json` are written by hand. See
[caddy-wekan-plugin](https://github.com/wekan/caddy-wekan-plugin#many-domains-one-weddy-a-wekan-per-customer-domain).

# What is in progress

[TODO.md](TODO.md) lists what Weddy does not do yet. When an item is done, it
moves from there to the `# Upcoming weddy release` section of
[CHANGELOG-big.md](CHANGELOG-big.md).

# Releases

Like [wekan/gitea-patches](https://github.com/wekan/gitea-patches), this repository
carries no Caddy source - only patches (`dist/all/`) and the build. Each release
([.github/workflows/release-all.yml](.github/workflows/release-all.yml)):

1. assembles the source ([releases/apply-patches.sh](releases/apply-patches.sh)):
   upstream Caddy `master` (or a ref) with `dist/all/*.patch` as commits on branch
   `weddy`, the four plugins and wekan/FerretDB `main-v1` - each a git repository
   with its history;
2. attaches `weddy-source-with-history.zip` and `weddy-source-without-history.zip`;
3. builds every platform in [releases/platforms.txt](releases/platforms.txt) with
   xcaddy from the content of the zip without history
   ([releases/build-weddy.sh](releases/build-weddy.sh)) - one job per OS, each
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
`.tools/tmp/` ([releases/local-env.sh](releases/local-env.sh)); outside WeKan's
`.tools/`, the Go in `PATH`.

# Tests

```sh
bash tests/apply-patches.sh               # assembly and zips, stand-in repositories
python3 -I tests/changelogShort.test.py   # CHANGELOG.md is what CHANGELOG-big.md gives
./build.sh everything                     # EVERYTHING, below
```

**EVERYTHING** (`./build.sh everything`, menu 6) runs on this computer only - never
on GitHub or Gitea - every stage even after one fails, and lists the failures at the
end; logs in `log/<datetime>/`:

| Stage | |
|-------|---|
| scripts | the two tests above |
| go-caddy-*-plugin | `go vet` and `go test` of each plugin beside Weddy; they run a real Caddy |
| gitea-tests | Gitea's own tests, for the Gitea Weddy compiles in ([tests/gitea/](tests/gitea/README.md)) |
| build-local | `./build.sh local` |
| wekan-tests | WeKan's browser and API tests against that binary ([tests/wekan/run.sh](tests/wekan/run.sh)) |

`tests/wekan/` is WeKan's own Playwright suite and the WeKan files it reads, copied by
`./build.sh sync-wekan-tests` (menu 7) - written in WeKan, never edited here - with
`overlay/` for what differs in Weddy (a page is logged in with the same
`meteor_login_token` cookie, set directly), `weddy-specs/` for Weddy's own specs on
WeKan's fixtures and page objects, and `wekan-specs.txt` naming the WeKan specs whose
pages Weddy has so far (`WEDDY_WEKAN_SPECS=all` runs every one). The binary is
started with a fresh data directory and its database on TCP, where WeKan's
`helpers/db.js` seeds users and boards as it does for WeKan. Node.js runs the tests
only; it comes from WeKan's `.tools/node-*`, the browser goes to
`.tools/ms-playwright`.

# License

MIT - see [LICENSE](LICENSE). Caddy is Apache-2.0; Gitea, WeKan and rclone are MIT.

Maintainer and contributor rules are in
[WeKan's CLAUDE.md and AGENTS.md](https://github.com/wekan/wekan), which cover every
repository WeKan clones into its `.tools/` directory.
