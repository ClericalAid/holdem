import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect,
  useParams
} from "react-router-dom";


import Game from "./game";
import MessageService from "./messaging";

export default class GameRoom extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount(){
    this.props.socket.emit("join_room", this.props.roomName);
  }

  render() {
    return(
      <div>
        <Game socket={this.props.socket}/>
        <MessageService socket={this.props.socket} />
      </div>
    );
  }
}
