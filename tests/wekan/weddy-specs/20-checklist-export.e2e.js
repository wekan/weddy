'use strict';
// #1173 on Weddy: a checklist's menu (checklistActionsPopup) opens its
// Export (exportChecklistPopup), the same body with the checklist as its
// scope - its links carry checklistId, and the JSON holds that checklist and
// its items only. The card details draw the checklists, their progress and
// their items, as WeKan's checklists.jade does.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');

test('a checklist\'s menu opens its Export, scoped to the checklist', async ({ boardPage: page, board }) => {
  const card = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
  const mine = db.uid('cl'), theirs = db.uid('cl');
  db.insertMany('checklists', [
    { _id: mine, cardId: card, title: 'Packing list', sort: 0, createdAt: new Date() },
    { _id: theirs, cardId: card, title: 'Other list', sort: 1, createdAt: new Date() },
  ]);
  db.insertMany('checklistItems', [
    { _id: db.uid('it'), checklistId: mine, cardId: card, title: 'Tent', sort: 0, isFinished: true },
    { _id: db.uid('it'), checklistId: mine, cardId: card, title: 'Stove', sort: 1, isFinished: false },
    { _id: db.uid('it'), checklistId: theirs, cardId: card, title: 'Elsewhere', sort: 0, isFinished: false },
  ]);
  try {
    await page.goto(`/b/${board.boardId}/${board.slug}/${card}`);
    const cl = page.locator(`.js-checklist[data-checklist="${mine}"]`);
    await expect(cl.locator('h4.title')).toHaveText('Packing list');
    await expect(cl.locator('.checklist-progress-text')).toHaveText('50%');
    await expect(cl.locator('.js-checklist-item')).toHaveCount(2);
    await expect(cl.locator('.js-checklist-item').first()).toHaveAttribute('aria-checked', 'true');

    await cl.locator('.js-open-checklist-details-menu').click();
    await page.locator('.js-pop-over .js-export-checklist').click();
    await expect(page.locator('.js-pop-over .js-scope-title')).toHaveText('Export checklist');
    const json = page.locator('.js-pop-over a.js-scope-link[data-path="export"]:not([data-query])');
    const href = await json.getAttribute('href');
    expect(new URL(href, page.url()).searchParams.get('checklistId')).toBe(mine);
    const exported = await (await page.request.get(href)).json();
    expect(exported.checklists.map(c => c._id)).toEqual([mine]);
    expect(exported.checklistItems.map(i => i.title).sort()).toEqual(['Stove', 'Tent']);
    // Its PDF and Excel answer, scoped the same way.
    for (const path of ['exportExcel', 'exportPDF']) {
      const link = page.locator(`.js-pop-over a.js-scope-link[data-path="${path}"]`);
      expect(new URL(await link.getAttribute('href'), page.url()).searchParams.get('checklistId')).toBe(mine);
      expect((await page.request.get(await link.getAttribute('href'))).status()).toBe(200);
    }
  } finally {
    db.deleteMany('checklistItems', { cardId: card });
    db.deleteMany('checklists', { cardId: card });
  }
});
