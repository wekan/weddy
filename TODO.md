# TODO: what is still in progress at Weddy

What Weddy, and the plugins it is built from, do not do yet. When an item is
done, it is **removed from here and moved to the `# Upcoming weddy release`
section of [CHANGELOG-big.md](CHANGELOG-big.md)**, as an entry that links its
commit (then `python3 -I releases/changelog-short.py` regenerates
[CHANGELOG.md](CHANGELOG.md)). This file only ever lists unfinished work.

## WeKan in Go (caddy-wekan-plugin)

- **WeKan's pages as Go Pug templates.** 19 of WeKan's 174 Jade templates are
  started: sign-in and sign-up, All Boards, the board, its swimlanes, lists and
  cards, a card's title, description and attachments, the profile and the
  language, People, the Cloud Panel, the sidebar's board menu and the Export
  pop-over, comments and activities, and Problems' Recovery. The other 155 are listed in caddy-wekan-plugin's
  [TEMPLATES.md](https://github.com/wekan/caddy-wekan-plugin/blob/main/TEMPLATES.md):
  card details (members, labels, checklists - added, renamed,
  deleted and exported, items added, edited, checked and deleted; moved and
  copied; items given an assignee, a due date and a new
  order; not yet dragged between checklists -
  comments, attachments, custom fields - done), the board header and its menus, the board views, Admin Panel,
  Member Settings, search, templates, rules, import and export. The card
  description is edited in place, and a list ends with WeKan's "+ Add card".
- **Attachments, the rest**: previews of documents and video, thumbnails in
  WebP as WeKan's (pure Go writes JPEG and PNG), writing to GridFS (Weddy
  reads it), and the cloud stores (S3 and the others) that Node.js WeKan can
  use.
- **Users, the rest**: outgoing e-mail, invitations, e-mail verification
  (sent at sign-up too), forgot password, avatars, and organizations' and
  teams' feature flags and group sync, and Admin Panel / People's users,
  organizations and teams are done; the rest of Admin Panel (its settings
  panes) is not.
- **LDAP, CAS and SAML login**: OAuth2/OIDC is done with WeKan's OAUTH2_*
  settings; these three need a directory server or an identity provider to test
  against, which the development sandbox does not have - build them with WeKan's
  LDAP_*, CAS_* and SAML_* settings and a test server of each.
- **The rest of WeKan's REST API**: WeKan's own REST tests of specs 17, 23,
  28 and 40 now run against Weddy, and the board, card and chart exports as
  Excel and PDF, every chart included; these routes of WeKan's are still
  missing: the Scrum charts' rows (Weddy has no sprints yet), the
  other tools' formats (Trello, Todoist and the rest - Markdown, OPML,
  todo.txt, Taskwarrior, Zenkit, Nullboard, Obsidian Kanban, Org mode,
  Kanri, Deck, Kanboard, OpenProject, GitHub, Gitea, Forgejo, GitLab, Trello,
  Asana, Leo, MeisterTask, Todoist, Linear, TickTick, ClickUp, Pivotal Tracker,
  Quire, Redmine, Notion, Focalboard, Tasks.org, Super Productivity and the
  Wrike workflow, and the Wrike, Teamwork.com, monday.com, Businessmap and
  Planner workbooks, Vikunja's archive, Jira and Taiga are in - all forty;
  their custom fields and sprints are not - checked against
  WeKan's own
  formatters by testdata/external) of a board and of the export of all
  boards, with the custom fields and the export boundary's sanitizing
  WeKan's carry; Admin
  Panel's OAuth providers and passwordless login (they need those logins in
  Weddy first - its attachment settings and all domains are done);
  imports from other tools (CSV/TSV, Excel, Kanboard, NextCloud Deck,
  GitHub, Gitea, Forgejo, GitLab, Asana, Zenkit, OpenProject, Markdown,
  todo.txt, Taskwarrior, Nullboard, Kanri, OPML, Leo, Obsidian Kanban, Org
  mode, Todoist, MeisterTask, Linear, TickTick, ClickUp, Pivotal Tracker,
  Redmine, Quire, Focalboard, Tasks.org, Super Productivity, Taiga and Vikunja
  are in, from the import page and importBoard, through WeKan's import planner
  and creator, the file's people as WeKan's placeholder users or the person
  importing, and Wrike, Teamwork.com, monday.com, Businessmap and Microsoft
  Planner workbooks, Notion and Plane exports too; their sprints and
  releases, Jira (its own creator, with Scrum, and its attachment test of
  WeKan's) and the API sources, WeKan's Unicode PDF (GNU
  Unifont's two OpenType fonts subset into the file, as buildUnicodePdf.js
  does with PDFKit; the PDF is WeKan's base-font one, in the card layout and
  with its scope, byte for byte) is not (the swimlane, list, card and
  checklist menus' Export and Import are in, and the list menu's only for
  those who may change the board, as Weddy's list menu is); what an import left out is reported, on its page and in Admin
  Panel -> Recovery); and inbound e-mail.
- **The multi-selection's own UI**: moveBoardObjects moves a mixed
  selection as WeKan's does, but the board has no structural selection
  checkboxes, mixed drag or destination popup for it yet - eight tests of
  WeKan's structural-selection spec wait for them.
- **WeKan's change history** (the maintainer's next choice, 2026-11-11;
  WeKan's docs/Features/General/History/History.md): the row hash, the
  writer gate and both chains, and a list's soft delete with undo and redo
  are in. Next: recording and undoing the other groups - cards' titles,
  descriptions, positions and the rest (server/models/changeHistoryHooks.js)
  - then `changeHistory.page` and `restore`, and the History views.
- **Submit on Enter, the rest**: the preference is in every editor Weddy
  has; WeKan's tests of the calendar, new board, swimlane, add-list and
  subtask editors wait for those editors.
- **WeKan's password specs**: the password policy is in, with Admin Panel /
  Problems / Password length; WeKan's password-min-length-signup-login and
  password-length-report specs drive its `AccountsTemplates` client and
  its table page component, which Weddy's pages do not have.
- **Meteor's collection writes, the rest**: /cards/update writes a card's
  title, description, color and archived, /integrations/update a webhook
  and /customFields/update a field's definition; WeKan's client writes other
  fields and collections this way under its allow rules, and Weddy answers
  them as Meteor does without one (403).

## Tests

- **More of WeKan's own specs against Weddy**: `tests/wekan/wekan-specs.txt`
  names 483 tests so far; add each of WeKan's specs, or one test of it, when Weddy
  has its part. `WEDDY_WEKAN_SPECS=all ./build.sh everything` shows how far it is.
  The run of every candidate spec on 2026-11-11 passed 134 and failed 659, in
  these areas (a test can be in two): card details 90, translations and help
  texts of the Latin, Sesotho, Corsican, Haitian and Malagasy pages 84, the
  board views (calendar, map, whiteboard, table, time, e-mail and chat) 59,
  Admin Panel's settings panes 55, Scrum 49, search and filters 42, security
  specs 36 (most need Meteor's client in the page - `Meteor.subscribe`,
  `Meteor.status`, the DDP stream - which Weddy's pages do not load), imports
  35, history 34, list sync 27, subtasks 22, rules 20, templates 19 and Assist
  16. Run log: `log/2026-11-11_03-18-42/`. By what they wait for:
  - 113 drive WeKan's Blaze client itself - `Popup`, `Package`, `Blaze`,
    `Meteor.loggingIn`, `Meteor.subscribe`, the DDP stream - which Weddy's Go
    pages do not load; they pass only with a client shim of those objects, or
    rewritten against the pages.
  - 62 call a method Weddy has not got, most for whole features:
    `setListSyncSource` 15 (List Sync, WeKan's server/lib/listSync*.js -
    about 2,900 lines), Scrum 28 (`scrum.saveSprint` 15, `scrum.updateCard` 6,
    `scrum.configure` 3, `scrum.saveRelease` 2, two more), then
    WeKan's change history 4 (`changeHistory.page` 3 and `restore`),
    `getSamlConfigSources` 3,
    and 13 more once each.
  - the rest wait for a page, control or text Weddy draws differently.
- **Firefox and WebKit**: the browser tests have run in Chromium only.
  Both browsers are installed under `.tools/ms-playwright`, but in the
  development sandbox Firefox crashes at start (SIGSEGV: its own sandbox
  cannot create a user namespace, `clone()` EPERM), and WebKit lacks host
  libraries (libgtk-4, libicu74, libevent and more). Run
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
