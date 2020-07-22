import React from 'react';
import ReactDOM from 'react-dom';
import socketioclient from "socket.io-client";
import './pure-min.css';
import MessageService from "./messaging";
import Game from "./game";

class App extends React.Component {
  constructor() {
    super();
    const endPoint = "http://127.0.0.1:8001"
    const socket = socketioclient(endPoint);
    this.state = {
      endpoint: "http://127.0.0.1:8001",
      socket: socket,
    };
  }

  render() {
    return(
      <div>
        <div className="pure-g">
          <div className="pure-u-1-24">
          </div>
          <div className="pure-u-22-24">
            <Game socket={this.state.socket}/>
            <MessageService socket={this.state.socket} />
          </div>
          <div className="pure-u-1-24">
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);

