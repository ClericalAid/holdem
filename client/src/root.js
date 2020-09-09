import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect
} from "react-router-dom";

import Game from "./game";
import MessageService from "./messaging";
import UsernameSelect from "./username-select";
import RoomSelect from "./room-select";
import GameRoom from "./game-room";

export default class Root extends React.Component {
  constructor(props) {
    super(props);


    this.handle_username_change = this.handle_username_change.bind(this);
    this.handle_username_submit = this.handle_username_submit.bind(this);
    this.handle_room_select = this.handle_room_select.bind(this);

    this.state={
      username: "",
      submittingUsername: false,
      usernameConfirmed: false,
      roomList: [],
      roomName: "",
    };
  }

  componentDidMount(){
    this.props.socket.on("username_submitted", (packet) => {
      this.setState((state, props) => {
        return({
          usernameConfirmed: true,
        });
      });
    });

    this.props.socket.on("room_list", (roomList) => {
      this.setState((state, props) => {
        return ({
          roomList: roomList,
        });
      });
    });
  }

  handle_username_change(newName){
    this.setState((state, props) => {
      return({
        username: newName,
      });
    });
  }

  handle_username_submit(newName){
    this.props.socket.emit("submit_username", this.state.username);
    this.setState((state, props) => {
      return({
        submittingUsername: true,
      });
    });
  }

  handle_room_select(event){
    var roomName = event.target.name;
    this.setState((state, props) => {
      return({
        roomName: roomName,
      });
    });
  }

  render() {
    return(
      <div className="pure-g">
        <div className="pure-u-1-24">
        </div>
        <div className="pure-u-22-24">
          <Switch>
            <Route path="/home">
              <RoomSelect roomList={this.state.roomList} on_room_select={this.handle_room_select} />
            </Route>
            <Route path="/room/:id">
              <GameRoom socket={this.props.socket} roomName={this.state.roomName}/>
            </Route>
            <Route path="/">
              <UsernameSelect socket={this.props.socket} on_username_change={this.handle_username_change} on_username_submit={this.handle_username_submit} submittingUsername={this.state.submittingUsername}/>
              {this.state.usernameConfirmed &&
                <Redirect to="/home" />
              }
            </Route>
          </Switch>
        </div>
        <div className="pure-u-1-24">
        </div>
        {!this.state.usernameConfirmed &&
          <Redirect to="/" />
        }
      </div>
    );
  }
}

/**
 * these lines invoke the game
<Game socket={this.props.socket}/>
<MessageService socket={this.props.socket} />
*/
