#!/usr/bin/env python3
"""No tracked lockfile resolves a dependency version a security advisory names.

Dependabot alert #1 (CVE in minimatch >= 7.0.0, < 11.0.1): with
optimizationLevel >= 2, a pattern's "**/../" makes firstPhasePreProcess()
clone glob parts into the array it is walking, and secondPhasePreProcess()
then compares them pairwise - CPU and memory an attacker who supplies a
pattern controls. Weddy's test harness gets minimatch through archiver's
readdir-glob, which asks for ^10; tests/wekan/package.json overrides it to
^11.0.1, as WeKan's own package.json does.

  python3 -I tests/dependencySecurity.test.py
"""

import json
import os
import re
import shutil
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
failures = 0


def check(name, cond):
    global failures
    print(("ok   " if cond else "FAIL ") + name)
    failures += 0 if cond else 1


def version(v):
    m = re.match(r"^(\d+)\.(\d+)\.(\d+)", v or "")
    return tuple(int(x) for x in m.groups()) if m else None


def vulnerable_minimatch(lock):
    """The lock's minimatch entries the advisory names, at any depth."""
    out = []
    for key, entry in (lock.get("packages") or {}).items():
        if re.search(r"(^|/)node_modules/minimatch$", key):
            v = version(entry.get("version"))
            if v and (7, 0, 0) <= v < (11, 0, 1):
                out.append(f"{key}@{entry['version']}")
    return out


tracked = subprocess.run(["git", "ls-files", "-z", "--", "*package-lock.json"], cwd=ROOT,
                         capture_output=True, text=True, check=True).stdout.split("\0")
locks = [f for f in tracked if f and not re.search(r"(^|/)(node_modules|out-[^/]*|dist)/", f)]
check("the test harness's lockfile is tracked", "tests/wekan/package-lock.json" in locks)
for f in locks:
    with open(os.path.join(ROOT, f), encoding="utf-8") as fh:
        found = vulnerable_minimatch(json.load(fh))
    check(f"{f}: no minimatch >= 7.0.0, < 11.0.1 {found}", found == [])

with open(os.path.join(ROOT, "tests", "wekan", "package.json"), encoding="utf-8") as fh:
    manifest = json.load(fh)
check("readdir-glob's minimatch is overridden to ^11.0.1",
      (manifest.get("overrides") or {}).get("readdir-glob", {}).get("minimatch") == "^11.0.1")

# Negative: the finder finds the version the alert named, nested too, and
# not the patched one or an old line outside the range.
check("negative: the finder flags 10.2.6 at any depth", vulnerable_minimatch({"packages": {
    "node_modules/minimatch": {"version": "10.2.6"},
    "node_modules/readdir-glob/node_modules/minimatch": {"version": "7.4.6"},
    "node_modules/eslint/node_modules/minimatch": {"version": "3.1.5"},
    "node_modules/other/node_modules/minimatch": {"version": "11.0.1"},
}}) == ["node_modules/minimatch@10.2.6", "node_modules/readdir-glob/node_modules/minimatch@7.4.6"])

# The installed minimatch, when the harness is installed, keeps an
# amplifying pattern cheap: the "**/../" clones no longer feed themselves.
module = os.path.join(ROOT, "tests", "wekan", "node_modules", "minimatch")
node = shutil.which("node")
if node and os.path.isdir(module):
    script = (
        "const { Minimatch } = require(process.argv[1]);"
        # 16 "x/**/../y" segments: about 9 s on 10.2.6 (growing ~10x every two
        # more). 11.0.7 either compiles it in milliseconds or refuses it at
        # once with a RangeError ("too many patterns from '**/..'") - both are
        # the fix; only the time spent getting there matters.
        "const p = Array.from({ length: 16 }, () => 'x/**/../y').join('/');"
        "const t = Date.now(); let how = 'compiled';"
        "try { new Minimatch(p, { optimizationLevel: 2 }); }"
        "catch (e) { if (!(e instanceof RangeError)) throw e; how = 'refused'; }"
        "process.stdout.write(String(Date.now() - t) + ' ' + how);"
    )
    try:
        out = subprocess.run([node, "-e", script, module], capture_output=True, text=True, timeout=60)
        took, _, how = (out.stdout.strip() or "-1 failed").partition(" ")
        took = int(took)
        if took < 0:
            print(out.stderr.strip())
        check(f"an amplifying **/../ pattern is {how} at once ({took} ms)", 0 <= took < 2000)
    except subprocess.TimeoutExpired:
        check("an amplifying **/../ pattern compiles at once (timed out)", False)
else:
    print("skip the installed minimatch: tests/wekan/node_modules is not installed")

sys.exit(1 if failures else 0)
