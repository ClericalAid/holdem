const Game = require('./game');

/**
 *  GameController
 *  Changes the game state (acts upon it with the corresponding functions). Reacts to user
 *  input and notifies users of changes.
 *
 *  Manages users and maps them to players in the game object
 */
class GameController{
  constructor(roomName, socket){
    this.roomName = roomName;
    this.socketName = "ROOM_" + roomName;
    //this.tableSize = 6;
    this.users = new Map();
    //this.users.fill(null);
    this.playerCount = 0;
    this.gameObject = new Game.Game();
    this.io = socket;
  }

  ping_gamestate(){
  }

  deal_hand(){
  }

  add_user(user){
    user.socket.join(this.socketName);
    this.users.set(user.socket.id);
    this.gameObject.add_user(user);
    this.io.to(this.socketName).emit("GAME_STATE", JSON.stringify(this.gameObject));
    //this.io.to(user.socket.id).emit(this.gameObject);
    //user.socket.to(this.socketName).emit("NEW_USER", user);
  }

  remove_user(user){
    this.gameObject.remove_user(user);
    this.users.delete(user.socket.id);
  }
}

module.exports = {
  GameController,
};
