//devMenu.js is a utility file that contains functions to interact with the Rocket.Chat API. It includes functions to log in to Rocket.Chat, create a livechat agent user, create a regular user, close a livechat room, and close all open livechat rooms. The functions are used in the development environment to perform administrative tasks such as creating users, closing rooms, and managing agents. The functions make use of the Rocket.Chat API endpoints to perform these actions. The file also contains environment variables to store the Rocket.Chat URL, admin credentials, and other configuration settings.

const axios = require('axios');
require('dotenv').config();
const ROCKET_CHAT_URL = process.env.ROCKET_CHAT_URL;

// Use the admin credentials from the environment variables
let authToken = process.env.AUTH_TOKEN_ADMIN;
let userId = process.env.USER_ID_ADMIN;

// Function to log in to Rocket.Chat
async function loginToRocketChat() {
    console.log('--- [devMenu.js] --- loginToRocketChat function called');

    try {
        const response = await axios.post(`${ROCKET_CHAT_URL}/api/v1/login`, {
            user: process.env.AUTH_TOKEN_ADMIN,
            password: process.env.ROCKET_CHAT_ADMIN_PASSWORD
        });

        if (response.data.status === 'success') {
            authToken = response.data.data.authToken;
            userId = response.data.data.userId;

            console.log('--- [devMenu.js] --- Logged in successfully');
            console.log(`--- [devMenu.js] --- Auth Token: ${authToken}`);
            console.log(`--- [devMenu.js] --- User ID: ${userId}`);
        } else {
            console.error('--- [devMenu.js] --- Failed to log in:', response.data.message);
        }
    } catch (error) {
        console.error('--- [devMenu.js] --- Error logging in:', error.response ? error.response.data : error.message);
    }
}

// Function to get the latest agent user
async function getLatestAgentId() {
    console.log('--- [devMenu.js] --- getLatestAgentId function called');

    try {
        // Fetch all users and filter by role 'agent'
        const response = await axios.get(`${ROCKET_CHAT_URL}/api/v1/users.list`, {
            headers: {
                'X-Auth-Token': authToken,
                'X-User-Id': userId,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.users && response.data.users.length > 0) {
            const agents = response.data.users.filter(user => user.roles.includes('livechat-agent'));

            if (agents.length > 0) {
                // Sort agents by username to find the latest one (assuming username format is agent_<number>)
                agents.sort((a, b) => {
                    const numA = parseInt(a.username.split('_')[1], 10) || 0;
                    const numB = parseInt(b.username.split('_')[1], 10) || 0;
                    return numA - numB;
                });

                const latestAgent = agents[agents.length - 1];
                console.log(`--- [devMenu.js] --- Latest agent found: ${latestAgent.username} with ID: ${latestAgent._id}`);
                return latestAgent.username;
            } else {
                console.log('--- [devMenu.js] --- No agents found in the system.');
                return null;
            }
        } else {
            console.log('--- [devMenu.js] --- No users found in the system.');
            return null;
        }
    } catch (error) {
        console.error('--- [devMenu.js] --- Error fetching agent list:', error.response?.data || error.message);
        return null;
    }
}

// Function to create a livechat agent user with "livechat-agent" role
async function createAgentUser() {
    console.log('--- [devMenu.js] --- createAgentUser function called');

    const latestAgentUsername = await getLatestAgentId();

    let agentNumber = 1;  // Default agent number if no agents exist
    if (latestAgentUsername) {
        const parts = latestAgentUsername.split('_');
        agentNumber = parseInt(parts[1], 10) + 1;  // Increment the last agent's number
    }

    const agentUsername = `agent_${agentNumber}`;
    const agentEmail = `${agentUsername}@example.com`;

    const data = {
        name: agentUsername,  // Name is same as username
        email: agentEmail,
        password: 'Passw0rd!',  // Placeholder password
        username: agentUsername,
        roles: ['livechat-agent'],  // Assign livechat-agent role
        verified: true,  // Email is verified
        active: true
    };

    try {
        const response = await axios.post(`${ROCKET_CHAT_URL}/api/v1/users.create`, data, {
            headers: {
                'X-Auth-Token': authToken,
                'X-User-Id': userId,
                'Content-Type': 'application/json'
            }
        });
        console.log(`Agent ${agentUsername} created successfully:`, response.data);
    } catch (error) {
        console.error(`Error creating agent ${agentUsername}:`, error.response?.data || error.message);
    }
}

// Function to get the latest user with the "user" role
async function getLatestUserUsername() {
    console.log('--- [devMenu.js] --- getLatestUserUsername function called');

    try {
        const response = await axios.get(`${ROCKET_CHAT_URL}/api/v1/users.list`, {
            headers: {
                'X-Auth-Token': authToken,
                'X-User-Id': userId,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.users && response.data.users.length > 0) {
            const users = response.data.users.filter(user => user.roles.includes('user'));  // Filter for users with "user" role

            if (users.length > 0) {
                // Sort users by username to find the latest one (assuming username format is user_<number>)
                users.sort((a, b) => {
                    const numA = parseInt(a.username.split('_')[1], 10) || 0;
                    const numB = parseInt(b.username.split('_')[1], 10) || 0;
                    return numA - numB;
                });

                const latestUser = users[users.length - 1];
                console.log(`--- [devMenu.js] --- Latest user found: ${latestUser.username} with ID: ${latestUser._id}`);
                return latestUser.username;
            } else {
                console.log('--- [devMenu.js] --- No users with the "user" role found in the system.');
                return null;
            }
        } else {
            console.log('--- [devMenu.js] --- No users found in the system.');
            return null;
        }
    } catch (error) {
        console.error('--- [devMenu.js] --- Error fetching users list:', error.response?.data || error.message);
        return null;
    }
}

// Function to create a regular user with "user" role
async function createRegularUser() {
    console.log('--- [devMenu.js] --- createRegularUser function called');

    const latestUserUsername = await getLatestUserUsername();

    let userNumber = 1;  // Default user number if no users exist
    if (latestUserUsername) {
        const parts = latestUserUsername.split('_');
        userNumber = parseInt(parts[1], 10) + 1;  // Increment the last user's number
    }

    const username = `user_${userNumber}`;
    const email = `${username}@example.com`;

    const data = {
        name: username,  // Name is same as username
        email: email,
        password: 'Passw0rd!',  // Placeholder password
        username: username,
        roles: ['user'],  // Assign "user" role
        verified: true,  // Email is verified
        active: true
    };

    try {
        const response = await axios.post(`${ROCKET_CHAT_URL}/api/v1/users.create`, data, {
            headers: {
                'X-Auth-Token': authToken,
                'X-User-Id': userId,
                'Content-Type': 'application/json'
            }
        });
        console.log(`User ${username} created successfully:`, response.data);
    } catch (error) {
        console.error(`Error creating user ${username}:`, error.response?.data || error.message);
    }
}


// Utility function to close a livechat room by ID
async function closeLiveChatRoom(rid, token) {
    console.log('--- [devMenu.js] --- closeLiveChatRoom function called');
    console.log(`--- [devMenu.js] --- Room ID (rid): ${rid}`);
    console.log(`--- [devMenu.js] --- Visitor Token: ${token}`);

    try {
        const headers = {
            'X-Auth-Token': process.env.AUTH_TOKEN_ADMIN,
            'X-User-Id': process.env.USER_ID_ADMIN
        };

        console.log('--- [devMenu.js] --- Sending POST request to close the room');
        console.log(`--- [devMenu.js] --- Headers: ${JSON.stringify(headers)}`);
        console.log(`--- [devMenu.js] --- URL: ${ROCKET_CHAT_URL}/api/v1/livechat/room.close`);

        const response = await axios.post(`${ROCKET_CHAT_URL}/api/v1/livechat/room.close`, { rid, token }, { headers });
        console.log(`--- [devMenu.js] --- Room ${rid} closed successfully.`);
        console.log(`--- [devMenu.js] --- Response Data: ${JSON.stringify(response.data)}`);
        return response.data;
    } catch (error) {
        console.error(`--- [devMenu.js] --- Error closing room ${rid}:`, error.response ? error.response.data : error.message);
        throw error;
    }
}

// Function to fetch all livechat rooms and close them
async function closeAllOpenLiveChatRooms() {
    console.log('--- [devMenu.js] --- closeAllLiveChatRooms function called');

    try {
        const headers = {
            'X-Auth-Token': process.env.AUTH_TOKEN_ADMIN,
            'X-User-Id': process.env.USER_ID_ADMIN
        };

        console.log('--- [devMenu.js] --- Sending GET request to fetch all livechat rooms');
        console.log(`--- [devMenu.js] --- Headers: ${JSON.stringify(headers)}`);
        console.log(`--- [devMenu.js] --- URL: ${ROCKET_CHAT_URL}/api/v1/livechat/rooms`);
       
        // Fetch all open livechat rooms
        const response = await axios.get(`${ROCKET_CHAT_URL}/api/v1/livechat/rooms?open=true`, { headers });

        console.log(`--- [devMenu.js] --- Response Data: ${JSON.stringify(response.data)}`);
        if (response.data && response.data.rooms) {
            console.log(`--- [devMenu.js] --- Found ${response.data.rooms.length} open rooms.`);

            for (const room of response.data.rooms) {
                console.log(`--- [devMenu.js] --- Processing room with ID: ${room._id}`);

                // Assuming the room has a token and rid
                if (room._id && room.v && room.v.token) {
                    console.log(`--- [devMenu.js] --- Closing room with ID: ${room._id} and Token: ${room.v.token}`);
                    await closeLiveChatRoom(room._id, room.v.token);
                } else {
                    console.log(`--- [devMenu.js] --- Skipping room with ID: ${room._id} due to missing data.`);
                }
            }
        } else {
            console.log('--- [devMenu.js] --- No open rooms found or response data is malformed.');
        }
    } catch (error) {
        console.error('--- [devMenu.js] --- Error fetching or closing livechat rooms:', error.response ? error.response.data : error.message);
    }
}

module.exports = {
	loginToRocketChat,
	createRegularUser,
	createAgentUser,
    closeLiveChatRoom,
    closeAllOpenLiveChatRooms
};