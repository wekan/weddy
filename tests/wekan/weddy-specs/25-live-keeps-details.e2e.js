'use strict';
// A live update - somebody else's change re-rendering the board - keeps what
// the user opened in the card details: the Scrum fields' editor, a <details>,
// stays open, its select usable. WeKan's scrum-multiple-releases test lost it
// whenever the update of its own earlier call arrived after the click.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');

const call = (page, method, ...args) => page.evaluate(({ method, args }) => Meteor.callAsync(method, ...args), { method, args });

test('a live update keeps an opened <details> of the card details open', async ({ boardPage: page, board, user }) => {
  await call(page, 'scrum.configure', board.boardId, { enabled: true, visibility: { cardRelease: true } }, 0);
  await call(page, 'scrum.saveRelease', board.boardId, null, { name: 'Alpha' }, null);
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  await page.goto(`/b/${board.boardId}/${board.slug}/${card._id}`);
  const details = page.locator('.js-card-details .scrum-metadata details');
  await details.locator('summary').click();
  await expect(details).toHaveAttribute('open', '');
  // Somebody else's change: a card made through the REST API.
  const res = await page.request.post(`/api/boards/${board.boardId}/lists/${board.listIds[1]}/cards`, {
    headers: { Authorization: `Bearer ${user.token}` },
    data: { title: 'Live while open', swimlaneId: board.swimlaneId },
  });
  expect(res.status()).toBe(200);
  await expect(page.locator('.minicard-title', { hasText: 'Live while open' })).toBeVisible({ timeout: 10_000 });
  await expect(details).toHaveAttribute('open', '');
  await expect(page.locator('.js-card-details .js-scrum-metadata select[name="releaseIds"]')).toBeVisible();
  // Negative: a <details> the user did not open is not opened by the update.
  await details.locator('summary').click();
  await expect(details).not.toHaveAttribute('open', '');
  await page.request.post(`/api/boards/${board.boardId}/lists/${board.listIds[1]}/cards`, {
    headers: { Authorization: `Bearer ${user.token}` },
    data: { title: 'Live while closed', swimlaneId: board.swimlaneId },
  });
  await expect(page.locator('.minicard-title', { hasText: 'Live while closed' })).toBeVisible({ timeout: 10_000 });
  await expect(details).not.toHaveAttribute('open', '');
});
