const deck = require('./deck');
const player = require('./player');

/**
 * Game
 * Game object which keeps track of the state and flow of the game.
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
    this.playerRanking = [];

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
    this.allInPlayers = 0;
    this.callIn = 0;

    // Pot management
    this.pot = 0;
    this.totalCall = 0;
    this.totalBet = 0;
    this.minRaise = 0;
    this.sidePots = [];
    this.sidePotWinners = [];
    this.sidePotTotal = [];
    this.sidePotParticipants = [];
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
   * 1) Loop through each potential actor, if they are all in or have folded, we skip them.
   *    Special Case:
   *      a) The last raiser is all-in. They cannot act, but we have went full circle. Break
   *      the loop
   *
   * 2) If we went full circle, back to the agressor, the round ends (everybody called maybe)
   */
  next_actor(){
    // 1)
    do {
      this.actor = this.next_player(this.actor);

      // 1a)
      if (this.actor === this.lastRaiser){
        break;
      }
    }while(this.current_actor().isAllIn || this.current_actor().folded)

    // 2)
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
    for (const actor of this.players){
      if (actor !== null){
        actor.new_hand();
      }
    }

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
    this.update_total_call(this.bigBlindAmount);

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

  /**
   * Check if only one player (or fewer) is able to act, the rest are some combination of 
   * being all-in or folded.
   *
   * a)  If there is even one person all-in
   *       We accelerate to the river, and check the winner
   *
   * b)  Otherwise:
   *       The player wins (the others have folded)
   */
  game_still_active(){
    if (this.foldedPlayers + this.allInPlayers >= this.playerCount - 1){
      if (this.allInPlayers > 0){
        while(this.sharedCards.length < this.RIVER){
          this.deck.pop();
          this.add_card_to_shared_cards();
        }
      }
      else{
        // LAST PLAYER WINS
      }
      return false;
    }
    return true;
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
    this.game_still_active();

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
      this.showdown();
    }

  }

  flop(){
    this.lastRaiser = -1;
    this.minRaise = this.bigBlind;
    this.actor = this.dealer;
    this.next_actor();

    this.deck.pop();
    for (var i = 0; i < this.FLOP; i++){
      this.add_card_to_shared_cards();
    }
  }

  next_card(){
    this.minRaise = this.bigBlind;
    this.lastRaiser = -1;

    this.deck.pop();
    this.add_card_to_shared_cards();

    this.actor = this.dealer;
    this.next_actor();
  }

  add_card_to_shared_cards(){
    var card = this.deck.pop();
    this.sharedCards.push(card);

    for (const actor of this.players){
      if (actor !== null){
        actor.new_card(card);
      }
    }
  }

  /**
   * Sorts the players based on how strong their hands are
   */
  player_hand_comparer = (playerA, playerB) => {
    var handScoreA = playerA.handRanker.handScore;
    var handScoreB = playerB.handRanker.handScore;
    var iterations = Math.min(handScoreA.length, handScoreB.length);
    for (var i = 0; i < iterations; i++){
      if (handScoreA[i] !== handScoreB[i]){
        return handScoreB[i] - handScoreA[i];
      }
    }
  }

  /**
   * Checks if the two players given are tied
   */
  players_tied(playerA, playerB){
    var handScoreA = playerA.handRanker.handScore;
    var handScoreB = playerB.handRanker.handScore;
    var iterations = Math.min(handScoreA.length, handScoreB.length);
    for (var i = 0; i < iterations; i++){
      if (handScoreA[i] !== handScoreB[i]){
        return false;
      }
    }
    return true;
  }

  /**
   * This should be used for each side pot. It sounds weird, but it guarantees no mistakes.
   */
  declare_winners(playerArray){
    for (var i = 1; i < playerArray.length; i++){
      if (!this.players_tied(playerArray[i], playerArray[0])){
        break;
      }
    }
    return (i - 1);
  }

  /**
   * Rank all of the players, ignoring empty seats and players who have folded
   */
  showdown(){
    for (const actor of this.players){
      if (actor !== null && !actor.folded){
        actor.handRanker.score_hand();
        this.playerRanking.push(actor);
      }
    }
    this.playerRanking.sort(this.player_hand_comparer);
    this.evaluate_side_pots();
  }

  /**
   * Take everybody's chips and put them into the side pots
   *
   * A non-trivial example is as follows:
   * Player A - all in for 50
   * Player B - all in for 100
   * Player C - calls (100 chips)
   * Total chips invested: 250
   *
   * There are two side pots. One side pot requires players to invest 50 chips, the other
   * side pot requires players to invest 100 chips.
   *
   * The total amount of chips in the 50 side pot is 150. (50 * 3 = 150)
   *
   * The total amount of chips in the 100 side pot is 100  ((100 - 50) * 2 = 100)
   *
   * The players who are involved in the 100 sidepot have already invested 50 into the previous
   * side pot. Therefore, the base case for what a user invests is:
   *
   *          currentSidePotValue - prevSidePotValue
   *
   * We can double check this, because 150 + 100 = 250. Meaning the sum of the side pots is equal
   * to the total chips invested.
   *
   * With that illustrated, the algorithm works as follows:
   *
   * 1) For each player on the table:
   *  2) Loop through each sidepot
   *    a) The player has the chips to put into the sidepot
   *      Put them into the sidepot
   *    b) The player does not have the chips required to "fill" the sidepot
   *      The rest of their chips go into this sidepot, they do not contribute to any further
   *      sidepots.
   */
  fill_side_pots(){
    this.sidePotTotal = new Array(this.sidePots.length);
    this.sidePotTotal.fill(0);

    // 1)
    for (const actor of this.players){
      if (actor !== null){
        var prevSidePot = 0;
        var playerInvestment = actor.totalInvestment;

        // 2)
        for (var i = 0; i < this.sidePots.length; i++){
          var sidePotAmount = this.sidePots[i];
          var costOfSidePot = sidePotAmount - prevSidePot;

          // 2a)
          if (playerInvestment > costOfSidePot){
            playerInvestment -= costOfSidePot;
            this.sidePotTotal[i] += costOfSidePot;
            prevSidePot = sidePotAmount;
          }

          // 2b)
          else{
            this.sidePotTotal[i] += playerInvestment;
            break; // player has nothing left to put into higher side pots
          }
        }
      }
    }
  }

  /**
   * For each player in the sorted playerRanking:
   *  Place them into their sidepots in which they are competing
   *  Player rankings are sorted, therefore sidepot players are sorted too
   */
  evaluate_side_pots(){
    this.fill_side_pots();
    this.sidePotParticipants = new Array(this.sidePots.length);
    for (var i = 0; i < this.sidePotParticipants.length; i++){
      this.sidePotParticipants[i] = new Array();
    }

    for (const actor of this.playerRanking){
      for (var i = 0; i < this.sidePots.length; i++){
        if (actor.totalInvestment >= this.sidePots[i]){
          this.sidePotParticipants[i].push(actor);
        }
      }
    }
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
    this.update_total_call(this.current_actor().totalInvestment);
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
   * In a call-in. The minimum raise is not changed
   * Is the last raiser the same in a call-in?
   *  If we update the last-raiser, then everyone else gets a chance to act (which they need to)
   *  We use the function valid_moves() to prevent people from re-raising a call-in.
   *
   */
  all_in(){
    var addToPot = this.current_actor().all_in();
    if (addToPot === false){
      return;
    }

    this.add_side_pot(this.current_actor().totalInvestment);
    if (this.current_actor().canAllIn){
      this.minRaise = this.current_actor().totalInvestment - this.totalCall;
    }

    this.allInPlayers += 1;
    if (this.current_actor().totalInvestment > this.totalCall){
      this.lastRaiser = this.actor;
    }
    this.pot += addToPot;
    this.update_total_call(this.current_actor().totalInvestment);
    this.next_actor();
  }

  update_total_call(newValue){
    if (this.totalCall < newValue){
      this.totalCall = newValue;
    }
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
      var sidePotsLength = this.sidePots.length;
      for (var i = 0; i < sidePotsLength; i++){
        if (this.sidePots[i] > potSize){
          this.sidePots.splice(i, 0, potSize);
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
    console.log("Dealer: " + this.players[this.dealer].name);
    console.log("SB: " + this.smallBlindSeat);
    console.log("BB: " + this.bigBlindSeat);
    console.log("Actor: " + this.current_actor().name);
    console.log("min-raise: " + this.minRaise);
    console.log("call: " + this.current_actor().amountToCall);
  }
}

module.exports = {
  Game,
};
