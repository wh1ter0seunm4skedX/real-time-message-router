// rocketChat.js

const axios = require("axios");
const roomManager = require("../utils/roomManager");
const ROCKET_CHAT_URL = process.env.ROCKET_CHAT_URL;

// Function to determine user type based on senderId
const determineUserType = (senderId) => {
  console.log(`--- [rocketChat.js] --- Received sender ID: ${senderId}`);
  console.log(
    `--- [rocketChat.js] --- Configured Admin User ID: ${process.env.USER_ID_ADMIN}`
  );
  console.log(
    `--- [rocketChat.js] --- Configured Agent User ID: ${process.env.USER_ID_AGENT}`
  );
  console.log(
    `--- [rocketChat.js] --- Configured Regular User ID: ${process.env.USER_ID_USER}`
  );

  if (senderId === process.env.USER_ID_ADMIN) {
    return {
      userType: "admin",
      token: process.env.AUTH_TOKEN_ADMIN,
      userId: process.env.USER_ID_ADMIN,
    };
  } else if (senderId === process.env.USER_ID_AGENT) {
    return {
      userType: "livechat_agent",
      token: process.env.AUTH_TOKEN_AGENT,
      userId: process.env.USER_ID_AGENT,
    };
  } else if (senderId === process.env.USER_ID_USER) {
    return {
      userType: "user",
      token: process.env.AUTH_TOKEN_USER,
      userId: process.env.USER_ID_USER,
    };
  } else {
    console.error(
      `--- [rocketChat.js] --- Error: User ID "${senderId}" does not match any known users.`
    );
    throw new Error("User ID does not match any known users.");
  }
};

// Function to get authentication headers based on user type
const getAuthHeaders = (senderId) => {
  try {
    const { userType, token, userId } = determineUserType(senderId);
    console.log(
      `--- [rocketChat.js] --- User type: ${userType}, Token: ${token}, User ID: ${userId}`
    ); // Display user details
    return {
      "X-Auth-Token": token,
      "X-User-Id": userId,
    };
  } catch (error) {
    console.error(
      "--- [rocketChat.js] --- Failed to determine user type:",
      error.message
    );
    throw error;
  }
};

async function createOmnichannelContact(senderId, token, name) {
  try {
    const headers = getAuthHeaders(senderId);

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
    const headers = getAuthHeaders(senderId);

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
async function sendMessage(channel, text, senderId, isSystemMessage = false) {
  try {
    const message = isSystemMessage ? `${text} [SYSTEM]` : text;
    const headers = getAuthHeaders(senderId);

    console.log(
      `--- [rocketChat.js] --- Sending message to channel ${channel} with senderId ${senderId}`
    );
    await axios.post(
      `${ROCKET_CHAT_URL}/api/v1/chat.postMessage`,
      {
        text: message,
        channel,
      },
      { headers }
    );

    console.log(
      `--- [rocketChat.js] --- Message sent to channel ${channel}: ${message}`
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
    const headers = getAuthHeaders(agentId); // Using agent credentials

    // Here we try two different channel formats to send the message
    let channel1 = `rocket.cat${agentId}`;
    let channel2 = `${agentId}rocket.cat`;

    // Check if message is already from rocket.cat
    if (agentId === process.env.USER_ID_ROCKETCAT) {
      console.log(
        "--- [rocketChat.js] --- Message is already from rocket.cat, not sending again to avoid loop."
      );
      return; // Avoid loop
    }

    console.log(
      `--- [rocketChat.js] --- Attempting to send message to rocket.cat for agent ${agentId}`
    );

    // Try first channel format
    console.log(
      `--- [rocketChat.js] --- Sending message to channel (format 1): ${channel1}`
    );
    let response = await axios.post(
      `${ROCKET_CHAT_URL}/api/v1/chat.postMessage`,
      {
        text: messageText,
        channel: channel1,
      },
      { headers }
    );

    if (!response.data.success) {
      // If the first format fails, try the second
      console.log(
        `--- [rocketChat.js] --- First channel format failed: ${channel1}, trying ${channel2}`
      );
      response = await axios.post(
        `${ROCKET_CHAT_URL}/api/v1/chat.postMessage`,
        {
          text: messageText,
          channel: channel2,
        },
        { headers }
      );
    }

    if (response.data.success) {
      console.log(
        `--- [rocketChat.js] --- Message sent to agent's room with rocket.cat: ${messageText}`
      );
    } else {
      console.error(
        "--- [rocketChat.js] --- Failed to send message to agent room with rocket.cat:",
        response.data.error
      );
    }
  } catch (error) {
    console.error(
      "--- [rocketChat.js] --- Error sending message to agent room with rocket.cat:",
      error.response ? error.response.data : error.message
    );
  }
}

async function sendToUserWithRocketCat(userRoomId, messageText) {
  try {
    if (!userRoomId) {
      console.error(
        "--- [rocketChat.js] --- User room ID is not set. Cannot send message."
      );
      return false;
    }

    const headers = {
      "X-Auth-Token": process.env.AUTH_TOKEN_ROCKETCAT,
      "X-User-Id": process.env.USER_ID_ROCKETCAT,
    };

    console.log(
      `--- [rocketChat.js] --- Sending message to user room with rocket.cat: ${userRoomId}`
    );


    console.log(
      `--- [rocketChat.js] --- Sending message to user room with rocket.cat: ${channel}`
    );

    let response = await axios.post(
      `${ROCKET_CHAT_URL}/api/v1/chat.postMessage`,
      {
        text: messageText,
        channel: userRoomId,
      },
      { headers }
    );

    if (response.data && response.data.success) {
      console.log(
        `--- [rocketChat.js] --- Message successfully sent to user room: ${channel}`
      );
      return true;
    } else {
      console.error(
        `--- [rocketChat.js] --- Error sending message: ${JSON.stringify(
          response.data
        )}`
      );
    }
  } catch (error) {
    console.error(
      "--- [rocketChat.js] --- Error sending message to user room with rocket.cat:",
      error.response ? error.response.data : error.message
    );
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
    const userRoomId = roomManager.getUserRoomId(userId);

    console.log(`--- [rocketChat.js] --- Closing room for user ${userId}`);
    console.log(`--- [rocketChat.js] --- liveChatRoomId is: ${liveChatRoomId}`);
    console.log(`--- [rocketChat.js] --- userToken is: ${userToken}`);
    console.log(`--- [rocketChat.js] --- userRoomId is: ${userRoomId}`);

    if (!liveChatRoomId || !userToken) {
      console.error(
        "--- [rocketChat.js] --- Room ID or user token is missing. Cannot close room."
      );
      return;
    }

    const headers = {
      "X-Auth-Token": process.env.AUTH_TOKEN_ROCKETCAT,
      "X-User-Id": process.env.USER_ID_ROCKETCAT,
    };

    if (userRoomId) {
      console.log(`--- [rocketChat.js] --- Sending a message to user room: ${userRoomId}`);
      await sendToUserWithRocketCat(userRoomId, 'The room is closed due to inactivity over 30 seconds');
      console.log(`--- [rocketChat.js] --- System message sent to user room: ${userRoomId}`);
    }

    await axios.post(
      `${ROCKET_CHAT_URL}/api/v1/livechat/room.close`,
      { rid: liveChatRoomId, token: userToken },
      { headers }
    );

    console.log(
      `--- [rocketChat.js] --- Room ${liveChatRoomId} closed due to inactivity.`
    );

    roomManager.resetRoomData(userId);

    await sendMessage(
      liveChatRoomId,
      `The room is closed due to inactivity over x minutes`,
      process.env.USER_ID_AGENT
    ); // Notify user
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
};
