# Tests

```sh
bash tests/apply-patches.sh               # assembly and zips, stand-in repositories
python3 -I tests/changelogShort.test.py   # CHANGELOG.md is what CHANGELOG-big.md gives
./build.sh everything                     # EVERYTHING, below
```

**EVERYTHING** (`./build.sh everything`, menu 6) runs on this computer only - never
on GitHub or Gitea - every stage even after one fails, and lists the failures at the
end; logs in `log/<datetime>/`:

| Stage | |
|-------|---|
| scripts | the two tests above |
| go-caddy-*-plugin | `go vet` and `go test` of each plugin beside Weddy; they run a real Caddy |
| gitea-tests | Gitea's own tests, for the Gitea Weddy compiles in ([tests/gitea/](../tests/gitea/README.md)) |
| build-local | `./build.sh local` |
| wekan-tests | WeKan's browser and API tests against that binary ([tests/wekan/run.sh](../tests/wekan/run.sh)) |
| wekan-mail-settings | WeKan's e-mail tests that need their own server settings - the SMTP phase limits, the total SMTP deadline and receipt retention - each against a Weddy started with them |

`tests/wekan/` is WeKan's own Playwright suite and the WeKan files it reads, copied by
`./build.sh sync-wekan-tests` (menu 7) - written in WeKan, never edited here - with
`overlay/` for what differs in Weddy (a page is logged in with the same
`meteor_login_token` cookie, set directly), `weddy-specs/` for Weddy's own specs on
WeKan's fixtures and page objects, and `wekan-specs.txt` naming the WeKan specs whose
pages Weddy has so far (`WEDDY_WEKAN_SPECS=all` runs every one). The binary is
started with a fresh data directory and its database on TCP, where WeKan's
`helpers/db.js` seeds users and boards as it does for WeKan. Node.js runs the tests
only; it comes from WeKan's `.tools/node-*`, the browser goes to
`.tools/ms-playwright`.
