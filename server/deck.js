const randomNumber = require("random-number-csprng");

/**
 * Card
 *
 * Member variables:
 * suit - The suit of the card
 * rank - The value of the card ranging from 2 to 14. 14 = Ace, 13 = King...
 */
class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
  }
}

/**
 * Deck
 *
 * Member variables:
 * deck - the deck of cards from 2 to ace for each of the 4 suits
 * poppedCards - the cards which have been popped from the deck
 *    When the deck is reshuffled, the popped cards must return to the deck
 * allSuits - all of the suits Spades, Hearts, Clubs, and Diamonds
 * rankRange - a range of values from 2 to 14. 14 = Ace, 13 = King
 */
class Deck {
  constructor() {
    this.deck = [];
    this.poppedCards = [];
    this.allSuits = ['S', 'H', 'C', 'D'];
    this.rankRange = Array.from(new Array(13), (x, i) => i + 2);

    for (const suit of this.allSuits){
      for (const rank of this.rankRange){
        var card = new Card(suit, rank);
        this.deck.push(card);
      }
    }
  }

  /**
   * shuffle
   *
   * Shuffles the deck with a cryptographically secure random number generator
   *
   * Places the popped cards back into the deck
   * Resets the array of popped cards
   * Shuffles the deck
   */
  async shuffle() {
    this.deck = this.deck.concat(this.poppedCards);
    this.poppedCards.length = 0;
    for (let i = this.deck.length - 1; i > 0; i--){
      const j = await randomNumber(0, i);
      const temp = this.deck[i];
      this.deck[i] = this.deck[j];
      this.deck[j] = temp;
    }
  }

  /**
   * pop
   *
   * Get the card from the top of the deck
   */
  pop() {
    var retCard = this.deck.pop();
    this.poppedCards.push(retCard);
    return retCard;
  }
}

module.exports = {
  Deck,
};
