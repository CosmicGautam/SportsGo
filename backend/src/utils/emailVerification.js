const crypto = require('crypto');

function createEmailVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

function isEmailVerified(user) {
  return Boolean(user?.emailVerified);
}

module.exports = {
  createEmailVerificationToken,
  isEmailVerified,
};
