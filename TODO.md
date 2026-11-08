# TODO: what is still in progress at Weddy

What Weddy, and the plugins it is built from, do not do yet. When an item is
done, it is **removed from here and moved to the `# Upcoming weddy release`
section of [CHANGELOG-big.md](CHANGELOG-big.md)**, as an entry that links its
commit (then `python3 -I releases/changelog-short.py` regenerates
[CHANGELOG.md](CHANGELOG.md)). This file only ever lists unfinished work.

## WeKan in Go (caddy-wekan-plugin)

- **WeKan's pages as Go Pug templates.** 14 of WeKan's 174 Jade templates are
  started: sign-in and sign-up, All Boards, the board, its swimlanes, lists and
  cards, a card's title, description and attachments, the profile and the
  language, People and the Cloud Panel. The other 160 are listed in caddy-wekan-plugin's
  [TEMPLATES.md](https://github.com/wekan/caddy-wekan-plugin/blob/main/TEMPLATES.md):
  card details (dates, members, labels, checklists, comments, attachments,
  custom fields), the board header and its menus, the board views, Admin Panel,
  Member Settings, search, templates, rules, import and export.
- **Attachments, the rest**: thumbnails and previews, copy and move to another
  card, and storage other than the file system (S3, GridFS) that Node.js WeKan
  can use.
- **Users, the rest**: invitation codes and invitations to a board, forgot
  password and e-mail verification (both need outgoing e-mail), avatars, and
  the rest of Admin Panel (settings, organizations, teams).
- **LDAP, CAS and SAML login**: OAuth2/OIDC is done with WeKan's OAUTH2_*
  settings; these three need a directory server or an identity provider to test
  against, which the development sandbox does not have - build them with WeKan's
  LDAP_*, CAS_* and SAML_* settings and a test server of each.
- **The rest of WeKan's REST API**: checklist items' edit and delete, comment
  edit and delete, bulk delete, copy and move of cards, boards and lists, linked
  cards, rules, export and import, users and `/api/user/cards` (the other tests
  of WeKan's `tests/playwright/specs/17-rest-api` and `23-rest-api-more`).
- **Activities in the pages, and notifications**: changes are recorded as
  Node.js WeKan records them, but Weddy's pages do not show the activity feed
  yet, and nothing is sent by e-mail.

## Tests

- **More of WeKan's own specs against Weddy**: `tests/wekan/wekan-specs.txt`
  names 18 tests so far; add each of WeKan's specs, or one test of it, when Weddy
  has its part. `WEDDY_WEKAN_SPECS=all ./build.sh everything` shows how far it is.
- **Firefox and WebKit**: the browser tests have run in Chromium only. In the
  VSCodium Flatpak sandbox Playwright's Firefox needs a newer NSS (3.126) than
  the runtime has, and WebKit needs libevent, enchant, flite and more; run
  `WEKAN_PLAYWRIGHT_ALL=1 ./build.sh everything` on a computer or in a
  container that has them.
- **NetBSD**: 18 of the 20 platforms build locally; the two NetBSD ones do not,
  for reasons upstream, not in Weddy's code:
  - netbsd/amd64: rclone's logging uses github.com/coreos/go-systemd/v22
    v22.7.0, whose `daemon/sdnotify_unix.go` calls `unix.CLOCK_MONOTONIC`, which
    golang.org/x/sys (v0.49.0, the newest) does not define for NetBSD - fix it in
    go-systemd or x/sys, or build rclone's logging without it;
  - netbsd/arm64: modernc.org/libc (v1.79.0), under the pure-Go SQLite that
    FerretDB and Gitea use, has no netbsd/arm64 port.

## For the maintainer (on GitHub)

- Dismiss caddy-wekan-plugin's code scanning alert **#9** as a false positive:
  SHA-256 is Meteor's password pre-hash, not the stored hash (see the plugin
  wiki's [Hall of Fame](https://github.com/wekan/caddy-wekan-plugin/wiki/Hall-of-Fame)).
- Dismiss caddy-gitea-plugin's reviewed code scanning alerts - #1-#25, #28-#31,
  #33, #35-#38, #40-#58 and #60-#63 - as false positives or "used in tests / by
  design", with the reasons of its wiki's
  [Hall of Fame](https://github.com/wekan/caddy-gitea-plugin/wiki/Hall-of-Fame); #26,
  #27, #32, #34 and #39 are fixed.
