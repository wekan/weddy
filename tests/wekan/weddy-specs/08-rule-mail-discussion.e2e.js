'use strict';
// WeKan's mail action form on Weddy's Rules page: "Checklists / Comments" is
// off until ticked, and a ticked one is saved as includeChecklistsAndComments.
// What the mail then carries is pinned by the plugin's
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
  if (tick) await page.locator('#email-discussion').check();
  await page.locator('.js-mail-action').click();
  await expect(page.locator('.rules-lists-item').filter({ hasText: title })).toBeVisible();
  const rule = db.findOne('rules', { boardId: board.boardId, title });
  return db.findOne('actions', { _id: rule.actionId });
}

test('the mail action saves "Checklists / Comments" only when ticked', async ({ boardPage: page, board }) => {
  try {
    expect((await mailRule(page, board, 'Mail with discussion', true)).includeChecklistsAndComments).toBe(true);
    // Negative: unticked is not on.
    expect((await mailRule(page, board, 'Mail without discussion', false)).includeChecklistsAndComments).toBe(false);
  } finally {
    for (const collection of ['rules', 'triggers', 'actions']) db.deleteMany(collection, { boardId: board.boardId });
  }
});
