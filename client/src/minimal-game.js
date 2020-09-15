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
    // Constants
    this.BLANK = "BLANK";
    this.HIDDEN_HAND = [this.BLANK, this.BLANK];

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

    // Client-side variables
    this.hero = -1;
    this.dealer = -1;
    this.clientSocketId = null;
    this.clientSocket = null;
  }

  /**
   * flash_game_state
   * Takes the server game state and flashes it to the client side. We need to rebuild objects
   * so that they have working functions
   */
  flash_game_state(serverGameObject){
    this.sharedCards = serverGameObject.sharedCards;
    this.dealer = serverGameObject.dealer;
    this.pot = serverGameObject.pot;

    this.players = new Array(serverGameObject.players.length);
    this.players.fill(null);
    for (var i = 0; i < this.players.length; i++){
      if (serverGameObject.players[i] !== null){
        this.add_user(serverGameObject.players[i], i);
      }
    }
    for (var i = 0; i < this.players.length; i++){
      if (this.players[i] !== null && this.players[i].uuid === this.clientSocketId){
        this.players[i].hero = true;
        this.hero = i;
      }
    }
  }

  /**
   * update_shared_cards
   */
  update_shared_cards(sharedCards){
    this.sharedCards = sharedCards;
  }
  /**
   * add_user
   *
   * Adds a user to the table. Gets the player array from the server
   */
  add_user(newPlayer, playerIndex){
    this.players[playerIndex] = new minimalPlayer.MinimalPlayer();
    this.players[playerIndex].flash_player(newPlayer);
  }

  /**
   * remove_user
   */
  remove_user(playerIndex){
    this.players[playerIndex] = null;
  }

  /**
   * get_hero
   */
  get_hero(){
    return this.players[this.hero];
  }

  /**
   * update_bet
   * input:
   *  totalInvestment - How much the player has invested in this hand, total
   *  index - The index of the player who had invested that amount
   */
  update_bet(betAmount, playerIndex){
    if (this.players[playerIndex] === null){
      console.log("A null player placed a bet!");
      return;
    }
    this.players[playerIndex].place_bet(betAmount);
    this.pot += parseInt(betAmount);
  }

  update_player_stacks(allPlayerStacks, potRemainder){
    this.potRemainder = potRemainder;
    this.pot = this.potRemainder;
    for (var i = 0; i < this.players.length; i++){
      if (this.players[i] !== null){
        this.players[i].stack = allPlayerStacks[i];
      }
    }
  }

  win_chips(chipWinning, playerIndex){
    this.pot -= chipWinning;
    this.players[playerIndex].win_chips(chipWinning);
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
  new_hand(cards){
    // Game state
    this.sharedCards.length = 0;

    // Turn management
    this.foldedPlayers = 0;
    this.allInPlayers = 0;

    // Pot management
    this.pot = this.potRemainder;
    this.sidePotParticipants = [];

    for (const actor of this.players){
      if (actor !== null){
        actor.new_hand();
        if (actor.hero === false){
          actor.hand = this.HIDDEN_HAND;
        }
        else{
          actor.hand = cards;
        }
      }
    }
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
   * fold
   * Mark a player as folded
   */
  fold(playerIndex){
    this.players[playerIndex].folded = true;
  }

  set_dealer(dealerIndex){
    this.players[dealerIndex].dealer = true;
  }

  set_active_player(activePlayerIndex){
    for (const actor of this.players){
      if (actor !== null){
        actor.isCurrentActor = false;
      }
    }
    if (this.players[activePlayerIndex] !== null){
      this.players[activePlayerIndex].isCurrentActor = true;
    }
  }

  /**
   * all_in
   * Mark a player as all in (Maybe not necessary)
   */
  all_in(playerIndex){
    this.players[playerIndex].isAllIn = true;
  }
}

module.exports = {
  MinimalGame,
};
