/**
 * Player class used in the game object. Links back to the user
 */
class Player{
  constructor(user){
    this.name = user.userName;
    this.uuid = user.socket.id;
    this.stack = 200; // user.buyInAmount

    this.smallBlind = false;
    this.bigBlind = false;
    this.hand = [];

    // Player state
    this.folded = false;
    this.isAllIn = false;
    this.sittingOut = false;

    // Bet sizing and valid moves
    this.totalBetInRound = 0;
    this.totalInvestment = 0;
    this.minBet = 0;
    this.maxBet = 0;
    this.minRaise = 0;
    this.maxRaise = 0;
    this.amountToCall = 0;
    this.canCall = false;
    this.canCallIn = false;
    this.canRaise = false;
    this.canCheck = false;
    this.canFold = false;
    this.canAllIn = false;
  }

  draw_card(deck){
    this.hand.push(deck.pop());
  }
}

module.exports = {
  Player,
};
