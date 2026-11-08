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

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/949636c326b7566b6d96d15bfdfe1fce3ab1090a">REST access by WeKan's role table, and ParentBleed, HashBleed, ErrorBleed and AssignedBleed fixed as in WeKan</a>. Thanks to xet7.</summary>

A REST read of a whole board needs a role that sees every card, so an
assigned-only member gets 403 (AssignedBleed); a write needs the role's write
capability, comments the comment capability, and an assigned-only member
comments only on cards assigned to them. The UI's writes and moves, a copy to
another board and attachment writes use the same rule, and a Worker still
moves cards. A `parentId` on a board the caller cannot see is refused - bulk
create answers `{index, error: Forbidden}` for that entry alone (ParentBleed);
members add/remove need the body action to be the route's own verb
(HashBleed); `cards_count` of a board and a list answers a non-member 403
(ErrorBleed). Refusals go to WeKan's `eventlog` as one summary row per problem,
the shape Admin Panel -> Problems reads, and a high-severity attempt disables
the account, as in WeKan. Go tests pin each, with negative tests over the whole
package; eight more of WeKan's own tests run against Weddy
(<a href="https://github.com/wekan/weddy/commit/bcf07ec3d1f1a0a763008b4d8256cc492c602fd2">wekan-specs.txt</a>), 52 tests in all.

</details>

- [Card dependencies, and a card's dueComplete, stickers and locations in the REST API](https://github.com/wekan/caddy-wekan-plugin/commit/2c21caa22cc51561e06b58c3e9f83c87fa3e1951) - in WeKan's shape and with its role rules; three more of WeKan's own tests run against Weddy (<a href="https://github.com/wekan/weddy/commit/79ebb667f1f4efb952053cd6af22fdd3ff868050">wekan-specs.txt</a>), 55 tests in all. Thanks to xet7.

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/4272934315fe0119ca2cf62a976a1650c9fb5f4e">Rules, board export and import, and deleting a board in the REST API</a>. Thanks to xet7.</summary>

Rules with their triggers and actions as WeKan's rules engine reads them - a
board admin writes them, an edit never changes a part another rule shares, and
their documents are flat named fields, never an operator or a path. The export
is WeKan's `wekan-board-1.0.0`, with or without attachment files, and the import
makes a new board of the caller from one, from WeKan or from Weddy, with new
ids and every reference following them. Both pass WeKan's import/export
boundary: markup in text removed as its `sanitizeInput` does, secret-looking
fields never leaving. Four more of WeKan's own tests run against Weddy
(<a href="https://github.com/wekan/weddy/commit/0c467452f00d7ee58bbcdf08e595f6a7f2986fbe">wekan-specs.txt</a>), 59 tests in all.

</details>

- [Card copies take subtasks and comments along, linked cards, and board copies with their webhooks and rules in the REST API](https://github.com/wekan/caddy-wekan-plugin/commit/09e2b04247d77ace1d1bd287dfd6dd08196e5d73); four more of WeKan's own tests run against Weddy (<a href="https://github.com/wekan/weddy/commit/10535c76c729988c6a9d00911b6176ef04d860ca">wekan-specs.txt</a>), 63 tests in all. Thanks to xet7.
- [Checklist items and comments one by one, card archive, assignees, custom field values, and cards by swimlane, by field and by id in the REST API](https://github.com/wekan/caddy-wekan-plugin/commit/8fb404aa88bd4caa117db76c5769f1b6042e5ffe) - a comment changed only by its author or a board admin, as WeKan's GHSA-pqr4-rxgp-hv2m fix. Thanks to xet7.
- [Lists and swimlanes archived, copied and moved, and cards moved to another board in the REST API](https://github.com/wekan/caddy-wekan-plugin/commit/c30b10f04a29e8b46627f230a4af7954027f0558) - on another board labels by name, a card number there, only that board's members and custom fields, and the comments, checklists and attachments along. Thanks to xet7.
- [A member's role by WeKan's role names or flags, the board's title, and the boards and their count for a site admin in the REST API](https://github.com/wekan/caddy-wekan-plugin/commit/ab30f2bd657d86eea741cda7b6bb5536d5b297f9). Thanks to xet7.
- [A board's attachments listed, soft-deleted, restored and exported in the REST API](https://github.com/wekan/caddy-wekan-plugin/commit/62a96c28b0a2bb0bf0d37ea59d12862b99a64fa9), as WeKan's attachments.softDelete and restore. Thanks to xet7.
- [Editing a custom field and its dropdown items in the REST API](https://github.com/wekan/caddy-wekan-plugin/commit/2a999227e5a52d7d5fe7ceafc0013c09145b46ba) - written without the positional $ operator, which the embedded FerretDB has not. Thanks to xet7.
- [A board's webhooks in the REST API, with WeKan's SSRF guard ported](https://github.com/wekan/caddy-wekan-plugin/commit/34acc8a8e34c0f7d0a96218869907ac0fcaf08c3) - the URL only for a board admin (HookUrlBleed), never an internal address (GHSA-hc3x-hq3m-663q). Thanks to xet7.
- [Users for a site admin, login tokens made and deleted, and /api/user in the REST API](https://github.com/wekan/caddy-wekan-plugin/commit/e7fc6247869413d62e72c43667450e7477331cc1) - never a password hash or token in an answer (GHSA-6qpx-x7vr-p9w6), a token for another user only with a reason that is kept. Thanks to xet7.
- [A board's domains, and Admin Panel's settings in the REST API](https://github.com/wekan/caddy-wekan-plugin/commit/6675edd1be999d9d83648a922ef0985e2a4777ca) - only WeKan's REST settings, never the SMTP credentials. Thanks to xet7.
- [Admin Panel -> Problems in the REST API](https://github.com/wekan/caddy-wekan-plugin/commit/76f2f39222ee86af333ba18c0482c0c9b67affb3) - the overview, each stream's rows and acknowledging, with the security stream Weddy's guards write. Thanks to xet7.
- [The board as CSV and TSV](https://github.com/wekan/caddy-wekan-plugin/commit/83292157b28c250c25cae8c1c67d888c3c629470), [as an iCalendar feed](https://github.com/wekan/caddy-wekan-plugin/commit/fdad086582773c45146bde1bb80a2d3fe360bdbe), and [an iCalendar file imported as cards](https://github.com/wekan/caddy-wekan-plugin/commit/a6f6346734aae6257cbfb2386e609441d4c53ae6) in the REST API, as Node.js WeKan writes and reads them - a spreadsheet formula never left to run. Thanks to xet7.
- [The board as a .zip](https://github.com/wekan/caddy-wekan-plugin/commit/0f8d2b6da4b8557537319fbaebd86da26f0fab6b) - wekan.json and the attachments as files, no entry pointing out of the zip - and [all of a user's boards in one .zip](https://github.com/wekan/caddy-wekan-plugin/commit/c25af3e7284cf4d29e4829f642302d6951d6a70d) as WeKan JSON, CSV or TSV, in the REST API. Thanks to xet7.
- [The order of the card details' sections](https://github.com/wekan/caddy-wekan-plugin/commit/bea113f62354bb88d2fdeaf818f2972cb9e984d1) and [a board's view settings](https://github.com/wekan/caddy-wekan-plugin/commit/bf035829302b00b0981725425d7d0c2bf9315b0a) in the REST API, with WeKan's cardFieldOrder.js and boardViewSettings.js ported and tested against what WeKan's modules answer. Thanks to xet7.
- [A .zip of WeKan's export imported as a new board or into a board in the REST API](https://github.com/wekan/caddy-wekan-plugin/commit/f106ab44740bd9073a8ec6fe01abd8e9a416f2bb) - ZipBleed and ZipBombBleed kept out as in WeKan, and WeKan's own .zip export's files found by name. Thanks to xet7.
- [The board's sidebar, its board menu and Export, with WeKan's class names](https://github.com/wekan/caddy-wekan-plugin/commit/ba036e003b0dbcbb8e07a30a6fe7a3452402e527) - the export pop-over's JSON, .zip, CSV, TSV and iCalendar downloads; WeKan's own board menu export test runs against Weddy (<a href="https://github.com/wekan/weddy/commit/3a93e5a02c15e907eacabbe764ff897774e542f5">wekan-specs.txt</a>), 64 tests in all - every test of WeKan's REST specs 17 and 23. Thanks to xet7.
- [Comments and activities in the pages, in WeKan's words](https://github.com/wekan/caddy-wekan-plugin/commit/1de4d8e8a5a64cf48c0faf216594607f1eb9c152) - the card's comment form and comments, its Activities section and the board admin's activities; six of WeKan's own tests run against Weddy (<a href="https://github.com/wekan/weddy/commit/85d3e169800871482e4f47ca925cde79f7126a09">wekan-specs.txt</a>), 70 tests in all. Thanks to xet7.
- [The card's members from the card details, and one pop-over at a time made from its template, as in WeKan](https://github.com/wekan/caddy-wekan-plugin/commit/7acbcbcb7d7d6fb149a0f41d8d3098b53479467d); WeKan's #6658 card member test runs against Weddy (<a href="https://github.com/wekan/weddy/commit/3b0773af2fe5a43091dd8905f05f51da3ecff0fe">wekan-specs.txt</a>), 71 tests in all. Thanks to xet7.
- [Notifications as Node.js WeKan makes them, and the header's indicator](https://github.com/wekan/caddy-wekan-plugin/commit/39cec612db9ebbae03b21cb912ced75276599389) - who an activity notifies, each once, with #6658's muting; WeKan's notification tests run against Weddy (<a href="https://github.com/wekan/weddy/commit/af805296ae880be5a311bf1aacd834a4094aac30">wekan-specs.txt</a>), 73 tests in all. Thanks to xet7.
- [Votes and watching from the pages, and WeKan's Meteor methods from the browser](https://github.com/wekan/caddy-wekan-plugin/commit/adc2fa72e9ab82387411180a2c4843a1a085376a) - Meteor.call and Meteor.callAsync reach the methods Weddy has, setLanguage first; seven of WeKan's voting and watching tests run against Weddy (<a href="https://github.com/wekan/weddy/commit/c8a132ccc7e8f39318023d90f913645f680b6526">wekan-specs.txt</a>), 80 tests in all. Thanks to xet7.

**Release** - what a release says it is made of.

- [NetBSD/amd64 builds: go-systemd v22.6.0 for NetBSD, without the function x/sys cannot build there](https://github.com/wekan/weddy/commit/486ba1828013577ff0609b5ef7d31cfea8fff5d3); 19 of 20 platforms build. Thanks to xet7.
- [Local builds build xcaddy for this computer, so Windows, macOS and the BSDs build too](https://github.com/wekan/weddy/commit/6a08aa37ae585b7aff817b4ff4f12b596c2211f7). Thanks to xet7.
- [The release notes list caddy-ferretdb-plugin and wekan/FerretDB with their commits](https://github.com/wekan/weddy/commit/97cb0638e351f02dc87ea1a0cb830afe1b0f5eec). Thanks to xet7.

**Many domains** - the Cloud Panel, in Weddy.

- [Many WeKan domains from one Weddy, with the Cloud Panel](https://github.com/wekan/weddy/commit/ab862c2e81d0caa20f453ebe7f54d462b3a2c076). Thanks to xet7.

and fixes the following bugs:

- [A local rebuild of the same Weddy commit replaces its .xz instead of failing](https://github.com/wekan/weddy/commit/b6fff13a19ecbd9c659dce3422edf94432c373de). Thanks to xet7.

and fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

- [Gitea in Weddy: the container tag list's allocation from ?n=, 32-bit wraps, and credentials in the access log](https://github.com/wekan/caddy-gitea-plugin/commit/1cf3aca662f297881b2c47486c1ed80bb5c432f2) - as caddy-gitea-plugin's dist/gitea/security-hardening.patch; the other alerts in Gitea's code are reviewed in its [Hall of Fame](https://github.com/wekan/caddy-gitea-plugin/wiki/Hall-of-Fame). Thanks to GitHub CodeQL and xet7.
- [WeKan in Weddy: request values only through $eq, bounded argon2, Secure cookies](https://github.com/wekan/caddy-wekan-plugin/commit/1a1c8fb30f7e22e8fb4274c772b6556bbaf7478a) - see caddy-wekan-plugin's [Hall of Fame](https://github.com/wekan/caddy-wekan-plugin/wiki/Hall-of-Fame). Thanks to GitHub CodeQL and xet7.
- [Weddy's own scripts: a linear pattern in sync-from-wekan.py](https://github.com/wekan/weddy/commit/90f1439a41c532f0df37b92a46a25ca39958076e), and [Meteor's pre-hash in the test helper with Web Crypto, as WeKan's #599](https://github.com/wekan/weddy/commit/9b0bd53fbfd486ad8380dfb0f6b88e915187158c) - see Weddy's [Hall of Fame](https://github.com/wekan/weddy/wiki/Hall-of-Fame). Thanks to GitHub CodeQL and xet7.

and fixes the following SECURITY ISSUES found by Dependabot:

- [No go-jose v3 in any plugin: go.step.sm/crypto v0.92.0 and smallstep/certificates at Caddy master's commit](https://github.com/wekan/caddy-wekan-plugin/commit/1a1c8fb30f7e22e8fb4274c772b6556bbaf7478a) - go-jose v3 <= 3.0.5 ([GHSA-mgcc-cww5-fp2q](https://github.com/advisories/GHSA-mgcc-cww5-fp2q), [GHSA-4w3g-jfj2-cw2q](https://github.com/advisories/GHSA-4w3g-jfj2-cw2q), [GHSA-vvm8-gf78-28g4](https://github.com/advisories/GHSA-vvm8-gf78-28g4)) has no patched release; also in [caddy-ferretdb-plugin](https://github.com/wekan/caddy-ferretdb-plugin/commit/926d05287ddb43c3dec197f1d979215f456a006c), [caddy-gitea-plugin](https://github.com/wekan/caddy-gitea-plugin/commit/7701fabcfaf1d1962d70d57652958ca1b76667cb) and [caddy-rclone-plugin](https://github.com/wekan/caddy-rclone-plugin/commit/7e06669906020a1ef0a96d7f41c9578790e1fd95). Thanks to Dependabot.

Thanks to above GitHub users for their contributions and translators for their translations.
