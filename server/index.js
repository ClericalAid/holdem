var express = require('express');
var http = require('http');
var socketio = require('socket.io');

const PORT = 4001;
const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.get('/', (req, res) => {
  console.log(__dirname);
  res.send("Back to the basics");
});

io.on('connection', (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  })
});

server.listen(8001, () => {
  console.log("listening on port 8001");
});
