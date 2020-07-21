var express = require('express');
var http = require('http');
var socketio = require('socket.io');

const PORT = 4001;
const app = express();
const server = http.createServer(app);
const io = socketio(server);

userNames = ["crazycat", "derpydog"];
userCount = 0;

var users = {};

app.get('/', (req, res) => {
  console.log(__dirname);
  res.send("Back to the basics");
});

io.on('connection', (socket) => {
  console.log("user connected with socket.id: " + socket.id);

  users[socket.id] = userNames[userCount]
  userCount += 1;
  userCount = userCount % 2;

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  socket.on("chat message", (message) => {
    packet = {
      message: message,
      user: users[socket.id],
    }
    io.emit("chat message", packet);
    //socket.emit("chat message", (message));
  });
});

server.listen(8001, () => {
  console.log("listening on port 8001");
});
