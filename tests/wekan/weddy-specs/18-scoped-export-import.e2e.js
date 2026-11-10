'use strict';
// #1173 on Weddy: a list's and a swimlane's menu offer WeKan's Export and
// Import pop-overs (exportScopeBody). A list's Export links carry the list's
// scope and the selection, and its JSON is that list's cards only; its Import
// brings a WeKan export in after the list, as WeKan's importScoped does.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');

test('a list\'s Export is the list\'s cards, and its Import brings an export in after it', async ({ boardPage: page, board }) => {
  const list = board.listIds[0];
  const cardsOf = listId => db.find('cards', { boardId: board.boardId, listId }).map(c => c.title).sort();
  await page.locator(`#js-list-${list} .js-open-list-menu`).first().click();
  await page.locator('.js-pop-over .js-export-list').click();
  await expect(page.locator('.js-pop-over .js-scope-title')).toHaveText('Export list');
  const json = page.locator('.js-pop-over a.js-scope-link[data-path="export"]:not([data-query])');
  const href = await json.getAttribute('href');
  expect(new URL(href, page.url()).searchParams.get('listId')).toBe(list);
  // Untick Comments: the links say so.
  await page.locator('.js-pop-over .js-export-field-toggle[data-field="comments"]').click();
  expect(new URL(await json.getAttribute('href'), page.url()).searchParams.get('fields')).not.toContain('comments');
  const exported = await (await page.request.get(await json.getAttribute('href'))).json();
  expect(exported.cards.map(c => c.title).sort()).toEqual(cardsOf(list));
  expect(exported.lists.map(l => l._id)).toEqual([list]);
  // Excel and PDF of the list answer too.
  for (const path of ['exportExcel', 'exportPDF']) {
    const link = page.locator(`.js-pop-over a.js-scope-link[data-path="${path}"]`);
    expect(new URL(await link.getAttribute('href'), page.url()).searchParams.get('listId')).toBe(list);
    expect((await page.request.get(await link.getAttribute('href'))).status()).toBe(200);
  }
  await page.locator('.js-pop-over .js-close-pop-over').click();

  // The list's Import: the same file comes in as a new list after it.
  const lists = () => db.find('lists', { boardId: board.boardId }).length;
  const before = lists();
  await page.locator(`#js-list-${list} .js-open-list-menu`).first().click();
  await page.locator('.js-pop-over .js-import-list').click();
  await expect(page.locator('.js-pop-over .js-scope-title')).toHaveText('Import list');
  await page.locator('.js-pop-over .js-scope-import-file').setInputFiles({
    name: 'list.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)),
  });
  await expect(page.locator('.js-pop-over .js-scope-import-status')).toContainText('Imported:');
  await expect.poll(lists).toBe(before + 1);
  const added = db.find('lists', { boardId: board.boardId }).filter(l => !exported.lists.some(e => e._id === l._id) && l.title === exported.lists[0].title);
  expect(added.length).toBeGreaterThanOrEqual(1);

  // A file that is not JSON says so, and imports nothing.
  await page.locator('.js-pop-over .js-scope-import-file').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
  await expect(page.locator('.js-pop-over .js-scope-import-status')).toHaveText('That file is not a WeKan export');
  expect(lists()).toBe(before + 1);
});

test('a swimlane\'s menu offers its Export, scoped to the swimlane', async ({ boardPage: page, board }) => {
  await page.locator('.js-open-swimlane-menu').first().click();
  await page.locator('.js-pop-over .js-export-swimlane').click();
  await expect(page.locator('.js-pop-over .js-scope-title')).toHaveText('Export swimlane');
  const href = await page.locator('.js-pop-over a.js-scope-link[data-path="export"]').first().getAttribute('href');
  expect(new URL(href, page.url()).searchParams.get('swimlaneId')).toBe(board.swimlaneId);
  const exported = await (await page.request.get(href)).json();
  expect(exported.swimlanes.map(s => s._id)).toEqual([board.swimlaneId]);
});
