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
    this.tableSize = 6;
    this.players = new Array(this.tableSize);
    this.players.fill(null);
    this.playerCount = 0;
    this.observers = [];
    this.playerQueue = [];
    this.currentActor = -1;

    this.deck = new deck.Deck();
    this.nextEmptySeat = 0;
    this.smallBlind = -1;
    this.bigBlind = -1;
  }

  update_next_empty_seat(){
    if (this.playerCount == this.tableSize){
      return;
    }
    for (var i = 0; i < this.tableSize; i++){
      this.nextEmptySeat += 1;
      this.nextEmptySeat = this.nextEmptySeat % this.tableSize;
      if (this.players[this.nextEmptySeat] == null){
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
      if (this.players[i] == null){
      }
      else if (this.players[i].uuid == user.socket.id){
        console.log();
        this.players[i] = null;
      }
    }
    if (this.playerCount == this.tableSize){
      this.update_next_empty_seat();
    }
    this.playerCount -= 1;
  }

  new_hand(){
    deal_cards();
  }

  deal_cards(){
    for (const actor of this.players){
      actor.draw_card(this.deck);
    }
  }

  players_state(){
  }
}

module.exports = {
  Game,
};
