import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setSocket, userSignOut, getUser, setUnreadMessageCount } from '../redux/Auth/user.actions';
import { setRoomList, addChatLog, getMyGames, getMyHistory } from '../redux/Logic/logic.actions';
import history from '../redux/history';
import socketIOClient from 'socket.io-client';
import ProfileModal from './modal/ProfileModal';
import HowToPlayModal from './modal/HowToPlayModal';
import PrivacyModal from './modal/PrivacyModal';
import TermsModal from './modal/TermsModal';
import { FaRegQuestionCircle } from 'react-icons/fa';
import { IoMdLogOut } from 'react-icons/io';

class SiteWrapper extends Component {
  constructor(props) {
    super(props);

    this.state = {
      endpoint: "",
      userName: this.props.userName,
      balance: this.props.balance,
      showProfileModal: false,
      showHowToPlayModal: false,
      showPrivacyModal: false,
      showTermsModal: false
    }

    this.handleLogout = this.handleLogout.bind(this);
    this.handleOpenProfileModal = this.handleOpenProfileModal.bind(this);
    this.handleOpenPrivacyModal = this.handleOpenPrivacyModal.bind(this);
    this.handleOpenTermsModal = this.handleOpenTermsModal.bind(this);
    this.handleCloseProfileModal = this.handleCloseProfileModal.bind(this);
    this.handleClosePrivacyModal = this.handleClosePrivacyModal.bind(this);
    this.handleCloseTermsModal = this.handleCloseTermsModal.bind(this);
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
      console.log(123123123);
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

  handleOpenTermsModal () {
    console.log('showmodal');
    this.setState({ showTermsModal: true });
  }

  handleCloseTermsModal () {
    this.setState({ showTermsModal: false });
  }

   handleOpenPrivacyModal () {
    console.log('showmodal');
    this.setState({ showPrivacyModal: true });
  }

  handleClosePrivacyModal () {
    this.setState({ showPrivacyModal: false });
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
            <a href="#how-to-play" onClick={this.handleOpenHowToPlayModal} id="btn_how_to_play"><span>HOW TO PLAY </span><FaRegQuestionCircle /></a>
            <a href="/" id="btn_logout" className="ml-auto" onClick={this.handleLogout}><span>LOGOUT </span><IoMdLogOut /></a>
            <span id="balance">£{this.state.balance / 100.0}</span>
          </div>
          <div className="sub_header d-flex">
            <span className="welcome">Welcome </span>
            <span className="user_name mr-auto">{this.state.userName}</span>
            {/* <a href="/" id="btn_info" className="btn"><img src="/img/i.png" alt="" /></a> */}
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
          <span>All Rights Reserved, </span>rpsbet.com © 2020 RPS Bet Ltd. 12175962, <a href="#privacy" id="privacy" onClick={this.handleOpenPrivacyModal}>Privacy</a> | <a href="#terms" id="terms" onClick={this.handleOpenTermsModal}>Terms</a>
        </div>
        <TermsModal modalIsOpen={this.state.showTermsModal} closeModal={this.handleCloseTermsModal} player_name={this.state.userName} balance={this.state.balance / 100.0} />
        <PrivacyModal modalIsOpen={this.state.showPrivacyModal} closeModal={this.handleClosePrivacyModal} player_name={this.state.userName} balance={this.state.balance / 100.0} />
        <ProfileModal modalIsOpen={this.state.showProfileModal} closeModal={this.handleCloseProfileModal} player_name={this.state.userName} balance={this.state.balance / 100.0} />
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