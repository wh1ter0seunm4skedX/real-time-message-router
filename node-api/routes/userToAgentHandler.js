const express = require('express');
const router = express.Router();
const { sendMessage, createOmnichannelContact, createLiveChatRoom, closeRoom, loginAndGetAuthToken } = require('../utils/rocketChat');
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
    const currentTimestamp = Date.now();

    console.log(`--- [userToAgent] --- Received message details: sender_id="${sender_id}", sender_username="${sender_username}", message_text="${message_text}", room_id="${room_id}", message_id="${message_id}"`);

    if (message_id === lastMessageId) {
        console.log('--- [userToAgent] --- Duplicate message received, ignoring.');
        return res.status(200).send('Duplicate message ignored.');
    }

    // Ignore messages sent by the bot or marked as system messages
    if (sender_username === botUsername || isSystemMessage) {
        console.log('--- [userToAgent] --- Message sent by bot or marked as system message, ignoring to prevent loop.');
        return res.status(200).send('Bot message or system message ignored.');
    }
	
    // Prevent processing duplicate user messages
    if (sender_username !== botUsername && message_id === lastProcessedUserMessageId) {
        console.log('--- [userToAgent] --- Duplicate message received from user, ignoring.');
        return res.status(200).send('Duplicate message ignored.');
    }

    lastMessageId = message_id;
    lastProcessedUserMessageId = message_id;

    if (sender_username !== botUsername) {
        lastProcessedUserMessageId = message_id;
    }

    if (roomManager.isTimerRunning(sender_id)) {
        console.log('--- [userToAgent] --- Inactivity timer is running. Resetting timer.');
        roomManager.stopInactivityTimer(sender_id);
    }

    // Start or reset inactivity timer for the room
    roomManager.startInactivityTimer(sender_id, closeRoom);

    try {
        // Log in the user and get the auth token for further API interactions
        const { authToken, userId } = await loginAndGetAuthToken(sender_username);

        const liveChatRoomId = roomManager.getLiveChatRoomId(sender_id);

        if (!liveChatRoomId) {  // Only create a new room if there isn't already one active
            const userToken = generateRandomToken();  // This is the userToken for the Omnichannel contact
            roomManager.setUserToken(sender_id, userToken);

            console.log(`--- [userToAgent] --- Room ID: ${room_id}`);
            console.log(`--- [userToAgent] --- User token: ${userToken}`);

            try {
                // Create Omnichannel Contact using userToken and the correct auth headers
                await createOmnichannelContact(authToken, userId, userToken, sender_username);
                
                // Create a Live Chat Room
                const newLiveChatRoomId = await createLiveChatRoom(authToken, userId, userToken);
                roomManager.setLiveChatRoomId(sender_id, newLiveChatRoomId);
                roomManager.setUserRoomId(sender_id, room_id);

				// Notify the user and the agent about the session using rocket.cat credentials
				const sessionMessageToUser = `You are now in a session with a representative who will assist you.`;
				await sendMessage(room_id, sessionMessageToUser, process.env.AUTH_TOKEN_ROCKETCAT, process.env.USER_ID_ROCKETCAT, true);

				const sessionMessageToAgent = `A new user has joined the session.`;
				await sendMessage(newLiveChatRoomId, sessionMessageToAgent, process.env.AUTH_TOKEN_ROCKETCAT, process.env.USER_ID_ROCKETCAT, true);


                console.log('--- [userToAgent] --- User registered and live chat room created successfully.');
                res.status(200).send('User registered and live chat room created successfully');
            } catch (error) {
                console.error('--- [userToAgent] --- Error processing the webhook:', error);
                res.status(500).send('Failed to process the webhook');
            }
        } else {
            console.log('--- [userToAgent] --- Live chat room already exists. Forwarding message to the existing room.');
            try {
                await sendMessage(liveChatRoomId, message_text, authToken, userId);  // Use authToken here
                console.log('--- [userToAgent] --- Message forwarded to live chat room.');
                res.status(200).send('Message forwarded to live chat room.');
            } catch (error) {
                console.error('--- [userToAgent] --- Error forwarding message to live chat room:', error);
                res.status(500).send('Failed to forward message to live chat room');
            }
        }
    } catch (error) {
        console.error('--- [userToAgent] --- Error logging in user or processing message:', error.message);
        res.status(500).send('Failed to process the webhook');
    }
});

module.exports = router;
