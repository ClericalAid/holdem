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
    this.io = socket;

    //this.tableSize = 6;
    //this.users.fill(null);
    this.users = new Map();
    this.playerCount = 0;
    this.savedHands = [];

    this.GAME_IS_PLAYABLE = 2;
    this.gameObject = new Game.Game();
  }

  add_user(user){
    user.socket.join(this.socketName);
    this.users.set(user.socket.id);
    this.gameObject.add_user(user);
    this.io.to(this.socketName).emit("GAME_STATE", JSON.stringify(this.gameObject));
    this.playerCount += 1;
    if (this.playerCount > this.GAME_IS_PLAYABLE){
    }
    //this.io.to(user.socket.id).emit(this.gameObject);
    //user.socket.to(this.socketName).emit("NEW_USER", user);
  }

  remove_user(user){
    this.gameObject.remove_user(user);
    this.users.delete(user.socket.id);
    this.playerCount -= 1;
  }

  start_game(){
    this.gameObject.new_hand();
  }

  /**
   * Hides all players hands, so memory reading doesn't allow cheating
   *
   * Standard operating procedure:
   * 1) Obfuscate game state
   * 2) Send obfuscated game stae
   * 3) Restore game state and resume
   */
  obfuscate_game_state(){
    for (const player of this.gameObject.players){
      if (player != null){
        this.savedHands.push(player.hand);
        player.hand = [null, null];
      }
      else{
        this.savedHands.push(null);
      }
    }
  }

  /**
   * Restores the game state after being obfuscated
   */
  restore_game_state(){
  }
}

module.exports = {
  GameController,
};
