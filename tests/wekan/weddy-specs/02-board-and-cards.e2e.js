'use strict';
// The board with WeKan's own page objects: the same class names find the same parts.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');
const BoardPage = require('../tests/playwright/pages/BoardPage');
const CardPage = require('../tests/playwright/pages/CardPage');

test('the seeded board shows its lists and cards', async ({ boardPage: page, board }) => {
  const bp = new BoardPage(page);
  expect(await bp.listTitles()).toEqual(['List A', 'List B', 'List C']);
  expect(await bp.getCardTitles(board.listIds[0])).toEqual(['Alpha Card']);
  expect(await bp.getCardTitles(board.listIds[1])).toEqual(['Beta Card']);
});

test('a card is added at the list, and is in WeKan\'s database', async ({ boardPage: page, board }) => {
  const bp = new BoardPage(page);
  await bp.openAddCardTop(board.listIds[0]);
  await bp.submitNewCard(board.listIds[0], 'Added in Weddy');
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Added in Weddy' });
  expect(card.listId).toBe(board.listIds[0]);
  expect(card.swimlaneId).toBe(board.swimlaneId);
  expect(card._id).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz]{17}$/);
});

test('a card opens its details', async ({ boardPage: page, board }) => {
  const bp = new BoardPage(page);
  await bp.clickCard(board.listIds[1], 'Beta Card');
  const cp = new CardPage(page);
  await cp.waitForOpen();
  expect(await cp.getTitle()).toBe('Beta Card');
});

test('a list is added', async ({ boardPage: page, board }) => {
  await page.locator('.js-list-form .list-name-input').fill('List D');
  await page.locator('.js-list-form button[type=submit]').click();
  await expect(page.locator('.js-list .list-header-name', { hasText: 'List D' })).toBeVisible();
  expect(db.findOne('lists', { boardId: board.boardId, title: 'List D' })).toBeTruthy();
});

test('negative: a card without a title is not added', async ({ boardPage: page, board }) => {
  const before = db.countDocuments('cards', { boardId: board.boardId });
  const res = await page.request.post(`/b/${board.boardId}/cards`, {
    form: { title: '   ', listId: board.listIds[0], swimlaneId: board.swimlaneId },
  });
  expect(res.status()).toBe(400);
  expect(db.countDocuments('cards', { boardId: board.boardId })).toBe(before);
});
