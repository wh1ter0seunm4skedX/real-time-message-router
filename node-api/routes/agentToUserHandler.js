/* agentToUserHandler.js is a route handler that listens for incoming messages from the agent in the LiveChat room.
 It processes the message and forwards it to the user's room using the rocket.cat credentials. 
 It also handles the inactivity timer for the agent's room.
*/
const express = require('express');
const axios = require('axios');
const router = express.Router();
const { sendToRocketCatWithAgent, sendToUserWithRocketCat, getAuthHeaders, loginAndGetAuthToken } = require('../utils/rocketChat');
const roomManager = require('../utils/roomManager');
const { closeRoom } = require('../utils/rocketChat');
let lastProcessedAgentMessageId = null;

router.post('/', async (req, res) => {
    console.log('--- [agentToUser] --- Omnichannel webhook from agent was triggered.');

    const { messages } = req.body;

    if (Array.isArray(messages) && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const messageText = lastMessage.msg || "No message";
		
        let senderId = (lastMessage.u && lastMessage.u._id) || "unknown";
        const senderUsername = (lastMessage.u && lastMessage.u.username) || "unknown";
        const messageId = lastMessage._id;
        const isSystemMessage = lastMessage.t || false; 

        console.log(`--- [agentToUser] --- Received message details: messageText="${messageText}", senderId="${senderId}", senderUsername="${senderUsername}", messageId="${messageId}", isSystemMessage="${isSystemMessage}"`);

        if (messageId === lastProcessedAgentMessageId) {
            console.log('--- [agentToUser] --- Duplicate message received from agent, ignoring.');
            return res.status(200).send('Duplicate message ignored.');
        }

        lastProcessedAgentMessageId = messageId;

        // Ignore system messages or messages sent by rocket.cat
        if (isSystemMessage || senderId === process.env.USER_ID_ROCKETCAT) {
            console.log('--- [agentToUser] --- System message or message from rocket.cat received, ignoring.');
            return res.status(200).send('System message ignored.');
        }

        // Dynamically login the agent and get their auth token
        try {
            const { authToken, userId } = await loginAndGetAuthToken(senderUsername);

            // Use the obtained token and userId to verify the agent role
            const headers = {
                'X-Auth-Token': authToken,
                'X-User-Id': userId
            };

            const response = await axios.get(`${process.env.ROCKET_CHAT_URL}/api/v1/users.info`, {
                params: { userId: senderId },
                headers
            });

            const roles = response.data.user.roles || [];
            if (!roles.includes('livechat-agent')) {
                console.log(`--- [agentToUser] --- Sender is not a livechat agent. Message ignored.`);
                return res.status(200).send('Non-agent message ignored.');
            }

        } catch (error) {
            console.error('--- [agentToUser] --- Error identifying agent role:', error.response ? error.response.data : error.message);
            return res.status(500).send('Error identifying agent role.');
        }

        // Handle timer management
        const userId = senderId;  // This will serve as the unique identifier for the room timer

        if (roomManager.isTimerRunning(userId)) {
            console.log('--- [agentToUser] --- Timer is already running. Stopping the current timer.');
            roomManager.stopInactivityTimer(userId);
        }

        // Start or reset inactivity timer for the agent's room
        roomManager.startInactivityTimer(userId, closeRoom);

        // Process and send the message to the user's room using rocket.cat
        console.log(`--- [agentToUser] --- Message from Agent in LiveChat room: "${messageText}" (Sent by ID: ${senderId})`);

        await sendToRocketCatWithAgent(messageText, senderId);  // Send to the user with rocket.cat credentials

        console.log(`--- [agentToUser] --- Forwarding message to user room with rocket.cat. Message: "${messageText}"`);
                    
        let success = await sendToUserWithRocketCat(messageText);  // Send message to the specific user room
                    
        if (success) {
            console.log('--- [agentToUser] --- Message successfully forwarded to user room.');
            res.status(200).send('Message forwarded to user room.');
        } else {
            console.log('--- [agentToUser] --- Failed to send message to user room with the specified format.');
            res.status(500).send('Failed to forward message to user room.');
        }

    } else {
        console.log('--- [agentToUser] --- Invalid message or room type received.');
        res.status(200).send('Invalid message or room type.');
    }
});

module.exports = router;
