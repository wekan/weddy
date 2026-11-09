'use strict';
// WeKan's Rules Import / Export, on Weddy's Rules page: the CSV export imports
// back; Trello Butler text and n8n / Node-RED workflows become rules, the
// lines that cannot be mapped counted; malformed input makes nothing.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');
const { navigateInApp } = require('../tests/playwright/helpers/auth');

test('rules import from CSV, Trello Butler and visual workflows', async ({ boardPage: page, board }) => {
  const rules = () => db.find('rules', { boardId: board.boardId });
  try {
    await page.evaluate(boardId => Meteor.callAsync('rules.createRule', boardId, 'Round, "trip"',
      { activityType: 'createCard', listName: 'To, do', swimlaneName: '*', cardTitle: '*' },
      { actionType: 'setColor', selectedColor: 'red' }), board.boardId);
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules?view=import`);
    const popup = page.locator('.js-pop-over');
    const href = await popup.locator('.js-rules-export-csv').getAttribute('href');
    const csv = await (await page.request.get(new URL(href, page.url()).toString())).text();
    const text = popup.locator('.js-rules-import-text');
    const message = popup.locator('.rules-ie-message');
    await text.fill(csv);
    await popup.locator('.js-rules-import-csv').click();
    await expect(message).toContainText('Imported 1 rule');
    await expect.poll(() => rules().filter(rule => rule.title === 'Round, "trip"').length).toBe(2);
    const copy = rules().filter(rule => rule.title === 'Round, "trip"')[1];
    expect(db.findOne('triggers', { _id: copy.triggerId }).listName).toBe('To, do');
    expect(db.findOne('actions', { _id: copy.actionId }).selectedColor).toBe('red');

    await text.fill('when a card is added to list "Inbox", move the card to the top of the list\nsort the list by due date');
    await popup.locator('.js-rules-import-trello').click();
    await expect(message).toContainText('Imported 1 rule');
    await expect(message).toContainText('Could not map 1 line');
    const butler = rules().find(rule => rule.title.startsWith('when a card is added'));
    expect(db.findOne('triggers', { _id: butler.triggerId }).listName).toBe('Inbox');
    expect(db.findOne('actions', { _id: butler.actionId }).actionType).toBe('moveCardToTop');

    await text.fill(JSON.stringify({ nodes: [{ name: 'Webhook', type: 'n8n-nodes-base.webhook' }, { name: 'Archive it', type: 'archive' }, { name: 'Slack', type: 'slack' }],
      connections: { Webhook: { main: [[{ node: 'Archive it' }, { node: 'Slack' }]] } } }));
    await popup.locator('.js-rules-import-workflow').click();
    await expect(message).toContainText('Could not map 1 line');
    await expect.poll(() => rules().some(rule => rule.title === 'Webhook → Archive it')).toBe(true);

    await text.fill(JSON.stringify([{ id: 'a', type: 'inject', name: 'Every morning', wires: [['b']] }, { id: 'b', type: 'function', name: 'mark done' }]));
    await popup.locator('.js-workflow-format').selectOption('nodered');
    await popup.locator('.js-rules-import-workflow').click();
    await expect.poll(() => rules().some(rule => rule.title === 'Every morning → mark done')).toBe(true);

    // Negative: nothing from text that is none of these.
    const before = rules().length;
    await text.fill('{ not json');
    await popup.locator('.js-rules-import-workflow').click();
    await expect(message).toContainText('invalid JSON');
    await text.fill('title,triggerType\nno action,createCard');
    await popup.locator('.js-rules-import-csv').click();
    await expect(message).toContainText('Imported 0 rule');
    expect(rules()).toHaveLength(before);
  } finally {
    for (const collection of ['rules', 'triggers', 'actions']) db.deleteMany(collection, { boardId: board.boardId });
  }
});
