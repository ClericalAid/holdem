const handRanker = require('./hand-ranker');
const deck = require('./deck');

async function test(){
  const myHand = new handRanker.HandRanker();
  const myDeck = new deck.Deck();
  var frequencies = new Array(10);
  frequencies.fill(0);
  const trials = 100000;

  for (var i = 0; i < trials; i++){
    await myDeck.shuffle();
    for (var j = 0; j < 7; j++){
      myHand.add_card(myDeck.pop());
    }
    var handScore = myHand.score_hand();
    frequencies[handScore[0]] += 1;
    myHand.reset();
  }
  frequencies.shift();
  console.log(frequencies);
}

test();
