'use strict';
// WeKan's automatic list width (#6409), from the list menu's Set width
// pop-over: the board's writer turns it on for everyone; the lists then share
// the row, with no width of their own and no resize handle. In personal mode
// each viewer has their own. WeKan has no spec of its own for it.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');
const { loginWithToken, openBoard } = require('../tests/playwright/helpers/auth');

async function toggleAutoWidth(page) {
  await page.locator('.js-open-list-menu').first().click();
  await page.locator('.js-pop-over .js-set-list-width').click();
  await page.locator('.js-pop-over .js-toggle-auto-width').click();
}

test('the Set width pop-over turns the board\'s automatic width on and off', async ({ boardPage: page, board }) => {
  await expect(page.locator('.js-list-resize-handle').first()).toBeAttached();
  await toggleAutoWidth(page);
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).autoWidth).toBe(true);
  await expect(page.locator('.js-list.list-auto-width')).toHaveCount(board.listIds.length, { timeout: 10_000 });
  await expect(page.locator('.js-list-resize-handle')).toHaveCount(0);
  const style = await page.locator('.js-list').first().getAttribute('style');
  expect(style || '').not.toContain('--list-width');
  // While it is on, the pop-over has no width to type in.
  await page.locator('.js-open-list-menu').first().click();
  await page.locator('.js-pop-over .js-set-list-width').click();
  await expect(page.locator('.js-pop-over .list-width-value')).toBeHidden();
  await page.locator('.js-pop-over .js-toggle-auto-width').click();
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).autoWidth).toBe(false);
  await expect(page.locator('.js-list.list-auto-width')).toHaveCount(0, { timeout: 10_000 });
  await expect(page.locator('.js-list-resize-handle').first()).toBeAttached();
});

test('negative: a read-only member may not switch the board\'s automatic width', async ({ page, board, user2 }) => {
  db.addBoardMember({ boardId: board.boardId, userId: user2.id });
  db.updateOne('boards', { _id: board.boardId, 'members.userId': user2.id }, { $set: { 'members.$.isReadOnly': true } });
  await loginWithToken(page, user2.id, user2.token);
  await openBoard(page, board.boardId, board.slug);
  const out = await page.evaluate(({ id }) => Meteor.callAsync('setBoardAutoWidth', id, true).then(
    () => 'allowed', e => e.error || e.reason || String(e)), { id: board.boardId });
  expect(out).toBe('error-notAuthorized');
  expect(!!db.findOne('boards', { _id: board.boardId }).autoWidth).toBe(false);
  // Nor is it offered: a read-only member's page has no Set width pop-over.
  await expect(page.locator('template[data-pop="list-width"]')).toHaveCount(0);
  await expect(page.locator('.js-list').first()).toBeVisible();
});
