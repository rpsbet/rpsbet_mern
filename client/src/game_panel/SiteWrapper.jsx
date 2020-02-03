import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setSocket, userSignOut, getUser } from '../redux/Auth/user.actions';
import { setRoomList } from '../redux/Logic/logic.actions';
import history from '../redux/history';
import socketIOClient from 'socket.io-client';

class SiteWrapper extends Component {
  constructor(props) {
    super(props);

    this.state = {
      endpoint: "localhost:5000",
      userName: this.props.userName,
      balance: this.props.balance
    }

    this.handleLogout = this.handleLogout.bind(this);
  }

  static getDerivedStateFromProps(props, current_state) {
    if (current_state.balance !== props.balance) {
        return {
          ...current_state,
          balance: props.balance,
          userName: props.userName
        };
    }
    return null;
  }

  componentDidMount() {
    const socket = socketIOClient(this.state.endpoint);
    socket.on('UPDATED_ROOM_LIST', (data) => {
      this.props.setRoomList(data);
      this.props.getUser(true);
    });
    this.props.setSocket(socket);
    // this.props.getUser();
  }

  handleLogout(e) {
    e.preventDefault();
    this.props.socket.emit('DISCONNECT', {a:'a'});

    console.log(this.props);
    this.props.userSignOut();
  }
  
  render() {
    return (
      <div className="site_wrapper">
        <div className="game_header">
          <div className="main_header d-flex">
            <a className="game_logo" href="/">
              <img src="/img/Logo.png" alt="" />
            </a>
            <a href="/" id="btn_how_to_play">HOW TO PLAY</a>
            <a href="/" id="btn_logout" className="ml-auto" onClick={this.handleLogout}>LOGOUT<i className="glyphicon glyphicon-off"></i></a>
            <span>£{this.state.balance / 100.0}</span>
          </div>
          <div className="sub_header d-flex">
            <span className="welcome">Welcome back </span>
            <span className="user_name mr-auto">{this.state.userName}</span>
            <a href="/" id="btn_info" className="btn"><img src="/img/i.png" alt="" /></a>
            <a href="/" id="btn_avatar" className="btn"><img src="/img/avatar.png" alt="" /></a>
          </div>
        </div>
        <div className="game_wrapper">
          <div className="row">
            <div className="left_sidebar col-md-2 col-sm-2 col-xs-2">
                <a href="/create" className="btn" id="btn_create_game" onClick={(e) => {e.preventDefault(); history.push('/create')}}>
                  <div>
                    <img src="/img/new-bet.png" alt="" />
                  </div>
                  Create New Game
                </a>
                <a href="/join" className="btn" id="btn_join_game" onClick={(e) => {e.preventDefault(); history.push('/join')}}>
                  <div>
                    <img src="/img/my-bets.png" alt="" />
                  </div>
                  Join Game
                </a>
                <a href="/" className="btn" id="btn_my_game">My Games</a>
              </div>
            <div className="contents_wrapper col-md-10 col-sm-10 col-xs-10">
              {this.props.children}
            </div>
          </div>
        </div>
        <div className="game_footer text-center">
          Copyright © 2019 RPS Bet, rpsbet.com
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  socket: state.auth.socket,
  balance: state.auth.balance,
  userName: state.auth.userName
});

const mapDispatchToProps = {
  setSocket,
  userSignOut,
  setRoomList,
  getUser
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SiteWrapper);