const axios = require('axios');
require('dotenv').config();
const ROCKET_CHAT_URL = process.env.ROCKET_CHAT_URL;

// Store the authToken and userId for authenticated requests
let authToken = '';
let userId = '';

// Function to log in to Rocket.Chat
async function loginToRocketChat() {
    console.log('--- [devMenu.js] --- loginToRocketChat function called');

    try {
        const response = await axios.post(`${ROCKET_CHAT_URL}/api/v1/login`, {
            user: process.env.ROCKET_CHAT_ADMIN_USER,  // Use environment variables for security
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
    closeLiveChatRoom,
    closeAllOpenLiveChatRooms
};