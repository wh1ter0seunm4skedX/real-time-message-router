const express = require('express');
const router = express.Router();
const { sendMessage } = require('../utils/rocketChat');
const roomManager = require('../utils/roomManager');

let lastProcessedAgentMessageId = null;

router.post('/', async (req, res) => {
    console.log('--- [incomingOmnichannel.js] --- Incoming webhook triggered.');

    const { messages } = req.body;

    if (Array.isArray(messages) && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const messageText = lastMessage.msg || "No message";
        let senderId = lastMessage.u._id || "unknown";  // Get the sender ID
        const senderUsername = lastMessage.u.username || "unknown";  // Get the sender username
        const messageId = lastMessage._id;
        const isSystemMessage = lastMessage.t || false;  // Check if it's a system message

        console.log(`--- [incomingOmnichannel.js] --- Received message details: messageText="${messageText}", senderId="${senderId}", senderUsername="${senderUsername}", messageId="${messageId}", isSystemMessage="${isSystemMessage}"`);

        if (messageId === lastProcessedAgentMessageId) {
            console.log('--- [incomingOmnichannel.js] --- Duplicate message received from agent, ignoring.');
            return res.status(200).send('Duplicate message ignored.');
        }

        lastProcessedAgentMessageId = messageId;

        if (isSystemMessage) {  // Ignore system messages
            console.log('--- [incomingOmnichannel.js] --- System message received, ignoring.');
            return res.status(200).send('System message ignored.');
        }

        // Check if sender is agent by username and adjust senderId accordingly
        if (senderUsername === 'agent') {  // If the sender's username is 'agent'
            console.log('--- [incomingOmnichannel.js] --- Sender identified as agent by username. Adjusting senderId to USER_ID_AGENT from .env');
            senderId = process.env.USER_ID_AGENT;  // Use USER_ID_AGENT from .env
        }

        // Determine if the sender is an agent or user
        if (senderId === process.env.USER_ID_AGENT) {  // Check if sender is agent
            console.log(`--- [incomingOmnichannel.js] --- Message from Agent in LiveChat room: "${messageText}" (Sent by ID: ${senderId})`);

            const userRoomId = roomManager.getUserRoomId();  // Get the user's room ID
            console.log(`--- [incomingOmnichannel.js] --- User room ID for forwarding message: ${userRoomId}`);

            if (userRoomId) {
                try {
                    console.log(`--- [incomingOmnichannel.js] --- Forwarding message to user room. Message: "${messageText}"`);
                    await sendMessage(userRoomId, messageText, senderId);  // Send message to user room
                    console.log('--- [incomingOmnichannel.js] --- Message successfully forwarded to user room.');
                    res.status(200).send('Message forwarded to user room.');
                } catch (error) {
                    console.error('--- [incomingOmnichannel.js] --- Error forwarding message to user room:', error);
                    res.status(500).send('Failed to forward message to user room');
                }
            } else {
                console.log('--- [incomingOmnichannel.js] --- No user room available for forwarding message.');
                res.status(200).send('No user room available.');
            }
        } else {
            console.log(`--- [incomingOmnichannel.js] --- Message received from non-agent (sender ID: ${senderId}), ignoring.`);
            res.status(200).send('Non-agent message ignored.');
        }
    } else {
        console.log('--- [incomingOmnichannel.js] --- Invalid message or room type received.');
        res.status(200).send('Invalid message or room type.');
    }
});

module.exports = router;
