const express = require('express');
const router = express.Router();
const { sendMessage, createOmnichannelContact, createLiveChatRoom } = require('../utils/rocketChat');
const { generateRandomToken } = require('../utils/helpers');
const roomManager = require('../utils/roomManager'); // Import the room manager

let lastMessageId = null;  // Store the last processed message ID
let lastProcessedUserMessageId = null;  // Store last processed message ID from user
const botUsername = 'rocket.cat';  // Replace this with your bot's username or user ID
let lastMessageTimestamp = 0;  // Timestamp for last message sent

// Outgoing Webhook: User to Agent
router.post('/', async (req, res) => {
    const message = req.body;
    const sender_id = message.user_id || "unknown";
    const sender_username = message.user_name || "unknown";
    const message_text = message.text || "No message";
    const room_id = message.channel_id || "unknown";
    const message_id = message.message_id || "unknown";  // Add message ID
    const currentTimestamp = Date.now();

    // Check if the message was already processed
    if (message_id === lastMessageId) {
        console.log('Duplicate message received, ignoring.');
        return res.status(200).send('Duplicate message ignored.');
    }

    // Check if the sender is the bot itself or message is system message to avoid loop
    if (sender_username === botUsername || message.isSystemMessage) {
        console.log('Message sent by bot or marked as system message, ignoring to prevent loop.');
        return res.status(200).send('Bot message or system message ignored.');
    }

    // Check if the message is from a user and if it has already been processed
    if (sender_username !== botUsername && message_id === lastProcessedUserMessageId) {
        console.log('Duplicate message received from user, ignoring.');
        return res.status(200).send('Duplicate message ignored.');
    }

    // Update lastMessageId to current message and lastMessageTimestamp to current time
    lastMessageId = message_id;
    lastMessageTimestamp = currentTimestamp;

    // Update lastProcessedUserMessageId if the sender is a user
    if (sender_username !== botUsername) {
        lastProcessedUserMessageId = message_id;
    }

    if (message_text.toLowerCase() === 'hey') {
        const userToken = generateRandomToken();
        console.log(`Received message "hey" from user ${sender_username} (ID: ${sender_id})`);
        console.log(`Room ID: ${room_id}`);
        console.log(`User token: ${userToken}`);

        try {
            await createOmnichannelContact(userToken, sender_username);
            const liveChatRoomId = await createLiveChatRoom(userToken);
            roomManager.setLiveChatRoomId(liveChatRoomId); // Store live chat room ID
            roomManager.setUserRoomId(room_id);  // Store user's room ID

            const sessionMessage = `You are now in a session with a representative who will assist you.`;
            await sendMessage(room_id, sessionMessage, true);  // Set isSystemMessage to true
            
            res.status(200).send('User registered and live chat room created successfully');
        } catch (error) {
            console.error('Error processing the webhook:', error);
            res.status(500).send('Failed to process the webhook');
        }
    } else if (message_text.toLowerCase() === 'bye') {
        const liveChatRoomId = roomManager.getLiveChatRoomId();
        if (liveChatRoomId) {
            try {
                const farewellToUser = 'You have left the conversation with the representative';
                const farewellToManager = 'The user has left the conversation.';
                
                await sendMessage(room_id, farewellToUser, true);  // Set isSystemMessage to true
                await sendMessage(liveChatRoomId, farewellToManager, true);  // Set isSystemMessage to true

                roomManager.setLiveChatRoomId(null);  // Reset room IDs
                roomManager.setUserRoomId(null);
                res.status(200).send('Session ended and farewell message sent.');
            } catch (error) {
                console.error('Error sending farewell messages:', error);
                res.status(500).send('Failed to send farewell messages');
            }
        } else {
            res.status(200).send('No active session to end.');
        }
    } else {
        const liveChatRoomId = roomManager.getLiveChatRoomId();
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
