// app.js

require('dotenv').config();
const express = require('express');
const logger = require('./middlewares/logger');
const app = express();

// Create an Express application
app.use(express.json()); 
app.use(logger);  

// Routes
const userToAgent = require('./routes/userToAgentHandler');
const agentToUser = require('./routes/agentToUserHandler');

app.use('/webhook/user2agent', userToAgent);  
app.use('/webhook/agent2user', agentToUser); 

// Developer Routes
const devMenu = require('./utils/devMenu');
app.post('/dev/close-all-livechat-rooms', async (req, res) => { 
    try {
        await devMenu.closeAllOpenLiveChatRooms(); 
        res.send('All livechat rooms closed successfully.');
    } catch (error) {
        console.error('Error closing livechat rooms:', error.message);
        res.status(500).send('Error closing livechat rooms.');
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
