const deck = require('./deck');
const player = require('./player');

class Game{
  constructor(){
    this.tableSize = 6;
    this.players = new Array(this.tableSize);
    this.players.fill(null);
    this.deck = new deck.Deck();
    this.observers = [];
    this.playerQueue = [];
    this.nextEmptySeat = 0;
  }

  add_user(user){
    var addPlayer = new player.Player(user);
    this.players[this.nextEmptySeat] = addPlayer;
    this.nextEmptySeat += 1;
    return this.players
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
