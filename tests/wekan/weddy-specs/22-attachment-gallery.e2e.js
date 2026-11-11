'use strict';
// WeKan's attachmentGallery on Weddy: the "+" opens cardAttachmentsPopup, a
// file from the computer is uploaded and shown as a tile, and its tile opens
// the image in attachmentViewer, which closes again.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');

// A 1x1 PNG.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

test('a file uploaded from the gallery is a tile that opens in the viewer', async ({ boardPage: page, board }) => {
  const card = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
  try {
    await page.goto(`/b/${board.boardId}/${board.slug}/${card}`);
    const gallery = page.locator('.board-wrapper > .js-card-details .card-attachmentGallery');
    await gallery.locator('.js-add-attachment').click();
    await expect(page.locator('.js-pop-over .js-computer-upload')).toBeVisible();
    await page.locator('.js-pop-over input.js-attach-file').setInputFiles({ name: 'dot.png', mimeType: 'image/png', buffer: png });
    const tile = page.locator('.board-wrapper > .js-card-details .card-attachmentGallery .attachment-item').filter({ hasText: 'dot.png' });
    await expect(tile).toBeVisible();
    expect(db.find('attachments', { 'meta.cardId': card, name: 'dot.png' })).toHaveLength(1);

    await tile.locator('.open-preview').click();
    await expect(page.locator('#viewer-overlay')).toBeVisible();
    await expect(page.locator('#image-viewer')).toBeVisible();
    await expect(page.locator('#attachment-name')).toHaveText('dot.png');
    await page.locator('#viewer-close').click();
    await expect(page.locator('#viewer-overlay')).toBeHidden();
  } finally {
    db.deleteMany('attachments', { 'meta.cardId': card });
  }
});
