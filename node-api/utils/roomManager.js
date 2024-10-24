const roomData = {};  

function initializeUserRoomData(userId) {
    if (!roomData[userId]) {
        roomData[userId] = {
            userRoomId: null, 
            liveChatRoomId: null, 
            lastMessageTime: null, 
            closeTimeout: null, 
            userVisitorToken: null,  
            userAuthToken: null,  
            agentAuthToken: null, 
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

function setUserVisitorToken(userId, token) {
    initializeUserRoomData(userId);
    roomData[userId].userVisitorToken = token;
}

function getUserVisitorToken(userId) {
    return roomData[userId]?.userVisitorToken || null;
}

function setUserAuthToken(userId, token) {
    initializeUserRoomData(userId);
    roomData[userId].userAuthToken = token;
}

function getUserAuthToken(userId) {
    return roomData[userId]?.userAuthToken || null;
}

function setAgentAuthToken(userId, token) {
    initializeUserRoomData(userId);
    roomData[userId].agentAuthToken = token;
}

function getAgentAuthToken(userId) {
    return roomData[userId]?.agentAuthToken || null;
}

function startInactivityTimer(userId, callback) {
    initializeUserRoomData(userId);
    stopInactivityTimer(userId);

    let remainingTime = roomData[userId].timeoutDuration / 1000;

    roomData[userId].countDownInterval = setInterval(() => {
        remainingTime--;
        if (remainingTime <= 0) {
            clearInterval(roomData[userId].countDownInterval);
            if (typeof callback === 'function') {
                callback(userId);
            }
        }
    }, 1000);

    roomData[userId].closeTimeout = setTimeout(() => {
        clearInterval(roomData[userId].countDownInterval);
        if (typeof callback === 'function') {
            callback(userId);
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
        userVisitorToken: null,
        userAuthToken: null,
        agentAuthToken: null,
        lastMessageTime: null
    };
    stopInactivityTimer(userId);
}

module.exports = {
    setUserRoomId,
    getUserRoomId,
    setLiveChatRoomId,
    getLiveChatRoomId,
    setUserVisitorToken,
    getUserVisitorToken,
    setUserAuthToken,
    getUserAuthToken,
    setAgentAuthToken,
    getAgentAuthToken,
    startInactivityTimer,
    stopInactivityTimer,
    isTimerRunning,
    resetRoomData,
    initializeUserRoomData
};
