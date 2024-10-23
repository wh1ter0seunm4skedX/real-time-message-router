const roomData = {};  

function initializeUserRoomData(userId) {
    if (!roomData[userId]) {
        roomData[userId] = {
            userRoomId: null, 
            liveChatRoomId: null, 
            lastMessageTime: null, 
            closeTimeout: null, 
            userToken: null, 
            countDownInterval: null,
            timeoutDuration: 30 * 1000 
        };
    }
}

function setUserRoomId(userId, roomId) {
    initializeUserRoomData(userId);
    roomData[userId].userRoomId = roomId;
}

function getUserRoomId(userId) {
    return roomData[userId]?.userRoomId || null;
}

function setLiveChatRoomId(userId, roomId) {
    initializeUserRoomData(userId);
    roomData[userId].liveChatRoomId = roomId;
}

function getLiveChatRoomId(userId) {
    return roomData[userId]?.liveChatRoomId || null;
}

function setUserToken(userId, token) {
    initializeUserRoomData(userId);
    roomData[userId].userToken = token;
}

function getUserToken(userId) {
    return roomData[userId]?.userToken || null;
}


/*
function setLastMessageTime(userId, time) {
    getUserData(userId).lastMessageTime = time;
}

function getLastMessageTime(userId) {
    return getUserData(userId).lastMessageTime;
}
*/

function startInactivityTimer(userId, callback) {
    initializeUserRoomData(userId);
    stopInactivityTimer(userId);  // Stop the timer if it's already running

    let remainingTime = roomData[userId].timeoutDuration / 1000;

    roomData[userId].countDownInterval = setInterval(() => {
        remainingTime--;
        console.log(`Timer: ${remainingTime} seconds remaining for user: ${userId}`);

        if (remainingTime <= 0) {
            clearInterval(roomData[userId].countDownInterval);
            if (typeof callback === 'function') {
                callback(userId);  // Pass userId to the callback
            }
        }
    }, 1000);

    roomData[userId].closeTimeout = setTimeout(() => {
        clearInterval(roomData[userId].countDownInterval);
        if (typeof callback === 'function') {
            callback(userId);  // Pass userId to the callback
        }
    }, roomData[userId].timeoutDuration);
}

function stopInactivityTimer(userId) {
    if (roomData[userId]?.closeTimeout) {
        clearTimeout(roomData[userId].closeTimeout);
        roomData[userId].closeTimeout = null;
    }
    if (roomData[userId]?.countDownInterval) {
        clearInterval(roomData[userId].countDownInterval);
        roomData[userId].countDownInterval = null;
    }
}

function isTimerRunning(userId) {
    return roomData[userId]?.closeTimeout !== null || roomData[userId]?.countDownInterval !== null;
}

function resetRoomData(userId) {
    roomData[userId] = {
        userRoomId: null,
        liveChatRoomId: null,
        userToken: null,
        lastMessageTime: null
    };
    stopInactivityTimer(userId);
}

module.exports = {
    setUserRoomId,
    getUserRoomId,
    setLiveChatRoomId,
    getLiveChatRoomId,
    setUserToken,
    getUserToken,
    startInactivityTimer,
    stopInactivityTimer,
    isTimerRunning,
    resetRoomData,
    initializeUserRoomData
};