require('dotenv').config();
const express = require('express');
const userToAgent = require('./routes/userToAgentHandler');
const agentToUser = require('./routes/agentToUserHandler');
const logger = require('./middlewares/logger');
const devMenu = require('./utils/devMenu');

// Create an Express application
const app = express();
app.use(express.json());  // Middleware to parse JSON requests
app.use(logger);  // Custom logger middleware

// Routes
app.use('/webhook/outgoing', userToAgent);  // Outgoing Webhook User to Agent
app.use('/webhook/omnichannel', agentToUser);  // Outgoing Webhook Agent to User

// Developer Routes
app.post('/dev/close-all-livechat-rooms', async (req, res) => {  // New route for developer actions
    try {
        await devMenu.closeAllOpenLiveChatRooms(); 
        res.send('All livechat rooms closed successfully.');
    } catch (error) {
        console.error('Error closing livechat rooms:', error.message);
        res.status(500).send('Error closing livechat rooms.');
    }
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
