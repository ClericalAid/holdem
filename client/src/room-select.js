import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect
} from "react-router-dom";


export default class RoomSelect extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount(){
  }

  room_factory = (room, index) => {
    return(
      <div key={index}>
        <Link to={"/room/" + room}>
          <button className="pure-button" margin="auto" name={room} onClick={this.props.on_room_select}>{room}</button>

        </Link>
      </div>
    );
  };

  render() {
    const allRooms = this.props.roomList.map(this.room_factory);
    return(
      <div>
        <p>Here are some rooms for you my friend</p>
        <div>
          {allRooms}
        </div>
      </div>
    );
  }
}
