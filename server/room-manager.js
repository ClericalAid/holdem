const game_controller = require('./game-controller');

/**
 * RoomManager
 * Keeps track of all of the rooms:
 *  Places users/ sockets in the selected rooms
 *  Tracks which socket is in which room
 *
 * In the future, this class will be managing multi-table tournaments where users are shuffled
 * around depending on their stack size. I will look into table balancing and how other poker
 * sites do it.
 *
 * Member variables:
 * io - The main socket (socket.io for docs). We give this socket to each room so it can perform
 *  its own communications
 * roomMap - Maps room names to actual rooms. This is for users looking to join a room
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
   * join_room
   * Join a room and if it doeesn't exist, create it?
   *
   * TODO: Address whether or not this function should be creating rooms as opposed to
   * returning an error
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
   * leave_room
   * Ejects a user from their current room
   */
  leave_room(user, roomName){
    if (!this.socketRoomMap.has(user.socket.id)){
      return;
    }
    var currRoom = this.socketRoomMap.get(user.socket.id);
    currRoom.disconnect_user(user);
    this.socketRoomMap.delete(user.socket.id);
  }

  /**
   * create_room
   * Creates a room
   */
  create_room(roomName){
    var newRoom = new game_controller.GameController(roomName, this.io);
    this.roomMap.set(newRoom.roomName, newRoom);
  }

  /**
   * get_room_list
   * Returns a list of all the rooms
   */
  get_room_list(){
    var retArray = Array.from(this.roomMap.keys());
    return retArray;
  }
}

module.exports = {
  RoomManager,
};
