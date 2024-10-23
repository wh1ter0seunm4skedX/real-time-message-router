const axios = require('axios');
require('dotenv').config();
const roomManager = require('../utils/roomManager');
const ROCKET_CHAT_URL = process.env.ROCKET_CHAT_URL;

/*
// Function to dynamically determine user type based on senderId passed in request
const determineUserType = (senderId, authToken) => {
    console.log(`--- [rocketChat.js] --- Received sender ID: ${senderId}`);

    if (senderId === process.env.USER_ID_ADMIN) {
        return { userType: 'admin', token: authToken || process.env.AUTH_TOKEN_ADMIN, userId: process.env.USER_ID_ADMIN };
    } else if (senderId === process.env.USER_ID_AGENT) {
        return { userType: 'livechat_agent', token: authToken || process.env.AUTH_TOKEN_AGENT, userId: process.env.USER_ID_AGENT };
    } else if (senderId === process.env.USER_ID_USER) {
        return { userType: 'user', token: authToken || process.env.AUTH_TOKEN_USER, userId: process.env.USER_ID_USER };
    } else {
        console.error(`--- [rocketChat.js] --- Error: User ID "${senderId}" does not match any known users.`);
        throw new Error('User ID does not match any known users.');
    }
};
*/

// Function to login a user and get their auth token (using the known default password)
async function loginAndGetAuthToken(username) {
    try {
        const response = await axios.post(`${ROCKET_CHAT_URL}/api/v1/login`, {
            user: username,
            password: 'Passw0rd!'  // Default password for regular and agent users
        });

        if (response.data.status === 'success') {
            const { authToken, userId } = response.data.data;
            console.log(`--- [rocketChat.js] --- Login successful for ${username}. Token: ${authToken}, User ID: ${userId}`);
            return { authToken, userId };
        } else {
            console.error(`--- [rocketChat.js] --- Login failed for ${username}:`, response.data.message);
            throw new Error(response.data.message);
        }
    } catch (error) {
        console.error(`--- [rocketChat.js] --- Error logging in user ${username}:`, error.response ? error.response.data : error.message);
        throw error;
    }
}

// Function to get authentication headers dynamically based on the user
async function getAuthHeaders(senderId, senderUsername) {
    try {
        // Use pre-stored credentials for admin and rocket.cat
        if (senderId === process.env.USER_ID_ADMIN) {
            return {
                'X-Auth-Token': process.env.AUTH_TOKEN_ADMIN,
                'X-User-Id': process.env.USER_ID_ADMIN
            };
        } else if (senderId === process.env.USER_ID_ROCKETCAT) {
            return {
                'X-Auth-Token': process.env.AUTH_TOKEN_ROCKETCAT,
                'X-User-Id': process.env.USER_ID_ROCKETCAT
            };
        }

        // For regular users or agents, login and retrieve their tokens
        console.log(`--- [rocketChat.js] --- Fetching token for user: ${senderUsername}`);
        const { authToken, userId } = await loginAndGetAuthToken(senderUsername);
        return {
            'X-Auth-Token': authToken,
            'X-User-Id': userId
        };
    } catch (error) {
        console.error('--- [rocketChat.js] --- Failed to get authentication headers:', error.message);
        throw error;
    }
}


// Function to create Omnichannel contact dynamically
async function createOmnichannelContact(authToken, userId, userToken, senderUsername) {
    try {
        const headers = {
            'X-Auth-Token': authToken,  // Use login token here
            'X-User-Id': userId         // Use logged-in user ID
        };

        console.log(`--- [rocketChat.js] --- Creating Omnichannel Contact for user with token: ${userToken}, name: ${senderUsername}`);

        const response = await axios.post(`${ROCKET_CHAT_URL}/api/v1/omnichannel/contact`, {
            token: userToken,  // Omnichannel token for the visitor
            name: senderUsername
        }, { headers });

        return response.data;
    } catch (error) {
        console.error('--- [rocketChat.js] --- Error creating omnichannel contact:', error.response ? error.response.data : error.message);
        throw error;
    }
}



// Function to dynamically create LiveChat room based on sender
async function createLiveChatRoom(authToken, userId, userToken) {
    try {
        const headers = {
            'X-Auth-Token': authToken,  // Use login token here
            'X-User-Id': userId         // Use logged-in user ID
        };

        console.log(`--- [rocketChat.js] --- Creating Live Chat Room with user token: ${userToken}`);

        const response = await axios.get(`${ROCKET_CHAT_URL}/api/v1/livechat/room`, {
            params: { token: userToken },  // Use the userToken for the visitor here
            headers
        });
        console.log('--- [rocketChat.js] --- Live chat room created:', response.data);
        return response.data.room._id;
    } catch (error) {
        console.error('--- [rocketChat.js] --- Error creating live chat room:', error.response ? error.response.data : error.message);
        throw error;
    }
}


// Function to send a message using dynamic auth tokens
async function sendMessage(channel, text, authToken, userId, isSystemMessage = false) {
    try {
        const message = isSystemMessage ? `${text} [SYSTEM]` : text;

        const headers = {
            'X-Auth-Token': authToken,  // Use the token from login
            'X-User-Id': userId         // Use the userId from login
        };

        console.log(`--- [rocketChat.js] --- Sending message to channel ${channel} with userId ${userId}`);
        await axios.post(`${ROCKET_CHAT_URL}/api/v1/chat.postMessage`, {
            text: message,
            channel
        }, { headers });

        console.log(`--- [rocketChat.js] --- Message sent to channel ${channel}: ${message}`);
    } catch (error) {
        console.error('--- [rocketChat.js] --- Error sending message:', error.response ? error.response.data : error.message);
    }
}


// Function to dynamically send a message from agent to agent's room with rocket.cat
async function sendToRocketCatWithAgent(messageText, agentId) {
    try {
        const headers = getAuthHeaders(agentId); // Using agent credentials

        // Here we try two different channel formats to send the message
        let channel1 = `rocket.cat${agentId}`;
        let channel2 = `${agentId}rocket.cat`;

        // Check if message is already from rocket.cat
        if (agentId === process.env.USER_ID_ROCKETCAT) {
            console.log('--- [rocketChat.js] --- Message is already from rocket.cat, not sending again to avoid loop.');
            return; // Avoid loop
        }

        console.log(`--- [rocketChat.js] --- Attempting to send message to rocket.cat for agent ${agentId}`);
        
        // Try first channel format
        console.log(`--- [rocketChat.js] --- Sending message to channel (format 1): ${channel1}`);
        let response = await axios.post(`${ROCKET_CHAT_URL}/api/v1/chat.postMessage`, {
            text: messageText,
            channel: channel1
        }, { headers });

        if (!response.data.success) {
            // If the first format fails, try the second
            console.log(`--- [rocketChat.js] --- First channel format failed: ${channel1}, trying ${channel2}`);
            response = await axios.post(`${ROCKET_CHAT_URL}/api/v1/chat.postMessage`, {
                text: messageText,
                channel: channel2
            }, { headers });
        }

        if (response.data.success) {
            console.log(`--- [rocketChat.js] --- Message sent to agent's room with rocket.cat: ${messageText}`);
        } else {
            console.error('--- [rocketChat.js] --- Failed to send message to agent room with rocket.cat:', response.data.error);
        }
    } catch (error) {
        console.error('--- [rocketChat.js] --- Error sending message to agent room with rocket.cat:', error.response ? error.response.data : error.message);
    }
}

async function sendToUserWithRocketCat(messageText) {
    try {
        const userRoomId = roomManager.getUserRoomId();

        if (!userRoomId) {
            console.error('--- [rocketChat.js] --- User room ID is not set. Cannot send message.');
            return false;
        }

        const headers = {
            'X-Auth-Token': process.env.AUTH_TOKEN_ROCKETCAT,
            'X-User-Id': process.env.USER_ID_ROCKETCAT
        };

        console.log(`--- [rocketChat.js] --- Attempting to send message as rocket.cat`);
        console.log(`--- [rocketChat.js] --- Using AUTH_TOKEN: ${process.env.AUTH_TOKEN_ROCKETCAT}`);
        console.log(`--- [rocketChat.js] --- Using USER_ID: ${process.env.USER_ID_ROCKETCAT}`);

        // Send using the userRoomId directly
        const channel = userRoomId;
        console.log(`--- [rocketChat.js] --- Sending message to user room with rocket.cat: ${channel}`);
        
        let response = await axios.post(`${ROCKET_CHAT_URL}/api/v1/chat.postMessage`, {
            text: messageText,
            channel: channel
        }, { headers });

        if (response.data && response.data.success) {
            console.log(`--- [rocketChat.js] --- Message successfully sent to user room: ${channel}`);
            return true;  // Message sent successfully
        } else {
            console.error(`--- [rocketChat.js] --- Error sending message: ${JSON.stringify(response.data)}`);
        }
    } catch (error) {
        console.error('--- [rocketChat.js] --- Error sending message to user room with rocket.cat:', error.response ? error.response.data : error.message);
    }

    return false;  // Return false if the attempt fails
}

// Function to handle incoming message and reset inactivity timer
async function handleIncomingMessage() {
    try {
        // Update last message time and reset inactivity timer
        roomManager.setLastMessageTime(new Date());

        if(roomManager.isTimerRunning()){
            console.log('--- [rocketChat.js] --- Timer is already running. Stopping the current timer.');
            roomManager.stopInactivityTimer();
        }
        // Start or reset the inactivity timer
        roomManager.startInactivityTimer(closeRoom);

        console.log(`--- [rocketChat.js] --- Inactivity timer reset for room ${roomId}`);
    } catch (error) {
        console.error('--- [rocketChat.js] --- Error handling incoming message:', error.message);
    }
}

// Function to close the room due to inactivity
async function closeRoom(userId) {
    try {
        const liveChatRoomId = roomManager.getLiveChatRoomId(userId);
        const userToken = roomManager.getUserToken(userId);
        const userRoomId = roomManager.getUserRoomId(userId);

        console.log(`--- [rocketChat.js] --- GOING TO CLOSE THE ROOM NOW for user: ${userId}`);
        console.log(`--- [rocketChat.js] --- liveChatRoomId is: ${liveChatRoomId}`);
        console.log(`--- [rocketChat.js] --- userToken is: ${userToken}`);
        console.log(`--- [rocketChat.js] --- userRoomId is: ${userRoomId}`);

        if (!liveChatRoomId || !userToken) {
            console.error('--- [rocketChat.js] --- Room ID or user token is missing. Cannot close room.');
            return;
        }

        const headers = {
            'X-Auth-Token': process.env.AUTH_TOKEN_ROCKETCAT,
            'X-User-Id': process.env.USER_ID_ROCKETCAT
        };

        if (userRoomId) {
            console.log(`--- [rocketChat.js] --- Sending a message to the user room: ${userRoomId}`);
            await sendToUserWithRocketCat('The room is closed due to inactivity over 30 seconds');
            console.log(`--- [rocketChat.js] --- System message sent to user room: ${userRoomId}`);
        }

        await axios.post(`${ROCKET_CHAT_URL}/api/v1/livechat/room.close`, { rid: liveChatRoomId, token: userToken }, { headers });

        console.log(`--- [rocketChat.js] --- Room ${liveChatRoomId} closed due to inactivity.`);

        roomManager.resetRoomData(userId); // Reset room data for the specific user

        sendMessage(liveChatRoomId, 'The room is closed due to inactivity over 30 seconds', process.env.USER_ID_AGENT);
    } catch (error) {
        console.error('--- [rocketChat.js] --- Error closing room:', error.message);
    }
}


module.exports = { 
    handleIncomingMessage,
	loginAndGetAuthToken,
	getAuthHeaders,
    closeRoom,
    sendToRocketCatWithAgent,
    sendToUserWithRocketCat,
    sendMessage,
    createOmnichannelContact,
    createLiveChatRoom, 
};
