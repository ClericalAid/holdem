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

    this.on_reset_game = this.on_reset_game.bind(this);
    this.on_start_game = this.on_start_game.bind(this);
    this.on_return_to_room_select = this.on_return_to_room_select.bind(this);
  }

  componentDidMount(){
    this.props.socket.emit("join_room", this.props.roomName);
  }

  on_reset_game(){
  }

  on_start_game(){
    console.log("trying to start the game");
    this.props.socket.emit("start_game", null);
  }

  on_return_to_room_select(){
    this.props.socket.emit("leave_room", this.props.roomName);
  }

  render() {
    return(
      <div>
        <div>
          <Link to="/home">
            <button className="pure-button" margin="auto" onClick={this.on_return_to_room_select}>
              Exit Room
            </button>
          </Link>
        </div>
        <Game socket={this.props.socket}/>
        <div>
          <button className="pure-button" margin="auto" onClick={this.on_start_game}>
            Start Game
          </button>
        </div>
      </div>
    );
  }
}
