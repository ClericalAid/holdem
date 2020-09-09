import React from 'react';

export default class UsernameSelect extends React.Component {
  constructor(props) {
    super(props);
    this.on_username_change = this.on_username_change.bind(this);
    this.on_username_submit = this.on_username_submit.bind(this);
  }

  componentDidMount(){
  }

  on_username_change(event){
    this.props.on_username_change(event.target.value);
  }

  on_username_submit(event){
    this.props.on_username_submit(event.target.value);
  }

  render() {
    return(
      <div style={{textAlign: "center"}}>
        <div>
          Input a username
        </div>
        <div>
          <input type="text" onChange={this.on_username_change}></input>
        </div>
        <div>
          <button className="pure-button" margin="auto" onClick={this.on_username_submit}>Submit</button>
        </div>
        <div style={{textAlign: "center",}}>
          {this.props.submittingUsername &&
            <p>submitting username...</p>
          }
        </div>
      </div>
    );
  }
}
