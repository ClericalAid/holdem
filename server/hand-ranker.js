/**
 * HandRanker
 * Takes in 7 cards, and then computes the value of said hand.
 *
 * Member variables:
 * constants:
 * All constants are from strongest to weakest, high to low
 * STRAIGHT_FLUSH - The strength of a straight flush compared to the other possible hands
 * QUAD - The strength of a quadruple matched hand
 * FULL_HOUSE - The strength of a full house
 * FLUSH - flush
 * STRAIGHT - straight
 * TRIPLE - triple
 * TWO_PAIR - two pair
 * PAIR - pair
 * HIGH_CARD - Your hand has none of the above
 * HAND_SIZE - We are only dealing with 7 cards. If we go above that, something is terribly wrong
 *
 * ACE - The number associated with ace, which is 14. King is 13, queen is 12, etc.
 *
 * Card organizers:
 * cardValueHistogram - A histogram counting how often each hand rank occurs in our hand. For
 *    example, if our hand consisted of:
 *    4C, 4D, 7H, 7C, 5C, 6S, 8H 
 *    the card histogram would read as:
 *    4 - 2
 *    5 - 1
 *    6 - 1
 *    7 - 2
 *    8 - 1
 *    It only cares about the value, not the suits. This is useful for finding full houses,
 *    two pair, straights, etc.
 * allCards - Literally a list of all the cards that are part of the hand. More of a debugging
 *    variable at this point I think.
 * spades - The values of all of the spades in our hand. The hearts, clubs, and diamonds array
 *    are all of a similar functionality to this variable.
 *    For example, if our hand was:
 *    4C, 4D, 7H, 7C, 5C, 6S, 8H 
 *    The spades array would be:
 *    6
 *    The hearts array would be:
 *    7, 8
 *    The clubs array would be:
 *    4, 7, 5
 *    The diamonds array would be:
 *    4
 * hearts - Similar to the spades array. Refer to the spades variable for more info.
 * clubs - Similar to the spades array. Refer to the spades variable for more info.
 * diamonds - Similar to the spades array. Refer to the spades variable for more info.
 * allSuits - Simply all of the suit arrays pushed into this one array. This makes it easier
 *    to loop through all of the suits.
 * handRank - The "rank" of the hand, referring to straight flush, quad, full house, etc.
 * handValue - How strong the hand is within its rank. For example, if we had a quad that
 *    consisted of quad 4 with an ace kicker, the handValue would be:
 *    4, 14
 * handScore - The total score of the hand. The handRank concatenated with the handValue. For
 *    example, quad 4 with ace kicker will be:
 *    8, 4, 14
 */
class HandRanker{
  constructor(){
    // constants
    this.STRAIGHT_FLUSH = 9;
    this.QUAD = 8;
    this.FULL_HOUSE = 7;
    this.FLUSH = 6;
    this.STRAIGHT = 5;
    this.TRIPLE = 4;
    this.TWO_PAIR = 3;
    this.PAIR = 2;
    this.HIGH_CARD = 1;
    this.HAND_SIZE = 7;

    this.ACE = 14;

    // Card organizers
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

    // Hand strength
    this.handRank = 0;
    this.handValue = [];
    this.handScore = null;
  }

  /**
   * reset
   * Resets the hand
   */
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

  /**
   * add_card
   * Adds a card to the hand
   * Puts it in the right suit
   * Adds it to the histogram
   * Adds it to the list of cards in the hand
   */
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
    if (this.allCards.length > this.HAND_SIZE){
      console.log("HAND SIZE IS TOO BIG");
    }
  }

  /**
   * score_hand
   * We sort the histogram by how often it occurs, then the value. Look at histogram_sort() for
   * more details.
   * We then look at the values that occur in said histogram. This is to look for straights
   * Check if we have a flush
   * Check if we have a straight
   * Check for hands that involve matching cards (quad, full house, etc.)
   */
  score_hand(){
    var sortedCardHistogram = [...this.cardValueHistogram].sort(this.histogram_sort);
    var allCardValues = Array.from(this.cardValueHistogram.keys());
    allCardValues.sort(this.numeric_sort);
    this.is_a_flush();
    this.is_a_straight(allCardValues);
    this.check_matching_cards(sortedCardHistogram);
    this.handScore = [this.handRank].concat(this.handValue);
    return this.handScore;
  }

  /**
   * is_a_straight
   * parameters:
   *  cardValues - A sorted list of the card values, from highest to lowest
   *
   * Start from the highest card, and check if it creates a straight, iterate downwards. Since
   * the card values are sorted, we do not have to check card by card. Any possible straight
   * will follow the pattern of the first and last card of the straight being in the right
   * spot. For example:
   * 6, 5, 4, 3, 2
   * The 6 occurs at index 0, and the 2 occurs at index 4. Two "end cards" that form a straight
   * will be separated by 4 indices if it is indeed a straight. This is because the array is
   * sorted.
   *
   * With the above in mind, there are a few cases we need to deal with:
   *
   * 1) There are less than 5 card values total (this happens in hands with a lot of pairs,
   *    or a quad even). Then we definitely do not have a straight.
   * 2) Loop through the array and perform the check for a straight at each card.
   *    a) If we have a straight, we stop immediately, because we want the strongest straight
   *        possible.
   *
   * 3) If we have an ace, check for a, 2, 3, 4, 5
   *
   * If none of the above pan out, we do not have a straight.
   */
  is_a_straight(cardValues){
    // 1)
    if (cardValues.length < 5 || this.handRank > this.STRAIGHT){
      return false;
    }

    // 2)
    for (var highCard = 0; highCard <= cardValues.length - 5; highCard++){
      // 2a)
      if (cardValues[highCard] - cardValues[highCard + 4] === 4){
        this.handRank = this.STRAIGHT;
        this.handValue.push(cardValues[highCard]);
        return true;
      }
    }

    // 3)
    if (cardValues[0] == this.ACE){
      if (cardValues[cardValues.length - 4] == 5){
        this.handRank = this.STRAIGHT;
        this.handValue.push(5);
        return true;
      }
    }

    return false;
  }

  /**
   * is_a_flush
   * Checks if we have a flush.
   *
   * 1) Loop through the suits
   *    a) If there are more than 5 cards, it's a flush
   *      i) check if we have a straight as well, then it's a straight flush
   *    b) Otherwise, we just have a flush
   */
  is_a_flush(){
    // 1)
    for (const suit of this.allSuits){
      // 1a)
      if (suit.length > 4){
        suit.sort(this.numeric_sort);
        // 1ai)
        if (this.is_a_straight(suit)){
          this.handRank = this.STRAIGHT_FLUSH;
        }
        // 1b)
        else{
          this.handRank = this.FLUSH;;
          for (var i = 0; i < 5; i++){
            this.handValue.push(suit[i]);
          }
        }
      }
    }
  }

  /**
   * check_matching_cards
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

  /**
   * numeric_sort
   * Sorts numbers from highest to lowest (default array does low to high)
   */
  numeric_sort = (a, b) => {
    return b - a;
  }

  /**
   * value_sort
   * Sorts card in a card histogram solely by the value of the card, and ignores its frequency.
   */
  value_sort = (a, b) => {
    return b[0] - a[0];
  }

}



module.exports = {
  HandRanker,
}
