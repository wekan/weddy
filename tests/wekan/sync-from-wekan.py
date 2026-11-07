#!/usr/bin/env python3
"""Copy WeKan's browser and API tests into Weddy: tests/wekan/ is a small WeKan tree.

    python3 -I tests/wekan/sync-from-wekan.py /path/to/wekan

copies WeKan's tests/playwright/ (without node_modules and test results) to
tests/wekan/tests/playwright/, and every WeKan source file those tests require -
models/lib, server/lib, tests/*.json and what those require in turn - to the same
place under tests/wekan/, so the relative requires work unchanged. Two kinds of
require are left out and linked from a WeKan checkout when the tests run
(tests/wekan/run.sh): WeKan's translations (imports/i18n/data, 94 MB) and
node_modules. WeKan stays the one place these tests are written; sync again after
they change there. tests/wekan/overlay/ is then laid over the copy: what differs
because Weddy's WeKan is Go, not Meteor (logging a page in).
"""
import os
import re
import shutil
import sys

REQUIRE = re.compile(r"""require\(\s*(?:path\.join\(\s*__dirname\s*,\s*)?['"`]([^'"`$]+)['"`]""")
JOIN = re.compile(r"""(?:require\('path'\)|path)\.(?:join|resolve)\(\s*__dirname\s*,\s*((?:'[^']*'\s*,?\s*)+)\)""")
LINKED = ('node_modules/', 'imports/i18n/data/')
SKIP_DIRS = {'node_modules', 'test-results', 'playwright-report', '.cache'}


def resolve(base, spec):
    p = os.path.normpath(os.path.join(base, spec))
    for cand in (p, p + '.js', p + '.cjs', p + '.json', os.path.join(p, 'index.js')):
        if os.path.isfile(cand):
            return cand
    return None


def main():
    wekan = os.path.abspath(sys.argv[1])
    here = os.path.dirname(os.path.abspath(__file__))
    src_pw = os.path.join(wekan, 'tests', 'playwright')
    dest = here
    dest_pw = os.path.join(dest, 'tests', 'playwright')
    if os.path.isdir(os.path.join(dest, 'tests')):
        shutil.rmtree(os.path.join(dest, 'tests'))
    for d in ('models', 'server', 'client', 'imports', 'config'):
        if os.path.isdir(os.path.join(dest, d)):
            shutil.rmtree(os.path.join(dest, d))
    todo = []
    for root, dirs, files in os.walk(src_pw):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in files:
            todo.append(os.path.join(root, f))
    seen = set()
    copied = 0
    while todo:
        path = todo.pop()
        if path in seen:
            continue
        seen.add(path)
        rel = os.path.relpath(path, wekan)
        if rel.startswith('..') or rel.startswith(LINKED):
            continue
        out = os.path.join(dest, rel)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        shutil.copy2(path, out)
        copied += 1
        if not path.endswith(('.js', '.cjs', '.mjs')):
            continue
        text = open(path, encoding='utf-8', errors='replace').read()
        specs = [m.group(1) for m in REQUIRE.finditer(text) if m.group(1).startswith('.')]
        for m in JOIN.finditer(text):
            specs.append('/'.join(re.findall(r"'([^']*)'", m.group(1))))
        for spec in specs:
            target = resolve(os.path.dirname(path), spec)
            if target and target not in seen:
                todo.append(target)
    with open(os.path.join(dest, 'SOURCE.md'), 'w') as fh:
        commit = os.popen(f'git -C "{wekan}" rev-parse HEAD 2>/dev/null').read().strip() or 'unknown'
        fh.write('# tests/wekan - WeKan\'s tests, copied\n\n'
                 'Copied by `tests/wekan/sync-from-wekan.py` from '
                 f'[wekan/wekan](https://github.com/wekan/wekan) commit `{commit}` - do not edit\n'
                 'here: change the tests in WeKan, or `overlay/` for what is Weddy\'s own, and sync again.\n')
    overlay = os.path.join(here, 'overlay')
    for root, _, files in os.walk(overlay):
        for f in files:
            src = os.path.join(root, f)
            out = os.path.join(dest, os.path.relpath(src, overlay))
            os.makedirs(os.path.dirname(out), exist_ok=True)
            shutil.copy2(src, out)
    print(f'{copied} files copied from WeKan {commit[:10]}')


if __name__ == '__main__':
    main()
