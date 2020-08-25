const Game = require('./game');
const minimalGame = require('./minimal-game');
const minimalPlayer = require('./minimal-player');

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

    this.users = new Map();
    this.playerCount = 0;
    this.savedHands = [];

    this.GAME_IS_PLAYABLE = 2;
    this.gameObject = new Game.Game();
  }

  /**
   * Add the user to the room/ game.
   * Add them to the socket room as well
   */
  add_user(user){
    user.socket.join(this.socketName);
    this.users.set(user.socket.id);
    this.gameObject.add_user(user.userName, user.socket.id);

    var minGameObject = this.prepare_minimal_game();
    this.io.to(user.socket.id).emit("game_state", JSON.stringify(minGameObject));
    user.socket.to(this.socketName).emit("new_user", JSON.stringify(minGameObject.players));
    if (this.gameObject.playerCount >= this.GAME_IS_PLAYABLE){
      console.log("starting game");
      this.start_game();
    }
  }

  remove_user(user){
    this.gameObject.remove_user(user.socket.id);
    this.users.delete(user.socket.id);
    this.playerCount -= 1;
  }

  async start_game(){
    await this.gameObject.new_hand();
    this.update_hand();
  }

  /**
   * UPDATE METHODS
   * These are methods used to update the game state on the player's sides. They will be stripped
   * down and avoid sensitive information.
   */

  /**
   * update_game_state
   * Send the game state to a user
   */
  update_game_state(){
    var strippedGame = this.prepare_minimal_game();
    return strippedGame;
  }

  /**
   * update_hand
   * Updates the hand of each user
   *
   * Go to their socket and tell them their new hand
   */
  update_hand(){
    for (const actor of this.gameObject.players){
      if (actor !== null){
        var socketId = actor.socketId;
        this.io.to(actor.socketId).emit("new_hand", JSON.stringify(actor.hand));
      }
    }
  }

  /**
   * update_players
   * MAYBE UNNECESSARY
   */
  update_players(){
    var playerArray = new Array(this.gameObject.tableSize);
    for (var i = 0; i < this.gameObject.players.length; i++){
      playerArray[i] = this.prepare_minimal_player(this.gameObject.players[i]);
      if (this.gameObject.dealer === i){
        playerArray[i].dealer = true;
      }
    }
    return playerArray;
  }

  /**
   * DATA PREPARATION METHODS
   */
  prepare_minimal_game(){
    const minimalGameState = new minimalGame.MinimalGame();
    minimalGameState.sharedCards = this.gameObject.sharedCards;
    minimalGameState.dealer = this.gameObject.dealer;
    minimalGameState.pot = this.gameObject.pot;

    for (var i = 0; i < this.gameObject.players.length; i++){
      minimalGameState.players[i] = this.prepare_minimal_player(this.gameObject.players[i]);
      if (minimalGameState.dealer === i && minimalGameState.players[i] !== null){
        minimalGameState.players[i].dealer = true;
      }
    }
    return minimalGameState;
  }

  prepare_minimal_player(actor){
    if (actor === null){
      return null;
    }
    const minimalPlayerObject = new minimalPlayer.MinimalPlayer(actor.name, actor.socketId);
    minimalPlayerObject.stack = actor.stack;
    minimalPlayerObject.folded = actor.folded;
    minimalPlayerObject.dealer = actor.dealer;
    minimalPlayerObject.totalInvestment = actor.totalInvestment;
    return minimalPlayerObject;
  }
}

module.exports = {
  GameController,
};
