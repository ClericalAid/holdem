import React from 'react';

import Game from "./game";
import MessageService from "./messaging";
import UsernameSelect from "./username-select";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect
} from "react-router-dom";


export default class Root extends React.Component {
  constructor(props) {
    super(props);


    this.handle_username_change = this.handle_username_change.bind(this);
    this.handle_username_submit = this.handle_username_submit.bind(this);

    this.state={
      username: "",
      submittingUsername: false,
      usernameConfirmed: false,
      roomList: [],
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
      console.log(roomList);
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


  render() {
    return(
      <div className="pure-g">
        <div className="pure-u-1-24">
        </div>
        <div className="pure-u-22-24">
          <Switch>
            <Route path="/home">
              <p>What up homie</p>
            </Route>
            <Route path="/room">
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
      </div>
    );
  }
}

/**
 * these lines invoke the game
<Game socket={this.props.socket}/>
<MessageService socket={this.props.socket} />
*/
