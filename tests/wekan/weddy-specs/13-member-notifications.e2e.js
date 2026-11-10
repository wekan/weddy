'use strict';
// WeKan's Member Settings / Notification Settings, the member's own part of
// #3695 / #5171, on Weddy's profile page: the member's e-mail is set to be
// grouped by board on a schedule, in the browser's time zone, and kept on
// the user's profile where Node.js WeKan reads it; "Default" gives it back to
// the board and Admin Panel; a value WeKan never offers is refused; and the
// member leaves their name out of outgoing webhooks. WeKan's spec reaches this
// through its Blaze popup; this one through the page's forms.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');
const { navigateInApp } = require('../tests/playwright/helpers/auth');

test('a member sets their own notification delivery and leaves their name out of webhooks', async ({ loggedInPage: page, user }) => {
  const delivery = () => db.findOne('users', { _id: user.id })?.profile?.notificationDelivery?.email;
  await navigateInApp(page, '/profile');
  const email = page.locator('form.js-member-delivery[data-channel="email"]');
  await expect(email).toBeVisible();
  await email.locator('select.js-delivery-grouping').selectOption('board');
  await email.locator('select.js-delivery-schedule').selectOption('interval');
  await email.locator('select.js-delivery-interval').selectOption('30');
  await email.locator('.js-delivery-parts-default').uncheck();
  for (const part of await email.locator('.js-delivery-part').all()) await part.uncheck();
  await email.locator('.js-delivery-part[value="card"]').check();
  await email.locator('.js-delivery-save').click();
  await expect(page.locator('.js-profile-saved')).toBeVisible();
  const zone = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  await expect.poll(delivery).toEqual({ grouping: 'board', schedule: 'interval', intervalMinutes: 30, parts: ['card'], timezone: zone });
  await expect(page.locator('form.js-member-delivery[data-channel="email"] select.js-delivery-grouping')).toHaveValue('board');

  // Default: every setting of the e-mail back to the board and Admin Panel.
  const again = page.locator('form.js-member-delivery[data-channel="email"]');
  for (const select of ['grouping', 'schedule', 'interval']) await again.locator(`select.js-delivery-${select}`).selectOption('');
  await again.locator('.js-delivery-parts-default').check();
  await again.locator('.js-delivery-save').click();
  await expect(page.locator('.js-profile-saved')).toBeVisible();
  // The time zone it was set in stays, as in WeKan, and nothing else.
  await expect.poll(delivery).toEqual({ timezone: zone });

  // Negative: a grouping the tray does not offer is refused, nothing written.
  const status = await page.evaluate(() => fetch('/_methods/setNotificationDelivery', { method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(['member', null, 'tray', { grouping: 'all' }]) })
    .then(r => r.json()));
  expect(status.error).toBe('invalid-notification-delivery');
  expect(db.findOne('users', { _id: user.id })?.profile?.notificationDelivery?.tray).toBeUndefined();

  // Leave my name out of outgoing webhooks.
  const hooks = page.locator('form.js-member-webhook');
  await hooks.locator('input[name="hideIdentity"]').check();
  await hooks.locator('.js-webhook-hide-save').click();
  await expect.poll(() => db.findOne('users', { _id: user.id })?.profile?.webhookHideIdentity).toBe(true);
  await expect(page.locator('form.js-member-webhook input[name="hideIdentity"]')).toBeChecked();
});
