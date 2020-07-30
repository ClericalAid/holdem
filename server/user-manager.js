class User{
  constructor(){
    this.socket = null;
    this.userName = "";
  }

  set_username(userName){
    this.userName = userName;
  }
}

class UserManager{
  constructor(){
    this.userMap = new Map();
    this.userCount = 0;
    this.defaultNames = ["crazycat", "derpydog", "erraticeel", "flakyferret", "insaneiguana", "maniacalmouse"];
  }

  add_user(socket){
    var addUser = new User();
    addUser.userName = this.defaultNames[this.userCount];
    addUser.socket = socket;
    this.userMap.set(socket.id, addUser);
    this.userCount += 1;
    this.userCount = this.userCount % 2;
  }

  get_user(socket){
    return this.userMap.get(socket.id);
  }

  set_username(socket, userName){
    this.userMap.get(socket.id).set_username(userName);
  }

  disconnect_user(socket){
    this.userMap.delete(socket.id);
  }
}

module.exports = {
  UserManager,
};
