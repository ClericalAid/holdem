import React from 'react';
import './pure-min.css';

const minimalGame = require("./minimal-game");

export default class Game extends React.Component {
  constructor(props) {
    super(props);

    this.gameObject = new minimalGame.MinimalGame();
    this.hero = -1;
    this.dealer = -1;

    this.BLANK = "HIDDEN_CARD";
    this.HIDDEN_HAND = [this.BLANK, this.BLANK];

    this.state = {
      players: this.gameObject.players,
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

    /**
     * new_hand
     */
    this.props.socket.on("new_hand", (cards) => {
      console.log(cards);
      var playerHand = JSON.parse(cards);
      for (const actor of this.gameObject.players){
        if (actor !== null){
          if (actor.hero === false){
            actor.hand = this.HIDDEN_HAND;
          }
          else{
            actor.hand = playerHand;
          }
        }
      }
    });

    this.props.socket.on("new_user", (jsonPlayerArray) => {
      var serverPlayerArray = JSON.parse(jsonPlayerArray);
      this.gameObject.players = serverPlayerArray;

      for (const actor of this.gameObject.players){
        if (actor !== null && actor.uuid === this.props.socket.id){
          actor.hero = true;
        }
      }

      this.setState((state, props) => {
        return({
          players:this.gameObject.players,
        });
      })
    });

    /**
     * GAME_STATE
     * Receives the game state from the server. This should be called upon first joining the room
     * and we know absolutely nothing.
     *
     * Get the player information
     *
     * Get the board state
     *
     * ???
     *
     * Profit?
     */
    this.props.socket.on("game_state", (jsonGameObject) => {
      var serverGameObject = JSON.parse(jsonGameObject);
      this.gameObject.players = serverGameObject.players;
      this.gameObject.sharedCards = serverGameObject.sharedCards;
      this.gameObject.dealer = serverGameObject.dealer;
      this.gameObject.pot = serverGameObject.pot;

      console.log(serverGameObject);

      for (const actor of this.gameObject.players){
        if (actor !== null && actor.uuid === this.props.socket.id){
          actor.hero = true;
        }
      }

      this.setState((state, props) => {
        return({
          players: this.gameObject.players,
          sharedCards: this.gameObject.sharedCards,
          pot: this.gameObject.pot,
          sidePots: this.gameObject.sidePots,
        });
      });
    });
  }

  player_factory = (player, index) => {
    if (player == null){
      return(
        <div className="pure-u-1-3" key={index}>
          <div style={{textAlign: "center"}}>
            <p>EMPTY SEAT</p>
          </div>
        </div>
      );
    }
    else{
      return(
        <div className="pure-u-1-3" key={index}>
          <Player stack={player.stack} name={player.name} hand={player.hand} hero={player.hero} folded={player.folded}/>
        </div>
      );
    }
  }

  render() {
    const half = Math.ceil(this.state.players.length / 2);
    const allPlayers = this.state.players.map(this.player_factory);
    const players1 = allPlayers.slice(0, half);
    const players2 = allPlayers.slice(-half);
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
