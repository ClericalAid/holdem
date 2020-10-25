/**
 * Contains the socket callback functions which the user triggers when interacting with
 * the game controller. These functions are created in the game-controller object, before
 * being assigned as callbacks to the user's socket. Using anonymous functions is annoying because
 * you have to use the removeListener function to unbind the socket to the function. However, you
 * need to know which function you are trying to remove. 
 *
 * I crawled around in the socket.io object and found the functions which hook into the socket.
 * They can be found at: socket._events.<name of event>
 * However, said location holds an array of functions if said event is bound to multiple
 * functions. In summary, things can get messy without having access to the function pointer.
 *
 * In summary: I don't enjoy poking around objects for which there is no exposed API, so we'll
 * manually keep track of the functions like this to ensure proper usage of socket.io
 */
module.exports = function(gameController, socket){
  function valid_user(){
    if (gameController.gameObject.current_actor() === null){
      console.log("current actor is null, suspicious activity in room: ", gameController.roomName);
      return false;
    }
    return (gameController.gameObject.current_actor().socketId === socket.id);
  }

  /**
   * handle_call
   * Very specific steps to be taken here
   *
   * Very specific steps to be taken here:
   * 1) Get the current actor's index and object
   * 2) Perform the desired action
   * 3) Inform the other players that a user placed a bet using the index which was
   *    saved in step 1)
   *
   * It has to be in this order, because the "actor" pointer automatically updates when
   * the action is complete. Therefore, if we perform the action, then look at the actor index,
   * the actor index is pointing to the person who is now acting, not the one who just acted.
   */
  function handle_call(){
    if (valid_user()){
      // 1)
      var recentActorIndex = gameController.gameObject.actor;
      var recentActor = gameController.gameObject.current_actor();

      // 2)
      var actionSucceeded = gameController.gameObject.call();
      if (actionSucceeded === false){
        return false;
      }

      // 3)
      var betAmount = recentActor.lastBetSize;
      gameController.update_bet(betAmount, recentActorIndex);
      gameController.update_gamestate();
    }
    else{
      console.log("A user is trying to act out of order");
    }
  }

  /**
   * handle_raise
   * Please look at the documentation for: handle_call()
   */
  function handle_raise(raiseAmount){
    raiseAmount = parseInt(raiseAmount);
    if (valid_user()){
      var recentActorIndex = gameController.gameObject.actor;
      var recentActor = gameController.gameObject.current_actor();
      var actionSucceeded = gameController.gameObject.raise(raiseAmount);
      if (actionSucceeded === false){
        return false;
      }

      var betAmount = recentActor.lastBetSize;
      gameController.update_bet(betAmount, recentActorIndex);
      gameController.update_gamestate();
    }
    else{
      console.log("A user is trying to act out of order");
    }
  }

  /**
   * handle_all_in
   * Please look at the documentation for: handle_call()
   */
  function handle_all_in(){
    if (valid_user()){
      var recentActorIndex = gameController.gameObject.actor;
      var recentActor = gameController.gameObject.current_actor();
      var actionSucceeded = gameController.gameObject.all_in();
      if (actionSucceeded === false){
        return false;
      }

      var betAmount = recentActor.lastBetSize;
      gameController.update_bet(betAmount, recentActorIndex);
      gameController.update_gamestate();
    }
    else{
      console.log("A user is trying to act out of order");
    }
  }

  /**
   * handle_fold
   * Please look at the documentation for: handle_call()
   */
  function handle_fold(){
    if (valid_user()){
      var recentActorIndex = gameController.gameObject.actor;
      var recentActor = gameController.gameObject.current_actor();
      var actionSucceeded = gameController.gameObject.fold();
      if (actionSucceeded === false){
        return false;
      }

      gameController.update_fold(recentActorIndex);
      gameController.update_gamestate();
    }
    else{
      console.log("A user is trying to act out of order");
    }
  }

  function handle_start_game(){
    gameController.start_game();
  }

  /**
   * DEBUG FUNCTIONS
   */
  function handle_print_board(){
    console.log("Debug command: Print was called");
    gameController.gameObject.print_board();
  }

  function handle_reset_gamestate(){
    console.log("Debug command: resetting gamestate");
    gameController.start_game();
  }

  var userCallbacks = {
    handle_call: handle_call,
    handle_raise: handle_raise,
    handle_all_in: handle_all_in,
    handle_fold: handle_fold,
    handle_start_game: handle_start_game,
    handle_print_board: handle_print_board,
    handle_reset_gamestate: handle_reset_gamestate,
  };
  return userCallbacks;
}
