#!/usr/bin/env python3
"""tests/wekan/sync-from-wekan.py finds the WeKan files the tests read, in linear time,
and Weddy's test helper hashes passwords as Meteor does.

  python3 -I tests/syncFromWekan.test.py
"""

import importlib.util
import os
import re
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("sync", os.path.join(ROOT, "tests", "wekan", "sync-from-wekan.py"))
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)
failures = 0


def check(name, cond):
    global failures
    print(("ok   " if cond else "FAIL ") + name)
    failures += 0 if cond else 1


def joined(text):
    return ["/".join(re.findall(r"'([^']*)'", m.group(1))) for m in sync.JOIN.finditer(text)]


check("path.join(__dirname, a, b) gives a/b",
      joined("const x = require(path.join(__dirname, '..', 'models/lib/x'));") == ["../models/lib/x"])
check("require('path').join(__dirname, a) and path.resolve too",
      joined("require(require('path').join(__dirname, '../../../models/lib/cardShownFields'))") == ["../../../models/lib/cardShownFields"]
      and joined("path.resolve(__dirname, 'a', 'b')") == ["a/b"])
check("negative: a join not from __dirname is not taken", joined("path.join(process.cwd(), 'a')") == [])

# Code scanning #1: a repeated group of quoted parts backtracked exponentially on an
# unclosed call. The pattern is linear now: this returns at once.
start = time.time()
evil = "path.join(__dirname, " + "'' " * 5000 + "x"
list(sync.JOIN.finditer(evil * 3))
check("negative: an unclosed join with thousands of parts is read in linear time", time.time() - start < 1)

src = open(os.path.join(ROOT, "tests", "wekan", "weddy-specs", "helpers.cjs"), encoding="utf-8").read()
costs = [int(c) for c in re.findall(r"bcrypt\.hashSync\([^,]+,\s*(\d+)\)", src)]
check("the test helper hashes with Meteor's bcrypt cost of 10 or more (code scanning #2)", costs and min(costs) >= 10)

print()
print(f"{failures} failure(s)")
sys.exit(1 if failures else 0)
