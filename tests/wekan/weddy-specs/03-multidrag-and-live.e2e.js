'use strict';
// MultiDrag - a card dragged to another list, and selected cards moving together -
// and another page of the same board following without a reload.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');
const { openBoard } = require('../tests/playwright/helpers/auth');

async function drag(page, from, to) {
  const a = await from.boundingBox();
  const b = await to.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(a.x + a.width / 2 + ((b.x + b.width / 2) - (a.x + a.width / 2)) * i / 10,
      a.y + a.height / 2 + ((b.y + 10) - (a.y + a.height / 2)) * i / 10);
  }
  await page.mouse.up();
}

test('a card is dragged to another list', async ({ boardPage: page, board }) => {
  const card = page.locator(`#js-list-${board.listIds[0]} .js-minicard`, { hasText: 'Alpha Card' });
  const target = page.locator(`#js-list-${board.listIds[2]} .js-minicards`);
  await drag(page, card, target);
  await expect.poll(() => db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' }).listId).toBe(board.listIds[2]);
  await expect(page.locator(`#js-list-${board.listIds[2]} .minicard-title`, { hasText: 'Alpha Card' })).toBeVisible();
});

test('selected cards move together', async ({ boardPage: page, board }) => {
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.locator('.js-minicard', { hasText: 'Alpha Card' }).click({ modifiers: [modifier] });
  await page.locator('.js-minicard', { hasText: 'Beta Card' }).click({ modifiers: [modifier] });
  await expect(page.locator('.js-minicard.is-selected')).toHaveCount(2);
  await drag(page, page.locator('.js-minicard', { hasText: 'Alpha Card' }), page.locator(`#js-list-${board.listIds[2]} .js-minicards`));
  await expect.poll(() => db.find('cards', { boardId: board.boardId, listId: board.listIds[2] }).map(c => c.title).sort())
    .toEqual(['Alpha Card', 'Beta Card', 'Gamma Card']);
});

test('negative: a drop outside every list changes nothing', async ({ boardPage: page, board }) => {
  const card = page.locator('.js-minicard', { hasText: 'Alpha Card' });
  await drag(page, card, page.locator('.board-header'));
  await page.waitForTimeout(500);
  expect(db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' }).listId).toBe(board.listIds[0]);
});

test('another page of the board shows a new card without reloading', async ({ boardPage: page, board, user }) => {
  const other = await page.context().newPage();
  await openBoard(other, board.boardId, board.slug);
  const res = await page.request.post(`/api/boards/${board.boardId}/lists/${board.listIds[1]}/cards`, {
    headers: { Authorization: `Bearer ${user.token}` },
    data: { title: 'Live card', swimlaneId: board.swimlaneId },
  });
  expect(res.status()).toBe(200);
  await expect(other.locator('.minicard-title', { hasText: 'Live card' })).toBeVisible({ timeout: 10_000 });
});
