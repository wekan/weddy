'use strict';
// WeKan's import-export-format-audit "every external export menu link returns
// text and refuses an unrelated user", on Weddy's Export pop-over: every other
// tool's export is offered, answers its file, and refuses a stranger. A text
// format carries the board's cards; a workbook and Vikunja's archive are zips.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');

const BINARY = ['planner', 'monday', 'wrike', 'teamwork', 'businessmap', 'vikunja'];

test('every other-tool export in the Export pop-over answers its file and refuses a stranger', async ({ boardPage: page, board, user2 }) => {
  const menu = page.locator('.board-sidebar .js-open-board-menu');
  if (!(await menu.isVisible().catch(() => false))) await page.locator('.js-toggle-page-sidebar').first().click();
  await menu.click();
  await page.locator('.js-pop-over .js-export-board').click();
  const links = page.locator('.js-pop-over a.js-export-tool');
  await expect(links.first()).toBeVisible();
  const formats = await links.evaluateAll(as => as.map(a => [a.dataset.format, a.getAttribute('href')]));
  expect(formats.length).toBeGreaterThanOrEqual(38);
  for (const [format, href] of formats) {
    await test.step(format, async () => {
      const response = await page.request.get(href);
      expect(response.status()).toBe(200);
      const body = await response.body();
      if (BINARY.includes(format)) expect(body.subarray(0, 2).toString()).toBe('PK');
      else if (format === 'wrikeworkflow') {
        const lists = db.find('lists', { boardId: board.boardId, archived: false }).map(l => l.title);
        expect(JSON.parse(body.toString()).data[0].customStatuses.map(s => s.name)).toEqual(expect.arrayContaining(lists));
      } else expect(body.toString()).toContain('Alpha Card');
      const stranger = new URL(href, page.url());
      stranger.searchParams.set('authToken', user2.token);
      expect([401, 403]).toContain((await page.request.get(stranger.toString())).status());
    });
  }
});
