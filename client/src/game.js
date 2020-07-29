import React from 'react';
import './pure-min.css';

export default class Game extends React.Component {
  constructor(props) {
    super(props);

    const MAX_PLAYERS = 6;
    this.state = {
      players: [],
      observers: [],
    };
  }

  componentDidMount(){
    this.props.socket.emit("join", "");
    this.props.socket.on("join", (userMap) => {
      console.log(userMap);
    });
    this.props.socket.on("new_hand", (cards) => {
    });
    this.props.socket.on("GAME_STATE", (gameObject) => {
      console.log(JSON.parse(gameObject));
    });
  }

  render() {
    return(
      <div>
        <div className="pure-g">
          <div className="pure-u-1-3">
            <Player />
          </div>
          <div className="pure-u-1-3">
            <Player />
          </div>
          <div className="pure-u-1-3">
            <Player />
          </div>
          <div className="pure-u-1">
            <SharedCards />
          </div>
          <div className="pure-u-1-3">
            <Player />
          </div>
          <div className="pure-u-1-3">
            <Player />
          </div>
          <div className="pure-u-1-3">
            <Player />
          </div>
        </div>
      </div>
    );
  }
}

class Player extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      chips: 0,
      name: "",
      cards: [],
    }
  }

  render() {
    return(
      <div>
        <div style={{textAlign: "center"}}>
          <p>Player Name</p>
        </div>
        <div style={{textAlign: "center"}}>
          <p>Card1 Card2 Stack: 100bb</p>
        </div>
      </div>
    );
  }
}

class SharedCards extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      cards: []
    }
  }

  render() {
    return(
      <div style={{textAlign: "center"}}>
        <p>Deck Flop1 Flop2 Flop3 Turn River</p>
      </div>
    );
  }
}
