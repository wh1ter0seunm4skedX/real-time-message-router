const axios = require('axios');
require('dotenv').config();

const ROCKET_CHAT_URL = process.env.ROCKET_CHAT_URL;

// Function to determine user type based on senderId
const determineUserType = (senderId) => {
    console.log(`Received sender ID: ${senderId}`); 
    console.log(`Configured Admin User ID: ${process.env.USER_ID_ADMIN}`);
    console.log(`Configured Agent User ID: ${process.env.USER_ID_AGENT}`);
    console.log(`Configured Regular User ID: ${process.env.USER_ID_USER}`);

    if (senderId === process.env.USER_ID_ADMIN) {
        return { userType: 'admin', token: process.env.AUTH_TOKEN_ADMIN, userId: process.env.USER_ID_ADMIN };
    } else if (senderId === process.env.USER_ID_AGENT) {
        return { userType: 'livechat_agent', token: process.env.AUTH_TOKEN_AGENT, userId: process.env.USER_ID_AGENT };
    } else if (senderId === process.env.USER_ID_USER) {
        return { userType: 'user', token: process.env.AUTH_TOKEN_USER, userId: process.env.USER_ID_USER };
    } else {
        console.error(`Error: User ID "${senderId}" does not match any known users.`);
        throw new Error('User ID does not match any known users.');
    }
};

// Function to get authentication headers based on user type
const getAuthHeaders = (senderId) => {
    try {
        const { userType, token, userId } = determineUserType(senderId);
        console.log(`User type: ${userType}, Token: ${token}, User ID: ${userId}`); // Display user details
        return {
            'X-Auth-Token': token,
            'X-User-Id': userId
        };
    } catch (error) {
        console.error('Failed to determine user type:', error.message);
        throw error;
    }
};

// Function to send a message to a channel
async function sendMessage(channel, text, senderId, isSystemMessage = false) {
    try {
        const message = isSystemMessage ? `${text} [SYSTEM]` : text;
        const headers = getAuthHeaders(senderId);

        console.log(`Sending message to channel ${channel} with senderId ${senderId}`);
        await axios.post(`${ROCKET_CHAT_URL}/api/v1/chat.postMessage`, {
            text: message,
            channel
        }, { headers });

        console.log(`Message sent to channel ${channel}: ${message}`);
    } catch (error) {
        console.error('Error sending message:', error.response ? error.response.data : error.message);
    }
}

async function createOmnichannelContact(senderId, token, name) {
    try {
        const headers = getAuthHeaders(senderId);

        console.log(`Creating Omnichannel Contact for User ID: ${senderId}, Token: ${token}, User ID: ${headers['X-User-Id']}`);

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

async function createLiveChatRoom(senderId, token) {
    try {
        const headers = getAuthHeaders(senderId);

        console.log(`Creating Live Chat Room for User ID: ${senderId}, Token: ${token}, User ID: ${headers['X-User-Id']}`);

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

async function sendIncomingWebhookMessage(text, incomingWebhookUrl) {
    try {
        await axios.post(incomingWebhookUrl, {
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
