#!/usr/bin/env python3
"""Summarize `go test -json` output: per-package result and top-level test counts.

  summary.py <go-test.json>...

Prints each failed package and failed test, then the totals. Exits 1 when
anything failed (a test, or a package that did not build or run).
"""

import json
import sys

PREFIX = "github.com/wekan/caddy-gitea-plugin/gitea/"


def main(paths):
    tests, pkgs, output = {}, {}, {}
    for path in paths:
        for line in open(path, encoding="utf-8", errors="replace"):
            if not line.startswith("{"):
                continue
            try:
                e = json.loads(line)
            except ValueError:
                continue
            pkg, test, action = e.get("Package", ""), e.get("Test"), e.get("Action")
            if action == "output":
                output.setdefault((pkg, test), []).append(e.get("Output", ""))
            if action not in ("pass", "fail", "skip"):
                continue
            if test is None:
                pkgs[pkg] = action
            elif "/" not in test:
                tests[(pkg, test)] = action
    count = {a: sum(1 for v in tests.values() if v == a) for a in ("pass", "fail", "skip")}
    pcount = {a: sum(1 for v in pkgs.values() if v == a) for a in ("pass", "fail", "skip")}
    failed_pkgs = sorted(p for p, a in pkgs.items() if a == "fail")
    for p in failed_pkgs:
        bad = sorted(t for (tp, t), a in tests.items() if tp == p and a == "fail")
        print(f"FAIL {p[len(PREFIX):] if p.startswith(PREFIX) else p}" + (": " + ", ".join(bad) if bad else ""))
        if not bad:  # did not build, or failed outside a test (TestMain, panic)
            print("".join(output.get((p, None), [])[-15:]).rstrip())
    print(f"packages: {pcount['pass']} ok, {pcount['fail']} failed, {pcount['skip']} without tests")
    print(f"tests:    {count['pass']} passed, {count['fail']} failed, {count['skip']} skipped")
    return 1 if failed_pkgs or count["fail"] else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
