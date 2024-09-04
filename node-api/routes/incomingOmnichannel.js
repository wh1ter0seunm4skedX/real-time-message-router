const express = require('express');
const router = express.Router();
const { sendMessage } = require('../utils/rocketChat');

// Import userRoomId and liveChatRoomId from the outgoingWebhook module
const outgoingWebhook = require('./outgoingWebhook');
let userRoomId = outgoingWebhook.userRoomId; // Get the user's room ID from outgoingWebhook

// Incoming Webhook for Omnichannel: Manage messages from agent to user
router.post('/', async (req, res) => {
    const { messages } = req.body;  // Extract the messages array from the request

    // Check if messages array exists and is not empty
    if (Array.isArray(messages) && messages.length > 0) {
        // Get the last message from the messages array
        const lastMessage = messages[messages.length - 1];
        const messageText = lastMessage.msg || "No message";
        const senderId = lastMessage.u._id || "unknown";
        const senderUsername = lastMessage.u.username || "unknown";

        // Print the message to console
        console.log(`Message from Agent in LiveChat room: "${messageText}" (Sent by: ${senderUsername} - ID: ${senderId})`);

        if (userRoomId) {  // Use the userRoomId stored globally
            try {
                // Forward the message back to the user's room
                await sendMessage(userRoomId, messageText);
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
        console.log('Invalid message or room type received.');
        res.status(200).send('Invalid message or room type.');
    }
});

module.exports = router;
