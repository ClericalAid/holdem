/**
 * User
 * Member variables:
 * socket - The socket associated to the user
 * userName - The user's username
 *
 * In the future:
 * Socket information?
 * Associate sockets to unique users (who are registered, etc.)
 *
 * The approach of "one socket = one user" probably only works for io games
 */
class User{
  constructor(){
    this.socket = null;
    this.userName = "";
  }

  set_username(userName){
    this.userName = userName;
  }
}

/**
 * UserManager
 * Manages the users whom are connected to the webapp. It maps each user to their socket.
 *
 * In the future:
 * This object should also deal with modifying the user's attributes. For example, keeping
 * track of their chips when they leave a table. This way, users can effectively move tables.
 * The end goal of this project should also be properly defined here.
 *
 * Member variables:
 * userMap - A map connecting users to their socket id
 *
 * Debug variables:
 * userCount - A count of the total amount of users connected
 * defaultNames - Default names for the user when a username is not selected
 */
class UserManager{
  constructor(){
    this.userMap = new Map();
    this.userCount = 0;
    this.defaultNames = ["crazycat", "derpydog", "erraticeel", "flakyferret", "insaneiguana", "maniacalmouse"];
  }

  /**
   * add_user
   * input:
   *  socket - The socket which is supposed to be connected to the user
   * Maps the socket to the user
   */
  add_user(socket){
    var addUser = new User();
    addUser.userName = this.defaultNames[this.userCount];
    addUser.socket = socket;
    this.userMap.set(socket.id, addUser);
    this.userCount += 1;
    this.userCount = this.userCount % 6;
  }

  /**
   * get_user
   */
  get_user(socket){
    return this.userMap.get(socket.id);
  }

  /**
   * set_username
   */
  set_username(socket, userName){
    this.userMap.get(socket.id).set_username(userName);
  }

  /**
   * disconnect_user
   */
  disconnect_user(socket){
    this.userMap.delete(socket.id);
  }
}

module.exports = {
  UserManager,
};
