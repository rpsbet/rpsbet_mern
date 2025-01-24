import React, { Component } from 'react';
import {
  createTheme,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  Box,
  Chip,
  IconButton,
  Skeleton,
  ListItemText,
  Divider,
  Tooltip,
  Paper,
  Popover,
  Typography, Table, TableBody, TableCell, TableContainer, TableRow,
} from '@mui/material';
import CatsinoModalOverlay from '../game_panel/main_pages/CatsinoModalOverlay.jsx'
import { ThemeProvider } from '@mui/material/styles';
import Countdown from 'react-countdown';
import HistoryTable from '../game_panel/LiveGames/HistoryTable.jsx'
import axios from '../util/Api';
import SettingsModal from './modal/SettingsModal.jsx';
import BonusModal from './modal/BonusModal.jsx';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import CountUp from 'react-countup';
import Lottie from 'react-lottie';
import coins from './LottieAnimations/coins.json';
import { setBalance } from '../redux/Auth/user.actions.js'
import AllTransactionsModal from './modal/AllTransactionsModal.jsx';
import { debounce } from 'lodash';
import {
  AccountBalanceWallet,
  ArrowDropDown,
  ExitToApp,
  PersonOutline,
  Dashboard,
  MonetizationOn,
  Help,
  Settings,
  Star
} from '@mui/icons-material';
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
import DepositModal from './modal/DepositModal';
import WithdrawModal from './modal/WithdrawModal';
import InventoryModal from './modal/InventoryModal';
import VaultModal from './modal/VaultModal';
import { Info } from '@mui/icons-material';
import AccountBalanceOutlined from '@mui/icons-material/AccountBalanceOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import LeaderboardOutlined from '@mui/icons-material/LeaderboardOutlined';
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import Badge from '@mui/material/Badge';
import Joyride from 'react-joyride';
import { tutorialStepsMain } from '../util/tutorialStepsMain';

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
  getMyHistory,
  addNewTransaction,
  updateOnlineUserList,
  selectMainTab,
  globalChatReceived,
  setGlobalChat,
  updateBetResult,
  getNotifications,
  readNotifications,
  getWithdrawals,
  removeRoomFromList,
} from '../redux/Logic/logic.actions';
import CookieConsent from '../util/cookieConsent';
import { convertToCurrency } from '../util/conversion';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';
import SavingsOutlined from '@mui/icons-material/SavingsOutlined';
import AttachMoneyOutlined from '@mui/icons-material/AttachMoneyOutlined';
import MoneyOffCsredOutlined from '@mui/icons-material/MoneyOffCsredOutlined';

LoadingOverlay.propTypes = undefined;

const token = 'BBDULAQQBG1UYBK9ay7hSf1Arfhme4jnugxwzjbipump';


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
    const currentPath = window.location.pathname;
    this.gameLogsRef = React.createRef();
    this.state = {
      endpoint:
        process.env.NODE_ENV === 'production'
          ? 'https://rps.game'
          : `http://${window.location.hostname}:5001`,
      userName: this.props.userName,
      balance: this.props.balance,
      oldBalance: this.props.balance,
      hoverTabIndex: -1,
      anchorEl: null,
      anchorElProfile: null,
      anchorElGameLog: null,
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
      showWithdrawModal: false,
      showDepositModal: currentPath === '/deposit/' || currentPath === '/deposit',
      showInventoryModal: false,
      showVaultModal: false,
      notifications: [],
      loadMore: 10,
      isLive: false,
      blurValue: 3,
      isCountdownHovered: false,
      isYoutubeHovered: false,
      countdownWidth: '50%',
      youtubeWidth: '50%',
      countdownOpacity: 1,
      currentGif: '',
      youtubeOpacity: 1,
      tokenModalOpen: location.pathname.startsWith('/investors') ? false : true,
      showAllGameLogs: false,
      transactions: [],
      isHovered: false,
      websiteLoading: true,
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
      highlightedRooms: new Set(),
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
    this.handleNotificationsClick = this.handleNotificationsClick.bind(this);
    this.handleBalanceClick = this.handleBalanceClick.bind(this);
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
    const { transactions, tnxComplete, remainingLoans, betResult, notifications } = this.props;

    if (this.props.user !== prevProps.user) {
      this.setState({ run: !this.props.user.completedTutorials.includes(1), loaded: true })
      this.fetchData();

    }

    if (prevProps.betResult !== betResult && betResult === 'win') {
      if (!this.props.isLowGraphics) {
        this.playCoinsAnimation();
      }
    }

    const shouldUpdate =
      transactions &&
      transactions.length > 0 &&
      prevProps.transactions[0] &&
      prevProps.transactions[0] !== transactions[0] &&
      !tnxComplete;

    if (prevProps.remainingLoans !== remainingLoans) {
      this.setState({ remainingLoans: remainingLoans, loaded: true });
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
    const { clientX } = event;
    const { innerWidth } = window;
    const blurValue = Math.max(0, Math.min(10, 10 * (1 - clientX / (innerWidth - 290))));

    this.setState({ blurValue });
  };

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
      countdownWidth: '60%',
      youtubeWidth: '40%',
      youtubeOpacity: 0.7,
    });
  };

  changeBackgroundGif = () => {
    // Randomly select a GIF from the array
    const randomIndex = Math.floor(Math.random() * this.gifs.length);
    this.setState({ currentGif: this.gifs[randomIndex] });
  };
  handleCountdownButtonClick = () => {
    this.changeBackgroundGif();
    setTimeout(() => {
      history.push('/investors');
      this.closeTokenModal();
    }, 1000);
  };

  // Handle click for youtube button
  handleYoutubeButtonClick = () => {
    this.changeBackgroundGif();
    setTimeout(() => {
      this.handleOpenLoginModal();
      this.closeTokenModal();
    }, 1000);
    history.push('/');
  };

  handleCountdownLeave = () => {
    this.setState({
      countdownWidth: '50%',
      youtubeWidth: '50%',
      youtubeOpacity: 1,
    });
  };

  handleYoutubeHover = () => {
    this.setState({
      youtubeWidth: '60%',
      countdownWidth: '40%',
      countdownOpacity: 0.7,
    });
  };

  handleYoutubeLeave = () => {
    this.setState({
      youtubeWidth: '50%',
      countdownWidth: '50%',
      countdownOpacity: 1,
    });
  };

  handleOpenProfileMenu = e => {
    this.setState({ anchorElProfile: e.currentTarget });
  };

  handleCloseProfileMenu = () => {
    this.setState({ anchorElProfile: null });
  };

  updateReminderTime = debounce(() => {
    this.setState((prevState) => ({
      transactions: updateFromNow(prevState.transactions),
      notifications: updateFromNow(prevState.notifications),
    }));
  }, 300);

  async initSocket() {
    try {
      const delay = 3000;
      await new Promise(resolve => setTimeout(resolve, delay));
      let socket = socketIOClient(this.state.endpoint, { transports: ['websocket'] });
      socket.on('CONNECTED', async (data) => {
        socket.emit('STORE_CLIENT_USER_ID', { user_id: this.props.user._id });
        socket.emit('FETCH_GLOBAL_CHAT');
      });

      socket.on('UPDATED_ROOM_LIST', async data => {
        await this.props.setRoomList(data);
      });

      socket.on('ROOM_ENDED', data => {
        this.props.removeRoomFromList(data.roomId);
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
        if (data.amount && data.amount !== 0) {
          this.props.setBalance(this.props.balance + data.amount);
        }

        if (!this.props.isMuted || !this.props.notificationSounds) {
          this.notificationSound.play();
        }

        const currentNotifications = this.state.notifications || [];
        currentNotifications.unshift(data);
        this.setState({
          notifications: currentNotifications
        });

        const message = data.message;

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
      document.addEventListener('mousedown', this.handleClickOutside);
      await Promise.all([
        this.props.getNotifications(),
        this.props.getUser(),
        this.initSocket(),
        // this.props.acCalculateRemainingLoans(),
        this.initializeAudio(),
      ]);
      this.setState({ websiteLoading: false, transactions: this.props.transactions, notifications: this.props.notifications, vaultBal: initialBalance, loaded: true });
      if (currentUrl && currentUrl.includes('create')) {
        this.setState({ selectedMainTabIndex: this.props.selectMainTab(1) });
      }

      this.interval = setInterval(() => this.updateReminderTime(), 3000);

      this.loadSolanaWallet();

      if (this.state.isPlayer) {
        this.closeTokenModal();
      }
    } catch (error) {
      console.error(error);
    }
  }

  handleCreatePage() {
    const currentUrl = window.location.pathname;
    if (currentUrl.includes('create')) {
      this.setState({ selectedMainTabIndex: this.props.selectMainTab(1) });
    }
  }

  initializeAudio() {
    try {
      this.notificationSound = new Audio('/sounds/notification.mp3');
      this.needALoan = new Audio('/sounds/need_a_loan.mp3');
      this.needALoan.load();
      this.notificationSound.load();
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
      balance: this.state.balance,
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
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  handleLogout = clear_token => {
    this.setState({
      walletAddress: null,
      solanaBalance: null,
      anchorElProfile: null,
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

  handleBalanceClick = (event) => {
    this.setState({ anchorElGameLog: event.currentTarget });
  };

  handleNotificationsClick = (event) => {
    this.setState({ anchorElNotifications: event.currentTarget });
  };

  handleClickOutside = () => {
    const { anchorElProfile } = this.state;
    if (anchorElProfile) {
      this.setState({ anchorEl: null });
    }
  };

  handleCloseGameLog = () => {
    this.setState({
      anchorElGameLog: null,
    });
  };

  handleCloseNotifications = () => {
    this.props.readNotifications();
    const updatedNotifications = this.state.notifications.map(notification => ({
      ...notification,
      is_read: true
    }));
    this.setState({ anchorElNotifications: null, notifications: updatedNotifications });
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
      selectedMainTabIndex: 1,
    });
  };

  handleJoyrideCallback = (data) => {
    const { status, type } = data;

    if (status === 'finished' || status === 'skipped') {
      const { currentTutorial } = this.state;
      this.props.updateTutorialCompleted(currentTutorial);
      this.setState({ run: false });
    }
  };

  render() {
    const {
      sortAnchorEl,
      filterAnchorEl,
      searchAnchorEl,
      hoverTabIndex,
      currentGif,
      balance,
      searchQuery,
      sortType,
      filterType,
      isHovered,
      web3,
      vaultBal,
      tokenBalance,
      account,
      walletAddress, solanaBalance,
      transactions,
      blurValue,
      userName,
      showInventoryModal,
      showVaultModal,
      showProfileModal,
      showPlayerModal,
      selectedCreator,
      showWithdrawModal,
      showDepositModal,
      showLeaderboardsModal,
      showHowToPlayModal,
      showMarketplaceModal,
      showBankModal,
      showLoginModal,
      showSignupModal,
      showDebtsModal,
      remainingLoans,
      anchorElProfile,
      anchorElNotifications,
      anchorElGameLog,
      isCoinsAnimation,
      showSettingsModal,
      showBonusModal,
      isLive,
      notifications,
      tokenModalOpen,
      isInvestorsPage,
      showAllGameLogs,
      countdownWidth, youtubeWidth, countdownOpacity, youtubeOpacity
    } = this.state;
    const {
      isMuted,
      tnxComplete,
      isDarkMode,
      isAuthenticated,
      children,
      user,
      showCookieConsent,
      isLowGraphics,
      solPrice,
    } = this.props;
    const balanceString = balance.toString();
    const decimalIndex = balanceString.indexOf('.');
    const numDecimals = decimalIndex !== -1 ? Math.min(2, balanceString.length - decimalIndex - 1) : 0;
    const width = window.innerWidth;
    const notificationsArray = updateFromNow(Object.values(notifications));
    const halloween = new Date(`${new Date().getFullYear()}-02-14T00:00:00`);
    const currentDate = new Date();
    const timeRemaining = halloween - currentDate;
    const unreadNotificationsCount = notifications.filter(notification => !notification.is_read).length;

    this.secondsRemaining = Math.floor(timeRemaining / 1000);
    return (
      <ThemeProvider theme={isDarkMode ? darkTheme : mainTheme}>
        {showCookieConsent && <CookieConsent />}

        {(isLive && tokenModalOpen) && (
          <CatsinoModalOverlay
            currentGif={currentGif}
            blurValue={blurValue}
            halloween={halloween}
            handleCountdownButtonClick={this.handleCountdownButtonClick}
            handleYoutubeButtonClick={this.handleYoutubeButtonClick}
          />

        )}
        <div className={`site_wrapper ${isDarkMode ? 'dark_mode' : ''}`}>

          <div className="game_header">
            <div className="main_header">
              <a
                className="game_logo"
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/'; // Reloads the home page
                }}
              >
                <img
                  src='/img/game-logo.svg'
                  alt="Game Logo"
                  width="25"
                  height="25"
                />
              </a>
              {!isInvestorsPage ? (
                <div className='desktop-only' style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "10px" }}>
                  <HistoryTable userId={this.props.user._id} />
                </div>
              ) : (
                <div style={{ padding: width < 600 ? "0" : "48px" }}>
                </div>
              )}
              <div className="header_action_panel">
                {(this.props.user && this.state.oldBalance) ? (
                  <>
                    {/* Bank Icon */}
                    <Box
                      component="a"
                      href="#"
                      className="desktop-only"
                      onClick={e => {
                        e.preventDefault();
                        this.handleOpenBankModal();
                      }}
                      id="btn_bank"
                      onMouseEnter={() => this.handleMouseEnter(6)}
                      onMouseLeave={this.handleMouseLeave}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'color 0.3s ease',
                        '& svg': {
                          color: hoverTabIndex === 6 ? 'red' : 'inherit',
                          transition: 'color 0.3s ease',
                        },
                      }}
                    >
                      <AccountBalanceOutlined fontSize="medium" />
                    </Box>

                    {/* Store Icon */}
                    <Box
                      component="a"
                      href="#"
                      className="desktop-only"
                      onClick={e => {
                        e.preventDefault();
                        this.handleOpenMarketplaceModal();
                      }}
                      id="btn_marketplace"
                      onMouseEnter={() => this.handleMouseEnter(5)}
                      onMouseLeave={this.handleMouseLeave}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'color 0.3s ease',
                        '& svg': {
                          color: hoverTabIndex === 5 ? 'red' : 'inherit',
                          transition: 'color 0.3s ease',
                        },
                      }}
                    >
                      <StorefrontOutlinedIcon fontSize="medium" />
                    </Box>

                    {/* Leaderboard Icon */}
                    <Box
                      component="a"
                      href="#"
                      className="desktop-only"
                      onClick={e => {
                        e.preventDefault();
                        this.handleOpenLeaderboardsModal();
                      }}
                      id="btn_leaderboards"
                      onMouseEnter={() => this.handleMouseEnter(4)}
                      onMouseLeave={this.handleMouseLeave}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'color 0.3s ease',
                        '& svg': {
                          color: hoverTabIndex === 4 ? 'red' : 'inherit',
                          transition: 'color 0.3s ease',
                        },
                      }}
                    >
                      <LeaderboardOutlined fontSize="medium" />
                    </Box>

                    {/* Notifications Icon */}
                    <Box
                      component="a"
                      href="#"
                      className="desktop-only"
                      onClick={e => {
                        e.preventDefault();
                        this.handleNotificationsClick(e);
                      }}
                      id="btn_notifications"
                      onMouseEnter={() => this.handleMouseEnter(3)}
                      onMouseLeave={this.handleMouseLeave}
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'color 0.3s ease',
                        '& svg': {
                          color: hoverTabIndex === 3 ? 'red' : 'inherit',
                          transition: 'color 0.3s ease',
                        },
                      }}
                    >
                      <Badge
                        badgeContent={unreadNotificationsCount > 10 ? '9+' : unreadNotificationsCount}
                        color="error"
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '10px',
                            height: '16px',
                            minWidth: '16px',
                          },
                        }}
                      >
                        <NotificationsOutlined fontSize="medium" />
                      </Badge>
                    </Box>
                  </>
                ) : null}
                {this.state.loaded ? (
                  isAuthenticated ? (
                    <>
                      <div id="balance" className="title">
                        <div
                          style={{ display: "inline" }}
                          onMouseEnter={this.handleDollarEnter}
                          onMouseLeave={this.handleDollarLeave}
                        >
                          {isHovered ? (
                            `$${(balance * solPrice).toFixed(numDecimals)}`
                          ) : (
                            <>
                              <CountUp
                                start={balance}
                                end={balance}
                                separator=","
                                decimal="."
                                decimals={numDecimals}
                                duration={4.5}
                                redraw={true}
                                preserveValue={true}
                                onEnd={() => {
                                  this.setState({ oldBalance: balance });
                                }}
                              />
                            </>
                          )}
                        </div>

                        {(isCoinsAnimation && !isLowGraphics) && (
                          <Lottie
                            options={{
                              loop: isLowGraphics ? false : true,
                              autoplay: isCoinsAnimation,
                              animationData: coins,
                              rendererSettings: {
                                preserveAspectRatio: "xMidYMid slice",
                              },
                            }}
                            style={{
                              marginTop: "-0px",
                              position: "absolute",
                              width: "100px",
                              height: "100px",
                            }}
                          />
                        )}
                        <Button
                          id="wallet-btn"
                          style={{
                            minWidth: "32px",
                            maxHeight: "33px",
                            borderRadius: 1,
                          }}
                          onClick={e => {
                            e.preventDefault();
                            this.handleBalanceClick(e);
                          }}
                        >
                          <AccountBalanceWallet
                            style={{
                              position: "relative",
                              zIndex: "1",
                              width: "18px",
                              height: "18px",
                              margin: "0 5px 0 10px",
                            }}
                          />
                          <span
                            id="wallet-text"
                            style={{
                              position: "relative",
                              zIndex: "1",
                              fontSize: "0.6em",
                              paddingRight: "10px",
                            }}
                          >
                            Wallet
                          </span>
                        </Button>
                      </div>
                      <Box
                        component="a"
                        href="#"
                        className="mobile-only"
                        onClick={(e) => {
                          e.preventDefault();
                          this.handleNotificationsClick(e);
                        }}
                        id="btn_notifications"
                        onMouseEnter={() => this.handleMouseEnter(3)}
                        onMouseLeave={this.handleMouseLeave}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'color 0.3s ease',
                          '& svg': {
                            color: hoverTabIndex === 3 ? 'red' : 'inherit',
                            transition: 'color 0.3s ease',
                          },
                        }}
                      >
                        <Badge
                          badgeContent={unreadNotificationsCount > 10 ? '9+' : unreadNotificationsCount}
                          color="error"
                          sx={{
                            '& .MuiBadge-badge': {
                              fontSize: '10px',
                              height: '16px',
                              minWidth: '16px',
                            },
                          }}
                        >
                          <NotificationsOutlined fontSize="medium" />
                        </Badge>
                      </Box>

                      <Button
                        aria-controls="profile-menu"
                        aria-haspopup="true"
                        onClick={this.handleOpenProfileMenu}
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
                        anchorEl={anchorElProfile}
                        open={Boolean(anchorElProfile)}
                        onClose={this.handleCloseProfileMenu}
                        // Remove open/close animations
                        transitionDuration={0}
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'center',
                        }}
                        transformOrigin={{
                          vertical: 'top',
                          horizontal: 'center',
                        }}
                        // Dark background & white text
                        PaperProps={{
                          sx: {
                            backgroundColor: '#1f1a25',
                            color: '#fff',

                            // Style all MenuItems
                            '& .MuiMenuItem-root': {
                              // White text on items, no uppercase transform
                              textTransform: 'none',
                              color: 'inherit',
                              // Hover effect
                              '&:hover': {
                                backgroundColor: '#ff0000',
                                color: '#fff'
                              },
                            },
                            // Ensure icons are also white
                            '& .MuiListItemIcon-root': {
                              color: 'inherit',
                            },
                            // Style the divider color
                            '& .MuiDivider-root': {
                              borderColor: 'rgba(255,255,255,0.2)',
                            },
                          },
                        }}
                        // Optionally remove the semi-transparent backdrop
                        BackdropProps={{
                          invisible: true,
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
                          <ListItemIcon>
                            <Dashboard />
                          </ListItemIcon>
                          <ListItemText>DASHBOARD</ListItemText>
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
                            <img
                              style={{
                                transform: 'translate(-93px, 4px)',
                                width: '20px',
                                zIndex: 0,
                              }}
                              src="../img/icons/corn.svg"
                              alt="corn"
                            />
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
                            history.push('/investors');
                          }}
                        >
                          <ListItemIcon>
                            <MonetizationOn fontSize="small" />
                          </ListItemIcon>
                          <ListItemText>$RPS 🚀</ListItemText>
                        </MenuItem>

                        <MenuItem
                          onClick={() => {
                            this.handleLogout(true);
                          }}
                        >
                          <ListItemIcon>
                            <ExitToApp fontSize="small" />
                          </ListItemIcon>
                          <ListItemText>LOG OUT</ListItemText>
                        </MenuItem>
                      </Menu>
                    </>
                  ) : (
                    <Button id="btn-login" onClick={this.handleOpenLoginModal}>
                      Login
                    </Button>
                  )
                ) : (
                  // Skeleton Loader
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Skeleton variant="rectangular" sx={{ width: 80, height: 30 }} />
                    <Skeleton variant="text" sx={{ width: 100, height: 30 }} />
                    <Skeleton variant="circular" sx={{ width: 40, height: 40 }} />
                  </Box>
                )}
              </div>
            </div>
            {this.state.loaded ? (
              <>
                <Popover
                  open={Boolean(anchorElNotifications)}
                  anchorEl={anchorElNotifications}
                  onClose={this.handleCloseNotifications}
                  // Disable animations
                  transitionDuration={0}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                  }}
                  PaperProps={{
                    sx: {
                      // Dark background & white text
                      backgroundColor: '#1f1a25',
                      color: '#fff',
                      width: 320,              // fixed width if desired
                      maxWidth: '90vw',       // fallback for mobile
                      display: 'flex',
                      flexDirection: 'column',
                    },
                  }}
                >
                  {/* STICKY HEADER */}
                  <Typography
                    variant="h6"
                    sx={{
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#1f1a25',
                      color: '#fff',
                      p: 2,
                      zIndex: 2, // ensures it stays above scrollable content
                    }}
                  >
                    NOTIFICATIONS
                  </Typography>

                  {/* SCROLLABLE CONTENT AREA */}
                  <Box
                    sx={{
                      maxHeight: 300,    // scrollable height
                      overflowY: 'auto',
                      // Add some side padding
                      px: 2,
                      pb: 2,
                    }}
                  >
                    {notificationsArray.length > 0 ? (
                      notificationsArray.map((notification, index) => (
                        <Box key={index}>
                          {/* ONE NOTIFICATION */}
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'flex-start',
                              py: 1.5,       // vertical padding
                            }}
                            className={`notification-container ${notification.is_read ? 'read' : ''
                              }`}
                          >
                            {/* KEEP AVATAR STYLING EXACTLY THE SAME */}
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

                            {/* TEXT LINK */}
                            <a
                              href={`/join/${notification.room}/`}
                              style={{
                                width: '100%',
                                textDecoration: 'none',
                                color: 'inherit',
                                marginLeft: '0.75rem',
                                position: 'relative'
                              }}
                            >
                              {/* Unread Red Dot */}
                              {!notification.is_read && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: 'red',
                                    transform: 'translate(-120%, 40%)'
                                  }}
                                  className="red-dot"
                                />
                              )}

                              {/* Notification message */}
                              <Typography
                                variant="body2"
                                component="div"
                                sx={{ mb: 0.5 }}
                                dangerouslySetInnerHTML={{
                                  __html: notification.message,
                                }}
                              />

                              {/* Time from now */}
                              <Typography
                                variant="caption"
                                sx={{ color: '#ccc' }}
                              >
                                {notification.from_now}
                              </Typography>
                            </a>
                          </Box>

                          {/* Divider between notifications (except after the last one) */}
                          {index < notificationsArray.length - 1 && (
                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                          )}
                        </Box>
                      ))
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          fontStyle: 'italic',
                          mt: 1,
                        }}
                      >
                        No notifications available.
                      </Typography>
                    )}
                  </Box>
                </Popover>

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
                    solPrice={solPrice}
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

                <Popover
                  open={Boolean(anchorElGameLog)}
                  anchorEl={anchorElGameLog}
                  onClose={this.handleCloseGameLog}
                  transitionDuration={0}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                  }}
                  // Dark popover background & white text
                  PaperProps={{
                    sx: {
                      backgroundColor: '#1f1a25',
                      color: '#fff',
                      p: 2,

                      // Ensure nested MUI Paper elements (TableContainer, etc.) match
                      '& .MuiPaper-root': {
                        backgroundColor: 'inherit',
                        color: 'inherit',
                      },
                      '& .MuiTableContainer-root': {
                        backgroundColor: 'inherit',
                        color: 'inherit',
                      },
                      '& .MuiTableCell-root': {
                        color: '#fff',
                        borderColor: '#444',
                      },
                      // Style the plain <input> for wallet address
                      '& #wallet-address': {
                        backgroundColor: '#1f1a25',
                        color: '#fff',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        width: '100%',
                        padding: '0.5rem',
                        marginTop: '0.5rem',
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                      },
                    },
                  }}
                >
                  {/* CONTENT */}
                  <Box sx={{ position: 'relative' }}>
                    <Tooltip
                      style={{ position: 'absolute', right: '20px' }}
                      title={
                        <>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            WHY DO MY WINNINGS APPEAR LESS?
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            You see less as this is net profit (
                            <Box component="span" sx={{ fontWeight: 'bold', color: '#28a745' }}>
                              winning amount
                            </Box>
                            {' - '}
                            <Box component="span" sx={{ fontWeight: 'bold', color: '#ff0000' }}>
                              bet amount
                            </Box>
                            ) and receive less due to:
                          </Typography>
                          <ul style={{ paddingLeft: '1rem', marginBottom: '0.5rem' }}>
                            <li>RTB fees awarded to the Host (0% - 15% returned to bankroll)</li>
                            <li>1% towards platform fees</li>
                          </ul>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            For example, if you win{' '}
                            <Box component="span" sx={{ fontWeight: 'bold' }}>
                              {convertToCurrency(0.2, solPrice)}
                            </Box>
                            {' '}but bet{' '}
                            <Box component="span" sx={{ fontWeight: 'bold' }}>
                              {convertToCurrency(0.1, solPrice)}
                            </Box>
                            , then you might see:
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <Box component="span" sx={{ fontWeight: 'bold' }}>
                              {convertToCurrency(0.2, solPrice)} * 0.88
                            </Box>{' '}
                            (12% RTB) -{' '}
                            <Box component="span" sx={{ fontWeight: 'bold' }}>
                              {convertToCurrency(0.1, solPrice)}
                            </Box>{' '}
                            ={' '}
                            <Box component="span" sx={{ fontWeight: 'bold' }}>
                              {convertToCurrency(0.076, solPrice)}
                            </Box>{' '}final calculation.
                          </Typography>
                        </>
                      }
                      placement="top"
                    >
                      <Info
                        style={{
                          cursor: 'pointer',
                          float: 'right',
                          color: isDarkMode ? '#f9f9f9' : '#333',
                        }}
                      />
                    </Tooltip>
                  </Box>

                  <Typography sx={{ mt: 1, mb: 2 }} variant="h6">
                    BALANCE HISTORY
                  </Typography>

                  <TableContainer component={Paper}>
                    <Table aria-label="a dense table" size="small">
                      <TableBody>
                        {transactions.length === 0 ? (
                          <TableRow>
                            <TableCell>...</TableCell>
                          </TableRow>
                        ) : (
                          transactions.slice(0, 5).map((row, key) => {
                            const clickable =
                              row.hash && row.hash.length !== 10 && row.status !== 'processing';
                            return (
                              <TableRow
                                key={key}
                                onClick={() => {
                                  if (clickable) {
                                    window.open(
                                      `https://explorer.solana.com/tx/${row.hash}?cluster=mainnet`,
                                      '_blank'
                                    );
                                  }
                                }}
                                sx={{
                                  cursor: clickable ? 'pointer' : 'default',
                                  '&:hover': {
                                    backgroundColor: clickable
                                      ? 'rgba(255,255,255,0.05)'
                                      : 'inherit',
                                  },
                                }}
                              >
                                <TableCell
                                  sx={{
                                    // negative = red(error), positive = green(success)
                                    color: row.amount > 0 ? 'success.main' : 'error.main',
                                  }}
                                >
                                  {row.amount > 0
                                    ? `+ ${convertToCurrency(row.amount, solPrice)}`
                                    : `- ${convertToCurrency(Math.abs(row.amount), solPrice)}`}
                                </TableCell>
                                <TableCell sx={{ color: '#fff' }}>
                                  {row.from_now}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>

                    {/* ALL TRANSACTIONS Button */}
                    <Button
                      color="error"
                      variant="outlined"
                      onClick={this.toggleAllTransactions}
                      sx={{
                        // On hover, become contained
                        '&:hover': {
                          backgroundColor: 'error.main',
                          color: '#fff',
                        },
                        width: '100%',
                        mt: 1,
                      }}
                    >
                      ALL TRANSACTIONS
                    </Button>
                  </TableContainer>

                  {/* First transaction panel */}
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    {/* Inventory Button */}
                    <Button
                      color="error"
                      variant="outlined"
                      onClick={this.handleOpenInventoryModal}
                      startIcon={<Inventory2Outlined />}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'error.main',
                          color: '#fff',
                        },
                      }}
                    >
                      Inventory
                    </Button>

                    {/* Vault Button */}
                    <Button
                      color="error"
                      variant="outlined"
                      onClick={this.handleOpenVaultModal}
                      startIcon={<SavingsOutlined />}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'error.main',
                          color: '#fff',
                        },
                      }}
                    >
                      Vault&nbsp;{vaultBal
                        ? convertToCurrency(vaultBal, solPrice)
                        : 0}
                    </Button>
                  </Box>

                  {/* Second transaction panel */}
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {/* Debt or Withdraw */}
                    {remainingLoans > 0 ? (
                      <Button
                        color="error"
                        variant="outlined"
                        onClick={this.handleOpenDebtsModal}
                        startIcon={<MoneyOffCsredOutlined />}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'error.main',
                            color: '#fff',
                          },
                        }}
                      >
                        {convertToCurrency(remainingLoans, solPrice)} IN DEBT
                      </Button>
                    ) : (
                      <Button
                        color="error"
                        variant="outlined"
                        onClick={this.handleOpenWithdrawModal}
                        startIcon={<AttachMoneyOutlined />}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'error.main',
                            color: '#fff',
                          },
                        }}
                      >
                        Withdraw
                      </Button>
                    )}

                    {/* Deposit Button */}
                    <Button
                      color="error"
                      variant="outlined"
                      onClick={this.handleOpenDepositModal}
                      startIcon={<AccountBalanceWalletOutlined />}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'error.main',
                          color: '#fff',
                        },
                      }}
                    >
                      Deposit
                    </Button>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <hr style={{ borderColor: '#444' }} />
                  </Box>

                  {/* Wallet address and connect/disconnect */}
                  {walletAddress ? (
                    <Box sx={{ mt: 2 }}>
                      <input
                        id="wallet-address"
                        type="text"
                        value={walletAddress}
                        readOnly
                      />
                      <Button
                        color="error"
                        variant="outlined"
                        onClick={this.disconnectWeb3}
                        fullWidth
                        sx={{
                          '&:hover': {
                            backgroundColor: 'error.main',
                            color: '#fff',
                          },
                          mt: 1,
                        }}
                      >
                        Disconnect
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      color="error"
                      variant="outlined"
                      fullWidth
                      onClick={this.loadSolanaWallet}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'error.main',
                          color: '#fff',
                        },
                        mt: 2,
                      }}
                    >
                      CONNECT WALLET
                    </Button>
                  )}
                </Popover>
              </>
            ) : (
              null
            )}
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
              solPrice={solPrice}
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
              initSocket={this.initSocket}
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
              conversionRate={solPrice}
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
          <ListItemModal />
          <DeListItemModal />
          <ConfirmTradeModal />
          <DeListLoanModal />
          <ConfirmLoanModal />
          <OfferLoanModal solPrice={solPrice} socket={this.props.socket} />
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
                zIndex: 9,
                backgroundColor: isDarkMode ? 'rgb(255 0 234 / 60%)' : '#ccc9',
                primaryColor: '#ff0000',
                arrowColor: isDarkMode ? 'rgb(255 0 234 / 60%)' : '#ccc9',
                textColor: isDarkMode ? '#f9f9f9' : '#333',
                width: 300,
                padding: 20,
                borderRadius: 5,
              },

              buttonClose: {
                borderRadius: 1,
                color: isDarkMode ? '#f9f9f9' : '#333',
              },
              buttonBack: {
                borderRadius: 1,
                color: isDarkMode ? '#f9f9f9' : '#333',
              },
              buttonNext: {
                borderRadius: 1,
                color: isDarkMode ? '#f9f9f9' : '#333',
              },
              buttonSkip: {
                borderRadius: 1,
                color: isDarkMode ? '#f9f9f9' : '#333',
              },

            }}
          />

        </div>

      </ThemeProvider >
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
  notificationSounds: state.auth.notificationSounds,
  isNotificationsAllowed: state.auth.isNotificationsAllowed,
  user: state.auth.user,
  unreadMessageCount: state.auth.unreadMessageCount,
  selectedMainTabIndex: state.logic.selectedMainTabIndex,
  transactions: state.auth.transactions,
  tnxComplete: state.logic.transactionComplete,
  isDarkMode: state.auth.isDarkMode,
  betResult: state.logic.betResult,
  solPrice: state.logic.solPrice,
  remainingLoans: state.loanReducer.remainingLoans,
  userLoans: state.loanReducer.userLoans,
  sevenDayProfit: state.auth.sevenDayProfit,
  oneDayProfit: state.auth.oneDayProfit,
  allTimeProfit: state.auth.allTimeProfit,
  notifications: state.logic.notifications,
  isLowGraphics: state.auth.isLowGraphics,
  showCookieConsent: state.auth.showCookieConsent,
  history: state.logic.history,
});

const mapDispatchToProps = {
  setSocket,
  userSignOut,
  setRoomList,
  removeRoomFromList,
  getUser,
  addChatLog,
  getMyHistory,
  updateTutorialCompleted,
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
  setBalance,
  getProfitData,
  openOfferLoanModal,
  setCurrentOfferTargetInfo,
  fetchVaultBalance,
  getWithdrawals,
};

export default connect(mapStateToProps, mapDispatchToProps)(SiteWrapper);
