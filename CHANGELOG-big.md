# Platforms

Weddy - Caddy with the Caddy plugins of WeKan kanban, Gitea version control and
rclone - built with xcaddy, at these platforms:

- [Releases](https://github.com/wekan/weddy/releases)
- [Upstream Caddy](https://github.com/caddyserver/caddy)
- [caddy-gitea-plugin](https://github.com/wekan/caddy-gitea-plugin),
  [caddy-wekan-plugin](https://github.com/wekan/caddy-wekan-plugin),
  [caddy-rclone-plugin](https://github.com/wekan/caddy-rclone-plugin)

Every platform in [releases/platforms.txt](releases/platforms.txt): Linux, Windows,
macOS, FreeBSD, OpenBSD and NetBSD, with the source as
`weddy-source-with-history.zip` and `weddy-source-without-history.zip`.

# Upcoming weddy release

**In short:** Weddy is **Caddy with the WeKan, FerretDB, Gitea and rclone
plugins** - WeKan **written in Go**, no Node.js - built with **xcaddy** from
upstream Caddy and the plugins, and released with its source **with and without
history** and binaries for **every platform**. It serves **many WeKan domains**,
each with its own data, kept by the SuperAdmin in Weddy's own **Cloud Panel**,
and is built and tested **locally** with **EVERYTHING** tests: WeKan's and
Gitea's own.

This release adds the following new features:

**Build** - from upstream Caddy and the plugins, like gitea-patches.

<details>
<summary><a href="https://github.com/wekan/weddy/commit/dae82cd19245907eafc5e4574cd441f5cfcc38ac">Build Weddy with xcaddy from upstream Caddy and the WeKan, Gitea and rclone plugins</a>. Thanks to xet7.</summary>

`releases/apply-patches.sh` assembles upstream Caddy master with `dist/all/` as
commits and the three plugins, each with its history; `releases/source-zips.py`
zips it with and without every `.git`; `releases/build-weddy.sh` builds every
platform with xcaddy from that source. Release All builds one job per OS from the
zip without history and attaches each as soon as it is done; Release All Missing
completes a release. Built locally, one Weddy served Gitea inside it in Finnish,
WeKan through its launcher and an rclone remote from one Caddyfile.

</details>

**Local builds and EVERYTHING tests** - from the repositories beside Weddy.

<details>
<summary><a href="https://github.com/wekan/weddy/commit/a7e579f51a2d08d6066fe3222a7aa50024af49a4">FerretDB in the build, a local build, and EVERYTHING tests with WeKan's and Gitea's own</a>. Thanks to xet7.</summary>

The source now has caddy-ferretdb-plugin and wekan/FerretDB `main-v1`: WeKan runs
in Go inside Weddy over its embedded FerretDB. `build.sh local [all]` builds from
WeKan's `.tools/w/` with uncommitted changes, using `.tools`' Go. `build.sh
everything`, locally only, runs the script tests, every plugin's Go tests,
Gitea's own tests for the Gitea Weddy compiles in (1717 passed, 18 skipped by
Gitea itself), a local build, and WeKan's Playwright suite - copied into
`tests/wekan/` with `build.sh sync-wekan-tests` - against it (18 passed).

</details>

**The Cloud Panel** - in Weddy, written in Go.

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/17f130524a4af8717fe12e687fb8ce19cd655105">Admin Panel / People / Cloud, and the Cloud Panel with Domains and CloudFlare for the SuperAdmin</a>. Thanks to xet7.</summary>

The primary domain's site admins name the Cloud Panel Domain and the SuperAdmin;
at the Cloud Panel Domain the SuperAdmin keeps the Domains table (with Weddy's
TLS status) and a write-only CloudFlare API key, mode 0600, never sent to a
browser. Every request asks again; anybody else, and every customer's WeKan, is
refused. `domains.json` and `cloudflare.json` no longer need writing by hand.

</details>

**WeKan in Go** - more of WeKan's REST API, and the language.

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/8787392d623870dfbf5ef358bbefb0e6b0eed240">Swimlanes and lists one by one, custom fields, checklists, comments and logout in the REST API</a>. Thanks to xet7.</summary>

In WeKan's collections and shapes; a comment's author is always the caller,
and logging out revokes the presented token. Six of WeKan's own REST tests now
run against Weddy ([tests/wekan/wekan-specs.txt](tests/wekan/wekan-specs.txt),
<a href="https://github.com/wekan/weddy/commit/97cb0638e351f02dc87ea1a0cb830afe1b0f5eec">entry per test</a>).

</details>

- [Change Language: every language WeKan has, named in itself, kept in profile.language](https://github.com/wekan/caddy-wekan-plugin/commit/d434a275bb08c350213ab7bca4cfd6e77a9b87a6). Thanks to xet7.

**Release** - what a release says it is made of.

- [The release notes list caddy-ferretdb-plugin and wekan/FerretDB with their commits](https://github.com/wekan/weddy/commit/97cb0638e351f02dc87ea1a0cb830afe1b0f5eec). Thanks to xet7.

**Many domains** - the Cloud Panel, in Weddy.

- [Many WeKan domains from one Weddy, with the Cloud Panel](https://github.com/wekan/weddy/commit/ab862c2e81d0caa20f453ebe7f54d462b3a2c076). Thanks to xet7.

and fixes the following SECURITY ISSUES found by Dependabot:

- [No go-jose v3 in any plugin: go.step.sm/crypto v0.92.0 and smallstep/certificates at Caddy master's commit](https://github.com/wekan/caddy-wekan-plugin/commit/1a1c8fb30f7e22e8fb4274c772b6556bbaf7478a) - go-jose v3 <= 3.0.5 ([GHSA-mgcc-cww5-fp2q](https://github.com/advisories/GHSA-mgcc-cww5-fp2q), [GHSA-4w3g-jfj2-cw2q](https://github.com/advisories/GHSA-4w3g-jfj2-cw2q), [GHSA-vvm8-gf78-28g4](https://github.com/advisories/GHSA-vvm8-gf78-28g4)) has no patched release; also in [caddy-ferretdb-plugin](https://github.com/wekan/caddy-ferretdb-plugin/commit/926d05287ddb43c3dec197f1d979215f456a006c), [caddy-gitea-plugin](https://github.com/wekan/caddy-gitea-plugin/commit/7701fabcfaf1d1962d70d57652958ca1b76667cb) and [caddy-rclone-plugin](https://github.com/wekan/caddy-rclone-plugin/commit/7e06669906020a1ef0a96d7f41c9578790e1fd95). Thanks to Dependabot.

Thanks to above GitHub users for their contributions and translators for their translations.
