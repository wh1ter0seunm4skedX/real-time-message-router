const express = require('express');
const router = express.Router();
const { sendMessage, createOmnichannelContact, createLiveChatRoom } = require('../utils/rocketChat');
const { generateRandomToken } = require('../utils/helpers');

let liveChatRoomId = null; // Store globally for now

router.post('/', async (req, res) => {
    const message = req.body;
    const sender_id = message.user_id || "unknown";
    const sender_username = message.user_name || "unknown";
    const message_text = message.text || "No message";
    const room_id = message.channel_id || "unknown";

    if (message_text.toLowerCase() === 'hey') {
        const userToken = generateRandomToken();
        console.log(`Received message "hey" from user ${sender_username} (ID: ${sender_id})`);
        console.log(`Room ID: ${room_id}`);
        console.log(`User token: ${userToken}`);

        try {
            await createOmnichannelContact(userToken, sender_username);
            liveChatRoomId = await createLiveChatRoom(userToken);
            
            const sessionMessage = `You are now in a session with a representative who will assist you.`;
            await sendMessage(room_id, sessionMessage);
            
            res.status(200).send('User registered and live chat room created successfully');
        } catch (error) {
            console.error('Error processing the webhook:', error);
            res.status(500).send('Failed to process the webhook');
        }
    } else if (message_text.toLowerCase() === 'bye') {
        if (liveChatRoomId) {
            try {
                const farewellToUser = 'You have left the conversation with the representative';
                const farewellToManager = 'The user has left the conversation.';
                
                await sendMessage(room_id, farewellToUser);
                await sendMessage(liveChatRoomId, farewellToManager);

                liveChatRoomId = null;
                res.status(200).send('Session ended and farewell message sent.');
            } catch (error) {
                console.error('Error sending farewell messages:', error);
                res.status(500).send('Failed to send farewell messages');
            }
        } else {
            res.status(200).send('No active session to end.');
        }
    } else {
        if (liveChatRoomId) {
            try {
                await sendMessage(liveChatRoomId, message_text);
                res.status(200).send('Message forwarded to live chat room.');
            } catch (error) {
                console.error('Error forwarding message to live chat room:', error);
                res.status(500).send('Failed to forward message to live chat room');
            }
        } else {
            res.status(200).send('No active session. Message not forwarded.');
        }
    }
});

module.exports = router;
