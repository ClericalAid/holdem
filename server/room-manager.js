const game_controller = require('./game-controller');

/**
 * RoomManager
 * Keeps track of all of the rooms:
 *
 * Places users in desired/ selected rooms
 *
 * io - The main socket (socket.io for docs). We give this socket to each room so it can perform
 *  its own communications
 *
 * roomMap - Maps room names to actual rooms. This is for users looking to join a room
 *
 * socketRoomMap - Maps sockets to rooms. This allows us to remove a user from a room when their
 *  socket closes
 */
class RoomManager{
  constructor(socket){
    this.roomMap = new Map();
    this.io = socket;
    this.socketRoomMap = new Map();
  }

  /**
   * Join a room and if it doeesn't exist, create it?
   */
  join_room(user, roomName){
    if (!this.roomMap.has(roomName)){
      this.create_room(roomName);
    }
    var currRoom = this.roomMap.get(roomName);
    currRoom.add_user(user);
    this.socketRoomMap.set(user.socket.id, currRoom);
  }

  /**
   * Create the room
   */
  create_room(roomName){
    var newRoom = new game_controller.GameController(roomName, this.io);
    this.roomMap.set(newRoom.roomName, newRoom);
  }

  disconnect_user(user){
    if (!this.socketRoomMap.has(user.socket.id)){
      return;
    }
    console.log("ROOM_MANAGER REMOVING USER with socket.id: " + user.socket.id);
    var currRoom = this.socketRoomMap.get(user.socket.id);
    currRoom.remove_user(user);
    this.socketRoomMap.delete(user.socket.id);
  }
}

module.exports = {
  RoomManager,
};
