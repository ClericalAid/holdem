const Game = require('./game');
const minimalGame = require('./minimal-game');
const minimalPlayer = require('./minimal-player');
const playerActions = require('./player-actions');
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
    this.cardCount = 0;
    this.gameIsRunning = false;

    // For debugging purposes, don't start the game until 3 players are present
    this.GAME_IS_PLAYABLE = 2;
    this.gameObject = new Game.Game();
    this.gameObject.gameController = this;
  }

  /**
   * Add the user to the room/ game.
   * Add them to the socket room as well
   * Setup their callbacks
   */
  add_user(user){
    user.socket.join(this.socketName);
    this.users.set(user.socket.id);
    this.gameObject.add_user(user.userName, user.socket.id);
    this.setup_user_callbacks(user.socket);

    var minGameObject = this.prepare_minimal_game();
    this.io.to(user.socket.id).emit("game_state", minGameObject);

    var newPlayerIndex = this.gameObject.lastAddedPlayer;
    var newPlayer = minGameObject.players[newPlayerIndex];
    user.socket.to(this.socketName).emit("new_user", [newPlayer, newPlayerIndex]);
    if (this.gameObject.playerCount == this.GAME_IS_PLAYABLE){
      console.log("starting game");
      this.start_game();
    }
  }

  remove_user(user){
    this.gameObject.remove_user(user.socket.id);
    user.socket.leave(this.socketName);
    this.users.delete(user.socket.id);
    var playerIndex = this.gameObject.lastRemovedPlayer;
    this.io.to(this.socketName).emit("remove_user",playerIndex);

    this.update_actor();
  }

  /**
   * hand_done
   * Basic clean up and management of the players.
   *
   * Shenanigans start to happen when we start a new game. A second player joining starts a game,
   * but so does this callback after 3 seconds. I will map out some desired behaviour here to
   * give this function a more clear direction.
   *
   * One player alone:
   *  Game does not start (c'est logique)
   *
   * Another player joins:
   *  Game starts immediately (okay)
   *
   * Hand ends and the game is playable:
   *  Start up another hand (okay)
   *
   * Another player joins while the hand has ended, but the game is still playable:
   *  Follow the normal game flow (i.e. this function takes prio)
   *
   * End result:
   *  This function checks if the game is playable, or more than playable.
   *  The add_user function checks if the game just became playable. Otherwise, a new player
   *  interrupts the currently running game.
   */
  hand_done(){
    this.update_cards();
    this.disable_all_players();
    this.update_win_chips();
    this.gameIsRunning = false;
    if (this.gameObject.playerCount >= this.GAME_IS_PLAYABLE){
      setTimeout(this.start_game, 3000);
    }
  }

  start_game = async () => {
    if (this.gameObject.playerCount < this.GAME_IS_PLAYABLE){
      return;
    }
    if (this.gameIsRunning){
      console.log("Game already running!");
      return;
    }
    this.gameIsRunning = true;
    await this.gameObject.new_hand();
    this.cardCount = 0;

    var smallBlindIndex = this.gameObject.smallBlindSeat;
    var smallBlindBetAmount = this.gameObject.players[smallBlindIndex].totalInvestment;
    var bigBlindIndex = this.gameObject.bigBlindSeat;
    var bigBlindBetAmount = this.gameObject.players[bigBlindIndex].totalInvestment;

    this.update_hand();
    this.update_bet(smallBlindBetAmount, smallBlindIndex);
    this.update_bet(bigBlindBetAmount, bigBlindIndex);
    this.update_actor();
    this.update_dealer();
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
   * update_dealer
   */
  update_dealer(){
    this.io.to(this.socketName).emit("dealer", this.gameObject.dealer);
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
   * update_actor
   * Tell the actor it's his turn
   * Tell the actor all of their valid moves
   */
  update_actor(){
    var currActor = this.gameObject.current_actor();
    if (currActor === null){
      console.log("Tried to update a null actor, most likely somebody left the game");
      return;
    }
    var validMoves = new playerActions.PlayerActions();
    validMoves.import_from_player(currActor);
    this.io.to(currActor.socketId).emit("valid_moves", validMoves);
  }

  /**
   * disable_all_players
   * Disables all players in the game. This is called when the hand is done, so that the players'
   * clients do not bug out/ act inconsistently. The game object itself is relatively safe and
   * should not be effected even if a player does get to send commands though.
   *
   * This is technically a double redundancy, and the gameObject should have its own function
   * to disable all players (it does this in its own hand_done function)
   */
  disable_all_players(){
    var allPlayers = this.gameObject.players;
    for (const currActor of allPlayers){
      if (currActor !== null){
        currActor.disable_moves();
        var validMoves = new playerActions.PlayerActions();
        validMoves.import_from_player(currActor);
        this.io.to(currActor.socketId).emit("valid_moves", validMoves);
      }
    }
  }

  /**
   * update_all_players
   * Updates all players' moves. I am unsure whether or not disable_all_players or
   * update_all_players is the way to go. Thus they are both here.
   */
  update_all_players(){
    var allPlayers = this.gameObject.players;
    for (const currActor of allPlayers){
      if (currActor !== null){
        var validMoves = new playerActions.PlayerActions();
        validMoves.import_from_player(currActor);
        this.io.to(currActor.socketId).emit("valid_moves", validMoves);
      }
    }
  }

  /**
   * update_bet
   * Update a players bet amount
   */
  update_bet(betAmount, index){
    this.io.to(this.socketName).emit("update_bet", [betAmount, index]);
  }

  /**
   * update_player_chips
   * Brute force update all of the players' chips
   * This function should be made into a "win chips" function I think
   */
  update_player_chips(){
    var allPlayers = this.gameObject.players;
    var allStacks = new Array(allPlayers.length);
    allStacks.fill(null);
    for (var i = 0; i < allPlayers.length; i++){
      if (allPlayers[i] !== null){
        allStacks[i] = allPlayers[i].stack;
      }
    }

    var packet = [allStacks, this.gameObject.potRemainder]
    this.io.to(this.socketName).emit("update_player_chips", packet);
  }

  update_win_chips(){
    var allPlayers = this.gameObject.players;
    for (var i = 0; i < allPlayers.length; i++){
      if (allPlayers[i] !== null){
        var chipWinning = allPlayers[i].chipsWon;
        var playerIndex = i;
        this.io.to(this.socketName).emit("update_win_chips", [chipWinning, playerIndex]);
      }
    }
  }

  /**
   * update_cards
   */
  update_cards(){
    if (this.gameObject.sharedCards.length > this.cardCount){
      this.cardCount = this.gameObject.sharedCards.length;
      this.io.to(this.socketName).emit("shared_cards", this.gameObject.sharedCards);
    }
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

  /**
   * USER SOCKET FUNCTIONS
   */
  /**
   * setup_user_callbacks
   * Let the user interact with the game object
   *
   * Very specific steps to be taken here:
   * 1) Get the current actor's index and object
   * 2) Perform the action
   * 3) Update the bet
   *
   * It has to be in this order, because the "actor" pointer automatically updates when
   * the action is complete.
   */
  setup_user_callbacks(socket){
    socket.on("call", (packet) => {
      if (this.gameObject.current_actor().socketId === socket.id){
        var recentActorIndex = this.gameObject.actor;
        var recentActor = this.gameObject.current_actor();
        var actionSucceeded = this.gameObject.call();
        if (actionSucceeded === false){
          return false;
        }

        var betAmount = recentActor.lastBetSize;
        this.update_bet(betAmount, recentActorIndex);
        this.update_actor();
        this.update_cards();
      }
      else{
        console.log("A user is trying to act out of order");
      }
    });

    socket.on("raise", (raiseAmount) => {
      raiseAmount = parseInt(raiseAmount);
      if (this.gameObject.current_actor().socketId === socket.id){
        var recentActorIndex = this.gameObject.actor;
        var recentActor = this.gameObject.current_actor();
        var actionSucceeded = this.gameObject.raise(raiseAmount);
        if (actionSucceeded === false){
          return false;
        }

        var betAmount = recentActor.lastBetSize;
        this.update_bet(betAmount, recentActorIndex);
        this.update_actor();
        this.update_cards();
      }
    });

    socket.on("all_in", (packet) => {
      if (this.gameObject.current_actor().socketId === socket.id){
        var recentActorIndex = this.gameObject.actor;
        var recentActor = this.gameObject.current_actor();
        var actionSucceeded = this.gameObject.all_in();
        if (actionSucceeded === false){
          return false;
        }

        var betAmount = recentActor.lastBetSize;
        this.update_bet(betAmount, recentActorIndex);
        this.update_actor();
        this.update_cards();
      }
    });

    socket.on("fold", (packet) => {
      if (this.gameObject.current_actor().socketId === socket.id){
        var recentActorIndex = this.gameObject.actor;
        var recentActor = this.gameObject.current_actor();
        var actionSucceeded = this.gameObject.fold();
        if (actionSucceeded === false){
          return false;
        }

        this.io.to(this.socketName).emit("fold", recentActorIndex);
        this.update_actor();
        this.update_cards();
      }
    });

    socket.on("print_board", (packet) => {
      console.log("Print was called");
      this.gameObject.print_board();
    });
  }
}

module.exports = {
  GameController,
};
