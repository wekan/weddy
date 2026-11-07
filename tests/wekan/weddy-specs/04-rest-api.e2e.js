'use strict';
// WeKan's REST API at WeKan's addresses, with a token WeKan's own helper seeded.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');
const { setPassword } = require('./helpers.cjs');

const auth = token => ({ Authorization: `Bearer ${token}` });

test('POST /users/login answers id, token and tokenExpires', async ({ request, user }) => {
  setPassword(user.id, 'Api-pw-1');
  const res = await request.post('/users/login', { data: { username: user.username, password: 'Api-pw-1' } });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.id).toBe(user.id);
  expect(body.token).toBeTruthy();
  expect(new Date(body.tokenExpires).getTime()).toBeGreaterThan(Date.now());
  const me = await request.get('/api/user', { headers: auth(body.token) });
  expect((await me.json()).username).toBe(user.username);
});

test('boards, lists and cards of a seeded board', async ({ request, user, board }) => {
  const boards = await (await request.get(`/api/users/${user.id}/boards`, { headers: auth(user.token) })).json();
  expect(boards.map(b => b._id)).toContain(board.boardId);
  const lists = await (await request.get(`/api/boards/${board.boardId}/lists`, { headers: auth(user.token) })).json();
  expect(lists.map(l => l.title)).toEqual(['List A', 'List B', 'List C']);
  const cards = await (await request.get(`/api/boards/${board.boardId}/lists/${board.listIds[0]}/cards`, { headers: auth(user.token) })).json();
  expect(cards.map(c => c.title)).toEqual(['Alpha Card']);
});

test('a card is created, edited and deleted', async ({ request, user, board }) => {
  const base = `/api/boards/${board.boardId}/lists/${board.listIds[0]}/cards`;
  const created = await (await request.post(base, { headers: auth(user.token), data: { title: 'API card', swimlaneId: board.swimlaneId, authorId: 'spoof' } })).json();
  expect(db.findOne('cards', { _id: created._id }).userId).toBe(user.id);
  expect((await request.put(`${base}/${created._id}`, { headers: auth(user.token), data: { title: 'API card 2' } })).status()).toBe(200);
  expect(db.findOne('cards', { _id: created._id }).title).toBe('API card 2');
  expect((await request.delete(`${base}/${created._id}`, { headers: auth(user.token) })).status()).toBe(200);
  expect(db.findOne('cards', { _id: created._id })).toBeNull();
});

test('negative: no token, a made-up token, another user', async ({ request, user2, board }) => {
  expect((await request.get(`/api/boards/${board.boardId}`)).status()).toBe(401);
  expect((await request.get(`/api/boards/${board.boardId}`, { headers: auth('made-up') })).status()).toBe(401);
  expect((await request.get(`/api/boards/${board.boardId}`, { headers: auth(user2.token) })).status()).toBe(403);
  const res = await request.post(`/api/boards/${board.boardId}/lists/${board.listIds[0]}/cards`,
    { headers: auth(user2.token), data: { title: 'x', swimlaneId: board.swimlaneId } });
  expect(res.status()).toBe(403);
});
