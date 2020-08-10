class HandRanker{
  constructor(){
    this.STRAIGHT_FLUSH = 9;
    this.QUAD = 8;
    this.FULL_HOUSE = 7;
    this.FLUSH = 6;
    this.STRAIGHT = 5;
    this.TRIPLE = 4;
    this.TWO_PAIR = 3;
    this.PAIR = 2;
    this.HIGH_CARD = 1;

    this.ACE = 14;

    this.cardValueHistogram = new Map();
    this.allCards = [];
    this.spades = [];
    this.hearts = [];
    this.clubs = [];
    this.diamonds = [];

    this.allSuits = [];
    this.allSuits.push(this.spades);
    this.allSuits.push(this.hearts);
    this.allSuits.push(this.clubs);
    this.allSuits.push(this.diamonds);

    this.handRank = 0;
    this.handValue = [];
    this.handScore = 0;
  }

  reset(){
    //this.cardValues.length = 0;
    this.allCards.length = 0;
    this.cardValueHistogram = new Map();

    this.clubs.length = 0;
    this.hearts.length = 0;
    this.spades.length = 0;
    this.diamonds.length = 0;

    this.handRank = 0;
    this.handValue.length = 0;
  }

  add_card(inputCard){
    if (inputCard.suit == "S"){
      this.spades.push(inputCard.rank);
    }
    if (inputCard.suit == "H"){
      this.hearts.push(inputCard.rank);
    }
    if (inputCard.suit == "C"){
      this.clubs.push(inputCard.rank);
    }
    if (inputCard.suit == "D"){
      this.diamonds.push(inputCard.rank);
    }

    if (this.cardValueHistogram.has(inputCard.rank)){
      var currValue = this.cardValueHistogram.get(inputCard.rank);
      this.cardValueHistogram.set(inputCard.rank, currValue + 1);
    }
    else{
      this.cardValueHistogram.set(inputCard.rank, 1);
    }
    this.allCards.push(inputCard);
  }

  score_hand(){
    var sortedCardHistogram = [...this.cardValueHistogram].sort(this.histogram_sort);
    var allCardValues = Array.from(this.cardValueHistogram.keys());
    allCardValues.sort(this.numeric_sort);
    this.is_a_flush();
    this.is_a_straight(allCardValues);
    this.check_matching_cards(sortedCardHistogram);
    return [this.handRank, this.handValue];
  }

  /**
   *
   * Start from the highest card, and check if it creates a straight, iterate downwards.
   *
   * If we have an ace, check for a, 2, 3, 4, 5
   */
  is_a_straight(cardValues){
    if (cardValues.length < 5 || this.handRank > this.STRAIGHT){
      return false;
    }

    for (var highCard = 0; highCard <= cardValues.length - 5; highCard++){
      if (cardValues[highCard] - cardValues[highCard + 4] === 4){
        this.handRank = this.STRAIGHT;
        this.handValue.push(cardValues[highCard]);
        return true;
      }
    }
    if (cardValues[0] == this.ACE){
      if (cardValues[cardValues.length - 4] == 5){
        this.handRank = this.STRAIGHT;
        this.handValue.push(5);
        return true;
      }
    }

    return false;
  }

  is_a_flush(){
    for (const suit of this.allSuits){
      if (suit.length > 4){
        suit.sort(this.numeric_sort);
        if (this.is_a_straight(suit)){
          this.handRank = this.STRAIGHT_FLUSH;
        }
        else{
          this.handRank = this.FLUSH;;
          this.handValue.push(suit[0]);
        }
      }
    }
  }

  /**
   * check_matching_cards()
   *   parameters:
   *     cardHistogram - A histogram of the card ranks and their frequency, suit doesn't matter
   *
   * Checks for:
   * 1) Quads
   * 2) Full house
   * 3) Triple
   * 4) Two pair
   * 5) Pair
   *
   * CORNER CASES:
   * When there's a quad and pair on the board, choosing the best kicker is tricky. This is because
   * the cards are sorted first by their "pairing", and then by their value. This means that if the
   * seven cards looked like:
   * 4, 4, 4, 4, 8, 8, 10
   * The histogram would look like:
   * 4, 4
   * 8, 2
   * 10, 1
   *
   * So ideally, we'd be able to just pick the first 5 cards that occur in our histogram, and then
   * call it a day and assume we have selected the best hand. But these corner cases ruin it.
   * Luckily, there is an easy fix. If there is a two pair, or a quad, then we need to sort the
   * remaining cards by value, regardless of their pairing. This approach scales checking for hands
   * even if there are more than 7 cards. Don't know if that's useful though.
   *
   */
  check_matching_cards(cardHistogram){
    if (cardHistogram[0][1] == 4){
      var quad = cardHistogram.slice(0, 1);
      var restOfCards = cardHistogram.slice(1, cardHistogram.length);
      restOfCards.sort(this.value_sort);
      cardHistogram = quad.concat(restOfCards);
    }
    else if(cardHistogram[0][1] == 2 && cardHistogram[1][1] == 2){
      var twoPair = cardHistogram.slice(0, 2);
      var restOfCards = cardHistogram.slice(2, cardHistogram.length);
      restOfCards.sort(this.value_sort);
      cardHistogram = twoPair.concat(restOfCards);
    }

    // Rank the hand now
    if (cardHistogram[0][1] == 4 && this.handRank < this.QUAD){
      this.handRank = this.QUAD;
      this.handValue.push(cardHistogram[0][0]);
      this.handValue.push(cardHistogram[1][0]);
    }
    else if (cardHistogram[0][1] == 3 && this.handRank < this.FULL_HOUSE){
      if (cardHistogram[1][1] > 1){
        this.handRank = this.FULL_HOUSE;
        this.handValue.push(cardHistogram[0][0]);
        this.handValue.push(cardHistogram[1][0]);
      }
      else if (cardHistogram[0][1] == 3 && this.handRank < this.TRIPLE){
        this.handRank = this.TRIPLE;
        this.handValue.push(cardHistogram[0][0]);
        this.handValue.push(cardHistogram[1][0]);
        this.handValue.push(cardHistogram[2][0]);
      }
    }
    else if (cardHistogram[0][1] == 2 && this.handRank < this.TWO_PAIR){
      if (cardHistogram[1][1] > 1){
        this.handRank = this.TWO_PAIR;
        this.handValue.push(cardHistogram[0][0]);
        this.handValue.push(cardHistogram[1][0]);
        this.handValue.push(cardHistogram[2][0]);
      }
     else if (cardHistogram[0][1] == 2 && this.handRank < this.PAIR){
        this.handRank = this.PAIR;
        this.handValue.push(cardHistogram[0][0]);
        this.handValue.push(cardHistogram[1][0]);
        this.handValue.push(cardHistogram[2][0]);
        this.handValue.push(cardHistogram[3][0]);
      }
    }
 
    else if (this.handRank < this.HIGH_CARD){
      this.handRank = this.HIGH_CARD;
      this.handValue.push(cardHistogram[0][0]);
      this.handValue.push(cardHistogram[1][0]);
      this.handValue.push(cardHistogram[2][0]);
      this.handValue.push(cardHistogram[3][0]);
      this.handValue.push(cardHistogram[4][0]);
    }
  }

  /**
   * SORTING FUNCTIONS
   */

  /**
   * Cards are stored in a histogram/ frequency chart whatever. So if we have:
   * 4 diamonds
   * 4 hearts
   * 4 spades
   * K spades
   * 3 diamonds
   * 5 spades
   * 5 diamonds
   *
   * Then we want our sorted histogram to be as follows:
   *
   * Value - Frequency
   * 4  - 3
   * 5  - 2
   * 13 - 1
   * 3  - 1
   *
   * First we care about how many times that value appears. After that, we care about the actual
   * value. This is because quads > trips > pair > single. However, if there are two triples, or
   * multiple pairs, we start to care about the values of said pairs and triples.
   *
   * [0] = data (card value)
   * [1] = frequency (single, pair, triple, or quad)
   */
  histogram_sort = (a, b) => {
    if (a[1] === b[1]){
      return b[0] - a[0];
    }
    else{
      return b[1] - a[1];
    }
  }

  numeric_sort = (a, b) => {
    return b - a;
  }

  value_sort = (a, b) => {
    return b[0] - a[0];
  }

}



module.exports = {
  HandRanker,
}
