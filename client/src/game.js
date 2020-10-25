import React from 'react';
import Popup from 'reactjs-popup';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect
} from "react-router-dom";

const minimalGame = require("./minimal-game");
const playerActions = require("./player-actions");

// Images
const cardAssets = require.context("./assets/playing-card-assets/", false, /\.(gif|jpg)$/);
const emptySeat = require('./assets/blank-player.png');

const cardPictures = new Map(); // Maybe this should be moved into game object

// consts
const BLANK_CARD = "BLANK"; // A symbol for a blank card

/**
 * Game React.Component
 * Renders the game screen/ table where the players play. This class also deals with the
 * server interactions necessary for the player to play the game.
 *
 * Member variables:
 * gameObject - The gameObject which "plays" the game (as much as the game can be played
 *    considering it is not a complete game object)
 * dealer - The array index of the dealer
 * validMoves - Keeps track of the valid moves which the player can make (raise, call, etc.)
 *
 * State variables:
 * players - The array containing all player objects
 * observers - People watching the table but not playing (not used right now)
 * sharedCards - The community cards in the middle
 * pot - The amount of chips in the pot
 * sidePots - Side pots if somebody is all in
 * validMoves - The valid moves which the player can perform
 * betSize - How much the player is about to put in the pot
 * amountToCall - How many chips the player needs to put into the pot to call
 */
export default class Game extends React.Component {
  constructor(props) {
    super(props);

    // Constants
    this.MIDDLE_BOTTOM_PLAYER = 4;
    // Game state
    this.gameObject = new minimalGame.MinimalGame();
    this.dealer = -1;
    this.validMoves = new playerActions.PlayerActions();

    this.state = {
      players: this.gameObject.players,
      observers: [],
      sharedCards: [],
      pot: 0,
      sidePots: [],
      validMoves: this.validMoves,
      betSize: 0,
      amountToCall: 0,
      playerLost: false,
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

    /**
     * shared_cards
     * Update the shared cards
     */
    this.props.socket.on("shared_cards", (sharedCards) => {
      this.gameObject.update_shared_cards(sharedCards);
      this.setState((state, props) => {
        return ({
          sharedCards: this.gameObject.sharedCards,
        });
      });
    });

    /**
     * dealer
     * Which player is the dealer
     */
    this.props.socket.on("dealer", (dealerIndex) => {
      this.gameObject.set_dealer(dealerIndex);
      this.setState((state, props) => {
        return ({
          players: this.gameObject.players,
        });
      });
    });

    /**
     * active_player
     * Which player is currently acting
     */
    this.props.socket.on("active_player", (activePlayerIndex) => {
      this.gameObject.set_active_player(activePlayerIndex);
      this.setState((state, props) => {
        return ({
          players: this.gameObject.players,
        });
      });
    });

    /**
     * new_user
     */
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

    /**
     * remove_user
     */
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
      this.setState((state, props) => {
        return({
          players: this.gameObject.players,
          pot: this.gameObject.pot,
        });
      });
    });

    /**
     * update_win_chips
     * Distribute chips amongst winning players
     */
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
     * showdown_reveal
     * show 2 to win baby
     */
    this.props.socket.on("showdown_reveal", (playerCards) => {
      this.gameObject.update_players_hands(playerCards);
      this.setState((state, props) => {
        return({
          players: this.gameObject.players,
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
     * fold
     * A player has folded
     */
    this.props.socket.on("fold", (playerIndex) => {
      this.gameObject.fold(playerIndex);
    });

    /**
     * valid_moves
     * The server is informing us of our valid moves
     */
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
     * user_lost
     * The user has lost the game (their stack is at 0)
     */
    this.props.socket.on("user_lost", () => {
      this.setState((state, props) => {
        return({
          playerLost: true,
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

  /**
   * organize_images
   * Takes all the card images and maps them to the values they represent
   */
  organize_images(){
    for (const cardKey of cardAssets.keys()){
      var cardName = cardKey.slice(2, -4);
      var cardImage = <img src={cardAssets(cardKey)}></img>;
      cardPictures.set(cardName, cardImage);
    }
  }

  /**
   * handle_bet_change
   * Updates the bet amount
   * TODO: Should the enter key submit the bet?
   */
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

  /**
   * on_call
   */
  on_call(){
    this.validMoves.ending_turn();
    this.props.socket.emit("call", null);
  }

  /**
   * on_fold
   */
  on_fold(){
    this.validMoves.ending_turn();
    this.props.socket.emit("fold", null);
  }

  /**
   * on_raise
   */
  on_raise(){
    this.validMoves.ending_turn();
    var betAmount = this.state.betSize;
    this.props.socket.emit("raise", betAmount);
  }

  /**
   * on_all_in
   */
  on_all_in(){
    this.validMoves.ending_turn();
    this.props.socket.emit("all_in", null);
  }

  /**
   * on_print
   */
  on_print(){
    this.props.socket.emit("print_board", null);
  }

  /**
   * player_factory
   * Goes through each player in the array and generates the JSX/ html to render each player
   *
   * 1)
   * If the player is null, it's an empty seat. We will mark it accordingly
   *
   * 2)
   * Otherwise, just generate the player
   */
  player_factory = (player, index) => {
    // 1)
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

    // 2)
    else{
      return(
        <div className="pure-u-1-3" key={index}>
          <Player stack={player.stack} name={player.name} hand={player.hand} hero={player.hero} folded={player.folded} sittingOut={player.sittingOut} dealer={player.dealer} isCurrentActor={player.isCurrentActor}/>
        </div>
      );
    }
  }

  /**
   * rotate_player_array
   * input:
   *  playerArray - the array of player objects
   *  heroIndex - The index of the hero (the player who needs to be at index 5)
   *
   * Rotates the player array such that the hero is at array index 5. We create a new array and
   * just fill it in with a cyclical iterator.
   */
  rotate_player_array(playerArray, heroIndex){
    var retArray = new Array(playerArray.length);
    var playerArrayPointer = heroIndex;
    var retArrayPointer = this.MIDDLE_BOTTOM_PLAYER;
    for (var i = 0; i < playerArray.length; i++){
      retArray[retArrayPointer] = playerArray[playerArrayPointer];
      retArrayPointer += 1;
      playerArrayPointer += 1;
      retArrayPointer = retArrayPointer % playerArray.length;
      playerArrayPointer = playerArrayPointer % playerArray.length;
    }
    return retArray;
  }
  render() {
    const half = Math.ceil(this.state.players.length / 2);
    const allPlayers = this.state.players.map(this.player_factory);
    const rotatedPlayerArray = this.rotate_player_array(allPlayers, this.gameObject.hero);
    /*
    const players1 = allPlayers.slice(0, half);
    const players2 = allPlayers.slice(-half);
    */
    const players1 = rotatedPlayerArray.slice(0, half);
    const players2 = rotatedPlayerArray.slice(-half);
    players2.reverse();

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
        <Popup open={this.state.playerLost}>
          <div className="modal">
            USER LOST!
          </div>
        </Popup>
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

/**
 * Player()
 * input:
 *  props - React props
 * Renders players
 */
function Player(props){
  if (props.hand.length > 0){
    var playerCard1 = props.hand[0];
    var playerCard2 = props.hand[1];
    if (playerCard1 !== BLANK_CARD && playerCard2 !== BLANK_CARD){
      var cardString1 = "" + playerCard1.rank + playerCard1.suit;
      var cardString2 = "" + playerCard2.rank + playerCard2.suit;
    }
    else{
      var cardString1 = BLANK_CARD;
      var cardString2 = BLANK_CARD;
    }
    var card1 = cardPictures.get(cardString1);
    var card2 = cardPictures.get(cardString2);
  }

  var borderClass = "player-border";
  if (props.isCurrentActor === true){
    borderClass = "active-player-border";
  }
  return(
    <div className={borderClass}>
      <div style={{textAlign: "center"}}>
        <p>{props.name}</p>
      </div>
      <div style={{textAlign: "center"}}>
        {props.folded === false && props.hero === false &&
          <div>
            {card1}{card2}
          </div>
        }
        {props.hand.length > 0 && props.hero === true && props.folded === false &&
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
