// roomManager.js

const sessions = new Map(); // Map to hold session data for each userId
const TIMEOUT_DURATION = 30 * 1000; // Timeout duration in milliseconds

function getSession(userId) {
  if (!sessions.has(userId)) {
    // Initialize session data for new user
    sessions.set(userId, {
      userRoomId: null,        // Room ID for the user session (his rocket.cat room)
      liveChatRoomId: null,    // Room ID for the live chat session
      lastMessageTime: null,   // Timestamp of the last message
      closeTimeout: null,      // Timeout for closing the session
      userToken: null,         // Token for the user session
      countDownInterval: null, // Interval for countdown
      timeoutDuration: TIMEOUT_DURATION
    });
  }
  return sessions.get(userId);
}

function getUserIdByLiveChatRoomId(liveChatRoomId) {
  for (let [userId, session] of sessions) {
    if (session.liveChatRoomId === liveChatRoomId) {
      return userId;
    }
  }
  return null;
}
function setUserRoomId(userId, roomId) {
  const session = getSession(userId);
  session.userRoomId = roomId;
}

function getUserRoomId(userId) {
  const session = getSession(userId);
  return session.userRoomId;
}

function setLiveChatRoomId(userId, roomId) {
  const session = getSession(userId);
  session.liveChatRoomId = roomId;
}

function getLiveChatRoomId(userId) {
  const session = getSession(userId);
  return session.liveChatRoomId;
}

function setLastMessageTime(userId, time) {
  const session = getSession(userId);
  session.lastMessageTime = time;
}

function getLastMessageTime(userId) {
  const session = getSession(userId);
  return session.lastMessageTime;
}

function setUserToken(userId, token) {
  const session = getSession(userId);
  session.userToken = token;
}

function getUserToken(userId) {
  const session = getSession(userId);
  return session.userToken;
}

function startInactivityTimer(userId, callback) {
  const session = getSession(userId);
  stopInactivityTimer(userId); // Stop the timer if it's already running

  let remainingTime = session.timeoutDuration / 1000;

  session.countDownInterval = setInterval(() => {
    remainingTime--;
    console.log(`User ${userId} Timer: ${remainingTime} seconds remaining...`);

    if (remainingTime <= 0) {
      clearInterval(session.countDownInterval);
      session.countDownInterval = null;
    }
  }, 1000);

  session.closeTimeout = setTimeout(() => {
    clearInterval(session.countDownInterval); // Clear the countdown interval
    session.countDownInterval = null;
    callback(userId); // Execute callback when timeout is reached, passing userId
  }, session.timeoutDuration);
}

function stopInactivityTimer(userId) {
  const session = getSession(userId);

  if (session.closeTimeout) {
    clearTimeout(session.closeTimeout);
    session.closeTimeout = null;
  }
  if (session.countDownInterval) {
    clearInterval(session.countDownInterval);
    session.countDownInterval = null;
  }
}

function isTimerRunning(userId) {
  const session = getSession(userId);
  return session.closeTimeout !== null || session.countDownInterval !== null;
}

function resetRoomData(userId) {
  sessions.delete(userId);
}

function getTimeoutDuration() {
  return TIMEOUT_DURATION;
}



module.exports = {
  sessions, 
  getUserIdByLiveChatRoomId, 
  setUserRoomId,
  getUserRoomId,
  setLiveChatRoomId,
  getLiveChatRoomId,
  setUserToken,
  getUserToken,
  setLastMessageTime,
  getLastMessageTime,
  startInactivityTimer,
  stopInactivityTimer,
  getTimeoutDuration,
  resetRoomData,
  isTimerRunning
};
