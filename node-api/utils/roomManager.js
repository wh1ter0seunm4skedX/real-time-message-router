const roomData = {
    userRoomId: null, // Room ID for the user session (his rocket.cat room)
    liveChatRoomId: null, // Room ID for the live chat session 
    lastMessageTime: null, // Timestamp of the last message
    closeTimeout: null, // Timeout for closing the session
    userToken: null, // Token for the user session
    timeoutDuration: 30 * 1000 // Timeout duration (currently set to 30 seconds)
  };
  
  function getTimeoutDuration() {
    return roomData.timeoutDuration;
  }

  function setUserRoomId(roomId) {
    roomData.userRoomId = roomId;
  }
  
  function getUserRoomId() {
    return roomData.userRoomId;
  }
  
  function setLiveChatRoomId(roomId) {
    roomData.liveChatRoomId = roomId;
  }
  
  function getLiveChatRoomId() {
    return roomData.liveChatRoomId;
  }

  function getLastMessageTime() {
    return roomData.lastMessageTime;
  }

  function setLastMessageTime(time) {
    roomData.lastMessageTime = time;
  }

  function setUserToken(token) {
    roomData.userToken = token;
  }

  function getUserToken() {
    return roomData.userToken;
  }

  function startInactivityTimer(callback, timeoutDuration) { 
    if (roomData.closeTimeout) {
        clearTimeout(roomData.closeTimeout);
    }

    const interval = 1000;  // Interval for countdown in milliseconds
    let remainingTime = timeoutDuration / interval;  // Calculate remaining time in seconds

    const countdown = setInterval(() => {
        console.log(`Timer: ${remainingTime} seconds remaining...`);
        remainingTime--;

        if (remainingTime < 0) {
            clearInterval(countdown);
            callback();  // Execute callback when timeout is reached
        }
    }, interval);

    roomData.closeTimeout = setTimeout(() => {
        clearInterval(countdown);  // Clear the countdown interval
        callback();  // Execute callback when timeout is reached
    }, timeoutDuration);
}
  
  function stopInactivityTimer() {
    if(roomData.closeTimeout){
      clearTimeout(roomData.closeTimeout);
      roomData.closeTimeout = null;
    }
  }

  module.exports = {
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
    getTimeoutDuration
};