import React from 'react';
import './pure-min.css';

export default class MessageService extends React.Component {
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
    if (this.state.userMessage !== ""){
      this.props.socket.emit("chat message", this.state.userMessage);
    }
    this.setState({
      userMessage: "",
    });
  }

  componentDidMount(){
    this.props.socket.on("chat message", (packet) => {
      this.setState((state, props) => {
        const list = [...this.state.roomMessages, packet];
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
    const messages = this.props.roomMessages.map((message, index) => {
      return (<div key={index}>{message.user}: {message.message}</div>);
    });
    return(
      <div style={{overflow: "scroll", height: "200px"}}>
        {messages}
      </div>
    );
  }
}
