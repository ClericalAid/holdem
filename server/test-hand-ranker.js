const handRanker = require('./hand-ranker');
const deck = require('./deck');


async function test(){
  const hand1 = new handRanker.HandRanker();
  const hand2 = new handRanker.HandRanker();

  const myDeck = new deck.Deck();
  await myDeck.shuffle();

  // Straight Flush
  //hand1.add_card({suit: "S", rank: 4});
  //hand1.add_card({suit: "S", rank: 5});
  //hand1.add_card({suit: "S", rank: 6});
  //hand1.add_card({suit: "S", rank: 7});
  //hand1.add_card({suit: "S", rank: 8});
  //hand1.add_card({suit: "S", rank: 2});
  //hand1.add_card({suit: "C", rank: 4});

  // Quad
  //hand1.add_card({suit: "S", rank: 2});
  //hand1.add_card({suit: "D", rank: 2});
  //hand1.add_card({suit: "D", rank: 9});
  //hand1.add_card({suit: "H", rank: 2});
  //hand1.add_card({suit: "S", rank: 9});
  //hand1.add_card({suit: "C", rank: 2});
  //hand1.add_card({suit: "S", rank: 14});

  // Full House
  //hand1.add_card({suit: "S", rank: 13});
  //hand1.add_card({suit: "C", rank: 5});
  //hand1.add_card({suit: "C", rank: 12});
  //hand1.add_card({suit: "S", rank: 2});
  //hand1.add_card({suit: "H", rank: 5});
  //hand1.add_card({suit: "D", rank: 12});
  //hand1.add_card({suit: "D", rank: 5});

  // Flush
  //hand1.add_card({suit: "S", rank: 4});
  //hand1.add_card({suit: "S", rank: 6});
  //hand1.add_card({suit: "S", rank: 7});
  //hand1.add_card({suit: "S", rank: 8});
  //hand1.add_card({suit: "S", rank: 13});
  //hand1.add_card({suit: "H", rank: 5});
  //hand1.add_card({suit: "D", rank: 5});

  // straights
  //hand1.add_card({suit: "S", rank: 2});
  //hand1.add_card({suit: "S", rank: 13});
  //hand1.add_card({suit: "D", rank: 12});
  //hand1.add_card({suit: "H", rank: 10});
  //hand1.add_card({suit: "S", rank: 11});
  //hand1.add_card({suit: "C", rank: 14});
  //hand1.add_card({suit: "S", rank: 14});
  
  //hand1.add_card({suit: "D", rank: 5});
  //hand1.add_card({suit: "C", rank: 2});
  //hand1.add_card({suit: "H", rank: 3});
  //hand1.add_card({suit: "D", rank: 4});
  //hand1.add_card({suit: "D", rank: 12});
  //hand1.add_card({suit: "D", rank: 13});
  //hand1.add_card({suit: "S", rank: 14});

  //hand1.add_card({suit: "S", rank: 12});
  //hand1.add_card({suit: "D", rank: 7});
  //hand1.add_card({suit: "S", rank: 9});
  //hand1.add_card({suit: "S", rank: 14});
  //hand1.add_card({suit: "H", rank: 10});
  //hand1.add_card({suit: "D", rank: 8});
  //hand1.add_card({suit: "H", rank: 6});

  //hand1.add_card({suit: "S", rank: 2});
  //hand1.add_card({suit: "D", rank: 7});
  //hand1.add_card({suit: "S", rank: 9});
  //hand1.add_card({suit: "S", rank: 5});
  //hand1.add_card({suit: "H", rank: 10});
  //hand1.add_card({suit: "D", rank: 8});
  //hand1.add_card({suit: "H", rank: 6});

  // Triple
  //hand1.add_card({suit: "S", rank: 5});
  //hand1.add_card({suit: "S", rank: 6});
  //hand1.add_card({suit: "S", rank: 7});
  //hand1.add_card({suit: "C", rank: 8});
  //hand1.add_card({suit: "H", rank: 13});
  //hand1.add_card({suit: "H", rank: 5});
  //hand1.add_card({suit: "D", rank: 5});

  // 2 Pair
  //hand1.add_card({suit: "S", rank: 2});
  //hand1.add_card({suit: "D", rank: 2});
  //hand1.add_card({suit: "D", rank: 11});
  //hand1.add_card({suit: "H", rank: 11});
  //hand1.add_card({suit: "S", rank: 9});
  //hand1.add_card({suit: "C", rank: 9});
  //hand1.add_card({suit: "S", rank: 14});

  // Pair
  //hand1.add_card({suit: "S", rank: 4});
  //hand1.add_card({suit: "H", rank: 10});
  //hand1.add_card({suit: "C", rank: 7});
  //hand1.add_card({suit: "S", rank: 8});
  //hand1.add_card({suit: "S", rank: 13});
  //hand1.add_card({suit: "H", rank: 5});
  //hand1.add_card({suit: "D", rank: 5});

  /*
  hand1.add_card(myDeck.pop());
  hand1.add_card(myDeck.pop());
  hand1.add_card(myDeck.pop());
  hand1.add_card(myDeck.pop());
  hand1.add_card(myDeck.pop());
  hand1.add_card(myDeck.pop());
  hand1.add_card(myDeck.pop());
  */

  console.log(hand1.score_hand());
  console.log(hand1);
}

test();
