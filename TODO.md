# TODO: what is still in progress at Weddy

What Weddy, and the plugins it is built from, do not do yet. When an item is
done, it is **removed from here and moved to the `# Upcoming weddy release`
section of [CHANGELOG-big.md](CHANGELOG-big.md)**, as an entry that links its
commit (then `python3 -I releases/changelog-short.py` regenerates
[CHANGELOG.md](CHANGELOG.md)). This file only ever lists unfinished work.

## WeKan in Go (caddy-wekan-plugin)

- **WeKan's pages as Go Pug templates.** 18 of WeKan's 174 Jade templates are
  started: sign-in and sign-up, All Boards, the board, its swimlanes, lists and
  cards, a card's title, description and attachments, the profile and the
  language, People, the Cloud Panel, the sidebar's board menu and the Export
  pop-over, comments and activities. The other 156 are listed in caddy-wekan-plugin's
  [TEMPLATES.md](https://github.com/wekan/caddy-wekan-plugin/blob/main/TEMPLATES.md):
  card details (dates, members, labels, checklists, comments, attachments,
  custom fields), the board header and its menus, the board views, Admin Panel,
  Member Settings, search, templates, rules, import and export.
- **Attachments, the rest**: thumbnails and previews, copy and move to another
  card, and storage other than the file system (S3, GridFS) that Node.js WeKan
  can use.
- **Users, the rest**: outgoing e-mail, invitations (sent, signed up with,
  accepted and declined), e-mail verification links and forgot password are
  done; sending a verification mail at sign-up,
  avatars, and the rest of Admin Panel (settings, organizations, teams).
- **LDAP, CAS and SAML login**: OAuth2/OIDC is done with WeKan's OAUTH2_*
  settings; these three need a directory server or an identity provider to test
  against, which the development sandbox does not have - build them with WeKan's
  LDAP_*, CAS_* and SAML_* settings and a test server of each.
- **The rest of WeKan's REST API**: WeKan's own REST tests of specs 17, 23,
  28 and 40 now run against Weddy; these routes of WeKan's are still missing:
  the Excel and PDF exports, the chart exports, and the other tools' formats
  (Markdown, OPML, Todoist and the rest) of the export of all boards; Admin
  Panel's attachment settings, OAuth providers, passwordless login, all
  domains, and organizations and teams (which Weddy does not have yet);
  imports from other tools; inbound e-mail; and a card's bot
  runs.
- **Rules, the rest**: rules run on activities, button rules from
  rules.runButton, and the Rules page with board, card, checklist and
  button triggers, board, card and checklist actions, rule details and
  selection, Import / Export of JSON and a workflow view; still to come
  are the scheduled triggers, the mail actions, editing a rule, importing
  CSV, Trello Butler and Wrike workflows, the workflow view's palette,
  the bots and blocks views,
  triggers with {tokens},
  advanced-filter, move-direction and text-contains triggers, and the
  e-mail, bot, copy, link, sort and relative-date actions.
- **Notifications, the rest**: activities notify as Node.js WeKan's do and
  the header shows the unread ones; the notifications drawer (reading them,
  marking them read), watching a list from the pages, and delivery by e-mail
  are still to come.

## Tests

- **More of WeKan's own specs against Weddy**: `tests/wekan/wekan-specs.txt`
  names 260 tests so far; add each of WeKan's specs, or one test of it, when Weddy
  has its part. `WEDDY_WEKAN_SPECS=all ./build.sh everything` shows how far it is.
- **Firefox and WebKit**: the browser tests have run in Chromium only. In the
  VSCodium Flatpak sandbox Playwright's Firefox needs a newer NSS (3.126) than
  the runtime has, and WebKit needs libevent, enchant, flite and more; run
  `WEKAN_PLAYWRIGHT_ALL=1 ./build.sh everything` on a computer or in a
  container that has them.
- **netbsd/arm64**: 19 of the 20 platforms build locally; this one does not,
  for a reason upstream: modernc.org/libc (v1.79.0), under the pure-Go SQLite
  that FerretDB and Gitea use, has no netbsd/arm64 port.

## For the maintainer (on GitHub)

Code scanning alerts are closed by changing the code so the next analysis no
longer finds them - as WeKan and FerretDB closed theirs; a CodeQL workflow of
our own conflicts with GitHub's default setup, and inline codeql[] comments do
not close an alert under it. What the code cannot change is left to dismiss:

- caddy-gitea-plugin's alerts in upstream Gitea's code, reviewed in its wiki's
  [Hall of Fame](https://github.com/wekan/caddy-gitea-plugin/wiki/Hall-of-Fame) as
  not vulnerabilities - #1-#25, #28-#31, #35-#38 and #40-#58 - and #26 and #27
  if they stay open (the access log is given a redacted copy of the request,
  which code scanning may not see as a sanitizer). Dismiss them as "False
  positive" with the reasons there - or, to stop scanning Gitea's code in
  gitea/, switch the repository to the advanced setup with a paths-ignore for
  gitea/, turning the default setup off first.
