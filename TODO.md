# TODO: what is still in progress at Weddy

What Weddy, and the plugins it is built from, do not do yet. When an item is
done, it is **removed from here and moved to the `# Upcoming weddy release`
section of [CHANGELOG-big.md](CHANGELOG-big.md)**, as an entry that links its
commit (then `python3 -I releases/changelog-short.py` regenerates
[CHANGELOG.md](CHANGELOG.md)). This file only ever lists unfinished work.

## WeKan in Go (caddy-wekan-plugin)

- **WeKan's pages as Go Pug templates.** 10 of WeKan's 174 Jade templates are
  started: sign-in, All Boards, the board, its swimlanes, lists and cards, a
  card's title and description. The other 164 are listed in caddy-wekan-plugin's
  [TEMPLATES.md](https://github.com/wekan/caddy-wekan-plugin/blob/main/TEMPLATES.md):
  card details (dates, members, labels, checklists, comments, attachments,
  custom fields), the board header and its menus, the board views, Admin Panel,
  Member Settings, search, templates, rules, import and export.
- **Attachments**: `files/attachments`, upload and download, as Node.js WeKan
  keeps them.
- **Users**: registration, invitations, forgot password, profile, language
  choice (the language is read from `profile.language`, but cannot be changed
  yet), and Admin Panel / People.
- **Other login methods** besides password: LDAP, OAuth2/OIDC, CAS, SAML.
- **The rest of WeKan's REST API**: swimlane and list edit and delete, labels,
  board members and roles, card members, dates, checklists, comments, custom
  fields, bulk card actions, copy and move, linked cards, rules, export and
  import, `/users/logout`, users (WeKan's `tests/playwright/specs/17-rest-api`
  and `23-rest-api-more` list them).
- **Activities and notifications** when something changes, as Node.js WeKan
  records them.

## Many domains: the Cloud Panel

- **The Cloud Panel's pages in Go**: Admin Panel / People / Cloud on the primary
  domain (Cloud Panel Domain, SuperAdmin Username), and on the Cloud Panel Domain
  the SuperAdmin's Settings with the left menus Domains (Domain, Customer name,
  Customer email address, Billing email address, Start Date, End Date, TLS) and
  CloudFlare (a write-only API key, never sent to a browser). Until then
  `<data>/cloud/domains.json` and `cloudflare.json` are written by hand. It is
  Weddy's feature, not WeKan's: here every domain is in one process.

## Tests

- **WeKan's own specs against Weddy**: `tests/wekan/wekan-specs.txt` is still
  empty - add each of WeKan's specs there when Weddy has its pages;
  `WEDDY_WEKAN_SPECS=all ./build.sh everything` shows how far it is.
- **Firefox and WebKit**: the browser tests have run in Chromium only
  (`WEKAN_PLAYWRIGHT_ALL=1` runs all three).
- **`./build.sh local all`**: building every platform locally has not been run
  yet; only this computer's platform (linux/arm64) has.

## Release

- **Release notes list FerretDB**: `.github/workflows/release-all-build.yml`
  still names three plugins in its comment and its source table; add
  caddy-ferretdb-plugin and wekan/FerretDB (`FERRETDB_PLUGIN_COMMIT`,
  `FERRETDB_COMMIT`).
- **go-jose v3 in the other plugins**: caddy-wekan-plugin no longer has it
  (Dependabot alerts #1-#3); check caddy-gitea-plugin, caddy-rclone-plugin and
  caddy-ferretdb-plugin for the same dependency.

## For the maintainer (on GitHub)

- Create the repository **wekan/caddy-ferretdb-plugin** and push it.
- Dismiss caddy-wekan-plugin's code scanning alert **#9** as a false positive:
  SHA-256 is Meteor's password pre-hash, not the stored hash (see the plugin
  wiki's [Hall of Fame](https://github.com/wekan/caddy-wekan-plugin/wiki/Hall-of-Fame)).
