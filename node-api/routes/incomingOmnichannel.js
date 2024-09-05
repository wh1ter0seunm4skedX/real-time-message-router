const express = require('express');
const router = express.Router();
const { sendMessage } = require('../utils/rocketChat');
const roomManager = require('../utils/roomManager');

let lastProcessedAgentMessageId = null;

router.post('/', async (req, res) => {
    const { messages } = req.body;

    if (Array.isArray(messages) && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const messageText = lastMessage.msg || "No message";
        const senderId = lastMessage.u._id || "unknown";  // Get the sender ID
        const messageId = lastMessage._id;
        const isSystemMessage = lastMessage.t || false;  // Check if it's a system message

        if (messageId === lastProcessedAgentMessageId) {
            console.log('Duplicate message received from agent, ignoring.');
            return res.status(200).send('Duplicate message ignored.');
        }

        lastProcessedAgentMessageId = messageId;

        if (isSystemMessage) {  // Ignore system messages
            console.log('System message received, ignoring.');
            return res.status(200).send('System message ignored.');
        }

        // Determine if the sender is an agent or user
        if (senderId === process.env.USER_ID_AGENT) {  // Check if sender is agent
            console.log(`Message from Agent in LiveChat room: "${messageText}" (Sent by ID: ${senderId})`);

            const userRoomId = roomManager.getUserRoomId();  // Get the user's room ID
            if (userRoomId) {
                try {
                    await sendMessage(userRoomId, messageText, 'agent');  // Send message to user room
                    res.status(200).send('Message forwarded to user room.');
                } catch (error) {
                    console.error('Error forwarding message to user room:', error);
                    res.status(500).send('Failed to forward message to user room');
                }
            } else {
                console.log('No user room available for forwarding message.');
                res.status(200).send('No user room available.');
            }
        } else {
            console.log('Message received from non-agent, ignoring.');
            res.status(200).send('Non-agent message ignored.');
        }
    } else {
        console.log('Invalid message or room type received.');
        res.status(200).send('Invalid message or room type.');
    }
});

module.exports = router;
