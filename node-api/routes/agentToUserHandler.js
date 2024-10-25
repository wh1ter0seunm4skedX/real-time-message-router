const express = require('express');
const router = express.Router();
const { getUserRole, sendToRocketCatWithAgent, sendToUserWithRocketCat } = require('../utils/rocketChat');
const axios = require('axios');
const roomManager = require('../utils/roomManager');
const ROCKET_CHAT_URL = process.env.ROCKET_CHAT_URL;

router.post('/', async (req, res) => {
    console.log('--- [agentToUser] --- Omnichannel webhook from agent was triggered.');

    const { visitor, agent, messages } = req.body;

    if (Array.isArray(messages) && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const messageText = lastMessage.msg || "No message";
        const senderId = lastMessage.agentId;
        const liveChatRoomId = lastMessage.rid;
        const agentId = agent._id;
        const username = visitor.name;

        console.log(`--- [agentToUser] --- Extracted details:`);
        console.log('--- [agentToUser] --- request body:', req.body);
        console.log(`--- [agentToUser] --- Agent ID: ${agentId}`);
        console.log(`--- [agentToUser] --- Username: ${username}`);
        console.log(`--- [agentToUser] --- Live Chat Room ID: ${liveChatRoomId}`);
        console.log(`--- [agentToUser] --- Message Text: "${messageText}"`);

        // Step 1: Check the role of the sender before proceeding
        try {
            const senderRole = await getUserRole(senderId);
            console.log(`--- [agentToUser] --- Sender role: ${senderRole}`);
            if(senderRole.includes('bot')) {
                console.log(`--- [agentToUser] --- The sender has a "bot" role. Ignoring message.`);
                return res.status(403).send('Access denied. Senders with the "bot" role cannot proceed.');
            }
            if (senderRole.includes('user')) {
                console.log(`--- [agentToUser] --- The sender has a "user" role. Ignoring message.`);
                return res.status(403).send('Access denied. Senders with the "user" role cannot proceed.');
            }

            if (senderRole.includes('livechat-agent')) {
                console.log(`--- [agentToUser] --- The sender has a "livechat-agent" role. Proceeding...`);
            } else {
                console.log(`--- [agentToUser] --- Sender does not have the expected role. Stopping processing.`);
                return res.status(403).send('Access denied. The sender does not have the required role.');
            }
        } catch (error) {
            console.error('--- [agentToUser] --- Error retrieving sender role:', error.message);
            return res.status(500).send('Error verifying senders role.');
        }

        // Step 2: Fetch the user's ID using their username via the Rocket.Chat API
        let userId;
        try {
            const headers = {
                'X-Auth-Token': process.env.AUTH_TOKEN_ADMIN,
                'X-User-Id': process.env.USER_ID_ADMIN
            };

            const response = await axios.get(`${ROCKET_CHAT_URL}/api/v1/users.info?username=${username}`, { headers });

            if (response.data.success) {
                userId = response.data.user._id;
                console.log(`--- [agentToUser] --- Retrieved User ID: ${userId}`);
            } else {
                console.log(`--- [agentToUser] --- Failed to retrieve user info: ${response.data.error}`);
                return res.status(500).send('Failed to retrieve user info.');
            }
        } catch (error) {
            console.error('--- [agentToUser] --- Error retrieving user info:', error.message);
            return res.status(500).send('Error retrieving user info.');
        }

        
        // Step 3: Forward the message from the agent to rocket.cat
        try {
            await sendToRocketCatWithAgent(messageText, agentId);
            console.log(`--- [agentToUser] --- Message forwarded to rocket.cat: "${messageText}"`);
        } catch (error) {
            console.error('--- [agentToUser] --- Error forwarding message to rocket.cat:', error.message);
            return res.status(500).send('Failed to forward message to rocket.cat.');
        }

        // Step 4: Forward the agent's message from rocket.cat to the user's original room
        try {
            const userRoomId = roomManager.getUserRoomId(userId);
            if (!userRoomId) {
                console.log('--- [agentToUser] --- User room ID not found. Cannot forward message to user.');
                return res.status(404).send('User room ID not found.');
            }

            await sendToUserWithRocketCat(messageText, userRoomId);
            console.log(`--- [agentToUser] --- Message forwarded to user's original room ID: ${userRoomId}`);
            res.status(200).send('Message forwarded to user room successfully.');
        } catch (error) {
            console.error('--- [agentToUser] --- Error sending message to user room:', error.message);
            res.status(500).send('Failed to forward message to user room.');
        }
    } else {
        console.log('--- [agentToUser] --- Invalid message or room type received.');
        res.status(200).send('Invalid message or room type.');
    }
});

module.exports = router;
