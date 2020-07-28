const game_controller = require('./game-controller');

/**
 * RoomManager
 * Keeps track of all of the rooms:
 *
 * Places users in desired/ selected rooms
 */
class RoomManager{
  constructor(socket){
    this.roomMap = new Map();
  }

  /**
   * Join a room and if it doeesn't exist, create it?
   */
  join_room(user, roomName, io){
    if (!this.roomMap.has(roomName)){
      this.create_room(user, roomName, io);
    }
    var currRoom = this.roomMap.get(roomName);
    currRoom.add_user(user);
  }

  /**
   * Create the room
   */
  create_room(user, roomName, io){
      var newRoom = new game_controller.GameController(roomName, io);
      this.roomMap.set(newRoom.roomName, newRoom);
  }
}

module.exports = {
  RoomManager,
};
