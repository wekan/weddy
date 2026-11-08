'use strict';
// Sign-in, All Boards and logging out, on a user and board seeded by WeKan's own
// helpers: Weddy's WeKan reads WeKan's documents as they are.
const { test, expect } = require('../tests/playwright/fixtures');
const { loginWithCredentials, logout } = require('../tests/playwright/helpers/auth');
const { setPassword } = require('./helpers.cjs');

test('the sign-in form signs a WeKan user in, and All Boards lists their board', async ({ page, user, board }) => {
  await setPassword(user.id, 'Weddy-pw-1');
  await loginWithCredentials(page, user.username, 'Weddy-pw-1');
  await expect(page.locator('.board-list-item-name', { hasText: `E2E Board ${board.boardId}` })).toBeVisible();
  await logout(page);
  await page.goto('/');
  await expect(page).toHaveURL(/\/sign-in$/);
});

test('an e-mail address signs in too', async ({ page, user }) => {
  await setPassword(user.id, 'Weddy-pw-2');
  await loginWithCredentials(page, user.email, 'Weddy-pw-2');
  await expect(page.locator('.board-list-title')).toBeVisible();
});

test('negative: a wrong password shows the error and stays on sign-in', async ({ page, user }) => {
  await setPassword(user.id, 'Weddy-pw-3');
  await page.goto('/sign-in');
  await page.locator('#at-field-username_and_email').fill(user.username);
  await page.locator('#at-field-password').fill('not-it');
  await page.locator('#at-btn').click();
  await expect(page.locator('.js-login-error')).toBeVisible();
  await expect(page).toHaveURL(/\/sign-in$/);
});

test('a board is created from All Boards', async ({ loggedInPage: page }) => {
  await page.locator('.js-new-board-title').fill('Weddy board');
  await page.locator('.js-add-board-form button[type=submit]').click();
  await expect(page.locator('.header-board-name')).toHaveText('Weddy board');
  await expect(page.locator('.js-swimlane')).toHaveCount(1);
});

test('negative: another user does not see the board, in the list or by its address', async ({ page, user2, board }) => {
  const { loginWithToken, } = require('../tests/playwright/helpers/auth');
  await loginWithToken(page, user2.id, user2.token);
  await expect(page.locator('.board-list-item-name', { hasText: board.boardId })).toHaveCount(0);
  const res = await page.goto(`/b/${board.boardId}/${board.slug}`);
  expect(res.status()).toBe(404);
  await expect(page.locator('.js-board-not-found')).toBeVisible();
});
