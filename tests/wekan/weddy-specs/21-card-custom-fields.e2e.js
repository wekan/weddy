'use strict';
// WeKan's card custom fields on Weddy: a field created from the section's
// picker (createCustomFieldPopup), put on the card from it, and a text and a
// dropdown value saved through their cardCustomField-* editors.
const { test, expect } = require('../tests/playwright/fixtures');
const db = require('../tests/playwright/helpers/db');

test('a custom field is created from the card, put on it, and its text and dropdown values saved', async ({ boardPage: page, board }) => {
  const card = db.findCardIdByTitle({ boardId: board.boardId, title: 'Alpha Card' });
  const drop = db.uid('cf');
  db.insertOne('customFields', { _id: drop, boardIds: [board.boardId], name: 'E2E Size', type: 'dropdown', showOnCard: true,
    settings: { dropdownItems: [{ _id: 'small', name: 'Small' }, { _id: 'large', name: 'Large' }] } });
  db.updateOne('cards', { _id: card }, { $push: { customFields: { _id: drop, value: null } } });
  await page.goto(`/b/${board.boardId}/${board.slug}/${card}`);
  const details = page.locator('.board-wrapper > .js-card-details');

  // Create a text field from the picker, then put it on the card.
  await details.locator('.js-open-custom-fields-settings').click();
  await page.locator('.js-pop-over .js-open-create-custom-field').click();
  await page.locator('.js-pop-over .js-field-name').fill('E2E Notes');
  await page.locator('.js-pop-over .js-field-type').selectOption('text');
  await page.locator('.js-pop-over button[type="submit"]').click();
  await expect.poll(() => db.find('customFields', { boardIds: board.boardId, name: 'E2E Notes' }).length).toBe(1);
  await details.locator('.js-open-custom-fields-settings').click();
  await page.locator('.js-pop-over li.item').filter({ hasText: 'E2E Notes' }).locator('.js-select-field').click();
  const notes = details.locator('.card-details-item-customfield').filter({ hasText: 'E2E Notes' });
  await expect(notes).toBeVisible();

  // Its text, through the editor its title opens.
  await notes.locator('.card-details-item-title.js-edit-card-custom-field-value').click();
  await notes.locator('.js-card-customfield-text textarea').fill('Measured twice');
  await notes.locator('.js-card-customfield-text button[type="submit"]').click();
  await expect(notes.locator('.viewer')).toHaveText('Measured twice');
  const notesId = db.findOne('customFields', { name: 'E2E Notes', boardIds: board.boardId })._id;
  expect(db.getCard(card).customFields.find(f => f._id === notesId).value).toBe('Measured twice');

  // The dropdown's choice.
  const size = details.locator('.card-details-item-customfield').filter({ hasText: 'E2E Size' });
  await size.locator('a.js-edit-card-custom-field-value').click();
  await size.locator('.js-card-customfield-dropdown select').selectOption('large');
  await size.locator('.js-card-customfield-dropdown button[type="submit"]').click();
  await expect(size).toContainText('Large');
  expect(db.getCard(card).customFields.find(f => f._id === drop).value).toBe('large');
});
