'use strict';
// WeKan's History on Weddy: Ctrl+Z undoes one's own last change on the board
// - a deleted list comes back - while typing in a field it does nothing to
// the board; and the board menu leads to the History table of the board.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');

test('Ctrl+Z on the board undoes a list deleted, and History lists it', async ({ boardPage: page, board }) => {
  const listId = board.listIds[0];
  await page.goto(`/b/${board.boardId}/${board.slug}`);
  await expect(page.locator(`#js-list-${listId}`)).toBeVisible();
  await page.evaluate(id => Meteor.callAsync('lists.softRemove', id), listId);
  await page.reload();
  await expect(page.locator(`#js-list-${listId}`)).toHaveCount(0);
  // Negative: Ctrl+Z inside a field is the field's own undo.
  await page.locator('body').evaluate(() => {
    const i = document.createElement('input'); i.className = 'probe-input'; document.body.appendChild(i); i.focus();
  });
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(500);
  expect(db.findOne('lists', { _id: listId }).deletedAt).toBeTruthy();
  await page.locator('.probe-input').evaluate(i => { i.blur(); i.remove(); });
  await page.keyboard.press('Control+z');
  await expect(page.locator(`#js-list-${listId}`)).toBeVisible({ timeout: 15_000 });
  expect(db.findOne('lists', { _id: listId }).deletedAt).toBeFalsy();
  // History from the board menu: the delete and the undo.
  await page.goto(`/b/${board.boardId}/history`);
  await expect(page.locator('.js-history-row')).toHaveCount(2);
  await expect(page.locator('.history-table')).toContainText('Restored');
});
