import React from 'react';
import ReactDOM from 'react-dom';
import socketioclient from "socket.io-client";

class App extends React.Component {
  constructor(){
    super();
    this.state={
      endpoint: "http://127.0.0.1:8001"
    };
  }

  componentDidMount(){
    const endPoint = this.state.endpoint;
    const socket = socketioclient(endPoint);
    //socket.on();
  }
  render() {
    return(
      <div>
        <h1>From the react app baby</h1>
      </div>
    );
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('root')
);

