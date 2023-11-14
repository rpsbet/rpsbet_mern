import React, { Component } from 'react';
import {
  createTheme,
  MuiThemeProvider,
  Tabs,
  Tab,
  Button,
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Checkbox,
  TableBody,
  TableHead,
  Table,
  TableCell,
  TableRow,
  Radio,
  RadioGroup,
  FormControlLabel
} from '@material-ui/core';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import ReactApexChart from 'react-apexcharts';
import CountUp from 'react-countup';
import Lottie from 'react-lottie';
import progress from './LottieAnimations/progress.json';
import InlineSVG from 'react-inlinesvg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSort,
  faSearch,
  faFilter,
  faArrowAltCircleDown,
  faArrowAltCircleUp
} from '@fortawesome/free-solid-svg-icons';
import {
  Close,
  Link,
  ArrowUpward,
  ArrowDownward,
  AccountBalanceWallet,
  ArrowDropDown,
  Brightness7,
  Brightness4,
  VolumeUp,
  VolumeOff,
  ExitToApp,
  PersonOutline,
  Help
} from '@material-ui/icons';
import history from '../redux/history';
import socketIOClient from 'socket.io-client';
import Moment from 'moment';
import Avatar from '../components/Avatar';
import Web3 from 'web3';
import './SiteWrapper.css';
import ProfileModal from './modal/ProfileModal';
import PlayerModal from './modal/PlayerModal';
import HowToPlayModal from './modal/HowToPlayModal';
import MarketplaceModal from './modal/MarketplaceModal';

import LeaderboardsModal from './modal/LeaderboardsModal';
import { getNotifications } from '../redux/Logic/logic.actions';
import ConfirmTradeModal from './modal/ConfirmTradeModal';
import ListItemModal from './modal/ListItemModal';
import DeListItemModal from './modal/DeListItemModal';

import GamePasswordModal from './modal/GamePasswordModal';
import LoginModal from './modal/LoginModal';
import SignupModal from './modal/SignupModal';
import VerificationModal from './modal/VerificationModal';
import DepositModal from './modal/DepositModal';
import WithdrawModal from './modal/WithdrawModal';
import InventoryModal from './modal/InventoryModal';
import ResetPasswordModal from './modal/ResetPasswordModal';
import Battle from './icons/Battle.js';
import BattleHover from './icons/BattleHover';
import Manage from './icons/Manage.js';
import ManageHover from './icons/ManageHover';
import Notifications from './icons/Notifications.js';
import NotificationsHover from './icons/NotificationsHover';
import Leaderboards from './icons/Leaderboards.js';
import LeaderboardsHover from './icons/LeaderboardsHover';
import Store from './icons/Store.js';
import StoreHover from './icons/StoreHover';

import {
  setSocket,
  userSignOut,
  getUser,
  setUnreadMessageCount,
  setDarkMode,
  toggleMute
} from '../redux/Auth/user.actions';
import {
  setRoomList,
  addChatLog,
  getMyGames,
  getMyHistory,
  getHistory,
  addNewTransaction,
  updateOnlineUserList,
  selectMainTab,
  globalChatReceived,
  setGlobalChat,
  updateBetResult
} from '../redux/Logic/logic.actions';

import { convertToCurrency } from '../util/conversion';

LoadingOverlay.propTypes = undefined;

const customTextFieldStyles = {
  MuiOutlinedInput: {
    root: {
      '&:hover $notchedOutline': {
        borderColor: 'currentColor'
      },
      '&$focused $notchedOutline': {
        borderColor: 'currentColor'
      },
      '& input:-webkit-autofill': {
        '-webkit-box-shadow': '0 0 0 100px transparent inset',
        '-webkit-text-fill-color': 'currentColor'
      }
    },
    notchedOutline: {},
    focused: {}
  },
  MuiInputBase: {
    input: {
      '&$focused': {
        backgroundColor: 'transparent'
      },
      '&:-webkit-autofill': {
        '-webkit-box-shadow': '0 0 0 100px inherit inset',
        '-webkit-text-fill-color': 'currentColor'
      }
    },
    focused: {}
  }
};

const mainTheme = createTheme({
  palette: {
    type: 'light'
  },
  overrides: customTextFieldStyles
});

const darkTheme = createTheme({
  palette: {
    type: 'dark'
  },
  overrides: customTextFieldStyles
});

const customStyles = {
  tabRoot: {
    textTransform: 'none',
    minWidth: '80px'
  }
};

const gifUrls = ['/img/rock.gif', '/img/paper.gif', '/img/scissors.gif'];
const randomGifUrl = gifUrls[Math.floor(Math.random() * gifUrls.length)];
const hueRotateValue = (gifUrls.indexOf(randomGifUrl) + 1) * 75;

const { SpeechSynthesis } = window.speechSynthesis;

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
      endpoint:
        process.env.NODE_ENV === 'production'
          ? 'https://rps.game'
          : `http://${window.location.hostname}:5001`,
      userName: this.props.userName,
      balance: this.props.balance,
      oldBalance: this.props.balance,
      hoverTabIndex: -1,
      betResult: this.props.betResult,
      showProfileModal: false,
      showPlayerModal: false,
      showHowToPlayModal: false,
      showMarketplaceModal: false,
      showLeaderboardsModal: false,
      isPlaying: false,
      showLoginModal: false,
      showSignupModal: false,
      showVerificationModal: false,
      showWithdrawModal: false,
      showDepositModal: false,
      showInventoryModal: false,
      showResetPasswordModal: false,
      showGameLog: false,
      notifications: this.props.notifications,
      showNotifications: false,
      userParams: [false, true],
      loadMore: 20,
      showAllGameLogs: false,
      transactions: updateFromNow(this.props.transactions),
      anchorEl: null,
      websiteLoading: true,
      sortBy: 'date',
      showFilter: false,
      showSort: false,
      showSearch: false,
      searchQuery: '',
      showWithdrawals: false,
      showDeposits: false,
      web3: null,
      web3account: '',
      web3balance: 0
    };
    this.state.notifications = this.props.notification || {};
  }
  static getDerivedStateFromProps(props, currentState) {
    const { balance, betResult, userName, notifications } = props;

    if (
      currentState.balance !== balance ||
      currentState.betResult !== betResult ||
      currentState.userName !== userName ||
      currentState.notifications !== notifications
    ) {
      return {
        ...currentState,
        balance,
        notifications: props.notifications,
        userName,
        transactions: updateFromNow(props.transactions),
        betResult
      };
    }

    return null;
  }

  toggleSort = () => {
    this.setState(prevState => ({
      showSort: !prevState.showSort
    }));
  };

  toggleSearch = () => {
    this.setState(prevState => ({
      showSearch: !prevState.showSearch
    }));
  };

  toggleFilter = () => {
    this.setState(prevState => ({
      showFilter: !prevState.showFilter
    }));
  };

  handleSortBy = option => {
    this.setState({ sortBy: option }, () => {
      this.props.getUser(
        false,
        true,
        this.state.loadMore,
        this.state.showWithdrawals,
        this.state.showDeposits,
        option,
        this.state.searchQuery
      );
    });
  };

  toggleShowWithdrawals = () => {
    this.setState(
      prevState => ({
        showWithdrawals: !prevState.showWithdrawals
      }),
      () => {
        this.props.getUser(
          false,
          true,
          this.state.loadMore,
          this.state.showWithdrawals,
          this.state.showDeposits,
          this.state.sortBy,
          this.state.searchQuery
        );
      }
    );
  };

  toggleShowDeposits = () => {
    this.setState(
      prevState => ({
        showDeposits: !prevState.showDeposits
      }),
      () => {
        this.props.getUser(
          false,
          true,
          this.state.loadMore,
          this.state.showWithdrawals,
          this.state.showDeposits,
          this.state.sortBy,
          this.state.searchQuery
        );
      }
    );
  };

  handleSearch = event => {
    const searchQuery = event.target.value;
    this.setState({ searchQuery }, () => {
      // Call the function to fetch data with the updated search query
      this.props.getUser(
        false,
        true,
        this.state.loadMore,
        this.state.showWithdrawals,
        this.state.showDeposits,
        this.state.sortBy,
        searchQuery
      );
    });
  };

  handleMainTabChange = (event, newValue) => {
    const { selectMainTab } = this.props;
    if (window.location.pathname !== '/') {
      history.push('/');
    }
    selectMainTab(newValue);
  };

  handleMouseEnter = index => {
    this.setState({ hoverTabIndex: index });
  };

  handleMouseLeave = () => {
    this.setState({ hoverTabIndex: -1 });
  };

  handleMute = () => {
    const audioElements = [
      this.audioWin,
      this.audioSplit,
      this.audioLose,
      this.fatality,
      this.nyan,
      this.topG,
      this.oohBaby,
      this.cashRegister
    ];

    audioElements.forEach(audio => {
      audio.pause();
      audio.muted = true;
    });

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // updateCounter = () => {
  //   if (this.state.counter < 100) {
  //     this.setState(prevState => ({ counter: prevState.counter + 1 }));
  //   }
  // };

  handleUnmute = () => {
    const audioElements = [
      this.audioWin,
      this.audioSplit,
      this.audioLose,
      this.fatality,
      this.nyan,
      this.topG,
      this.oohBaby,
      this.cashRegister
    ];

    audioElements.forEach(audio => {
      audio.muted = false;
    });
  };

  speak(message) {
    if (!this.props.isMuted && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.0; // set the speed to 1.0 (normal speed)
      utterance.lang = 'en-US'; // set the language to US English
      window.speechSynthesis.speak(utterance);
    }
  }

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
      socket.emit('FETCH_GLOBAL_CHAT');
    });

    socket.on('UPDATED_ROOM_LIST', data => {
      this.props.setRoomList(data);
      this.props.getUser(
        true,
        false,
        0,
        false,
        false,
        this.state.sortBy,
        this.state.searchQuery
      );
      this.props.getMyGames(1);
      this.props.getMyHistory();
      this.props.getHistory();
    });

    socket.on('PLAY_CORRECT_SOUND', socketId => {
      if (socket.id === socketId && !this.props.isMuted) {
        const audio = new Audio('/sounds/correct.mp3');
        audio.play();
      }
    });

    socket.on('PLAY_WRONG_SOUND', socketId => {
      if (socket.id === socketId && !this.props.isMuted) {
        const audio = new Audio('/sounds/wrong.mp3');
        audio.play();
      }
    });

    socket.on('SEND_CHAT', data => {
      try {
        if (!this.props.isMuted) {
          let winCounter = parseInt(localStorage.getItem('winCounter')) || 0;

          const message = data.message.toLowerCase();
          if (message.includes('won')) {
            let value;
            if (message.match(/\d+\.\d{2}/)) {
              value = message.match(/\d+\.\d{2}/)[0];
            } else if (message.match(/\d+/)) {
              value = message.match(/\d+/)[0];
            }
            if (value) {
              const formattedValue = parseFloat(value).toFixed(6);
              const spokenValue = formattedValue.endsWith('.00')
                ? parseFloat(formattedValue).toString()
                : formattedValue;
              this.speak(`Lost, ${spokenValue}`);
            }
            if (value >= 0 && value <= 2) {
              this.audioSplit.play();
            } else if (value > 25 && value <= 100) {
              this.audioLose.play();
            } else if (value > 100) {
              this.fatality.play();
            }
            winCounter = 0;
          } else if (message.includes('split')) {
            let value;
            if (message.match(/\d+\.\d{2}/)) {
              value = message.match(/\d+\.\d{2}/)[0];
            } else if (message.match(/\d+/)) {
              value = message.match(/\d+/)[0];
            }
            if (value) {
              const formattedValue = parseFloat(value);
              const spokenValue = formattedValue.endsWith('.00')
                ? parseFloat(formattedValue).toString()
                : formattedValue;
              this.speak(`Split, ${spokenValue}`);
            }
            winCounter = 0;
          } else if (message.includes('lost')) {
            winCounter++;
            if (winCounter === 3) {
              this.oohBaby.play();
              winCounter = 0;
            }
            let value;
            if (message.match(/\d+\.\d{2}/)) {
              value = message.match(/\d+\.\d{2}/)[0];
            } else if (message.match(/\d+/)) {
              value = message.match(/\d+/)[0];
            }
            if (value) {
              const formattedValue = parseFloat(value);
              const spokenValue = formattedValue.endsWith('.00')
                ? parseFloat(formattedValue).toString()
                : formattedValue;
              this.speak(`Won, ${spokenValue}`);
            }
            if (value >= 0 && value <= 2) {
              this.audioSplit.play();
            } else if (value >= 15 && value <= 50) {
              this.cashRegister.play();
            } else if (value > 50 && value <= 250) {
              this.audioWin.play();
            } else if (value > 250 && value <= 1000) {
              this.topG.play();
            } else if (value > 1000) {
              this.nyan.play();
            }
          }

          localStorage.setItem('winCounter', winCounter);
        }
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

    socket.on('UPDATE_BET_RESULT', data => {
      this.props.updateBetResult(data);
    });

    socket.on('NEW_TRANSACTION', data => {
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

    socket.on('SET_GLOBAL_CHAT', this.props.setGlobalChat);

    this.props.setSocket(socket);
  };
  loadWeb3 = async () => {
    try {
      const web3 = new Web3(Web3.givenProvider);
      this.setState({ web3 });
      const accounts = await web3.eth.requestAccounts();
      this.setState({ web3account: accounts[0] });

      // Get ETH balance of the account
      const ethBalance = await web3.eth.getBalance(accounts[0]);
      const tokenAmount = web3.utils.fromWei(ethBalance, 'ether');
      this.setState({ web3balance: tokenAmount });
    } catch (e) {
      console.log(e);
    }
  };

  async componentDidMount() {
    let currentUrl = window.location.pathname;
    await this.props.getNotifications();
    if (currentUrl.indexOf('create') !== -1) {
      this.setState({
        selectedMainTabIndex: this.props.selectMainTab(1)
      });
    }
    // this.counter = setInterval(this.updateCounter, 25);
    setTimeout(() => {
      this.setState({ websiteLoading: false });
    }, 1500);

    this.initializeAudio();

    this.initSocket();

    const result = await this.props.getUser(
      true,
      false,
      0,
      false,
      false,
      this.state.sortBy,
      this.state.searchQuery
    );

    if (result.status === 'success') {
      // if (!result.user.is_activated) {
      //   this.handleOpenVerificationModal();
      // }
    }

    this.interval = setInterval(this.updateReminderTime, 3000);

    //web3
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        this.loadWeb3();
      });
      window.ethereum.on('accountsChanged', () => {
        this.loadWeb3();
      });
    }

    this.loadWeb3();
    this.fetchData();
    setInterval(() => this.fetchData(), 2000);
  }

  initializeAudio() {
    try {
      this.nyan = new Audio('/sounds/nyan.mp3');
      this.nyan.load();
      this.topG = new Audio('/sounds/topG.mp3');
      this.topG.load();
      this.oohBaby = new Audio('/sounds/ooh-baby.mp3');
      this.oohBaby.load();
      this.cashRegister = new Audio('/sounds/cash-register.mp3');
      this.cashRegister.load();
      this.fatality = new Audio('/sounds/fatality.mp3');
      this.fatality.load();
      this.audioWin = new Audio('/sounds/audioWin.mp3');
      this.audioWin.load();
      this.audioSplit = new Audio('/sounds/audioSplit.mp3');
      this.audioSplit.load();
      this.audioLose = new Audio('/sounds/audioLose.mp3');
      this.audioLose.load();
    } catch (e) {
      console.log(e);
    }
  }
  async fetchData() {
    const { transactions } = this.props;

    const categories = [];
    const data = [];
    let currentBalance = 0;

    transactions.forEach((transaction, index) => {
      categories.push(transaction.created_at);
      currentBalance += transaction.amount;
      data.push({
        x: index,
        y: currentBalance,
        color: transaction.amount >= 0 ? 'green' : 'red'
      });
    });

    this.setState({
      balance: currentBalance,
      oldBalance: this.state.balance,
      transactions: transactions,
      options: {
        chart: {
          id: 'balance-chart',
          toolbar: {
            show: false
          },
          markers: {
            size: 0
          },
          grid: {
            show: false
          },
          tooltip: {
            enabled: false
          }
        },
        xaxis: {
          categories
        },
        yaxis: {
          opposite: true
        },
        interactions: []
      },
      series: [
        {
          data
        }
      ]
    });
  }

  componentWillUnmount() {
    const { socket } = this.props;
    if (socket) {
      socket.disconnect();
    }
    clearInterval(this.interval);
    clearInterval(this.timer);
    // clearInterval(this.counter);
  }
  handleLogout = clear_token => {
    this.setState({
      web3account: null,
      web3balance: null,
      anchorEl: null,
      showGameLog: false
    });

    const { socket, userSignOut } = this.props;
    if (socket) {
      socket.disconnect();
    }
    userSignOut(clear_token);
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
  handleOpenPlayerModal = () => {
    this.setState({ showPlayerModal: true, anchorEl: null });
  };
  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  handleOpenHowToPlayModal = () => {
    this.setState({ showHowToPlayModal: true });
  };
  handleCloseHowToPlayModal = () => {
    this.setState({ showHowToPlayModal: false });
  };

  handleOpenMarketplaceModal = () => {
    this.setState({ showMarketplaceModal: true });
  };
  handleCloseMarketplaceModal = () => {
    this.setState({ showMarketplaceModal: false });
  };

  handleOpenLeaderboardsModal = () => {
    this.setState({ showLeaderboardsModal: true });
  };
  handleCloseLeaderboardsModal = () => {
    this.setState({ showLeaderboardsModal: false });
  };

  handleOpenDepositModal = () => {
    this.setState({ showDepositModal: true, anchorEl: null });
  };
  handleCloseDepositModal = () => {
    this.setState({ showDepositModal: false });
  };

  handleOpenInventoryModal = () => {
    this.setState({ showInventoryModal: true, anchorEl: null });
  };
  handleCloseInventoryModal = () => {
    this.setState({ showInventoryModal: false });
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

  handleNotificationsClick = () => {
    this.setState({ showNotifications: !this.state.showNotifications });
  };

  handleLoadMore = () => {
    const {
      loadMore,
      showWithdrawals,
      showDeposits,
      sortBy,
      searchQuery
    } = this.state;
    const nextLoadMore = loadMore >= 0 ? loadMore + 10 : 10;

    this.props.getUser(
      false,
      true,
      nextLoadMore,
      showWithdrawals,
      showDeposits,
      sortBy,
      searchQuery
    );

    this.setState({
      loadMore: nextLoadMore
    });
  };

  toggleAllTransactions = () => {
    const [param1, param2] = this.state.userParams;
    this.props.getUser(
      param1,
      param2,
      0,
      this.state.showWithdrawals,
      this.state.showDeposits,
      this.state.sortBy,
      this.state.searchQuery
    );

    const toggledParams = [param2, param1];
    this.setState(prevState => ({
      showAllGameLogs: !prevState.showAllGameLogs,
      userParams: toggledParams,
      loadMore: 0
    }));
  };

  disconnectWeb3 = async () => {
    this.setState({
      web3account: null,
      web3balance: null
    });
  };

  render() {
    const { isMuted, balance, oldBalance } = this.state;
    const { websiteLoading } = this.state;
    const balanceString = balance.toString();
    const decimalIndex = balanceString.indexOf('.');
    const numDecimals =
      decimalIndex !== -1
        ? Math.min(balanceString.length - decimalIndex - 1, 5)
        : 0;
    const notificationsArray = Object.values(this.props.notifications);

    return (
      <MuiThemeProvider theme={this.props.isDarkMode ? darkTheme : mainTheme}>
        <div
          className={`site_wrapper row ${
            this.props.isDarkMode ? 'dark_mode' : ''
          }`}
        >
          {websiteLoading && (
            <div
              className="loading-overlay"
              style={{
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <img src={randomGifUrl} alt="Loading" />
              <span
                style={{
                  marginTop: '10px',
                  color: '#fff'
                }}
              >
                {`Connecting...`}
              </span>
              <Lottie
                options={{
                  loop: true,
                  autoplay: true,
                  animationData: progress
                }}
                style={{
                  marginTop: '-40px',
                  filter: `hue-rotate(${hueRotateValue}deg)`, // Use the calculated hue-rotate value
                  width: '300px',
                  height: '100px'
                }}
              />
            </div>
          )}
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
                TabIndicatorProps={{ style: { background: '#ff0000' } }}
                className="main-game-page-tabs desktop-only"
              >
                <Tab
                  className={`custom-tab ${
                    this.state.hoverTabIndex === 0 ||
                    this.props.selectedMainTabIndex === 0
                      ? 'fade-animation fade-in'
                      : 'fade-animation fade-out'
                  }`}
                  label="PVP"
                  labelPlacement="left"
                  icon={
                    this.state.hoverTabIndex === 0 ||
                    this.props.selectedMainTabIndex === 0 ? (
                      <BattleHover />
                    ) : (
                      <Battle />
                    )
                  }
                  style={customStyles.tabRoot}
                  onMouseEnter={() => this.handleMouseEnter(0)}
                  onMouseLeave={this.handleMouseLeave}
                />

                <Tab
                  className={`custom-tab ${
                    this.state.hoverTabIndex === 1 ||
                    this.props.selectedMainTabIndex === 1
                      ? 'fade-animation fade-in'
                      : 'fade-animation fade-out'
                  }`}
                  label="Manage"
                  labelPlacement="left"
                  icon={
                    this.state.hoverTabIndex === 1 ||
                    this.props.selectedMainTabIndex === 1 ? (
                      <ManageHover />
                    ) : (
                      <Manage />
                    )
                  }
                  style={customStyles.tabRoot}
                  onMouseEnter={() => this.handleMouseEnter(1)}
                  onMouseLeave={this.handleMouseLeave}
                />
              </Tabs>

              <div className="header_action_panel">
                <a
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    this.handleOpenMarketplaceModal();
                  }}
                  id="btn_marketplace"
                  onMouseEnter={() => this.handleMouseEnter(5)}
                  onMouseLeave={this.handleMouseLeave}
                >
                  {this.state.hoverTabIndex === 5 ? (
                    <StoreHover width="18pt" />
                  ) : (
                    <Store />
                  )}
                </a>
                <a
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    this.handleOpenLeaderboardsModal();
                  }}
                  id="btn_leaderboards"
                  onMouseEnter={() => this.handleMouseEnter(4)}
                  onMouseLeave={this.handleMouseLeave}
                >
                  {this.state.hoverTabIndex === 4 ? (
                    <LeaderboardsHover width="18pt" />
                  ) : (
                    <Leaderboards />
                  )}
                </a>
                <a
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    this.handleNotificationsClick();
                  }}
                  id="btn_notifications"
                  onMouseEnter={() => this.handleMouseEnter(3)}
                  onMouseLeave={this.handleMouseLeave}
                >
                  {this.state.hoverTabIndex === 3 ? (
                    <NotificationsHover width="18pt" />
                  ) : (
                    <Notifications />
                  )}
                </a>
                {this.props.isAuthenticated ? (
                  <>
                    <div id="balance">
                      <InlineSVG
                        id="busd"
                        src={require('./JoinGame/busd.svg')}
                      />
                      <CountUp
                        start={oldBalance}
                        end={balance}
                        // prefix="$"
                        separator=","
                        decimal="."
                        decimals={numDecimals}
                        duration={1.5}
                        redraw={true}
                        preserveValue={true}
                        onEnd={() => {
                          this.setState({ oldBalance: balance }); // update oldBalance after animation completes
                        }}
                      />
                      <Button
                        id="wallet-btn"
                        style={{
                          minWidth: '32px',
                          maxHeight: '33px',
                          borderRadius: '0.25em'
                        }}
                        onClick={this.handleBalanceClick}
                      >
                        <AccountBalanceWallet
                          style={{
                            position: 'relative',
                            zIndex: '1',
                            width: '18px',
                            height: '18px',
                            margin: '0 5px 0 10px'
                          }}
                        />
                        <span
                          id="wallet-text"
                          style={{
                            position: 'relative',
                            zIndex: '1',
                            fontSize: '0.6em',
                            paddingRight: '10px'
                          }}
                        >
                          Wallet
                        </span>
                      </Button>
                    </div>

                    <Button
                      area-constrols="profile-menu"
                      aria-haspopup="true"
                      onClick={this.handleClickMenu}
                      className="profile-menu"
                    >
                      <Avatar
                        src={this.props.user.avatar}
                        rank={this.props.user.totalWagered}
                        alt=""
                        className="avatar"
                        darkMode={this.props.isDarkMode}
                      />
                      {/* <span className="username">{this.state.userName}</span> */}
                      <ArrowDropDown />
                    </Button>
                    <Menu
                      id="profile-menu"
                      anchorEl={this.state.anchorEl}
                      getContentAnchorEl={null}
                      open={Boolean(this.state.anchorEl)}
                      onClose={this.handleCloseMenu}
                      isDarkMode={this.props.isDarkMode}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center'
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center'
                      }}
                      PaperProps={{
                        style: {
                          width: '200px',
                          border: this.props.isDarkMode
                            ? '2px solid #212529'
                            : '2px solid #e5e5e5',
                          background: this.props.isDarkMode
                            ? '#101010'
                            : '#f9f9f9'
                        }
                      }}
                      BackdropProps={{
                        invisible: true
                      }}
                    >
                      <MenuItem onClick={this.handleOpenProfileModal}>
                        <ListItemIcon>
                          <PersonOutline />
                        </ListItemIcon>
                        <ListItemText>PROFILE</ListItemText>
                      </MenuItem>

                      <MenuItem onClick={this.playPause}>
                        <ReactApexChart
                          options={{
                            chart: {
                              animations: {
                                enabled: false
                              },
                              toolbar: {
                                show: false
                              },
                              events: {},
                              zoom: {
                                enabled: false
                              }
                            },
                            grid: {
                              show: false
                            },
                            tooltip: {
                              enabled: false
                            },
                            fill: {
                              type: 'gradient',
                              gradient: {
                                shade: 'light',
                                gradientToColors: ['#8F7CC3'],
                                shadeIntensity: 1,
                                type: 'vertical',
                                opacityFrom: 0.7,
                                opacityTo: 0.9,
                                stops: [0, 100, 100]
                              }
                            },
                            stroke: {
                              curve: 'smooth'
                            },
                            xaxis: {
                              labels: {
                                show: false
                              },
                              axisTicks: {
                                show: false
                              },
                              axisBorder: {
                                show: false
                              }
                            },
                            yaxis: {
                              labels: {
                                show: false
                              },
                              axisTicks: {
                                show: false
                              },
                              axisBorder: {
                                show: false
                              }
                            }
                          }}
                          series={this.state.series}
                          type="line"
                          height="80"
                        />
                      </MenuItem>
                      <Divider />
                      {/* <MenuItem
                        onClick={e => {
                          this.props.setDarkMode(!this.props.isDarkMode);
                        }}
                      >
                        <ListItem>
                          {this.props.isDarkMode ? (
                            <Android />
                          ) : (
                            <Person />
                          )}
                        </ListItem>
                       
                        <ListItemText>
                          {this.props.isDarkMode ? 'MARKOV' : 'Q-BOT'}
                        </ListItemText>
                      </MenuItem> */}
                      <MenuItem>
                        <ListItemText>
                          {this.props.isMuted ? (
                            <div
                              className="playBtn"
                              onClick={e => {
                                this.props.toggleMute(!this.props.isMuted);
                                this.handleMute();
                              }}
                            >
                              <ListItemIcon>
                                <VolumeOff />
                              </ListItemIcon>
                              UNMUTE
                            </div>
                          ) : (
                            <div
                              className="playBtn"
                              onClick={e => {
                                this.props.toggleMute(!this.props.isMuted);
                                this.handleUnmute();
                              }}
                            >
                              <ListItemIcon>
                                <VolumeUp />
                              </ListItemIcon>
                              MUTE
                            </div>
                          )}
                        </ListItemText>
                      </MenuItem>
                      <MenuItem
                        onClick={e => {
                          this.props.setDarkMode(!this.props.isDarkMode);
                        }}
                      >
                        <ListItemIcon>
                          {this.props.isDarkMode ? (
                            <Brightness7 />
                          ) : (
                            <Brightness4 />
                          )}
                        </ListItemIcon>

                        <ListItemText>
                          {this.props.isDarkMode ? 'LIGHT MODE' : 'DARK MODE'}
                        </ListItemText>
                      </MenuItem>
                      <MenuItem onClick={this.handleOpenHowToPlayModal}>
                        <ListItemIcon>
                          <Help />
                        </ListItemIcon>
                        <ListItemText>HELP</ListItemText>
                      </MenuItem>
                      <Divider />
                      <MenuItem
                        onClick={e => {
                          this.handleLogout(true);
                        }}
                      >
                        <ListItemIcon>
                          <ExitToApp size="small" />
                        </ListItemIcon>
                        <ListItemText>LOG OUT</ListItemText>
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <>
                    <Button id="btn-login" onClick={this.handleOpenLoginModal}>
                      Login
                    </Button>
                    {/* <Button
                      id="btn-signup"
                      onClick={this.handleOpenSignupModal}
                    >
                      Register
                    </Button> */}
                  </>
                )}
              </div>
            </div>
            <div
              id="notifications"
              className={this.state.showNotifications ? '' : 'hidden'}
              onClick={this.handleNotificationsClick}
            >
              <div className="arrow-up"></div>
              <div className="header_panel_contents">
                {<h2>NOTIFICATIONS HISTORY</h2>}
                {
                  <div>
                    {notificationsArray.length > 0 ? (
                      notificationsArray.map((notification, index) => (
                        <div key={index}>
                          {/* Render notification details here */}
                          <p>{notification.message}</p>
                          <p>From: {notification.username}</p>
                          {/* Add more fields as needed */}
                        </div>
                      ))
                    ) : (
                      <p>No notifications available.</p>
                    )}
                  </div>
                }
              </div>
            </div>
            {this.state.showAllGameLogs && (
              <div className="game-logs-modal-container">
                <div className="modal-header">
                  <h2>ALL HISTORY</h2>
                  <Button
                    className="close-button"
                    onClick={this.toggleAllTransactions}
                  >
                    <Close />
                  </Button>
                </div>
                <div className="summary">
                  <div className="summary-flex">
                    <div>
                      <Button onClick={this.toggleSort}>
                        <FontAwesomeIcon icon={faSort} />
                        &nbsp;&nbsp;Sort by
                      </Button>
                      {this.state.showSort && (
                        <div className="popup">
                          <div className="popup-content">
                            <RadioGroup
                              aria-label="sort-options"
                              name="sort-options"
                              value={this.state.sortBy}
                              onChange={event =>
                                this.handleSortBy(event.target.value)
                              }
                            >
                              <FormControlLabel
                                value="date"
                                control={<Radio color="primary" />}
                                label="Newest"
                              />
                              <FormControlLabel
                                value="amount"
                                control={<Radio color="primary" />}
                                label="Biggest"
                              />
                            </RadioGroup>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Button onClick={this.toggleFilter}>
                        <FontAwesomeIcon icon={faFilter} />
                        &nbsp;&nbsp;Filter
                      </Button>
                      {this.state.showFilter && (
                        <div className="filter">
                          <div className="filter-content">
                            <label>
                              <FontAwesomeIcon icon={faArrowAltCircleUp} />{' '}
                              Withdrawals:
                              <Checkbox
                                checked={this.state.showWithdrawals}
                                onChange={this.toggleShowWithdrawals}
                              />
                            </label>
                            <label>
                              <FontAwesomeIcon icon={faArrowAltCircleDown} />{' '}
                              Deposits:
                              <Checkbox
                                checked={this.state.showDeposits}
                                onChange={this.toggleShowDeposits}
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <Button onClick={this.toggleSearch}>
                        <FontAwesomeIcon icon={faSearch} />
                        &nbsp;&nbsp;Search
                      </Button>

                      {this.state.showSearch && (
                        <div className="search">
                          <div className="search-content">
                            <TextField
                              name="search"
                              margin="normal"
                              value={this.state.searchQuery}
                              onChange={this.handleSearch}
                            ></TextField>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="summary-flex">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>1-Day</span>
                      <span
                        style={{
                          color: this.props.oneDayProfit > 0 ? '#57ca22' : 'red'
                        }}
                      >
                        {this.props.oneDayProfit > 0 ? (
                          <ArrowUpward />
                        ) : (
                          <ArrowDownward />
                        )}
                        {convertToCurrency(this.props.oneDayProfit)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>7-Day</span>
                      <span
                        style={{
                          color:
                            this.props.sevenDayProfit > 0 ? '#57ca22' : 'red'
                        }}
                      >
                        {this.props.sevenDayProfit > 0 ? (
                          <ArrowUpward />
                        ) : (
                          <ArrowDownward />
                        )}
                        {convertToCurrency(this.props.sevenDayProfit)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>All-time</span>
                      <span
                        style={{
                          color:
                            this.props.allTimeProfit > 0 ? '#57ca22' : 'red'
                        }}
                      >
                        {this.props.allTimeProfit > 0 ? (
                          <ArrowUpward />
                        ) : (
                          <ArrowDownward />
                        )}
                        {convertToCurrency(this.props.allTimeProfit)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="game-logs-container">
                  <Table className="game-logs-table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Amount</TableCell>
                        <TableCell>From Now</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Link</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {this.state.transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan="4">...</TableCell>
                        </TableRow>
                      ) : (
                        this.state.transactions.map((row, key) => (
                          <TableRow key={key}>
                            <TableCell
                              className={
                                'amount ' + (row.amount > 0 ? 'green' : 'red')
                              }
                            >
                              {row.amount > 0 ? (
                                <>
                                  {'+ '}
                                  {convertToCurrency(row.amount, true)}
                                </>
                              ) : (
                                <>
                                  {'- '}
                                  {convertToCurrency(
                                    Math.abs(row.amount),
                                    true
                                  )}
                                </>
                              )}
                            </TableCell>
                            <TableCell className="fromNow">
                              {row.from_now}
                            </TableCell>
                            <TableCell className="description">
                              {row.description}
                            </TableCell>
                            <TableCell className="hash">
                              {row.hash ? (
                                <a
                                  href={`https://etherscan.io/tx/${row.hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Link />
                                </a>
                              ) : row.room ? (
                                <a
                                  href={`/join/${row.room}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Link />
                                </a>
                              ) : (
                                // If there's no room value, don't display a link
                                ''
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="load-more-button">
                  <Button onClick={this.handleLoadMore}>LOAD MORE</Button>
                </div>
              </div>
            )}

            <div
              id="game_logs"
              className={this.state.showGameLog ? '' : 'hidden'}
              onClick={this.handleBalanceClick}
            >
              <div className="arrow-up"></div>
              <div className="header_panel_contents">
                {<h2>BALANCE HISTORY</h2>}
                {
                  <div>
                    <table>
                      <tbody>
                        {this.state.transactions.length === 0 ? (
                          <tr>
                            <td>...</td>
                          </tr>
                        ) : (
                          this.state.transactions.map((row, key) => (
                            <tr key={key}>
                              {row.hash ? ( // Check if row has a 'hash' property
                                <a
                                  href={`https://etherscan.io/tx/${row.hash}`}
                                  rel="noopener noreferrer"
                                >
                                  <td
                                    className={
                                      'amount ' +
                                      (row.amount > 0 ? 'green' : 'red')
                                    }
                                  >
                                    {row.amount > 0 ? (
                                      <>
                                        {'+ '}
                                        {convertToCurrency(row.amount, true)}
                                      </>
                                    ) : (
                                      <>
                                        {'- '}
                                        {convertToCurrency(
                                          Math.abs(row.amount),
                                          true
                                        )}
                                      </>
                                    )}
                                  </td>
                                  <td className="fromNow">{row.from_now}</td>
                                </a>
                              ) : (
                                <table>
                                  {' '}
                                  <td
                                    className={
                                      'amount ' +
                                      (row.amount > 0 ? 'green' : 'red')
                                    }
                                  >
                                    {row.amount > 0 ? (
                                      <>
                                        {'+ '}
                                        {convertToCurrency(row.amount, true)}
                                      </>
                                    ) : (
                                      <>
                                        {'- '}
                                        {convertToCurrency(
                                          Math.abs(row.amount),
                                          true
                                        )}
                                      </>
                                    )}
                                  </td>
                                  <td className="fromNow">{row.from_now}</td>
                                </table>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                      <Button onClick={this.toggleAllTransactions}>
                        View All
                      </Button>
                    </table>
                  </div>
                }
                <div className="transaction-panel">
                  <Button
                    className="btn-inventory"
                    isDarkMode={this.props.isDarkMode}
                    onClick={this.handleOpenInventoryModal}
                  >
                    Inventory
                  </Button>
                </div>
                <div className="transaction-panel">
                  <Button
                    className="btn-withdraw"
                    onClick={this.handleOpenWithdrawModal}
                    isDarkMode={this.props.isDarkMode}
                  >
                    Withdraw
                  </Button>
                  <Button
                    className="btn-deposit"
                    onClick={this.handleOpenDepositModal}
                    isDarkMode={this.props.isDarkMode}
                  >
                    Deposit
                  </Button>
                  <hr />
                  {this.state.web3account ? (
                    <>
                      <input
                        id="wallet-address"
                        type="text"
                        value={this.state.web3account}
                        readOnly
                      />
                      <Button className="connect" onClick={this.disconnectWeb3}>
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button className="connect" onClick={this.loadWeb3}>
                      Wallet Not connected
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="game_wrapper">
            <div className="contents_wrapper">{this.props.children}</div>
          </div>

          {this.state.showProfileModal && (
            <ProfileModal
              modalIsOpen={this.state.showProfileModal}
              closeModal={this.handleCloseProfileModal}
              player_name={this.state.userName}
              balance={this.state.balance}
              avatar={this.props.user.avatar}
              email={this.props.user.email}
              totalWagered={this.props.user.totalWagered}
            />
          )}
          {this.state.showPlayerModal && (
            <PlayerModal
              modalIsOpen={this.state.showPlayerModal}
              closeModal={this.handleClosePlayerModal}
              player_name={this.state.userName}
              balance={this.state.balance}
              avatar={this.props.user.avatar}
            />
          )}
          {this.state.showLeaderboardsModal && (
            <LeaderboardsModal
              modalIsOpen={this.state.showLeaderboardsModal}
              closeModal={this.handleCloseLeaderboardsModal}
              player_name={this.state.userName}
              balance={this.state.balance}
              isDarkMode={this.props.isDarkMode}
            />
          )}
          {this.state.showHowToPlayModal && (
            <HowToPlayModal
              modalIsOpen={this.state.showHowToPlayModal}
              closeModal={this.handleCloseHowToPlayModal}
              player_name={this.state.userName}
              balance={this.state.balance}
              isDarkMode={this.props.isDarkMode}
            />
          )}
          {this.state.showMarketplaceModal && (
            <MarketplaceModal
              modalIsOpen={this.state.showMarketplaceModal}
              closeModal={this.handleCloseMarketplaceModal}
              player_name={this.state.userName}
              balance={this.state.balance}
              isDarkMode={this.props.isDarkMode}
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
              web3={this.state.web3}
              balance={this.state.web3balance}
              account={this.state.web3account}
            />
          )}
          {this.state.showInventoryModal && (
            <InventoryModal
              modalIsOpen={this.state.showInventoryModal}
              closeModal={this.handleCloseInventoryModal}
            />
          )}
          {this.state.showWithdrawModal && (
            <WithdrawModal
              modalIsOpen={this.state.showWithdrawModal}
              closeModal={this.handleCloseWithdrawModal}
              balance={this.state.balance}
              web3={this.state.web3}
              account={this.state.web3account}
            />
          )}
          {this.state.showResetPasswordModal && (
            <ResetPasswordModal
              modalIsOpen={this.state.showResetPasswordModal}
              closeModal={this.handleCloseResetPasswordModal}
              openLoginModal={this.handleOpenLoginModal}
            />
          )}
          <ListItemModal />
          <DeListItemModal />
          <ConfirmTradeModal />
          <GamePasswordModal />
        </div>
      </MuiThemeProvider>
    );
  }
}

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  showListItemModal: state.snackbar.showListItemModal,
  showDeListItemModal: state.snackbar.showDeListItemModal,
  showConfirmTradeModal: state.snackbar.showConfirmTradeModal,
  showGamePasswordModal: state.snackbar.showGamePasswordModal,
  socket: state.auth.socket,
  balance: state.auth.balance,
  userName: state.auth.userName,
  isMuted: state.auth.isMuted,
  user: state.auth.user,
  unreadMessageCount: state.auth.unreadMessageCount,
  // isActiveLoadingOverlay: state.logic.isActiveLoadingOverlay,
  selectedMainTabIndex: state.logic.selectedMainTabIndex,
  transactions: state.auth.transactions,
  isDarkMode: state.auth.isDarkMode,
  betResult: state.logic.betResult,
  sevenDayProfit: state.auth.sevenDayProfit,
  oneDayProfit: state.auth.oneDayProfit,
  allTimeProfit: state.auth.allTimeProfit,
  notifications: state.logic.notifications
});

const mapDispatchToProps = {
  setSocket,
  userSignOut,
  setRoomList,
  getUser,
  addChatLog,
  getMyGames,
  getMyHistory,
  getHistory,
  setUnreadMessageCount,
  addNewTransaction,
  getNotifications,
  setDarkMode,
  updateOnlineUserList,
  selectMainTab,
  globalChatReceived,
  toggleMute,
  setGlobalChat,
  updateBetResult
};

export default connect(mapStateToProps, mapDispatchToProps)(SiteWrapper);
