const express = require('express');
const axios = require('axios');
const router = express.Router();
const { loginAndGetAuthToken, getUserRole } = require('../utils/rocketChat');
const roomManager = require('../utils/roomManager');
const ROCKET_CHAT_URL = process.env.ROCKET_CHAT_URL;

router.post('/', async (req, res) => {
    console.log('--- [agentToUser] --- Omnichannel webhook from agent was triggered.');

    const { visitor, agent, messages } = req.body;

    if (Array.isArray(messages) && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const messageText = lastMessage.msg || "No message";  
        const senderId = lastMessage.u._id || "unknown";  
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
        try {
            const headers = {
                'X-Auth-Token': process.env.AUTH_TOKEN_ADMIN,
                'X-User-Id': process.env.USER_ID_ADMIN
            };
            
            const response = await axios.get(`${ROCKET_CHAT_URL}/api/v1/users.info?username=${username}`, { headers });
            
            if (response.data.success) {
                const userId = response.data.user._id;
                console.log(`--- [agentToUser] --- Retrieved User ID: ${userId}`);
            } else {
                console.log(`--- [agentToUser] --- Failed to retrieve user info: ${response.data.error}`);
            }
        } catch (error) {
            console.error('--- [agentToUser] --- Error retrieving user info:', error.message);
            return res.status(500).send('Error retrieving user info.');
        }

        // Proceed with your other logic here...

        res.status(200).send('User ID retrieved and logged successfully.');
    } else {
        console.log('--- [agentToUser] --- Invalid message or room type received.');
        res.status(200).send('Invalid message or room type.');
    }
});

module.exports = router;
