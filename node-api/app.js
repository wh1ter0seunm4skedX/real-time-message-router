// app.js is the entry point for the Node.js application. It sets up the Express server, middleware, and routes.

require('dotenv').config();
const express = require('express');
const userToAgent = require('./routes/userToAgentHandler');
const agentToUser = require('./routes/agentToUserHandler');
const logger = require('./middlewares/logger');
const devMenu = require('./utils/devMenu');
const { getUserRole } = require('./utils/rocketChat');

const app = express();
app.use(express.json());  
app.use(logger);  

// Log requests to /webhook/user2agent for debugging purposes
app.post('/webhook/user2agent', (req, res, next) => {
    console.log('Received request for /webhook/user2agent:', req.body);
    next();  // Pass control to the next handler (userToAgent)
});

// Routes
app.use('/webhook/user2agent', userToAgent);  
app.use('/webhook/agent2user', agentToUser); 

// Developer Routes
app.post('/dev/close-all-livechat-rooms', async (req, res) => { 
    try {
        await devMenu.closeAllOpenLiveChatRooms(); 
        res.send('All livechat rooms closed successfully.');
    } catch (error) {
        console.error('Error closing livechat rooms:', error.message);
        res.status(500).send('Error closing livechat rooms.');
    }
});

// Developer Route to create a regular Rocket.Chat user
app.post('/dev/create-regular-user', async (req, res) => {
    try {
        await devMenu.createRegularUser();  // Call the function to create a regular user
        res.send('Regular Rocket.Chat user created successfully.');
    } catch (error) {
        console.error('Error creating user:', error.message);
        res.status(500).send('Error creating user.');
    }
});

// Developer Route to create an agent Rocket.Chat user
app.post('/dev/create-agent-user', async (req, res) => {
    try {
        await devMenu.createAgentUser();  // Call the function to create an agent user
        res.send('Agent Rocket.Chat user created successfully.');
    } catch (error) {
        console.error('Error creating agent:', error.message);
        res.status(500).send('Error creating agent.');
    }
});

// Route to get user role by userId
app.get('/dev/get-user-role', async (req, res) => {
    const { userId } = req.query;  // Get userId from query parameters
    if (!userId) {
        return res.status(400).send('Missing userId parameter');
    }

    try {
        const roles = await getUserRole(userId);  // Call the function to get the user's roles
        res.json({ userId, roles });  // Respond with userId and roles
    } catch (error) {
        console.error(`Error retrieving roles for user ${userId}:`, error.message);
        res.status(500).send(`Error retrieving roles for user ${userId}`);
    }
});

// Health check route for debugging purposes
app.get('/health', (req, res) => {
    res.status(200).send('API is running\n');
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
