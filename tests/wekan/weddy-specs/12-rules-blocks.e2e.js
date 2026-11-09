'use strict';
// WeKan's rules-blocks.e2e.js on Weddy's Blocks view: an existing rule loads
// as a When block joined to a Then block, is renamed and saved without
// losing what WeKan keeps beside its fields; blocks that are not one trigger
// joined to one action are refused; a rule built in Blockly is saved and
// runs - a new card is marked complete. WeKan's spec reaches its editor
// through Blaze; this one through Blockly's own workspace.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');
const { navigateInApp } = require('../tests/playwright/helpers/auth');

test('Blocks edits real rules without data loss and creates rules that run', async ({ boardPage: page, board }) => {
  const triggerId = db.uid('trigger'), actionId = db.uid('action'), id = db.uid('rule');
  db.insertOne('triggers', { _id: triggerId, boardId: board.boardId, activityType: 'createCard', listName: '*', swimlaneName: '*', cardTitle: '*', userId: '*', desc: 'When a card is created', extraData: { keep: 'unchanged' } });
  db.insertOne('actions', { _id: actionId, boardId: board.boardId, actionType: 'markCardComplete', desc: 'Mark card complete' });
  db.insertOne('rules', { _id: id, boardId: board.boardId, triggerId, actionId, title: 'Existing block rule', enabled: false, createdAt: new Date() });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules?view=blocks`);
    await expect(page.locator('.rules-blocks .blocklySvg').first()).toBeVisible();
    await page.locator('.js-blocks-rule').selectOption(id);
    await expect(page.locator('.rules-blocks .blocklyText').filter({ hasText: 'When: Card is created' }).first()).toBeVisible();
    await page.locator('.js-blocks-title').fill('Updated block rule');
    await page.locator('.js-blocks-save').click();
    await expect.poll(() => db.findOne('rules', { _id: id }).title).toBe('Updated block rule');
    await expect(page.locator('.js-blocks-saved')).toBeVisible();
    expect(db.findOne('rules', { _id: id }).enabled).toBe(false);
    expect(db.findOne('triggers', { _id: triggerId }).extraData).toEqual({ keep: 'unchanged' });

    // Negative: an empty workspace is not a rule.
    await page.locator('.js-blocks-new').click();
    await page.locator('.js-blocks-title').fill('Incomplete blocks');
    await page.locator('.js-blocks-save').click();
    await expect(page.locator('.js-blocks-error')).toContainText('Connect exactly one');
    expect(db.find('rules', { boardId: board.boardId })).toHaveLength(1);

    // A rule built in the workspace, saved from the page, runs.
    await page.evaluate(() => {
      const ws = Blockly.getMainWorkspace();
      Blockly.serialization.workspaces.load({ blocks: { languageVersion: 0, blocks: [{ type: 'wekan_trigger', x: 35, y: 35,
        extraState: { document: { activityType: 'createCard', listName: '*', swimlaneName: '*', cardTitle: '*', userId: '*' } },
        next: { block: { type: 'wekan_action', extraState: { document: { actionType: 'markCardComplete' } } } } }] } }, ws);
    });
    await page.locator('.js-blocks-title').fill('Complete new cards');
    await page.locator('.js-blocks-save').click();
    await expect.poll(() => db.find('rules', { boardId: board.boardId }).length).toBe(2);
    const created = db.find('rules', { boardId: board.boardId }).find(r => r.title === 'Complete new cards');
    expect(db.findOne('actions', { _id: created.actionId }).actionType).toBe('markCardComplete');
    const card = await page.evaluate(({ boardId, listId, swimlaneId }) => fetch(`/api/boards/${boardId}/lists/${listId}/cards`, {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Created by Blocks test', swimlaneId }) }).then(r => r.json()),
    { boardId: board.boardId, listId: board.listIds[0], swimlaneId: board.swimlaneId });
    await expect.poll(() => db.findOne('cards', { _id: card._id })?.dueComplete).toBe(true);
    expect(errors).toEqual([]);
  } finally {
    for (const c of ['rules', 'triggers', 'actions']) db.deleteMany(c, { boardId: board.boardId });
  }
});

test('Blocks is for board admins only', async ({ page, board, user2 }) => {
  db.addBoardMember({ boardId: board.boardId, userId: user2.id });
  const { loginWithToken } = require('../tests/playwright/helpers/auth');
  await loginWithToken(page, user2.id, user2.token);
  await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules?view=blocks`);
  await expect(page.locator('.rules-blocks')).toHaveCount(0);
  await expect(page.locator('.blocklySvg')).toHaveCount(0);
  const result = await page.evaluate(async boardId => {
    try { await Meteor.callAsync('rules.createRule', boardId, 'Forbidden', { activityType: 'createCard' }, { actionType: 'archive' }); return 'allowed'; }
    catch (error) { return error.error; }
  }, board.boardId);
  expect(result).not.toBe('allowed');
  expect(db.find('rules', { boardId: board.boardId })).toHaveLength(0);
});
