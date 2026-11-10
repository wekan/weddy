'use strict';
// WeKan's import-attachment-auth.e2e.js on Weddy, for the sources Weddy
// imports (Jira joins when its own import does): the "Attachment files"
// fields each service needs, none for one whose export carries its files,
// and a sign-in for an address the outbound guard refuses - the import goes
// on without the file, says why, never shows the token, and the refusal is
// in Admin Panel -> Problems as LiveBleed (ssrf.attachment).
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');
const { navigateInApp } = require('../tests/playwright/helpers/auth');
const { waitForImportedBoard } = require('../tests/playwright/helpers/import');

const FIELDS = { deck: [true, true], openproject: [true, false], asana: [false, false], gitlab: [true, false] };

test('Attachment files: the fields each service needs, on Weddy', async ({ loggedInPage: page }) => {
  for (const [source, [url, username]] of Object.entries(FIELDS)) {
    await navigateInApp(page, `/import/${source}`);
    const box = page.locator('fieldset.import-attachment-auth');
    await expect(box).toBeVisible();
    await expect(box.locator('legend')).toHaveText('Attachment files');
    await expect(box.locator('.js-import-attachment-url')).toHaveCount(url ? 1 : 0);
    await expect(box.locator('.js-import-attachment-username')).toHaveCount(username ? 1 : 0);
    await expect(box.locator('.js-import-attachment-token')).toHaveAttribute('type', 'password');
  }
  // Negative: Zenkit and Gitea (Trello's page is not in Weddy yet) get none.
  for (const source of ['zenkit', 'gitea']) {
    await navigateInApp(page, `/import/${source}`);
    await expect(page.locator('.js-import-json, #import-textarea').first()).toBeVisible();
    await expect(page.locator('fieldset.import-attachment-auth')).toHaveCount(0);
  }
});

test('Attachment files: a refused address is reported and recorded, the token is cleared, on Weddy', async ({ loggedInPage: page }) => {
  const source = { _embedded: { elements: [{ id: 1, subject: `With a file ${db.uniqueSuffix()}`, _links: { status: { title: 'New' } },
    _embedded: { attachments: { elements: [{ fileName: 'spec.pdf', _links: { downloadLocation: { href: '/api/v3/attachments/1/content' } } }] } } }] } };
  const before = db.find('eventlog', { bleed: 'LiveBleed', source: 'import.openproject.attachment' }).reduce((n, e) => n + (e.count || 0), 0);
  let boardId;
  try {
    await navigateInApp(page, '/import/openproject');
    await page.locator('#import-textarea').fill(JSON.stringify(source));
    await page.locator('.js-import-attachment-url').fill('http://127.0.0.1:9');
    await page.locator('.js-import-attachment-token').fill('op-token-e2e');
    await page.locator('.js-import-without-mapping').click();
    await waitForImportedBoard(page);
    boardId = page.url().match(/\/b\/([^/]+)/)[1];
    expect(db.find('attachments', { 'meta.boardId': boardId })).toHaveLength(0);
    const report = db.find('recoveryEvents', { boardIds: boardId }).map(e => e.detail).join('\n');
    expect(report).toMatch(/spec\.pdf: not downloaded \(/);
    expect(report).not.toContain('op-token-e2e');
    expect(await page.content()).not.toContain('op-token-e2e');
    const after = db.find('eventlog', { bleed: 'LiveBleed', source: 'import.openproject.attachment' }).reduce((n, e) => n + (e.count || 0), 0);
    expect(after).toBe(before + 1);
  } finally {
    if (boardId) db.cleanup({ boardIds: [boardId] });
  }
});
