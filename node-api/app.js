// Load environment variables
require('dotenv').config();

const express = require('express');
const outgoingWebhookRoutes = require('./routes/outgoingWebhook');
const omnichannelWebhookRoutes = require('./routes/incomingOmnichannel');
const logger = require('./middlewares/logger');

// Create an Express application
const app = express();
app.use(express.json());  // Middleware to parse JSON requests
app.use(logger);  // Custom logger middleware

// Routes
app.use('/webhook/outgoing', outgoingWebhookRoutes);  // Outgoing Webhook User to Agent
app.use('/webhook/omnichannel', omnichannelWebhookRoutes);  // Outgoing Webhook Agent to User

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
