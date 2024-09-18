// agentToUserHandler.js 

const express = require('express');
const router = express.Router();
const { sendToRocketCatWithAgent, sendToUserWithRocketCat } = require('../utils/rocketChat');
const roomManager = require('../utils/roomManager');
const { closeRoom } = require('../utils/rocketChat');

let lastProcessedAgentMessageId = null;

router.post('/', async (req, res) => {
    console.log('--- [agentToUser] --- Omnichannel webhook from agent was triggered.');

    const { messages } = req.body;

    if (Array.isArray(messages) && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const messageText = lastMessage.msg || "No message";
        let senderId = lastMessage.u._id || "unknown";  
        const senderUsername = lastMessage.u.username || "unknown"; 
        const messageId = lastMessage._id;
        const isSystemMessage = lastMessage.t || false; 

        console.log(`--- [agentToUser] --- Received message details: messageText="${messageText}", senderId="${senderId}", senderUsername="${senderUsername}", messageId="${messageId}", isSystemMessage="${isSystemMessage}"`);

        if (messageId === lastProcessedAgentMessageId) {
            console.log('--- [agentToUser] --- Duplicate message received from agent, ignoring.');
            return res.status(200).send('Duplicate message ignored.');
        }

        lastProcessedAgentMessageId = messageId;

        if (isSystemMessage) {  // Ignore system messages
            console.log('--- [agentToUser] --- System message received, ignoring.');
            return res.status(200).send('System message ignored.');
        }

        // Check if timer is already running
        if (roomManager.isTimerRunning()) {
            console.log('--- [agentToUser] --- Timer is already running. Stopping the current timer.');
            roomManager.stopInactivityTimer(); // Stop the current timer
        }

        // Start or reset inactivity timer for the room
        roomManager.startInactivityTimer(closeRoom);

        // Check if sender is agent by username and adjust senderId accordingly
        if (senderUsername === 'agent') {  // If the sender's username is 'agent'
            console.log('--- [agentToUser] --- Sender identified as agent by username. Adjusting senderId to USER_ID_AGENT from .env');
            senderId = process.env.USER_ID_AGENT;  // Use USER_ID_AGENT from .env
        }

        // Prevent loop: check if message is from rocket.cat
        if (senderId === process.env.USER_ID_ROCKETCAT) {
            console.log('--- [agentToUser] --- Message is from rocket.cat, not forwarding to avoid loop.');
            return res.status(200).send('Message from rocket.cat ignored.');
        }

        if (senderId === process.env.USER_ID_AGENT) {  // Check if sender is agent
            console.log(`--- [agentToUser] --- Message from Agent in LiveChat room: "${messageText}" (Sent by ID: ${senderId})`);

            await sendToRocketCatWithAgent(messageText, senderId);

            console.log(`--- [agentToUser] --- Forwarding message to user room with rocket.cat. Message: "${messageText}"`);
                    
            let success = await sendToUserWithRocketCat(messageText);  // Send message to specific user room
                    
            if (success) {
                console.log('--- [agentToUser] --- Message successfully forwarded to user room.');
                res.status(200).send('Message forwarded to user room.');
            } else {
                console.log('--- [agentToUser] --- Failed to send message to user room with the specified format.');
                res.status(500).send('Failed to forward message to user room.');
            }
        } else {
            console.log(`--- [agentToUser] --- Message received from non-agent (sender ID: ${senderId}), ignoring.`);
            res.status(200).send('Non-agent message ignored.');
        }
    } else {
        console.log('--- [agentToUser] --- Invalid message or room type received.');
        res.status(200).send('Invalid message or room type.');
    }
});

module.exports = router;