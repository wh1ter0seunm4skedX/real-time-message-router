const express = require('express');
const router = express.Router();
const { sendToRocketCatWithAgent, loginAndGetAuthToken } = require('../utils/rocketChat');
const roomManager = require('../utils/roomManager');
let lastProcessedAgentMessageId = null;

router.post('/', async (req, res) => {
    console.log('--- [agentToUser] --- Omnichannel webhook from agent was triggered.');

    const { messages } = req.body;

    if (Array.isArray(messages) && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];  // Get the latest message
        const messageText = lastMessage.msg || "No message";  // Extract message text
        const senderId = (lastMessage.u && lastMessage.u._id) || "unknown";  // Get sender's ID
        const senderUsername = (lastMessage.u && lastMessage.u.username) || undefined;  // Get sender's username
        const messageId = lastMessage._id;  // Get message ID
        const isSystemMessage = lastMessage.t || false;  // Check if it's a system message

        console.log(`--- [agentToUser] --- Received message details: messageText="${messageText}", senderId="${senderId}", messageId="${messageId}", isSystemMessage="${isSystemMessage}"`);

        // Check for duplicate messages
        if (messageId === lastProcessedAgentMessageId) {
            console.log('--- [agentToUser] --- Duplicate message received from agent, ignoring.');
            return res.status(200).send('Duplicate message ignored.');
        }

        lastProcessedAgentMessageId = messageId;

        // Ignore system messages
        if (isSystemMessage) {
            console.log('--- [agentToUser] --- System message received, ignoring.');
            return res.status(200).send('System message ignored.');
        }

        // Ensure senderUsername is not undefined
        if (!senderUsername) {
            console.log('--- [agentToUser] --- Sender username is missing or undefined. Cannot forward the message.');
            return res.status(400).send('Sender username is missing. Cannot forward message to rocket.cat.');
        }

        // Check if the agent's authToken is already captured
        let agentAuthToken = roomManager.getAgentAuthToken(senderId);
        if (!agentAuthToken) {
            console.log('--- [agentToUser] --- No auth token found for agent, logging in...');
            const loginData = await loginAndGetAuthToken(senderUsername);
            agentAuthToken = loginData.authToken;
            roomManager.setAgentAuthToken(senderId, agentAuthToken);
        } else {
            console.log('--- [agentToUser] --- Auth token found for agent.');
        }

        // Forward the message to rocket.cat
        try {
            await sendToRocketCatWithAgent(messageText, senderId);
            console.log(`--- [agentToUser] --- Message forwarded to rocket.cat: "${messageText}"`);
            res.status(200).send('Message forwarded to rocket.cat.');
        } catch (error) {
            console.error('--- [agentToUser] --- Error forwarding message to rocket.cat:', error.message);
            res.status(500).send('Failed to forward message to rocket.cat.');
        }

    } else {
        console.log('--- [agentToUser] --- Invalid message or room type received.');
        res.status(200).send('Invalid message or room type.');
    }
});

module.exports = router;
