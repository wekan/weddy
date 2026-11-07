# Weddy: Caddy webserver with Caddy plugins: WeKan kanban and Gitea version control

- Caddy: https://github.com/caddyserver/caddy
- Caddy plugin: Gitea version control https://github.com/wekan/caddy-gitea-plugin
  - Gitea Patches: https://github.com/wekan/gitea-patches
    - Translations to Finnish
    - Mirroring
- Caddy plugin: WeKan kanban https://github.com/wekan/caddy-wekan-plugin
- Caddy plugin: RClone https://github.com/wekan/caddy-rclone-plugin

# Design

- Caddy plugins add parts that are not yet at Caddy itself
- Caddy plugins can use parts of other Caddy plugins
- Weddy uses xcaddy to add these plugins to Caddy

| Plugin | How it runs |
|--------|-------------|
| [caddy-gitea-plugin](https://github.com/wekan/caddy-gitea-plugin) | Gitea **inside** Caddy: the needed parts of Gitea's source, with gitea-patches applied, are in the plugin |
| [caddy-wekan-plugin](https://github.com/wekan/caddy-wekan-plugin) | WeKan (Node.js) and its FerretDB as a child process Caddy supervises, with caddy-gitea-plugin's `supervisor` and `proxy` packages |
| [caddy-rclone-plugin](https://github.com/wekan/caddy-rclone-plugin) | rclone **inside** Caddy: any rclone remote served as files, or as WebDAV |

```caddyfile
{
	gitea {
		work_path /var/lib/gitea
	}
	wekan {
		bundle   /opt/wekan
		root_url https://wekan.example.org
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

# Releases

Like [wekan/gitea-patches](https://github.com/wekan/gitea-patches), this repository
carries no Caddy source - only patches (`dist/all/`) and the build. Each release
([.github/workflows/release-all.yml](.github/workflows/release-all.yml)):

1. assembles the source ([releases/apply-patches.sh](releases/apply-patches.sh)):
   upstream Caddy `master` (or a ref) with `dist/all/*.patch` as commits on branch
   `weddy`, and the three plugins - each a git repository with its history;
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

# Tests

```sh
bash tests/apply-patches.sh               # assembly and zips, stand-in repositories
python3 -I tests/changelogShort.test.py   # CHANGELOG.md is what CHANGELOG-big.md gives
```

Each plugin has its own tests, which run a real Caddy.

# License

MIT - see [LICENSE](LICENSE). Caddy is Apache-2.0; Gitea, WeKan and rclone are MIT.

Maintainer and contributor rules are in
[WeKan's CLAUDE.md and AGENTS.md](https://github.com/wekan/wekan), which cover every
repository WeKan clones into its `.tools/` directory.
