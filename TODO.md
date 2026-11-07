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
- **Users**: registration, invitations, forgot password, profile, and Admin
  Panel / People.
- **Other login methods** besides password: LDAP, OAuth2/OIDC, CAS, SAML.
- **The rest of WeKan's REST API**: labels, board members and roles, card
  members, dates, checklist items' edit and delete, comment edit and delete,
  bulk card actions, copy and move, linked cards, rules, export and import,
  users (the other tests of WeKan's `tests/playwright/specs/17-rest-api` and
  `23-rest-api-more`).
- **Activities and notifications** when something changes, as Node.js WeKan
  records them.

## Tests

- **More of WeKan's own specs against Weddy**: `tests/wekan/wekan-specs.txt`
  names six so far; add each of WeKan's specs, or one test of it, when Weddy
  has its part. `WEDDY_WEKAN_SPECS=all ./build.sh everything` shows how far it is.
- **Firefox and WebKit**: the browser tests have run in Chromium only. In the
  VSCodium Flatpak sandbox Playwright's Firefox needs a newer NSS (3.126) than
  the runtime has, and WebKit needs libevent, enchant, flite and more; run
  `WEKAN_PLAYWRIGHT_ALL=1 ./build.sh everything` on a computer or in a
  container that has them.
- **`./build.sh local all`**: every platform built locally - the first run was
  started while the plugins' go.mod files were being changed, and linux/arm-7
  and linux/386 did not compile; run it again on the committed plugins and fix
  any platform that still fails.

## For the maintainer (on GitHub)

- Create the repository **wekan/caddy-ferretdb-plugin** and push it.
- Push caddy-wekan-plugin, caddy-ferretdb-plugin, caddy-gitea-plugin,
  caddy-rclone-plugin and Weddy: a release builds from what is on GitHub.
- Dismiss caddy-wekan-plugin's code scanning alert **#9** as a false positive:
  SHA-256 is Meteor's password pre-hash, not the stored hash (see the plugin
  wiki's [Hall of Fame](https://github.com/wekan/caddy-wekan-plugin/wiki/Hall-of-Fame)).
