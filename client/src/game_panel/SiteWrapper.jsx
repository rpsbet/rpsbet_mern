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
  Tooltip,
  Typography
} from '@material-ui/core';
import Footer from './main_pages/Footer';
import { Info } from '@material-ui/icons';
import Countdown from 'react-countdown';
import { withRouter } from 'react-router-dom';
import axios from '../util/Api';
import SettingsModal from './modal/SettingsModal.jsx';
import BonusModal from './modal/BonusModal.jsx';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import CountUp from 'react-countup';
import Lottie from 'react-lottie';
import progress from './LottieAnimations/progress.json';
import coins from './LottieAnimations/coins.json';
import InlineSVG from 'react-inlinesvg';
import busdSvg from './JoinGame/busd.svg';
import AllTransactionsModal from './modal/AllTransactionsModal.jsx';
import {
  AccountBalanceWallet,
  ArrowDropDown,
  ExitToApp,
  PersonOutline,
  MonetizationOn,
  ShoppingCart,
  Help,
  Settings,
  Star
} from '@material-ui/icons';
import history from '../redux/history';
import socketIOClient from 'socket.io-client';
import Moment from 'moment';
import Avatar from '../components/Avatar';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';

import ProfileModal from './modal/ProfileModal';
import PlayerModal from './modal/PlayerModal';
import HowToPlayModal from './modal/HowToPlayModal';
import MarketplaceModal from './modal/MarketplaceModal';
import BankModal from './modal/BankModal';
import DebtsModal from './modal/DebtsModal';

import LeaderboardsModal from './modal/LeaderboardsModal';

import { acCalculateRemainingLoans, setCurrentOfferTargetInfo } from '../redux/Loan/loan.action';
import ConfirmTradeModal from './modal/ConfirmTradeModal';
import ConfirmLoanModal from './modal/ConfirmLoanModal';
import OfferLoanModal from './modal/OfferLoanModal';
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
import VaultModal from './modal/VaultModal';
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
import Joyride from 'react-joyride';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons';
import { tutorialStepsMain } from '../util/tutorialStepsMain';
import { token } from '../config/index.js';

import {
  setSocket,
  userSignOut,
  getUser,
  getProfitData,
  setUnreadMessageCount,
  setDarkMode,
  setNotificationsAllowed,
  fetchVaultBalance,
  updateTutorialCompleted
} from '../redux/Auth/user.actions';
import { openOfferLoanModal } from '../redux/Notification/notification.actions';
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
  updateBetResult,
  getNotifications,
  readNotifications,
  getWithdrawals,
  getWins,
} from '../redux/Logic/logic.actions';
import { alertModal } from './modal/ConfirmAlerts.jsx';
import CookieConsent from '../util/cookieConsent';
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

const formatTimeAgo = (date) => {
  const duration = Moment.duration(Moment().diff(Moment(date)));
  const seconds = Math.floor(duration.asSeconds());
  const minutes = Math.floor(duration.asMinutes());
  const hours = Math.floor(duration.asHours());
  const days = Math.floor(duration.asDays());

  if (seconds < 60) return `${seconds} s`;
  if (minutes < 60) return `${minutes} m`;
  if (hours < 24) return `${hours} h`;
  return `${days}d`;
};


class SiteWrapper extends Component {
  constructor(props) {
    super(props);
    const currentPath = window.location.pathname;
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
      run: false,
      isInvestorsPage: location.pathname.startsWith('/investors'),
      isPlayer: location.pathname.startsWith('/play'),
      currentTutorial: 1,
      showHowToPlayModal: false,
      vaultBal: 0,
      showMarketplaceModal: false,
      showBankModal: false,
      showLeaderboardsModal: false,
      isPlaying: false,
      showLoginModal: false,
      showSignupModal: false,
      showVerificationModal: false,
      showWithdrawModal: false,
      showDepositModal: currentPath === '/deposit/' || currentPath === '/deposit',
      showInventoryModal: false,
      showVaultModal: false,
      showResetPasswordModal: false,
      showGameLog: false,
      notifications: [],
      showNotifications: false,
      loadMore: 10,
      isLive: false,
      blurValue: 3,
      isCountdownHovered: false,
      isYoutubeHovered: false,
      countdownWidth: '50%', // Initial width for countdown side
      youtubeWidth: '50%', // Initial width for youtube side
      countdownOpacity: 1,
      currentGif: '',
      youtubeOpacity: 1,
      tokenModalOpen: location.pathname.startsWith('/investors') ? false : true,
      showAllGameLogs: false,
      transactions: [],
      isHovered: false,
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
      showBonusModal: false,
      showDeposits: false,
      bonusCheck: false,
      remainingLoans: this.props.remainingLoans,
      // web3: null,
      // walletAddress: '',
      walletAddress: '',
      tokenBalance: 0,
      solanaBalance: 0
    };
    this.initSocket = this.initSocket.bind(this);
    this.gifs = [
      'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExNGR4N2N1YXZwaHY4eDB1OWY3aTBybzJ2dXp2MGJiamcwcDJwbjVxayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/6ABLpFTPng3euH1XE6/giphy.gif',
      'https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExZHNvM3VjN3FicHN1ZjM1ZnIwNGtrMGUyZjNiOWQzb3hrZXhxeG9vbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/6Jrp4ZD9B1z7VjrKhq/giphy.gif',
      'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnNza2NvZTdsZ3AwOWlweGJmYmV1cGc5anhyeW1rZ2NpM3l1cWc4YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/UxVOH4FZjQ9wBk1hJa/giphy.gif',
      'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXZ5YjY4ZWhnY2NmMjY4N205aHRnOW1wenF6bzFjcTZuanllNzdoZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MNNLoVzRBXiW7ndcqb/giphy.gif'
    ];
  }
  static getDerivedStateFromProps(props, currentState) {
    const { balance, betResult, userName, notifications } = props;

    if (
      currentState.balance !== balance ||
      currentState.betResult !== betResult ||
      currentState.userName !== userName
    ) {
      return {
        ...currentState,
        balance,
        userName,
        transactions: updateFromNow(props.transactions),
        betResult
      };
    }

    return null;
  }

  async componentDidUpdate(prevProps, prevState) {
    const { loadMore } = this.state;
    const { transactions, tnxComplete, remainingLoans, betResult } = this.props;

    if (this.props.user !== prevProps.user) {
      this.setState({ run: !this.props.user.completedTutorials.includes(1) })
    }


    if (prevProps.betResult !== betResult && betResult === 'win') {
      if (!this.props.isLowGraphics) {
        this.playCoinsAnimation();
      }
    }

    if (prevState.showNotifications !== this.state.showNotifications && !this.state.showNotifications) {
      this.props.readNotifications();
      const updatedNotifications = this.state.notifications.map(notification => ({
        ...notification,
        is_read: true
      }));
      this.setState({ notifications: updatedNotifications });
    }

    const shouldUpdate =
      transactions &&
      transactions.length > 0 &&
      prevProps.transactions[0] &&
      prevProps.transactions[0] !== transactions[0] &&
      !tnxComplete;

    if (prevProps.remainingLoans !== remainingLoans) {
      this.setState({ remainingLoans: remainingLoans });
    }

    if (shouldUpdate) {

      try {
        await this.props.getUser(true, 5);

      } catch (error) {
        console.error("An error occurred during asynchronous operations:", error);
      }

      if (!this.isUnmounted) {
        this.stopCoinsAnimationAfterDelay();
      }
    }
  }

  // checkBonusTime() {
  //   const lastBonus = this.props.user.last_bonus ? new Date(this.props.user.last_bonus) : null;
  //   const now = new Date();
  //   // Check if last_bonus is within the last 24 hours or if last_bonus is null
  //   if (!lastBonus || now - lastBonus > 24 * 60 * 60 * 1000) {
  //     this.setState({ showBonusModal: true });
  //   }
  // }

  isTutorialCompleted = (tutorialId) => {
    // Check if the current tutorial is in the completedTutorials array
    return this.props.completedTutorials.includes(tutorialId);
  };
  playCoinsAnimation() {
    this.setState({ isCoinsAnimation: true });
  }

  handleMouseMove = (event) => {
    const { clientX } = event; // Get cursor's x position
    const { innerWidth } = window; // Get the window's width

    // Map cursor position to blur value (adjust min/max values as necessary)
    const blurValue = Math.max(0, Math.min(10, 10 * (1 - clientX / (innerWidth - 290))));

    this.setState({ blurValue });
  };

  async fetchTokenDetails() {
    try {
      const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${token}`);
      const priceData = response.data.pairs?.[0];  // Extract token pair details

      if (priceData) {
        // Update the state with the conversion rate (price in USD)
        this.setState({
          conversionRate: priceData.priceUsd,  // This is the price of the token in USD
        });
      } else {
        console.error("No pair data available for this token.");
      }
    } catch (error) {
      console.error("Error fetching token details:", error);
    }
  }

  stopCoinsAnimationAfterDelay() {
    setTimeout(() => {
      this.setState({ isCoinsAnimation: false });
    }, 1500);
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
      utterance.rate = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }

  handleCountdownHover = () => {
    this.setState({
      countdownWidth: '60%', // Increase width of countdown side
      youtubeWidth: '40%', // Decrease width of youtube side
      youtubeOpacity: 0.7, // Reduce opacity of youtube side
    });
  };

  changeBackgroundGif = () => {
    // Randomly select a GIF from the array
    const randomIndex = Math.floor(Math.random() * this.gifs.length);
    this.setState({ currentGif: this.gifs[randomIndex] });
  };
  handleCountdownButtonClick = () => {
    this.changeBackgroundGif(); // Change the background GIF
    setTimeout(() => {
      history.push('/investors');
      this.closeTokenModal();
    }, 1000);
  };

  // Handle click for youtube button
  handleYoutubeButtonClick = () => {
    this.changeBackgroundGif(); // Change the background GIF
    setTimeout(() => {
      this.handleOpenLoginModal();
      this.closeTokenModal();
    }, 1000); // Redirect after 1 second
    history.push('/');
  };

  handleCountdownLeave = () => {
    this.setState({
      countdownWidth: '50%', // Reset width of countdown side
      youtubeWidth: '50%', // Reset width of youtube side
      youtubeOpacity: 1, // Reset opacity of youtube side
    });
  };

  handleYoutubeHover = () => {
    this.setState({
      youtubeWidth: '60%', // Increase width of youtube side
      countdownWidth: '40%', // Decrease width of countdown side
      countdownOpacity: 0.7, // Reduce opacity of countdown side
    });
  };

  handleYoutubeLeave = () => {
    this.setState({
      youtubeWidth: '50%', // Reset width of youtube side
      countdownWidth: '50%', // Reset width of countdown side
      countdownOpacity: 1, // Reset opacity of countdown side
    });
  };



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
    try {
      const delay = 3000;
      await new Promise(resolve => setTimeout(resolve, delay));
      let socket = socketIOClient(this.state.endpoint);

      socket.on('CONNECTED', async data => {
        socket.emit('STORE_CLIENT_USER_ID', { user_id: this.props.user._id });
        socket.emit('FETCH_GLOBAL_CHAT');
      });

      socket.on('UPDATED_ROOM_LIST', async data => {
        await this.props.setRoomList(data);
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
      socket.on(`RECEIVED_LOAN_OFFER_${this.props.user._id}`, ({ lender, avatar, accessory, username, totalWagered }) => {
        this.props.openOfferLoanModal();
        if (!this.props.isMuted) {
          this.needALoan.play();
        }
        this.props.setCurrentOfferTargetInfo({
          _id: this.props.user._id,
          lender,
          avatar,
          accessory,
          username,
          totalWagered
        });
      });

      socket.on('SEND_CHAT', data => {
        try {
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

      socket.on('SEND_NOTIFICATION', data => {
        if (!this.props.isMuted || !this.props.notificationSounds) {
          this.notificationSound.play();
        }

        const currentNotifications = this.state.notifications || [];
        currentNotifications.unshift(data);
        this.setState({
          notifications: currentNotifications
        });

        // Check if the new notification message contains "Deposit"
        const message = data.message; // Assuming 'data' has a 'message' property

        // First condition: check if the message contains the word "Deposit"
        if (message.includes("Deposit")) {
          this.props.getUser(true, 5);
        }

        if (this.props.isNotificationsAllowed && window.Notification) {
          const options = {
            body: data,
            silent: false
          };

          if (Notification.permission === 'granted') {
            new Notification('New Notification', options);
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                this.props.setNotificationsAllowed(true);
                new Notification('New Notification', options);
              }
            });
          }
        }
      });


      socket.on('SET_UNREAD_MESSAGE_COUNT', data => {
        this.props.setUnreadMessageCount(data);
      });

      socket.on('ONLINE_STATUS_UPDATED', data => {
        this.props.updateOnlineUserList(data.user_list);
        // if (this.props.isAuthenticated && !this.state.bonusCheck) {
        //   this.setState({ bonusCheck: true }, () => {
        //     this.checkBonusTime();
        //   });
        // }
      });


      socket.on('GLOBAL_CHAT_RECEIVED', data => {
        this.props.globalChatReceived(data);
      });

      socket.on('SET_GLOBAL_CHAT', this.props.setGlobalChat);
      this.props.setSocket(socket);

      this.socket = socket;

    } catch (error) {
      console.error('Socket initialization failed:', error);
      setTimeout(() => {
        this.initSocket();
      }, 3000);
    }

  }

  loadSolanaWallet = async () => {
    try {
      if (window.solana && window.solana.isPhantom) {
        await window.solana.connect();
        const walletAddress = window.solana.publicKey.toString();
        const response = await axios.get('/stripe/get_provider_url');
        const providerUrl = response.data.providerUrl;

        const solanaConnection = new Connection(providerUrl, 'confirmed');
        const solBalance = await solanaConnection.getBalance(new PublicKey(walletAddress));
        const tokenAccounts = await solanaConnection.getParsedTokenAccountsByOwner(
          new PublicKey(walletAddress),
          { programId: TOKEN_PROGRAM_ID }
        );

        tokenAccounts.value.forEach(tokenAccountInfo => {
          const { mint, tokenAmount } = tokenAccountInfo.account.data.parsed.info;
        });

        const specificTokenAccount = tokenAccounts.value.find(
          tokenAccount => tokenAccount.account.data.parsed.info.mint === token.toString()
        );

        let tokenBalance = 0;
        if (specificTokenAccount) {
          tokenBalance = specificTokenAccount.account.data.parsed.info.tokenAmount.uiAmount;
        }

        // Set account as an object containing publicKey
        this.setState({
          walletAddress,
          account: { publicKey: new PublicKey(walletAddress) }, // Updated line
          solanaBalance: solBalance / LAMPORTS_PER_SOL,
          tokenBalance: tokenBalance || 0
        });
      }
    } catch (error) {
      console.error('Failed to connect to Solana wallet or fetch token balance:', error);
    }
  };

  async componentDidMount() {
    try {
      const initialBalance = await this.props.fetchVaultBalance();
      this.setState({ websiteLoading: true, isInvestorsPage: location.pathname.startsWith('/investors'), isPlayer: location.pathname.startsWith('/play') });
      const currentUrl = window.location.pathname;
      window.addEventListener('mousemove', this.handleMouseMove);
      await Promise.all([
        this.props.getNotifications(),
        this.props.getUser(),
        this.initSocket(),
        this.props.acCalculateRemainingLoans(),
        this.initializeAudio(),
        this.fetchData(),
        this.fetchTokenDetails(),

      ]);

      this.setState({ websiteLoading: false, notifications: this.props.notifications, vaultBal: initialBalance });
      if (currentUrl && currentUrl.includes('create')) {
        this.setState({ selectedMainTabIndex: this.props.selectMainTab(1) });
      }

      setInterval(() => this.fetchData(), 2000);
      this.interval = setInterval(this.updateReminderTime, 3000);

      this.loadSolanaWallet();
      this.fetchInitialData();

      if (this.state.isPlayer) {
        this.closeTokenModal();
      }

    } catch (error) {
      console.error(error);
    }

    this.props.getWithdrawals();
    this.props.getWins();
  }
  async fetchInitialData() {
    const { getWins, getWithdrawals } = this.props;
    const promises = [getWins(), getWithdrawals()];
    await Promise.all(promises);
  }

  async initializeWebsiteData() {
    const { getNotifications, getUser, acCalculateRemainingLoans, fetchData, fetchTokenDetails } = this.props;
    await Promise.all([
      getNotifications(),
      getUser(),
      this.initSocket(),
      acCalculateRemainingLoans(),
      this.initializeAudio(),
      fetchData(),
      fetchTokenDetails()
    ]);
  }

  handleCreatePage() {
    const currentUrl = window.location.pathname;
    if (currentUrl.includes('create')) {
      this.setState({ selectedMainTabIndex: this.props.selectMainTab(1) });
    }
  }

  setIntervals() {
    setInterval(() => this.fetchData(), 2000);
    this.interval = setInterval(this.updateReminderTime, 3000);
  }


  fetchHistory = async () => {
    try {
      await this.props.getHistory();
    } catch (error) {
      console.error("An error occurred during getHistory:", error);
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
      this.notificationSound = new Audio('/sounds/notification.mp3');
      this.needALoan = new Audio('/sounds/need_a_loan.mp3');
      this.needALoan.load();
      this.notificationSound.load();
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
    });
  }

  componentWillUnmount() {
    const { socket } = this.props;
    if (socket) {
      socket.disconnect();
    }
    clearInterval(this.interval);
    clearInterval(this.timer);
    clearInterval(this.historyInterval);
    window.removeEventListener('mousemove', this.handleMouseMove);

  }

  handleLogout = clear_token => {
    this.setState({
      walletAddress: null,
      solanaBalance: null,
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
  handleBonusModal = () => {
    this.setState({ showBonusModal: true });
  };
  handleCloseSettingsModal = () => {
    this.setState({ showSettingsModal: false });
  };
  handleCloseBonusModal = () => {
    this.setState({ showBonusModal: false });
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
  handleOpenVaultModal = () => {
    this.setState({ showVaultModal: true, anchorEl: null });
  };
  handleCloseVaultModal = () => {
    this.setState({ showVaultModal: false });
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

  handleNotificationsClick = async () => {
    this.setState({ showNotifications: !this.state.showNotifications });
  };

  handleSearchClose = event => {
    this.setState({ searchAnchorEl: null });
  };

  onSearchQueryChange = event => {
    const searchQuery = event;
    this.setState({ searchQuery }, () => {
      this.props.getUser(
        false,
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
          this.state.loadMore,
          event,
          this.state.sortType,
          this.state.searchQuery
        );
      }
    );
  };

  closeTokenModal = event => {
    this.setState(
      { tokenModalOpen: false }
    );
  };

  handleSortClick = event => {
    this.setState({ sortAnchorEl: event.currentTarget });
  };

  handleSortClose = event => {
    this.setState({ sortType: event, sortAnchorEl: null }, () => {
      this.props.getUser(
        false,
        this.state.loadMore,
        this.state.filterType,
        event,
        this.state.searchQuery
      );
    });
  };

  handleLoadMore = async () => {
    const { loadMore, filterType, sortType, searchQuery } = this.state;
    const nextLoadMore = loadMore >= 10 ? loadMore + 10 : 10;
    if (!this.props.tnxComplete) {
      await this.props.getUser(
        false,
        nextLoadMore,
        filterType,
        sortType,
        searchQuery
      );
    }

    this.setState({
      loadMore: nextLoadMore
    });
  };

  toggleAllTransactions = () => {
    const param1 = this.state.showAllGameLogs ? 15 : 5;

    this.props.getUser(
      param1,
      null,
      this.state.filterType,
      this.state.sortType,
      this.state.searchQuery
    );

    this.setState(prevState => ({
      showAllGameLogs: !prevState.showAllGameLogs,
      loadMore: 0
    }), () => {
      if (this.state.showAllGameLogs) {
        this.props.getProfitData();
      }
    });
  };

  handleDollarEnter = () => {
    this.setState({ isHovered: true });
  };

  handleDollarLeave = () => {
    this.setState({ isHovered: false });
  };

  disconnectWeb3 = async () => {
    this.setState({
      walletAddress: null,
      solanaBalance: null
    });
  };

  handleDashboard = () => {
    history.push('/dashboard');
    this.setState({
      selectedMainTabIndex: 1, // Adjust this index to the appropriate one for "Dashboard"
    });
  };


  handleJoyrideCallback = (data) => {
    const { status, type } = data;

    if (status === 'finished' || status === 'skipped') {
      const { currentTutorial } = this.state;
      // Mark the current tutorial as completed in the backend
      this.props.updateTutorialCompleted(currentTutorial);

      // Stop the Joyride after completion
      this.setState({ run: false });
    }
  };

  render() {
    const {
      series,
      sortAnchorEl,
      filterAnchorEl,
      searchAnchorEl,
      hoverTabIndex,
      websiteLoading,
      currentGif,
      balance,
      searchQuery,
      sortType,
      filterType,
      isHovered,
      web3,
      oldBalance,
      tokenBalance,
      account,
      walletAddress, solanaBalance,
      transactions,
      blurValue,
      conversionRate,
      userName,
      showInventoryModal,
      showVaultModal,
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
      showBonusModal,
      isLive,
      notifications,
      tokenModalOpen,
      isInvestorsPage,
      countdownWidth, youtubeWidth, countdownOpacity, youtubeOpacity
    } = this.state;
    const {
      isMuted,
      tnxComplete,
      isDarkMode,
      selectedMainTabIndex,
      isAuthenticated,
      children,
      showOfferLoanModal,
      user,
      showCookieConsent,
      isLowGraphics,
      tokenPrice
    } = this.props;
    const balanceString = balance.toString();
    const decimalIndex = balanceString.indexOf('.');
    const numDecimals = decimalIndex !== -1 ? Math.min(2, balanceString.length - decimalIndex - 1) : 0;
    const width = window.innerWidth;
    const notificationsArray = updateFromNow(Object.values(notifications));
    const halloween = new Date(`${new Date().getFullYear()}-10-29T00:00:00`);
    const currentDate = new Date();
    const timeRemaining = halloween - currentDate;
    const unreadNotificationsCount = notifications.filter(notification => !notification.is_read).length;

    this.secondsRemaining = Math.floor(timeRemaining / 1000);
    return (
      <MuiThemeProvider theme={isDarkMode ? darkTheme : mainTheme}>
        {showCookieConsent && <CookieConsent />}

        {(width >= 600 && isLive && tokenModalOpen && !isAuthenticated) && (
          <div
            className="coming-home-screen"
            style={{
              position: 'fixed',
              width: '100%',
              height: '100%',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              padding: '50px',
              zIndex: '999',
              backdropFilter: `blur(${blurValue}px)`,
              background: `url(${currentGif})`,
              backgroundSize: '100vw',
              backgroundPosition: 'center',
            }}
          >
            <img className="desktop-only" style={{ maxWidth: "150px", marginBottom: '60px' }} src="../img/dark-game-logo.svg" />

            <p style={{ textTransform: 'uppercase', color: "#fff" }}>GET RICH 💰 OR DIE 🩸 😼</p>
            <div className="countdown" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5em', height: '400px', overflow: 'hidden' }}>
              <div
                className="countdown-side"
                style={{
                  width: countdownWidth, // Dynamic width based on state
                  padding: '30px',
                  display: 'flex',
                  position: 'relative',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexDirection: 'column',
                  height: '400px',
                  opacity: countdownOpacity, // Set dynamic opacity
                  transition: 'width 0.5s ease, opacity 0.5s ease', // Smooth transition for width and opacity
                  boxSizing: 'border-box',
                }}
                onMouseEnter={this.handleCountdownHover} // Handle hover state
                onMouseLeave={this.handleCountdownLeave}
              >
                <div >
                  <iframe
                    width="400"
                    height="215"
                    src="https://www.youtube.com/embed/4jb0Oq8zrXc"
                    title="YouTube video player"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                    style={{ borderRadius: "10px", border: "3px solid rgb(98 3 172)" }}
                  ></iframe>
                </div>
                <Countdown
                  date={halloween}
                  renderer={({ days, hours, minutes, seconds, completed }) => (
                    <div style={{ zIndex: '1', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <h4 style={{ transform: 'rotate(-20deg) translateX(-200px)', position: 'absolute', top: '5px', color: '#f9f9f9', background: '#ff0000', padding: '5px 10px' }}>$RPS 🚀🚀🚀</h4>
                      {!completed ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ fontSize: '2.2em', fontWeight: 'bold', marginBottom: '5px' }}>{days}</div>
                          <div style={{ fontSize: '0.5em', color: '#666' }}>days</div>
                        </div>
                      ) : (
                        null
                        // <div style={{ fontSize: '2em', color: '#e91e63', fontWeight: 'bold' }}>Countdown completed!</div>
                      )}

                      {!completed ? (
                        <div style={{ margin: '0 20px', fontSize: '2em', fontWeight: 'bold' }}>:</div>
                      ) : null}

                      {!completed ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ fontSize: '2.2em', fontWeight: 'bold', marginBottom: '5px' }}>{hours}</div>
                          <div style={{ fontSize: '0.5em', color: '#666' }}>hours</div>
                        </div>
                      ) : null}

                      {!completed ? (
                        <div className="desktop-only" style={{ margin: '0 20px', fontSize: '2em', fontWeight: 'bold' }}>:</div>
                      ) : null}

                      {!completed ? (
                        <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ fontSize: '2.2em', fontWeight: 'bold', marginBottom: '5px' }}>{minutes}</div>
                          <div style={{ fontSize: '0.5em', color: '#666' }}>minutes</div>
                        </div>
                      ) : null}

                      {!completed ? (
                        <div className="desktop-only" style={{ margin: '0 20px', fontSize: '2em', fontWeight: 'bold' }}>:</div>
                      ) : null}

                      {!completed ? (
                        <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ fontSize: '2.2em', fontWeight: 'bold', marginBottom: '5px' }}>{seconds}</div>
                          <div style={{ fontSize: '0.5em', color: '#666' }}>seconds</div>
                        </div>
                      ) : null}
                    </div>
                  )}
                />
                <Button
                  style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    backgroundColor: 'rgb(98 3 172)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                  onClick={this.handleCountdownButtonClick}
                >
                  Investor Portal
                </Button>
              </div>
              <div
                className="youtube-side"
                style={{
                  width: youtubeWidth, // Dynamic width based on state
                  padding: '30px',
                  height: '400px',
                  opacity: youtubeOpacity, // Set dynamic opacity
                  transition: 'width 0.5s ease, opacity 0.5s ease', // Smooth transition for width and opacity
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={this.handleYoutubeHover} // Handle hover state
                onMouseLeave={this.handleYoutubeLeave}
              >
                {/* <h5 style={{ color: '#fff', marginBottom: '10px' }}>WATCH TRAILER & USER GUIDE</h5>
                <hr style={{ borderColor: '#fff' }} /> */}
                <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>

                  <img style={{ width: "400px", border: "3px solid rgb(98 3 172)", borderRadius: "12px" }} src="../img/giant-login-2.svg" />
                </div>

                <Button
                  style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    backgroundColor: 'rgb(98 3 172)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                  onClick={this.handleYoutubeButtonClick}
                >
                  Game Portal
                </Button>
              </div>
            </div>
            {/* <Footer className="footer"
                open={this.props.isDrawerOpen}
                style={{ marginLeft: '0' }}
              /> */}
          </div>
        )}
        <div className={`site_wrapper row ${isDarkMode ? 'dark_mode' : ''}`}>
          {/* {websiteLoading && (
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
          )} */}
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
              {!isInvestorsPage ? (
                <div className='desktop-only' style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "30%", marginTop: "10px" }}>
                  {/* TOP PLAYS Carousel */}
                  <div style={{ flex: "1", maxWidth: "50%", paddingRight: "10px" }}>
                  <span className='roll-tag' style={{position: "absolute", top: "5px"}}>Wins</span>
                    <div className="top-wins">
                      {this.props.topWins?.map((row, index) => (
                        <div
                          key={`table-cell-${index}-${row.room}`}
                          className="table-cell"
                          onClick={() => (window.location.href = `/join/${row.room}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div key={`carousel-content-${index}-${row.room}`} className="carousel-content table-row slide-in">
                            <div style={{ display: 'flex', flexDirection: 'row' }}>
                              <a
                                href="#"
                                className="player"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  this.handleOpenPlayerModal(row.joined_user._id);
                                }}
                                style={{ marginRight: '-15px' }}
                              >
                                <Avatar
                                  className="avatar"
                                  src={row.joined_user?.avatar || 'default-avatar-url'}
                                  accessory={row.joined_user?.accessory || 'default-accessory'}
                                  username={row.joined_user?.username || 'Unknown'}
                                  rank={row.joined_user?.totalWagered || 0}
                                  alt=""
                                  darkMode={this.props.isDarkMode}
                                />
                              </a>
                            </div>

                            <div className="cell" style={{ lineHeight: '0.5em', marginBottom: '5px', textAlign: 'right', padding: "5px 5px 15px 5px" }}>
                              <span style={{ whiteSpace: 'nowrap' }}>+{convertToCurrency(row.winnings)}</span>
                              <br />
                              <span style={{ whiteSpace: 'nowrap', fontSize: 'xx-small' }}>
                                {(() => {
                                  if (!tokenPrice) return convertToCurrency(row.winnings);
                                  return (
                                    <>
                                      {(row.winnings / row.bet_amount).toFixed(2)}x / $
                                      {(row.winnings * tokenPrice).toFixed(2)}
                                    </>
                                  );
                                })()}
                              </span>
                            </div>

                            <div
                              className="cell"
                              style={{
                                whiteSpace: 'nowrap',
                                fontSize: 'xx-small',
                                position: 'absolute',
                                right: '5px',
                                bottom: '0px',
                              }}
                            >
                              <span
                                style={{
                                  color: 'unset',
                                  whiteSpace: 'nowrap',
                                  fontSize: 'xx-small',
                                  marginRight: '-5px',
                                  paddingBottom: '10px',
                                  paddingTop: '5px',
                                }}
                              >
                                {formatTimeAgo(row.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* TOP WITHDRAWALS Carousel */}
                  <div style={{ flex: "1", maxWidth: "50%", paddingLeft: "10px" }}>
                    <span className='roll-tag'  style={{position: "absolute", top: "5px"}}>WDS</span>
                    <div className="top-wins" style={{ marginBottom: "20px" }}>
                      {this.props.topWithdrawals?.map((row, index) => (
                        <div
                          key={`table-cell-${index}-${row.room}`}
                          className="table-cell"
                          onClick={() => (window.location.href = `/join/${row.room}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div key={`carousel-content-${index}-${row.room}`} className="carousel-content table-row slide-in">
                            <div style={{ display: 'flex', flexDirection: 'row' }}>
                              <a
                                href="#"
                                className="player"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  this.handleOpenPlayerModal(row.user_id._id);
                                }}
                                style={{ marginRight: '-15px' }}
                              >
                                <Avatar
                                  className="avatar"
                                  src={row.user_id.avatar}
                                  accessory={row.user_id.accessory}
                                  username={row.user_id.username}
                                  rank={row.user_id.totalWagered}
                                  alt=""
                                  darkMode={this.props.isDarkMode}
                                />
                              </a>
                            </div>

                            <div className="cell" style={{ lineHeight: '0.5em', marginBottom: '5px', textAlign: 'right', padding: "5px 5px 15px 5px" }}>
                              <span style={{ color: '#00ff3a', whiteSpace: 'nowrap' }}>+{convertToCurrency(row.amount)}</span>
                              <br />
                              <span
                                style={{
                                  color: '#00ff3a',
                                  whiteSpace: 'nowrap',
                                  fontSize: 'xx-small',
                                }}
                              >
                                ${((row.amount * tokenPrice) || 0).toFixed(2)}
                              </span>
                            </div>

                            <div
                              className="cell"
                              style={{
                                whiteSpace: 'nowrap',
                                fontSize: 'xx-small',
                                position: 'absolute',
                                right: '5px',
                                bottom: '0px',
                              }}
                            >
                              <span
                                style={{
                                  color: 'unset',
                                  whiteSpace: 'nowrap',
                                  fontSize: 'xx-small',
                                  marginRight: '-5px',
                                  paddingBottom: '10px',
                                  paddingTop: '5px',
                                }}
                              >
                                {formatTimeAgo(row.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                // <Tabs
                //   value={selectedMainTabIndex}
                //   onChange={this.handleMainTabChange}
                //   TabIndicatorProps={{
                //     style: {
                //       display: 'none', // Hide the bottom border (indicator)
                //     },
                //   }}
                //   className="main-game-page-tabs desktop-only"
                // >
                //   <Tab
                //     className={`custom-tab ${hoverTabIndex === 0 || selectedMainTabIndex === 0
                //       ? 'fade-animation fade-in'
                //       : 'fade-animation fade-out'
                //       }`}
                //     label="ALL GAMES"
                //     labelplacement="left"
                //     icon={
                //       hoverTabIndex === 0 || selectedMainTabIndex === 0 ? (
                //         <BattleHover />
                //       ) : (
                //         <Battle />
                //       )
                //     }
                //     style={customStyles.tabRoot}
                //     sx={{
                //       borderBottom: 'none', // Removes the bottom border
                //     }}
                //     onMouseEnter={() => this.handleMouseEnter(0)}
                //     onMouseLeave={this.handleMouseLeave}
                //   />

                //   <Tab
                //     className={`custom-tab ${hoverTabIndex === 1 || selectedMainTabIndex === 1
                //       ? 'fade-animation fade-in'
                //       : 'fade-animation fade-out'
                //       }`}
                //     label="Your Games"
                //     labelplacement="left"
                //     icon={
                //       hoverTabIndex === 1 || selectedMainTabIndex === 1 ? (
                //         <ManageHover />
                //       ) : (
                //         <Manage />
                //       )
                //     }
                //     style={customStyles.tabRoot}
                //     onMouseEnter={() => this.handleMouseEnter(1)}
                //     onMouseLeave={this.handleMouseLeave}
                //   />
                // </Tabs>
              ) : (
                <div style={{ padding: width < 600 ? "0" : "48px" }}>
                </div>
              )}
              <div className="header_action_panel">
                {!isInvestorsPage && (
                  <>
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
                      {unreadNotificationsCount > 0 && (
                        <span className="unread_message_badge notifications">
                          {unreadNotificationsCount > 10 ? '9+' : unreadNotificationsCount}
                        </span>
                      )}

                      {hoverTabIndex === 3 ? (
                        <NotificationsHover width="18pt" />
                      ) : (
                        <Notifications />
                      )}
                    </a>
                  </>

                )}
                {isAuthenticated ? (
                  <>
                    <div id="balance" className='title'>


                      <div style={{ display: "inline" }}
                        onMouseEnter={this.handleDollarEnter}
                        onMouseLeave={this.handleDollarLeave}
                      >
                        {isHovered ? (
                          // When hovered, show the balance in USD by multiplying with the conversionRate (token price in USD)
                          `$${(balance * conversionRate).toFixed(numDecimals)}`
                        ) : (
                          <>
                            <InlineSVG
                              id="busd"
                              src={busdSvg}
                            />
                            <CountUp
                              start={oldBalance}
                              end={balance}
                              separator=","
                              decimal="."
                              decimals={numDecimals}
                              duration={40.5}
                              redraw={true}
                              preserveValue={true}
                              onEnd={() => {
                                this.setState({ oldBalance: balance });
                              }}
                            />
                          </>
                        )}
                      </div>

                      {(isCoinsAnimation && !isLowGraphics) &&
                        <Lottie
                          options={{
                            loop: isLowGraphics ? false : true,
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
                        username={user.username}
                        className="avatar"
                        darkMode={isDarkMode}
                      />
                      <ArrowDropDown />
                    </Button>
                    <Menu
                      id="profile-menu"
                      anchorEl={anchorEl}
                      getContentAnchorEl={null}
                      open={Boolean(anchorEl)}
                      onClose={this.handleCloseMenu}
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
                          border: "none",
                          filter: isDarkMode ? "unset" : "hue-rotate(25deg)",
                          background: isDarkMode ? 'linear-gradient(45deg, #7300c8, #620096)' : 'linear-gradient(45deg, #e300ea, #a700ff)'
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

                      <Divider />
                      <MenuItem className="desktop-only" onClick={this.handleDashboard}>
                        <ListItemText>DASHBOARD</ListItemText> {/* You can also add an icon here */}
                      </MenuItem>
                      <MenuItem onClick={this.handleOpenSettingsModal}>
                        <ListItemIcon>
                          <Settings />
                        </ListItemIcon>
                        <ListItemText>SETTINGS</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={this.handleBonusModal}>
                        <ListItemIcon>
                          <Star />
                        </ListItemIcon>
                        <ListItemText>CORN WHEEL</ListItemText>
                        <ListItemIcon>
                          <img style={{ transform: "translate(-93px, 4px)", width: "20px", zIndex: 0 }} src="../img/icons/corn.svg" />
                        </ListItemIcon>
                      </MenuItem>

                      <MenuItem onClick={this.handleOpenHowToPlayModal}>
                        <ListItemIcon>
                          <Help />
                        </ListItemIcon>
                        <ListItemText>INFO</ListItemText>
                      </MenuItem>
                      <Divider />
                      <MenuItem
                        onClick={() => {
                          // Use history.push if using react-router, or window.location.href for a direct navigation
                          // window.location.href = '/investors'; // Direct navigation
                          // Alternatively, use this if you're using react-router's history object:
                          history.push('/investors');
                        }}
                      >
                        <ListItemIcon>
                          <MonetizationOn size="small" />
                        </ListItemIcon>
                        <ListItemText>$RPS 🚀🚀🚀</ListItemText>
                      </MenuItem>
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
                {<h2 className='title'>NOTIFICATIONS</h2>}
                {
                  <div className="notification-element">
                    {notificationsArray.length > 0 ? (
                      notificationsArray.map((notification, index) => (

                        <div className={`notification-container ${notification.is_read ? 'read' : ''}`} key={index}>
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
                              username={notification.username}
                              className="avatar"
                            />
                          </a>
                          <a href={`/join/${notification.room}/`} style={{ width: "100%" }}>

                            {!notification.is_read && <div className="red-dot" />}
                            <div className="notification" style={{ width: "70%", display: 'inline-block' }}>
                              <p
                                dangerouslySetInnerHTML={{
                                  __html: notification.message
                                }}
                              />
                              <p className="fromNow">{notification.from_now}</p>
                            </div>
                          </a>
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
                oneDayProfit={this.props.oneDayProfit}
                sevenDayProfit={this.props.sevenDayProfit}
                allTimeProfit={this.props.allTimeProfit}
              />
            )}

            <div
              id="game_logs"
              className={this.state.showGameLog ? '' : 'hidden'}
              onClick={this.handleBalanceClick}
            >
              <div className="arrow-up"></div>
              <div className="header_panel_contents">
                {
                  <Tooltip
                    style={{ position: "absolute", right: "20px" }}
                    title={
                      <>
                        <h6 style={{ marginBottom: "0.5rem" }}>WHY DO MY WINNINGS APPEAR LESS?</h6>
                        <p style={{ marginBottom: "0.5rem" }}>
                          You see less as this is net profit (
                          <span style={{ fontWeight: "bold", color: "#28a745" }}>winning amount</span> -
                          <span style={{ fontWeight: "bold", color: "#ff0000" }}> bet amount</span>)
                          and receive less due to:
                        </p>
                        <ul style={{ paddingLeft: "1rem", marginBottom: "0.5rem" }}>
                          <li>RTB fees awarded to the Host (0% - 15% returned to bankroll dependent on their accessory)</li>
                          <li>1% towards platform fees</li>
                        </ul>
                        <p style={{ marginBottom: "0.5rem" }}>
                          For example, if you win <strong>{convertToCurrency(0.2)}</strong> but bet <strong>{convertToCurrency(0.1)}</strong>,
                          then you might see:
                        </p>
                        <p style={{ marginBottom: "0.5rem" }}>
                          <strong>{convertToCurrency(0.2)} * 0.88 </strong>
                          (12% RTB) - <strong>{convertToCurrency(0.1)}</strong> (net profit)
                          = <strong>{convertToCurrency(0.076)}</strong> (final calculation).
                        </p>
                      </>
                    }
                    placement="top"
                  >
                    <Info style={{ cursor: "pointer", float: "right" }} />
                  </Tooltip>
                }


                <h2 className='title'>BALANCE HISTORY</h2>

                {
                  <div>
                    <table id="balance-history">
                      <tbody>
                        {transactions.length === 0 ? (
                          <tr>
                            <td>...</td>
                          </tr>
                        ) : (
                          transactions.slice(0, 5).map((row, key) => (
                            <tr key={key}>
                              {row.hash && row.hash.length !== 10 ? (
                                <>
                                  {row.status !== "processing" ? (
                                    <a href={`https://explorer.solana.com/tx/${row.hash}?cluster=mainnet`} rel="noopener noreferrer" target="_blank">
                                      <td className={`amount ${row.status === "waiting" || row.status === "pending" || row.status === "processing" ? 'grey' : (row.amount > 0 ? 'green' : 'red')}`}>
                                        {row.amount > 0 ? (
                                          <>
                                            {'+ '}
                                            {convertToCurrency(row.amount, true)}
                                          </>
                                        ) : (
                                          <>
                                            {'- '}
                                            {convertToCurrency(Math.abs(row.amount), true)}
                                          </>
                                        )}
                                      </td>
                                      <td className="fromNow">{row.from_now}</td>
                                    </a>
                                  ) : (
                                    <>
                                      <td className={`amount grey`} >
                                        {row.amount > 0 ? (
                                          <>
                                            {'+ '}
                                            {convertToCurrency(row.amount, true)}
                                          </>
                                        ) : (
                                          <>
                                            {'- '}
                                            {convertToCurrency(Math.abs(row.amount), true)}
                                          </>
                                        )}
                                      </td>
                                      <td className="fromNow">{row.from_now}</td>
                                    </>
                                  )}
                                </>

                              ) : (
                                <>
                                  <td className={`amount ${row.status === "waiting" || row.status === "pending" || row.status === "processing" || row.status === "in_process" ? 'grey' : (row.amount > 0 ? 'green' : 'red')}`}>
                                    {row.amount > 0 ? (
                                      <>
                                        {'+ '}
                                        {convertToCurrency(row.amount, true)}
                                      </>
                                    ) : (
                                      <>
                                        {'- '}
                                        {convertToCurrency(Math.abs(row.amount), true)}
                                      </>
                                    )}
                                  </td>
                                  <td className="fromNow">{row.from_now}</td>
                                </>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    <Button onClick={this.toggleAllTransactions}>ALL TRANSACTIONS</Button>
                  </div>
                }

                <div className="transaction-panel">
                  <Button
                    className="btn-inventory title"
                    // isDarkMode={isDarkMode}
                    onClick={this.handleOpenInventoryModal}
                  >
                    Inventory
                  </Button>
                  <Button
                    className="btn-vault title"
                    // isDarkMode={isDarkMode}
                    onClick={this.handleOpenVaultModal}
                  >
                    Vault&nbsp;
                    <span style={{ border: "2px solid", background: "#1284cc11", color: "#1284ff", padding: "2px 5px", marginLeft: "10px", borderRadius: "0.4em" }}>
                      {this.state.vaultBal ? convertToCurrency(this.state.vaultBal) : 0}
                    </span>
                  </Button>
                </div>
                <div className="transaction-panel">
                  {this.state.remainingLoans > 0 ? (
                    <Button
                      className="btn-withdraw debt title"
                      onClick={this.handleOpenDebtsModal}
                    // isDarkMode={isDarkMode}
                    >
                      <div>{convertToCurrency(this.state.remainingLoans)} IN DEBT</div>
                    </Button>
                  ) : (
                    <Button
                      className="btn-withdraw title"
                      onClick={this.handleOpenWithdrawModal}
                    // isDarkMode={isDarkMode}
                    >
                      Withdraw
                    </Button>
                  )}

                  <Button
                    className="btn-deposit title"
                    onClick={this.handleOpenDepositModal}
                  // isDarkMode={isDarkMode}
                  >
                    Deposit
                  </Button>
                  <hr />
                  {walletAddress ? (
                    <>
                      <input
                        id="wallet-address"
                        type="text"
                        value={walletAddress}
                        readOnly
                      />
                      <Button className="connect title" onClick={this.disconnectWeb3}>
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button className="connect title" onClick={this.loadSolanaWallet}>
                      CONNECT WALLET&nbsp;<FontAwesomeIcon icon={faExternalLinkAlt} />
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
          {showBonusModal && (
            <BonusModal
              modalIsOpen={showBonusModal}
              closeModal={this.handleCloseBonusModal}
              handleMute={this.handleMute}
              handleUnmute={this.handleUnmute}
              user={this.props.user}
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
              remainingLoans={this.state.remainingLoans}
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
              loadSolanaWallet={this.loadSolanaWallet}
              tokenBalance={tokenBalance}
              balance={solanaBalance}
              account={account}
            />
          )}
          {showInventoryModal && (
            <InventoryModal
              modalIsOpen={showInventoryModal}
              closeModal={this.handleCloseInventoryModal}
            />
          )}
          {showVaultModal && (
            <VaultModal
              vaultBal={this.state.vaultBal}
              modalIsOpen={showVaultModal}
              closeModal={this.handleCloseVaultModal}
              conversionRate={conversionRate}
            />
          )}
          {showWithdrawModal && (
            <WithdrawModal
              modalIsOpen={showWithdrawModal}
              closeModal={this.handleCloseWithdrawModal}
              balance={balance}
              web3={web3}
              account={walletAddress}
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
          <OfferLoanModal socket={this.props.socket} />
          <GamePasswordModal />
          <Joyride
            steps={tutorialStepsMain}
            run={this.state.run}
            callback={this.handleJoyrideCallback}
            continuous
            showProgress
            showSkipButton
            styles={{
              options: {
                zIndex: 10000,
                backgroundColor: isDarkMode ? 'rgb(81 48 98 / 60%)' : '#ccc9', // Tooltip background color
                primaryColor: '#ff0000', // Custom color for buttons and highlights
                arrowColor: isDarkMode ? 'rgb(81 48 98 / 60%)' : '#ccc9', // Arrow color
                textColor: isDarkMode ? '#f9f9f9' : '#333', // Text color inside the tooltip
                width: 300, // Tooltip width
                padding: 20, // Padding inside the tooltip
                borderRadius: 5, // Rounded corners for the tooltip
              },

              buttonClose: {
                borderRadius: '0.3em', /* Custom border radius */
                color: isDarkMode ? '#f9f9f9' : '#333',
              },
              buttonBack: {
                borderRadius: '0.3em',
                color: isDarkMode ? '#f9f9f9' : '#333',
              },
              buttonNext: {
                borderRadius: '0.3em',
                color: isDarkMode ? '#f9f9f9' : '#333',
              },
              buttonSkip: {
                borderRadius: '0.3em',
                color: isDarkMode ? '#f9f9f9' : '#333',
              },

            }}
          />
        </div>
        {/* </> */}
        {/* )} */}
      </MuiThemeProvider>
    );
  }
}

const mapStateToProps = state => ({
  topWins: state.logic.topWins,
  topWithdrawals: state.logic.topWithdrawals,
  tokenPrice: state.logic.tokenPrice,
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
  notificationSounds: state.auth.notificationSounds,
  isNotificationsAllowed: state.auth.isNotificationsAllowed,
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
  showCookieConsent: state.auth.showCookieConsent,

});

const mapDispatchToProps = {
  setSocket,
  userSignOut,
  setRoomList,
  getUser,
  addChatLog,
  getMyGames,
  getMyHistory,
  updateTutorialCompleted,
  getHistory,
  setUnreadMessageCount,
  addNewTransaction,
  getNotifications,
  readNotifications,
  updateOnlineUserList,
  setDarkMode,
  setNotificationsAllowed,
  selectMainTab,
  acCalculateRemainingLoans,
  globalChatReceived,
  setGlobalChat,
  updateBetResult,
  getProfitData,
  openOfferLoanModal,
  setCurrentOfferTargetInfo,
  fetchVaultBalance,
  getWins,
  getWithdrawals,
};

export default connect(mapStateToProps, mapDispatchToProps)(SiteWrapper);
