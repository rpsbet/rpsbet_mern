import React, { Component } from 'react';
import { createTheme, MuiThemeProvider } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import {
  setSocket,
  userSignOut,
  getUser,
  setUnreadMessageCount,
  setDarkMode
} from '../redux/Auth/user.actions';
import {
  setRoomList,
  addChatLog,
  getMyGames,
  getMyHistory,
  addNewTransaction,
  updateOnlineUserList,
  selectMainTab,
  globalChatReceived
} from '../redux/Logic/logic.actions';

import {
  Tabs,
  Tab,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@material-ui/core';

import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import PersonOutlineIcon from '@material-ui/icons/PersonOutline';

import history from '../redux/history';
import socketIOClient from 'socket.io-client';

import ProfileModal from './modal/ProfileModal';
import HowToPlayModal from './modal/HowToPlayModal';
import PrivacyModal from './modal/PrivacyModal';
import TermsModal from './modal/TermsModal';
import GamePasswordModal from './modal/GamePasswordModal';
import LoginModal from './modal/LoginModal';
import SignupModal from './modal/SignupModal';
import VerificationModal from './modal/VerificationModal';
import DepositModal from './modal/DepositModal';
import WithdrawModal from './modal/WithdrawModal';
import ResetPasswordModal from './modal/ResetPasswordModal';

import Moment from 'moment';
// import DarkModeToggle from 'react-dark-mode-toggle';
import { updateDigitToPoint2 } from '../util/helper';
import './SiteWrapper.css';
import Avatar from '../components/Avatar';

const mainTheme = createTheme({
  palette: {
    type: 'light'
  }
});

const darkTheme = createTheme({
  palette: {
    type: 'dark'
  }
});

const customStyles = {
  tabRoot: {
    textTransform: 'none',
    height: '62px',
    backgroundColor: 'rgba(47, 49, 54, 0.5)'
  }
};

function updateFromNow(transactions) {
  const result = JSON.parse(JSON.stringify(transactions));
  for (let i = 0; i < result.length; i++) {
    result[i]['from_now'] = Moment(result[i]['created_at']).fromNow();
  }
  return result;
}

class SiteWrapper extends Component {
  constructor(props) {
    super(props);

    this.state = {
      endpoint: '',
      userName: this.props.userName,
      balance: this.props.balance,
      showProfileModal: false,
      showHowToPlayModal: false,
      showPrivacyModal: false,
      showTermsModal: false,
      showLoginModal: false,
      showSignupModal: false,
      showVerificationModal: false,
      showWithdrawModal: false,
      showDepositModal: false,
      showResetPasswordModal: false,
      isActiveLoadingOverlay: this.props.isActiveLoadingOverlay,
      showGameLog: false,
      transactions: updateFromNow(this.props.transactions),
      anchorEl: null
    };
  }

  static getDerivedStateFromProps(props, current_state) {
    if (
      current_state.balance !== props.balance ||
      current_state.userName !== props.userName ||
      current_state.isActiveLoadingOverlay !== props.isActiveLoadingOverlay
    ) {
      return {
        ...current_state,
        balance: props.balance,
        userName: props.userName,
        isActiveLoadingOverlay: props.isActiveLoadingOverlay,
        transactions: updateFromNow(props.transactions)
      };
    }

    return null;
  }

  handleMainTabChange = (event, newValue) => {
    this.props.selectMainTab(newValue);
  };

  handleClickMenu = e => {
    this.setState({ anchorEl: e.currentTarget });
  };

  handleCloseMenu = () => {
    this.setState({ anchorEl: null });
  };

  updateReminderTime = () => {
    this.setState({ transactions: updateFromNow(this.state.transactions) });
  };

  initSocket = () => {
    const socket = socketIOClient(this.state.endpoint);

    socket.on('CONNECTED', data => {
      socket.emit('STORE_CLIENT_USER_ID', { user_id: this.props.user._id });
    });

    socket.on('UPDATED_ROOM_LIST', data => {
      this.props.setRoomList(data);
      this.props.getUser(true);
      this.props.getMyGames(1);
      this.props.getMyHistory();
    });

    socket.on('SEND_CHAT', data => {
      try {
        this.audio.play();
        this.props.addChatLog(data);

        if (history.location.pathname.substr(0, 5) === '/chat') {
          socket.emit('READ_MESSAGE', {
            to: this.props.user._id,
            from: data.from
          });
        } else {
          socket.emit('REQUEST_UNREAD_MESSAGE_COUNT', {
            to: this.props.user._id
          });
        }
      } catch (e) {
        console.log(e);
      }
    });

    socket.on('NEW_TRANSACTION', data => {
      console.log(data);
      this.props.addNewTransaction(data);
    });

    socket.on('SET_UNREAD_MESSAGE_COUNT', data => {
      this.props.setUnreadMessageCount(data);
    });

    socket.on('ONLINE_STATUS_UPDATED', data => {
      this.props.updateOnlineUserList(data.user_list);
    });

    socket.on('GLOBAL_CHAT_RECEIVED', data => {
      this.props.globalChatReceived(data);
    });

    this.props.setSocket(socket);
  };

  async componentDidMount() {
    try {
      this.audio = new Audio('/sounds/sound.mp3');
      this.audio.load();
    } catch (e) {
      console.log(e);
    }

    this.initSocket();

    const result = await this.props.getUser(true);
    if (result.status === 'success') {
      // if (!result.user.is_activated) {
      //   this.handleOpenVerificationModal();
      // }
    }

    this.interval = setInterval(this.updateReminderTime, 3000);
  }

  componentWillUnmount() {
    if (this.props.socket) {
      this.props.socket.disconnect();
    }
    clearInterval(this.interval);
  }

  handleLogout = clear_token => {
    this.setState({ anchorEl: null });
    if (this.props.socket) {
      this.props.socket.disconnect();
    }
    this.props.userSignOut(clear_token);
  };

  handleOpenLoginModal = () => {
    this.setState({ showLoginModal: true });
  };
  handleCloseLoginModal = () => {
    this.setState({ showLoginModal: false });
  };

  handleOpenSignupModal = () => {
    this.setState({ showSignupModal: true });
  };
  handleCloseSignupModal = () => {
    this.setState({ showSignupModal: false });
  };

  handleOpenVerificationModal = () => {
    this.setState({ showVerificationModal: true });
  };
  handleCloseVerificationModal = () => {
    this.setState({ showVerificationModal: false });
  };

  handleOpenProfileModal = () => {
    this.setState({ showProfileModal: true, anchorEl: null });
  };
  handleCloseProfileModal = () => {
    this.setState({ showProfileModal: false });
  };

  handleOpenTermsModal = () => {
    this.setState({ showTermsModal: true });
  };
  handleCloseTermsModal = () => {
    this.setState({ showTermsModal: false });
  };

  handleOpenPrivacyModal = () => {
    this.setState({ showPrivacyModal: true, anchorEl: null });
  };
  handleClosePrivacyModal = () => {
    this.setState({ showPrivacyModal: false });
  };

  handleOpenHowToPlayModal = () => {
    this.setState({ showHowToPlayModal: true });
  };
  handleCloseHowToPlayModal = () => {
    this.setState({ showHowToPlayModal: false });
  };

  handleOpenDepositModal = () => {
    this.setState({ showDepositModal: true, anchorEl: null });
  };
  handleCloseDepositModal = () => {
    this.setState({ showDepositModal: false });
  };

  handleOpenWithdrawModal = () => {
    this.setState({ showWithdrawModal: true, anchorEl: null });
  };
  handleCloseWithdrawModal = () => {
    this.setState({ showWithdrawModal: false });
  };

  handleOpenResetPasswordModal = () => {
    this.setState({ showResetPasswordModal: true });
  };
  handleCloseResetPasswordModal = () => {
    this.setState({ showResetPasswordModal: false });
  };

  handleBalanceClick = () => {
    this.setState({ showGameLog: !this.state.showGameLog });
  };

  render() {
    return (
      <MuiThemeProvider theme={this.props.isDarkMode ? darkTheme : mainTheme}>
        <div
          className={`site_wrapper row ${
            this.props.isDarkMode ? 'dark_mode' : ''
          }`}
        >
          <LoadingOverlay
            active={this.state.isActiveLoadingOverlay}
            spinner
            text="Please wait..."
            styles={{
              wrapper: {
                position: 'fixed',
                width: '100%',
                height: '100vh',
                zIndex: this.state.isActiveLoadingOverlay ? 3 : 0
              }
            }}
          ></LoadingOverlay>
          <div className="game_header">
            <div className="main_header">
              <a
                className="game_logo"
                href="#"
                onClick={e => {
                  history.push('/');
                }}
              >
                {' '}
              </a>
              <Tabs
                value={this.props.selectedMainTabIndex}
                onChange={this.handleMainTabChange}
                TabIndicatorProps={{ style: { background: '#c438ef' } }}
                className="main-game-page-tabs desktop-only"
              >
                <Tab label="Live Games" style={customStyles.tabRoot} />
                <Tab label="My Games" style={customStyles.tabRoot} />
              </Tabs>
              <div className="header_action_panel">
                <a
                  href="#"
                  onClick={e => {
                    history.push('/leaderboards');
                  }}
                  id="btn_leaderboards"
                >
                  <img src="/img/icons/leaderboards.svg" alt="Leaderboards" />
                  Leaderboards
                </a>
                <a
                  href="#help"
                  onClick={this.handleOpenHowToPlayModal}
                  id="btn_how_to_play"
                >
                  <span>HELP</span>
                </a>
                {this.props.isAuthenticated ? (
                  <>
                    <span id="balance" onClick={this.handleBalanceClick}>
                      £
                      {updateDigitToPoint2(
                        parseInt(this.state.balance) / 100.0
                      )}
                    </span>
                    <Button
                      area-constrols="profile-menu"
                      aria-haspopup="true"
                      onClick={this.handleClickMenu}
                      className="profile-menu"
                    >
                      <Avatar
                        src={this.props.user.avatar}
                        alt=""
                        className="avatar"
                        darkMode={this.props.isDarkMode}
                      />
                      <span className="username">{this.state.userName}</span>
                      <ArrowDropDownIcon />
                    </Button>
                    <Menu
                      id="profile-menu"
                      anchorEl={this.state.anchorEl}
                      getContentAnchorEl={null}
                      open={Boolean(this.state.anchorEl)}
                      onClose={this.handleCloseMenu}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center'
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center'
                      }}
                      PaperProps={{ style: { width: '200px' } }}
                    >
                      <MenuItem onClick={this.handleOpenProfileModal}>
                        <ListItemIcon>
                          <PersonOutlineIcon />
                        </ListItemIcon>
                        <ListItemText>Profile</ListItemText>
                      </MenuItem>
                      <MenuItem
                        onClick={e => {
                          this.handleLogout(true);
                        }}
                      >
                        <ListItemIcon>
                          <ExitToAppIcon size="small" />
                        </ListItemIcon>
                        <ListItemText>Logout</ListItemText>
                      </MenuItem>
                      <Divider />
                      <MenuItem
                        onClick={e => {
                          this.handleOpenPrivacyModal();
                        }}
                      >
                        <ListItemText>Privacy Policy</ListItemText>
                      </MenuItem>
                      {/* <Divider />
                      <MenuItem onClick={(e) => {this.props.setDarkMode(!this.props.isDarkMode)}}>
                        <ListItemText>Dark theme</ListItemText>
                        <DarkModeToggle
                          onChange={this.props.setDarkMode}
                          checked={this.props.isDarkMode}
                          size={50}
                          speed={5}
                          className="dark_mode_toggle"
                        />
                      </MenuItem> */}
                    </Menu>
                  </>
                ) : (
                  <>
                    <button id="btn-login" onClick={this.handleOpenLoginModal}>
                      Login
                    </button>
                    <button
                      id="btn-signup"
                      onClick={this.handleOpenSignupModal}
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
            <div
              id="game_logs"
              className={this.state.showGameLog ? '' : 'hidden'}
              onClick={this.handleBalanceClick}
            >
              <div className="arrow-up"></div>
              <div className="game_logs_contents">
                <h2>BALANCE HISTORY</h2>
                <table>
                  <tbody>
                    {this.state.transactions.length === 0 ? (
                      <tr>
                        <td>...</td>
                      </tr>
                    ) : (
                      this.state.transactions.map((row, key) => (
                        <tr key={key}>
                          <td
                            className={
                              'amount ' + (row.amount > 0 ? 'green' : 'red')
                            }
                          >
                            {row.amount > 0
                              ? '+ £' + updateDigitToPoint2(row.amount / 100.0)
                              : '- £' +
                                updateDigitToPoint2(
                                  Math.abs(row.amount / 100.0)
                                )}
                          </td>
                          <td className="fromNow">{row.from_now}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="transaction-panel">
                  <button
                    className="btn-withdraw"
                    onClick={this.handleOpenWithdrawModal}
                  >
                    Withdraw
                  </button>
                  <button
                    className="btn-deposit"
                    onClick={this.handleOpenDepositModal}
                  >
                    Deposit
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="game_wrapper">
            <div className="contents_wrapper">{this.props.children}</div>
          </div>
          {this.state.showTermsModal && (
            <TermsModal
              modalIsOpen={this.state.showTermsModal}
              closeModal={this.handleCloseTermsModal}
              isDarkMode={this.props.isDarkMode}
            />
          )}
          {this.state.showPrivacyModal && (
            <PrivacyModal
              modalIsOpen={this.state.showPrivacyModal}
              closeModal={this.handleClosePrivacyModal}
              isDarkMode={this.props.isDarkMode}
            />
          )}
          {this.state.showProfileModal && (
            <ProfileModal
              modalIsOpen={this.state.showProfileModal}
              closeModal={this.handleCloseProfileModal}
              player_name={this.state.userName}
              balance={this.state.balance / 100.0}
              avatar={this.props.user.avatar}
              email={this.props.user.email}
            />
          )}
          {this.state.showHowToPlayModal && (
            <HowToPlayModal
              modalIsOpen={this.state.showHowToPlayModal}
              closeModal={this.handleCloseHowToPlayModal}
              player_name={this.state.userName}
              balance={this.state.balance / 100.0}
              isDarkMode={this.props.isDarkMode}
              openTermsModal={this.handleOpenTermsModal}
              openPrivacyModal={this.handleOpenPrivacyModal}
            />
          )}
          {this.state.showLoginModal && (
            <LoginModal
              modalIsOpen={this.state.showLoginModal}
              closeModal={this.handleCloseLoginModal}
              openSignupModal={this.handleOpenSignupModal}
              openVerificationModal={this.handleOpenVerificationModal}
              initSocket={this.initSocket}
              openResetPasswordModal={this.handleOpenResetPasswordModal}
            />
          )}
          {this.state.showSignupModal && (
            <SignupModal
              modalIsOpen={this.state.showSignupModal}
              closeModal={this.handleCloseSignupModal}
              openLoginModal={this.handleOpenLoginModal}
            />
          )}
          {this.state.showVerificationModal && (
            <VerificationModal
              modalIsOpen={this.state.showVerificationModal}
              closeModal={this.handleCloseVerificationModal}
            />
          )}
          {this.state.showDepositModal && (
            <DepositModal
              modalIsOpen={this.state.showDepositModal}
              closeModal={this.handleCloseDepositModal}
            />
          )}
          {this.state.showWithdrawModal && (
            <WithdrawModal
              modalIsOpen={this.state.showWithdrawModal}
              closeModal={this.handleCloseWithdrawModal}
              balance={this.state.balance}
            />
          )}
          {this.state.showResetPasswordModal && (
            <ResetPasswordModal
              modalIsOpen={this.state.showResetPasswordModal}
              closeModal={this.handleCloseResetPasswordModal}
              openLoginModal={this.handleOpenLoginModal}
            />
          )}
          <GamePasswordModal />
        </div>
      </MuiThemeProvider>
    );
  }
}

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  showGamePasswordModal: state.snackbar.showGamePasswordModal,
  socket: state.auth.socket,
  balance: state.auth.balance,
  userName: state.auth.userName,
  user: state.auth.user,
  unreadMessageCount: state.auth.unreadMessageCount,
  isActiveLoadingOverlay: state.logic.isActiveLoadingOverlay,
  selectedMainTabIndex: state.logic.selectedMainTabIndex,
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
  setDarkMode,
  updateOnlineUserList,
  selectMainTab,
  globalChatReceived
};

export default connect(mapStateToProps, mapDispatchToProps)(SiteWrapper);
