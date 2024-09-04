const axios = require('axios');

const ROCKET_CHAT_URL = process.env.ROCKET_CHAT_URL;
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const USER_ID = process.env.USER_ID;
const INCOMING_WEBHOOK_URL = process.env.INCOMING_WEBHOOK_URL;  

const headers = {
    'X-Auth-Token': AUTH_TOKEN,
    'X-User-Id': USER_ID
};

// Function to send a message to a channel
async function sendMessage(channel, text, isSystemMessage = false) {
    try {
        // Append a unique identifier for system messages
        const message = isSystemMessage ? `${text} [SYSTEM]` : text;
        
        await axios.post(`${ROCKET_CHAT_URL}/api/v1/chat.postMessage`, {
            text: message,
            channel
        }, { headers });
        
        console.log(`Message sent to channel ${channel}: ${message}`);
    } catch (error) {
        console.error('Error sending message:', error.response ? error.response.data : error.message);
    }
}

async function createOmnichannelContact(token, name) {
    try {
        const response = await axios.post(`${ROCKET_CHAT_URL}/api/v1/omnichannel/contact`, {
            token,
            name
        }, { headers });
        return response.data;
    } catch (error) {
        console.error('Error creating omnichannel contact:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function createLiveChatRoom(token) {
    try {
        const response = await axios.get(`${ROCKET_CHAT_URL}/api/v1/livechat/room`, {
            params: { token },
            headers
        });
        console.log('Live chat room created:', response.data);
        return response.data.room._id;
    } catch (error) {
        console.error('Error creating live chat room:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function sendIncomingWebhookMessage(text) {
    try {
        await axios.post(INCOMING_WEBHOOK_URL, {
            text: text
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log(`Message sent via Incoming Webhook: ${text}`);
    } catch (error) {
        console.error('Error sending message via Incoming Webhook:', error.response ? error.response.data : error.message);
    }
}

module.exports = { sendMessage, createOmnichannelContact, createLiveChatRoom, sendIncomingWebhookMessage };
