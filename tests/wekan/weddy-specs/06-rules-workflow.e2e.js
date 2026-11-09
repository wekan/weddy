'use strict';
// WeKan's Rules workflow view, on Weddy's Rules page: a trigger chip dragged
// into When and an action into Then make a rule with Add Rule; an action
// dropped onto that rule replaces what it does.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');
const { navigateInApp } = require('../tests/playwright/helpers/auth');

test('rules are built and changed by dragging palette chips', async ({ boardPage: page, board }) => {
  // Tall enough that a chip and a rule are both on screen: a drag that
  // scrolls between press and drop can start from another element.
  await page.setViewportSize({ width: 1400, height: 2200 });
  try {
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules?view=workflow`);
    const add = page.locator('.js-create-workflow-rule');
    await expect(add).toBeDisabled();
    await page.locator('.js-trigger-chip').first().dragTo(page.locator('.js-when-slot'));
    // Negative: a trigger is not an action, and dropped on Then does nothing.
    await page.locator('.js-trigger-chip').nth(1).dragTo(page.locator('.js-then-slot'));
    await expect(add).toBeDisabled();
    await page.locator('.js-action-chip').filter({ hasText: /archive/i }).first().dragTo(page.locator('.js-then-slot'));
    await expect(add).toBeEnabled();
    await page.locator('.js-workflow-rule-title').fill('Dragged rule');
    await add.click();
    await expect.poll(() => db.find('rules', { boardId: board.boardId, title: 'Dragged rule' }).length).toBe(1);
    const rule = db.findOne('rules', { boardId: board.boardId, title: 'Dragged rule' });
    expect(db.findOne('triggers', { _id: rule.triggerId }).activityType).toBe('createCard');
    expect(db.findOne('actions', { _id: rule.actionId }).actionType).toBe('archive');
    // An action dropped onto the rule replaces what it does, the rule kept.
    await expect(page.locator(`.js-rule-node[data-rule-id="${rule._id}"]`)).toBeVisible();
    await page.locator('.js-action-chip').filter({ hasText: /complete/i }).first().dragTo(page.locator(`.js-rule-node[data-rule-id="${rule._id}"]`));
    await expect.poll(() => db.findOne('actions', { _id: rule.actionId })?.actionType).toBe('markCardComplete');
    expect(db.findOne('rules', { _id: rule._id }).triggerId).toBe(rule.triggerId);
    expect(db.findOne('triggers', { _id: rule.triggerId }).activityType).toBe('createCard');
  } finally {
    for (const collection of ['rules', 'triggers', 'actions']) db.deleteMany(collection, { boardId: board.boardId });
  }
});
