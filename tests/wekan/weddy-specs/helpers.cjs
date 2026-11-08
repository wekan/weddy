'use strict';
// What Weddy's specs add to WeKan's helpers: a password for a seeded user, set the
// way Meteor's accounts-password stores it - bcrypt of the SHA-256 hex digest, with
// Meteor's cost of 10, so a test user's hash is like a real one.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../tests/playwright/helpers/db');

function setPassword(userId, password) {
  const digest = crypto.createHash('sha256').update(password).digest('hex');
  db.updateOne('users', { _id: userId }, { $set: { 'services.password.bcrypt': bcrypt.hashSync(digest, 10) } });
}

module.exports = { setPassword };
