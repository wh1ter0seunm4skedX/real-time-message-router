const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

// Create an Express application
const app = express();
app.use(express.json());  // Middleware to parse JSON requests

// Rocket.Chat configuration
const ROCKET_CHAT_URL = 'http://rocketchat:3000';
const AUTH_TOKEN = 'DmKr7omPnDNmkeogYqhEgREd6sG2jEzNiqU7We0ddSg';
const USER_ID = '7z7sGZEqXJPAd362H';
const webhookUrl = 'http://rocketchat:3000/hooks/66c72a6f647a6148449baabd/qPE8FtaLqqrpG8XdfMi8A9sk3umXQZ4CHfBoSBEZu6aDrBBs';





let liveChatRoomId = null; // Moved outside the route handler to make it global

// Endpoint to handle incoming webhook from Rocket.Chat
app.post('/webhook', async (req, res) => {
    const message = req.body;

    // Extract the fields from the received data
    const sender_id = message.user_id || "unknown";
    const sender_username = message.user_name || "unknown";
    const message_text = message.text || "No message";
    const room_id = message.channel_id || "unknown";

    if (message_text.toLowerCase() === 'hey') {
        // Generate a random token for the user
        const userToken = generateRandomToken();

        console.log(`Received message "hey" from user ${sender_username} (ID: ${sender_id})`);
        console.log(`Room ID: ${room_id}`);
        console.log(`User token: ${userToken}`);

        try {
            // Register the user as an Omnichannel contact
            const contactResponse = await axios.post(`${ROCKET_CHAT_URL}/api/v1/omnichannel/contact`, {
                token: userToken,
                name: sender_username,
            }, {
                headers: {
                    'X-Auth-Token': AUTH_TOKEN,
                    'X-User-Id': USER_ID
                }
            });

            console.log('User registered as Omnichannel contact:', contactResponse.data);

            // Create a live chat room using the user's token
            const roomResponse = await axios.get(`${ROCKET_CHAT_URL}/api/v1/livechat/room`, {
                params: {
                    token: userToken
                }
            });

            liveChatRoomId = roomResponse.data.room._id; // Store the live chat room ID

            console.log('Live chat room created successfully:', roomResponse.data);

            // Send a message back to the same room informing the user
            const sessionMessage = `You are now in a session with a representative who will assist you.`;
            await axios.post(`${ROCKET_CHAT_URL}/api/v1/chat.postMessage`, {
                text: sessionMessage,
                channel: room_id
            }, {
                headers: {
                    'X-Auth-Token': AUTH_TOKEN,
                    'X-User-Id': USER_ID
                }
            });

            res.status(200).send('User registered and live chat room created successfully');
        } catch (error) {
            console.error('Error processing the webhook:', error.response ? error.response.data : error.message);
            res.status(500).send('Failed to process the webhook');
        }
    } else if (message_text.toLowerCase() === 'bye') {
        if (liveChatRoomId) {
            try {
                // Send a farewell message to the user channel
                const farewellToUser = 'You have left the conversation with the representative';
                await axios.post(`${ROCKET_CHAT_URL}/api/v1/chat.postMessage`, {
                    text: farewellToUser,
                    channel: room_id
                }, {
                    headers: {
                        'X-Auth-Token': AUTH_TOKEN,
                        'X-User-Id': USER_ID
                    }
                });

                // Send a farewell message to the live chat room
                const farewellToManager = 'The user has left the conversation.';
                await axios.post(`${ROCKET_CHAT_URL}/api/v1/chat.postMessage`, {
                    text: farewellToManager,
                    channel: liveChatRoomId
                }, {
                    headers: {
                        'X-Auth-Token': AUTH_TOKEN,
                        'X-User-Id': USER_ID
                    }
                });

                // Reset the live chat room ID
                liveChatRoomId = null;

                res.status(200).send('Session ended and farewell message sent.');
            } catch (error) {
                console.error('Error sending farewell messages:', error.response ? error.response.data : error.message);
                res.status(500).send('Failed to send farewell messages');
            }
        } else {
            res.status(200).send('No active session to end.');
        }
    } else {
        // Forward all other messages to the live chat room
        if (liveChatRoomId) {
            try {
                // Forward the message to the live chat room
                await axios.post(`${ROCKET_CHAT_URL}/api/v1/chat.postMessage`, {
                    text: message_text,
                    channel: liveChatRoomId
                }, {
                    headers: {
                        'X-Auth-Token': AUTH_TOKEN,
                        'X-User-Id': USER_ID
                    }
                });

                res.status(200).send('Message forwarded to live chat room.');
            } catch (error) {
                console.error('Error forwarding message to live chat room:', error.response ? error.response.data : error.message);
                res.status(500).send('Failed to forward message to live chat room');
            }
        } else {
            res.status(200).send('No active session. Message not forwarded.');
        }
    }
});


//--------------------------------------------------------------------------------
// Function to generate a random token
function generateRandomToken() {
    return crypto.randomBytes(8).toString('hex');  // Generates a 16-character random token
}

// Route to trigger sending a message to Rocket.Chat when accessed
app.get('/sendMessageToRocket', async (req, res) => {
    try {
        // Message to send
        const message = 'Hello @rocket.cat from Node.js via special URL!';

        // Send the message to Rocket.Chat via the incoming webhook
        const response = await axios.post(webhookUrl, {
            text: message
        });

        // Log success
        console.log('Message sent successfully:', response.data);

        // Respond to the browser with a success message
        res.status(200).send('Message sent to Rocket.Chat!');
    } catch (error) {
        console.error('Error sending message:', error.response ? error.response.data : error.message);

        // Respond to the browser with an error message
        res.status(500).send('Failed to send message to Rocket.Chat.');
    }
});

//--------------------------------------------------------------------------------
// Simple GET endpoint to test server
app.get('/hello', (req, res) => {
    console.log('Hello endpoint was hit!');
    res.send('Hello from Node.js server!');
});

// Set an interval to log a message every 1 min
/*setInterval(() => {
    console.log('The server is running and checking for changes...');
}, 60000);
*/

// Endpoint to fetch all users
app.get('/users', async (req, res) => {
    try {
        console.log('Fetching all users from Rocket.Chat...');
        const response = await axios.get(`${ROCKET_CHAT_URL}/api/v1/users.list`, {
            headers: {
                'X-Auth-Token': AUTH_TOKEN,
                'X-User-Id': USER_ID
            }
        });

        // Log and return the list of users
        console.log('Users fetched successfully:', response.data);
        res.status(200).json(response.data);

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Endpoint to fetch messages from a room
app.get('/rooms.get', async (req, res) => {
    try {
        console.log(`Fetching messages from all rooms`);
        const response = await axios.get(`${ROCKET_CHAT_URL}/api/v1/rooms.get`, {
            headers: {
                'X-Auth-Token': AUTH_TOKEN,
                'X-User-Id': USER_ID
            }
        });

        // Log and return the messages
        console.log(`All of the rooms are fetched successfully:`, response.data);
        res.status(200).json(response.data);

    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

// Endpoint to get direct messages using roomId
app.get('/dm/:roomId', async (req, res) => {
    const roomId = req.params.roomId;  // Extract roomId from request params

    try {
        console.log(`Getting messages from room: ${roomId}`);
        
        const response = await axios.get(`${ROCKET_CHAT_URL}/api/v1/im.messages`, {
            headers: {
                'X-Auth-Token': AUTH_TOKEN,
                'X-User-Id': USER_ID
            },
            params: {
                roomId: roomId  // Send roomId as a parameter
            }
        });

        // Log and return the response
        console.log(`Messages from room ${roomId} fetched successfully:`, response.data);
        res.status(200).json(response.data);

    } catch (error) {
        console.error('Error getting messages from room:', error);
        res.status(500).json({ error: 'Failed to fetch direct messages' });
    }
});


// Start the server
app.listen(4000, () => {
    console.log('Server running on port 4000');
});
