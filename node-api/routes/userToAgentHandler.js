const express = require('express');
const router = express.Router();
const { sendMessage, createOmnichannelContact, createLiveChatRoom, loginAndGetAuthToken, getUserRole } = require('../utils/rocketChat');
const { generateRandomToken } = require('../utils/helpers');
const roomManager = require('../utils/roomManager');

let lastMessageId = null;
let lastProcessedUserMessageId = null;
const botUsername = 'rocket.cat';

router.post('/', async (req, res) => {
    console.log('--- [userToAgent] --- Outgoing webhook from user was triggered.');

    const message = req.body;
    const sender_id = message.user_id || "unknown";
    const sender_username = message.user_name || "unknown";
    const message_text = message.text || "No message";
    const room_id = message.channel_id || "unknown";
    const message_id = message.message_id || "unknown";
    const isSystemMessage = message.isSystemMessage || false;

    console.log(`--- [userToAgent] --- Received message details: sender_id="${sender_id}", sender_username="${sender_username}", message_text="${message_text}", room_id="${room_id}", message_id="${message_id}"`);

    // Prevent loop by skipping messages from the bot itself
    if (sender_username === botUsername) {
        console.log(`--- [userToAgent] --- Loop prevention: Message from ${botUsername} detected. Skipping processing to prevent a message loop.`);
        return res.status(200).send('Loop prevention: Message from bot ignored.');
    }

    // Ignore messages marked as system messages
    if (isSystemMessage) {
        console.log('--- [userToAgent] --- Message marked as system message, ignoring.');
        return res.status(200).send('System message ignored.');
    }

    // Step 1: Check user role before proceeding
    try {
        const roles = await getUserRole(sender_id);
        if (!roles.includes('user') || roles.length > 1) {
            console.log(`--- [userToAgent] --- User ${sender_username} does not have the "user" role. Access denied.`);
            return res.status(403).send('Access denied. Only users with role "user" can proceed.');
        }
    } catch (error) {
        console.error(`--- [userToAgent] --- Error retrieving user roles:`, error.message);
        return res.status(500).send('Error verifying user role.');
    }

    // Avoid processing duplicate messages by comparing lastProcessedUserMessageId
    if (message_id === lastProcessedUserMessageId) {
        console.log('--- [userToAgent] --- Duplicate message received from user, ignoring.');
        return res.status(200).send('Duplicate message ignored.');
    }

    lastMessageId = message_id;
    lastProcessedUserMessageId = message_id;

    if (roomManager.isTimerRunning(sender_id)) {
        console.log('--- [userToAgent] --- Inactivity timer is running. Resetting timer.');
        roomManager.stopInactivityTimer(sender_id);
    }

    // Capture the latest message and update in the room manager
    roomManager.setLastMessage(sender_id, message_text);
    console.log(`--- [userToAgent] --- Stored latest message: "${message_text}" at ${roomManager.getLastMessageTime(sender_id)}`);

    try {
        // Check if userAuthToken exists for the user
        let authToken = roomManager.getUserAuthToken(sender_id);
        let userId;

        if (!authToken) {
            console.log('--- [userToAgent] --- No auth token found for user, logging in...');
            const loginData = await loginAndGetAuthToken(sender_id);
            authToken = loginData.authToken;
            userId = loginData.userId;
            roomManager.setUserAuthToken(sender_id, authToken);
        } else {
            console.log('--- [userToAgent] --- Auth token found for user.');
            userId = sender_id;  // Use stored userId if authToken exists
        }

        // Capture visitor token for creating the omnichannel contact
        let visitorToken = roomManager.getUserVisitorToken(sender_id);
        if (!visitorToken) {
            visitorToken = generateRandomToken();  // Generate new visitor token
            roomManager.setUserVisitorToken(sender_id, visitorToken);
        }
        console.log(`--- [userToAgent] --- Captured visitor token: ${visitorToken}`);

        // Check if a live chat room already exists
        let liveChatRoomId = roomManager.getLiveChatRoomId(sender_id);
        if (!liveChatRoomId) {
            console.log(`--- [userToAgent] --- No LiveChat room found for user, creating new Omnichannel contact and room.`);

            try {
                // Create Omnichannel Contact using userToken and the correct auth headers
                await createOmnichannelContact(authToken, userId, visitorToken, sender_username);

                // Create a Live Chat Room
                liveChatRoomId = await createLiveChatRoom(authToken, userId, visitorToken);
                roomManager.setLiveChatRoomId(sender_id, liveChatRoomId);
                roomManager.setUserRoomId(sender_id, room_id);

                console.log(`--- [userToAgent] --- Live chat room created successfully with ID: ${liveChatRoomId}`);
            } catch (error) {
                console.error('--- [userToAgent] --- Error creating Omnichannel contact or live chat room:', error.message);
                return res.status(500).send('Failed to create Omnichannel contact or live chat room.');
            }
        }

        // Now that we have a live chat room, send the user's message to the agent in the live chat room
        try {
            await sendMessage(liveChatRoomId, message_text, authToken, userId);
            console.log(`--- [userToAgent] --- Message sent to LiveChat room ID: ${liveChatRoomId}`);

            // Update last message and time in the room manager
            roomManager.setLastMessage(sender_id, message_text);
            console.log(`--- [userToAgent] --- Last message updated for room. Latest message: "${roomManager.getLastMessage(sender_id)}" at ${roomManager.getLastMessageTime(sender_id)}`);

            res.status(200).send('Message sent successfully to LiveChat room.');
        } catch (error) {
            console.error('--- [userToAgent] --- Error sending message to LiveChat room:', error.message);
            return res.status(500).send('Failed to send message to LiveChat room.');
        }
    } catch (error) {
        console.error('--- [userToAgent] --- Error capturing details:', error.message);
        res.status(500).send('Error capturing details.');
    }
});

module.exports = router;
