'use strict';
// Outgoing webhooks and their SSRF guard, against the real binary: a webhook
// to this machine is refused when it is saved, and - should one be stored
// anyway, as a host name that resolved elsewhere when it was saved and to
// this machine since does - it is never called when the board's activity
// happens; the attempt is in Admin Panel / Problems as IntegrationBleed. A
// receiver the tests can start is always on this machine or a private
// network, so the delivery itself is pinned by the plugin's
// TestOutgoingWebhooks.
const http = require('http');
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');

const auth = token => ({ Authorization: `Bearer ${token}` });

test('a webhook to this machine is refused when saved and never called', async ({ request, user, board }) => {
  const hits = [];
  const receiver = http.createServer((req, res) => { hits.push(req.url); res.end('ok'); });
  await new Promise(resolve => receiver.listen(0, '127.0.0.1', resolve));
  const target = `http://127.0.0.1:${receiver.address().port}/hook`;
  try {
    const saved = await request.post(`/api/boards/${board.boardId}/integrations`, { headers: auth(user.token), data: { url: target } });
    expect(saved.status()).toBe(400);
    expect((await saved.json()).error).toBe('invalid-webhook-url');

    const blockedBefore = (db.findOne('eventlog', { bleed: 'IntegrationBleed' }) || {}).count || 0;
    db.insertOne('integrations', { _id: `ssrf-${board.boardId}`, boardId: board.boardId, url: target, type: 'outgoing-webhooks',
      enabled: true, activities: ['all'], userId: user.id, createdAt: new Date(), modifiedAt: new Date() });
    const card = await request.post(`/api/boards/${board.boardId}/lists/${board.listIds[0]}/cards`,
      { headers: auth(user.token), data: { title: 'Webhook trigger', swimlaneId: board.swimlaneId } });
    expect(card.status()).toBe(200);
    await expect.poll(() => (db.findOne('eventlog', { bleed: 'IntegrationBleed' }) || {}).count || 0).toBeGreaterThan(blockedBefore);
    expect(hits).toEqual([]);
  } finally {
    receiver.close();
    db.deleteMany('integrations', { boardId: board.boardId });
  }
});
