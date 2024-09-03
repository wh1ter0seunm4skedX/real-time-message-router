const axios = require('axios');

const ROCKET_CHAT_URL = process.env.ROCKET_CHAT_URL;
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const USER_ID = process.env.USER_ID;

console.log('Rocket Chat URL:', ROCKET_CHAT_URL);  // Add this line to debug

const headers = {
    'X-Auth-Token': AUTH_TOKEN,
    'X-User-Id': USER_ID
};

async function sendMessage(channel, text) {
    await axios.post(`${ROCKET_CHAT_URL}/api/v1/chat.postMessage`, {
        text,
        channel
    }, { headers });
}

async function createOmnichannelContact(token, name) {
    const response = await axios.post(`${ROCKET_CHAT_URL}/api/v1/omnichannel/contact`, {
        token,
        name
    }, { headers });
    return response.data;
}

async function createLiveChatRoom(token) {
    const response = await axios.get(`${ROCKET_CHAT_URL}/api/v1/livechat/room`, {
        params: { token },
        headers
    });
    return response.data.room._id;
}

module.exports = { sendMessage, createOmnichannelContact, createLiveChatRoom };
