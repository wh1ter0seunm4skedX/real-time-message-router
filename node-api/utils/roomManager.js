const roomData = {
    userRoomId: null,
    liveChatRoomId: null,
  };
  
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
  
  module.exports = {
    setUserRoomId,
    getUserRoomId,
    setLiveChatRoomId,
    getLiveChatRoomId,
  };
  