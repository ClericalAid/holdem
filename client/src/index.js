import React from 'react';
import ReactDOM from 'react-dom';
import socketioclient from "socket.io-client";
import './pure-min.css';

class App extends React.Component {
  constructor() {
    super();
    const endPoint = "http://127.0.0.1:8001"
    const socket = socketioclient(endPoint);
    //socket.emit("chat message", "Handshake");
    this.state = {
      endpoint: "http://127.0.0.1:8001",
      socket: socket,
    };
  }

  /*
  componentDidMount() {
    const endPoint = this.state.endpoint;
    const socket = socketioclient(endPoint);
    this.setState({
      socket: socket,
    });
  }
  */

  render() {
    return(
      <div>
        <div className="pure-g">
          <div className="pure-u-1-24">
          </div>
          <div className="pure-u-22-24">
            <Game />
            <MessageService socket={this.state.socket} />
          </div>
          <div className="pure-u-1-24">
          </div>
        </div>
      </div>
    );
  }
}

class MessageService extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userMessage: "",
      roomMessages: [],
    };

    this.messageChange = this.messageChange.bind(this);
    this.submitMessage = this.submitMessage.bind(this);
  }

  messageChange (event){
    this.setState({
      userMessage: event.target.value,
    });
  }

  submitMessage(event) {
    this.props.socket.emit("chat message", this.state.userMessage);
    this.setState({
      userMessage: "",
    });
  }

  componentDidMount(){
    this.props.socket.on("chat message", (message) => {
      this.setState((state, props) => {
        const list = [...this.state.roomMessages, message];
        console.log(list);
        return {
          roomMessages: list,
        };
      });
    });
  }

  render() {
    return(
      <div>
        <div className="pure-g">
          <div className="pure-u-1">
            <MessageHistory  roomMessages={this.state.roomMessages} />
          </div>
          <div className="pure-u-1">
            <MessageDraft messageChange={this.messageChange} userMessage={this.state.userMessage} submitMessage={this.submitMessage} />
          </div>
        </div>
      </div>
    );
  }
}

class MessageDraft extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return(
      <div>
        <div className="pure-g">
          <div className="pure-u-3-4">
            <textarea placeholder="Discuss ethics and philosophy..."
            onChange={this.props.messageChange} value={this.props.userMessage}>
            </textarea>
          </div>
          <div className="pure-u-3-4">
          <button onClick={this.props.submitMessage}>Send baby</button>
          </div>
        </div>
      </div>
    );
  }
}

class MessageHistory extends React.Component {
  constructor() {
    super();
  }

  render() {
    const messages = this.props.roomMessages.map((msg) => {
      return (<div>{msg}</div>);
    });
    return(
      <div style={{overflow: "scroll", height: "200px"}}>
        {messages}
        <p> Past messages should show up here in a scrollable box.</p>
      </div>
    );
  }
}

class Game extends React.Component {
  constructor() {
    super();
  }

  render() {
    return(
      <div>
        <p>The game should be displayed here</p>
      </div>
    );
  }
}
ReactDOM.render(
  <App />,
  document.getElementById('root')
);

