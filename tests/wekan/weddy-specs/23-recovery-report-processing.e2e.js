'use strict';
// Admin Panel -> Problems -> Recovery, for a notification that automatic
// recovery is delivering at that moment ("Delivery reservation active", its
// lease held): its buttons are disabled, and they come back when the lease
// is released WITHOUT reloading the page, as WeKan's reactive report does.
// Before, the report was asked once, so a row loaded while recovery held
// the lease kept Retry disabled - WeKan's manual-retry spec failed whenever
// the recovery pass happened to hold it as the page loaded the report.
const { test, expect } = require('../tests/playwright/fixtures');
const { loginWithToken, navigateInApp } = require('../tests/playwright/helpers/auth');
const db = require('../tests/playwright/helpers/db');
const { canonical, sha256 } = require('../models/lib/changeHistoryIntegrity');
const { planId } = require('../server/lib/activityNotificationPlan');

// A pending notification with its plan, for a disabled recipient, so automatic
// recovery does not deliver it during the test (as WeKan's spec seeds it).
function seed(id, recipientId) {
  const activity = { _id: id, activityType: 'createCard', createdAt: new Date(), modifiedAt: new Date() };
  const activityHash = sha256(canonical(activity));
  const intentId = sha256(canonical(['activity-notification-intent', id]));
  db.insertOne('activities', activity);
  const plan = { version: 1, activityId: id, activityHash, dispatchUserId: null,
    recipients: [{ userId: recipientId, tray: false, email: { userId: recipientId, eventId: id, boardId: null, cardId: null,
      language: 'en', subject: 'S', html: 'H' } }] };
  db.insertOne('activityNotificationPlans', { _id: planId(id), checksum: sha256(canonical(plan)), plan });
  db.insertOne('activityNotificationIntents', { _id: intentId, activityHash, version: 1, state: 'pending',
    activity, writerId: 'test-writer', dispatchUserId: null });
  return intentId;
}

function cleanup(id, intentId) {
  db.deleteMany('activityNotificationIntents', { _id: intentId });
  db.deleteMany('activityNotificationLeases', { _id: intentId });
  db.deleteMany('activityNotificationControls', { _id: intentId });
  db.deleteMany('activityNotificationPlans', { _id: planId(id) });
  db.deleteMany('activities', { _id: id });
}

async function openReport(page, adminUser, id) {
  await loginWithToken(page, adminUser.id, adminUser.token);
  await navigateInApp(page, '/admin/problems/recovery');
  const panel = page.locator('.activity-notification-recovery-reports');
  await panel.locator('.js-table-page-search').fill(id);
  await panel.locator('.js-table-page-search').press('Enter');
  await expect(panel.locator('tbody tr')).toHaveCount(1);
  return panel;
}

test('a row being delivered turns back by itself when the delivery lease is released', async ({ page, adminUser, user2 }) => {
  const id = db.uid('processing-activity');
  db.updateOne('users', { _id: user2.id }, { $set: { loginDisabled: true } });
  const intentId = seed(id, user2.id);
  // Automatic recovery holds the lease for the next few seconds.
  db.insertOne('activityNotificationLeases', { _id: intentId, owner: 'another-worker', expiresAt: new Date(Date.now() + 4000) });
  try {
    const panel = await openReport(page, adminUser, id);
    await expect(panel).toContainText('Delivery reservation active');
    await expect(panel.locator('.js-control-activity-notification')).toBeDisabled();
    // No reload: the report asks again while the row is processing.
    await expect(panel.locator('.js-control-activity-notification')).toBeEnabled({ timeout: 15_000 });
    await expect(panel).not.toContainText('Delivery reservation active');
  } finally {
    cleanup(id, intentId);
    db.updateOne('users', { _id: user2.id }, { $unset: { loginDisabled: 1 } });
  }
});

test('negative: a report with nothing being delivered is asked for once', async ({ page, adminUser, user2 }) => {
  const id = db.uid('idle-activity');
  db.updateOne('users', { _id: user2.id }, { $set: { loginDisabled: true } });
  const intentId = seed(id, user2.id);
  let asked = 0;
  page.on('request', req => { if (req.url().includes('/_methods/activityNotificationRecoveryReport')) asked++; });
  try {
    const panel = await openReport(page, adminUser, id);
    await expect(panel.locator('.js-control-activity-notification')).toBeEnabled();
    const after = asked;
    await page.waitForTimeout(3000);
    expect(asked).toBe(after);
  } finally {
    cleanup(id, intentId);
    db.updateOne('users', { _id: user2.id }, { $unset: { loginDisabled: 1 } });
  }
});
