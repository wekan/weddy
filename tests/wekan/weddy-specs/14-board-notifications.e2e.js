'use strict';
// WeKan's Board Settings / Notifications, its delivery part (#3695 / #5171),
// on Weddy's board Notifications page: the board's admin opens it from the
// board menu, sets how the board's webhooks deliver - no sentence, only the
// ids group, one POST per card - and the board's e-mail grouping, kept on the
// board where Node.js WeKan reads them; a value WeKan never offers is refused.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');

test("a board's admin sets how the board's notifications and webhooks deliver", async ({ boardPage: page, board }) => {
  const delivery = () => db.findOne('boards', { _id: board.boardId })?.notificationDelivery;
  // The board menu lives in the right sidebar, opened from the header.
  const menu = page.locator('.board-sidebar .js-open-board-menu');
  if (!(await menu.isVisible().catch(() => false))) await page.locator('.js-toggle-page-sidebar').first().click();
  await menu.click();
  await page.locator('.js-open-board-notifications').click();
  await expect(page).toHaveURL(new RegExp(`/b/${board.boardId}/[^/]+/notifications`));
  const hooks = page.locator('form.js-board-delivery[data-channel="webhook"]');
  await hooks.locator('select.js-delivery-text').selectOption('false');
  await hooks.locator('.js-delivery-fields-default').uncheck();
  for (const field of await hooks.locator('.js-delivery-field').all()) await field.uncheck();
  await hooks.locator('.js-delivery-field[value="ids"]').check();
  await hooks.locator('select.js-delivery-grouping').selectOption('card');
  await hooks.locator('.js-delivery-save').click();
  await expect(page.locator('.js-delivery-saved')).toBeVisible();
  await expect.poll(() => delivery()?.webhook).toEqual({ text: false, fields: ['ids'], grouping: 'card' });

  const email = page.locator('form.js-board-delivery[data-channel="email"]');
  await email.locator('select.js-delivery-grouping').selectOption('board');
  await email.locator('.js-delivery-save').click();
  await expect.poll(() => delivery()?.email).toEqual({ grouping: 'board' });
  await expect(page.locator('form.js-board-delivery[data-channel="webhook"] select.js-delivery-text')).toHaveValue('false');

  // Negative: a grouping the tray has not is refused, nothing written.
  const out = await page.evaluate(id => fetch('/_methods/setNotificationDelivery', { method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(['board', id, 'tray', { grouping: 'all' }]) }).then(r => r.json()),
  board.boardId);
  expect(out.error).toBe('invalid-notification-delivery');
  expect(delivery()?.tray).toBeUndefined();
});
