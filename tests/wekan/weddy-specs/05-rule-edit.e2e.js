'use strict';
// #2713, on Weddy's Rules page: "Edit trigger/action" opens the same wizard and
// saves the rule in place - the same rule, its trigger and action replaced -
// instead of adding a second rule beside it.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');
const { navigateInApp } = require('../tests/playwright/helpers/auth');

test('editing a rule replaces its trigger and action in place', async ({ boardPage: page, board }) => {
  const created = await page.evaluate(boardId => Meteor.callAsync('rules.createRule', boardId, 'Edit me',
    { activityType: 'createCard', listName: '*', swimlaneName: '*', cardTitle: '*' },
    { actionType: 'setColor', selectedColor: 'red' }), board.boardId);
  try {
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
    const row = page.locator('.rules-lists-item').filter({ hasText: 'Edit me' });
    await row.locator('.js-edit-rule-full').click();
    await page.locator('.js-add-gen-moved-trigger').click();
    await page.locator('.js-add-arch-action').click();
    await expect.poll(() => db.findOne('actions', { _id: created.actionId })?.actionType).toBe('archive');
    const rules = db.find('rules', { boardId: board.boardId });
    expect(rules).toHaveLength(1);
    expect(rules[0]).toMatchObject({ _id: created._id, triggerId: created.triggerId, actionId: created.actionId, title: 'Edit me' });
    expect(db.findOne('triggers', { _id: created.triggerId }).activityType).toBe('moveCard');
    // Negative: Add Rule afterwards creates a rule, never edits the last one.
    await page.locator('#ruleTitle').fill('Another');
    await page.locator('.js-goto-trigger').click();
    await page.locator('.js-add-gen-moved-trigger').click();
    await page.locator('.js-add-arch-action').click();
    await expect.poll(() => db.find('rules', { boardId: board.boardId }).length).toBe(2);
    expect(db.findOne('actions', { _id: created.actionId }).actionType).toBe('archive');
  } finally {
    for (const collection of ['rules', 'triggers', 'actions']) db.deleteMany(collection, { boardId: board.boardId });
  }
});
