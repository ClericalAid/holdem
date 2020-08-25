const minimalPlayer = require('./minimal-player');

/**
 * MinimalGame
 * Stripped down game object for the client-side.
 *
 * Keeps track of players
 * Reacts to whatever is pushed from the server
 */
class MinimalGame{
  constructor(){
    // Game state
    this.tableSize = 6;
    this.players = new Array(this.tableSize);
    this.players.fill(null);

    this.sharedCards = [];
    this.dealer = 0;

    // Pot management
    this.pot = 0;
    this.potRemainder = 0;
    this.sidePots = [];
    this.sidePotValues = [];
  }

  /**
   * add_user
   *
   * Adds a user to the table. Gets the player array from the server
   */
  add_user(playerArray){
  }

  /**
   * remove_user
   *
   * Removes a user from the table.
   */
  remove_user(playerArray){
  }

/**
 * GAMEFLOW
 */
  /**
   * new_hand
   * Resets all player hands and game state variables, and then deals the next hand.
   *
   * RECEIVE FROM SERVER:
   * pot - in the case of remainders
   * dealer - Who is the current dealer?
   *
   * Update small blind and big blind separately maybe? Just have the server tell the client
   * that said players put money in the pot?
   * SB
   * BB
   */
  new_hand(){
    // Game state
    this.sharedCards.length = 0;

    // Turn management
    this.foldedPlayers = 0;
    this.allInPlayers = 0;

    // Pot management
    this.pot = 0;
    this.sidePotParticipants = [];
  }

  /**
   * fill_side_pots
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
            break;
          }
        }
      }
    }
  }


/**
 * PLAYER COMMANDS
 */

  /**
   * call
   * The actor calls the pot. This function is only used if the player has enough to call. If not,
   * the player uses the all_in function.
   */
  call(){
  }

  /**
   * raise
   * The actor raises the pot. They become the lastRaiser/ aggressor. The minimum raise gets
   * updated accordingly.
   */
  raise(amount){
  }

  /**
   * fold
   * The actor folds
   */
  fold(){
  }

  /**
   * all_in
   */
  all_in(){
  }
}

module.exports = {
  MinimalGame,
};
