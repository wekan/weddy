'use strict';

// Weddy's helpers/auth.js: the same functions as WeKan's, for Weddy's WeKan, which
// is Go - pages from the server, Unpoly in the browser, no Meteor. A login is the
// same Meteor login token, kept in the same HttpOnly meteor_login_token cookie, so
// logging a page in is setting that cookie: what WeKan's helper reaches through
// Meteor.loginWithToken, Weddy's server reads directly.
//
// tests/wekan/sync-from-wekan.py lays this over WeKan's copy.

const BASE_URL = process.env.WEKAN_BASE_URL || 'http://localhost:3000';

async function loginWithToken(page, userId, token) {
  await page.context().clearCookies({ name: 'meteor_login_token' });
  await page.context().addCookies([{
    name: 'meteor_login_token',
    value: token,
    url: BASE_URL,
    httpOnly: true,
    sameSite: 'Lax',
  }]);
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
  if (new URL(page.url()).pathname.startsWith('/sign-in')) {
    throw new Error(`Token login failed for ${userId}: still on the sign-in page`);
  }
}

/** Login using the actual username/password form (tests the login UI). */
async function loginWithCredentials(page, username, password) {
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded' });
  await page.locator('#at-field-username_and_email').fill(username);
  await page.locator('#at-field-password').fill(password);
  await page.locator('#at-btn').click();
  await page.waitForURL(url => !url.pathname.includes('/sign-in'), { timeout: 20_000 });
}

async function logout(page) {
  await page.locator('.js-logout-button').click();
  await page.waitForURL(url => url.pathname.includes('/sign-in'), { timeout: 10_000 });
}

// No Meteor here: the page is ready when Unpoly is.
async function waitForMeteor(page) {
  await page.waitForFunction(() => typeof window.up !== 'undefined', undefined, { timeout: 30_000 });
}

/** Navigate to a board and wait for it to render lists. */
async function openBoard(page, boardId, slug) {
  await page.goto(`${BASE_URL}/b/${boardId}/${slug}`, { waitUntil: 'domcontentloaded' });
  await page.locator('.js-list:not(.js-list-composer)').first().waitFor({ timeout: 20_000 });
}

/** Navigate within the app: a full page load is what Weddy's pages are. */
async function navigateInApp(page, path) {
  await page.goto(new URL(path, BASE_URL).toString(), { waitUntil: 'domcontentloaded' });
}

module.exports = {
  loginWithToken,
  loginWithCredentials,
  logout,
  waitForMeteor,
  openBoard,
  navigateInApp,
};
