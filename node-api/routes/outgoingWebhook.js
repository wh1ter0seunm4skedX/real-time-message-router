const express = require('express');
const router = express.Router();
const { sendMessage, createOmnichannelContact, createLiveChatRoom } = require('../utils/rocketChat');
const { generateRandomToken } = require('../utils/helpers');
const roomManager = require('../utils/roomManager');

let lastMessageId = null;
let lastProcessedUserMessageId = null;
const botUsername = 'rocket.cat';
let lastMessageTimestamp = 0;

router.post('/', async (req, res) => {
    console.log('--- [outgoingWebhook.js] --- Outgoing webhook triggered.');

    const message = req.body;
    const sender_id = message.user_id || "unknown";
    const sender_username = message.user_name || "unknown";
    const message_text = message.text || "No message";
    const room_id = message.channel_id || "unknown";
    const message_id = message.message_id || "unknown";
    const currentTimestamp = Date.now();

    console.log(`--- [outgoingWebhook.js] --- Received message details: sender_id="${sender_id}", sender_username="${sender_username}", message_text="${message_text}", room_id="${room_id}", message_id="${message_id}"`);

    if (message_id === lastMessageId) {
        console.log('--- [outgoingWebhook.js] --- Duplicate message received, ignoring.');
        return res.status(200).send('Duplicate message ignored.');
    }

    if (sender_username === botUsername || message.isSystemMessage) {
        console.log('--- [outgoingWebhook.js] --- Message sent by bot or marked as system message, ignoring to prevent loop.');
        return res.status(200).send('Bot message or system message ignored.');
    }

    if (sender_username !== botUsername && message_id === lastProcessedUserMessageId) {
        console.log('--- [outgoingWebhook.js] --- Duplicate message received from user, ignoring.');
        return res.status(200).send('Duplicate message ignored.');
    }

    lastMessageId = message_id;
    lastMessageTimestamp = currentTimestamp;

    if (sender_username !== botUsername) {
        lastProcessedUserMessageId = message_id;
    }

    // Check if message is from user and manage sessions accordingly
    if (sender_id === process.env.USER_ID_USER) {  // If the sender is a user
        console.log(`--- [outgoingWebhook.js] --- Received message "hey" from user ${sender_username} (ID: ${sender_id})`);
        const liveChatRoomId = roomManager.getLiveChatRoomId();

        if (!liveChatRoomId) {  // Only create a new room if there isn't already one active
            const userToken = generateRandomToken();
            console.log(`--- [outgoingWebhook.js] --- Room ID: ${room_id}`);
            console.log(`--- [outgoingWebhook.js] --- User token: ${userToken}`);

            try {
                await createOmnichannelContact(sender_id, userToken, sender_username);
                const newLiveChatRoomId = await createLiveChatRoom(sender_id, userToken);
                roomManager.setLiveChatRoomId(newLiveChatRoomId);
                roomManager.setUserRoomId(room_id);

                const sessionMessage = `You are now in a session with a representative who will assist you.`;
                await sendMessage(room_id, sessionMessage, sender_id, true);

                console.log('--- [outgoingWebhook.js] --- User registered and live chat room created successfully.');
                res.status(200).send('User registered and live chat room created successfully');
            } catch (error) {
                console.error('--- [outgoingWebhook.js] --- Error processing the webhook:', error);
                res.status(500).send('Failed to process the webhook');
            }
        } else {
            console.log('--- [outgoingWebhook.js] --- Live chat room already exists. Forwarding message to the existing room.');
            try {
                await sendMessage(liveChatRoomId, message_text, sender_id);
                console.log('--- [outgoingWebhook.js] --- Message forwarded to live chat room.');
                res.status(200).send('Message forwarded to live chat room.');
            } catch (error) {
                console.error('--- [outgoingWebhook.js] --- Error forwarding message to live chat room:', error);
                res.status(500).send('Failed to forward message to live chat room');
            }
        }
    } else if (sender_id === process.env.USER_ID_AGENT) {  // If the sender is an agent
        const liveChatRoomId = roomManager.getLiveChatRoomId();
        console.log(`--- [outgoingWebhook.js] --- Message from agent. LiveChat Room ID: ${liveChatRoomId}`);

        if (liveChatRoomId) {
            try {
                const farewellToUser = 'You have left the conversation with the representative';
                const farewellToManager = 'The user has left the conversation.';

                console.log(`--- [outgoingWebhook.js] --- Sending farewell messages. Room ID: ${room_id}`);
                await sendMessage(room_id, farewellToUser, sender_id, true);
                await sendMessage(liveChatRoomId, farewellToManager, sender_id, true);

                roomManager.setLiveChatRoomId(null);
                roomManager.setUserRoomId(null);
                console.log('--- [outgoingWebhook.js] --- Session ended and farewell message sent.');
                res.status(200).send('Session ended and farewell message sent.');
            } catch (error) {
                console.error('--- [outgoingWebhook.js] --- Error sending farewell messages:', error);
                res.status(500).send('Failed to send farewell messages');
            }
        } else {
            console.log('--- [outgoingWebhook.js] --- No active session to end.');
            res.status(200).send('No active session to end.');
        }
    } else {
        const liveChatRoomId = roomManager.getLiveChatRoomId();
        console.log(`--- [outgoingWebhook.js] --- Message from unknown sender ID. Checking for active session. LiveChat Room ID: ${liveChatRoomId}`);

        if (liveChatRoomId) {
            try {
                await sendMessage(liveChatRoomId, message_text, sender_id);
                console.log('--- [outgoingWebhook.js] --- Message forwarded to live chat room.');
                res.status(200).send('Message forwarded to live chat room.');
            } catch (error) {
                console.error('--- [outgoingWebhook.js] --- Error forwarding message to live chat room:', error);
                res.status(500).send('Failed to forward message to live chat room');
            }
        } else {
            console.log('--- [outgoingWebhook.js] --- No active session. Message not forwarded.');
            res.status(200).send('No active session. Message not forwarded.');
        }
    }
});

module.exports = router;
