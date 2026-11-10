'use strict';
// WeKan's per-list exceptions (#4527) that GRANT, on Weddy: the board's admin
// opens List permissions from the list menu and lets read-only members edit
// one list; a read-only member then adds a card there from the composer, and
// sees no composer in the board's other lists. WeKan's spec sets them in its
// Blaze popup; this one on Weddy's List permissions page.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');
const { loginWithToken, openBoard } = require('../tests/playwright/helpers/auth');

test('a list grants read-only members its cards, and only its', async ({ boardPage: page, board, user2 }) => {
  const [granted, other] = board.listIds;
  db.updateOne('boards', { _id: board.boardId }, { $push: { members: { userId: user2.id, isAdmin: false, isActive: true, isReadOnly: true } } });
  // The admin: List permissions, from the list menu.
  await page.locator(`.js-list[data-list="${granted}"] .js-open-list-menu`).first().click();
  await page.locator('.js-pop-over .js-list-permissions').click();
  await expect(page).toHaveURL(new RegExp(`/lists/${granted}/permissions`));
  await page.locator('select.js-list-permission[name="read-only.write"]').selectOption('allow');
  await page.locator('.js-save-list-permissions').click();
  await expect(page.locator('.js-list-permissions-saved')).toBeVisible();
  await expect.poll(() => db.findOne('lists', { _id: granted }).roleExceptions).toEqual({ 'read-only': { write: true } });

  // The read-only member.
  await page.context().clearCookies();
  await loginWithToken(page, user2.id, user2.token);
  await openBoard(page, board.boardId, board.slug);
  await expect(page.locator(`.js-list[data-list="${other}"] .js-add-card`)).toHaveCount(0);
  await page.locator(`.js-list[data-list="${granted}"] .js-add-card`).first().click();
  await page.locator('.js-card-composer .js-card-title').fill('Suggested by a reader');
  await page.locator('.js-card-composer button[type="submit"]').click();
  await expect.poll(() => db.findOne('cards', { title: 'Suggested by a reader' })?.listId).toBe(granted);

  // Negative: the board's other list refuses the same form.
  const status = await page.evaluate(({ boardId, listId, swimlaneId }) => fetch(`/b/${boardId}/cards`, { method: 'POST', credentials: 'same-origin',
    body: new URLSearchParams({ listId, swimlaneId, title: 'Not in this list' }), redirect: 'manual' }).then(r => r.status),
  { boardId: board.boardId, listId: other, swimlaneId: board.swimlaneId });
  expect(status).toBe(403);
  expect(db.findOne('cards', { title: 'Not in this list' })).toBeFalsy();
});
