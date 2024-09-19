// agentToUserHandler.js

const express = require('express');
const router = express.Router();
const {
  sendToRocketCatWithAgent,
  sendToUserWithRocketCat,
  closeRoom
} = require('../utils/rocketChat');
const roomManager = require('../utils/roomManager');

let lastProcessedAgentMessageId = null;

router.post('/', async (req, res) => {
  console.log('--- [agentToUser] --- Omnichannel webhook from agent was triggered.');

  const { messages } = req.body;

  if (Array.isArray(messages) && messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    const messageText = lastMessage.msg || "No message";
    let senderId = lastMessage.u._id || "unknown";
    const senderUsername = lastMessage.u.username || "unknown";
    const messageId = lastMessage._id;
    const isSystemMessage = lastMessage.t || false;
    const liveChatRoomId = lastMessage.rid;

    console.log(`--- [agentToUser] --- Received message details: messageText="${messageText}", senderId="${senderId}", senderUsername="${senderUsername}", messageId="${messageId}", isSystemMessage="${isSystemMessage}", liveChatRoomId="${liveChatRoomId}"`);

        // Avoid processing duplicate messages
    if (messageId === lastProcessedAgentMessageId) {
      console.log('--- [agentToUser] --- Duplicate message received from agent, ignoring.');
      return res.status(200).send('Duplicate message ignored.');
    }
    lastProcessedAgentMessageId = messageId;
    
    // Ignore system messages
    if (isSystemMessage) {
      console.log('--- [agentToUser] --- System message received, ignoring.');
      return res.status(200).send('System message ignored.');
    }

    // Verify sender is the agent
    if (senderUsername !== 'agent') {
      console.log(`--- [agentToUser] --- Message received from non-agent user "${senderUsername}", ignoring.`);
      return res.status(200).send('Non-agent message ignored.');
    }

    /*
    // Prevent loop: check if message is from rocket.cat
    if (senderId === process.env.USER_ID_ROCKETCAT) {
      console.log('--- [agentToUser] --- Message is from rocket.cat, not forwarding to avoid loop.');
      return res.status(200).send('Message from rocket.cat ignored.');
    }
*/

const agentId = process.env.USER_ID_AGENT;

// Retrieve userId associated with liveChatRoomId
const userId = roomManager.getUserIdByLiveChatRoomId(liveChatRoomId);
if (!userId) {
  console.log('--- [agentToUser] --- No user session found for this live chat room.');
  return res.status(200).send('No user session found.');
}

// Reset inactivity timer for the user
if (roomManager.isTimerRunning(userId)) {
  console.log(`--- [agentToUser] --- Resetting inactivity timer for user "${userId}".`);
  roomManager.stopInactivityTimer(userId);
}
roomManager.startInactivityTimer(userId, closeRoom);

// **Send the agent's message to the agent's own conversation with rocket.cat**
console.log(`--- [agentToUser] --- Sending message to agent's own conversation with rocket.cat.`);
await sendToRocketCatWithAgent(messageText, senderId);

// **rocket.cat forwards the message to the user's room**
// Get the user's room ID
const userRoomId = roomManager.getUserRoomId(userId);
if (!userRoomId) {
  console.error(`--- [agentToUser] --- User room ID not found for user "${userId}".`);
  return res.status(500).send('User room ID not found.');
}

console.log(`--- [agentToUser] --- Forwarding message to user room "${userRoomId}". Message: "${messageText}"`);

// Send the agent's message to the user's room via rocket.cat
const success = await sendToUserWithRocketCat(userRoomId, messageText);

if (success) {
  console.log('--- [agentToUser] --- Message successfully forwarded to user.');
  res.status(200).send('Message forwarded to user.');
} else {
  console.error('--- [agentToUser] --- Failed to forward message to user.');
  res.status(500).send('Failed to forward message to user.');
}
} else {
console.log('--- [agentToUser] --- Invalid message format received.');
res.status(400).send('Invalid message format.');
}
});

module.exports = router;
