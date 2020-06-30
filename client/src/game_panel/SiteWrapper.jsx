import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setSocket, userSignOut, getUser, setUnreadMessageCount } from '../redux/Auth/user.actions';
import { setRoomList, addChatLog, getMyGames, getMyHistory } from '../redux/Logic/logic.actions';
import history from '../redux/history';
import socketIOClient from 'socket.io-client';
import ProfileModal from './modal/ProfileModal'
import HowToPlayModal from './modal/HowToPlayModal'

class SiteWrapper extends Component {
  constructor(props) {
    super(props);

    this.state = {
      endpoint: "",
      userName: this.props.userName,
      balance: this.props.balance,
      showProfileModal: false,
      showHowToPlayModal: false
    }

    this.handleLogout = this.handleLogout.bind(this);
    this.handleOpenProfileModal = this.handleOpenProfileModal.bind(this);
    this.handleCloseProfileModal = this.handleCloseProfileModal.bind(this);
    this.handleOpenHowToPlayModal = this.handleOpenHowToPlayModal.bind(this);
    this.handleCloseHowToPlayModal = this.handleCloseHowToPlayModal.bind(this);
  }

  static getDerivedStateFromProps(props, current_state) {
    return {
      ...current_state,
      balance: props.balance,
      userName: props.userName,
    };
  }

  async componentDidMount() {
    this.audio = new Audio('/sounds/sound.mp3');

    await this.props.getUser(true);
    const socket = socketIOClient(this.state.endpoint);

    socket.on('CONNECTED', (data) => {
      socket.emit('STORE_CLIENT_USER_ID', {user_id: this.props.user._id});
    });

    socket.on('UPDATED_ROOM_LIST', (data) => {
      this.props.setRoomList(data);
      this.props.getUser(true);
      this.props.getMyGames();
      this.props.getMyHistory();
    });

    socket.on('SEND_CHAT', (data) => {
      this.audio.play();
      this.props.addChatLog(data);

      if (history.location.pathname.substr(0, 5) === '/chat') {
        socket.emit('READ_MESSAGE', {to: this.props.user._id, from: data.from});
      } else {
        socket.emit('REQUEST_UNREAD_MESSAGE_COUNT', {to: this.props.user._id});
      }
    });

    socket.on('SET_UNREAD_MESSAGE_COUNT', (data) => {
      this.props.setUnreadMessageCount(data);
    });

    this.props.setSocket(socket);
  }

  handleLogout(e) {
    e.preventDefault();
    this.props.socket.emit('DISCONNECT', {a:'a'});

    console.log(this.props);
    this.props.userSignOut();
  }

  handleOpenProfileModal () {
    console.log('showmodal');
    this.setState({ showProfileModal: true });
  }
  
  handleCloseProfileModal () {
    this.setState({ showProfileModal: false });
  }

  handleOpenHowToPlayModal () {
    console.log('showmodal');
    this.setState({ showHowToPlayModal: true });
  }
  
  handleCloseHowToPlayModal () {
    this.setState({ showHowToPlayModal: false });
  }
  
  render() {
    const messageCount = this.props.unreadMessageCount;
    return (
      <div className="site_wrapper">
        <div className="game_header">
          <div className="main_header d-flex">
            <a className="game_logo" href="/">
              <img src="/img/Logo.png" alt="" />
            </a>
            <a href="#how-to-play" onClick={this.handleOpenHowToPlayModal} id="btn_how_to_play">HOW TO PLAY</a>
            <a href="/" id="btn_logout" className="ml-auto" onClick={this.handleLogout}>LOGOUT<i className="glyphicon glyphicon-off"></i></a>
            <span>£{this.state.balance / 100.0}</span>
          </div>
          <div className="sub_header d-flex">
            <span className="welcome">Welcome </span>
            <span className="user_name mr-auto">{this.state.userName}</span>
            <a href="/" id="btn_info" className="btn"><img src="/img/i.png" alt="" /></a>
            <button onClick={this.handleOpenProfileModal} id="btn_avatar" className="btn"><img src={this.props.user.avatar} alt="" /></button>
          </div>
        </div>
        <div className="game_wrapper">
          <div className="row">
            <div className="left_sidebar col-md-2 col-sm-2 col-xs-2">
                <a href="/create" className="btn" id="btn_create_game" onClick={(e) => {e.preventDefault(); history.push('/create')}}>
                  <div>
                    <img src="/img/new-bet.png" alt="" />
                    <span>Create New Game</span>
                  </div>
                </a>
                <a href="/join" className="btn" id="btn_join_game" onClick={(e) => {e.preventDefault(); history.push('/join')}}>
                  <div>
                    <img src="/img/my-bets.png" alt="" />
                    <span>Join Game</span>
                  </div>
                </a>
                <a href="/mygames" className="btn" id="btn_my_game">
                  My Activities {messageCount === 0 ? '' : '(' + messageCount + ')'}
                </a>
              </div>
            <div className="contents_wrapper col-md-10 col-sm-10 col-xs-10">
              {this.props.children}
            </div>
          </div>
        </div>
        <div className="game_footer text-center">
          Copyright © 2020 RPS Bet, rpsbet.com
        </div>
        <ProfileModal modalIsOpen={this.state.showProfileModal} closeModal={this.handleCloseProfileModal} player_name={this.state.userName} balance={this.state.balance / 100.0} email={this.props.user.email} />
        <HowToPlayModal modalIsOpen={this.state.showHowToPlayModal} closeModal={this.handleCloseHowToPlayModal} player_name={this.state.userName} balance={this.state.balance / 100.0} />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  socket: state.auth.socket,
  balance: state.auth.balance,
  userName: state.auth.userName,
  user: state.auth.user,
  unreadMessageCount: state.auth.unreadMessageCount
});

const mapDispatchToProps = {
  setSocket,
  userSignOut,
  setRoomList,
  getUser,
  addChatLog,
  getMyGames,
  getMyHistory,
  setUnreadMessageCount
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SiteWrapper);