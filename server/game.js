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
    this.smallBlind = -1;
    this.bigBlind = -1;
  }

  add_user(user){
    var addPlayer = new player.Player(user);
    this.players[this.nextEmptySeat] = addPlayer;
    this.nextEmptySeat += 1;
  }

  remove_user(user){
    console.log("GAME REMOVING USER with socket.id: " + user.socket.id);
    for (var i = 0; i < this.tableSize; i++){
      if (this.players[i] == null){
      }
      else if (this.players[i].uuid == user.socket.id){
        console.log();
        this.players[i] = null;
      }
    }
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
