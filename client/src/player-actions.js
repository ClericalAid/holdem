/**
 * PlayerActions
 * Deals with all the moves the player can perform.
 */
class PlayerActions{
  constructor(username, socketId){
    this.amountToCall = -1;
    this.minRaiseTotal = -1;
    this.maxRaise = -1;
    this.stack = -1;

    this.canCall = false;
    this.canRaise = false;
    this.canAllIn = false;
    this.canFold = false;
    this.canCallIn = false;
  }

  import_from_player(importedPlayer){
    this.canCall = importedPlayer.canCall;
    this.canRaise = importedPlayer.canRaise;
    this.canAllIn = importedPlayer.canAllIn;
    this.canCallIn = importedPlayer.canCallIn;
    this.canFold = importedPlayer.canFold;

    if (importedPlayer.canCall === true){
      this.amountToCall = importedPlayer.amountToCall;
    }
    if (importedPlayer.canRaise === true){
      this.minRaiseTotal = importedPlayer.minRaiseTotal;
      this.stack = importedPlayer.stack;
    }
    if (importedPlayer.canAllIn === true){
      this.stack = importedPlayer.stack;
    }
    if (importedPlayer.canCallIn === true){
      this.stack = importedPlayer.stack;
    }

    this.maxRaise = this.stack;
  }

  import_from_server(validMoves){
    this.canCall = validMoves.canCall;
    this.canRaise = validMoves.canRaise;
    this.canAllIn = validMoves.canAllIn;
    this.canCallIn = validMoves.canCallIn;
    this.canFold = validMoves.canFold;

    this.amountToCall = validMoves.amountToCall;
    this.minRaiseTotal = validMoves.minRaiseTotal;
    this.stack = validMoves.stack;
  }

  ending_turn(){
    this.canCall = false;
    this.canRaise = false;
    this.canAllIn = false;
    this.canFold = false;
  }
}
module.exports = {
  PlayerActions,
};
