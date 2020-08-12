const Game = require('./game');
const process = require('process');

var gameObject = new Game.Game();

async function test(){
  var socket0 = {};
  var socket1 = {};
  var socket2 = {};
  var socket3 = {};
  var socket4 = {};
  var socket5 = {};

  socket0.id = "socket0";
  socket1.id = "socket1";
  socket2.id = "socket2";
  socket3.id = "socket3";
  socket4.id = "socket4";
  socket5.id = "socket5";

  var user0 = {};
  var user1 = {};
  var user2 = {};
  var user3 = {};
  var user4 = {};
  var user5 = {};

  user0.userName = "rabbit";
  user1.userName = "snake";
  user2.userName = "tiger";
  user3.userName = "horse";
  user4.userName = "chicken";
  user5.userName = "mouse";

  user0.socket = socket0;
  user1.socket = socket1;
  user2.socket = socket2;
  user3.socket = socket3;
  user4.socket = socket4;
  user5.socket = socket5;

  gameObject.add_user(user0);
  gameObject.add_user(user1);
  gameObject.add_user(user2);
  gameObject.add_user(user3);
  gameObject.add_user(user4);
  gameObject.add_user(user5);

  gameObject.remove_user(user3);
  gameObject.remove_user(user4);
  gameObject.remove_user(user5);

  /*
  gameObject.players[0].stack = 200;
  gameObject.players[1].stack = 50;
  gameObject.players[2].stack = 100;
  */

  await gameObject.new_hand();
}

function print_player_actions(player){
  if (player.canRaise == true){
    console.log("Your options are: ");
    console.log("Call: " + player.amountToCall);
    console.log("raise: " + player.minRaiseTotal + " to " + player.stack);
    console.log("all in: " + player.stack);
    if (player.canFold == true){
      console.log("fold");
    }
  }

  else if (player.canCall == true){
    console.log("Call: " + player.amountToCall)
    console.log("all in: " + player.stack)
    if (player.canFold == true){
      console.log("fold");
    }
  }

  else if (player.canCallIn == true){
    console.log("all in: " + player.stack)
    if (player.canFold == true){
      console.log("fold");
    }
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

  if (args[0] == "debug"){
    debugger;
  }
});

test();

