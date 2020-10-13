const handRanker = require('./hand-ranker');

/**
 * Player
 * Member variables:  this.chipsWon = 0;
 * name - The player's username/ display name in game
 * uuid - User's socketID typically. It will be unique to that socket, and I think they
 *    are cryptographically secure.
 *
 * Player state:
 * stack - How many chips the user has
 * hand - The cards in the player's hand
 * handRanker - The hand ranker that calculates the strength of the player's hand
 * folded - Boolean which is true if the player has folded
 * isAllIn - Boolean which is true if the player is all in
 * sittingOut - I don't know about this one right now. Maybe if they're an observer?
 *
 * Bet sizing:
 * totalInvestment - How many chips the player has put into the pot in total, over the span
 *    of this hand
 * maxRaise - How many chips the player can put into the pot (essentially up to their stack)
 * amountToCall - The total chip amount which the player must match with their totalInvestment
 *    in order to call the pot.
 * canCall - Is true if the player can call
 * canCallIn - Is true if the player can perform an all-in that is below the min-raise. This
 *    may occur if the player doesn't have the chips to call. Or, they have the chips to call,
 *    but they do not have the chips to perform a raise.
 * canRaise - Is true if the player has enough chips to perform at least a min raise
 * canCheck - It's just calling with 0 chips, might be useless.
 * canFold - Is true if the player can fold. Players cannot fold to a bet of 0.
 * canAllIn - Is true if the player can perform an all in which also counts as a raise. canAllIn
 *    and canCallIn are mutually exclusive in terms of being true. It's one or the other.
 *
 * Game controller variables:
 * chipsWon - The amount of chips won in the last hand
 */
class Player{
  constructor(username, socketId){
    this.name = username;
    this.uuid = socketId; // Placeholder for now. In the future, players will have proper IDs
    this.socketId = socketId;

    // Player state
    this.stack = 200; // user.buyInAmount
    this.hand = [];
    this.handRanker = new handRanker.HandRanker();
    this.folded = true;
    this.isAllIn = false;
    this.sittingOut = false;
    this.disconnected = false;

    // Bet sizing and valid moves
    this.totalInvestment = 0;
    this.maxRaise = 0;
    this.amountToCall = 0;
    this.canCall = false;
    this.canCallIn = false;
    this.canRaise = false;
    this.canCheck = false; // might not be needed. Check is just calling 0.
    this.canFold = false;
    this.canAllIn = false;

    // Game controller variables
    this.chipsWon = 0;
    this.lastBetSize = 0;
  }

  /**
   * draw_card
   */
  draw_card(deck){
    var card = deck.pop();
    this.hand.push(card);
    this.handRanker.add_card(card);
  }

  /**
   * win_chips
   */
  win_chips(chipCount){
    this.stack += chipCount;
    this.chipsWon = chipCount;
  }

  /**
   * new_card
   * Used when a new card shows up in the flop, turn, river, etc.
   */
  new_card(card){
    this.handRanker.add_card(card);
  }

  /**
   * new_hand
   * Reset the player object to accept a new hand
   */
  new_hand(){
    // Player hand reset
    this.hand.length = 0;
    this.handRanker.reset();

    // Player state reset
    this.folded = false;
    this.isAllIn = false;
    this.sittingOut = false;

    // Bet sizing reset
    this.totalInvestment = 0;
    this.maxRaise = 0;
    this.amountToCall = 0;
    this.canCall = false;
    this.canCallIn = false;
    this.canRaise = false;
    this.canFold = false;
    this.canAllIn = false;

    // Game controller reset
    this.chipsWon = 0;
    this.totalInvestment = 0;
  }

  /**
   * place_blind
   * Forces the player to post blinds
   */
  place_blind(amount){
    if (amount >= this.stack){
      amount = this.stack;
      this.stack = 0;
      this.isAllIn = true;
    }
    else{
      this.stack -= amount;
    }
    this.totalInvestment += amount;
    return amount;
  }

  /**
   * disable_moves
   * Used when the game is done/ player is on standby
   */
  disable_moves(){
    this.canCall = false;
    this.canCallIn = false;
    this.canRaise = false;
    this.canFold = false;
    this.canAllIn = false;
  }

  /**
   * valid_moves
   * Input:
   *  totalCall - The greatest total investment of one player. I.e. player A bets 10, player B
   *    raises another 10 (puts in 20 chips), the total investment is 20. This is the totalCall
   *
   *  minRaise - The minimum which someone is allowed to raise. If what you are calling is less
   *    than the minimum raise, it means we saw a call-in.
   *
   *  blindPlayer - A boolean which is true if the player is a big blind or small blind, and 
   *    this is their first time acting. Under such circumstances, it looks like they are facing
   *    a bet which is not a min-raise, but this is false. The player can still act.
   *
   * 1) Our stack is less than the amount to call
   * We can 
   *   call-in
   *   fold
   * 
   * 2) Our stack is less than the minimum raise amount (but more than the call amount)
   * We can
   *   call
   *   call-in
   *   fold
   * 
   * 3) Our stack is greater than the minimum raise amount
   * We can
   *   call
   *   all-in
   *   fold
   *   raise
   * 
   * Special cases:
   * 1) The amount to call is 0 and we are acting:
   * This means that we are probably opening the action. We should never be
   * in a position where we are looking to raise ourselves.
   * 
   * 2) The amount to call is less than the minRaise:
   * Somebody else performed an all-in that wasn't large enough for us to re-raise. We 
   * can only call or fold here. However, our call might be a call-in due to our 
   * stack size.
   *
   * Or, we are one of the blinds pre-flop, and everybody else limped. Then we'd be looking
   * to call an amount which looks like an illegitimate raise. However, we can re-raise in
   * this instance.
   *
   */
  valid_moves(totalCall, minRaise, blindException = false){
    this.amountToCall = totalCall - this.totalInvestment;
    this.minRaiseTotal = this.amountToCall + minRaise;

    this.disable_moves();

    // Case 1)
    if (this.stack <= this.amountToCall){
      this.canCallIn = true;
      this.canFold = true;
    }

    // Case 2)
    else if (this.stack <= this.minRaiseTotal){
      this.canCall = true;
      this.canCallIn = true;
      this.canFold = true;
    }

    // Case 3)
    else{
      this.canCall = true;
      this.canAllIn = true;
      this.canFold = true;
      this.canRaise = true;
      this.maxRaise = this.stack;
    }

    // Special case 1)
    if (this.amountToCall === 0){
      this.canFold = false;
    }

    // Special case 2)
    else if (this.amountToCall < minRaise && blindException === false){
      this.canAllIn = false;
      this.canRaise = false;
      if (this.canCall === true){
        this.canCallIn = false;
      }
    }
  }

  /**
   * place_bet
   * Put money into the pot
   */
  place_bet(amount){
    if (amount > this.stack){
      console.log("Invalid move, bet amount above stack");
    }
    this.lastBetSize = amount;
    this.totalInvestment += amount;
    this.stack -= amount;
    if (this.stack == 0){
      this.isAllIn = true;
    }
  }

  /**
   * call
   */
  call(){
    if (this.canCall === false){
      console.log("Invalid move, cannot call?");
      return false;
    }
    this.place_bet(this.amountToCall);
    return this.amountToCall;
  }

  /**
   * raise
   */
  raise(amount){
    if (this.canRaise === false || amount > this.maxRaise || amount < this.minRaiseTotal){
      console.log("Invalid raise amount");
      return false
    }
    this.place_bet(amount);
    return amount;
  }

  /**
   * all_in
   * Used whenever the player puts all his chips in either through a call in or an all in. The
   * player is marked as all in, to signal that they will no longer be acting in future betting
   * rounds.
   */
  all_in(){
    if (this.canCallIn === false && this.canAllIn === false){
      console.log("Cannot all in here");
      return false;
    }
    this.isAllIn = true;

    var betAmount = this.stack;
    this.place_bet(betAmount);
    return betAmount;
  }

  /**
   * fold
   * The player folds, and marks themselves as folded to signify that they will no longer
   * be acting in future betting rounds.
   */
  fold(){
    if (this.canFold === false){
      return false;
    }
    this.folded = true;
  }
}

module.exports = {
  Player,
};
