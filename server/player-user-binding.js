/**
 * PlayerUserBinding
 * A 2-way dictionary to fetch a player's user, and vice versea
 *
 * GameController handles users
 * Game object handles players
 * We need a liaison between these two for robust user management
 * The game object and controller are both aware of the socket object
 */
class PlayerUserBinding{
  constructor(){
    this.playerMap = new Map();
    this.userMap = new Map();
    this.playerIndexMap = new Map();
  }

  /**
   * add_player
   * input:
   *    player - The player which we are adding to our 2-way hash map
   *    user - The user which is linked to the player
   *
   * Add player to 
   */
  add_entry(player, user, index){
    var socketId = user.socket.id;
    this.playerMap.set(socketId, player);
    this.userMap.set(socketId, user);
    this.playerIndexMap.set(socketId, index);
  }

  /**
   * get_user
   * Gets the user linke to the player
   */
  get_user(player){
    var socketId = player.uuid;
    return this.userMap.get(socketId);
  }

  /**
   * get_player
   * Gets the player linked to the user
   */
  get_player(user){
    var socketId = user.socket.id;
    return this.playerMap.get(socketId);
  }

  /**
   * get_index
   */
  get_index(player){
    var socketId = player.uuid;
    return this.playerIndexMap.get(socketId);
  }

  /**
   * has_user
   */
  has_user(user){
    var socketId = user.socket.id;
    return this.userMap.has(socketId);
  }

  /**
   * remove_user
   * Removes user from the user map, and its corresponding player from the other map
   */
  remove_user(user){
    var socketId = user.socket.id;
    this.playerMap.delete(socketId);
    this.userMap.delete(socketId);
    this.playerIndexMap.delete(socketId);
  }

  /**
   * remove_player
   * Removes player from the player map, and its corresponding user from the user map
   */
  remove_player(player){
    var socketId = player.uuid;
    this.playerMap.delete(socketId);
    this.userMap.delete(socketId);
    this.playerIndexMap.delete(socketId);
  }
}

module.exports = {
  PlayerUserBinding,
};
