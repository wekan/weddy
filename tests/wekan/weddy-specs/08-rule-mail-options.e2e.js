'use strict';
// WeKan's mail action form on Weddy's Rules page: "Details", "Checklists /
// Comments" and "Attachments" are off until ticked, and a ticked one is saved
// as includeCardDetails / includeChecklistsAndComments / includeAttachments.
// What the mail then carries is pinned by the plugin's
// TestRuleSendEmailDetails, TestRuleSendEmailDiscussion and
// TestRuleSendEmailAttachments.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');
const { navigateInApp } = require('../tests/playwright/helpers/auth');

async function mailRule(page, board, title, tick) {
  await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
  await page.locator('#ruleTitle').fill(title);
  await page.locator('.js-goto-trigger').click();
  await page.locator('.js-set-button-triggers').click();
  await page.locator('.js-add-button-trigger').click();
  await page.locator('.js-set-mail-actions').click();
  await page.locator('#email-to').fill('discussion@example.invalid');
  await page.locator('#email-subject').fill('Card talk');
  await expect(page.locator('#email-discussion')).not.toBeChecked();
  await expect(page.locator('#email-card-details')).not.toBeChecked();
  await expect(page.locator('#email-attachments')).not.toBeChecked();
  for (const box of tick) await page.locator(box).check();
  await page.locator('.js-mail-action').click();
  await expect(page.locator('.rules-lists-item').filter({ hasText: title })).toBeVisible();
  const rule = db.findOne('rules', { boardId: board.boardId, title });
  return db.findOne('actions', { _id: rule.actionId });
}

test('the mail action saves "Details", "Checklists / Comments" and "Attachments" only when ticked', async ({ boardPage: page, board }) => {
  try {
    const all = await mailRule(page, board, 'Mail with everything', ['#email-card-details', '#email-discussion', '#email-attachments']);
    expect(all.includeCardDetails).toBe(true);
    expect(all.includeChecklistsAndComments).toBe(true);
    expect(all.includeAttachments).toBe(true);
    const talk = await mailRule(page, board, 'Mail with discussion', ['#email-discussion']);
    expect(talk.includeChecklistsAndComments).toBe(true);
    expect(talk.includeCardDetails).toBe(false);
    expect(talk.includeAttachments).toBe(false);
    // Negative: unticked is not on.
    const none = await mailRule(page, board, 'Mail without either', []);
    expect(none.includeChecklistsAndComments).toBe(false);
    expect(none.includeCardDetails).toBe(false);
    expect(none.includeAttachments).toBe(false);
  } finally {
    for (const collection of ['rules', 'triggers', 'actions']) db.deleteMany(collection, { boardId: board.boardId });
  }
});
