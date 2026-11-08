#!/usr/bin/env python3
"""tests/wekan/sync-from-wekan.py finds the WeKan files the tests read, in linear time,
and Weddy's test helper hashes passwords as Meteor does.

  python3 -I tests/syncFromWekan.test.py
"""

import glob
import importlib.util
import os
import re
import shutil
import subprocess
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
check("the test helper stores with Meteor's bcrypt cost of 10 or more", costs and min(costs) >= 10)

# Code scanning #2: Meteor's pre-hash, as WeKan's #599 - with Web Crypto, one
# implementation, and no fast hash of a password-named value anywhere in Weddy's
# own scripts and specs.
FAST = re.compile(r"(createHash\(\s*['\"](?:md5|sha1|sha256|sha512)['\"]\s*\)\s*\.update\(\s*\w*pass\w*"
                  r"|hashlib\.(?:md5|sha1|sha256|sha512)\(\s*\w*pass\w*)", re.I)
own = []
for d in ("releases", "tests"):
    for base, dirs, files in os.walk(os.path.join(ROOT, d)):
        rel = os.path.relpath(base, ROOT)
        dirs[:] = [x for x in dirs if x not in ("node_modules", "__pycache__")]
        if rel.startswith(os.path.join("tests", "wekan", "tests")) or rel.split(os.sep)[:3] in (
                ["tests", "wekan", "models"], ["tests", "wekan", "server"], ["tests", "wekan", "client"],
                ["tests", "wekan", "imports"], ["tests", "wekan", "public"]):
            continue  # WeKan's own files, copied: scanned in wekan/wekan
        for f in files:
            if f.endswith((".js", ".cjs", ".mjs", ".py", ".sh")) and f != "syncFromWekan.test.py":
                text = open(os.path.join(base, f), encoding="utf-8", errors="replace").read()
                if FAST.search(text):
                    own.append(os.path.join(rel, f))
check("negative: no fast hash of a password-named value in Weddy's own scripts", own == [])
check("the scan finds the old shape", bool(FAST.search("crypto.createHash('sha256').update(password)")))
check("the helper computes the pre-hash with Web Crypto", "subtle.digest('SHA-256'" in src and "createHash" not in src)

node = shutil.which("node") or next(iter(sorted(glob.glob(os.path.join(ROOT, "..", "..", "node-v*", "bin", "node")))), None)
if node:
    js = ("const h=require(process.argv[1]);const c=require('crypto');Promise.all(['Weddy-pw-1','p\u00e4ssw\u00f6rd'].map("
          "async p=>(await h.meteorPreHash(p))===c.createHash('sha256').update(p,'utf8').digest('hex'))).then(r=>console.log(r.every(Boolean)))")
    out = subprocess.run([node, "-e", js, os.path.join(ROOT, "tests", "wekan", "weddy-specs", "helpers.cjs")],
                         capture_output=True, text=True, cwd=os.path.join(ROOT, "tests", "wekan"))
    check("the pre-hash is Meteor's SHA-256 hex digest, ASCII and UTF-8", out.stdout.strip().endswith("true"))
else:
    print("skip the digest comparison: no Node.js")

print()
print(f"{failures} failure(s)")
sys.exit(1 if failures else 0)
