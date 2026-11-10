'use strict';
// WeKan's Admin Panel / Notifications and a webhook's own form
// (outgoingWebhooksPopup), their delivery part (#3695 / #5171), on Weddy:
// a site admin sets the instance's tray default from Admin Panel; a board's
// admin sets one webhook's own delivery on the board's Notifications page,
// kept on that webhook where Node.js WeKan reads it.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');
const { loginWithToken, navigateInApp } = require('../tests/playwright/helpers/auth');

test("a site admin sets the instance's notification defaults in Admin Panel", async ({ page, adminUser }) => {
  if (!db.findOne('settings', {})) db.insertOne('settings', { _id: db.uid('settings') });
  const before = db.findOne('settings', {}).notificationDelivery;
  try {
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, '/admin/people');
    await page.locator('.admin-panel-tabs a[href="/admin/notifications"]').click();
    await expect(page).toHaveURL(/\/admin\/notifications/);
    const tray = page.locator('form.js-admin-delivery[data-channel="tray"]');
    await tray.locator('select.js-delivery-grouping').selectOption('card');
    await tray.locator('.js-delivery-save').click();
    await expect(page.locator('.js-delivery-saved')).toBeVisible();
    await expect.poll(() => db.findOne('settings', {}).notificationDelivery?.tray).toEqual({ grouping: 'card' });
  } finally {
    const id = db.findOne('settings', {})._id;
    db.updateOne('settings', { _id: id }, before ? { $set: { notificationDelivery: before } } : { $unset: { notificationDelivery: '' } });
  }
});

test("a board's admin sets one webhook's own delivery", async ({ boardPage: page, board }) => {
  const hookId = db.uid('hook');
  db.insertOne('integrations', { _id: hookId, boardId: board.boardId, title: 'Team chat', url: 'https://hooks.example/chat', enabled: true, activities: ['all'] });
  try {
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/notifications`);
    const form = page.locator(`.board-notifications-hook[data-hook="${hookId}"] form.js-integration-delivery`);
    await expect(form).toBeVisible();
    await form.locator('select.js-delivery-schedule').selectOption('interval');
    await form.locator('select.js-delivery-interval').selectOption('15');
    await form.locator('.js-delivery-save').click();
    await expect(page.locator('.js-delivery-saved')).toBeVisible();
    const zone = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
    await expect.poll(() => db.findOne('integrations', { _id: hookId }).notificationDelivery?.webhook)
      .toEqual({ schedule: 'interval', intervalMinutes: 15, timezone: zone });
    // The board's own level is untouched by a webhook's.
    expect(db.findOne('boards', { _id: board.boardId }).notificationDelivery).toBeUndefined();
  } finally {
    db.deleteMany('integrations', { boardId: board.boardId });
  }
});
