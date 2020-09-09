import React from 'react';

const minimalGame = require("./minimal-game");
const playerActions = require("./player-actions");

// Images
const cardAssets = require.context("./assets/playing-card-assets/", false, /\.(gif|jpg)$/);
const emptySeat = require('./assets/blank-player.png');

const cardPictures = new Map();

export default class Game extends React.Component {
  constructor(props) {
    super(props);
    // Constants
    this.SPADES = 0;
    this.HEARTS = 1;
    this.CLUBS = 2;
    this.DIAMONDS = 3;

    this.gameObject = new minimalGame.MinimalGame();
    this.hero = -1;
    this.dealer = -1;
    this.validMoves = new playerActions.PlayerActions();

    this.spadesPictures = [];
    this.heartsPictures = [];
    this.clubsPictures = [];
    this.diamondsPictures = [];

    this.state = {
      players: this.gameObject.players,
      observers: [],
      sharedCards: [],
      pot: 0,
      sidePots: [],
      validMoves: this.validMoves,
      betSize: 0,
      amountToCall: 0,
    };

    this.handle_bet_change = this.handle_bet_change.bind(this);
    this.on_call = this.on_call.bind(this);
    this.on_fold = this.on_fold.bind(this);
    this.on_raise = this.on_raise.bind(this);
    this.on_all_in = this.on_all_in.bind(this);
    this.on_print = this.on_print.bind(this);
  }

  componentDidMount(){
    this.organize_images();

    this.props.socket.emit("join", "");

    /**
     * new_hand
     */
    this.props.socket.on("new_hand", (jsonCards) => {
      var playerHand = JSON.parse(jsonCards);
      this.gameObject.new_hand(playerHand);
      this.setState((state, props) => {
        return ({
          players:this.gameObject.players,
          pot: this.gameObject.pot,
        });
      });
    });

    this.props.socket.on("shared_cards", (sharedCards) => {
      this.gameObject.update_shared_cards(sharedCards);
      this.setState((state, props) => {
        return ({
          sharedCards: this.gameObject.sharedCards,
        });
      });
    });

    this.props.socket.on("dealer", (dealerIndex) => {
      this.gameObject.set_dealer(dealerIndex);
      this.setState((state, props) => {
        return ({
          players: this.gameObject.players,
        });
      });
    });


    this.props.socket.on("new_user", (newPlayerInfo) => {
      var newPlayer = newPlayerInfo[0];
      var newPlayerIndex = newPlayerInfo[1];
      this.gameObject.add_user(newPlayer, newPlayerIndex);
      this.setState((state, props) => {
        return({
          players:this.gameObject.players,
        });
      })
    });

    this.props.socket.on("remove_user", (playerIndex) => {
      this.gameObject.remove_user(playerIndex);
      this.setState((state, props) => {
        return({
          players:this.gameObject.players,
        });
      })
    });

    /**
     * update_player_chips
     * Usually used at the end of the hand
     */
    this.props.socket.on("update_player_chips", (packet) => {
      var allPlayerStacks = packet[0];
      var potRemainder = parseInt(packet[1]);
      this.gameObject.update_player_stacks(allPlayerStacks, potRemainder);
      console.log("updating player chips");
      console.log(this.gameObject);
      this.setState((state, props) => {
        return({
          players: this.gameObject.players,
          pot: this.gameObject.pot,
        });
      });
    });

    this.props.socket.on("update_win_chips", (packet) => {
      var chipWinning = parseInt(packet[0]);
      var playerIndex = parseInt(packet[1]);
      this.gameObject.win_chips(chipWinning, playerIndex);
      this.setState((state, props) => {
        return({
          players: this.gameObject.players,
          pot: this.gameObject.pot,
        });
      });
    });


    /**
     * update_bet
     * A generic function to have a user put their chips in the pot.
     */
    this.props.socket.on("update_bet", (bettingInformation) => {
      var betAmount = bettingInformation[0];
      var playerIndex = bettingInformation[1];
      this.gameObject.update_bet(betAmount, playerIndex);
      this.setState((state, props) => {
        return({
          players: this.gameObject.players,
          pot: this.gameObject.pot,
        });
      });
    });

    /**
     *
     */
    this.props.socket.on("fold", (playerIndex) => {
      this.gameObject.fold(playerIndex);
    });

    this.props.socket.on("valid_moves", (bettingInformation) => {
      this.validMoves.import_from_server(bettingInformation);
      this.setState((state, props) => {
        return({
          validMoves: this.validMoves,
          betSize: this.validMoves.minRaiseTotal,
        });
      });
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
    this.props.socket.on("game_state", (serverGameObject) => {
      //var serverGameObject = JSON.parse(jsonGameObject);
      this.gameObject.clientSocketId = this.props.socket.id;
      this.gameObject.clientSocket = this.props.socket;
      this.gameObject.flash_game_state(serverGameObject);

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

  organize_images(){
    for (const cardKey of cardAssets.keys()){
      var cardName = cardKey.slice(2, -4);
      var cardImage = <img src={cardAssets(cardKey)}></img>;
      cardPictures.set(cardName, cardImage);
    }
  }
  handle_bet_change(event){
    const re = /^[0-9]*$/;
    var newBetSize = event.target.value;
    if (re.test(event.target.value)){
      this.setState((state, props) => {
        return({
          betSize: newBetSize,
        });
      });
    }
  }

  on_call(){
    this.validMoves.ending_turn();
    this.props.socket.emit("call", null);
  }

  on_fold(){
    this.validMoves.ending_turn();
    this.props.socket.emit("fold", null);
  }

  on_raise(){
    this.validMoves.ending_turn();
    var betAmount = this.state.betSize;
    this.props.socket.emit("raise", betAmount);
  }

  on_all_in(){
    this.validMoves.ending_turn();
    this.props.socket.emit("all_in", null);
  }

  on_print(){
    this.props.socket.emit("print_board", null);
  }

  player_factory = (player, index) => {
    if (player == null){
      return(
        <div className="pure-u-1-3" key={index}>
          <div style={{textAlign: "center"}}>
            <p>EMPTY SEAT</p>
            <div>
              <img src={emptySeat}></img>
            </div>
          </div>
        </div>
      );
    }
    else{
      return(
        <div className="pure-u-1-3" key={index}>
          <Player stack={player.stack} name={player.name} hand={player.hand} hero={player.hero} folded={player.folded} sittingOut={player.sittingOut} dealer={player.dealer}/>
        </div>
      );
    }
  }

  render() {
    console.log(this.gameObject);
    const half = Math.ceil(this.state.players.length / 2);
    const allPlayers = this.state.players.map(this.player_factory);
    const players1 = allPlayers.slice(0, half);
    const players2 = allPlayers.slice(-half);

    var betButton = null;
    if (this.state.validMoves.canRaise){
      betButton = (
        <button className="pure-button" margin="auto" onClick={this.on_raise}>Raise</button>
      );
    }
    else if (this.state.validMoves.canCallIn || this.state.validMoves.canAllIn){
      betButton = (
        <button className="pure-button" margin="auto" onClick={this.on_all_in}>Shove</button>
      );
    }

    var callButton = null;
    if (this.state.validMoves.amountToCall === 0){
      callButton = <button className="pure-button" margin="auto" onClick={this.on_call}>Check</button>;
    }
    else{
      callButton = 
        <div>
          <button className="pure-button" margin="auto" onClick={this.on_call}>Call</button>
          <div>
            {this.state.validMoves.amountToCall}
          </div>
        </div>;
    }

    return(
      <div>
        <div className="pure-g">
          {players1}
          <div className="pure-u-1">
            <SharedCards sharedCards={this.state.sharedCards} pot={this.state.pot}/>
          </div>
          {players2}
        </div>
        <div className="pure-g">
          <div className="pure-u-1-2">
            <div className="pure-g">
              <div className="pure-u-1-3">
                {this.state.validMoves.canFold &&
                  <button className="pure-button" margin="auto" onClick={this.on_fold}>Fold</button>
                }
              </div>
              <div className="pure-u-1-3">
                {this.state.validMoves.canCall && callButton}
              </div>
              <div className="pure-u-1-3">
                {betButton !== null && betButton}
              </div>
            </div>
          </div>
          <div className="pure-u-1-2">
            {this.state.validMoves.canRaise &&
              <div>
                <input type="text" value={this.state.betSize} onChange={this.handle_bet_change}></input>
              </div>
            }
          </div>
        </div>
        <div>
          <button className="pure-button" margin="auto" onClick={this.on_print}>print_serverside</button>
        </div>
      </div>
    );
  }
}

function Player(props){
  var card1 = cardPictures.get("BLANK");
  var card2 = cardPictures.get("BLANK");
  if (props.hand.length > 0 && props.hero === true){
    var playerCard1 = props.hand[0];
    var playerCard2 = props.hand[1];
    var cardString1 = "" + playerCard1.rank + playerCard1.suit;
    var cardString2 = "" + playerCard2.rank + playerCard2.suit;
    card1 = cardPictures.get(cardString1);
    card2 = cardPictures.get(cardString2);
  }
  return(
    <div>
      <div style={{textAlign: "center"}}>
        <p>{props.name}</p>
      </div>
      <div style={{textAlign: "center"}}>
        {props.folded === false && props.hero === false &&
          <div>
            {card1}{card2}
          </div>
        }
        {props.hand.length > 0 && props.hero === true &&
          <div>
            {card1}{card2}
          </div>
        }
        Stack: {props.stack}
      </div>
      <div style={{textAlign: "center"}}>
        {props.hero === true &&
          <p>HERO</p>
        }
        {props.dealer === true &&
          <p>DEALER</p>
        }
      </div>
    </div>
  );
}

function SharedCards(props){
  var sharedCards = props.sharedCards.map((card, index) => {
    var cardString = "" + card.rank + card.suit;
    return cardPictures.get(cardString);
  });
  return (
    <div style={{textAlign: "center"}}>
      <div>{sharedCards}</div>
      <div>pot: {props.pot}</div>
    </div>
  );
}
