// rocketChat.js

const axios = require("axios");
const roomManager = require("../utils/roomManager");
const ROCKET_CHAT_URL = process.env.ROCKET_CHAT_URL;

// Function to determine user type based on sender ID
async function getUserRoles(userId) {
  try {
    const headers = {
      'X-Auth-Token': process.env.AUTH_TOKEN_ADMIN, // Use admin credentials
      'X-User-Id': process.env.USER_ID_ADMIN,
    };

    const response = await axios.get(`${ROCKET_CHAT_URL}/api/v1/users.info`, {
      headers,
      params: {
        userId: userId,
      },
    });

    if (response.data && response.data.success) {
      const roles = response.data.user.roles;
      console.log(`--- [rocketChat.js] --- User roles for ${userId}:`, roles);
      return roles;
    } else {
      console.error(`--- [rocketChat.js] --- Failed to get user roles:`, response.data.error);
      return [];
    }
  } catch (error) {
    console.error('--- [rocketChat.js] --- Error getting user roles:', error.response ? error.response.data : error.message);
    return [];
  }
}


async function isUserAnAgent(userId) {
  const roles = await getUserRoles(userId);
  return roles.includes('livechat-agent');
}

// Function to determine user type based on sender ID
async function determineUserType(senderId) {
  console.log(`--- [rocketChat.js] --- Received sender ID: ${senderId}`);

  const roles = await getUserRoles(senderId);
  console.log(`--- [rocketChat.js] --- User roles for ${senderId}:`, roles);

  if (roles.includes('admin')) {
    return {
      userType: 'admin',
      token: process.env.AUTH_TOKEN_ADMIN,
      userId: senderId,
    };
  } else if (roles.includes('livechat-agent')) {
    return {
      userType: 'livechat_agent',
      token: process.env.AUTH_TOKEN_AGENT,
      userId: senderId,
    };
  } else {
    return {
      userType: 'user',
      token: process.env.AUTH_TOKEN_USER,
      userId: senderId,
    };
  }
}

// Function to get authentication headers based on user type
async function getAuthHeaders(senderId) {
  try {
    const { userType, token, userId } = await determineUserType(senderId);
    console.log(`--- [rocketChat.js] --- User type: ${userType}, Token: ${token}, User ID: ${userId}`);
    return {
      'X-Auth-Token': token,
      'X-User-Id': userId,
    };
  } catch (error) {
    console.error('--- [rocketChat.js] --- Failed to determine user type:', error.message);
    throw error;
  }
}


async function createOmnichannelContact(senderId, token, name) {
  try {
    const headers = await getAuthHeaders(senderId);

    console.log(
      `--- [rocketChat.js] --- Creating Omnichannel Contact for User ID: ${senderId}, Token: ${token}, User ID: ${headers["X-User-Id"]}`
    );

    const response = await axios.post(
      `${ROCKET_CHAT_URL}/api/v1/omnichannel/contact`,
      {
        token,
        name,
      },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error(
      "--- [rocketChat.js] --- Error creating omnichannel contact:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

async function createLiveChatRoom(senderId, token) {
  try {
    const headers = await getAuthHeaders(senderId);

    console.log(
      `--- [rocketChat.js] --- Creating Live Chat Room for User ID: ${senderId}, Token: ${token}, User ID: ${headers["X-User-Id"]}`
    );

    const response = await axios.get(
      `${ROCKET_CHAT_URL}/api/v1/livechat/room`,
      {
        params: { token },
        headers,
      }
    );
    console.log(
      "--- [rocketChat.js] --- Live chat room created:",
      response.data
    );
    return response.data.room._id;
  } catch (error) {
    console.error(
      "--- [rocketChat.js] --- Error creating live chat room:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

// Function to send a message to a channel
async function sendMessage(roomId, text, senderId, isSystemMessage = false) {
  try {
    const message = isSystemMessage ? `${text} [SYSTEM]` : text;
    const headers = await getAuthHeaders(senderId);

    console.log(
      `--- [rocketChat.js] --- Sending message to room ${roomId} with senderId ${senderId}`
    );
    await axios.post(
      `${ROCKET_CHAT_URL}/api/v1/chat.postMessage`,
      {
        text: message,
        roomId: roomId,
      },
      { headers }
    );

    console.log(
      `--- [rocketChat.js] --- Message sent to room ${roomId}: ${message}`
    );
  } catch (error) {
    console.error(
      "--- [rocketChat.js] --- Error sending message:",
      error.response ? error.response.data : error.message
    );
  }
}


// Function to send a message from agent to agent's room with rocket.cat
async function sendToRocketCatWithAgent(messageText, agentId) {
  try {
    const headers = await getAuthHeaders(agentId);

    // Here we try two different channel formats to send the message
    const channelFormats = [`rocket.cat${agentId}`, `${agentId}rocket.cat`];

    let messageSent = false;

    for (const channel of channelFormats) {
      console.log(`--- [rocketChat.js] --- Trying to send message to channel: ${channel}`);

      const response = await axios.post(
        `${ROCKET_CHAT_URL}/api/v1/chat.postMessage`,
        {
          text: messageText,
          channel: channel,
        },
        { headers }
      );

      if (response.data && response.data.success) {
        console.log(`--- [rocketChat.js] --- Message sent to agent's room with rocket.cat: ${messageText}`);
        messageSent = true;
        break; // Exit loop if message sent successfully
      } else {
        console.error(`--- [rocketChat.js] --- Failed to send message to channel ${channel}:`, response.data.error);
      }
    }

    if (!messageSent) {
      console.error('--- [rocketChat.js] --- Failed to send message to agent room with any known channel format.');
    }
  } catch (error) {
    console.error('--- [rocketChat.js] --- Error sending message to agent room with rocket.cat:', error.response ? error.response.data : error.message);
  }
}

// Function to send a message to a user room with rocket.cat
async function sendToUserWithRocketCat(userRoomId, messageText) {
  try {
    if (!userRoomId) {
      console.error('--- [rocketChat.js] --- User room ID is not set. Cannot send message.');
      return false;
    }

    const headers = {
      'X-Auth-Token': process.env.AUTH_TOKEN_ROCKETCAT,
      'X-User-Id': process.env.USER_ID_ROCKETCAT,
    };

    console.log(`--- [rocketChat.js] --- Sending message to user room with rocket.cat: ${userRoomId}`);

    const response = await axios.post(
      `${ROCKET_CHAT_URL}/api/v1/chat.postMessage`,
      {
        text: messageText,
        channel: userRoomId,
      },
      { headers }
    );

    if (response.data && response.data.success) {
      console.log(`--- [rocketChat.js] --- Message successfully sent to user room: ${userRoomId}`);
      return true;
    } else {
      console.error('--- [rocketChat.js] --- Error sending message:', response.data.error);
    }
  } catch (error) {
    console.error('--- [rocketChat.js] --- Error sending message to user room with rocket.cat:', error.response ? error.response.data : error.message);
  }
  return false;
}



// Function to handle incoming message and reset inactivity timer
async function handleIncomingMessage() {
  try {
    // Update last message time and reset inactivity timer
    roomManager.setLastMessageTime(new Date());

    if (roomManager.isTimerRunning()) {
      console.log(
        "--- [rocketChat.js] --- Timer is already running. Stopping the current timer."
      );
      roomManager.stopInactivityTimer();
    }
    // Start or reset the inactivity timer
    roomManager.startInactivityTimer(closeRoom);

    console.log(
      `--- [rocketChat.js] --- Inactivity timer reset for room ${roomId}`
    );
  } catch (error) {
    console.error(
      "--- [rocketChat.js] --- Error handling incoming message:",
      error.message
    );
  }
}

// Function to close the room due to inactivity
async function closeRoom(userId) {
  try {
    const liveChatRoomId = roomManager.getLiveChatRoomId(userId);
    const userToken = roomManager.getUserToken(userId);

    console.log(`--- [rocketChat.js] --- Closing room for user ${userId}`);

    if (!liveChatRoomId || !userToken) {
      console.error("--- [rocketChat.js] --- Missing room ID or user token.");
      return;
    }

    // Send message to user before closing
    await sendToUserWithRocketCat(userId, 'The room is closed due to inactivity over 30 seconds');
    console.log(`--- [rocketChat.js] --- Notified user ${userId} about room closure.`);

    // Close the live chat room
    const headers = {
      'X-Auth-Token': process.env.AUTH_TOKEN_ROCKETCAT,
      'X-User-Id': process.env.USER_ID_ROCKETCAT,
    };

    await axios.post(
      `${ROCKET_CHAT_URL}/api/v1/livechat/room.close`,
      { rid: liveChatRoomId, token: userToken },
      { headers }
    );

    console.log(`--- [rocketChat.js] --- Live chat room ${liveChatRoomId} closed.`);

    // Reset session data
    roomManager.resetRoomData(userId);

  } catch (error) {
    console.error("--- [rocketChat.js] --- Error closing room:", error.message);
  }
}


module.exports = {
  handleIncomingMessage,
  closeRoom,
  sendToRocketCatWithAgent,
  sendToUserWithRocketCat,
  sendMessage,
  createOmnichannelContact,
  createLiveChatRoom,
  getUserRoles,
  isUserAnAgent
};
