import React from 'react';
import './pure-min.css';

export default class Game extends React.Component {
  constructor(props) {
    super(props);

    const MAX_PLAYERS = 6;

    var playerArray = new Array(MAX_PLAYERS);
    playerArray.fill(null);
    this.state = {
      playerCharacter: -1,
      players: playerArray,
      observers: [],
      sharedCards: [],
      pot: 0,
      sidePots: [],
    };
  }

  componentDidMount(){
    this.props.socket.emit("join", "");
    this.props.socket.on("join", (userMap) => {
      console.log(userMap);
    });
    this.props.socket.on("new_hand", (cards) => {
      //hmmmmmmm
    });
    this.props.socket.on("GAME_STATE", (jsonGameObject) => {
      var gameObject = JSON.parse(jsonGameObject);
      console.log(gameObject);
      var playerCharacter = -1;
      for (var i = 0; i < gameObject.players.length; i++){
        var player = gameObject.players[i]
        if (player !== null){
          if (player.socketId === this.props.socket.id){
            player.hero = true;
          }
          else{
            player.hero = false;
          }
        }
      }

      this.setState((state, props) => {
        return({
          players: gameObject.players,
          playerCharacter: playerCharacter,
        });
      });
    });
  }

  player_factory = (player) => {
    if (player == null){
      return(
        <div className="pure-u-1-3">
          <div style={{textAlign: "center"}}>
            <p>EMPTY SEAT</p>
          </div>
        </div>
      );
    }
    else{
      return(
        <div className="pure-u-1-3">
          <Player stack={player.stack} name={player.name} hand={player.hand} hero={player.hero} folded={player.folded}/>
        </div>
      );
    }
  }

  render() {
    const half = Math.ceil(this.state.players.length / 2);
    const players1 = this.state.players.slice(0, half).map(this.player_factory);
    const players2 = this.state.players.slice(-half).map(this.player_factory);
    return(
      <div>
        <div className="pure-g">
          {players1}
          <div className="pure-u-1">
            <SharedCards />
          </div>
          {players2}
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
          <p>{this.props.name}</p>
        </div>
        <div style={{textAlign: "center"}}>
          <p>{this.props.hand.length > 0 && <p>Card1 Card2</p>} Stack: {this.props.stack}</p>
        </div>
        <div style={{textAlign: "center"}}>
          {this.props.hero === true &&
            <p>PLAYER_CHARACTER</p>
          }
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
