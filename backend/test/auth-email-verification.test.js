const test = require('node:test');
const assert = require('node:assert/strict');
const { createEmailVerificationToken, isEmailVerified } = require('../src/utils/emailVerification');

test('creates a verification token and marks unverified users as pending', () => {
  const token = createEmailVerificationToken();

  assert.match(token, /^[a-f0-9]{64}$/);
  assert.equal(isEmailVerified({ emailVerified: false }), false);
  assert.equal(isEmailVerified({ emailVerified: true }), true);
});
