// helpers.js is a utility module that contains a function to generate a random token. This function is used in the userToAgentHandler.js route handler to generate a random token for the user's authentication. The generated token is then used to authenticate the user for further API interactions with the Rocket.Chat server.

const crypto = require('crypto');

function generateRandomToken() {
    return crypto.randomBytes(8).toString('hex');
}

module.exports = { generateRandomToken };
