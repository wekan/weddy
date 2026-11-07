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

| | |
|---|---|
| [docs/Design/Design.md](docs/Design/Design.md) | how Weddy is put together, a Caddyfile, and many domains with the Cloud Panel |
| [docs/Releases.md](docs/Releases.md) | releases, and building locally with `./build.sh` |
| [docs/Tests.md](docs/Tests.md) | the tests, and EVERYTHING |
| [TODO.md](TODO.md) | what is still in progress |
| [CHANGELOG.md](CHANGELOG.md), [CHANGELOG-big.md](CHANGELOG-big.md) | what changed |
| [LICENSE](LICENSE) | the license |

Maintainer and contributor rules are in
[WeKan's CLAUDE.md and AGENTS.md](https://github.com/wekan/wekan), which cover every
repository WeKan clones into its `.tools/` directory.
