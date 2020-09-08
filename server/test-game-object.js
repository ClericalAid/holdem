const Game = require('./game');
const process = require('process');

var gameObject = new Game.Game();

async function test(){
  var user0 = {};
  var user1 = {};
  var user2 = {};
  var user3 = {};
  var user4 = {};
  var user5 = {};

  user0.userName = "rabbit";
  user0.id = "socket0";

  user1.userName = "snake";
  user1.id = "socket1";

  user2.userName = "tiger";
  user2.id = "socket2";

  user3.userName = "horse";
  user3.id = "socket3";

  user4.userName = "chicken";
  user4.id = "socket4";

  user5.userName = "mouse";
  user5.id = "socket5";

  gameObject.add_user(user0.userName, user0.id);
  gameObject.add_user(user1.userName, user1.id);
  gameObject.add_user(user2.userName, user2.id);
  gameObject.add_user(user3.userName, user3.id);
  gameObject.add_user(user4.userName, user4.id);
  gameObject.add_user(user5.userName, user5.id);
  
  gameObject.remove_user(user2.id);
  gameObject.remove_user(user3.id);
  gameObject.remove_user(user4.id);
  gameObject.remove_user(user5.id);

  await gameObject.new_hand();
}

function print_player_actions(player){
  console.log("Your options are: ");
  if (player.canCall === true){
    console.log("Call: " + player.amountToCall);
  }
  if (player.canRaise === true){
    console.log("raise: " + player.minRaiseTotal + " to " + player.stack);
  }
  if (player.canAllIn === true){
    console.log("all in: " + player.stack);
  }
  if (player.canCallIn === true){
    console.log("call in: " + player.stack)
  }
  if (player.canFold === true){
      console.log("fold");
  }
}

process.stdin.on("data", input => {
  var inputString = input.toString().trim();
  var args = inputString.split(' ');
  console.log(args);

  if (args[0] == "call"){
    gameObject.call();
  }

  if (args[0] == "raise"){
    var amount = parseInt(args[1]);
    gameObject.raise(amount);
  }

  if (args[0] == "fold"){
    gameObject.fold();
  }
  if (args[0] == "shove"){
    gameObject.all_in();
  }
  if (args[0] == "moves"){
    var actor = gameObject.current_actor();
    print_player_actions(actor);
  }

  if (args[0] == "print"){
    gameObject.print_board();
  }

  if (args[0] == "board"){
    gameObject.print_board();
  }

  if (args[0] == "new"){
    gameObject.new_hand();
  }
  if (args[0] == "debug"){
    debugger;
  }
});

test();

