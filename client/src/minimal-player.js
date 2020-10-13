/**
 * MinimalPlayer
 * The player for the client. It is a stripped down version of what would exist on the backend.
 *
 * Member variables:
 * name - The player's name
 * uuid - Usually, it's a player's socket.id but this should be changed in the future. It might
 *    expose a vulnerability having the other users' socket.id available
 *
 * Player state:
 * stack - How many chips the player currently has
 * hero - Is true if this player object is the one controlled by the user
 * dealer - Is true if the player is currently the dealer
 * hand - The players' hand
 * folded - Is true if the player folded
 * isAllIn - Is true if the player is all in
 * sittingOut - Is true if the player is sitting out (currently there is no way to sit out)
 * isCurrentActor - Is true if this player object is currently deciding whether to fold, raise, etc.
 *
 * Betting:
 * totalInvestment - How many chips the player has bet in total for this hand
 * investmentThisRound - How many chips the player has bet in this current round of betting
 */
class MinimalPlayer{
  constructor(username, socketId){
    this.name = username;
    this.uuid = socketId;

    // Player state
    this.stack = 200; // user.buyInAmount
    this.hero = false;
    this.dealer = false;
    this.hand = [];
    this.folded = false;
    this.isAllIn = false;
    this.sittingOut = true;
    this.isCurrentActor = false;

    // Bet sizing and valid moves
    this.totalInvestment = 0;
    this.investmentThisRound = 0;
  }

  /**
   * flash_player
   * input:
   *  otherPlayer - The player sent by the server, which we are flashing onto this object
   * Takes in a player object and makes a copy of it. Objects passed via sockets do not have
   * function information, therefore they need to be remade. Or we can treat them lik C structures
   * but nobody wants to do that. Haha... unless?
   */
  flash_player(otherPlayer){
    this.name = otherPlayer.name;
    this.uuid = otherPlayer.uuid;

    // Player state
    this.stack = otherPlayer.stack;
    this.hero = otherPlayer.hero;
    this.dealer = otherPlayer.dealer;
    this.folded = otherPlayer.folded;
    this.isAllIn = otherPlayer.isAllIn;
    this.sittingOut = otherPlayer.sittingOut;

    // Bet sizing and valid moves
    this.totalInvestment = otherPlayer.totalInvestment;
    this.investmentThisRound = otherPlayer.investmentThisRound;
  }
  /**
   * win_chips
   */
  win_chips(chipCount){
    this.stack += chipCount;
  }

  /**
   * new_hand
   * Reset the player object to accept a new hand (also take in his cards)
   */
  new_hand(){
    // Player hand reset
    this.hand = [];

    // Player state reset
    this.folded = false;
    this.isAllIn = false;
    this.sittingOut = false;
    this.dealer = false;

    // Betting information:
    this.totalInvestment = 0;
    this.investmentThisRound = 0;
  }

  new_round(){
    this.investmentThisRound = 0;
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
   * place_bet
   * Puts money into the pot
   */
  place_bet(amount){
    this.totalInvestment += amount;
    this.stack -= amount;
  }

  /**
   * fold
   * The player folds, and marks themselves as folded to signify that they will no longer
   * be acting in future betting rounds.
   */
  fold(){
    this.folded = true;
  }
}

module.exports = {
  MinimalPlayer,
};
