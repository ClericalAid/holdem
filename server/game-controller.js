const Game = require('./game');
const minimalGame = require('./minimal-game');
const minimalPlayer = require('./minimal-player');
const playerActions = require('./player-actions');
const gameControllerSocket = require('./game-controller-socket');

/**
 * GameController
 * Wraps the game object and provides an interface for users to interact with the game object.
 * 
 * Member variables:
 * Constants:
 * GAME_IS_PLAYABLE - How many players are necessary for the game to start
 *
 * Room designations:
 * roomName - The name of the room, this is used for managing rooms
 * socketName - The name of the 'socket.io room' for communication purposes
 * io - The server socket which can communicate to users
 * automaticMode - A boolean to select if a room is manually controlled or not
 * 
 * User management and communication:
 * userSocketBindings - A map which associates a user to their callback functions
 * cardCount - How many shared cards have been dealt. Flop = 3, turn = 4, river = 5
 * gameIsRunning - Is true when the game is currently running, in case there are multiple calls
 *    to start the game somehow
 *
 * Game object:
 * gameObject - The game object which handles running the poker game
 * gameStartCount - We don't always want the game to just immediately start with just 2 players
 *    e.g. we are filling up tables for a tournament
 */
class GameController{
  constructor(roomName, socket){
    // Constants
    this.GAME_IS_PLAYABLE = 2;

    // Room designations
    this.roomName = roomName;
    this.socketName = "ROOM_" + roomName;
    this.io = socket;
    this.automaticMode = false;

    // User management and communications
    this.userSocketBindings = new Map();
    this.observers = new Map();
    this.cardCount = 0;
    this.gameIsRunning = false;

    // Game parameters
    this.gameObject = new Game.Game();
    this.gameObject.gameController = this;
    this.gameStartCount = 2;
  }

  /**
   * add_user
   * input:
   *  user - The user which we are adding to this room
   *
   * Adds the user to the room and sets up the user to interact with the game room.
   *
   * If we are in automatic mode, then the game automatically starts once we have enough players
   */
  add_user(user){
    user.socket.join(this.socketName);
    this.gameObject.add_user(user);
    this.setup_user_callbacks(user.socket);

    var minGameObject = this.prepare_minimal_game();
    this.io.to(user.socket.id).emit("game_state", minGameObject);

    var newPlayerIndex = this.gameObject.lastAddedPlayer;
    var newPlayer = minGameObject.players[newPlayerIndex];
    user.socket.to(this.socketName).emit("new_user", [newPlayer, newPlayerIndex]);
    if (this.gameObject.playerCount == this.GAME_IS_PLAYABLE && this.automaticMode){
      console.log("starting game");
      console.log(this.automaticMode);
      this.start_game();
    }
  }

  /**
   * remove_player
   * Notifies the room that a player has been removed
   */
  remove_player(playerIndex){
    this.io.to(this.socketName).emit("remove_user",playerIndex);
  }

  /**
   * disconnect_user
   * input:
   *    user
   * Make the user check/fold until the hand ends, at which point they get removed
   * 1)
   *    If the game is not done, we might have disconnected the active user
   *    This can be handled by just telling us to update the current actor. It's cheeky, but
   *    it will work
   */
  disconnect_user(user){
    this.gameObject.disconnect_user(user);
    var playerIndex = this.gameObject.lastDisconnectedPlayer;
    this.unbind_user_callbacks(user.socket);
    this.userSocketBindings.delete(user.socket.id);
    user.socket.leave(this.socketName);

    // 1)
    if (this.gameObject.handDone === false){
      this.update_actor();
    }
  }

  /**
   * disconnected_user_action
   * Make the disconnected user act
   */
  disconnected_user_action(){
    console.log("A disconnected user is acting");
    if (this.gameObject.current_actor().canFold){
      this.gameObject.fold();
    }
    else{
      this.gameObject.call();
    }

    this.update_actor();
    this.update_cards();
    this.update_active_player();
  }

  /**
   * kick_user
   * input:
   *    user - The user which is getting removed
   * Removes the user, against their will (they reached 0 chips or something like that) give them a
   * message indicating that they lost
   */
  kick_user(user){
    this.io.to(user.socket.id).emit("user_lost", null);
    this.remove_user(user)
  }

  /**
   * convert_player_to_observer
   * input:
   *  user - The user which we are moving over to an observer
   * IMPORTANT:
   * Function not implemented yet, observer feature will not exist for now. Keep the game as basic
   * as possible
   */
  convert_player_to_observer(user){
    this.unbind_user_callbacks(user.socket);
    this.userSocketBindings.delete(user.socket.id);
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
   *
   * TODO:
   *  Fix the interaction between this function and the add_user function. Depends on the game
   *  mode I want to try and introduce
   */
  hand_done = () => {
    this.update_cards();
    this.disable_all_players();
    this.update_win_chips();
    this.gameIsRunning = false;
    if (this.gameObject.playerCount >= this.GAME_IS_PLAYABLE){
      setTimeout(this.start_game, 2000);
    }
  }

  /**
   * start_game
   * Begins the game and informs the user of the new board state of said fresh game
   *
   * If the game is not playable, do not begin
   * If the game is already running, do not try to run it again
   */
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
    this.update_active_player();
    this.update_dealer();
  }

  /**
   * UPDATE METHODS
   * These are methods used to update the game state on the player's sides. They will be stripped
   * down to avoid sensitive information
   */

  /**
   * update_game_state
   * Send a barebones gamestate to the user which is enough for them to play, but does not tell
   * them any sensitive information i.e. the deck state, other player's hands, etc
   */
  update_game_state(){
    var strippedGame = this.prepare_minimal_game();
    return strippedGame;
  }

  /**
   * update_dealer
   * Move the dealer token
   */
  update_dealer(){
    this.io.to(this.socketName).emit("dealer", this.gameObject.dealer);
  }

  /**
   * update_active_player
   * Inform the room of which player is currently acting
   */
  update_active_player(){
    this.io.to(this.socketName).emit("active_player", this.gameObject.actor);
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
   * update_actor
   * Tell the current actor it's their turn
   * Tell them all of their valid moves
   *
   * Weird cases:
   * 1) We are in a case where we are updating a null actor (why does this happen?)
   * Test case 1:
   * 3 users in game
   * First user raises, then leaves (2 players left)
   * The user who is not acting leaves (1 player left in the game, the actor)
   * The actor folds
   *
   * It seems that there are two players who leave the game, in specific seats:
   * 1 is ending the action (the hand will end if this user folds)
   * 1 is the last raiser (the action will end on them, and the hand will end on them unless
   * somebody else raises)
   *
   * The hand ends, the users are removed, but the next actor has been updated to the last raiser
   * (this is correct)
   * However, the game ends here because the last raiser is now the current actor (again, this is
   * correct)
   * The game has ended, and the players get removed (expected behaviour)
   * We make a call to update the next actor as part of our game flow
   * We are looking at a null actor because the last raiser ended the action, and was removed
   *
   * Alternative:
   * Check if the hand is done, instead of if user is null
   * Checking for null user catches too many exceptions which might actually lead to a crash
   *
   * 2) The actor is a disconnected user
   *    Make them perform the default action for a disconnected user
   */
  update_actor(){
    var currActor = this.gameObject.current_actor();

    // 1)
    if (currActor === null){
      console.log("Tried to update a null actor, most likely somebody left the game");
      return;
    }

    // 2)
    if (currActor.disconnected === true){
      this.disconnected_user_action();
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
   * to disable all players (it does this in its own hand_done function).
   *
   * TODO: Stress test people trying to mess with the game state when they should be disabled
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
   *
   * If the gameObject disables all players, then calling update_all_players after the game
   * object disables them should suffice. I don't know what I want to do with this honestly
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
   * Inform the room of a player's bet amount
   */
  update_bet(betAmount, index){
    this.io.to(this.socketName).emit("update_bet", [betAmount, index]);
  }

  /**
   * update_fold
   * Notify people that a player has folded
   */
  update_fold(playerIndex){
    this.io.to(this.socketName).emit("fold", playerIndex);
  }
  /**
   * update_player_chips
   * Brute force update all of the players' chips
   * This function should be made into a "win chips" function I think
   * TODO: Is this function necessary? Probably remove it
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

  /**
   * update_win_chips
   * Inform the room of the winnings of each player
   */
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
   * Updates the shared cards if a new card was dealt to the centre
   */
  update_cards(){
    if (this.gameObject.sharedCards.length > this.cardCount){
      this.cardCount = this.gameObject.sharedCards.length;
      this.io.to(this.socketName).emit("shared_cards", this.gameObject.sharedCards);
    }
  }

  /**
   * DATA PREPARATION METHODS
   * They make sure we only send sensitive information to the right people
   */

  /**
   * prepare_minimal_game
   * Prepares a stripped down gamestate which can be sent to users without any fear
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

  /**
   * prepare_minimal_player
   * Prepares a stripped down player object which has no hand information, and ideally
   * no socket information, unique user ID, etc.
   */
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
   * input:
   *  socket - The socket which is associated to the user. If it raises an event, we react
   *    accordingly
   *
   * Generates the callback functions for the socket.io events, and assigns them accordingly. The
   * collection of user-socket functions are also saved in a map for unbinding them later
   */
  setup_user_callbacks(socket){
    var userCallbacks = gameControllerSocket(this, socket);

    socket.on("call", userCallbacks.handle_call);
    socket.on("raise", userCallbacks.handle_raise);
    socket.on("all_in", userCallbacks.handle_all_in);
    socket.on("fold", userCallbacks.handle_fold);
    socket.on("start_game", userCallbacks.handle_start_game);
    socket.on("print_board", userCallbacks.handle_print_board);
    socket.on("reset_gamestate", userCallbacks.handle_reset_gamestate);

    this.userSocketBindings.set(socket.id, userCallbacks);
  }

  /**
   * unbind_user_callbacks
   * input:
   *  socket - The user's socket which is being unbound from this room
   *
   * Unbinds the callback functions from the user's socket. If they join another room, these same
   * events are assigned to them which leads to a lot of weird behaviour.
   */
  unbind_user_callbacks(socket){
    var userCallbacks = this.userSocketBindings.get(socket.id);
    socket.removeListener("call", userCallbacks.handle_call);
    socket.removeListener("raise", userCallbacks.handle_raise);
    socket.removeListener("all_in", userCallbacks.handle_all_in);
    socket.removeListener("fold", userCallbacks.handle_fold);
    socket.removeListener("start_game", userCallbacks.handle_start_game);
    socket.removeListener("print_board", userCallbacks.handle_print_board);
    socket.removeListener("reset_gamestate", userCallbacks.handle_reset_gamestate);
  }
}

module.exports = {
  GameController,
};
