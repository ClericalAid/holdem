import React from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import socketioclient from "socket.io-client";
import './pure-min.css';

import Root from "./root";
class App extends React.Component {
  constructor() {
    super();
    const endPoint = "http://127.0.0.1:8001"
    this.socket = socketioclient(endPoint);
    this.state = {
      endpoint: "http://127.0.0.1:8001",
      socket: this.socket,
      socketId: "",
    };
  }

  componentDidMount(){
  }

  render() {
    return(
      <Root socket={this.state.socket}/>
    );
  }
}

ReactDOM.render(
  <Router>
    <App />
  </Router>,
  document.getElementById('root')
);

