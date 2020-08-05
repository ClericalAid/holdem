const deck = require('./deck');
const player = require('./player');

/**
 * Game
 * Game object which keeps track of the state and flow of the game.
 *
 *
 */
class Game{
  constructor(){
    // consts
    this.PREFLOP = 0;
    this.FLOP = 3
    this.TURN = 4
    this.RIVER = 5
    this.HEADS_UP = 2

    // Game state
    this.tableSize = 6;
    this.players = new Array(this.tableSize);
    this.players.fill(null);
    this.playerCount = 0;
    this.nextEmptySeat = 0;

    this.deck = new deck.Deck();
    this.sharedCards = [];

    this.dealer = 0;
    this.currentActor = -1;
    this.smallBlindSeat = -1;
    this.bigBlindSeat = -1;
    this.smallBlindAmount = 1;
    this.bigBlindAmount = 2;

    // Turn management
    this.actor = 0;
    this.lastRaiser = -1;
    this.foldedPlayers = 0;
    this.allInPlayers = [];
    this.callIn = 0;

    // Pot management
    this.pot = 0;
    this.totalCall = 0;
    this.totalBet = 0;
    this.minRaise = 0;
    this.sidePots = [];
  }

/**
 * MANAGING PLAYERS AND SEATING
 * Seating
 * adding users
 * removing users
 */

  update_next_empty_seat(){
    if (this.playerCount === this.tableSize){
      return;
    }
    for (var i = 0; i < this.tableSize; i++){
      this.nextEmptySeat += 1;
      this.nextEmptySeat = this.nextEmptySeat % this.tableSize;
      if (this.players[this.nextEmptySeat] === null){
        break;
      }
    }
  }

  add_user(user){
    var addPlayer = new player.Player(user);
    this.players[this.nextEmptySeat] = addPlayer;
    this.update_next_empty_seat();
    this.playerCount += 1;
  }

  remove_user(user){
    for (var i = 0; i < this.tableSize; i++){
      if (this.players[i] === null){
      }
      else if (this.players[i].uuid === user.socket.id){
        this.players[i] = null;
      }
    }
    if (this.playerCount === this.tableSize){
      this.update_next_empty_seat();
    }
    this.playerCount -= 1;
  }

  cyclic_increment(incrementNumber, maxNumber){
    incrementNumber += 1;
    incrementNumber = incrementNumber % maxNumber;
    return incrementNumber;
  }

  /**
   * Cycles through and gets us the next player, ignores:
   * "null" players
   * folded players?
   * all in players?
   *
   * If we go to the next round, the next actor needs to reset to after the dealer
   */
  next_player(playerIndex){
    do {
      playerIndex = this.cyclic_increment(playerIndex, this.tableSize);
      if (playerIndex === this.lastRaiser){
        break;
      }
    }while(this.players[playerIndex] === null)

    return playerIndex;
  }

  /**
   * Update actor
   *
   * 1) Keep going to the next player, until we find one who is in the game and needs to decide
   *
   * 2) If we went full circle, back to the agressor, the round ends
   */
  next_actor(){
    do {
      this.actor = this.next_player(this.actor);
    }while(this.current_actor().isAllIn || this.current_actor().folded)

    if (this.actor === this.lastRaiser){
      console.log("Round ending here");
      this.next_round();
    }

    this.valid_moves();
  }

  current_actor(){
    return this.players[this.actor];
  }
/**
 * GAMEFLOW
 */
  async new_hand(){
    this.totalCall = 0;
    this.lastRaiser = -1;
    this.foldedPlayers = 0;
    this.allInPlayers = 0;

    this.dealer = this.next_player(this.dealer);
    this.post_blinds();
    await this.deal_cards();
  }

  valid_moves(){
    if (this.current_actor().totalInvestment === this.smallBlindAmount &&
    this.actor === this.smallBlindSeat){
      this.current_actor().valid_moves(this.totalCall, this.minRaise, true);
    }

    else if (this.current_actor().totalInvestment === this.bigBlindAmount &&
    this.actor === this.bigBlindSeat){
      this.current_actor().valid_moves(this.totalCall, this.minRaise, true);
    }

    else{
      this.current_actor().valid_moves(this.totalCall, this.minRaise);
    }

    return this.current_actor();
  }

  /**
   * If a player goes all in on the blinds, the minimum amount to call is still the big blind
   * amount. The minimum raise is also the big blind amount. This is as per "Robert's Rules of 
   * Poker".
   */
  post_blinds(){
    if (this.playerCount != this.HEADS_UP){
      this.smallBlindSeat = this.next_player(this.dealer);
    }
    else{
      this.smallBlindSeat = this.dealer;
    }
    this.bigBlindSeat = this.next_player(this.smallBlindSeat);

    this.minRaise = this.bigBlindAmount;
    this.totalCall = this.bigBlindAmount;
    this.lastRaiser = this.bigBlindSeat;

    this.pot += this.players[this.smallBlindSeat].place_blind(this.smallBlindAmount);
    this.pot += this.players[this.bigBlindSeat].place_blind(this.bigBlindAmount);
    this.actor = this.next_player(this.bigBlindSeat);
    this.valid_moves();
  }

  async deal_cards(){
    await this.deck.shuffle();
    for (const user of this.players){
      if (user === null){
      }
      else{
        user.draw_card(this.deck);
      }        
    }
    for (const user of this.players){
      if (user === null){
      }
      else{
        user.draw_card(this.deck);
      }        
    }
  }

  check_active_players(){
  }

/**
 * next_round
 * Takes us to the next round of play, when players are done with the betting action.
 * When the betting action is over, there is a chance that a player has won prematurely, or
 * there is an all-in situation that has been called, and we are rushing to the end.
 * 
 * Check if there was a call-in. Let other players call/ fold
 * 
 * Check if the game is stale i.e. all but one are all-in/ folded
 *   Accelerate game to the end
 * 
 * 1)  We are at pre-flop
 *       Go to the flop, 3 cards are added to the shared cards
 * 2)  We are at the flop
 *       Go to the turn, add a card to the shared cards
 * 3)  We are at the turn
 *       Go to the river, add a card to the shared cards
 * 4)  We are at the river
 *       Go to showdown
 */
  next_round(){
    this.check_active_players();

    // 1)
    if (this.sharedCards.length === this.PREFLOP){
      this.flop();
    }
    // 2)
    else if (this.sharedCards.length === this.FLOP){
      this.next_card();
    }
    // 3)
    else if (this.sharedCards.length === this.TURN){
      this.next_card();
    }
    // 4)
    else if (this.sharedCards.length === this.RIVER){
      console.log("IT'S SHOWDOWN BABY!");
      //this.showdown();
    }

  }

  flop(){
    this.lastRaiser = -1;
    this.minRaise = this.bigBlind;
    this.actor = this.dealer;
    this.next_actor();

    this.deck.pop();
    this.sharedCards.push(this.deck.pop());
    this.sharedCards.push(this.deck.pop());
    this.sharedCards.push(this.deck.pop());
  }

  next_card(){
    this.minRaise = this.bigBlind;
    this.actor = this.dealer;
    this.actor = this.next_player(this.actor);

    this.deck.pop();
    this.sharedCards.push(this.deck.pop());
  }

/**
 * PLAYER COMMANDS
 */
  call(){
    var addToPot = this.current_actor().call();
    if (addToPot === false){
      return;
    }
    this.pot += addToPot;
    if (this.lastRaiser === -1){
      this.lastRaiser = this.actor;
    }
    this.next_actor();
  }

  raise(amount){
    var addToPot = this.current_actor().raise(amount);
    if (addToPot === false){
      return;
    }
    this.pot += addToPot;
    this.minRaise = this.current_actor().totalInvestment - this.totalCall;
    this.lastRaiser = this.actor;
    this.totalCall = this.current_actor().totalInvestment;
    this.next_actor();
  }

  fold(){
    if (this.current_actor().fold() === false){
      return;
    }
    this.foldedPlayers += 1;
    this.next_actor();
  }

  /**
   * If you can only call in, then canCallIn is true and canAllIn is false
   *
   * In a call-in. The minimum raise is not changed, and the last actor is the same
   */
  all_in(){
    var addToPot = this.current_actor().all_in();
    if (addToPot === false){
      return;
    }

    this.add_side_pot(this.current_actor().totalInvestment);
    if (this.current_actor().canAllIn){
      this.lastRaiser = this.actor;
      this.minRaise = this.current_actor().totalInvestment - this.minRaise;
    }

    this.pot += addToPot;
    this.totalCall = this.current_actor().totalInvestment;
    this.next_actor();
  }

/**
 * POT MANAGEMENT COMMANDS
 */

  /**
   * Array empty, put the number in
   * Input less than smallest number insert at beginning
   * Input greater than largest number, push the number ontop of it
   *
   * Otherwise, insert it via looping
   */
  add_side_pot(potSize){
    if (this.sidePots.length == 0){
      this.sidePots.push(potSize);
      return;
    }

    else if(potSize < this.sidePots[0]){
      this.sidePots.unshift(potSize);
    }

    else if(potSize > this.sidePots[this.sidePots.length - 1]){
      this.sidePots.push(potSize);
    }

    else{
      for (var i = 0; i < this.sidePots.length; i++){
        if (this.sidePots[i] > potSize){
          this.sidePots(i - 1, 0, potSize);
        }
      }
    }
  }

/**
 * DEBUG COMMANDS
 */
  print_board(){
    for (var i = 0; i < this.players.length; i++){
      var actor = this.players[i];
      if (actor != null){
        console.log(actor.name + ": " + actor.stack);
        console.log(actor.hand);
      }
    }
    console.log(""); 
    console.log("Shared cards: ");
    console.log(this.sharedCards);
    console.log(""); 

    console.log("Pot: " + this.pot);
    console.log("Side pots: " + this.sidePots);
    console.log("Dealer: " + this.dealer);
    console.log("SB: " + this.smallBlindSeat);
    console.log("BB: " + this.bigBlindSeat);
    console.log("Actor: " + this.actor);
    console.log("min-raise: " + this.minRaise);
  }
}

module.exports = {
  Game,
};
