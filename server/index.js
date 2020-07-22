var express = require('express');
var http = require('http')
var socketio = require('socket.io');
var userManagement = require('./userManagement');

const PORT = 4001;
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const userManager = new userManagement.UserManager();

app.get('/', (req, res) => {
  console.log(__dirname);
  res.send("Back to the basics");
});

io.on('connection', (socket) => {
  userManager.add_user(socket);
  console.log("user connected with socket.id: " + socket.id);
  console.log(userManager.get_user(socket).userName);

  socket.on("disconnect", () => {
    console.log("Client disconnected, socket.id: " + socket.id);
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
    socket.emit("join", userManager.userMap);
  });
});

server.listen(8001, () => {
  console.log("listening on port 8001");
});
