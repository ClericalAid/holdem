const randomNumber = require("random-number-csprng");

class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
  }
}

class Deck {
  constructor() {
    this.deck = [];
    this.poppedCards = [];
    this.allSuits = ['S', 'H', 'C', 'D'];
    this.rankRange = Array.from(new Array(13), (x, i) => i + 2);

    this.allSuits.forEach((suit) => {
      this.rankRange.forEach((rank) => {
        var card = new Card(suit, rank);
        this.deck.push(card);
      });
    });
  }

  async shuffle() {
    this.deck = this.deck.concat(this.poppedCards);
    for (let i = this.deck.length - 1; i > 0; i--){
      const j = await randomNumber(0, i);
      const temp = this.deck[i];
      this.deck[i] = this.deck[j];
      this.deck[j] = temp;
    }
  }

  pop() {
    var retCard = this.deck.pop();
    this.poppedCards.push(retCard);
    return retCard;
  }
}

module.exports = {
  Deck,
};
