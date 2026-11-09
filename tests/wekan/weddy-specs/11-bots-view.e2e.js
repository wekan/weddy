'use strict';
// The Rules page's Bots view, as WeKan's rulesBots: a bot to this machine is
// refused in the add form; a board's bot is listed; a card's drawer hands it
// to the bot, the reply box comments as the admin, Stop stops the run; and a
// card dragged to another column moves there.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');
const { navigateInApp } = require('../tests/playwright/helpers/auth');

test('the Bots view: add, dispatch, reply, stop and drag', async ({ boardPage: page, user, board }) => {
  const view = (cardId = '') => navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules?view=bots${cardId ? `&card=${cardId}` : ''}`);
  const botId = `botview-${board.boardId}`;
  try {
    await view();
    const add = page.locator('.js-bots-add');
    await add.locator('.js-bots-title').fill('Local');
    await add.locator('.js-bots-url').fill('http://127.0.0.1:9/run');
    await add.locator('button[type=submit]').click();
    await expect(page.locator('.js-bots-add-error')).toBeVisible();
    expect(db.find('integrations', { boardId: board.boardId })).toEqual([]);

    db.insertOne('integrations', { _id: botId, boardId: board.boardId, title: 'Coder', url: 'https://bots.example/run', type: 'outgoing-webhooks',
      enabled: true, bot: true, activities: ['bot-dispatch'], userId: user.id, createdAt: new Date(), modifiedAt: new Date() });
    const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    await view(card._id);
    await expect(page.locator('.bots-bot-name')).toHaveText('Coder');
    await page.locator('.js-bots-dispatch').click();
    await expect.poll(() => (db.findOne('botRuns', { cardId: card._id }) || {}).status).toBe('queued');
    await expect(page.locator('.bots-drawer .bots-pill')).toBeVisible();

    await page.locator('.js-bots-reply-text').fill('please also test');
    await page.locator('.js-bots-reply button[type=submit]').click();
    await expect.poll(() => db.find('card_comments', { cardId: card._id, text: 'please also test' }).length).toBe(1);
    await expect(page.locator('.bots-thread')).toContainText('please also test');

    await page.locator('.js-bots-stop').click();
    await expect.poll(() => db.findOne('botRuns', { cardId: card._id }).status).toBe('stopped');

    const target = page.locator(`.js-bots-drop[data-list-id="${board.listIds[1]}"]`);
    await page.locator(`.js-bots-card[data-card-id="${card._id}"]`).dragTo(target);
    await expect.poll(() => db.findOne('cards', { _id: card._id }).listId).toBe(board.listIds[1]);
  } finally {
    db.deleteMany('integrations', { boardId: board.boardId });
    db.deleteMany('botRuns', { boardId: board.boardId });
  }
});
