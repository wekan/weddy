// @ts-check
// WeKan's Playwright configuration, for Weddy: the same browsers, timeouts and
// global setup, over Weddy's own specs (weddy-specs/) and the WeKan specs that
// wekan-specs.txt names - the ones Weddy's WeKan has the pages for so far.
// WEDDY_WEKAN_SPECS=all runs every WeKan spec instead, to see how far it is.
const fs = require('fs');
const path = require('path');
const base = require('./tests/playwright/playwright.config.js');

// A line of wekan-specs.txt is a spec file - all of it - or "file: test title",
// one test of it.
const lines = fs.readFileSync(path.join(__dirname, 'wekan-specs.txt'), 'utf8').split('\n')
  .map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  .map(l => { const i = l.indexOf(': '); return i < 0 ? { file: l } : { file: l.slice(0, i), title: l.slice(i + 2) }; })
  // Playwright greps the title path joined with spaces, so a line written as
  // "Describe › test", the way the reporters print it, matches as well.
  .map(l => (l.title ? { ...l, title: l.title.split(' › ').join(' ') } : l));
const all = process.env.WEDDY_WEKAN_SPECS === 'all';
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const listed = all ? ['tests/playwright/specs/**/*.e2e.js'] : [...new Set(lines.map(l => `tests/playwright/specs/${l.file}`))];
// Playwright matches grep against the file path and the titles of a test.
const grep = all ? undefined : new RegExp([
  'weddy-specs[\\\\/]',
  ...lines.map(l => escape(l.file) + (l.title ? '.*' + escape(l.title) : '')),
].join('|'));

module.exports = {
  ...base,
  globalSetup: path.join(__dirname, 'tests/playwright/global-setup.js'),
  testDir: __dirname,
  testMatch: ['weddy-specs/**/*.e2e.js', ...listed],
  ...(grep ? { grep } : {}),
  outputDir: process.env.WEDDY_TEST_RESULTS || path.join(__dirname, 'test-results'),
  reporter: [['list'], ['html', { outputFolder: process.env.WEDDY_TEST_REPORT || path.join(__dirname, 'playwright-report'), open: 'never' }]],
};
