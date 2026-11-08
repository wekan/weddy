'use strict';
// What Weddy's specs add to WeKan's helpers: a password for a seeded user, stored
// the way Meteor's accounts-password stores it - bcrypt, Meteor's cost of 10, of
// Meteor's pre-hash of the password.
const bcrypt = require('bcryptjs');
const db = require('../tests/playwright/helpers/db');

// meteorPreHash is accounts-password's client-side step: the SHA-256 hex digest
// that bcrypt is then given. It is not how a password is stored - bcrypt below is -
// and it is never stored or logged on its own. Computed with Web Crypto, as WeKan's
// breach-check digest is (WeKan's CodeQL #599), so there is one implementation of
// the step for the browser and Node.js (Weddy's code scanning alert #2).
async function meteorPreHash(text, subtle = globalThis.crypto && globalThis.crypto.subtle) {
  if (!subtle) throw new Error('Web Crypto is not available');
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(String(text)));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function setPassword(userId, password) {
  const stored = bcrypt.hashSync(await meteorPreHash(password), 10);
  db.updateOne('users', { _id: userId }, { $set: { 'services.password.bcrypt': stored } });
}

module.exports = { setPassword, meteorPreHash };
