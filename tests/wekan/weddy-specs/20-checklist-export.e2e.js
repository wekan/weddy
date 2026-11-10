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

test('a checklist is renamed, and its item edited and deleted, in the card details', async ({ boardPage: page, board }) => {
  const card = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
  const cl = db.uid('cl'), it = db.uid('it');
  db.insertOne('checklists', { _id: cl, cardId: card, title: 'Before', sort: 0, createdAt: new Date() });
  db.insertOne('checklistItems', { _id: it, checklistId: cl, cardId: card, title: 'Old item', sort: 0, isFinished: false });
  try {
    await page.goto(`/b/${board.boardId}/${board.slug}/${card}`);
    const box = page.locator(`.js-checklist[data-checklist="${cl}"]`);
    await box.locator('h4.title.is-editable').click();
    await box.locator('form.js-edit-checklist-title textarea').fill('After');
    await box.locator('form.js-edit-checklist-title textarea').press('Control+Enter');
    await expect(box.locator('h4.title')).toHaveText('After');
    expect(db.findOne('checklists', { _id: cl }).title).toBe('After');

    await box.locator('.js-checklist-item .item-title.is-editable').click();
    const edit = box.locator('form.js-edit-checklist-item');
    await edit.locator('textarea').fill('New item');
    await edit.locator('button.js-submit-edit-checklist-item-form').click();
    await expect(box.locator('.js-checklist-item .item-title')).toHaveText('New item');

    await box.locator('.js-checklist-item .item-title.is-editable').click();
    await box.locator('form.js-edit-checklist-item .js-delete-checklist-item').click();
    await page.locator('.js-pop-over button.js-confirm').click();
    await expect(box.locator('.js-checklist-item')).toHaveCount(0);
    expect(db.countDocuments('checklistItems', { _id: it })).toBe(0);
  } finally {
    db.deleteMany('checklistItems', { cardId: card });
    db.deleteMany('checklists', { cardId: card });
  }
});

test('a checklist is moved and copied to another card through its menu', async ({ boardPage: page, board }) => {
  const from = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
  const to = db.findCardIdByTitle({ boardId: board.boardId, title: 'Beta Card' });
  const mv = db.uid('cl'), cp = db.uid('cl');
  db.insertMany('checklists', [
    { _id: mv, cardId: from, boardId: board.boardId, title: 'Going', sort: 0 },
    { _id: cp, cardId: from, boardId: board.boardId, title: 'Twice', sort: 1 },
  ]);
  db.insertMany('checklistItems', [
    { _id: db.uid('it'), checklistId: mv, cardId: from, title: 'Goes along', sort: 0, isFinished: true },
    { _id: db.uid('it'), checklistId: cp, cardId: from, title: 'Copied along', sort: 0, isFinished: false },
  ]);
  const choose = async (button, id) => {
    await page.locator(`.js-checklist[data-checklist="${id}"] .js-open-checklist-details-menu`).click();
    await page.locator(`.js-pop-over ${button}`).click();
    const form = page.locator('.js-pop-over .js-checklist-target');
    await expect(form.locator('.js-select-cards option')).not.toHaveCount(0);
    await form.locator('.js-select-lists').selectOption(board.listIds[1]);
    await form.locator('.js-select-cards').selectOption(to);
    await form.locator('.js-done').click();
  };
  try {
    await page.goto(`/b/${board.boardId}/${board.slug}/${from}`);
    await choose('.js-move-checklist', mv);
    await expect(page.locator(`.js-checklist[data-checklist="${mv}"]`)).toHaveCount(0);
    expect(db.findOne('checklists', { _id: mv }).cardId).toBe(to);
    expect(db.find('checklistItems', { checklistId: mv }).map(i => i.cardId)).toEqual([to]);

    await choose('.js-copy-checklist', cp);
    await expect.poll(() => db.find('checklists', { cardId: to, title: 'Twice' }).length).toBe(1);
    expect(db.findOne('checklists', { _id: cp }).cardId).toBe(from);
    const copy = db.findOne('checklists', { cardId: to, title: 'Twice' });
    expect(db.find('checklistItems', { checklistId: copy._id }).map(i => i.title)).toEqual(['Copied along']);
  } finally {
    db.deleteMany('checklistItems', { cardId: { $in: [from, to] } });
    db.deleteMany('checklists', { cardId: { $in: [from, to] } });
  }
});

test('#1618: a checklist item is given to a board member, and to nobody again', async ({ boardPage: page, board, user }) => {
  const card = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
  const cl = db.uid('cl'), it = db.uid('it');
  db.insertOne('checklists', { _id: cl, cardId: card, boardId: board.boardId, title: 'Who does it', sort: 0 });
  db.insertOne('checklistItems', { _id: it, checklistId: cl, cardId: card, title: 'A task', sort: 0, isFinished: false });
  try {
    await page.goto(`/b/${board.boardId}/${board.slug}/${card}`);
    const item = page.locator(`.js-checklist[data-checklist="${cl}"] .js-checklist-item`);
    await item.locator('.js-checklist-item-assignee').click();
    await page.locator(`.js-pop-over .js-set-checklist-item-assignee[data-user-id="${user.id}"]`).click();
    await expect(item.locator('.js-checklist-item-assignee-name')).toHaveText('E2E Test User');
    expect(db.findOne('checklistItems', { _id: it }).assigneeId).toBe(user.id);
    await item.locator('.js-checklist-item-assignee').click();
    await expect(page.locator(`.js-pop-over .js-set-checklist-item-assignee[data-user-id="${user.id}"]`)).toHaveClass(/is-active/);
    await page.locator('.js-pop-over .js-set-checklist-item-assignee[value=""]').click();
    await expect(item.locator('.js-checklist-item-assignee-name')).toHaveCount(0);
    expect(db.findOne('checklistItems', { _id: it }).assigneeId).toBeUndefined();
  } finally {
    db.deleteMany('checklistItems', { cardId: card });
    db.deleteMany('checklists', { cardId: card });
  }
});

test('#4755: a checklist item gets a due date from the calendar and the time picked', async ({ boardPage: page, board }) => {
  const card = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
  const cl = db.uid('cl'), it = db.uid('it');
  db.insertOne('checklists', { _id: cl, cardId: card, boardId: board.boardId, title: 'Dated', sort: 0 });
  db.insertOne('checklistItems', { _id: it, checklistId: cl, cardId: card, title: 'By then', sort: 0, isFinished: false });
  try {
    await page.goto(`/b/${board.boardId}/${board.slug}/${card}`);
    const item = page.locator(`.js-checklist[data-checklist="${cl}"] .js-checklist-item`);
    await item.locator('.js-checklist-item-due-date').click();
    const popup = page.locator('.pop-over').filter({ has: page.locator('.edit-date') });
    // A due date's time is 17:00 until another is picked.
    await expect(popup.locator('.js-calendar-hour')).toHaveValue('17');
    await popup.locator('.js-calendar-day').nth(14).click();
    await popup.locator('.js-calendar-hour').selectOption('09');
    await popup.locator('.js-calendar-minute').selectOption('30');
    await popup.locator('.js-submit-date').click();
    await expect(item.locator('.checklist-item-due-date time')).toBeVisible();
    const due = new Date(db.findOne('checklistItems', { _id: it }).dueAt);
    expect([due.getDate(), due.getHours(), due.getMinutes()]).toEqual([15, 9, 30]);
  } finally {
    db.deleteMany('checklistItems', { cardId: card });
    db.deleteMany('checklists', { cardId: card });
  }
});
