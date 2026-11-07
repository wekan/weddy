# Gitea's own tests, against the Gitea that Weddy builds in

Weddy runs Gitea inside Caddy through
[caddy-gitea-plugin](https://github.com/wekan/caddy-gitea-plugin), whose `gitea/`
directory is a copy of only the Gitea packages it needs - patched, with imports
rewritten into the plugin's module and assets embedded. That copy carries no tests,
so `go get` of the plugin does not download them. These scripts put Gitea's tests
back, into a temporary copy of the plugin, and run them the way Gitea's Makefile
does, compiled the way xcaddy compiles Weddy: CGO off, no build tags, SQLite through
the pure-Go modernc driver.

```
tests/gitea/run.sh                    # everything
tests/gitea/run.sh -run TestRepo      # extra go test flags
GITEA_TESTS_ONLY=unit tests/gitea/run.sh
```

Local only: needs Go, git and Python 3. Nothing here runs on GitHub or Gitea CI.

| Step | What |
| --- | --- |
| 1 | The Gitea source `gitea/` was made from - the "Resulting Gitea commit" in the plugin's `gitea/SOURCE.md`. An existing checkout at that commit is used (`GITEA_SRC`, `releases/sync-gitea.sh`'s `SYNC_WORK`, `$TMPDIR/caddy-gitea-sync/gitea`, or an earlier run's); otherwise it is made again like `sync-gitea.sh` makes it - upstream Gitea + the recorded wekan/gitea-patches commit + the plugin's `dist/gitea/*.patch` - and the result must be that same commit. |
| 2 | A copy of caddy-gitea-plugin under `$GITEA_TESTS_WORK` (default `$TMPDIR/weddy-gitea-tests`), into which the plugin's `releases/copy-gitea-tests.py` copies the `_test.go` files, the packages only the tests need (`models/unittest`, `modules/test`, ...) and the fixtures. |
| 3 | `go test`: the unit tests (every package except `modelmigration/`, as `make test-backend`), then the migration tests (`modelmigration/...`, one package at a time, `GITEA_TEST_DATABASE=sqlite`, as `make migrations.individual.test`). |

The JSON logs are in `$GITEA_TESTS_WORK/log/`; the script ends with the failed
packages and tests and the totals, and exits non-zero when anything failed.

Tests that Gitea itself skips without an outside service (Redis, Elasticsearch,
Meilisearch, MinIO, Azure) are counted as skipped. [skip.txt](skip.txt) lists the
tests skipped HERE, each with its reason: only failures that have nothing to do with
how Weddy builds Gitea in. A failure caused by the embedding is fixed in
caddy-gitea-plugin rather than listed.

| Environment | |
| --- | --- |
| `CADDY_GITEA_PLUGIN` | caddy-gitea-plugin checkout (default `../caddy-gitea-plugin`) |
| `GITEA_SRC` | a Gitea checkout at the resulting commit |
| `GITEA_PATCHES` | wekan/gitea-patches checkout or URL (default `../gitea-patches`, else GitHub) |
| `UPSTREAM_URL` | upstream Gitea to clone (default `../gitea` when it has the commit, else GitHub) |
| `GITEA_TESTS_WORK` | work directory, kept between runs |
| `GITEA_TESTS_ONLY` | `unit` or `migration` |
