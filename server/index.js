const express = require('express');
const http = require('http')
const socketio = require('socket.io');
const user_manager = require('./user-manager');
const room_manager = require('./room-manager');

const PORT = 4001;
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const userManager = new user_manager.UserManager();
const roomManager = new room_manager.RoomManager(io);

app.get('/', (req, res) => {
  console.log(__dirname);
  res.send("Back to the basics");
});

io.on('connection', (socket) => {
  userManager.add_user(socket);
  console.log("user connected with socket.id: " + socket.id);
  console.log(userManager.get_user(socket).userName);

  /**
   * Disconnect user from games, then delete their online presence
   */
  socket.on("disconnect", () => {
    console.log("Client disconnected, socket.id: " + socket.id);
    roomManager.disconnect_user(userManager.get_user(socket));
    userManager.disconnect_user(socket);
  });

  socket.on("chat message", (message) => {
    messagePacket = {
      message: message,
      user: userManager.get_user(socket.id).userName,
    }
    io.emit("chat message", messagePacket);
  });

  socket.on("join", (packet) => {
    console.log("Placing user into a room");
    roomManager.join_room(userManager.get_user(socket), "DEFAULT_ROOM");
  });
});

server.listen(8001, () => {
  console.log("listening on port 8001");
});
