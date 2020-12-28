import React, { Component } from 'react';
import { withStyles, createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import { setSocket, userSignOut, getUser, setUnreadMessageCount } from '../redux/Auth/user.actions';
import { setRoomList, addChatLog, getMyGames, getMyHistory, addNewTransaction } from '../redux/Logic/logic.actions';

import { Button, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import PersonOutlineIcon from '@material-ui/icons/PersonOutline';
import PaymentIcon from '@material-ui/icons/Payment';

import history from '../redux/history';
import socketIOClient from 'socket.io-client';
import ProfileModal from './modal/ProfileModal';
import HowToPlayModal from './modal/HowToPlayModal';
import PrivacyModal from './modal/PrivacyModal';
import TermsModal from './modal/TermsModal';
import GamePasswordModal from './modal/GamePasswordModal';
import Moment from 'moment';
import AlertModal from './modal/AlertModal';
import { setDarkMode } from '../redux/Auth/user.actions';
import DarkModeToggle from 'react-dark-mode-toggle';
import { updateDigitToPoint2 } from '../util/helper';
import './SiteWrapper.css'

const mainTheme = createMuiTheme({
  palette: {
    type: 'light'
  }
});

const darkTheme = createMuiTheme({
  palette: {
    type: 'dark'
  }
});

function updateFromNow(transactions) {
  const result = JSON.parse(JSON.stringify(transactions));
  for (let i=0; i<result.length; i++) {
      result[i]['from_now'] = Moment(result[i]['created_at']).fromNow();
  }
  return result;
}

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
      showTermsModal: false,
      isActiveLoadingOverlay: this.props.isActiveLoadingOverlay,
      showGameLog: false,
      transactions: updateFromNow(this.props.transactions),
      anchorEl: null,
    }

    this.handleLogout = this.handleLogout.bind(this);

    this.handleOpenProfileModal = this.handleOpenProfileModal.bind(this);
    this.handleCloseProfileModal = this.handleCloseProfileModal.bind(this);

    this.handleOpenPrivacyModal = this.handleOpenPrivacyModal.bind(this);
    this.handleClosePrivacyModal = this.handleClosePrivacyModal.bind(this);

    this.handleOpenTermsModal = this.handleOpenTermsModal.bind(this);
    this.handleCloseTermsModal = this.handleCloseTermsModal.bind(this);

    this.handleOpenHowToPlayModal = this.handleOpenHowToPlayModal.bind(this);
    this.handleCloseHowToPlayModal = this.handleCloseHowToPlayModal.bind(this);

    this.handleBalanceClick = this.handleBalanceClick.bind(this);
  }

  static getDerivedStateFromProps(props, current_state) {
    return {
      ...current_state,
      balance: props.balance,
      userName: props.userName,
      isActiveLoadingOverlay: props.isActiveLoadingOverlay,
      transactions: updateFromNow(props.transactions)
    };
  }

  handleClickMenu = (e) => {
    this.setState({anchorEl: e.currentTarget});
  }

  handleCloseMenu = () => {
    this.setState({anchorEl: null});
  }

  updateReminderTime() {
    this.setState({ transactions: updateFromNow(this.state.transactions) });
  }

  async componentDidMount() {
    try {
      this.audio = new Audio('/sounds/sound.mp3');
      this.audio.load();
    } catch (e) {
      console.log(e)
    }

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
      try {
        this.audio.play();
        this.props.addChatLog(data);

        if (history.location.pathname.substr(0, 5) === '/chat') {
          socket.emit('READ_MESSAGE', {to: this.props.user._id, from: data.from});
        } else {
          socket.emit('REQUEST_UNREAD_MESSAGE_COUNT', {to: this.props.user._id});
        }
      } catch (e) {
        console.log(e)
      }
    });

    socket.on('NEW_TRANSACTION', (data) => {
      console.log(data);
      this.props.addNewTransaction(data);
    });

    socket.on('SET_UNREAD_MESSAGE_COUNT', (data) => {
      this.props.setUnreadMessageCount(data);
    });

    socket.on('USER_DISCONNECTED', (data) => {
      console.log(data);
    })

    this.props.setSocket(socket);
    this.interval = setInterval(this.updateReminderTime.bind(this), 3000);
  }

  componentWillUnmount() {
    if (this.props.socket) {
      this.props.socket.emit('DISCONNECT', {a:'a'});
    }
    clearInterval(this.interval);
  }

  handleLogout(clear_token) {
    this.props.userSignOut(clear_token);
  }

  handleOpenProfileModal () {
    this.setState({ showProfileModal: true });
  }
  
  handleCloseProfileModal () {
    this.setState({ showProfileModal: false });
  }

  handleOpenTermsModal () {
    this.setState({ showTermsModal: true });
  }

  handleCloseTermsModal () {
    this.setState({ showTermsModal: false });
  }

   handleOpenPrivacyModal () {
    this.setState({ showPrivacyModal: true });
  }

  handleClosePrivacyModal () {
    this.setState({ showPrivacyModal: false });
  }

  handleOpenHowToPlayModal () {
    this.setState({ showHowToPlayModal: true });
  }
  
  handleCloseHowToPlayModal () {
    this.setState({ showHowToPlayModal: false });
  }

  handleBalanceClick() {
    this.setState({ showGameLog: !this.state.showGameLog });
  }

  number2dp(num) {
    if (num - parseInt(num) === 0) {
      return num;
    }
    return num.toFixed(2);
  }
  
  render() {
    const messageCount = this.props.unreadMessageCount;
    return (
      <MuiThemeProvider theme={this.props.isDarkMode ? darkTheme : mainTheme}>
        <div className={`site_wrapper row ${this.props.isDarkMode ? 'dark_mode' : ''}`}>
          <LoadingOverlay
            active={this.state.isActiveLoadingOverlay}
            spinner
            text='Please wait...'
            styles={{wrapper: {position: "fixed", width: "100%", height: "100vh", zIndex: this.state.isActiveLoadingOverlay ? 3 : 0}, }}
            >
          </LoadingOverlay>
          <div className="game_header">
            <div className="main_header">
              <a className="game_logo" href="/"></a>
              <div className="header_action_panel">
                <a href="#how-to-play" onClick={this.handleOpenHowToPlayModal} id="btn_how_to_play">HOW TO PLAY</a>
                <span id="balance" onClick={this.handleBalanceClick}>£{updateDigitToPoint2(parseInt(this.state.balance) / 100.0)}</span>
                <Button area-constrols="profile-menu" aria-haspopup="true" onClick={this.handleClickMenu} className="profile-menu">
                  <img src={`${this.props.user.avatar} `} alt="" className="avatar" onError={(e)=>{e.target.src='../img/avatar.png'}} />
                  <span className="username">{this.state.userName}</span>
                  <ArrowDropDownIcon />
                </Button>
                <Menu id="profile-menu" 
                  anchorEl={this.state.anchorEl} 
                  getContentAnchorEl={null}
                  open={Boolean(this.state.anchorEl)} 
                  onClose={this.handleCloseMenu}
                  anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
                  transformOrigin={{vertical: 'top', horizontal: 'center'}}
                >
                  <MenuItem onClick={this.handleOpenProfileModal}>
                    <ListItemIcon><PersonOutlineIcon /></ListItemIcon>
                    <ListItemText>Profile</ListItemText>
                  </MenuItem>
                  <MenuItem>
                    <ListItemIcon><PaymentIcon /></ListItemIcon>
                    <ListItemText>Withdraw</ListItemText>
                  </MenuItem>
                  <MenuItem>
                    <ListItemIcon><PaymentIcon /></ListItemIcon>
                    <ListItemText>Deposit</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={(e) => {this.handleLogout(true)}}>
                    <ListItemIcon><ExitToAppIcon size="small" /></ListItemIcon>
                    <ListItemText>Logout</ListItemText>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={(e) => {this.props.setDarkMode(!this.props.isDarkMode)}}>
                    <ListItemText>Dark theme</ListItemText>
                    <DarkModeToggle
                      onChange={this.props.setDarkMode}
                      checked={this.props.isDarkMode}
                      size={50}
                      speed={5}
                      className="dark_mode_toggle"
                    />
                  </MenuItem>
                </Menu>
              </div>
            </div>
            <div id="game_logs" className={this.state.showGameLog ? '' : 'hidden'} onClick={this.handleBalanceClick}>
              <div className="arrow-up"></div>
              <div className="game_logs_contents">
                <h2>BALANCE HISTORY</h2>
                <table>
                  <tbody>
                  {this.state.transactions.length === 0 ?
                    <tr><td>...</td></tr> :
                    this.state.transactions.map((row, key) => (
                      <tr key={key}>
                        <td className={"amount " + (row.amount > 0 ? "green" : "red")}>{row.amount > 0 ? '+ £' + this.number2dp(row.amount / 100.0) : '- £' + this.number2dp(Math.abs(row.amount / 100.0))}</td>
                        <td className="fromNow">{row.from_now}</td>
                      </tr>
                    ))
                  }
                  </tbody>
                </table>
                </div>
            </div>
          </div>
          <div className="game_wrapper">
              <div className="contents_wrapper">
                {this.props.children}
              </div>
          </div>
          {/* <div className="game_footer text-center">
            <span>All Rights Reserved, </span>rpsbet.com © 2020 <a href="#privacy" id="privacy" onClick={this.handleOpenPrivacyModal}>Privacy</a> | <a href="#terms" id="terms" onClick={this.handleOpenTermsModal}>Terms</a>
          </div> */}
          <TermsModal modalIsOpen={this.state.showTermsModal} closeModal={this.handleCloseTermsModal} />
          <PrivacyModal modalIsOpen={this.state.showPrivacyModal} closeModal={this.handleClosePrivacyModal} />
          <ProfileModal modalIsOpen={this.state.showProfileModal} closeModal={this.handleCloseProfileModal} player_name={this.state.userName} balance={this.state.balance / 100.0} avatar={this.props.user.avatar} email={this.props.user.email} />
          <HowToPlayModal modalIsOpen={this.state.showHowToPlayModal} closeModal={this.handleCloseHowToPlayModal} player_name={this.state.userName} balance={this.state.balance / 100.0} />
          <GamePasswordModal />
          <AlertModal />
        </div>
      </MuiThemeProvider>
    );
  }
}

const mapStateToProps = state => ({
  showAlert: state.snackbar.showAlert,
  showGamePasswordModal: state.snackbar.showGamePasswordModal,
  socket: state.auth.socket,
  balance: state.auth.balance,
  userName: state.auth.userName,
  user: state.auth.user,
  unreadMessageCount: state.auth.unreadMessageCount,
  isActiveLoadingOverlay: state.logic.isActiveLoadingOverlay,
  transactions: state.auth.transactions,
  isDarkMode: state.auth.isDarkMode
});

const mapDispatchToProps = {
  setSocket,
  userSignOut,
  setRoomList,
  getUser,
  addChatLog,
  getMyGames,
  getMyHistory,
  setUnreadMessageCount,
  addNewTransaction,
  setDarkMode
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SiteWrapper);