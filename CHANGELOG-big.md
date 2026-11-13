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
Gitea's own. WeKan's fixes of **CrossBoardExportBleed**, **ListLockBleed**,
**ListLockAttachBleed**, **GroupLinkBleed**, **UploadBleed**, **StampBleed**, **AdminFieldBleed** and **FrameBleed** hold in Weddy too, and refused attacks show in **Problems**.
WeKan's **change history** and **Scrum** sprints and reports are in Weddy too.

This release fixes the following CRITICAL SECURITY ISSUES:

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/b29d36a22ece67a92d3b97c3ec8887891d6258ec">WeKan in Weddy: every export follows Admin Panel's export switch</a>. Thanks to xet7.</summary>

[CrossBoardExportBleed](https://wekan.fi/hall-of-fame/crossboardexportbleed/).
Node.js WeKan's Admin Panel can turn all export off (`disableAllExport`,
[GHSA-8885-xrq4-j47h](https://github.com/wekan/wekan/security/advisories/GHSA-8885-xrq4-j47h)).
Weddy shares that settings document but never read it, so with export off,
Weddy still exported boards, cards, attachments, calendars and all boards at
once. Every export route now answers 403 first, and the attempt is in Admin
Panel -> Problems as `authz.export-disabled`, never disabling the account. A
test asks all ten routes with the switch on and off, and the negative test
fails on any export route registered without the switch.

</details>

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/f0c5e19c9f00196420182a83d306a3b065611187">WeKan in Weddy: Anonymize export users holds for every export</a>. Thanks to xet7.</summary>

With Admin Panel -> Anonymize export users on, Weddy's exports still named
every user. The JSON, ZIP, all-boards, CSV/TSV, Excel, PDF and calendar
exports now write user1, user2 ... for usernames, full names and initials, drop
avatars, and rewrite @mentions and requested-by / assigned-by, as WeKan's
`anonymizeExportIdentities`; copying a board keeps its names. A test finds no
real name in nine exports, and the negative test fails on any export function
that reads users without the anonymizer.

</details>

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/aa415a97cee1b79d715418483659b1b81a378b8d">WeKan in Weddy: a list that refuses a role refuses it every write in that list</a>. Thanks to tsurutanmen and xet7.</summary>

[ListLockBleed](https://wekan.fi/hall-of-fame/listlockbleed/),
[GHSA-4734-8vrg-8j3w](https://github.com/wekan/wekan/security/advisories/GHSA-4734-8vrg-8j3w).
Weddy shares WeKan's database but never read a list's role exceptions
(WeKan's #4527), so a list a board admin locked in WeKan was open to every
write through Weddy. Every card write now asks the card's list - edits,
deletes, members, labels, checklists, attachments, custom fields, comments,
new cards, copies, moves in and out, bulk routes and methods - and answers
403. A refusal shows in Admin Panel -> Problems and never disables the
account. WeKan's checklist rename (#1037) is added too.
`TestEveryCardWriteAsksTheList` fails on any card write route that does not
ask the list, and WeKan's own ListLockBleed spec
([synced](https://github.com/wekan/weddy/commit/60fa295d1caeda818d09a56abf963dfb931ed32f)) passes against Weddy.

</details>

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/09f82f22d4736d196c3b14c34786f1da04248009">WeKan in Weddy: a list's refusal holds for the attachment API, and its guard says so</a>. Thanks to Furkan Derse and xet7.</summary>

[ListLockAttachBleed](https://wekan.fi/hall-of-fame/listlockattachbleed/).
In WeKan the attachment API's upload, delete, copy and move asked the board
but not the card's list, so a member a list refused still added and removed
its cards' files. Weddy was not affected: its attachment upload and delete
already ask the list, and it has no copy or move. But its guard had the same
blind spot as WeKan's: it read only routes with the card in the path, and
`/api/attachment/upload` and `/api/attachment/delete/{id}` name their card
in the body or by the file. `TestEveryCardWriteAsksTheList` reads them now,
and `TestListLock` refuses an upload to and a delete from a locked list's
card, over REST and `api.attachment.delete`, and still takes an upload in an
open list.

</details>

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/1846e7eb7ff1d33b49d6af1cc7713f7aaf9191c5">WeKan in Weddy: its pages refuse to be framed by another site</a>. Thanks to xet7.</summary>

[FrameBleed](https://wekan.fi/hall-of-fame/framebleed/). Weddy's pages carried
no framing header at all, so any site could load a signed-in user's WeKan in an
invisible frame and have them click through it - what Node.js WeKan fixed again
on 2026-10-02. Every response of every domain now gets `Content-Security-Policy:
frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN`, on unless
`BROWSER_POLICY_ENABLED` is `false`, and `TRUSTED_URL` names the origins that
may frame it, as in WeKan. A file keeps its own stricter policy, on its 304s
too. There is nothing for Admin Panel -> Problems: the browser refuses the
frame, so the attempt never reaches the server. The tests check every kind of
answer, and the negative test fails on a route that adds a second policy or
on anything answering past `Server.ServeHTTP`. WeKan's own FrameBleed spec
passes against Weddy.

</details>

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/9f7279918d25b1951a10761921f31d6f6ee615a4">WeKan in Weddy: refused attacks are in Admin Panel - Problems, and cost the account</a>. Thanks to xet7.</summary>

Weddy refused [PrototypeBleed](https://wekan.fi/hall-of-fame/prototypebleed/),
[RepointBleed](https://wekan.fi/hall-of-fame/repointbleed/),
[BackgroundBleed](https://wekan.fi/hall-of-fame/backgroundbleed/) and
[HookBleed](https://wekan.fi/hall-of-fame/hookbleed/) attempts without a word,
so nobody could see somebody had tried, and the account kept working. Each is
now recorded under WeKan's key and disables the sender's account, as WeKan's
guards do: a `__proto__`, `.` or `$` layout key, a client write moving a
trigger, rule, action, webhook or custom field to another board, a background
pointed at another board's file, and anything but the card-opened notice sent
through a board's webhook - by the new `outgoingWebhooks`, which builds that
notice from the stored webhook and the card alone. The ordinary call beside
each is not recorded. The negative test fails on a database path built from a
request's value without the guard. WeKan's own BackgroundBleed, HookBleed,
PrototypeBleed and RepointBleed specs pass against Weddy.

</details>

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/c19e7e19c80ab1c0fb42d46c9a100980c57fcad6">WeKan in Weddy: the REST API no longer sends a member an admin-only field's value</a>. Thanks to xet7.</summary>

[AdminFieldBleed](https://wekan.fi/hall-of-fame/adminfieldbleed/). Weddy's card
page hid admin-only custom fields, but the REST API sent the card whole, so any
member of the board read a value an admin had hidden, and could search for a
guessed one. As in WeKan, only an admin of the card's board reads the value: a
member gets the field with the value null, the card's integrity digests too, and
searching by such a field is 403. The negative test asks every GET route of the
REST API, read from the source, as an ordinary member.

</details>

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/5e1f311052014f29f7bf68d5504f5ad7d9222697">WeKan in Weddy: copyBoard and copyCard change only the copy, never the source</a>. Thanks to xet7.</summary>

[CopyIdentityBleed](https://wekan.fi/hall-of-fame/copyidentitybleed/). WeKan's
board menu and copy dialog copy with these two methods, which Weddy had not got.
They now copy as WeKan's do: the caller changes a board copy's title, sort, type
and parts, or a card copy's title and description, and nothing else - an `_id`
once made WeKan copy another, private, board or card. Anything else is refused
before anything is read, recorded, and costs the account; a wrong type is
refused unrecorded. A board copy keeps its members exactly, and a card copy
goes only to a swimlane and list of its destination board. WeKan's
board-copy-boundary, card-copy-boundary and card-copy-destination specs pass
against Weddy.

</details>

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/36355b5d49c21d284daaaf0292b812580949f5cc">WeKan in Weddy: a board's teams and members are written only past their checks</a>. Thanks to bhaswanthc and xet7.</summary>

[GroupLinkBleed](https://wekan.fi/hall-of-fame/grouplinkbleed/)
([GHSA-v544-rmr5-38gx](https://github.com/wekan/wekan/security/advisories/GHSA-v544-rmr5-38gx)).
Weddy had neither WeKan's setBoardTeams nor the board collection write. Both
are in now, as WeKan's: setBoardTeams adds only the admin's own teams and
reconciles the members, and a client board write naming organizations, teams
or domains, or adding a member past inviteUserToBoard, is refused and recorded
in Admin Panel -> Problems as GroupLinkBleed, without disabling the account; a
board admin's change of a member's role still works. A new member that
setBoardTeams lists must also belong to one of the board's teams. WeKan's
group-link-bleed spec passes against Weddy.

</details>

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/5552c9b2fc1d3b9d918ac31484bd452173bec659">WeKan in Weddy: an upload or a checklist goes only where its card is</a>. Thanks to xet7.</summary>

[UploadBleed](https://wekan.fi/hall-of-fame/uploadbleed/) and
[StampBleed](https://wekan.fi/hall-of-fame/stampbleed/). Weddy had neither
Meteor-Files' DDP upload, which WeKan's client uses, nor the checklist
collection insert. Both are in now, as WeKan's: every upload call is
authorized, an upload onto another board's card is UploadBleed, and an
upload or a checklist on one's own card stamped with another board is
StampBleed - refused, recorded in Admin Panel -> Problems, and a signed-in
upload attempt blocks the account. Admin Panel's upload switches now stop the
uploads they name, which Weddy did not read. WeKan's upload-stamp-bleed spec
passes against Weddy.

</details>

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/1159c1bdc5978b88ecfeafb74991339f201ae898">WeKan in Weddy: an admin-only custom field's value is changed and copied only by an admin</a>. Thanks to xet7.</summary>

[AdminFieldBleed](https://wekan.fi/hall-of-fame/adminfieldbleed/). Weddy hid
an admin-only value from a member but did not stop them writing it, and a
member's copy of a card carried the value onto a card they could read it from.
Every card write is now checked as WeKan's: a change to a value the writer may
not read, or a read-only value of an admin's, is refused and recorded in Admin
Panel -> Problems, whether through the card collection, a copy, the REST API
or a field's definition; a copy keeps only the fields its copier may read, and
a member still edits a public value. Nine of WeKan's admin-only-custom-fields
tests pass against Weddy.

</details>

<details>
<summary><a href="https://github.com/wekan/caddy-wekan-plugin/commit/a4123a9dff7fdd3a2b623da29283891ec60d51e8">WeKan in Weddy: a checklist moved into another board is in Problems</a>. Thanks to xet7.</summary>

ChecklistBleed (wekan/wekan#6813). A client update moving a checklist or an
item into a card of a board the mover cannot write to was refused but not
recorded; it is now WeKan's canary in Admin Panel -> Problems, never costing
the account, while a drag within one's own board is not. WeKan's
checklist-same-board-canary spec passes against Weddy - its setup needed the
positional `$` update operator, [now in FerretDB](https://github.com/wekan/FerretDB/commit/feb557e54bb0b95b5647875ac940225f77cbfc87).

</details>

and adds the following new features:

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
- [Planning Poker in the card details, and WeKan's cards.pokerVote method](https://github.com/wekan/caddy-wekan-plugin/commit/82bd6b34a53e7e7df3bebf1a9eca9c4cd818ebff); WeKan's Planning Poker test runs against Weddy (<a href="https://github.com/wekan/weddy/commit/b80be71a537854a3f6a88ec62f72c2d1a89a2f67">wekan-specs.txt</a>), 81 tests in all - every test of spec 14. Thanks to xet7.
- [A list folds per user and swimlane, and stays folded after a reload](https://github.com/wekan/caddy-wekan-plugin/commit/7c544cad79910418779fbeef25ece04f43b8dc32), as WeKan's setListCollapsedState; WeKan's #6712 test runs against Weddy (<a href="https://github.com/wekan/weddy/commit/657aecd05fc21030476edddee4219a7035cf886b">wekan-specs.txt</a>), 82 tests in all. Thanks to xet7.
- [A board's star, kept in the user's favorites, and All Boards' Starred section](https://github.com/wekan/caddy-wekan-plugin/commit/190425af44c0875d35837a231fb480a6ce927736) - a stale star never brings back a board that turned private; WeKan's #6713 test runs against Weddy (<a href="https://github.com/wekan/weddy/commit/14ee454dcf8fb9bdeb92d4993d65b16ae5939a48">wekan-specs.txt</a>), 83 tests in all. Thanks to xet7.
- [Requested By and Assigned By in the card details](https://github.com/wekan/caddy-wekan-plugin/commit/9a2c0f6d5896533f3ad716aa46da224c75bf9102), with WeKan's Edit or Add; every test of WeKan's spec 16 runs against Weddy (<a href="https://github.com/wekan/weddy/commit/3b1dec4732ffcc7ca449bd0ca5e589db2d66b073">wekan-specs.txt</a>), 89 tests in all. Thanks to xet7.
- [WeKan's /checklists/remove: a checklist goes with its items, only its own](https://github.com/wekan/caddy-wekan-plugin/commit/a4f0d400684f46e788ce766ca88c9186fd4754c0) (#6816); 7 of the 8 checklist tests of WeKan's spec 12 run against Weddy (<a href="https://github.com/wekan/weddy/commit/6048ccf00e2e638986c7813963722a8cb7f77b96">wekan-specs.txt</a>), 96 tests in all. Thanks to xet7.
- [31 more WeKan tests that already passed against Weddy are listed](https://github.com/wekan/weddy/commit/7ecb6e28ba1629c820038fbb6dee42ebc03db470), found from a run of every WeKan spec and each checked again to have passed, not been skipped - 127 tests in all. Thanks to xet7.
- [The site's settings document exists from the start, with WeKan's defaults](https://github.com/wekan/caddy-wekan-plugin/commit/06c431d5a46dfb669a54e1e732a4fbc3d06d7f60), as Node.js WeKan makes it, so WeKan's tests and tools that read it find it. Thanks to xet7.
- [A swimlane's + adds a swimlane below or above it](https://github.com/wekan/caddy-wekan-plugin/commit/a22ad0203b364d5d264d8ac35d4ed327f888184f), WeKan's swimlaneAddPopup; [59 more WeKan tests that pass against Weddy are listed](https://github.com/wekan/weddy/commit/ff0faa48b587a44116e87d0c6523aaa92df786a2) - those inside a describe block were never matched before - 186 tests in all. Thanks to xet7.
- [CreateBleed and the private-only policy on every path that makes a board; createBoardWithInitialSwimlanes](https://github.com/wekan/caddy-wekan-plugin/commit/ebafdf1ef69be524552a3135f6751befb8b8d1b6) - Weddy lacked WeKan's admin-only board creation switch; refusals recorded, never blocking. Thanks to xet7.
- [Boards visible to signed-in users, and the board's visibility changed from its header](https://github.com/wekan/caddy-wekan-plugin/commit/21ee5ae6a42b0f1cc2c6aa4b70cacc5d38eebdf5) (#3249); WeKan's instance board visibility test runs against Weddy (<a href="https://github.com/wekan/weddy/commit/7d13af0bf0c3a68fdfd5a8476888d5159e0dfac6">wekan-specs.txt</a>), 248 tests in all. Thanks to xet7.
- [A card's labels, and a new label, from the card details](https://github.com/wekan/caddy-wekan-plugin/commit/dd217f7f5a5bb32c8af0d804d612dc79858f6e21) - a new label for a board admin only (#5819); WeKan's card label tests run against Weddy (<a href="https://github.com/wekan/weddy/commit/aea78422052a79a1190fde67d1dd758d8ec74fa2">wekan-specs.txt</a>), 251 tests in all. Thanks to xet7.
- [The card's Move and Copy, as WeKan's moveCardPopup and copyCardPopup](https://github.com/wekan/caddy-wekan-plugin/commit/619c710895955e3b5fced294f2de218f0480e9b5) - a board the user may change, a copy only of a card they may copy; 5 of the tests of WeKan's spec 03 run against Weddy (<a href="https://github.com/wekan/weddy/commit/2046342731d90c4de406066b2cfe72bec1e6f2cf">wekan-specs.txt</a>), 256 tests in all. Thanks to xet7.
- [Add Card to Top or Bottom of List, and a card composer that is there only while open](https://github.com/wekan/caddy-wekan-plugin/commit/2ea5fd7e1c5c0a2f20daae77ca137f85ed88eb64); WeKan's add-to-top and add-to-bottom tests run against Weddy (<a href="https://github.com/wekan/weddy/commit/ea7476e5e1f773895203f6cb641e0aafab79870d">wekan-specs.txt</a>), 258 tests in all. Thanks to xet7.
- [The card's list picker, as WeKan's card-details-list-picker](https://github.com/wekan/caddy-wekan-plugin/commit/447b2af64583ffa248d5af9a045ff560d0e884c1); WeKan's list-selector test runs against Weddy (<a href="https://github.com/wekan/weddy/commit/5e2ec974f34548b0939878834afaf2a37b86b33a">wekan-specs.txt</a>), 259 tests in all. Thanks to xet7.
- [The board's Archive in its sidebar, as WeKan's archivesSidebar; every pop-over has its template](https://github.com/wekan/caddy-wekan-plugin/commit/a291c5fb232c088ae0323f53840696dba3372d8c); WeKan's restore-from-the-archives test runs against Weddy (<a href="https://github.com/wekan/weddy/commit/bffe4302925ea2459a65a500106e8f8a390d7b2e">wekan-specs.txt</a>), 260 tests in all. Thanks to xet7.
- [Multi-Selection to the Archive, with WeKan's archiveSelectedCards and its card check; pop-overs outlast other changes](https://github.com/wekan/caddy-wekan-plugin/commit/efbc975610d1d74f477b06f5660cf53f82c2b5bc) - an assigned-only member archives only their own cards (GHSA-6xqf-jh8x-4wxc); WeKan's multi-selection archive test runs against Weddy (<a href="https://github.com/wekan/weddy/commit/37530144849d6030d29829b79977a423acd41835">wekan-specs.txt</a>), 261 tests in all. Thanks to xet7.
- [The notifications drawer, as WeKan's notificationsDrawer](https://github.com/wekan/caddy-wekan-plugin/commit/ab3e5135cf2a9a83bc3fc012415fa6b7d55a7992) - only boards the user may still read; WeKan's drawer tests run against Weddy (<a href="https://github.com/wekan/weddy/commit/a6e3c86d451e38dffeec0d606d93a5612ac05618">wekan-specs.txt</a>), 263 tests in all. Thanks to xet7.
- [Watching a list from its menu, with WeKan's watch method](https://github.com/wekan/caddy-wekan-plugin/commit/5c86b0cc5082ee71199053fbc36c2e09dcb07494). Thanks to xet7.
- [Notifications by e-mail, as WeKan decides them](https://github.com/wekan/caddy-wekan-plugin/commit/9342c0e532bf5362acde3eda11e197fd6bf1a727) - the member's, the board's, then Admin Panel's choice. Thanks to xet7.
- [WeKan's updateListSort and /lists/update, and Meteor.apply](https://github.com/wekan/caddy-wekan-plugin/commit/79f41e101aeac86d9a968b1073c1318e87d078e1) - a read-only member gets #5462's 403 "Access denied"; WeKan's #5462 test runs against Weddy (<a href="https://github.com/wekan/weddy/commit/d93a630c22f92c07e899199360ec9063003daf2b">wekan-specs.txt</a>), 187 tests in all. Thanks to xet7.
- [WeKan's moveList method, by whoever may change both boards](https://github.com/wekan/caddy-wekan-plugin/commit/fd3c95248af8b5380a0f913e732bd24bdad3b438); WeKan's spec 68 runs against Weddy (<a href="https://github.com/wekan/weddy/commit/1e01484eb659a75e023d94ae10fb087a37105624">wekan-specs.txt</a>), 188 tests in all. Thanks to xet7.
- [LinkedWriteBleed, REST sibling: a card link needs the right to change its source](https://github.com/wekan/caddy-wekan-plugin/commit/8d1cd0ec4a15aed333a3958962ea5783db78cb20), recorded in Admin Panel -> Problems without disabling the account; WeKan's REST LinkedWriteBleed test runs against Weddy (<a href="https://github.com/wekan/weddy/commit/9a1e679ceec20b02912aee7b5ce7f26c81a7d3f0">wekan-specs.txt</a>), 189 tests in all. Thanks to xet7.
- [WeKan's /card_comments/insert, with its comment boundary](https://github.com/wekan/caddy-wekan-plugin/commit/d55e054a78ada5fd3bea1699cf3f8717fe631d9f) - a card of another board is refused and recorded as CommentBoundaryBleed; WeKan's spec 69 runs against Weddy (<a href="https://github.com/wekan/weddy/commit/fcc2b39d4923a29b71a584940c36493f4a2fe1a0">wekan-specs.txt</a>), 190 tests in all. Thanks to xet7.
- [Outgoing e-mail, and WeKan's sendInvitation with its board check](https://github.com/wekan/caddy-wekan-plugin/commit/dbcd54ea22bf104d3ccef22558c1b0cf7e88c2e7) - MAIL_URL or Admin Panel's mail server, no header injection, InvitationBoardBleed recorded; [run.sh gives Weddy a local mail server](https://github.com/wekan/weddy/commit/68a7f3cffdb91f58a6005538403be25cf05597b4), so WeKan's mail specs run, and spec 73 passes - 191 tests in all. Thanks to xet7.
- [Signing up with an invitation code, and joining its boards](https://github.com/wekan/caddy-wekan-plugin/commit/710046b8ebb194a57d291a7b0125e8884377b883) - only the code of that very address, once; a wrong code is recorded as InviteBleed. Thanks to xet7.
- [E-mail verification links, and a forgotten password reset by mail](https://github.com/wekan/caddy-wekan-plugin/commit/51be7def25f0b7b0c3c35ca54975e2c2b61df663) - the same answer for an unknown address, one mail a minute, other sessions signed out; WeKan's spec 39 runs against Weddy (<a href="https://github.com/wekan/weddy/commit/83a8ff8df242a4ae05c5e623949aaf2f23240258">wekan-specs.txt</a>), 193 tests in all. Thanks to xet7.
- [Invitations in the sidebar, accepted or declined; a client cannot write one](https://github.com/wekan/caddy-wekan-plugin/commit/49b58a80182907ff546096ff9be37a7fdd31782c) - InviteProfileBleed recorded; every test of WeKan's spec 72 runs against Weddy (<a href="https://github.com/wekan/weddy/commit/3676d3b67d08d13c406632c7f016ef14cad6722c">wekan-specs.txt</a>), 196 tests in all. Thanks to xet7.
- [The header's member menu and Edit Profile, and WeKan's setEmail](https://github.com/wekan/caddy-wekan-plugin/commit/70ec140a7436f9ee7a70aeaabcf5f9eb0c416b66) - a user's own address only while Admin Panel allows it; WeKan's #2445 test runs against Weddy (<a href="https://github.com/wekan/weddy/commit/a5edf8e069c93c3bcb68bc8f12b860a0c9d51dd8">wekan-specs.txt</a>), 197 tests in all. Thanks to xet7.
- [WeKan's rules run: an activity starts the rules its triggers match, and rules.runButton](https://github.com/wekan/caddy-wekan-plugin/commit/d80a5b581e5b793653d6aa949441d7815a01ce68) - moves, archive, labels, people, checklists, cards, comments and dates; RuleBleed, RuleButtonBleed and rule loops recorded; WeKan's spec 71 runs against Weddy (<a href="https://github.com/wekan/weddy/commit/e8269c5cb8c62941fbac96fd63cccca41e388320">wekan-specs.txt</a>), 198 tests in all. Thanks to xet7.
- [The board's and the card's rule buttons](https://github.com/wekan/caddy-wekan-plugin/commit/51b8fffb9109fffbc02bb2fb32898d68ed4bec74), as WeKan's boardButtons and cardButtons, run with rules.runButton. Thanks to xet7.
- [WeKan's rules.createRule, with RuleBleed's destination check, and a rule action's own board kept](https://github.com/wekan/caddy-wekan-plugin/commit/bb5d61d69f5dce5c54d30aaf67c2468b3806821d); WeKan's RuleBleed test runs against Weddy (<a href="https://github.com/wekan/weddy/commit/676e046f8c22bb5ee88daa6d607c4a16a279019d">wekan-specs.txt</a>), 199 tests in all. Thanks to xet7.
- [WeKan's Rules page: the board's rules, and the wizard that makes one](https://github.com/wekan/caddy-wekan-plugin/commit/04c8a99c564c986d2f2cb5cc23ccd3ac81eacab0) - board and button triggers, board and card actions; 5 of the tests of WeKan's spec 20 run against Weddy (<a href="https://github.com/wekan/weddy/commit/ebc5a46923d611db3c9075af26250a8ed48f5d6d">wekan-specs.txt</a>), 203 tests in all. Thanks to xet7.
- [The Rules page's card and checklist triggers, checklist actions, rule details and selection](https://github.com/wekan/caddy-wekan-plugin/commit/671ecbbd43508682e317f40a2edf205e19d05e5f); 10 of the tests of WeKan's rules specs 20 and 44 run against Weddy (<a href="https://github.com/wekan/weddy/commit/f2d4617207cdc57fcd5bc57aaa5bb443d0f54fa3">wekan-specs.txt</a>), 208 tests in all. Thanks to xet7.
- [The Rules page's Board Settings entries, Import / Export and the workflow view](https://github.com/wekan/caddy-wekan-plugin/commit/f54c248717a21aef8b503b1f5d02debad1c4005d) - rules exported as JSON or CSV in WeKan's format and imported through rules.createRule; 12 of the tests of WeKan's rules specs run against Weddy (<a href="https://github.com/wekan/weddy/commit/379d69d78d81c5ccf8e1952c92779ebdf2f926f4">wekan-specs.txt</a>), 210 tests in all. Thanks to xet7.
- [A rule trigger's grammar, as WeKan's ruleTriggerCopula and ruleNameBeforeSubject](https://github.com/wekan/caddy-wekan-plugin/commit/64d0900dd26e21c79211552d685e59a15913196b); WeKan's named-member tests pass in Basque, Thai and English (<a href="https://github.com/wekan/weddy/commit/a7b08b26ed17a26a044ccfb496c1fc95b830e93a">wekan-specs.txt</a>), 211 tests in all. WeKan's spec 88, the Basque rule subject order, passes too (<a href="https://github.com/wekan/weddy/commit/b4c5cc595980721539a025190a35657601e256f0">wekan-specs.txt</a>) - 212 tests in all. Thanks to xet7.
- [The board's members in the sidebar, added and removed; All Boards' sections](https://github.com/wekan/caddy-wekan-plugin/commit/3a5360f63e70c065b3dce2abaff2b08d96fff7a3) - removal by a board admin only, off the board's cards; every test of WeKan's spec 01 runs against Weddy (<a href="https://github.com/wekan/weddy/commit/dc02f6f378967963ac4a0d62a526122023d68b3f">wekan-specs.txt</a>), 219 tests in all. Thanks to xet7.
- [The card's actions menu and its Archive; a board reload never overtakes the page's own change](https://github.com/wekan/caddy-wekan-plugin/commit/dbad79ff41bad73318e4f099ea98d05347476b3f); WeKan's card archive test runs against Weddy (<a href="https://github.com/wekan/weddy/commit/53aecc179e8e7f053e95b214da7a00b2d8353547">wekan-specs.txt</a>), 220 tests in all. Thanks to xet7.
- [Renaming a board from the header, and the board's Archive with restore](https://github.com/wekan/caddy-wekan-plugin/commit/d8dd4daeee56494308d52e18d2521fe320302492); 6 of the 8 tests of WeKan's spec 15 run against Weddy (<a href="https://github.com/wekan/weddy/commit/1525357f7a767646368dce008254e7ef09abc9d4">wekan-specs.txt</a>), 222 tests in all. Thanks to xet7.
- [WeKan's Boards in Archive: the user's archived boards, restored by an admin](https://github.com/wekan/caddy-wekan-plugin/commit/017eede4ffc655feeeeea0beac661010b326c38e); WeKan's Boards in Archive test runs against Weddy (<a href="https://github.com/wekan/weddy/commit/6e4e6ddec9171be239037a50122ddc0a293a802b">wekan-specs.txt</a>), 223 tests in all. Thanks to xet7.
- [A card's title edited in place, maximized or not, and its link copied](https://github.com/wekan/caddy-wekan-plugin/commit/c74bee1cb62bbf52d61d90526fb54df0554f030b); 7 of the tests of WeKan's spec 02 run against Weddy (<a href="https://github.com/wekan/weddy/commit/759cdbe810a0ae1f53217c2bb7477b0618a0645a">wekan-specs.txt</a>), 227 tests in all. Thanks to xet7.
- [Card titles in Markdown on the minicards, as WeKan's viewer; a minicard is a block, not a link](https://github.com/wekan/caddy-wekan-plugin/commit/3b784dd37ea73a84c7f76cc364ff27481040b6fc) - raw HTML and dangerous links never run; 9 of the 11 tests of WeKan's spec 02 run against Weddy (<a href="https://github.com/wekan/weddy/commit/4265007cd9404b45c3c9b6de402616b0cac01d6a">wekan-specs.txt</a>), 229 tests in all. Thanks to xet7.
- [Emoji, and Admin Panel's text policies, in card titles, as WeKan's viewer](https://github.com/wekan/caddy-wekan-plugin/commit/7b376af1dcd2970147ac57e7f450a4dd8415ccf9); WeKan's minicard and opened card title tests run against Weddy under each policy (<a href="https://github.com/wekan/weddy/commit/1e8093b22daefce6cd6106504d6d284c9ec6adad">wekan-specs.txt</a>), 235 tests in all. Thanks to xet7.
- [Activities in Markdown and safe HTML, as WeKan's viewer; the sidebar keeps its place](https://github.com/wekan/caddy-wekan-plugin/commit/545c5e9a8e8bfc187094b418f0eaa4f44c0f5476) - HTML through bluemonday, scripts and event handlers never; WeKan's activity viewer tests run against Weddy (<a href="https://github.com/wekan/weddy/commit/bb02163ae37605963984fe1ea89b6c0eb9284e4d">wekan-specs.txt</a>), 238 tests in all. Thanks to xet7.
- [9 more WeKan tests that pass against Weddy are listed](https://github.com/wekan/weddy/commit/41f61723ee68ea93d9b5a2e25ae33f34b52f913e), from a second run of every WeKan spec, each checked again - 247 tests in all. Thanks to xet7.
- [The notifications drawer's filters: the unread ones, or all](https://github.com/wekan/caddy-wekan-plugin/commit/2db57393be1c8640eaff351db48d5930dcb7e290), as WeKan's drawer. Thanks to xet7.
- [Board and card exports as Excel and PDF](https://github.com/wekan/caddy-wekan-plugin/commit/846d7a185d208cbe7f4c20852640dca5a7d9f926), and [the board report charts as Excel and PDF](https://github.com/wekan/caddy-wekan-plugin/commit/a2ca99e5de303b8f67b1704d9d26d047a0a2d801) - Burndown, Burnup, Control Chart, Lead and Cycle Time, Throughput, Gantt, Pulse and the Dashboard, by WeKan's rule for an assigned-only member; every test of WeKan's export-access spec and its board PDF export run against Weddy (<a href="https://github.com/wekan/weddy/commit/e413852f3ab11ab40e12a228ef56798044b5df71">wekan-specs.txt</a>), 272 tests in all. Thanks to xet7.
- [The import page for CSV/TSV and Excel, with WeKan's column mapping step](https://github.com/wekan/caddy-wekan-plugin/commit/7b904518defa567f04cfb333118420a16965f40f) - columns guessed from the names in every language, checked again by the server, never a stranger's name looked up; [every import follows Admin Panel's import switch](https://github.com/wekan/caddy-wekan-plugin/commit/4171b1e652fe65593df2526d4e00acf75c6760a2), the calendar import too; WeKan's #395 test runs against Weddy (<a href="https://github.com/wekan/weddy/commit/afd89b82675a968623a6af54609f253ac954e887">wekan-specs.txt</a>), 273 tests in all. Thanks to xet7.
- [The notifications drawer groups one card's or one board's entries](https://github.com/wekan/caddy-wekan-plugin/commit/a5f697023962c5d95887b86564e4ef1ef3103903), by the member's, the board's or Admin Panel's tray grouping, as WeKan's \#5171. Thanks to xet7.
- Every board report chart of WeKan's exports from Weddy: [Cumulative Flow and WIP Run](https://github.com/wekan/caddy-wekan-plugin/commit/b1e463262d8b959db5ed8fe05aff1263a9fe2022), [Flow Efficiency and Time](https://github.com/wekan/caddy-wekan-plugin/commit/10b10fdaa6ca45641874253bbb8fe531adb01837), and [the flow analytics](https://github.com/wekan/caddy-wekan-plugin/commit/9224cd25091430a9dad932e52f5b4e0dd69088e9) - Aging WIP, Blocker Analysis, Monte Carlo with WeKan's own seeded forecast, Process Behavior and Size vs. Cycle Time; their column names are translated in every language. Thanks to xet7.
- [Notification e-mail through a durable outbox, scheduled, grouped and retried](https://github.com/wekan/caddy-wekan-plugin/commit/7d28ee475639b28b5d64463afa06796f30155ef5) - WeKan's notificationEmailJobs, its job ids, its #5171 schedules and quiet hours, and its backoff; [every sentence of WeKan's, with all its params](https://github.com/wekan/caddy-wekan-plugin/commit/05248009402bf61475ab971a5ba0815deb244a21), and its custom-field card methods; [a client write of a collection Weddy has no method for is Meteor's 403](https://github.com/wekan/caddy-wekan-plugin/commit/b87df1a489afb5a05a4547dccb828b17eb1165d9); 7 of WeKan's notification e-mail tests run against Weddy (<a href="https://github.com/wekan/weddy/commit/e6dd68b22aa7eb6a679d2acb4156addb9719ad1e">wekan-specs.txt</a>), 280 tests in all. Thanks to xet7.
- [Activity notifications through WeKan's durable intents and plans](https://github.com/wekan/caddy-wekan-plugin/commit/d2ebd26bc5cec4e57a9bea442298adb08f9ed4eb), with its background recovery and [the scheduled cleanup of completed plans](https://github.com/wekan/caddy-wekan-plugin/commit/0d405c214ec052f7f18a76d61679a2e09e0a7705) - the same collections and identities, so WeKan and Weddy finish what the other began; every test of WeKan's notification e-mail delivery runs against Weddy (<a href="https://github.com/wekan/weddy/commit/336c78baa4ce34155513cb9419b036a6c2d1aa22">wekan-specs.txt</a>), 286 tests in all. Thanks to xet7.
- [Sign-up sends the e-mail verification link](https://github.com/wekan/caddy-wekan-plugin/commit/eed55dc2d4ab60ac940201686fdc488599fe0829), best effort as WeKan's \#5672; [avatars uploaded, stored and served as WeKan's](https://github.com/wekan/caddy-wekan-plugin/commit/1185b4f65e2cbdfc44f1a5d84bb01e5dd8e5a99d) - at most 72 KB, Admin Panel's block, served signed in or from a public board, never out of their directory, RelicAvatarBleed recorded; and [the minicard's Mark as complete, isAvatarUploadBlocked and Meteor's runtime config](https://github.com/wekan/caddy-wekan-plugin/commit/8ae51d9ef6b9a480bb17bdd4fef6250393e2fd9a); WeKan's avatar, card-settings and verification specs run against Weddy (<a href="https://github.com/wekan/weddy/commit/e351e84f81bf2e3a425163e11f563759e05a91ab">wekan-specs.txt</a>), 291 tests in all. Thanks to xet7.
- [Organizations' and teams' feature flags, and their members on the boards](https://github.com/wekan/caddy-wekan-plugin/commit/8678eaec5a124eadf9c09ce77f48b0945d5454e1), and [WeKan's setUserOrgsTeamsFromLdap](https://github.com/wekan/caddy-wekan-plugin/commit/3a17f7122a5a9e2edfdba5150018adce7ac50bf8) - admin only, add-only, each membership recording the group it came through; WeKan's org and team specs run against Weddy (<a href="https://github.com/wekan/weddy/commit/7bea62e138e887d0ea1d7f6adef4b3bb384e5c6d">wekan-specs.txt</a>), 297 tests in all. Thanks to xet7.
- [Admin Panel / People as WeKan's](https://github.com/wekan/caddy-wekan-plugin/commit/c8d5067d14673096155a9cdc1529fbe6f7846aa0) - its tabs and menu, editUserPopup and setCreateUser, an admin's own access never taken away, a new password signing the user out everywhere; and [the password's show/hide button on sign-in and sign-up](https://github.com/wekan/caddy-wekan-plugin/commit/46ce20dc55dcb6a493bdd79d87fb8df630ca73fa); WeKan's admin user management spec runs against Weddy (<a href="https://github.com/wekan/weddy/commit/2a713b0321ae4b1714915c23044926691608f418">wekan-specs.txt</a>), 305 tests in all. Thanks to xet7.
- [Admin Panel's Organizations and Teams panes, and their methods](https://github.com/wekan/caddy-wekan-plugin/commit/f44abf9eb50028fba03fa372358ffc2bff2f7486) - newOrgPopup and newTeamPopup, setCreateOrg, setCreateTeam, setOrgAllFields and setTeamAllFields for a site admin only, a short name nobody else's, a new display name written into the members' own lists; a client calling WeKan's *FromOidc methods is refused and recorded as OIDCBleed. Thanks to xet7.
- [A card's PDF has its checklists and comments](https://github.com/wekan/caddy-wekan-plugin/commit/558340ec756dc5ac7e875793a152977e56022ac4), as WeKan's ExporterCardPDF, anonymized when Admin Panel says so; and [a board as Markdown, OPML and todo.txt, alone or in the export of all boards](https://github.com/wekan/caddy-wekan-plugin/commit/6d18730147ecd69910bda909b51d89d878008943), byte for byte what WeKan's own formatters write. Thanks to xet7.
- [Admin Panel / Problems / Recovery: activity notifications paused, resumed, cancelled and retried](https://github.com/wekan/caddy-wekan-plugin/commit/86317c3004a9d16f65ae13606a2c0fd353c4c76c) - WeKan's controls with their revisions, a cancelled notification compacted and never delivered, one that can never be delivered given up, every recipient asked again before delivery, the report without any content; every test of WeKan's activity notification recovery spec runs against Weddy (<a href="https://github.com/wekan/weddy/commit/716f5f55e504e89caa8306129fb161804d877c29">wekan-specs.txt</a>), 310 tests in all. Thanks to xet7.
- [Admin Panel / Problems / Recovery: the e-mail delivery queue, paused, resumed, cancelled and retried](https://github.com/wekan/caddy-wekan-plugin/commit/7a61ccd4f3c69208b711b2b65f44378e27cbed47) - WeKan's controls and commands, so a replayed cancel never takes later mail; the outbox under each recipient's lease and WeKan's four send slots, four recipients at a time; WeKan's e-mail recovery controls spec runs against Weddy (<a href="https://github.com/wekan/weddy/commit/7228a5c33667fa2b9474302e46c7b11b55fb0c47">wekan-specs.txt</a>), 315 tests in all. Thanks to xet7.
- [SMTP under WeKan's time limits](https://github.com/wekan/caddy-wekan-plugin/commit/1687ba48cbfb0f5f7c4eef70df959b3c2b5e01bc) - MAIL_CONNECTION, MAIL_GREETING, MAIL_SOCKET and MAIL_TOTAL_TIMEOUT_MS with WeKan's defaults and bounds, the connection closed past one and the message retried; and [e-mail receipts compacted after EMAIL_RECEIPT_METADATA_DAYS](https://github.com/wekan/caddy-wekan-plugin/commit/0281dab50f9890adbd1116eeccb1f0e2fcb9c600), so an old cancel sent again still cancels nothing queued since; [EVERYTHING starts a Weddy with each of those settings](https://github.com/wekan/weddy/commit/d69b821032ded05b9c205f95aa9026ebf109dd86) and every test of WeKan's e-mail recovery controls spec passes against it. Thanks to xet7.
- [Rules: a card is moved forward or back, by the board's list order](https://github.com/wekan/caddy-wekan-plugin/commit/4ca0e8d8382b37e637f824f4a20e0186655c9e0e), as WeKan's #2076 - the lists' sort, not the screen, so it holds in right-to-left languages - and offered on the Rules page; WeKan's rule move-direction spec runs against Weddy (<a href="https://github.com/wekan/weddy/commit/319828ff9044e9657f77e2df6087a71187c5a00d">wekan-specs.txt</a>), 316 tests in all. Thanks to xet7.
- [Rules: a card's title or description contains a text](https://github.com/wekan/caddy-wekan-plugin/commit/ec4c54a35afe44b2390bb8a3fae13f58cc375dcf), as WeKan's #2194, offered on the Rules page; a card's title or description changed on the page or over REST is WeKan's a-changedTitle or a-changedDescription activity, with what it was and what it is. Thanks to xet7.
- [Rules: {tokens} in triggers and actions, and the rule editor's variable picker](https://github.com/wekan/caddy-wekan-plugin/commit/8e52e4a752be345f0e30104f7d370916e8993148) - {creator}, {assignees}, {members} and {customField:Name}, never an admin-only field, as WeKan's #4294 / #3195; a trigger value read for the activity's card; WeKan's rule variable specs run against Weddy (<a href="https://github.com/wekan/weddy/commit/50bf7f3cffcc6c5e5aaa5af5fb9c57828e4e9ad2">wekan-specs.txt</a>), 387 tests in all. Thanks to xet7.
- [The board's Advanced Filter, and the rule trigger "a card matches the advanced filter"](https://github.com/wekan/caddy-wekan-plugin/commit/28eda2d3e3c616f89b0029dcbf7fdf1d2454ba1a) - one implementation of WeKan's filter language for the Filter sidebar and the rules: a custom field by name in the same entry as its id, the whole decimal token, date fields and the card's own @dates; WeKan's advanced filter field identity spec runs against Weddy (<a href="https://github.com/wekan/weddy/commit/5a85e674c6f9ab14d5cc2ddc128e63130f264a04">wekan-specs.txt</a>), 391 tests in all. Thanks to xet7.
- [Meteor's /cards/update for a card's title, description, color and archived](https://github.com/wekan/caddy-wekan-plugin/commit/42b1f252a38cc8217c937af9c71973a2ca56bb41), as WeKan's Cards.allow lets a member with write access make it, with WeKan's activities and rules after - and still Meteor's 403 for every other field; WeKan's advanced filter card dates and card write activities specs run against Weddy (<a href="https://github.com/wekan/weddy/commit/5480a0b9587dacf28fd56179aa5ee65bc11da3fb">wekan-specs.txt</a>), 393 tests in all. Thanks to xet7.
- [Rules: Copy Card, rules.updateRule and createCardWithDueDate](https://github.com/wekan/caddy-wekan-plugin/commit/2f3cf6946cca40b633d6a7b1d0af3f7acdb52e6c) - the card with its dates, checklists and comments, to a list of a board its user may change, once a causal chain as WeKan's ruleCopyCard; a rule edited in place; WeKan's rule copy card spec runs against Weddy (<a href="https://github.com/wekan/weddy/commit/31b227ca651a977008b7bfa325b4ab8f9b8d6923">wekan-specs.txt</a>), 395 tests in all. Thanks to xet7.
- [Rules: set a date relative to now, and sort a list](https://github.com/wekan/caddy-wekan-plugin/commit/afbc953cf888e2084127b9340b705e7f0c54f77d) - minutes to calendar months as WeKan's #5621, and a list's cards by name, creation, modification or due date, both on the Rules page. Thanks to xet7.
- [Rules: link the card into a list of a board](https://github.com/wekan/caddy-wekan-plugin/commit/9f6b887819bf6f46b71050a51fe7800fa155bca3) - a linked card of the original, with only that board's fields, never on a board its user may not change. Thanks to xet7.
- [Rules: send an e-mail, with the rule's variables and the card at its end](https://github.com/wekan/caddy-wekan-plugin/commit/79ba56fba55b3a9411bca25d9fbd54dcab63cc4b) - people tokens and @members as their addresses, a non-member's dropped, the subject one line, as WeKan's prepareEmailAction. Thanks to xet7.
- [Rules: scheduled triggers - a calendar, a card's date, its days in a list, or cron](https://github.com/wekan/caddy-wekan-plugin/commit/0baf129c906ea908362b7a9644daafdb1725a908) - once a minute and once each, as WeKan's scheduledRules, cron in UTC as GitHub Actions runs it, on the Rules page too. Thanks to xet7.
- [Rules: edit a rule's trigger and action from the Rules page](https://github.com/wekan/caddy-wekan-plugin/commit/df03849ff98e1130d2f5d4c01fda2255879c9587), as WeKan's #2713, saved in place; [a Weddy spec of it](https://github.com/wekan/weddy/commit/489cfd9ab030d5b91e652c2cf2cd7765dd3a7d50). Thanks to xet7.
- [Rules: import and export a Wrike workflow](https://github.com/wekan/caddy-wekan-plugin/commit/b37a0816fd2294bd8aff94d67cef217071d1eff3) - Wrike's statuses as lists and the rules their groups mean, once, as WeKan's wrikeWorkflow; WeKan's Wrike workflow tests run against Weddy (<a href="https://github.com/wekan/weddy/commit/cae656ab89a07710b637ffd4ee54df0ad915cf3d">wekan-specs.txt</a>), 400 tests in all. Thanks to xet7.
- [Rules: the workflow view's palette and builder](https://github.com/wekan/caddy-wekan-plugin/commit/aac8c3c96c350d60972f5311de92308acad90166) - WeKan's chips dragged into When and Then, or an action onto a rule; [a Weddy spec of it](https://github.com/wekan/weddy/commit/7f4737a01238da98152f7549310d0ba750880b89), and WeKan's #6489 test runs against Weddy (<a href="https://github.com/wekan/weddy/commit/62703ce5dbd5b92f1811c2d8e9b4d5fd187a897d">wekan-specs.txt</a>), 402 tests in all. Thanks to xet7.
- [Rules: import from CSV, Trello Butler and visual workflows](https://github.com/wekan/caddy-wekan-plugin/commit/f001efd604c8214500343ef2d4ed0e96e22f82f0) - exported CSV rules, pasted Butler commands mapped as best it can, and n8n or Node-RED triggers and actions, with what does not map reported; [a Weddy spec of it](https://github.com/wekan/weddy/commit/b19cc0aab0fbc7163d894c258e63569ce54b4994). Thanks to xet7.
- [Rules: the mail action carries the card's checklists and comments on request](https://github.com/wekan/caddy-wekan-plugin/commit/9285f3bd1bbaeeb746c6ea38446e1824609f58b2) - as WeKan's ruleCardDiscussion, with authors' names and reactions but never an address, and nothing for a card the rule's user may not read; [a Weddy spec of it](https://github.com/wekan/weddy/commit/f7f8db21b3747a40790a0bd79da5432f1dc56c3d). Thanks to xet7.
- [Rules: the mail action carries the card's details on request](https://github.com/wekan/caddy-wekan-plugin/commit/caed2b4dfbb7893981599e324d15d3bde624744e) - as WeKan's ruleCardDetails for an ordinary card: its fields, people by name, labels, custom fields (admin-only ones for board admins), notes and the cards it names that its user may read; [a Weddy spec of it](https://github.com/wekan/weddy/commit/0124e6fbfda347f1e4f9e4ab392598ad344d599b). Thanks to xet7.
- [Rules: the mail action carries the card's attachments on request](https://github.com/wekan/caddy-wekan-plugin/commit/e3a13392de5a694ff21c6fc07218dd2827edf138) - as WeKan's ruleCardAttachments: the card's own live files, at most 100 and 8 MiB, with their manifest, a name or type never a header; [a Weddy spec of it](https://github.com/wekan/weddy/commit/2c59d45ebdb0db63ca1200342445498bc309d8dd). Thanks to xet7.
- [Rules: the mail's card details carry votes, planning poker and Scrum fields](https://github.com/wekan/caddy-wekan-plugin/commit/9e40a93c89d94ecf623ab6cd97ee2431a4ec6c90) - as WeKan's ruleCardVoting and ruleCardScrum: voters named only for a public vote, poker results only once it has ended, only what the board shows. Thanks to xet7.
- [Rules: a string-template custom field is shown formatted in the mail's details](https://github.com/wekan/caddy-wekan-plugin/commit/bd0b4bbabd9293f7bf1b1bb3fd50f4834a3ccbd3) - as WeKan's customFieldStringTemplate, its tests case for case, the regex on RE2 so no pattern can stall it. Thanks to xet7.
- [Rules: a mail about a linked card or a linked board is about what it shows](https://github.com/wekan/caddy-wekan-plugin/commit/321f6a789417099cf795e5907a5b03357bc14442) - as WeKan's ruleEmailSource: a link's source through links of links, a linked board's fields, members and discussion, every card on the way readable by the rule's user or no mail. Thanks to xet7.
- [Outgoing webhooks: a board's activity is sent to its webhooks, through the SSRF guard](https://github.com/wekan/caddy-wekan-plugin/commit/f809bb20907b7df8fd995b3c46c2cfe190c0d4db) - WeKan's payload and token, in the background; every address checked at the socket, no redirect followed, a refusal shown as IntegrationBleed; [a Weddy spec of it](https://github.com/wekan/weddy/commit/9b4d036ad6c6c7f0b4d7ddd0e93ab6391dbd7ea5). Thanks to xet7.
- [Outgoing webhooks: "Leave my name out of outgoing webhooks" is honoured](https://github.com/wekan/caddy-wekan-plugin/commit/7edca91f587bc1751745abf0fc01f75fd8a455dd) - as WeKan's #3695: a member who asked is "A member" in the sentence and nowhere in the payload. Thanks to xet7.
- [Outgoing webhooks: a two-way webhook's answer edits the comment it was sent](https://github.com/wekan/caddy-wekan-plugin/commit/ff7d93c350c4092a81abd1bb33a0fa2171804b5a) - as WeKan's responseFunc: its own board's existing comment only, and no echo back. Thanks to xet7.
- [Outgoing webhooks: Mattermost direct messages to the card's people](https://github.com/wekan/caddy-wekan-plugin/commit/71dc36cc1eb3aca0065f1ec4cbbbcffc70718135) - as WeKan's #1297: the card's members and assignees, never the actor. Thanks to xet7.
- [Outgoing webhooks: through the administrator's proxy, and a certificate to trust](https://github.com/wekan/caddy-wekan-plugin/commit/66ecef2934aa75cd4ad1ceb3e5028064f49695fd) - as WeKan's #1455 and #6553: HTTP(S)_PROXY and NO_PROXY, the proxy asked for the checked address only, and WEBHOOK_TLS_CA_CERT. Thanks to xet7.
- [Outgoing webhooks: what a webhook carries and when, as WeKan's #3695](https://github.com/wekan/caddy-wekan-plugin/commit/5b0b3dba522e187535da8223bb5fce1813e716a0) - the sentence and property groups chosen, grouped or scheduled delivery queued in WeKan's own collections and sent as one act-batch. Thanks to xet7.
- [Attachments: a copied card gets copies of its attachments, and its own cover](https://github.com/wekan/caddy-wekan-plugin/commit/92e75034c0d756ebf0a7bc868eb3250d0ee5b2f5) - as WeKan's #5364, over REST and from the pop-over alike; never another card's cover. Thanks to xet7.
- [Attachments: the ones Node.js WeKan keeps in GridFS are read too](https://github.com/wekan/caddy-wekan-plugin/commit/ab0a31ccb26f1d5b8f7f344f03fc4f124e433e65) - downloads, exports, copies and rule mails find a GridFS attachment on the shared database. Thanks to xet7.
- [Avatars: the ones Node.js WeKan keeps in GridFS are served too](https://github.com/wekan/caddy-wekan-plugin/commit/e3301e688419ba5332c1ae7b12a4a9729dd33350) - from WeKan's avatars bucket, with every rule an avatar had. Thanks to xet7.
- [Attachments: thumbnails, as WeKan's #3275, and the attachment route's CacheBleed parity](https://github.com/wekan/caddy-wekan-plugin/commit/e2d71133aefc9714ab67d885964cc42354e63937) - a 512-pixel preview under the original's checks, shown in the card's list; answers vary by who asks, revalidate, and refuse a signed-out caller off a public board with 403; [WeKan's CacheBleed spec on Weddy](https://github.com/wekan/weddy/commit/ea13074ff3f18d35607ff25267ff37b066c1fcdb). Thanks to xet7.
- [Bots: a board admin hands a card to a bot, and its runner reports back](https://github.com/wekan/caddy-wekan-plugin/commit/137cb982e71e09fdbc83dfbbe93d712da881d77a) - as WeKan's server/bots.js: dispatch, stop, answer and reply, the run report route, and the Rules action; a bot is sent the cards handed to it and nothing else; [a Weddy spec of it](https://github.com/wekan/weddy/commit/fe106603846b344a392668acc6ee06f43ef21b98). Thanks to xet7.
- [Rules: the Bots view, as WeKan's rulesBots](https://github.com/wekan/caddy-wekan-plugin/commit/565d9981211209b35bf016911b2ea57e09e7457b) - the bots, live runs and activity, the lists as columns with each card's run, and a card's drawer to hand it over, stop, answer and reply; [a Weddy spec of it](https://github.com/wekan/weddy/commit/5cf0f51020ac3593db945010b97fc39494758510). Thanks to xet7.
- [Rules: the Blocks view, as WeKan's rulesBlocks, in Blockly](https://github.com/wekan/caddy-wekan-plugin/commit/fdc21c4806f1edb0063a3b922dbc6d8d8165095e) - a rule as a When block joined to a Then block, saved as an ordinary rule without losing what WeKan keeps beside its fields; Blockly 13.4.0 vendored, its messages in every language; [WeKan's spec of it on Weddy](https://github.com/wekan/weddy/commit/d8d28d61d9eaf19b79b32f171589adaa5ab26602). Thanks to xet7.
- [Admin Panel: attachment settings and all domains over the REST API](https://github.com/wekan/caddy-wekan-plugin/commit/dab0c295c38b95adf17eb57942cc1dd6e7976b85) - as WeKan's attachmentStorageSettings: for site admins only, cloud secrets never returned and kept when left blank, only the schema's keys taken; and users counted by e-mail domain; [WeKan's range streaming and card creation activity specs on Weddy](https://github.com/wekan/weddy/commit/c9595681e02596303945ba1fe7c6729384ed090c), 414 tests in all. Thanks to xet7.
- [Outgoing webhooks and e-mail: Member Settings' notification delivery, and setNotificationDelivery](https://github.com/wekan/caddy-wekan-plugin/commit/18c638a90815b0cfd4dc001a1ba2a2763dbf7186) - as WeKan's #3695 / #5171: a member's own e-mail and tray and leaving their name out of webhooks on the profile page, the method for every scope by who may set it, and a webhook's REST route keeps its delivery; [a Weddy spec of it](https://github.com/wekan/weddy/commit/5db53216dfe7974db6ed7ebb4869b4c28cd371c6), 417 tests in all. Thanks to xet7.
- [Outgoing webhooks and e-mail: a board's Notifications page](https://github.com/wekan/caddy-wekan-plugin/commit/478203c21a13f3cfdd44396296c324bc568f915a) - as WeKan's Board Settings / Notifications: the board's admins set how its e-mail, tray and webhooks deliver, from the board menu; one form shared with the profile page; [a Weddy spec of it](https://github.com/wekan/weddy/commit/8c1d06817381ac85e0c788a493d94f43a27708dd), 418 tests in all. Thanks to xet7.
- [Outgoing webhooks and e-mail: Admin Panel / Notifications, and each webhook's own delivery](https://github.com/wekan/caddy-wekan-plugin/commit/f88baae7ab8731a1b2517723970cf4856afd2119) - as WeKan's: the instance's defaults for site admins, and a board's admins set each of its webhooks on the board's Notifications page; [a Weddy spec of it](https://github.com/wekan/weddy/commit/3590bc63638a7db4805394d2a92942653b8ceefd), 420 tests in all. Thanks to xet7.
- [Lists: per-list exceptions that grant, and the List permissions page](https://github.com/wekan/caddy-wekan-plugin/commit/67ff89af3a1f010c8763591ae14ee049c4b25a86) - as WeKan's #4527: a list lets a role add cards and comment there beyond the board's rule, from the pages and methods but never REST; its admins set it from the list menu, and a direct write is refused and seen; [a Weddy spec of it](https://github.com/wekan/weddy/commit/13c442fbf41409ac95675ff81128c8b98135415f), 421 tests in all. Thanks to xet7.
- [Exports: Taskwarrior and Zenkit, and the other tools' exports carry WeKan's fields](https://github.com/wekan/caddy-wekan-plugin/commit/b94dac96f370796251ea0accc224920855f4c635) - as WeKan's collect(): people, comments and parents, anonymized when Admin Panel says so; every format checked byte for byte against WeKan's own formatters, which found todo.txt folding only ASCII spaces. Thanks to xet7.
- [Exports: Nullboard, Obsidian Kanban, Org mode and Kanri](https://github.com/wekan/caddy-wekan-plugin/commit/a26445a4271af00ce659d20e77073dfee9aa500b) - as WeKan's formatters, byte for byte; nine of the other tools' formats are in. Thanks to xet7.
- [Exports: NextCloud Deck, Kanboard, OpenProject, GitHub, Gitea, Forgejo, GitLab, Trello and Asana](https://github.com/wekan/caddy-wekan-plugin/commit/3d20d632c0a1e28c234bc2cdd84812a6183a3c14) - as WeKan's formatters, byte for byte, Kanboard's task links from both ends included; eighteen formats are in. Thanks to xet7.
- [Exports: Leo, MeisterTask, Todoist, Linear and TickTick](https://github.com/wekan/caddy-wekan-plugin/commit/4052ee6f6da004226b3712f541b719b7597263fa) - as WeKan's formatters, byte for byte, each tool's CSV quoting included; twenty-three formats are in. Thanks to xet7.
- [Exports: ClickUp, Pivotal Tracker and Quire](https://github.com/wekan/caddy-wekan-plugin/commit/3d63726540c951c4116ec71a74667e09a9c2de4b) - as WeKan's formatters, byte for byte; twenty-six formats are in. Thanks to xet7.
- [Exports: Redmine, Notion and Focalboard](https://github.com/wekan/caddy-wekan-plugin/commit/5af18bb23a8854214e91c403b9f3e811544a6def) - as WeKan's formatters, byte for byte, JavaScript's rounding and key order included; twenty-nine formats are in. Thanks to xet7.
- [Exports: Tasks.org and Super Productivity](https://github.com/wekan/caddy-wekan-plugin/commit/a0f4a8506b7e94d4e1b0f303de8bac7109a48d31) - as WeKan's formatters, byte for byte; checking it found WeKan's own Super Productivity export failing for a card whose list is archived, [fixed in WeKan](https://github.com/wekan/wekan/commit/8b4fe0e7376194c498219a0b496340a94020098a) too; thirty-one formats are in. Thanks to xet7.
- [Exports: the board as a Wrike workflow, in WeKan's key order](https://github.com/wekan/caddy-wekan-plugin/commit/754f56821fe0be887a64537da88c90cf1197cabc) - the Rules page's Wrike download too was written with Go's alphabetical keys; thirty-two formats are in. Thanks to xet7.
- [Exports: Wrike's and Teamwork.com's Excel import workbooks](https://github.com/wekan/caddy-wekan-plugin/commit/fbf287fd14884417e267e2627c794152125ce7f1) - their rows as WeKan's formatters write them, in workbooks with number, date and bold header cells as WeKan's ExcelJS ones; thirty-four formats are in. Thanks to xet7.
- [Exports: monday.com's, Businessmap's and Microsoft Planner's Excel import workbooks](https://github.com/wekan/caddy-wekan-plugin/commit/bbc8c95117a267157afe612db7633afa70546dba) - their rows as WeKan's formatters write them; thirty-seven formats are in. Thanks to xet7.
- [Exports: Vikunja's user data export](https://github.com/wekan/caddy-wekan-plugin/commit/35ec25a3d06c7cc1894e7a07e822d39ae775868f) - its data.json as WeKan's byte for byte, in Vikunja's zip; thirty-eight of WeKan's forty other-tool formats are in. Thanks to xet7.
- [Exports: the board's Export pop-over offers the other tools' exports](https://github.com/wekan/caddy-wekan-plugin/commit/7e712332f7475ed435f726d32a5e12ec5e6f1e75) - with WeKan's labels and icons, in its order; they were reachable only over REST; [a Weddy spec of it](https://github.com/wekan/weddy/commit/11258343ba03299689e5d4351b6cfcca66c051fb), 422 tests in all. Thanks to xet7.
- [Imports: a Kanboard project, with WeKan's import planner and creator](https://github.com/wekan/caddy-wekan-plugin/commit/79079f58faee019bd4841cf4c07ae356a125064d) - as WeKan's KanboardCreator: lists, swimlanes, labels, cards, checklists, comments and links, the planner and parser matched against WeKan's own; [WeKan's Kanboard UI import test on Weddy](https://github.com/wekan/weddy/commit/db4c459a09526c4e2605d83fee409a69df157324), 423 tests in all. Thanks to xet7.
- [Imports: NextCloud Deck, GitHub, Gitea and Forgejo](https://github.com/wekan/caddy-wekan-plugin/commit/4a2e3386d7b1303db84c03309069c7af7a59ab98) - as WeKan's parsers, matched against WeKan's own on its fixtures and on Weddy's exports; [WeKan's UI import tests for them on Weddy](https://github.com/wekan/weddy/commit/31becb74bdf853e71e8d7d0f4eabe0aa1e07758f), 427 tests in all. Thanks to xet7.
- [Imports: GitLab, Asana and Zenkit](https://github.com/wekan/caddy-wekan-plugin/commit/98f61c8cd00f4f3cab3b7e0654ed3377e897c239) - as WeKan's parsers, matched against WeKan's own but for the sprints Weddy has not got yet; [WeKan's UI import tests for them on Weddy](https://github.com/wekan/weddy/commit/6cdb1d45b144f0f6e0ec20809fb363cb1cfecdc8), 430 tests in all. Thanks to xet7.
- [Imports: OpenProject and Markdown](https://github.com/wekan/caddy-wekan-plugin/commit/a723c6791dc37fa242027676de451da63be8f4b4) - as WeKan's parsers, Markdown as the first text source; [WeKan's OpenProject UI import test on Weddy](https://github.com/wekan/weddy/commit/7fa1701be8089bf2f083728544208538c8c19c36), 431 tests in all. Thanks to xet7.
- [Imports: todo.txt and Taskwarrior](https://github.com/wekan/caddy-wekan-plugin/commit/c72846d0cd9164c3d192b4463b60df9ea2303a25) - as WeKan's parsers, matched against WeKan's own; [WeKan's UI import tests for them on Weddy](https://github.com/wekan/weddy/commit/2c0e45782b3711ed5fff0bd6d792cbc304e99cd9), 433 tests in all. Thanks to xet7.
- [Imports: Nullboard and Kanri](https://github.com/wekan/caddy-wekan-plugin/commit/c27c9ef094e7920574b712932360a6819a3c8eb3) - as WeKan's parsers, Kanri's all-data export with every board as a swimlane; [WeKan's UI import tests for them on Weddy](https://github.com/wekan/weddy/commit/ced7f79295403a4c358f5eb6f2895b370367dd47), 435 tests in all. Thanks to xet7.
- [Imports: OPML and Leo outlines](https://github.com/wekan/caddy-wekan-plugin/commit/1a37e0de89efbbf62267f07e788a1dbd82852228) - as WeKan's parsers, the XML read leniently and never resolving a DTD or an external entity; [WeKan's OPML UI import test on Weddy](https://github.com/wekan/weddy/commit/5a0c5cd64820c2ef81508753aaf1d7c733810ddd), 436 tests in all. Thanks to xet7.
- [Imports: WeKan's import boundary, and its importBoard method](https://github.com/wekan/caddy-wekan-plugin/commit/1057275a0f8cf737a733e9efa02a506fc5045dfd) - what a file carries is cleaned before anything is written, as WeKan's sanitizer, matched against it; what was removed, or a file over a limit, is seen in Admin Panel -> Problems; [WeKan's Leo UI import tests on Weddy](https://github.com/wekan/weddy/commit/862f1bfa67d31ab7b05dc87eb9eb9cfd387d7c1f), 438 tests in all. Thanks to xet7.
- [Imports: Obsidian Kanban and Org mode](https://github.com/wekan/caddy-wekan-plugin/commit/372bca35df910895c45900b032f623aa3368b213) - as WeKan's parsers, line for line, JavaScript's regular expressions and date rollover included; [WeKan's UI import tests for them on Weddy](https://github.com/wekan/weddy/commit/5f14a55b32701fcc648bcf266db6355326444e1b), 440 tests in all. Thanks to xet7.
- [Imports: thirteen more tools, and WeKan's placeholder users](https://github.com/wekan/caddy-wekan-plugin/commit/44be798072436dcb447f5b10caa243ffe1632db4) - Todoist, MeisterTask, Linear, TickTick, ClickUp, Pivotal Tracker, Redmine, Quire, Focalboard, Tasks.org, Super Productivity, Taiga and Vikunja as WeKan's parsers, matched against WeKan's own; the file's people are placeholder users who cannot log in, or the person importing, as the page's chooser says; [WeKan's UI import tests for them on Weddy](https://github.com/wekan/weddy/commit/b4a7f89ff8cd7dba45f07eab168de49b063a198c), 459 tests in all. Thanks to xet7.
- [Imports: Wrike, Teamwork.com, monday.com, Businessmap and Microsoft Planner workbooks](https://github.com/wekan/caddy-wekan-plugin/commit/d334817569a179b137fff81a528868fdf505c66f) - as WeKan's parsers, on an .xlsx's cells as WeKan's ExcelJS reads them, checked against ExcelJS and WeKan's own parsers; [WeKan's UI import tests for them on Weddy](https://github.com/wekan/weddy/commit/eb403c4eba7798e1601b8dfe7c4922c201a72720), 465 tests in all. Thanks to xet7.
- [Imports: Notion's Markdown & CSV export and Plane's issue export](https://github.com/wekan/caddy-wekan-plugin/commit/1ee65025240c69ca65e2c01de901c27a2f94eebc) - as WeKan's archive readers and parsers, matched against WeKan's own on exports WeKan's own libraries wrote; [WeKan's UI import tests for them on Weddy](https://github.com/wekan/weddy/commit/35bada437c656bf55cb8c45b5092eaefec645f3f), 469 tests in all. Thanks to xet7.
- [Exports: Jira and Taiga, and the Export pop-over's links carry WeKan's query](https://github.com/wekan/caddy-wekan-plugin/commit/0376e23e97ab47bd844b8b598a31bcb41019db57) - as WeKan's formatters, byte for byte; all forty of WeKan's other-tool formats are in, and Weddy's Taiga export imports back as WeKan reads it; [WeKan's Planner export-link and Hawaiian import-instruction UI tests on Weddy](https://github.com/wekan/weddy/commit/bd58b85118e6fcc7ef44c3065108c5ca83d8fe55), 492 tests in all. Thanks to xet7.
- [Imports: what an import left out is recorded for Admin Panel -> Recovery](https://github.com/wekan/caddy-wekan-plugin/commit/b360f69eeb8d37b459c59cf301210a7f2a994f55) - one import-completed-with-warnings row in recoveryEvents, as WeKan's, matched against WeKan's report on every parsed fixture; a clean import writes none. Thanks to xet7.
- [Admin Panel / Problems / Recovery lists the recovery events, and an import says what it left out](https://github.com/wekan/caddy-wekan-plugin/commit/9107b8dbd7a70edb44c694db04434b41d85539ca) - WeKan's report: newest first, ten a page, searched and shown by status, for administrators; an import with losses shows them on its page before its board opens, and importReportForBoard is in; [WeKan's import loss report UI test on Weddy](https://github.com/wekan/weddy/commit/a28c91f207342a475346d00b27cfc481b91afb2e), 493 tests in all. Thanks to xet7.
- [Imports: WeKan's members-mapping step](https://github.com/wekan/caddy-wekan-plugin/commit/85bbed4f9dddfb026755db3de2273720a220db06) - the file's people are listed to map to existing users, Done imports with the mapping, and "Import without mapping members" skips it; anybody unmapped becomes a placeholder, and importBoard's membersMapping takes the same check; [WeKan's members-mapping UI test on Weddy](https://github.com/wekan/weddy/commit/fc1757036f18707df85710d4b43c9835db92aab9), 494 tests in all. Thanks to xet7.
- [Export: WeKan's "what to include" in the Export pop-over](https://github.com/wekan/caddy-wekan-plugin/commit/86612e3462455be93cae05359680eac4239e177d) - Card details and a checkbox per section, all on to start, rewrite the other tools' links' ?fields=, and the exports read it as WeKan's collect() does, for one board and for Export all boards; [WeKan's every external export menu link UI test on Weddy](https://github.com/wekan/weddy/commit/4274b7a948dc758d88e113f01dbdfc14b8b21922), 495 tests in all. Thanks to xet7.
- [Imports: WeKan's Excel import of many sheets](https://github.com/wekan/caddy-wekan-plugin/commit/5b8fe2c4cfb57f0d8b4eaed1eee649368342383e) - every sheet with a header is its own board, titled from A1, WeKan's Activity, empty and notes sheets skipped and named on the mapping step; the column guess is WeKan's guessCsvMapping, its own export layouts read by position, matched against WeKan on a workbook and 21 headers; [WeKan's Finnish workbook of many sheets UI test on Weddy](https://github.com/wekan/weddy/commit/8bd4306e381c6120905be916c083e0046eb675ff), 496 tests in all. Thanks to xet7.
- [Imports: importBoard's csv and excel sources](https://github.com/wekan/caddy-wekan-plugin/commit/edf38bf0d40ef0ba4db2307b91510b977068c2a7) - rows or { excelBase64 }, data.csvMapping checked against the header as WeKan's, a workbook a board a sheet; an untitled board is CsvCreator's "Imported Board" and the date. Thanks to xet7.
- [Export: the CSV and TSV exports take the Export pop-over's selection](https://github.com/wekan/caddy-wekan-plugin/commit/390bd2b12f1cb0b344f74ed2330ae2f92f7e79a1) - WeKan's csvColumnMask: a section left out drops its columns, title and archived stay, for one board and for Export all boards. Thanks to xet7.
- [Imports: WeKan's "One board per project"](https://github.com/wekan/caddy-wekan-plugin/commit/65d3f881f01d4e8c63a60a5cc310d3358807fbfb) - the page's checkbox and importBoard's splitBy, split as WeKan's splitBySwimlane on every parsed fixture, losses across boards reported; [WeKan's CSV mapping, Kanri one board per project and CSV column UI tests on Weddy](https://github.com/wekan/weddy/commit/b069bb257d37d49553f410e2fe6475eb64f1f85a), 499 tests in all. Thanks to xet7.
- [Imports: the import page reads a Vikunja, Plane or Notion .zip up to 64 MB](https://github.com/wekan/caddy-wekan-plugin/commit/8547892353ed9c5c45015aa01c5d84539cf9b72d) - each source up to its parser's limit, as WeKan's, on the first step and in the members-mapping step's payload; [WeKan's Vikunja export menu link UI test on Weddy](https://github.com/wekan/weddy/commit/fc0eb67aa58cc1d639f34afaa05c86d02fd51e2f), 500 tests in all. Thanks to xet7.
- [Export: PDF and Excel in the Export pop-over, and WeKan's missing board](https://github.com/wekan/caddy-wekan-plugin/commit/41bf602beb9a2d780d97a06457b70763ecfbe58a) - with the selection's ?fields=, and a missing board's PDF or Excel is WeKan's plain-text 404; [WeKan's board Excel export and export security UI tests on Weddy](https://github.com/wekan/weddy/commit/75de83d42c51be6591a9d2f5b11bc91c64263142), 506 tests in all. Thanks to xet7.
- [Export: a board's Excel export in WeKan's table layout](https://github.com/wekan/caddy-wekan-plugin/commit/5c8b6ed12f72037ce9b9cb167984b6db3c98aa2e) - ExporterExcel's sheet, title in A1, details in rows 3 and 5, a card a row under row 7's header in the user's language, and the Activity sheet of comments; it reads back through WeKan's Excel import as one board. Thanks to xet7.
- [Tests: the outgoing webhook negative is checked by board, not counted](https://github.com/wekan/caddy-wekan-plugin/commit/d4e7ddb2f0b98ca30d9c1d62d6feed642e5c474a) - the other board's own creation activity no longer fails it now and then; this board's reaching it still does. Thanks to xet7.
- [Export: markdown as Node.js WeKan's exports read it](https://github.com/wekan/caddy-wekan-plugin/commit/746860ee909e5ef3041d0cc48c335f074f8f9730) - exportMarkdown.js's blocks and runs: goldmark's tree as markdown-it's tokens, with markdown-it's typographer rules and linkify-it 6's own patterns, matched against WeKan on 106 cases; the first part of the Excel export's card-details layout. Thanks to xet7.
- [Export: a card as Node.js WeKan's exports draw it](https://github.com/wekan/caddy-wekan-plugin/commit/a2ba5c65890896445e92008c15c0350743a37c03) - cardDocument.js and cardExportDocument.js: the title, the meta pairs and a section per part of the card that has data, matched against WeKan on four cards; the second part of the card-details layout. Thanks to xet7.
- [Tests: an export .zip's card is looked for in its data.json](https://github.com/wekan/caddy-wekan-plugin/commit/5946fefe0e7b2f44998d6a7d1954593afef31e4d) - the Vikunja export's deflated bytes held the card's letter only now and then, so the format test failed now and then. Thanks to xet7.
- [Export: a card drawn on a worksheet as Node.js WeKan's Excel export draws it](https://github.com/wekan/caddy-wekan-plugin/commit/cf5f8557a6fb963da4926bf050cc8c8cf83840a2) - renderCardDocumentExcel.js on a model of the sheet, matched against ExcelJS's worksheet cell, style, merge, height and break, and written as a styled workbook ExcelJS reads back; the third part of the card-details layout. Thanks to xet7.
- [Export: a board's Excel export with Card details, as Node.js WeKan's](https://github.com/wekan/caddy-wekan-plugin/commit/d6a1dcd3620b0f637de2bca5c7d74d2c17e6472e) - ExporterExcelBoard's workbook, the default: the board's header, a heading a swimlane and a list, and every card in the card layout with its pictures, dates in the reader's format and zone; a board with admin-only custom fields is exported by its admins only; [WeKan's Kanboard and Asana export selection UI test on Weddy](https://github.com/wekan/weddy/commit/d5c6b76a87a1aec2367312c6e1d5818ebe9e208c), 507 tests in all. Thanks to xet7.
- [Export: a card's own Excel export, as Node.js WeKan's](https://github.com/wekan/caddy-wekan-plugin/commit/ea1afd9d3299006598e4c0a8728b3e525e4e8c08) - ExporterExcelCard's workbook: the card in its layout on a sheet named for it, archived cards too, admin-only boards to their admins. Thanks to xet7.
- [Export: the exports' scope and selection, as Node.js WeKan's](https://github.com/wekan/caddy-wekan-plugin/commit/24358a08e4eb015d2549a568c4de256e5bc90644) - the JSON export, the .zip and the Excel export take a swimlane, list, card or checklist scope and the selection; another board's checklist exports nothing and is recorded as CrossBoardExportBleed. Thanks to xet7.
- [Imports: WeKan's scoped import, and ImportPlacementBleed's guard](https://github.com/wekan/caddy-wekan-plugin/commit/c83810d8003f7ec7446532e9c22c32dde07ce638) - ScopedImporter: a swimlane, list or card imported beside its own, through importScoped and the .zip route, with the selection; another board's list, swimlane or card is refused and recorded; [WeKan's import placement UI test on Weddy](https://github.com/wekan/weddy/commit/076aa5eea036f5a09f9c5c55fce874810a92accc), 508 tests in all. Thanks to xet7.
- [Export: the swimlane, list and card menus' Export and Import pop-overs](https://github.com/wekan/caddy-wekan-plugin/commit/4079238e15d51ab7abf5942431b3d597ecb4459d) - WeKan's exportScopeBody: the selection and the scope's PDF, Excel, JSON and .zip, or a WeKan export imported beside it; [the scoped pop-overs' and WeKan's Latin card export title UI tests on Weddy](https://github.com/wekan/weddy/commit/49f33743bcecf7be2cafc5ba7edf8a5ebb0fcb16), 511 tests in all. Thanks to xet7.
- [Export: the PDF of a card document, as Node.js WeKan's pdfDocument.js writes it](https://github.com/wekan/caddy-wekan-plugin/commit/621e72052b8eb55e473409f0bb25ee73cd3e5ffa) - documentToLines and buildPdfBuffer: the title, sections, label/value columns, wrapped markdown, attachments as a table and pictures, in the four Courier faces with WinAnsiEncoding, matched line for line and byte for byte against WeKan's. Thanks to xet7.
- [Export: a board's and a card's PDF as Node.js WeKan's, and assertFieldExport](https://github.com/wekan/caddy-wekan-plugin/commit/4990919d85db2009d3d75974a78ebc17ca385a59) - ExporterBoardPDF and ExporterCardPDF in the card layout with the export's language, dates, fields and scope; and every export refuses an admin-only field to a non-admin and a value of a field the reader may not see to everyone; 511 tests pass on Weddy. Thanks to xet7.
- [Imports: the attachment files a parser finds, downloaded as Node.js WeKan does](https://github.com/wekan/caddy-wekan-plugin/commit/5c97c0b2622f4970f32e209230f2bf5662771e8a) - importAttachmentDownload.js and importAttachmentAuth.js: each file fetched through the outbound guard, every redirect validated, the import page's sign-in for Jira, Deck, OpenProject, Asana and GitLab sent only to the address typed, a file not fetched reported with its reason, and a refused download in Admin Panel -> Problems as LiveBleed; [the attachment-files UI test on Weddy](https://github.com/wekan/weddy/commit/c859bbbf51984b8bdace8a601fd42f71c907350c), 513 tests in all. Thanks to xet7.
- [Card details: the checklists, and a checklist's own Export pop-up](https://github.com/wekan/caddy-wekan-plugin/commit/fa4cf45f4b12ad48cc39efce80c6afee3697a849) - WeKan's checklists drawn with their progress and items, and checklistActionsPopup's Export / Import opening the export scoped to the checklist; [the checklist Export UI test on Weddy](https://github.com/wekan/weddy/commit/345db3ac40290e6f0529159b06d828388199beac), 514 tests in all. Thanks to xet7.
- [Tests: WeKan's Kanboard, Asana and Zenkit UI-import fidelity tests on Weddy](https://github.com/wekan/weddy/commit/800d18fdb050f60562c4b9a4224c976f7178d99c) - their comments, checklists and card fields, now that the card details draw the checklists; 517 tests in all. Thanks to xet7.
- [Card details: a checklist added, an item added and checked, a checklist deleted](https://github.com/wekan/caddy-wekan-plugin/commit/2b91bdc3c3d9074e863df2975bba8188a5f147cd) - WeKan's checklist writes with their activities and the checklist's completion, a Worker ticking boxes only; WeKan's 12-checklists specs now run through on Weddy, 517 tests pass. Thanks to xet7.
- [Tests: WeKan's #6700 single-submit checklist tests on Weddy](https://github.com/wekan/weddy/commit/723fe65798ed3138881b3e9db4fa0e8d840e7591) - a checklist added by a click, Enter or Ctrl+Enter is stored and drawn once; 520 tests in all. Thanks to xet7.
- [Card details: a checklist renamed, its items edited and deleted](https://github.com/wekan/caddy-wekan-plugin/commit/e5e601961ef3e44d783229199d2564d3105ba933) - WeKan's edit forms and item delete pop-up, and the live refresh no longer throws away a form being written in the card details; [the UI test on Weddy](https://github.com/wekan/weddy/commit/8e21652032668d9b442147858fde1866cec6cedf), 521 tests in all. Thanks to xet7.
- [Editors: WeKan's submit-on-Enter preference, in every editor](https://github.com/wekan/caddy-wekan-plugin/commit/fd7254c937fad231e2e35f0eccdb68e2b57643df) - Enter or Ctrl/Cmd+Enter saves as the member chose, Member Settings' toggle at once, and the checklist forms on the page only while open; [WeKan's tests on Weddy](https://github.com/wekan/weddy/commit/73998a13ebae6e6b6f99f4308026da597d765bb9), 535 tests in all. Thanks to xet7.
- [Card details: a checklist moved or copied to another card](https://github.com/wekan/caddy-wekan-plugin/commit/f3dd1f9b21fb00153e91e042e58e860c3a591c6d) - WeKan's Move and Copy Checklist pop-ups, the items and a move's activities going along, both cards the user's to change; [the UI tests on Weddy](https://github.com/wekan/weddy/commit/8e0eb3d4ad6fb056b8836bdfb9fab7a301c14c4c), 537 tests in all. Thanks to xet7.
- [Card details: a checklist item's assignee (#1618)](https://github.com/wekan/caddy-wekan-plugin/commit/11c511aac808db6dda140ee454d4edf791d080ab) - the board's active members or nobody, shown by name, and only an active member accepted; [the UI test on Weddy](https://github.com/wekan/weddy/commit/82eb31a10f0547bb31db8e262bea46e268529f89), 538 tests in all. Thanks to xet7.
- [Card details: checklist items dragged into a new order (#6723)](https://github.com/wekan/caddy-wekan-plugin/commit/03d27d03490e2f18dd9c6a17f1ce5d58f06143a4) - by the item or its handle, a placeholder where it lands, the card's items side by side as in WeKan, and no refresh replacing an item mid-drag; [WeKan's reorder tests on Weddy](https://github.com/wekan/weddy/commit/17744cc8889f4961a63a8c2db9214a0e39fd7267), 540 tests in all. Thanks to xet7.
- [Card details: a checklist's and its items' due dates, and WeKan's date picker (#4755)](https://github.com/wekan/caddy-wekan-plugin/commit/295db08d0f205175e1f655d49b6efe3f72e06f95) - the month calendar and time of editDateForm, WeKan's checks of the date, time and year, and the due date badge; [WeKan's checklist deadline test and the item's on Weddy](https://github.com/wekan/weddy/commit/ee8ac719b33dfda757813a70a130521ca1b75766), 542 tests in all. Thanks to xet7.
- [Card details: the card's dates - Received, Start, Due and End - on WeKan's date picker](https://github.com/wekan/caddy-wekan-plugin/commit/8aaa6dc69e8cb79933b1b8053beb1c65935234e7) - as the board allows them, a badge or a "+" for whoever may set them, the picker's hour and minute selects, year arrows and today picked; a set and a cleared date recorded as WeKan records them; [WeKan's due date tests on Weddy](https://github.com/wekan/weddy/commit/222369aa9dae8d244b6673c3dd15bc3e51b9e80d). Thanks to xet7.
- [Live updates: a page skips the echo of its own change](https://github.com/wekan/caddy-wekan-plugin/commit/66c7c6bdb6c4b99ad49625562991c9ec00344c99) - a board form and a checklist reorder name their page, and that page does not re-render for the change it already shows; 545 tests pass. Thanks to xet7.
- [Card details: the description edited, as WeKan's descriptionForm](https://github.com/wekan/caddy-wekan-plugin/commit/5b29d3c9ccc59b7454934d01f23ae29b536d6e91) - drawn as markdown, the pencil and the text opening the editor for whoever may change the card, and a-changedDescription once per change; [WeKan's description tests on Weddy](https://github.com/wekan/weddy/commit/607e6e52ed04e2d24aae86725b57f9664e3ec5ea), 547 tests in all. Thanks to xet7.
- [Lists: WeKan's "+ Add card" under each list, and its composer drawn as a minicard](https://github.com/wekan/caddy-wekan-plugin/commit/f155b7f688f552672912f553eb739230f106c630) - WeKan's add-card test runs through instead of skipping; 547 tests pass. Thanks to xet7.
- [Card details: the card's custom fields, as WeKan's cardCustomFields](https://github.com/wekan/caddy-wekan-plugin/commit/cd3ca36f4a1fa7f426134b322c6e48422b7427c9) - the section and its picker, a field created from it, six types edited as WeKan's editors, and the methods' rules - an admin-only field's refusal recorded as AdminFieldBleed; [WeKan's custom field tests on Weddy](https://github.com/wekan/weddy/commit/a4c4e5b39ea3683e99421d6fef3cb3aaae0f8524), 552 tests in all. Thanks to xet7.
- [Card details: multi-select and string-template custom fields edited, and the fields' layout toggle](https://github.com/wekan/caddy-wekan-plugin/commit/86e04fc39d992718d94c277916226aadfe64f100) - every custom field type edited as WeKan edits it, the section folding, and one per row or a grid as the member chooses; [WeKan's layout toggle test on Weddy](https://github.com/wekan/weddy/commit/ae50d85b281887fe8a18520134caa1e425a13f5f), 554 tests in all. Thanks to xet7.
- [Attachments: UnassignedAttachBleed's refusals recorded, and api.attachment.delete](https://github.com/wekan/caddy-wekan-plugin/commit/d088545c1c7587860cab1bca6b33510ea48d5e8d) - GHSA-w26g-rc43-q6cm's refusals in Admin Panel -> Problems from every attachment write, and the DDP delete with the same rule; [WeKan's test on Weddy](https://github.com/wekan/weddy/commit/4d0451623286145db7d25eae46cc4bd4db307668), 559 tests in all. Thanks to xet7.
- [Card details: WeKan's attachment gallery, its upload pop-up and the viewer](https://github.com/wekan/caddy-wekan-plugin/commit/d0945ef5b49cbce1dda5aa51f66bdb6bb05d3d8f) - tiles with size and download, the "+" and its Computer upload, and images, PDFs, video, audio and text in the overlay; [WeKan's attachment tests on Weddy](https://github.com/wekan/weddy/commit/97a9fa750e16ad4de0ee6ec911e442a41c11021d), 564 tests in all. Thanks to xet7.
- [Attachments: an SVG shown sanitized, a card's cover and the board's background](https://github.com/wekan/caddy-wekan-plugin/commit/d3338db8a15f9b2819683d8ea56d0620183c159c) - WeKan's SVG sanitizer and headers, removals recorded as FileBleed, covers on minicards and a board admin's background; [WeKan's SVG test on Weddy](https://github.com/wekan/weddy/commit/d51f88ac6bb5deb401a225951403e5031182bab6), 565 tests in all. Thanks to xet7.
- [Minicards: their assignees, and their newest comments on lines of their own](https://github.com/wekan/caddy-wekan-plugin/commit/e52b0aba0907d3f4747c7e845b39dff9e34715ff) - avatars as the board shows them, three comments cut at 140 characters and never covered by the avatars; [WeKan's minicard comment test on Weddy](https://github.com/wekan/weddy/commit/a0b7efcb9a137bab10016b16b073de9c01f83fb8), 566 tests in all. Thanks to xet7.
- [Scrum: sprints, releases, events and the Sprints, Product Backlog, Velocity and Sprint Report views](https://github.com/wekan/caddy-wekan-plugin/commit/1406d005e5226821770a80a0f279ce5893d9e58b) -
  WeKan's Scrum methods with its validation, permissions and revisions, a
  sprint started and closed with its unfinished cards rolled over, stored as
  WeKan stores it, one History row per change with undo and redo, the Board
  View menu, and every chart's Excel in WeKan's layout; [the views in every
  language](https://github.com/wekan/caddy-wekan-plugin/commit/30fbaf15cb89b08e660105fde5aa04f431f62fc2);
  [WeKan's Scrum tests on Weddy](https://github.com/wekan/weddy/commit/0d02d6cf84b2a311c78553dc5f1994ffe2ccab85),
  17 of them. Thanks to xet7.
- [Scrum: daily observations, their chart and export](https://github.com/wekan/caddy-wekan-plugin/commit/5af999377bf44c7e305f27e0877439177867adea) -
  the first observation of each UTC day of an active sprint, kept as
  measured and the reader's cards only, drawn in the Sprint Report and
  exported with WeKan's notices; the chart Export pop-over's links carry a
  download token of their own, for the export routes only;
  [WeKan's daily-history tests on Weddy](https://github.com/wekan/weddy/commit/9dc8b1944850d8c354f03e5927cc6721f376b05b),
  519 tests in all. Thanks to xet7.
- [Scrum: the Sprint Report's scope and burndown, change by change](https://github.com/wekan/caddy-wekan-plugin/commit/85ed43a180ac09ce08cc434f8aaecff4d60e413a) -
  replayed from History as WeKan's scrumScopeReplay, and marked incomplete
  when History does not reproduce the sprint's own snapshots;
  [WeKan's scope-history test on Weddy](https://github.com/wekan/weddy/commit/69a4108d802e86760ed4aa613f864cb5f8b788f3),
  520 tests in all. Thanks to xet7.
- [Scrum: the native Scrum transfer in the board export](https://github.com/wekan/caddy-wekan-plugin/commit/61d9577c94de0da5813f484d3d43ba2f87cd400c),
  [imported with a board](https://github.com/wekan/caddy-wekan-plugin/commit/8b9256fe0cf8c0498dfa8a7eaf4f1c0d2bd6d28e),
  [and into an existing board](https://github.com/wekan/caddy-wekan-plugin/commit/083cdc16662bd680e5c8e7f8d50744ccfe0b6456) -
  WeKan's wekan-scrum-2 file: sprints with their snapshots, releases, events,
  observations and the cards' planning, what a scoped export left out named;
  an import gets new ids and the same outcomes, refuses a file that does not
  hold together, and into an existing board matches what it has, never
  duplicating it - one History row; [the import page takes a pasted WeKan
  export](https://github.com/wekan/caddy-wekan-plugin/commit/5c2cedafca9e2ec34dd0077b2d195bd758710a0d);
  [WeKan's tests on Weddy](https://github.com/wekan/weddy/commit/0ab1e907ae7ca62c209610fb9775d39ddfae31d8), 529
  tests in all. Thanks to xet7.
- [Scrum: board and card copies carry it as WeKan's do](https://github.com/wekan/caddy-wekan-plugin/commit/60d7002730038e8841d764bb80961c79c1a058b2),
  [WeKan's copyList and copySwimlane](https://github.com/wekan/caddy-wekan-plugin/commit/40bb04a64f2814425296d4111591042af042b015)
  and [moves, with WeKan's moveSwimlane](https://github.com/wekan/caddy-wekan-plugin/commit/a584bdf52b17ae2f21c0ba3a39de9b46a233f970) -
  on its own board a copy keeps its Scrum; on another, its sprint and
  releases are linked by name and the rest of the board left's is dropped,
  and a list keeps its category; a copied card never carries the source's
  List Sync binding; [WeKan's tests on Weddy](https://github.com/wekan/weddy/commit/ec60f2eef5fcbec7e01854ba3fcb247089da1850),
  535 tests in all. Thanks to xet7.
- [Scrum: the card's and minicard's Scrum fields](https://github.com/wekan/caddy-wekan-plugin/commit/269b8d28264b8e6a6fd7462668f7e036a833f3f4),
  [History's durable undo, redo and Restore with request ids](https://github.com/wekan/caddy-wekan-plugin/commit/39181cdcb2fd823070615ad4fdc734a8d305c3e9),
  [keyed Ctrl+Z and the Scrum views' History](https://github.com/wekan/caddy-wekan-plugin/commit/82039ee6672d7980990e6ff8f68207c64e85fba7),
  [a stopped History operation's rollback or discard](https://github.com/wekan/caddy-wekan-plugin/commit/37672b224418a46284e1ad72c315ea782809561a),
  [an interrupted import finished online](https://github.com/wekan/caddy-wekan-plugin/commit/453e72662ed5da125e4abccb69628c597d7d5ae4)
  and [Scrum and rule rows' details in History](https://github.com/wekan/caddy-wekan-plugin/commit/e49d601a8a1d7589e7b069fe7c2a39702d5fe8ae) -
  a Scrum undo is a checkpoint saved before its first write, resumed without
  repeating one and never over a newer edit, its receipts WeKan's so either
  server finishes the other's; a retried Ctrl+Z repeats its request rather
  than undoing more. [FerretDB: a field named rowId was read as SQLite's
  ROWID](https://github.com/wekan/FerretDB/commit/e45515c155860a3d12844bee4cff32c19e702cc4), so the receipts were
  never found by it. [WeKan's tests on Weddy](https://github.com/wekan/weddy/commit/92a57e021a495f38d37e84c67f88ad088ad711ac),
  593 tests in all: every Scrum spec but one test. Thanks to xet7.
- [History: a keyed Ctrl+Z settles its request as soon as the reply arrives](https://github.com/wekan/caddy-wekan-plugin/commit/01981d3919f0d9d84b388912cc374cec1263e24e) -
  it waited for a refresh of the user, and WeKan's test found the request
  still stored now and then. Thanks to xet7.
- [Scrum: a large sprint's close rolls over in the background, and a large change's History is a batch](https://github.com/wekan/caddy-wekan-plugin/commit/50f7b573a2f03180eb087866dad7c469e2a24ab1) -
  a close over 2000 cards returns at once, its progress in the Scrum view;
  History rows of at most 1000 records or 3 MB a side, one undo taking back
  the whole batch, in the background when it is long. [FerretDB: an `$eq`
  filter uses the SQL filter and the indexes](https://github.com/wekan/FerretDB/commit/3d06e00bea47e1118a7fcae54672217cd3263b28),
  so a lookup by id no longer scans its collection. [WeKan's
  snapshot-limits tests on Weddy](https://github.com/wekan/weddy/commit/adf2d19fe4e40a437773b17da77fd499b43e1430),
  596 tests in all. Thanks to xet7.

- [A board's organizations, teams and e-mail domains, as WeKan's board methods set them](https://github.com/wekan/caddy-wekan-plugin/commit/bce014a669247b0e55bd1c63cd443515eef47275) -
  setBoardOrgs, setBoardTeams, setBoardDomains, addBoardDomain and
  removeBoardDomain: a board admin adds only the groups they belong to, and
  each domain is checked and kept once. Thanks to xet7.

- [Admin Panel -> Problems -> Security Report](https://github.com/wekan/caddy-wekan-plugin/commit/dc0af3788b5d95aeee716da494604aaa63f9d26b) -
  the security log's summary rows, as WeKan's, searched and paged: which Bleed,
  from where, by whom and how many times, never a value an attempt carried.
  Thanks to xet7.

- [WeKan's inline Add List composer, after any list](https://github.com/wekan/caddy-wekan-plugin/commit/0dd8e09e3674b31e4a4e7083a99c249841295991) -
  a list header's + adds lists right after that list, one or one a line, with
  the member's submit-on-Enter preference, through WeKan's createListAfter.
  Thanks to xet7.

- [WeKan's Create Board pop-over in the header, one board or one a line](https://github.com/wekan/caddy-wekan-plugin/commit/7482aeaece7629371c9c6fb265300a9f2a698586) -
  for whoever may make a board, each one through the board creation policy.
  Thanks to xet7.

- [Subtasks in the card details, as WeKan's](https://github.com/wekan/caddy-wekan-plugin/commit/c9999f820462126877dfa3e13afa9c4a1218d72f) -
  the card's subtasks and "Add Subtask", made on the board's subtasks board in
  the list and swimlane WeKan's landing rules choose, never on a board the
  maker may not write. Thanks to xet7.
- [A subtask ticked done from its parent, and the done/total count](https://github.com/wekan/caddy-wekan-plugin/commit/e80829d054dbfb14e1085e1502a82ea81bcc1262) -
  wekan/wekan#4693, by whoever may edit that subtask. Thanks to xet7.

- [An upload goes to GridFS when Admin Panel's default storage is GridFS](https://github.com/wekan/caddy-wekan-plugin/commit/49dc8474c8a3e629f8adf192d4a8afbc6688020b) -
  as WeKan's, with WeKan's metadata, read back from there. Thanks to xet7.

- [WeKan's ZIP preview: an archive's entry names in the attachment viewer](https://github.com/wekan/caddy-wekan-plugin/commit/702fdefb005170cda12c020f37c74603dee7bbda) -
  read from its central directory, nothing inflated, within WeKan's limits.
  Thanks to xet7.

- [Meteor's /settings/update, a site admin's, as WeKan's allow rule and schema have it](https://github.com/wekan/caddy-wekan-plugin/commit/ff1797b6c4dce8aa761c064a911b44972bdd6a06) -
  the settings' scalar fields, each checked as the schema checks it. Thanks to
  xet7.

- [The multi-selection's own UI: selection checkboxes, Move and mixed drag](https://github.com/wekan/caddy-wekan-plugin/commit/0c18f3c2b68590ed845fff79c8f3091bd4a5a2c8) -
  swimlanes, lists, cards, checklists and items selected and moved together, to
  a destination picked step by step or by dropping them, as WeKan's; the
  minicard shows the checklists marked for it. Thanks to xet7.

- [Folding swimlanes, minicards and their checklists, each the user's own](https://github.com/wekan/caddy-wekan-plugin/commit/be30f2e69f4a8cc3262d8b925553230965188269) -
  as WeKan's, so a mixed selection drags into and out of folded parts too.
  Thanks to xet7.

- [Board Settings / Card: WeKan's Card Settings, both sides, its Scrum rows included](https://github.com/wekan/caddy-wekan-plugin/commit/351893b7393c07b41b28f5f58107ca5b49e4d58e) -
  the Minicard and Card panes with every section's rows, from WeKan's own
  table; a board admin's checkboxes write only those board fields, the Scrum
  rows their visibility flags; the minicard shows the work item type's badge;
  [WeKan's Card Settings tests on Weddy](https://github.com/wekan/weddy/commit/6e3a2f0c4c958bf4e1e184c4736107f3b0c5217e).
  Thanks to xet7.

- [Card Settings' sides on the minicard and the card, and outside changes redraw the board](https://github.com/wekan/caddy-wekan-plugin/commit/a232834a9bf977888d4e52ff65baac5d9677e035) -
  colour, requested by, location, last change, the card's caret, swimlane
  name and description badge, each by its board flag; a board changed by
  another program on the database redraws on the pages that show it, as
  WeKan's reactive pages do;
  [all of WeKan's card-settings-both-sides spec on Weddy](https://github.com/wekan/weddy/commit/08468576fddf651785ffdb1bfec1d809e8f990b4).
  Thanks to xet7.

- [Card Settings: sections and rows dragged into order, and the opened card follows the Card pane](https://github.com/wekan/caddy-wekan-plugin/commit/f2f24545b8ea3647fcd702a9d996590e8c80332d),
  [each section full width and a part opened during a redraw kept open](https://github.com/wekan/caddy-wekan-plugin/commit/88ed1b376475c6267472381eeab7d032d80a3f6d),
  and [the minicard following the Minicard pane, with the user's profile followed live](https://github.com/wekan/caddy-wekan-plugin/commit/8c4fab223ace142da95b1e08fba3db72e6dba261) -
  WeKan's one section model on both sides, its orders written as WeKan
  writes them; [WeKan's ordering tests on Weddy](https://github.com/wekan/weddy/commit/719a26f6b2e332de2a6972da13d6a5f0b98a2cc6).
  Thanks to xet7.

- [Card Settings: the panes side by side or stacked, the splitter, folding panes and the corner grip](https://github.com/wekan/caddy-wekan-plugin/commit/73412f93c05ad02593135d66aa1e33be78fb71e9) -
  as WeKan's pop-over, the split kept in the user's profile;
  [WeKan's layout tests on Weddy](https://github.com/wekan/weddy/commit/4e04be2645e84aec9d4b01009bcf6184023e5b23).
  Thanks to xet7.

- [Card Settings: the sections' hamburgers, Card's move reason and the board's Subtasks Settings](https://github.com/wekan/caddy-wekan-plugin/commit/a7bff0f63b16a96d20da5accbb2599d632b29f20) -
  opened under the section's line; a subtasks board the admin may not write
  is refused as SubtaskDepositBleed;
  [WeKan's hamburger test on Weddy](https://github.com/wekan/weddy/commit/52e5918039af2d530da68997ca2f677b59f821c3).
  Thanks to xet7.

**FerretDB** - the database Weddy runs, as WeKan's queries and specs need it.

- [The positional `$` update operator](https://github.com/wekan/FerretDB/commit/feb557e54bb0b95b5647875ac940225f77cbfc87) -
  `members.$.isAdmin` with a filter on `members.userId` updates the member the
  query matched, as in MongoDB, where FerretDB answered "Cannot create field
  '$'". Thanks to xet7.

**Release** - what a release says it is made of.

- [NetBSD/amd64 builds: go-systemd v22.6.0 for NetBSD, without the function x/sys cannot build there](https://github.com/wekan/weddy/commit/486ba1828013577ff0609b5ef7d31cfea8fff5d3); 19 of 20 platforms build. Thanks to xet7.
- [Local builds build xcaddy for this computer, so Windows, macOS and the BSDs build too](https://github.com/wekan/weddy/commit/6a08aa37ae585b7aff817b4ff4f12b596c2211f7). Thanks to xet7.
- [The release notes list caddy-ferretdb-plugin and wekan/FerretDB with their commits](https://github.com/wekan/weddy/commit/97cb0638e351f02dc87ea1a0cb830afe1b0f5eec). Thanks to xet7.

**Many domains** - the Cloud Panel, in Weddy.

- [Change history: WeKan's row integrity hash](https://github.com/wekan/caddy-wekan-plugin/commit/cc61229faee776eab7e5bc02f4ccd9bee9a7ad2e),
  [its writer gate and both chains](https://github.com/wekan/caddy-wekan-plugin/commit/cd6543cd0daba0c5e0c69ab1ebd52a2fa83c96f0),
  [a card's field edits recorded and undone](https://github.com/wekan/caddy-wekan-plugin/commit/040110d7f66027f1a8716ec75daffe11bdba1777),
  [a card's move as one position row](https://github.com/wekan/caddy-wekan-plugin/commit/3f09d41f3eb520a2c24c2b88ad2b1214c7aa8fdf),
  [lists', swimlanes', checklists', items' and comments' edits](https://github.com/wekan/caddy-wekan-plugin/commit/0c327d2eaad8ab49d23c548082f37e8b48fc5d1c),
  [changeHistory.page](https://github.com/wekan/caddy-wekan-plugin/commit/c40231931dfabc804f13e7bae0368d68d14d7c66),
  [changeHistory.restore and the row access check](https://github.com/wekan/caddy-wekan-plugin/commit/fd1f936122bfab0d195dd5a828800721442df37b),
  [the History page and Ctrl+Z / Ctrl+Shift+Z](https://github.com/wekan/caddy-wekan-plugin/commit/867ca54b6a44b8f29493160ac110ab382c445f2c),
  [Member Settings' History](https://github.com/wekan/caddy-wekan-plugin/commit/9f0d9fba4654a3bc3f76bfb4de8ed9a787db7c86),
  [attachments' upload, delete and restore](https://github.com/wekan/caddy-wekan-plugin/commit/73fbe71c65590d4199d992f8ef27b76692a311a4),
  [rules' history, and open boards redrawn after a REST rule write](https://github.com/wekan/caddy-wekan-plugin/commit/6d3af47067e28b5e47882b01dfdccb2b030bb18f),
  and [a list's soft delete with undo and redo](https://github.com/wekan/caddy-wekan-plugin/commit/3ca9b1d0bc23de8b9d1bffd5503150090c8c2f82) -
  rows Weddy writes pass WeKan's own audit, WeKan and Weddy writing one board
  never fork its chain, and undo restores a deleted list with only the cards
  deleted with it (#1023). The board no longer shows what is soft-deleted.
  Thanks to xet7.
- [moveBoardObjects: WeKan's Move of a mixed selection, within and across boards](https://github.com/wekan/caddy-wekan-plugin/commit/bbbb9476ef1b49b4049d42256e60f9a013edc7c7) -
  swimlanes, lists, cards, checklists and items at once, everything checked
  before anything is written, before or after an anchor. Thanks to xet7.
- [Board members: WeKan's inviteUserToBoard and searchUsers, the invitee's bell, and the same-Organization/Team restriction](https://github.com/wekan/caddy-wekan-plugin/commit/cfcba67585ff5ad4ea1f5f1828ea668f9a5a6399) -
  by username or e-mail in any letter case, a new address as a new account,
  an existing invitee told in the bell (#3136); and Admin Panel's "board members
  only from the same Organization / Team", which Weddy ignored, now holds for
  the method, the Members widget and the search (#6116). Thanks to xet7.
- [WeKan's password policy settings, with WeKan's report-only default](https://github.com/wekan/caddy-wekan-plugin/commit/9b98046e3a4cfc534077648daf9e844c181c9969) -
  PASSWORD_MIN_LENGTH, PASSWORD_MIN_LENGTH_ENFORCE and PASSWORD_CHECK_PWNED,
  overridden in Admin Panel's login settings. Weddy's default changes: a
  password under 8 characters is accepted unless the minimum is enforced, as in
  WeKan. Thanks to xet7.
- [Admin Panel / Problems / Password length](https://github.com/wekan/caddy-wekan-plugin/commit/512955000845c8b51a713aff943d4276d0d80241) -
  the minimum and enforcing it, over the environment, and the accounts that
  sign in with a shorter password, by WeKan's filters. Thanks to xet7.
- [PASSWORD_CHECK_PWNED refuses a breached password, and a refusal says its minimum](https://github.com/wekan/caddy-wekan-plugin/commit/f44e312a52ab32d0c9afecfa0a7ebf68d372c256) -
  only five hex digits of the password's SHA-1 leave Weddy; and a refused
  password's text was its untranslated key. Thanks to xet7.
- [Password policy, the rest: short sign-ins listed for Admin Panel, and the change required while enforced](https://github.com/wekan/caddy-wekan-plugin/commit/af549acf643a90ce6944b172ee2055059bdcb315) -
  as WeKan, changing one's own password now signs every session out, this one
  too, and a reset no longer signs in. Thanks to xet7.
- [WIP limits, and the Archive's Restore into a list full at a hard limit](https://github.com/wekan/caddy-wekan-plugin/commit/ffbed2c3623264d47730664822fbb9138c69a848) -
  WeKan's applyWipLimit, enableWipLimit and enableSoftLimit; a card whose list
  is full goes to a list with room the Archive offers, and Restore all says how
  many it left out (#6772). Thanks to xet7.
- [Many WeKan domains from one Weddy, with the Cloud Panel](https://github.com/wekan/weddy/commit/ab862c2e81d0caa20f453ebe7f54d462b3a2c076). Thanks to xet7.

and fixes the following bugs:

- [Exported dates as WeKan writes them, a card's odd field never hides the card, and no title twice](https://github.com/wekan/caddy-wekan-plugin/commit/9abbe3bf1592f1d012d4509af832b4560061bf97) -
  exports and the Scrum transfer wrote "...53.67Z" where WeKan writes
  "...53.670Z"; a date stored as text made a card unreadable; a section's
  heading repeated its fields' own title and pushed the card down. Thanks to
  xet7.
- [A live update keeps an opened part of the card details open](https://github.com/wekan/caddy-wekan-plugin/commit/f4c5317afec26b741407eda7f4e652055233a77d) -
  the Scrum fields' editor closed whenever somebody else's change re-rendered
  the board. Thanks to xet7.
- [A large Scrum close's test times out on standing still, not on the whole](https://github.com/wekan/caddy-wekan-plugin/commit/f48f8451dc24f269a3ed7e793a3c0425ef02b2b3) -
  under the plugin's parallel tests the undo's batch job was cut off while
  still advancing. Thanks to xet7.
- [A member who leaves a board leaves its cards as in WeKan, and it is in the change history](https://github.com/wekan/caddy-wekan-plugin/commit/b98cf24c18b23ea3f297e09c939f1a5495439445) -
  an admin's removal and quitBoard both take the person off the cards'
  members, requesters, assigners and watchers (assignees stay, as WeKan's), the
  lists' and the board's watchers and a private board's star, the entry
  inactive, no admin and without grantedBy; each card's change is a History row
  by whoever did it. Removal pulled members and assignees unrecorded, and
  quitBoard left every card as it was. Thanks to xet7.
- [A deleted custom field's values leave every board's cards, and it is in the change history](https://github.com/wekan/caddy-wekan-plugin/commit/66e93c2cfda7796b57d7b8cb01b3aa83d114597e) -
  as WeKan's CustomFields.before.remove, from every board in the field's
  boardIds, each card a History row by the deleter; the REST delete pulled them
  from the path's board alone, unrecorded. The guard of unrecorded writes now
  sees bulk deletes too, which leaves only the writes WeKan does not record
  either. Thanks to xet7.
- [WeKan's indexes on a database Weddy alone runs](https://github.com/wekan/caddy-wekan-plugin/commit/1b3127e93a42456d9fc0dd0e006b5d68d2d8c547) -
  `cmd/sync-indexes` copies WeKan's 186 `ensureIndex` calls, with their sparse,
  unique and TTL options, and Weddy creates them before its first request, so
  the LDAP id, cards' assignees and members, and History by entity and hash
  (wekan/wekan#6892) are indexed without a WeKan ever starting there. Thanks to
  Raymond-Voogt and xet7.
- [A language set from the page changes the page at once, as in WeKan](https://github.com/wekan/caddy-wekan-plugin/commit/53471ff4ac819a607a268d0811ca7128667a86b4) - it stayed in the old language until the next load. Thanks to xet7.
- [The seven WeKan languages whose file is not named by their tag are offered](https://github.com/wekan/caddy-wekan-plugin/commit/49e46755bca8661bba3954f12144144851fd3514) - be-BE, ca-ES, ca-valencia, de-DE, ja-Hira, or-IN and zh-SG were left out by the translation copy; 244 languages now. Thanks to xet7.
- [A board member keeps every field WeKan wrote, grantedBy included](https://github.com/wekan/caddy-wekan-plugin/commit/263c070092d6ad83fda6cca4f69631cf90fd46f7) - Weddy's rewrites of a board's members dropped the orgs and teams a membership came through (\#4178), so leaving the group no longer took the board away. Thanks to xet7.
- [FerretDB: a negation over an array of documents holds only for every element](https://github.com/wekan/FerretDB/commit/9e211ce9468cf229ecaf2b7489d3178504fcb409) - `$ne`, `$nin` and `$not` on a path such as `teams.teamId` matched when any element differed, so an add-once update pushed duplicates. Thanks to xet7.
- [A local rebuild of the same Weddy commit replaces its .xz instead of failing](https://github.com/wekan/weddy/commit/b6fff13a19ecbd9c659dce3422edf94432c373de). Thanks to xet7.
- [Meteor's /integrations/update and /customFields/update, under WeKan's allow rules](https://github.com/wekan/caddy-wekan-plugin/commit/d9003aafa53cfb5a4dce4ead51746f4d67e942de) -
  a board admin edits their board's webhook and a writer a custom field's
  definition, as WeKan's pages do; a move to another board stays RepointBleed.
  Thanks to xet7.
- [Problems -> Recovery: a row being delivered turns back by itself when its lease is released](https://github.com/wekan/caddy-wekan-plugin/commit/c1849fdf3511857b1217e1f5b11a1983f8f375df) -
  the report was asked once, so a row loaded while automatic recovery held its
  lease kept its buttons disabled until a reload; it now asks again while a row
  is processing, as WeKan's reactive report updates. Thanks to xet7.
- [Problems -> Recovery: an administrator's retry, pause and cancel wait a moment for automatic recovery's lease](https://github.com/wekan/caddy-wekan-plugin/commit/b3be01d165428d77775d188d8d6a0186d459e18c) -
  a click in that moment, and a stale request, were answered "busy" at once.
  Thanks to xet7.
- [A logged-out method call gets the error WeKan's method throws](https://github.com/wekan/caddy-wekan-plugin/commit/a4adb0bfabdf1b4b4fcd6eafa9158fa776056299) -
  error-notAuthorized for importBoard and importScoped, not-logged-in for the
  collapse and the star, so WeKan's ImportBleed spec passes against Weddy.
  Thanks to xet7.
- [The WeKan and FerretDB plugins follow the dependencies wekan/FerretDB updated](https://github.com/wekan/caddy-wekan-plugin/commit/7bb0566ca653a24961f5a4987fb1ed8e952e4b1d) - SAP/go-hdb v1.21.0,
  golang.org/x/sys v0.50.0 and modernc.org/libc v1.80.1, for which go vet and go
  test asked for go mod tidy; [the same in caddy-ferretdb-plugin](https://github.com/wekan/caddy-ferretdb-plugin/commit/5fb52acc85e2ecb4929c17476241f95ddd41419a). Thanks to xet7.

and fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:

- [Gitea in Weddy: the container tag list's allocation from ?n=, 32-bit wraps, and credentials in the access log](https://github.com/wekan/caddy-gitea-plugin/commit/1cf3aca662f297881b2c47486c1ed80bb5c432f2) - as caddy-gitea-plugin's dist/gitea/security-hardening.patch; the other alerts in Gitea's code are reviewed in its [Hall of Fame](https://github.com/wekan/caddy-gitea-plugin/wiki/Hall-of-Fame). Thanks to GitHub CodeQL and xet7.
- [WeKan in Weddy: request values only through $eq, bounded argon2, Secure cookies](https://github.com/wekan/caddy-wekan-plugin/commit/1a1c8fb30f7e22e8fb4274c772b6556bbaf7478a) - see caddy-wekan-plugin's [Hall of Fame](https://github.com/wekan/caddy-wekan-plugin/wiki/Hall-of-Fame). Thanks to GitHub CodeQL and xet7.
- [Weddy's own scripts: a linear pattern in sync-from-wekan.py](https://github.com/wekan/weddy/commit/90f1439a41c532f0df37b92a46a25ca39958076e), and [Meteor's pre-hash in the test helper with Web Crypto, as WeKan's #599](https://github.com/wekan/weddy/commit/9b0bd53fbfd486ad8380dfb0f6b88e915187158c) - see Weddy's [Hall of Fame](https://github.com/wekan/weddy/wiki/Hall-of-Fame). Thanks to GitHub CodeQL and xet7.

and fixes the following SECURITY ISSUES found by Dependabot:

- [No go-jose v3 in any plugin: go.step.sm/crypto v0.92.0 and smallstep/certificates at Caddy master's commit](https://github.com/wekan/caddy-wekan-plugin/commit/1a1c8fb30f7e22e8fb4274c772b6556bbaf7478a) - go-jose v3 <= 3.0.5 ([GHSA-mgcc-cww5-fp2q](https://github.com/advisories/GHSA-mgcc-cww5-fp2q), [GHSA-4w3g-jfj2-cw2q](https://github.com/advisories/GHSA-4w3g-jfj2-cw2q), [GHSA-vvm8-gf78-28g4](https://github.com/advisories/GHSA-vvm8-gf78-28g4)) has no patched release; also in [caddy-ferretdb-plugin](https://github.com/wekan/caddy-ferretdb-plugin/commit/926d05287ddb43c3dec197f1d979215f456a006c), [caddy-gitea-plugin](https://github.com/wekan/caddy-gitea-plugin/commit/7701fabcfaf1d1962d70d57652958ca1b76667cb) and [caddy-rclone-plugin](https://github.com/wekan/caddy-rclone-plugin/commit/7e06669906020a1ef0a96d7f41c9578790e1fd95). Thanks to Dependabot.
- [The test harness's minimatch is 11.0.7](https://github.com/wekan/weddy/commit/cb5e6cad67d3d2b0db5fb3ceed352b7ddc1a43ab) - Dependabot alert #1: minimatch >= 7.0.0, < 11.0.1 lets a pattern's "**/../" multiply its glob parts and then compares them pairwise; archiver's readdir-glob asks for ^10, so tests/wekan/package.json overrides it to ^11.0.1, as WeKan does, and tests/dependencySecurity.test.py pins the lockfiles and runs an amplifying pattern - about 9 s on 10.2.6, milliseconds on 11.0.7. Thanks to Dependabot.
- [The minimatch check passes when 11.0.7 refuses the amplifying pattern at once](https://github.com/wekan/weddy/commit/ddc27a6df37c26798720fa95371eae157c638fec) -
  it read only a number from node, so the RangeError counted as a failure;
  compiling and refusing quickly are both the fix, and 10.2.4 still takes about
  9 s. Thanks to xet7.

Thanks to above GitHub users for their contributions and translators for their translations.
