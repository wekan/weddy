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

**WeKan in Go** - more of WeKan's REST API, attachments, users, activities, and
the language.

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/8787392d623870dfbf5ef358bbefb0e6b0eed240">Swimlanes and lists one by one, custom fields, checklists, comments and logout in the REST API</a>. Thanks to xet7.</summary>

In WeKan's collections and shapes; a comment's author is always the caller,
and logging out revokes the presented token. Six of WeKan's own REST tests now
run against Weddy ([tests/wekan/wekan-specs.txt](tests/wekan/wekan-specs.txt),
<a href="https://github.com/wekan/weddy/commit/97cb0638e351f02dc87ea1a0cb830afe1b0f5eec">entry per test</a>).

</details>

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/0ef462652e9bca904d36d5ff6bfd4a4fdeb83ba8">Labels, board members with roles, card members, dates and bulk cards in the REST API</a>. Thanks to xet7.</summary>

Only a board admin adds labels and members, with WeKan's roles and never a
disabled user; card members are members of the board; dates are set and
cleared; members and assignees are always arrays. Twelve more of WeKan's own
REST tests run against Weddy (<a href="https://github.com/wekan/weddy/commit/b6153e6cdd88f1fabfd7915021adeb9fed66cdbd">wekan-specs.txt</a>), 36 tests in all.

</details>

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/00a41ca8cdba5d9ebe424778e9bc61a6aeb3884a">Attachments as Node.js WeKan keeps them: upload, list, serve, download, delete</a>. Thanks to xet7.</summary>

`files/attachments/<id>` and Meteor-Files' document, so either WeKan reads the
other's; served only to a reader of the board, HTML and SVG always downloaded,
a stored path never followed out of the directory, a delete kept as WeKan's
soft delete.

</details>

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/ff7bd89de45632b604d546a5c21e1c722679b939">Sign up, the profile, changing the password, and Admin Panel / People</a>. Thanks to xet7.</summary>

The first account is the administrator; registration off is refused by the
server; a new password is 8 to 512 characters; People toggles admin and active
and registration, never on oneself.

</details>

- [Unique card numbers, delete with children, bulk delete, copy, card settings, My Cards and deleting users in the REST API](https://github.com/wekan/caddy-wekan-plugin/commit/97b60d80dc4352e8be34f8fdf4f72934a87af3af); eight more of WeKan's own tests run against Weddy (<a href="https://github.com/wekan/weddy/commit/a3f0269f6528a1b5a296124a197d071138976182">wekan-specs.txt</a>), 44 tests in all. Thanks to xet7.
- [Sign in with OAuth2 / OpenID Connect, with Node.js WeKan's OAUTH2_* settings, PKCE, state and nonce](https://github.com/wekan/caddy-wekan-plugin/commit/fee57982c84301ada4ef74cea2d0f0ad19034099). Thanks to xet7.
- [Activities as Node.js WeKan records them, for its feed, notifications and rules](https://github.com/wekan/caddy-wekan-plugin/commit/2d9f1bf5bb2e560f3c450aed42d61efc31458bdf). Thanks to xet7.

- [Change Language: every language WeKan has, named in itself, kept in profile.language](https://github.com/wekan/caddy-wekan-plugin/commit/d434a275bb08c350213ab7bca4cfd6e77a9b87a6). Thanks to xet7.

**Release** - what a release says it is made of.

- [NetBSD/amd64 builds: go-systemd v22.6.0 for NetBSD, without the function x/sys cannot build there](https://github.com/wekan/weddy/commit/486ba1828013577ff0609b5ef7d31cfea8fff5d3); 19 of 20 platforms build. Thanks to xet7.
- [Local builds build xcaddy for this computer, so Windows, macOS and the BSDs build too](https://github.com/wekan/weddy/commit/6a08aa37ae585b7aff817b4ff4f12b596c2211f7). Thanks to xet7.
- [The release notes list caddy-ferretdb-plugin and wekan/FerretDB with their commits](https://github.com/wekan/weddy/commit/97cb0638e351f02dc87ea1a0cb830afe1b0f5eec). Thanks to xet7.

**Many domains** - the Cloud Panel, in Weddy.

- [Many WeKan domains from one Weddy, with the Cloud Panel](https://github.com/wekan/weddy/commit/ab862c2e81d0caa20f453ebe7f54d462b3a2c076). Thanks to xet7.

and fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

- [Gitea in Weddy: the container tag list's allocation from ?n=, 32-bit wraps, and credentials in the access log](https://github.com/wekan/caddy-gitea-plugin/commit/1cf3aca662f297881b2c47486c1ed80bb5c432f2) - as caddy-gitea-plugin's dist/gitea/security-hardening.patch; the other alerts in Gitea's code are reviewed in its [Hall of Fame](https://github.com/wekan/caddy-gitea-plugin/wiki/Hall-of-Fame). Thanks to GitHub CodeQL and xet7.
- [WeKan in Weddy: request values only through $eq, bounded argon2, Secure cookies](https://github.com/wekan/caddy-wekan-plugin/commit/1a1c8fb30f7e22e8fb4274c772b6556bbaf7478a) - see caddy-wekan-plugin's [Hall of Fame](https://github.com/wekan/caddy-wekan-plugin/wiki/Hall-of-Fame). Thanks to GitHub CodeQL and xet7.
- [Weddy's own scripts: a linear pattern in sync-from-wekan.py, and Meteor's bcrypt cost in the test helper](https://github.com/wekan/weddy/commit/90f1439a41c532f0df37b92a46a25ca39958076e) - see Weddy's [Hall of Fame](https://github.com/wekan/weddy/wiki/Hall-of-Fame). Thanks to GitHub CodeQL and xet7.

and fixes the following SECURITY ISSUES found by Dependabot:

- [No go-jose v3 in any plugin: go.step.sm/crypto v0.92.0 and smallstep/certificates at Caddy master's commit](https://github.com/wekan/caddy-wekan-plugin/commit/1a1c8fb30f7e22e8fb4274c772b6556bbaf7478a) - go-jose v3 <= 3.0.5 ([GHSA-mgcc-cww5-fp2q](https://github.com/advisories/GHSA-mgcc-cww5-fp2q), [GHSA-4w3g-jfj2-cw2q](https://github.com/advisories/GHSA-4w3g-jfj2-cw2q), [GHSA-vvm8-gf78-28g4](https://github.com/advisories/GHSA-vvm8-gf78-28g4)) has no patched release; also in [caddy-ferretdb-plugin](https://github.com/wekan/caddy-ferretdb-plugin/commit/926d05287ddb43c3dec197f1d979215f456a006c), [caddy-gitea-plugin](https://github.com/wekan/caddy-gitea-plugin/commit/7701fabcfaf1d1962d70d57652958ca1b76667cb) and [caddy-rclone-plugin](https://github.com/wekan/caddy-rclone-plugin/commit/7e06669906020a1ef0a96d7f41c9578790e1fd95). Thanks to Dependabot.

Thanks to above GitHub users for their contributions and translators for their translations.
