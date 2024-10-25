const express = require('express');
const router = express.Router();
const { getUserRole, sendToRocketCatWithAgent } = require('../utils/rocketChat');
const axios = require('axios');
const roomManager = require('../utils/roomManager');
const ROCKET_CHAT_URL = process.env.ROCKET_CHAT_URL;

router.post('/', async (req, res) => {
    console.log('--- [agentToUser] --- Omnichannel webhook from agent was triggered.');

    const { visitor, agent, messages } = req.body;

    if (Array.isArray(messages) && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const messageText = lastMessage.msg || "No message";  
        const liveChatRoomId = lastMessage.rid;
        const agentId = agent._id;
        const username = visitor.name;

        // Log the extracted details
        console.log(`--- [agentToUser] --- Extracted details:`);
        console.log(`Agent ID: ${agentId}`);
        console.log(`Username: ${username}`);
        console.log(`Live Chat Room ID: ${liveChatRoomId}`);
        console.log(`Message Text: "${messageText}"`);

        // Step 1: Fetch the user's ID using their username via the Rocket.Chat API
        let userId;
        try {
            const headers = {
                'X-Auth-Token': process.env.AUTH_TOKEN_ADMIN,
                'X-User-Id': process.env.USER_ID_ADMIN
            };
            
            const response = await axios.get(`${ROCKET_CHAT_URL}/api/v1/users.info`, {
                headers,
                params: { username }
            });
            
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

        // Step 2: Check the role of the agent
        try {
            const agentRoles = await getUserRole(agentId);
            console.log(`--- [agentToUser] --- Agent roles: ${agentRoles}`);

            if (agentRoles.includes('user')) {
                console.log(`--- [agentToUser] --- The sender has a "user" role. Ignoring message.`);
                return res.status(403).send('Access denied. Senders with the "user" role cannot proceed.');
            }

            if (agentRoles.includes('livechat-agent')) {
                console.log(`--- [agentToUser] --- The agent has a "livechat-agent" role. Proceeding...`);
            } else {
                console.log(`--- [agentToUser] --- Agent does not have the expected role. Stopping processing.`);
                return res.status(403).send('Access denied. The agent does not have the required role.');
            }
        } catch (error) {
            console.error('--- [agentToUser] --- Error retrieving agent role:', error.message);
            return res.status(500).send('Error verifying agent role.');
        }

        // Step 3: Forward the message from the agent to rocket.cat
        try {
            await sendToRocketCatWithAgent(messageText, agentId);
            console.log(`--- [agentToUser] --- Message forwarded to rocket.cat: "${messageText}"`);
            res.status(200).send('Message forwarded to rocket.cat successfully.');
        } catch (error) {
            console.error('--- [agentToUser] --- Error forwarding message to rocket.cat:', error.message);
            res.status(500).send('Failed to forward message to rocket.cat.');
        }
    } else {
        console.log('--- [agentToUser] --- Invalid message or room type received.');
        res.status(200).send('Invalid message or room type.');
    }
});

module.exports = router;
