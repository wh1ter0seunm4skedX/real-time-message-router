// userToAgentHandler.js

const express = require('express');
const router = express.Router();
const { sendMessage, createOmnichannelContact, createLiveChatRoom, closeRoom} = require('../utils/rocketChat');
const { generateRandomToken } = require('../utils/helpers');
const roomManager = require('../utils/roomManager');

const botUsername = 'rocket.cat';

let lastMessageId = null;
let lastProcessedUserMessageId = null;
let lastMessageTimestamp = 0;
let userToken = null;

router.post('/', async (req, res) => {
    console.log('--- [userToAgent] --- Outgoing webhook from user was triggered.');

    const message = req.body;
    const sender_id = message.user_id || "unknown";
    const sender_username = message.user_name || "unknown";
    const message_text = message.text || "No message";
    const room_id = message.channel_id || "unknown";
    const message_id = message.message_id || "unknown";
    const currentTimestamp = Date.now();

    console.log(`--- [userToAgent] --- Received message details: sender_id="${sender_id}", sender_username="${sender_username}", message_text="${message_text}", room_id="${room_id}", message_id="${message_id}"`);

    if (message_id === lastMessageId) {
        console.log('--- [userToAgent] --- Duplicate message received, ignoring.');
        return res.status(200).send('Duplicate message ignored.');
    }

    // Prevent loop: Check if the message was sent by bot or is a system message
    if (sender_username === botUsername || message.isSystemMessage) {
        console.log('--- [userToAgent] --- Message sent by bot or marked as system message, ignoring to prevent loop.');
        return res.status(200).send('Bot message or system message ignored.');
    }

    if (sender_username !== botUsername && message_id === lastProcessedUserMessageId) {
        console.log('--- [userToAgent] --- Duplicate message received from user, ignoring.');
        return res.status(200).send('Duplicate message ignored.');
    }

    lastMessageId = message_id;
    lastMessageTimestamp = currentTimestamp;

    if (sender_username !== botUsername) {
        lastProcessedUserMessageId = message_id;
    }
    try{
        // start or reset inactivity timer for the the user
        if(roomManager.isTimerRunning(sender_id)) {
            console.log('--- [userToAgent] --- Inactivity timer is running. Resetting timer.');
            roomManager.stopInactivityTimer(sender_id);
        }
        
        roomManager.startInactivityTimer(sender_id, closeRoom);

        const liveChatRoomId = roomManager.getLiveChatRoomId(sender_id);

        if(!liveChatRoomId){
            //New session
            const userToken = generateRandomToken();
            roomManager.setUserToken(sender_id, userToken);
            roomManager.setUserRoomId(sender_id, room_id);  

            await createOmnichannelContact(sender_id, userToken, sender_username);
            const newLiveChatRoomId = await createLiveChatRoom(sender_id, userToken);
            roomManager.setLiveChatRoomId(sender_id, newLiveChatRoomId);

            const sessionMessageToUser = `You are now in a session with a representative who will assist you.`;
            await sendMessage(room_id, sessionMessageToUser, sender_id, true);

            const sessionMessageToAgent = `A new user has joined the session.`;
            await sendMessage(newLiveChatRoomId, sessionMessageToAgent, sender_id, true);

            console.log('--- [userToAgent] --- User registered and live chat room created successfully.');
            res.status(200).send('User registered and live chat room created successfully');
        } else {
            // existing session
            console.log('--- [userToAgent] --- Live chat room already exists. Forwarding message to the existing room.');
            await sendMessage(liveChatRoomId, message_text, sender_id);
            console.log('--- [userToAgent] --- Message forwarded to live chat room.');
            res.status(200).send('Message forwarded to live chat room.');
        }
    } catch (error) {
        console.error('--- [userToAgent] --- Error processing the webhook:', error);
        res.status(500).send('Failed to process the webhook');
    }
});

module.exports = router;
