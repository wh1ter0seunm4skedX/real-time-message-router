const crypto = require('crypto');

function generateRandomToken() {
    return crypto.randomBytes(8).toString('hex');
}

module.exports = { generateRandomToken };
