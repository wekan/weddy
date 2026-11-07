// @ts-check
// WeKan's Playwright configuration, for Weddy: the same browsers, timeouts and
// global setup, over Weddy's own specs (weddy-specs/) and the WeKan specs that
// wekan-specs.txt names - the ones Weddy's WeKan has the pages for so far.
// WEDDY_WEKAN_SPECS=all runs every WeKan spec instead, to see how far it is.
const fs = require('fs');
const path = require('path');
const base = require('./tests/playwright/playwright.config.js');

const listed = process.env.WEDDY_WEKAN_SPECS === 'all'
  ? ['tests/playwright/specs/**/*.e2e.js']
  : fs.readFileSync(path.join(__dirname, 'wekan-specs.txt'), 'utf8').split('\n')
    .map(l => l.replace(/#.*/, '').trim()).filter(Boolean)
    .map(name => `tests/playwright/specs/${name}`);

module.exports = {
  ...base,
  globalSetup: path.join(__dirname, 'tests/playwright/global-setup.js'),
  testDir: __dirname,
  testMatch: ['weddy-specs/**/*.e2e.js', ...listed],
  outputDir: process.env.WEDDY_TEST_RESULTS || path.join(__dirname, 'test-results'),
  reporter: [['list'], ['html', { outputFolder: process.env.WEDDY_TEST_REPORT || path.join(__dirname, 'playwright-report'), open: 'never' }]],
};
