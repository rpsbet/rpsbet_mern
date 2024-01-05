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
  Tooltip
} from '@material-ui/core';
import { Info } from '@material-ui/icons';

import SettingsModal from './modal/SettingsModal.jsx';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import ReactApexChart from 'react-apexcharts';
import CountUp from 'react-countup';
import Lottie from 'react-lottie';
import progress from './LottieAnimations/progress.json';
import coins from './LottieAnimations/coins.json';
import InlineSVG from 'react-inlinesvg';
import busdSvg from './JoinGame/busd.svg';

import AllTransactionsModal from './modal/AllTransactionsModal.jsx';
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
  Help,
  Settings
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
import BankModal from './modal/BankModal';
import DebtsModal from './modal/DebtsModal';

import LeaderboardsModal from './modal/LeaderboardsModal';
import { getNotifications } from '../redux/Logic/logic.actions';
import { acCalculateRemainingLoans } from '../redux/Loan/loan.action';
import ConfirmTradeModal from './modal/ConfirmTradeModal';
import ConfirmLoanModal from './modal/ConfirmLoanModal';
import ListItemModal from './modal/ListItemModal';
import DeListItemModal from './modal/DeListItemModal';
import DeListLoanModal from './modal/DeListLoanModal';
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
import Bank from './icons/Bank.js';
import BankHover from './icons/BankHover';

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
      showBankModal: false,
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
      notifications: updateFromNow(this.props.notifications),
      showNotifications: false,
      userParams: [false, true],
      loadMore: 0,
      showAllGameLogs: false,
      transactions: [],
      websiteLoading: true,
      anchorEl: null,
      sortAnchorEl: null,
      filterAnchorEl: null,
      sortType: 'date',
      filterType: '',
      showSearch: false,
      searchQuery: '',
      isCoinsAnimation: false,
      showSettingsModal: false,
      showDeposits: false,
      web3: null,
      web3account: '',
      remainingLoans: this.props.remainingLoans,
      web3balance: 0
    };
    this.state.notifications = this.props.notification || {};
    this.initSocket = this.initSocket.bind(this);
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
        notifications: updateFromNow(props.notifications),
        userName,
        transactions: updateFromNow(props.transactions),
        betResult
      };
    }

    return null;
  }

  async componentDidUpdate(prevProps, prevState) {
    const { loadMore } = this.state;
    const { transactions, tnxComplete, remainingLoans } = this.props;

    if (prevProps.transactions[0] !== transactions[0] && transactions[0].amount > 0) {
      // console.log("D", transactions[0].amount)
      if (!this.props.isLowGraphics) {
        this.playCoinsAnimation();
      }
    }
    const shouldUpdate =
      prevProps.transactions !== transactions &&
      transactions.length > 0 &&
      loadMore === 0 &&
      !tnxComplete;

    if (prevProps.remainingLoans !== remainingLoans) {
      this.setState({ remainingLoans: remainingLoans });
    }
    if (shouldUpdate) {

      try {
        await this.props.getUser(true, false);

        await this.props.getHistory();
      } catch (error) {
        console.error("An error occurred during asynchronous operations:", error);
        // Handle the error appropriately, e.g., show an error message to the user
      }

      if (!this.isUnmounted) {
        this.stopCoinsAnimationAfterDelay();
      }
    }
  }
  


  playCoinsAnimation() {
    // console.log("SD")
    this.setState({ isCoinsAnimation: true });
  }

  stopCoinsAnimationAfterDelay() {
    setTimeout(() => {
      this.setState({ isCoinsAnimation: false });
    }, 1500); // Adjust the delay based on your Lottie animation duration
  }

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
    this.setState({
      transactions: updateFromNow(this.state.transactions),
      notifications: updateFromNow(this.state.notifications)
    });
  };

  async initSocket() {
    const socket = socketIOClient(this.state.endpoint);
    socket.on('CONNECTED', async data => {
      socket.emit('STORE_CLIENT_USER_ID', { user_id: this.props.user._id });
      socket.emit('FETCH_GLOBAL_CHAT');
    });

    socket.on('UPDATED_ROOM_LIST', async data => {
      await this.props.setRoomList(data);

      // await this.props.getUser(
      //   true,
      //   false,
      //   4,
      //   this.state.filterType,
      //   this.state.sortType,
      //   this.state.searchQuery
      // );
      await this.props.getMyGames(1);
      await this.props.getMyHistory();
      await this.props.getHistory();
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
  }

  loadWeb3 = async () => {
    try {
      // Check if there is a provider available
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        // Set the provider explicitly
        web3.setProvider(window.ethereum);

        // Request accounts using the new Ethereum provider
        const accounts = await web3.eth.requestAccounts();
        this.setState({ web3, web3account: accounts[0] });

        // Get ETH balance of the account
        const ethBalance = await web3.eth.getBalance(accounts[0]);
        const tokenAmount = web3.utils.fromWei(ethBalance, 'ether');
        this.setState({ web3balance: tokenAmount });
      } else {
        console.error("No Ethereum provider found. Please install MetaMask or enable Ethereum in your browser.");
      }
    } catch (e) {
      console.error("Error loading Web3:", e);
    }
  };


  async componentDidMount() {
    try {
      this.setState({ websiteLoading: true });

      const currentUrl = window.location.pathname;

      await Promise.all([
        this.props.getNotifications(),
        this.initSocket(),
        this.props.getUser(true, false, null, null, null, null),
        this.props.acCalculateRemainingLoans(),
        this.initializeAudio(),
        this.fetchData(),
      ]);


      // Set selectedMainTabIndex based on the current URL
      if (currentUrl.includes('create')) {
        this.setState({ selectedMainTabIndex: this.props.selectMainTab(1) });
      }

      // Set up intervals for fetchData and updateReminderTime
      setInterval(() => this.fetchData(), 2000);
      this.interval = setInterval(this.updateReminderTime, 3000);

      // Set up Ethereum event listeners
      if (window.ethereum) {
        window.ethereum.on('chainChanged', () => this.loadWeb3());
        window.ethereum.on('accountsChanged', () => this.loadWeb3());
      }

      // Load Web3
      this.loadWeb3();
    } catch (error) {
      console.error(error);
    } finally {
      this.setState({ websiteLoading: false });

    }
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
    this.isUnmounted = true;
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

  handleOpenSettingsModal = () => {
    this.setState({ showSettingsModal: true });
  };
  handleCloseSettingsModal = () => {
    this.setState({ showSettingsModal: false });
  };

  handleOpenLoginModal = () => {
    this.setState({ showLoginModal: true });
  };
  handleCloseLoginModal = () => {
    this.setState({ showLoginModal: false });
  };

  handleOpenDebtsModal = () => {
    this.setState({ showDebtsModal: true });
  };
  handleCloseDebtsModal = () => {
    this.setState({ showDebtsModal: false });
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
  handleOpenPlayerModal = selectedCreator => {
    this.setState({ showPlayerModal: true, selectedCreator: selectedCreator });
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


  handleOpenBankModal = () => {
    this.setState({ showBankModal: true });
  };
  handleCloseBankModal = () => {
    this.setState({ showBankModal: false });
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

  handleSearchClose = event => {
    this.setState({ searchAnchorEl: null });
  };

  onSearchQueryChange = event => {
    const searchQuery = event;
    this.setState({ searchQuery }, () => {
      // Call the function to fetch data with the updated search query
      this.props.getUser(
        false,
        true,
        this.state.loadMore,
        this.state.filterType,
        this.state.sortType,
        searchQuery
      );
    });
  };

  handleSearchClick = event => {
    this.setState({ searchAnchorEl: event.currentTarget });
  };

  handleFilterClick = event => {
    this.setState({ filterAnchorEl: event.currentTarget });
  };

  handleFilterClose = event => {
    this.setState(
      { transactions: [], filterType: event, filterAnchorEl: null },
      () => {
        this.props.getUser(
          false,
          true,
          this.state.loadMore,
          event,
          this.state.sortType,
          this.state.searchQuery
        );
      }
    );
  };

  handleSortClick = event => {
    this.setState({ sortAnchorEl: event.currentTarget });
  };

  handleSortClose = event => {
    this.setState({ sortType: event, sortAnchorEl: null }, () => {
      this.props.getUser(
        false,
        true,
        this.state.loadMore,
        this.state.filterType,
        event,
        this.state.searchQuery
      );
    });
  };

  handleLoadMore = async () => {
    const { loadMore, filterType, sortType, searchQuery } = this.state;
    const nextLoadMore = loadMore >= 0 ? loadMore + 10 : 10;

    await this.props.getUser(
      false,
      true,
      nextLoadMore,
      filterType,
      sortType,
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
      this.state.filterType,
      this.state.sortType,
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
    const {
      series,
      sortAnchorEl,
      filterAnchorEl,
      searchAnchorEl,
      hoverTabIndex,
      websiteLoading,
      balance,
      searchQuery,
      sortType,
      filterType,
      web3,
      oldBalance,
      web3account,
      transactions,
      web3balance,
      userName,
      showInventoryModal,
      showNotifications,
      showProfileModal,
      showPlayerModal,
      selectedCreator,
      showWithdrawModal,
      showResetPasswordModal,
      showDepositModal,
      showAllGameLogs,
      showLeaderboardsModal,
      showHowToPlayModal,
      showVerificationModal,
      showMarketplaceModal,
      showBankModal,
      showLoginModal,
      showSignupModal,
      showDebtsModal,
      anchorEl,
      isCoinsAnimation,
      showSettingsModal,
    } = this.state;
    const {
      isMuted,
      tnxComplete,
      isDarkMode,
      notifications,
      selectedMainTabIndex,
      isAuthenticated,
      children,
      oneDayProfit,
      sevenDayProfit,
      allTimeProfit,
      user,
      isLowGraphics
    } = this.props;
    const balanceString = balance.toString();
    const decimalIndex = balanceString.indexOf('.');
    const numDecimals =
      decimalIndex !== -1
        ? Math.min(balanceString.length - decimalIndex - 1, 5)
        : 0;
    const notificationsArray = updateFromNow(Object.values(notifications));
    return (
      <MuiThemeProvider theme={isDarkMode ? darkTheme : mainTheme}>
        <div className={`site_wrapper row ${isDarkMode ? 'dark_mode' : ''}`}>
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
                  filter: `hue-rotate(${hueRotateValue}deg)`,
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
                value={selectedMainTabIndex}
                onChange={this.handleMainTabChange}
                TabIndicatorProps={{ style: { background: '#ff0000' } }}
                className="main-game-page-tabs desktop-only"
              >
                <Tab
                  className={`custom-tab ${hoverTabIndex === 0 || selectedMainTabIndex === 0
                      ? 'fade-animation fade-in'
                      : 'fade-animation fade-out'
                    }`}
                  label="PVP"
                  labelPlacement="left"
                  icon={
                    hoverTabIndex === 0 || selectedMainTabIndex === 0 ? (
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
                  className={`custom-tab ${hoverTabIndex === 1 || selectedMainTabIndex === 1
                      ? 'fade-animation fade-in'
                      : 'fade-animation fade-out'
                    }`}
                  label="Manage"
                  labelPlacement="left"
                  icon={
                    hoverTabIndex === 1 || selectedMainTabIndex === 1 ? (
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
                  className="desktop-only"
                  onClick={e => {
                    e.preventDefault();
                    this.handleOpenBankModal();
                  }}
                  id="btn_bank"
                  onMouseEnter={() => this.handleMouseEnter(6)}
                  onMouseLeave={this.handleMouseLeave}
                >
                  {hoverTabIndex === 6 ? (
                    <BankHover width="18pt" />
                  ) : (
                    <Bank />
                  )}
                </a>
                <a
                  href="#"
                  className="desktop-only"
                  onClick={e => {
                    e.preventDefault();
                    this.handleOpenMarketplaceModal();
                  }}
                  id="btn_marketplace"
                  onMouseEnter={() => this.handleMouseEnter(5)}
                  onMouseLeave={this.handleMouseLeave}
                >
                  {hoverTabIndex === 5 ? (
                    <StoreHover width="18pt" />
                  ) : (
                    <Store />
                  )}
                </a>
                <a
                  className="desktop-only"
                  href="#"
                  onClick={e => {
                    e.preventDefault();
                    this.handleOpenLeaderboardsModal();
                  }}
                  id="btn_leaderboards"
                  onMouseEnter={() => this.handleMouseEnter(4)}
                  onMouseLeave={this.handleMouseLeave}
                >
                  {hoverTabIndex === 4 ? (
                    <LeaderboardsHover width="18pt" />
                  ) : (
                    <Leaderboards />
                  )}
                </a>
                <a
                  href="#"
                  className="desktop-only"
                  onClick={e => {
                    e.preventDefault();
                    this.handleNotificationsClick();
                  }}
                  id="btn_notifications"
                  onMouseEnter={() => this.handleMouseEnter(3)}
                  onMouseLeave={this.handleMouseLeave}
                >
                  {hoverTabIndex === 3 ? (
                    <NotificationsHover width="18pt" />
                  ) : (
                    <Notifications />
                  )}
                </a>
                {isAuthenticated ? (
                  <>
                    <div id="balance">
                      <InlineSVG
                        id="busd"
                        src={busdSvg}
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
                      {(isCoinsAnimation && !isLowGraphics) && 
                      <Lottie
                      options={{
                        loop: false,
                        autoplay: isCoinsAnimation,
                        animationData: coins,
                        rendererSettings: {
                          preserveAspectRatio: 'xMidYMid slice',
                        },
                      }}
                      style={{
                        marginTop: '-0px',
                        position: `absolute`,
                        width: '100px',
                        height: '100px'
                      }}
                      />
                    }
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
                    <a
                      href="#"
                      className="mobile-only"
                      onClick={e => {
                        e.preventDefault();
                        this.handleNotificationsClick();
                      }}
                      id="btn_notifications"
                      onMouseEnter={() => this.handleMouseEnter(3)}
                      onMouseLeave={this.handleMouseLeave}
                    >
                      {hoverTabIndex === 3 ? (
                        <NotificationsHover width="18pt" />
                      ) : (
                        <Notifications />
                      )}
                    </a>
                    <Button
                      area-constrols="profile-menu"
                      aria-haspopup="true"
                      onClick={this.handleClickMenu}
                      className="profile-menu"
                    >
                      <Avatar
                        src={user.avatar}
                        rank={user.totalWagered}
                        accessory={user.accessory}
                        alt=""
                        className="avatar"
                        darkMode={isDarkMode}
                      />
                      {/* <span className="username">{this.state.userName}</span> */}
                      <ArrowDropDown />
                    </Button>
                    <Menu
                      id="profile-menu"
                      anchorEl={anchorEl}
                      getContentAnchorEl={null}
                      open={Boolean(anchorEl)}
                      onClose={this.handleCloseMenu}
                      isDarkMode={isDarkMode}
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
                          border: isDarkMode
                            ? '2px solid #212529'
                            : '2px solid #e5e5e5',
                          background: isDarkMode ? '#101010' : '#f9f9f9'
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
                          series={series}
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
                      <MenuItem onClick={this.handleOpenSettingsModal}>
                        <ListItemIcon>
                          <Settings />
                        </ListItemIcon>
                        <ListItemText>SETTINGS</ListItemText>
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
              className={showNotifications ? '' : 'hidden'}
              onClick={this.handleNotificationsClick}
            >
              <div className="arrow-up"></div>
              <div className="header_panel_contents">
                {<h2>NOTIFICATIONS</h2>}
                {
                  <div>
                    {notificationsArray.length > 0 ? (
                      notificationsArray.map((notification, index) => (
                        <div className="notification-container" key={index}>
                          <a
                            className="player"
                            onClick={() =>
                              this.handleOpenPlayerModal(notification._id)
                            }
                            style={{ display: 'flex', flexDirection: 'row' }}
                          >
                            <Avatar
                              src={notification.avatar}
                              rank={notification.rank}
                              accessory={notification.accessory}
                              className="avatar"
                            />
                          </a>
                          <div className="notification">
                            <p
                              dangerouslySetInnerHTML={{
                                __html: notification.message
                              }}
                            />
                            <p className="fromNow">{notification.from_now}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>No notifications available.</p>
                    )}
                  </div>
                }
              </div>
            </div>
            {showAllGameLogs && (
              <AllTransactionsModal
                modalIsOpen={showAllGameLogs}
                isDarkMode={isDarkMode}
                close={this.toggleAllTransactions}
                sortType={sortType}
                sortAnchorEl={sortAnchorEl}
                searchAnchorEl={searchAnchorEl}
                filterAnchorEl={filterAnchorEl}
                filterType={filterType}
                user={user._id}
                transactions={transactions}
                tnxComplete={tnxComplete}
                handleSortClick={this.handleSortClick}
                handleFilterClick={this.handleFilterClick}
                handleFilterClose={this.handleFilterClose}
                handleSortClose={this.handleSortClose}
                handleSearchClose={this.handleSearchClose}
                searchQuery={searchQuery}
                onSearchQueryChange={this.onSearchQueryChange}
                handleSearchClick={this.handleSearchClick}
                handleLoadMore={this.handleLoadMore}
                oneDayProfit={oneDayProfit}
                sevenDayProfit={sevenDayProfit}
                allTimeProfit={allTimeProfit}
              />
            )}

            <div
              id="game_logs"
              className={this.state.showGameLog ? '' : 'hidden'}
              onClick={this.handleBalanceClick}
            >
              <div className="arrow-up"></div>
              <div className="header_panel_contents">
              {<Tooltip
                    style={{position: "absolute", right: "20px"}}
          title={
            <>
              <strong>WHY DO MY WINNINGS APPEAR LESS?</strong>
              <br /><br />
              You see less as this is net profit (winnings - bet amount) and
              receive less due to RTB fees awarded to the Host (0% - 15%
              Returned to Bankroll dependent on their accessory) and 0.5%
              towards platform fees. For example, if you win {convertToCurrency(0.2)}&nbsp;
               but bet {convertToCurrency(0.1)}, then you might see:
              {convertToCurrency(0.2)} * 0.88 (12% RTB) - {convertToCurrency(0.1)} (net profit)
              = {convertToCurrency(0.076)} (Final Calculation)
            </>
          }
          placement="top"
        >
          <Info />
        </Tooltip>}
          <h2>BALANCE HISTORY</h2>
        
                {
                  <div>
                    <table>
                    
                      <tbody>
                        {transactions.filter(row => row.user === this.props.user._id)
                          .length === 0 ? (
                          <tr>
                            <td>...</td>
                          </tr>
                        ) : (
                          transactions.filter(row => row.user === this.props.user._id)
                            .map((row, key) => (
                              // row.user === this.props.user && (
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
                    isDarkMode={isDarkMode}
                    onClick={this.handleOpenInventoryModal}
                  >
                    Inventory
                  </Button>
                </div>
                <div className="transaction-panel">
                  {this.state.remainingLoans > 0 ? (
                    <Button
                      className="btn-withdraw debt"
                      onClick={this.handleOpenDebtsModal}
                      isDarkMode={isDarkMode}
                    >
                      <div>{convertToCurrency(this.state.remainingLoans)} IN DEBT</div>
                    </Button>
                  ) : (
                    <Button
                      className="btn-withdraw"
                      onClick={this.handleOpenWithdrawModal}
                      isDarkMode={isDarkMode}
                    >
                      Withdraw
                    </Button>
                  )}

                  <Button
                    className="btn-deposit"
                    onClick={this.handleOpenDepositModal}
                    isDarkMode={isDarkMode}
                  >
                    Deposit
                  </Button>
                  <hr />
                  {web3account ? (
                    <>
                      <input
                        id="wallet-address"
                        type="text"
                        value={web3account}
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
            <div className="contents_wrapper">{children}</div>
          </div>

          {showProfileModal && (
            <ProfileModal
              modalIsOpen={showProfileModal}
              closeModal={this.handleCloseProfileModal}
              player_name={userName}
              balance={balance}
              accessory={user.accessory}
              avatar={user.avatar}
              totalWagered={user.totalWagered}
              selectedCreator={user._id}
            />
          )}
          {showPlayerModal && (
            <PlayerModal
              selectedCreator={selectedCreator}
              modalIsOpen={showPlayerModal}
              closeModal={this.handleClosePlayerModal}
            />
          )}
          {showSettingsModal && (
            <SettingsModal
              modalIsOpen={showSettingsModal}
              closeModal={this.handleCloseSettingsModal}
              handleMute={this.handleMute}
              handleUnmute={this.handleUnmute}
            />
          )}
          {showLeaderboardsModal && (
            <LeaderboardsModal
              modalIsOpen={showLeaderboardsModal}
              closeModal={this.handleCloseLeaderboardsModal}
              player_name={userName}
              balance={balance}
              isDarkMode={isDarkMode}
            />
          )}
          {showHowToPlayModal && (
            <HowToPlayModal
              modalIsOpen={showHowToPlayModal}
              closeModal={this.handleCloseHowToPlayModal}
              player_name={userName}
              balance={balance}
              isDarkMode={isDarkMode}
            />
          )}
          {showBankModal && (
            <BankModal
              modalIsOpen={showBankModal}
              closeModal={this.handleCloseBankModal}
              player_name={userName}
              balance={balance}
              isDarkMode={isDarkMode}
            />
          )}
          {showMarketplaceModal && (
            <MarketplaceModal
              modalIsOpen={showMarketplaceModal}
              closeModal={this.handleCloseMarketplaceModal}
              player_name={userName}
              balance={balance}
              isDarkMode={isDarkMode}
            />
          )}
          {showLoginModal && (
            <LoginModal
              modalIsOpen={showLoginModal}
              closeModal={this.handleCloseLoginModal}
              openSignupModal={this.handleOpenSignupModal}
              openVerificationModal={this.handleOpenVerificationModal}
              initSocket={this.initSocket}
              openResetPasswordModal={this.handleOpenResetPasswordModal}
            />
          )}
          {showDebtsModal && (
            <DebtsModal
              modalIsOpen={showDebtsModal}
              closeModal={this.handleCloseDebtsModal}
              openDebtsModal={this.handleOpenDebtsModal}
            />
          )}
          {showSignupModal && (
            <SignupModal
              modalIsOpen={showSignupModal}
              closeModal={this.handleCloseSignupModal}
              openLoginModal={this.handleOpenLoginModal}
            />
          )}
          {showVerificationModal && (
            <VerificationModal
              modalIsOpen={showVerificationModal}
              closeModal={this.handleCloseVerificationModal}
            />
          )}
          {showDepositModal && (
            <DepositModal
              modalIsOpen={showDepositModal}
              closeModal={this.handleCloseDepositModal}
              web3={web3}
              balance={web3balance}
              account={web3account}
            />
          )}
          {showInventoryModal && (
            <InventoryModal
              modalIsOpen={showInventoryModal}
              closeModal={this.handleCloseInventoryModal}
            />
          )}
          {showWithdrawModal && (
            <WithdrawModal
              modalIsOpen={showWithdrawModal}
              closeModal={this.handleCloseWithdrawModal}
              balance={balance}
              web3={web3}
              account={web3account}
            />
          )}
          {showResetPasswordModal && (
            <ResetPasswordModal
              modalIsOpen={showResetPasswordModal}
              closeModal={this.handleCloseResetPasswordModal}
              openLoginModal={this.handleOpenLoginModal}
            />
          )}
          <ListItemModal />
          <DeListItemModal />
          <ConfirmTradeModal />
          <DeListLoanModal />
          <ConfirmLoanModal />
          <GamePasswordModal />
        </div>
      </MuiThemeProvider>
    );
  }
}

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
  showDeListLoanModal: state.snackbar.showDeListLoanModal,
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
  selectedMainTabIndex: state.logic.selectedMainTabIndex,
  transactions: state.auth.transactions,
  tnxComplete: state.logic.transactionComplete,
  isDarkMode: state.auth.isDarkMode,
  betResult: state.logic.betResult,
  remainingLoans: state.loanReducer.remainingLoans,
  userLoans: state.loanReducer.userLoans,
  sevenDayProfit: state.auth.sevenDayProfit,
  oneDayProfit: state.auth.oneDayProfit,
  allTimeProfit: state.auth.allTimeProfit,
  notifications: state.logic.notifications,
  isLowGraphics: state.auth.isLowGraphics,

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
  acCalculateRemainingLoans,
  globalChatReceived,
  setGlobalChat,
  updateBetResult
};

export default connect(mapStateToProps, mapDispatchToProps)(SiteWrapper);
