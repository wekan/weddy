'use strict';
// WeKan's mail action form on Weddy's Rules page: "Details" and "Checklists /
// Comments" are off until ticked, and a ticked one is saved as
// includeCardDetails / includeChecklistsAndComments. What the mail then
// carries is pinned by the plugin's TestRuleSendEmailDetails and
// TestRuleSendEmailDiscussion.
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
  for (const box of tick) await page.locator(box).check();
  await page.locator('.js-mail-action').click();
  await expect(page.locator('.rules-lists-item').filter({ hasText: title })).toBeVisible();
  const rule = db.findOne('rules', { boardId: board.boardId, title });
  return db.findOne('actions', { _id: rule.actionId });
}

test('the mail action saves "Details" and "Checklists / Comments" only when ticked', async ({ boardPage: page, board }) => {
  try {
    const both = await mailRule(page, board, 'Mail with everything', ['#email-card-details', '#email-discussion']);
    expect(both.includeCardDetails).toBe(true);
    expect(both.includeChecklistsAndComments).toBe(true);
    const talk = await mailRule(page, board, 'Mail with discussion', ['#email-discussion']);
    expect(talk.includeChecklistsAndComments).toBe(true);
    expect(talk.includeCardDetails).toBe(false);
    // Negative: unticked is not on.
    const none = await mailRule(page, board, 'Mail without either', []);
    expect(none.includeChecklistsAndComments).toBe(false);
    expect(none.includeCardDetails).toBe(false);
  } finally {
    for (const collection of ['rules', 'triggers', 'actions']) db.deleteMany(collection, { boardId: board.boardId });
  }
});
