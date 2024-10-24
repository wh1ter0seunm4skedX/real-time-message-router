const express = require('express');
const router = express.Router();
const { loginAndGetAuthToken } = require('../utils/rocketChat');
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

    if (message_id === lastMessageId) {
        console.log('--- [userToAgent] --- Duplicate message received, ignoring.');
        return res.status(200).send('Duplicate message ignored.');
    }

    if (sender_username === botUsername || isSystemMessage) {
        console.log('--- [userToAgent] --- Message sent by bot or marked as system message, ignoring to prevent loop.');
        return res.status(200).send('Bot message or system message ignored.');
    }

    lastMessageId = message_id;
    lastProcessedUserMessageId = message_id;

    if (roomManager.isTimerRunning(sender_id)) {
        console.log('--- [userToAgent] --- Inactivity timer is running. Resetting timer.');
        roomManager.stopInactivityTimer(sender_id);
    }

    // Capturing the necessary details and logging them
    try {
        // Check if userAuthToken exists for the user
        let authToken = roomManager.getUserAuthToken(sender_id);
        let userId;

        if (!authToken) {
            console.log('--- [userToAgent] --- No auth token found for user, logging in...');
            const loginData = await loginAndGetAuthToken(sender_username);
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

        // Log all the details we need
        console.log(`--- [userToAgent] --- Captured session details:`);
        console.log(`User ID: ${userId}`);
        console.log(`Auth Token: ${authToken}`);
        console.log(`Visitor Token: ${visitorToken}`);
        console.log(`Room ID: ${room_id}`);

        res.status(200).send('Captured all necessary details, see logs for more information.');
    } catch (error) {
        console.error('--- [userToAgent] --- Error capturing details:', error.message);
        res.status(500).send('Error capturing details.');
    }
});

module.exports = router;
