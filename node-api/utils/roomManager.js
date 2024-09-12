const roomData = {
    userRoomId: null, // Room ID for the user session (his rocket.cat room)
    liveChatRoomId: null, // Room ID for the live chat session 
    lastMessageTime: null, // Timestamp of the last message
    closeTimeout: null, // Timeout for closing the session
    userToken: null, // Token for the user session
    countDownInterval: null, // Interval for countdown
    timeoutDuration: 5 * 1000 // Timeout duration
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

  function startInactivityTimer(callback) { 
    stopInactivityTimer();  // Stop the timer if it's already running

    let remainingTime = roomData.timeoutDuration / 1000; 

    roomData.countDownInterval = setInterval(() => {
      remainingTime--;  
      console.log(`Timer: ${remainingTime} seconds remaining...`);
      
      if (remainingTime <= 0) {
        clearInterval(roomData.countDownInterval);
        callback();  // Execute callback when timeout is reached
      }
    }, 1000);

    roomData.closeTimeout = setTimeout(() => {
        clearInterval(roomData.countDownInterval);  // Clear the countdown interval
        callback();  // Execute callback when timeout is reached
    }, roomData.timeoutDuration);
}
  
  function stopInactivityTimer() {
    if(roomData.closeTimeout){
      clearTimeout(roomData.closeTimeout);
      roomData.closeTimeout = null;
    }
    if(roomData.countDownInterval){
      clearInterval(roomData.countDownInterval);
      roomData.countDownInterval = null;
    }
  }

// Function to check if timer is running
function isTimerRunning() {
  return roomData.closeTimeout !== null || roomData.countdownInterval !== null;
}

  // Function to reset room data after inactivity timeout
  function resetRoomData() {
    roomData.userRoomId = null;
    roomData.liveChatRoomId = null;
    roomData.userToken = null;
    roomData.lastMessageTime = null;
    stopInactivityTimer();
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
    getTimeoutDuration,
    resetRoomData,
    isTimerRunning
};