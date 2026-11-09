'use strict';
// Bots, server side, against the real binary: a board admin's bot to this
// machine is refused when added; handing a card to a bot makes its run, the
// runner reports with its API token - an unknown status refused - and a bot
// stored on this machine is never called (the SSRF guard). The dispatch's
// content is pinned by the plugin's TestBots.
const http = require('http');
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');

const auth = token => ({ Authorization: `Bearer ${token}` });

test('bots: added, handed a card, reported to, and never called on this machine', async ({ boardPage: page, request, user, board }) => {
  const hits = [];
  const receiver = http.createServer((req, res) => { hits.push(req.url); res.end('ok'); });
  await new Promise(resolve => receiver.listen(0, '127.0.0.1', resolve));
  const target = `http://127.0.0.1:${receiver.address().port}/bot`;
  try {
    const refused = await page.evaluate(([boardId, url]) => Meteor.callAsync('/integrations/insert',
      { boardId, title: 'Local', url, bot: true }).then(() => 'added', e => e.error), [board.boardId, target]);
    expect(refused).toBe('invalid-webhook-url');

    const botId = `bot-${board.boardId}`;
    db.insertOne('integrations', { _id: botId, boardId: board.boardId, title: 'Coder', url: target, type: 'outgoing-webhooks',
      enabled: true, bot: true, activities: ['bot-dispatch'], userId: user.id, createdAt: new Date(), modifiedAt: new Date() });
    const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    const runId = await page.evaluate(([cardId, id]) => Meteor.callAsync('botDispatch', cardId, id), [card._id, botId]);
    expect(db.findOne('botRuns', { _id: runId }).status).toBe('queued');

    const report = `/api/boards/${board.boardId}/cards/${card._id}/bot-runs/${runId}`;
    const ok = await request.post(report, { headers: auth(user.token), data: { status: 'running', tool: 'Bash', text: 'npm test' } });
    expect(ok.status()).toBe(200);
    expect(db.findOne('botRuns', { _id: runId }).events.at(-1).tool).toBe('Bash');
    expect((await request.post(report, { headers: auth(user.token), data: { status: 'hacked' } })).status()).toBe(400);
    expect((await request.post(report, { data: { status: 'done' } })).status()).not.toBe(200);

    await expect.poll(() => db.findOne('eventlog', { bleed: 'IntegrationBleed' })).toBeTruthy();
    expect(hits).toEqual([]);
  } finally {
    receiver.close();
    db.deleteMany('integrations', { boardId: board.boardId });
    db.deleteMany('botRuns', { boardId: board.boardId });
  }
});
