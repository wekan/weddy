'use strict';
// WeKan's Multi Board Calendar (#2469), from the Board View menu: the cards of
// every board the user is a member of, each prefixed with its board's title,
// read-only. WeKan's own test of it is part of the Jalali calendar spec.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');

test('the Multi Board Calendar shows the cards of every board of the user, read-only', async ({ boardPage: page, board, user }) => {
  const other = db.seedBoard({ ownerId: user.id, title: 'Second board', cardTitlesPerList: [['Elsewhere Card']] });
  const stranger = db.seedUser();
  const foreign = db.seedBoard({ ownerId: stranger.id, title: 'Not mine', cardTitlesPerList: [['Foreign Card']] });
  try {
    const now = new Date();
    for (const b of [board, other, foreign]) {
      for (const card of db.find('cards', { boardId: b.boardId })) db.updateOne('cards', { _id: card._id }, { $set: { dueAt: now } });
    }
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator('.pop-over .js-open-multiboard-cal-view').click();
    const cal = page.locator('#multiboard-calendar-view');
    await expect(cal.locator('.fc-event', { hasText: '[Second board] Elsewhere Card' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(cal.locator('.fc-event', { hasText: 'Alpha Card' }).first()).toBeVisible();
    // Negative: another user's board is not on it, and nothing can be dragged.
    await expect(cal.locator('.fc-event', { hasText: 'Foreign Card' })).toHaveCount(0);
    await expect(cal.locator('.fc-event-draggable')).toHaveCount(0);
  } finally {
    db.cleanup({ boardIds: [other.boardId, foreign.boardId], userIds: [stranger.id] });
  }
});
