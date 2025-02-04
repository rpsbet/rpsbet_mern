import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} from 'react';
import {
  createTheme,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  Skeleton,
  ListItemText,
  Divider,
  Tooltip,
  Paper,
  Popover,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Badge,
  DialogTitle
} from '@mui/material';

import CatsinoModalOverlay from '../game_panel/main_pages/CatsinoModalOverlay.jsx';
import { ThemeProvider } from '@mui/material/styles';
import Countdown from 'react-countdown';
import HistoryTable from '../game_panel/LiveGames/HistoryTable.jsx';
import axios from '../util/Api';
import SettingsModal from './modal/SettingsModal.jsx';
import BonusModal from './modal/BonusModal.jsx';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import CountUp from 'react-countup';
import Lottie from 'react-lottie';
import coins from './LottieAnimations/coins.json';
import AllTransactionsModal from './modal/AllTransactionsModal.jsx';
import { debounce } from 'lodash';

import {
  AccountBalanceWallet,
  ArrowDropDown,
  ExitToApp,
  PersonOutline,
  ListTwoTone,
  MonetizationOn,
  Help,
  Settings,
  Star,
  QuestionMark,
  AccountBalanceOutlined,
  StorefrontOutlined as StorefrontOutlinedIcon,
  LeaderboardOutlined,
  NotificationsOutlined,
  Inventory2Outlined,
  AccountBalanceWalletOutlined,
  SavingsOutlined,
  AttachMoneyOutlined,
  MoneyOffCsredOutlined,
  Dashboard
} from '@mui/icons-material';

import history from '../redux/history';
import socketIOClient from 'socket.io-client';
import Moment from 'moment';
import Avatar from '../components/Avatar';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

import ProfileModal from './modal/ProfileModal';
import PlayerModal from './modal/PlayerModal';
import HowToPlayModal from './modal/HowToPlayModal';
import MarketplaceModal from './modal/MarketplaceModal';
import BankModal from './modal/BankModal';
import DebtsModal from './modal/DebtsModal';
import LeaderboardsModal from './modal/LeaderboardsModal';
import {
  acCalculateRemainingLoans,
  setCurrentOfferTargetInfo
} from '../redux/Loan/loan.action';
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
import Joyride from 'react-joyride';
import { tutorialStepsMain } from '../util/tutorialStepsMain';
import CookieConsent from '../util/cookieConsent';
import { convertToCurrency } from '../util/conversion';

import {
  setSocket,
  userSignOut,
  getUser,
  setUnreadMessageCount,
  setDarkMode,
  setNotificationsAllowed,
  fetchVaultBalance,
  updateTutorialCompleted,
  checkAndAddWalletAddress,
  disconnectWalletAddress,
  authenticateWithPhantom
} from '../redux/Auth/user.actions';

import {
  openOfferLoanModal
} from '../redux/Notification/notification.actions';
import { ConflictDialog } from './modal/ConfirmAlerts.jsx';
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
  removeRoomFromList,
  getGlobalChatLogs,
  getHistory,
} from '../redux/Logic/logic.actions';

// We remove this to avoid Proptype issues in MUI v5
LoadingOverlay.propTypes = undefined;

const tokenMintAddress = 'BBDULAQQBG1UYBK9ay7hSf1Arfhme4jnugxwzjbipump';

// Theming
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

function updateFromNow(items) {
  if (!items) return [];
  const result = JSON.parse(JSON.stringify(items));
  for (let i = 0; i < result.length; i++) {
    result[i]['from_now'] = Moment(result[i]['created_at']).fromNow();
  }
  return result;
}

const gifUrls = ['/img/rock.gif', '/img/paper.gif', '/img/scissors.gif'];
const randomGifUrl = gifUrls[Math.floor(Math.random() * gifUrls.length)];
const hueRotateValue = (gifUrls.indexOf(randomGifUrl) + 1) * 75;

function SiteWrapper(props) {
  const {
    isDarkMode,
    isAuthenticated,
    user,
    userName,
    balance: propsBalance,
    betResult: propsBetResult,
    solPrice,
    socket,
    transactions: propTransactions,
    notifications,
    isNotificationsAllowed,
    isMuted,
    notificationSounds,
    isLowGraphics,
    showCookieConsent,
    remainingLoans: propsRemainingLoans,
    getGlobalChatLogs,
    // dispatch actions
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
    getHistory,
    updateBetResult,
    openOfferLoanModal,
    setCurrentOfferTargetInfo,
    fetchVaultBalance,
    children,
    connectedAccount
  } = props;

  const currentPath = window.location.pathname;
  const [endpoint, setEndpoint] = useState(
    process.env.NODE_ENV === 'production'
      ? 'https://rps.game'
      : `http://${window.location.hostname}:5001`
  );

  // ------------------ LOCAL STATE ------------------
  const [balance, setLocalBalance] = useState(propsBalance);
  const [oldBalance, setOldBalance] = useState(propsBalance);
  const [hoverTabIndex, setHoverTabIndex] = useState(-1);

  const [anchorElProfile, setAnchorElProfile] = useState(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);
  const [anchorElGameLog, setAnchorElGameLog] = useState(null);

  const [betResult, setBetResultLocal] = useState(propsBetResult);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [runTutorial, setRunTutorial] = useState(false);

  const [isInvestorsPage, setIsInvestorsPage] = useState(
    location.pathname.startsWith('/investors')
  );
  const [isPlayer, setIsPlayer] = useState(location.pathname.startsWith('/play'));
  const [currentTutorial, setCurrentTutorial] = useState(1);

  const [showHowToPlayModal, setShowHowToPlayModal] = useState(false);
  const [vaultBal, setVaultBal] = useState(0);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showLeaderboardsModal, setShowLeaderboardsModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const [showDepositModal, setShowDepositModal] = useState(
    currentPath === '/deposit/' || currentPath === '/deposit'
  );
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);

  const [walletConflictOpen, setWalletConflictOpen] = useState(false);
  const handleCloseConflictDialog = () => setWalletConflictOpen(false);


  const [isLive, setIsLive] = useState(false);
  const [blurValue, setBlurValue] = useState(3);
  const [currentGif, setCurrentGif] = useState('');
  const [tokenModalOpen, setTokenModalOpen] = useState(true);

  const [transactions, setTransactions] = useState([updateFromNow(propTransactions)]);

  const [isHovered, setIsHovered] = useState(false);
  const [websiteLoading, setWebsiteLoading] = useState(true);
  const [isCoinsAnimation, setIsCoinsAnimation] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [showDebtsModal, setShowDebtsModal] = useState(false);
  const [bonusCheck, setBonusCheck] = useState(false);
  const [remainingLoans, setRemainingLoans] = useState(propsRemainingLoans);
  const [highlightedRooms, setHighlightedRooms] = useState(new Set());

  // For web3/wallet
  const [walletAddress, setWalletAddress] = useState(connectedAccount);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [solanaBalance, setSolanaBalance] = useState(0);
  const [account, setAccount] = useState(null);

  const [showAllGameLogs, setShowAllGameLogs] = useState(false);

  const [selectedCreator, setSelectedCreator] = useState(null);

  // Audio Refs
  const notificationSoundRef = useRef(null);
  const needALoanRef = useRef(null);
  const audioWinRef = useRef(null);
  const audioSplitRef = useRef(null);
  const audioLoseRef = useRef(null);

  const intervalRef = useRef(null);
  const isUnmountedRef = useRef(false);

  // -------------- LIFECYCLE-LIKE EFFECTS --------------
  /**
   * Replaces componentDidMount logic
   */
  useEffect(() => {
    isUnmountedRef.current = false;

    const doMount = async () => {
      getGlobalChatLogs();
      setWebsiteLoading(true);
      setIsInvestorsPage(location.pathname.startsWith('/investors'));
      setIsPlayer(location.pathname.startsWith('/play'));
      getHistory();
      // Add event listeners
      window.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mousedown', handleClickOutside);

      try {
        // 1) fetch initial vaultBalance
        const initialBalance = await fetchVaultBalance();
        setVaultBal(initialBalance);

        // 2) get notifications, user, and audio in parallel
        await Promise.all([
          getNotifications(),
          getUser(),              // this populates user in state (or Redux) 
          initializeAudio(),
          acCalculateRemainingLoans()
        ]);

        // By here, user should be stored in your state/Redux,
        // but we do NOT init the socket here anymore.
        setWebsiteLoading(false);

      } catch (error) {
        console.error('Mount error:', error);
      }

      // Setup interval for updating "from now" fields
      intervalRef.current = setInterval(() => {
        updateReminderTime();
      }, 3000);

      // Attempt to load Phantom wallet if present
      loadSolanaWallet();

      // If in `/play`, close the token modal automatically
      if (location.pathname.startsWith('/play')) {
        closeTokenModal();
      }
    };

    doMount();

    return () => {
      isUnmountedRef.current = true;
      if (socket) {
        socket.disconnect();
      }
      clearInterval(intervalRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [getGlobalChatLogs, getHistory]);


  /**
   * Watch for user changes => set runTutorial if tutorial #1 not completed
   */
  useEffect(() => {
    if (user && user.completedTutorials) {
      setRunTutorial(!user.completedTutorials.includes(1));
    }
  }, [user]);

  /**
   * Watch for `betResult` changes => coin animation if "win"
   */
  useEffect(() => {
    if (propsBetResult === 'win' && !isLowGraphics) {
      playCoinsAnimation();
    }
  }, [propsBetResult, isLowGraphics]);

  /**
   * Watch if `remainingLoans` changes in props => local state
   */
  useEffect(() => {
    setRemainingLoans(propsRemainingLoans);
  }, [propsRemainingLoans]);

  /**
   * Check if transactions updated => set local transactions
   * We also do an example check if the first transaction changed => do getUser
   */
  useEffect(() => {
    if (!propTransactions) return;
    if (propTransactions.length > 0) {
      setTransactions(updateFromNow(propTransactions));
    }
  }, [propTransactions]);

  /**
   * If user changes, or user’s balance changes, sync local state
   * - This is akin to getDerivedStateFromProps for certain fields
   */
  useEffect(() => {
    setLocalBalance(propsBalance);
  }, [propsBalance]);

  // -------------- UTILITY / EVENT HANDLERS --------------

  const handleMouseMove = useCallback((event) => {
    const { clientX } = event;
    const { innerWidth } = window;
    const newBlurValue = Math.max(
      0,
      Math.min(10, 10 * (1 - clientX / (innerWidth - 290)))
    );
    setBlurValue(newBlurValue);
  }, []);

  const handleClickOutside = useCallback(() => {
    if (anchorElProfile) {
      setAnchorElProfile(null);
    }
  }, [anchorElProfile]);

  const updateReminderTime = useCallback(
    debounce(() => {
      setTransactions((prev) => updateFromNow(prev));
    }, 300),
    []
  );
  // -------------- AUDIO SETUP / PLAYBACK --------------
  const initializeAudio = useCallback(async () => {
    try {
      notificationSoundRef.current = new Audio('/sounds/notification.mp3');
      needALoanRef.current = new Audio('/sounds/need_a_loan.mp3');
      audioWinRef.current = new Audio('/sounds/audioWin.mp3');
      audioSplitRef.current = new Audio('/sounds/audioSplit.mp3');
      audioLoseRef.current = new Audio('/sounds/audioLose.mp3');

      // Pre-load
      await notificationSoundRef.current.load();
      await needALoanRef.current.load();
      await audioWinRef.current.load();
      await audioSplitRef.current.load();
      await audioLoseRef.current.load();
    } catch (error) {
      console.log('Audio initialization error:', error);
    }
  }, []);

  const playCoinsAnimation = useCallback(() => {
    setIsCoinsAnimation(true);
    // Stop after 1.5s
    setTimeout(() => {
      setIsCoinsAnimation(false);
    }, 1500);
  }, []);

  useEffect(() => {
    // 1) Create the socket client
    const newSocket = socketIOClient(endpoint, { transports: ['websocket'] });

    // newSocket.on('connect', () => {
    //   console.log('[Socket] connected');
    // });

    let lastGlobalChat = null;
    const handleGlobalChat = (data) => {
      // If new message is the same as last => skip
      if (
        lastGlobalChat &&
        lastGlobalChat.senderId === data.senderId &&
        lastGlobalChat.time === data.time &&
        lastGlobalChat.message === data.message
      ) {
        return;
      }
      lastGlobalChat = data;
      globalChatReceived(data);
    };
    newSocket.on('GLOBAL_CHAT_RECEIVED', handleGlobalChat);

    // Room list updates:
    const handleUpdatedRoomList = (data) => {
      setRoomList(data);
    };
    newSocket.on('UPDATED_ROOM_LIST', handleUpdatedRoomList);

    const handleRoomEnded = (data) => {
      console.log("data.room", data)
      removeRoomFromList(data.roomId);
    };
    newSocket.on('ROOM_ENDED', handleRoomEnded);

    // 3) Store the socket reference
    setSocket(newSocket);

    // 4) Cleanup on unmount
    return () => {
      newSocket.off('GLOBAL_CHAT_RECEIVED', handleGlobalChat);
      newSocket.off('UPDATED_ROOM_LIST', handleUpdatedRoomList);
      newSocket.off('ROOM_ENDED', handleRoomEnded);
      newSocket.disconnect();
    };
  }, [
    endpoint,
    globalChatReceived,
    setRoomList,
    removeRoomFromList,
    setSocket
  ]);

  useEffect(() => {
    // If no socket yet, or user not logged in => do nothing
    if (!socket) return;
    if (!user || !user._id) return;

    // Identify user to the server
    socket.emit('STORE_CLIENT_USER_ID', { user_id: user._id });

    // ----- User-specific listeners -----

    // 1) Private chat
    const handleSendChat = (data) => {
      if (!isMuted || !notificationSounds) {
        notificationSoundRef.current?.play();
      }
      addChatLog(data);

      const pathName = history.location.pathname;
      const segments = pathName.split('/');
      const chatUserId = segments[2];

      if (pathName.startsWith('/chat/') && chatUserId === data.from) {
        socket.emit('READ_MESSAGE', { to: user._id, from: data.from });
      } else {
        socket.emit('REQUEST_UNREAD_MESSAGE_COUNT', { to: user._id });
      }
    };
    socket.on('SEND_CHAT', handleSendChat);

    // 2) Loan offers
    const handleLoanOffer = (payload) => {
      openOfferLoanModal();
      if (!isMuted) {
        needALoanRef.current?.play();
      }
      setCurrentOfferTargetInfo({
        _id: user._id,
        lender: payload.lender,
        avatar: payload.avatar,
        accessory: payload.accessory,
        username: payload.username,
        totalWagered: payload.totalWagered
      });
    };
    socket.on(`RECEIVED_LOAN_OFFER_${user._id}`, handleLoanOffer);

    // 3) Bet result
    const handleBetResult = (data) => {
      updateBetResult(data);
    };
    socket.on('UPDATE_BET_RESULT', handleBetResult);

    // 4) Notifications
    const handleSendNotification = (data) => {
      if (!isMuted || !notificationSounds) {
        notificationSoundRef.current?.play();
      }

      if (data.message.includes('Deposit')) {
        getUser();
      }

      if (isNotificationsAllowed && window.Notification) {
        const options = { body: data.message, silent: false };
        if (Notification.permission === 'granted') {
          new Notification('New Notification', options);
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              setNotificationsAllowed(true);
              new Notification('New Notification', options);
            }
          });
        }
      }
    };

    socket.on('SEND_NOTIFICATION', handleSendNotification);

    const handleAddTransaction = (data) => {
      addNewTransaction(data)

    };

    socket.on('NEW_TRANSACTION', handleAddTransaction);

    // 5) Unread message count
    const handleUnreadCount = (countData) => {
      setUnreadMessageCount(countData);
    };
    socket.on('SET_UNREAD_MESSAGE_COUNT', handleUnreadCount);

    // 6) Online status
    const handleOnlineStatusUpdated = (data) => {
      updateOnlineUserList(data.user_list);
    };
    socket.on('ONLINE_STATUS_UPDATED', handleOnlineStatusUpdated);

    // ----- Cleanup: remove these user-specific listeners when user changes or unmount
    return () => {
      socket.off('SEND_CHAT', handleSendChat);
      socket.off(`RECEIVED_LOAN_OFFER_${user._id}`, handleLoanOffer);
      socket.off('UPDATE_BET_RESULT', handleBetResult);
      socket.off('SEND_NOTIFICATION', handleSendNotification);
      socket.off('SET_UNREAD_MESSAGE_COUNT', handleUnreadCount);
      socket.off('ONLINE_STATUS_UPDATED', handleOnlineStatusUpdated);
    };
  }, [
    socket,
    user,
    isMuted,
    notificationSounds,
    openOfferLoanModal,
    needALoanRef,
    setCurrentOfferTargetInfo,
    updateBetResult,
    getUser,
    isNotificationsAllowed,
    setNotificationsAllowed,
    setUnreadMessageCount,
    updateOnlineUserList,
    addChatLog
  ]);


  // -------------- WALLET / WEB3 --------------
  const loadSolanaWallet = useCallback(async () => {
    try {
      if (window.solana && window.solana.isPhantom) {
        // 1) Connect Phantom
        await window.solana.connect();
        const wAddress = window.solana.publicKey.toString();
        // props.authenticateWithPhantom();
        // 2) Attempt to register/add this wallet to the user
        const { success, message } = await props.checkAndAddWalletAddress(wAddress);
        if (!success) {
          // That means the wallet is already in use by another user
          console.warn('Wallet conflict:', message);
          // Show our MUI dialog to alert user
          setWalletConflictOpen(true);
          return; // Stop execution so we don't store the address for the current user
        }

        // 3) If success, continue with your existing logic:
        const response = await axios.get('/stripe/get_provider_url');
        const providerUrl = response.data.providerUrl;
        const solanaConnection = new Connection(providerUrl, 'confirmed');

        // fetch SOL balance
        const solBalLamports = await solanaConnection.getBalance(new PublicKey(wAddress));

        // fetch token accounts
        const tokenAccounts = await solanaConnection.getParsedTokenAccountsByOwner(
          new PublicKey(wAddress),
          { programId: TOKEN_PROGRAM_ID }
        );

        // find specific token mint
        const specificTokenAccount = tokenAccounts.value.find(
          (acc) => acc.account.data.parsed.info.mint === tokenMintAddress.toString()
        );

        let tokBalance = 0;
        if (specificTokenAccount) {
          tokBalance =
            specificTokenAccount.account.data.parsed.info.tokenAmount.uiAmount;
        }

        // 4) Update your local state
        setWalletAddress(wAddress);
        setAccount({ publicKey: new PublicKey(wAddress) });
        setSolanaBalance(solBalLamports / LAMPORTS_PER_SOL);
        setTokenBalance(tokBalance || 0);
      }
    } catch (error) {
      console.error('Failed to connect Phantom or fetch token balance:', error);
    }
  }, []);

  const disconnectWeb3 = useCallback(() => {
    setWalletAddress(null);
    setSolanaBalance(0);
    props.disconnectWalletAddress();
  }, []);

  // -------------- MAIN TAB / MISC --------------
  const handleMainTabChange = (event, newValue) => {
    // If not on '/', navigate
    if (window.location.pathname !== '/') {
      history.push('/');
    }
    selectMainTab(newValue);
  };

  // -------------- MENUS & MODALS --------------
  const handleOpenProfileMenu = (e) => {
    setAnchorElProfile(e.currentTarget);
  };

  const handleCloseProfileMenu = () => {
    setAnchorElProfile(null);
  };

  const handleNotificationsClick = (e) => {
    setAnchorElNotifications(e.currentTarget);
  };

  const handleCloseNotifications = () => {
    readNotifications();
    // mark local as read
    const updated = (notifications || []).map((n) => ({ ...n, is_read: true }));
    setAnchorElNotifications(null);
  };

  const handleBalanceClick = (e) => {
    setAnchorElGameLog(e.currentTarget);
  };

  const handleVaultBalChange = useCallback((newBalance) => {
    setVaultBal(newBalance);
  }, []);

  const handleCloseGameLog = () => {
    setAnchorElGameLog(null);
  };

  const handleMouseEnter = (index) => {
    setHoverTabIndex(index);
  };

  const handleMouseLeave = () => {
    setHoverTabIndex(-1);
  };

  // Toggle "ALL TRANSACTIONS"
  const toggleAllTransactions = () => {
    setShowAllGameLogs((prev) => !prev);
  };

  // -------------- TUTORIAL / JOYRIDE --------------
  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if (status === 'finished' || status === 'skipped') {
      updateTutorialCompleted(currentTutorial);
      setRunTutorial(false);
    }
  };

  // -------------- LOG IN / LOG OUT --------------
  const handleLogout = (clear_token) => {
    setWalletAddress(null);
    setSolanaBalance(null);
    setAnchorElProfile(null);
    if (socket) {
      socket.disconnect();
    }
    userSignOut(clear_token);
  };

  // -------------- MISC. MODALS --------------
  const handleOpenProfileModal = () => {
    setShowProfileModal(true);
    setAnchorElProfile(null);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
  };

  const handleOpenPlayerModal = (creatorId) => {
    setShowPlayerModal(true);
    setSelectedCreator(creatorId);
  };

  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
  };

  const handleOpenHowToPlayModal = () => {
    setShowHowToPlayModal(true);
  };

  const handleCloseHowToPlayModal = () => {
    setShowHowToPlayModal(false);
  };

  const handleOpenMarketplaceModal = () => {
    setShowMarketplaceModal(true);
  };

  const handleCloseMarketplaceModal = () => {
    setShowMarketplaceModal(false);
  };

  const handleOpenBankModal = () => {
    setShowBankModal(true);
  };

  const handleCloseBankModal = () => {
    setShowBankModal(false);
  };

  const handleOpenLeaderboardsModal = () => {
    setShowLeaderboardsModal(true);
  };

  const handleCloseLeaderboardsModal = () => {
    setShowLeaderboardsModal(false);
  };

  const handleOpenLoginModal = () => {
    setShowLoginModal(true);
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
  };

  const handleOpenSignupModal = () => {
    setShowSignupModal(true);
  };

  const handleCloseSignupModal = () => {
    setShowSignupModal(false);
  };

  const handleOpenDepositModal = () => {
    setShowDepositModal(true);
    setAnchorElProfile(null);
  };

  const handleCloseDepositModal = () => {
    setShowDepositModal(false);
  };

  const handleOpenWithdrawModal = () => {
    setShowWithdrawModal(true);
    setAnchorElProfile(null);
  };

  const handleCloseWithdrawModal = () => {
    setShowWithdrawModal(false);
  };

  const handleOpenInventoryModal = () => {
    setShowInventoryModal(true);
    setAnchorElProfile(null);
  };

  const handleCloseInventoryModal = () => {
    setShowInventoryModal(false);
  };

  const handleOpenVaultModal = () => {
    setShowVaultModal(true);
    setAnchorElProfile(null);
  };

  const handleCloseVaultModal = () => {
    setShowVaultModal(false);
  };

  const handleOpenDebtsModal = () => {
    setShowDebtsModal(true);
  };

  const handleCloseDebtsModal = () => {
    setShowDebtsModal(false);
  };

  const handleOpenSettingsModal = () => {
    setShowSettingsModal(true);
  };

  const handleCloseSettingsModal = () => {
    setShowSettingsModal(false);
  };

  const handleBonusModal = () => {
    setShowBonusModal(true);
  };

  const handleCloseBonusModal = () => {
    setShowBonusModal(false);
  };

  const closeTokenModal = () => {
    setTokenModalOpen(false);
  };

  // -------------- UI HELPERS --------------
  const handlePortfolio = () => {
    history.push('/portfolio');
    selectMainTab(1);
  };

  // -------------- RENDER --------------
  const width = window.innerWidth;
  // The array of notifications from local state
  const notificationsArray = updateFromNow(notifications);
  const unreadNotificationsCount = notificationsArray.filter(
    (n) => !n.is_read
  ).length;

  // For dollar sign hover
  const balanceString = balance.toString();
  const decimalIndex = balanceString.indexOf('.');
  const numDecimals =
    decimalIndex !== -1
      ? Math.min(2, balanceString.length - decimalIndex - 1)
      : 0;

  // Example date
  const halloween = new Date(`${new Date().getFullYear()}-02-14T00:00:00`);
  const currentDate = new Date();
  const timeRemaining = halloween - currentDate;
  const secondsRemaining = Math.floor(timeRemaining / 1000);

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : mainTheme}>
      {showCookieConsent && <CookieConsent />}

      {/* Possibly show big overlay if live & tokenModalOpen */}
      {isLive && tokenModalOpen && (
        <CatsinoModalOverlay
          currentGif={currentGif}
          blurValue={blurValue}
          halloween={halloween}
          handleCountdownButtonClick={() => {
            // e.g., push to /investors
            history.push('/investors');
            closeTokenModal();
          }}
          handleYoutubeButtonClick={() => {
            handleOpenLoginModal();
            closeTokenModal();
          }}
        />
      )}

      <div className={`site_wrapper ${isDarkMode ? 'dark_mode' : ''}`}>
        {/* ========== HEADER ========== */}
        <div className="game_header">
          <div className="main_header">
            {/* LOGO */}
            <a
              className="game_logo"
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/';
              }}
            >
              <img src="/img/game-logo.svg" alt="Game Logo" width="25" height="25" />
            </a>

            {!isInvestorsPage ? (
              <HistoryTable userId={user?._id} />
            ) : (
              <div style={{ padding: width < 600 ? '0' : '48px' }} />
            )}

            <div className="header_action_panel">
              {user ? (
                <>
                  {/* Bank Icon */}
                  <Box
                    component="a"
                    href="#"
                    className="desktop-only"
                    onClick={(e) => {
                      e.preventDefault();
                      handleOpenBankModal();
                    }}
                    id="btn_bank"
                    onMouseEnter={() => handleMouseEnter(6)}
                    onMouseLeave={handleMouseLeave}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'color 0.3s ease',
                      '& svg': {
                        color: hoverTabIndex === 6 ? 'red' : 'inherit',
                        transition: 'color 0.3s ease'
                      }
                    }}
                  >
                    <AccountBalanceOutlined fontSize="medium" />
                  </Box>

                  {/* Store Icon */}
                  <Box
                    component="a"
                    href="#"
                    className="desktop-only"
                    onClick={(e) => {
                      e.preventDefault();
                      handleOpenMarketplaceModal();
                    }}
                    id="btn_marketplace"
                    onMouseEnter={() => handleMouseEnter(5)}
                    onMouseLeave={handleMouseLeave}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'color 0.3s ease',
                      '& svg': {
                        color: hoverTabIndex === 5 ? 'red' : 'inherit',
                        transition: 'color 0.3s ease'
                      }
                    }}
                  >
                    <StorefrontOutlinedIcon fontSize="medium" />
                  </Box>

                  {/* Leaderboard Icon */}
                  <Box
                    component="a"
                    href="#"
                    className="desktop-only"
                    onClick={(e) => {
                      e.preventDefault();
                      handleOpenLeaderboardsModal();
                    }}
                    id="btn_leaderboards"
                    onMouseEnter={() => handleMouseEnter(4)}
                    onMouseLeave={handleMouseLeave}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'color 0.3s ease',
                      '& svg': {
                        color: hoverTabIndex === 4 ? 'red' : 'inherit',
                        transition: 'color 0.3s ease'
                      }
                    }}
                  >
                    <LeaderboardOutlined fontSize="medium" />
                  </Box>

                  {/* Notifications Icon */}
                  <Box
                    component="a"
                    href="#"
                    className="desktop-only"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNotificationsClick(e);
                    }}
                    id="btn_notifications"
                    onMouseEnter={() => handleMouseEnter(3)}
                    onMouseLeave={handleMouseLeave}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'color 0.3s ease',
                      '& svg': {
                        color: hoverTabIndex === 3 ? 'red' : 'inherit',
                        transition: 'color 0.3s ease'
                      }
                    }}
                  >
                    <Badge
                      badgeContent={
                        unreadNotificationsCount > 10 ? '9+' : unreadNotificationsCount
                      }
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '10px',
                          height: '16px',
                          minWidth: '16px'
                        }
                      }}
                    >
                      <NotificationsOutlined fontSize="medium" />
                    </Badge>
                  </Box>
                </>
              ) : null}

              {websiteLoading ? (
                // RENDER SKELETON
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {/* Replace these with skeletons matching your design */}
                  <Skeleton variant="text" sx={{ width: '80px' }} />
                  <Skeleton variant="rectangular" sx={{ width: '10px', height: '30px' }} />
                  <Skeleton variant="circular" width={40} height={40} />
                </Box>
              ) : user._id ? (
                // RENDER USER BALANCE / P
                <>
                  {/* BALANCE */}
                  <div id="balance" className="title">
                    <div
                      style={{ display: 'inline' }}
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                    >
                      {isHovered
                        ? `$${(balance * solPrice).toFixed(numDecimals)}`
                        : (
                          <CountUp
                            start={balance}
                            end={balance}
                            separator=","
                            decimal="."
                            decimals={numDecimals}
                            duration={4.5}
                            redraw={true}
                            preserveValue={true}
                            onEnd={() => setOldBalance(balance)}
                          />
                        )}
                    </div>

                    {isCoinsAnimation && !isLowGraphics && (
                      <Lottie
                        options={{
                          loop: isLowGraphics ? false : true,
                          autoplay: isCoinsAnimation,
                          animationData: coins,
                          rendererSettings: {
                            preserveAspectRatio: 'xMidYMid slice'
                          }
                        }}
                        style={{
                          marginTop: '-0px',
                          position: 'absolute',
                          width: '100px',
                          height: '100px'
                        }}
                      />
                    )}

                    <Button
                      id="wallet-btn"
                      style={{ minWidth: '32px', maxHeight: '33px', borderRadius: 1 }}
                      onClick={(e) => {
                        e.preventDefault();
                        handleBalanceClick(e);
                      }}
                    >
                      <AccountBalanceWallet
                        style={{
                          position: 'relative',
                          zIndex: 1,
                          width: '18px',
                          height: '18px',
                          margin: '0 5px 0 10px'
                        }}
                      />
                      <span
                        id="wallet-text"
                        style={{
                          position: 'relative',
                          zIndex: 1,
                          fontSize: '0.6em',
                          paddingRight: '10px'
                        }}
                      >
                        Wallet
                      </span>
                    </Button>
                  </div>

                  {/* Mobile Notifs */}
                  <Box
                    component="a"
                    href="#"
                    className="mobile-only"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNotificationsClick(e);
                    }}
                    id="btn_notifications"
                    onMouseEnter={() => handleMouseEnter(3)}
                    onMouseLeave={handleMouseLeave}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'color 0.3s ease',
                      '& svg': {
                        color: hoverTabIndex === 3 ? 'red' : 'inherit',
                        transition: 'color 0.3s ease'
                      }
                    }}
                  >
                    <Badge
                      badgeContent={
                        unreadNotificationsCount > 10 ? '9+' : unreadNotificationsCount
                      }
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '10px',
                          height: '16px',
                          minWidth: '16px'
                        }
                      }}
                    >
                      <NotificationsOutlined fontSize="medium" />
                    </Badge>
                  </Box>

                  {/* Profile Menu Button */}
                  <Button
                    aria-controls="profile-menu"
                    aria-haspopup="true"
                    onClick={handleOpenProfileMenu}
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

                  {/* Profile Menu */}
                  <Menu
                    anchorEl={anchorElProfile}
                    open={Boolean(anchorElProfile)}
                    onClose={handleCloseProfileMenu}
                    transitionDuration={0}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'center'
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'center'
                    }}
                    PaperProps={{
                      sx: {
                        backgroundColor: '#1f1a25',
                        color: '#fff',
                        '& .MuiMenuItem-root': {
                          textTransform: 'none',
                          color: 'inherit',
                          '&:hover': {
                            backgroundColor: '#ff0000',
                            color: '#fff'
                          }
                        },
                        '& .MuiListItemIcon-root': {
                          color: 'inherit'
                        },
                        '& .MuiDivider-root': {
                          borderColor: 'rgba(255,255,255,0.2)'
                        }
                      }
                    }}
                    BackdropProps={{
                      invisible: true
                    }}
                  >
                    <MenuItem onClick={handleOpenProfileModal}>
                      <ListItemIcon>
                        <PersonOutline />
                      </ListItemIcon>
                      <ListItemText>PROFILE</ListItemText>
                    </MenuItem>

                    <Divider />

                    <MenuItem className="desktop-only" onClick={handlePortfolio}>
                      <ListItemIcon>
                        <ListTwoTone />
                      </ListItemIcon>
                      <ListItemText>PORTFOLIO</ListItemText>
                    </MenuItem>

                    <MenuItem onClick={handleOpenSettingsModal}>
                      <ListItemIcon>
                        <Settings />
                      </ListItemIcon>
                      <ListItemText>SETTINGS</ListItemText>
                    </MenuItem>

                    <MenuItem onClick={handleBonusModal}>
                      <ListItemIcon>
                        <Star />
                      </ListItemIcon>
                      <ListItemText>CORN WHEEL</ListItemText>
                      <ListItemIcon>
                        <img
                          style={{
                            transform: 'translate(-93px, 4px)',
                            width: '20px',
                            zIndex: 0
                          }}
                          src="../img/icons/corn.svg"
                          alt="corn"
                        />
                      </ListItemIcon>
                    </MenuItem>

                    <MenuItem onClick={handleOpenHowToPlayModal}>
                      <ListItemIcon>
                        <Help />
                      </ListItemIcon>
                      <ListItemText>HOW IT WORKS</ListItemText>
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
                        handleLogout(true);
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
                <Button id="btn-login" onClick={handleOpenLoginModal}>
                  Login
                </Button>
              )}
            </div>
          </div>

          {/* NOTIFICATIONS POPOVER */}
          <Popover
            open={Boolean(anchorElNotifications)}
            anchorEl={anchorElNotifications}
            onClose={handleCloseNotifications}
            transitionDuration={0}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center'
            }}
            PaperProps={{
              sx: {
                backgroundColor: '#1f1a25',
                color: '#fff',
                width: 320,
                maxWidth: '90vw',
                display: 'flex',
                flexDirection: 'column'
              }
            }}
          >
            <Typography
              variant="h6"
              sx={{
                position: 'sticky',
                top: 0,
                backgroundColor: '#1f1a25',
                color: '#fff',
                p: 2,
                zIndex: 2
              }}
            >
              NOTIFICATIONS
            </Typography>

            <Box
              sx={{
                maxHeight: 300,
                overflowY: 'auto',
                px: 2,
                pb: 2
              }}
            >
              {notificationsArray.length > 0 ? (
                notificationsArray.map((notification, index) => (
                  <Box key={index}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        py: 1.5
                      }}
                      className={`notification-container ${notification.is_read ? 'read' : ''
                        }`}
                    >
                      <a
                        className="player"
                        onClick={() => handleOpenPlayerModal(notification._id)}
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
                        {!notification.is_read && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 10,
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: 'red',
                            }}
                          />
                        )}

                        <Typography
                          variant="body2"
                          component="div"
                          sx={{ mb: 0.5 }}
                          dangerouslySetInnerHTML={{
                            __html: notification.message
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#ccc' }}>
                          {notification.from_now}
                        </Typography>
                      </a>
                    </Box>
                    {index < notificationsArray.length - 1 && (
                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                    )}
                  </Box>
                ))
              ) : (
                <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                  No notifications available.
                </Typography>
              )}
            </Box>
          </Popover>

          {/* Show All Game Logs */}
          {showAllGameLogs && (
            <AllTransactionsModal
              modalIsOpen={showAllGameLogs}
              isDarkMode={isDarkMode}
              close={toggleAllTransactions}
              user={user?._id}
              solPrice={solPrice}
              transactions={transactions}
            />
          )}

          {/* BALANCE POP-OVER */}
          <Popover
            open={Boolean(anchorElGameLog)}
            anchorEl={anchorElGameLog}
            onClose={handleCloseGameLog}
            transitionDuration={0}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center'
            }}
            PaperProps={{
              sx: {
                backgroundColor: '#1f1a25',
                color: '#fff',
                p: 2,
                '& .MuiPaper-root': {
                  backgroundColor: 'inherit',
                  color: 'inherit'
                },
                '& .MuiTableContainer-root': {
                  backgroundColor: 'inherit',
                  color: 'inherit'
                },
                '& .MuiTableCell-root': {
                  color: '#fff',
                  borderColor: '#444'
                },
                '& #wallet-address': {
                  backgroundColor: '#1f1a25',
                  color: '#fff',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  width: '100%',
                  padding: '0.5rem',
                  marginTop: '0.5rem',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }
              }
            }}
          >
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
                      <Box
                        component="span"
                        sx={{ fontWeight: 'bold', color: '#28a745' }}
                      >
                        winning amount
                      </Box>
                      {' - '}
                      <Box
                        component="span"
                        sx={{ fontWeight: 'bold', color: '#ff0000' }}
                      >
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
                <QuestionMark
                  style={{
                    cursor: 'pointer',
                    float: 'right',
                    color: isDarkMode ? '#f9f9f9' : '#333'
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
                                : 'inherit'
                            }
                          }}
                        >
                          <TableCell
                            sx={{
                              color: row.amount > 0 ? 'success.main' : 'error.main'
                            }}
                          >
                            {row.amount > 0
                              ? `+ ${convertToCurrency(row.amount, solPrice)}`
                              : `- ${convertToCurrency(Math.abs(row.amount), solPrice)}`}
                          </TableCell>
                          <TableCell sx={{ color: '#fff' }}>{row.from_now}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              <Button
                color="error"
                variant="outlined"
                onClick={toggleAllTransactions}
                sx={{
                  '&:hover': {
                    backgroundColor: 'error.main',
                    color: '#fff'
                  },
                  width: '100%',
                  mt: 1
                }}
              >
                ALL TRANSACTIONS
              </Button>
            </TableContainer>

            {/* Inventory / Vault */}
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                color="error"
                variant="outlined"
                onClick={handleOpenInventoryModal}
                startIcon={<Inventory2Outlined />}
                sx={{
                  '&:hover': {
                    backgroundColor: 'error.main',
                    color: '#fff'
                  }
                }}
              >
                Inventory
              </Button>

              <Button
                color="error"
                variant="outlined"
                onClick={handleOpenVaultModal}
                startIcon={<SavingsOutlined />}
                sx={{
                  '&:hover': {
                    backgroundColor: 'error.main',
                    color: '#fff'
                  }
                }}
              >
                Vault&nbsp;
                {vaultBal ? convertToCurrency(vaultBal, solPrice) : 0}
              </Button>
            </Box>

            {/* Withdraw or Debts / Deposit */}
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {remainingLoans > 0 ? (
                <Button
                  color="error"
                  variant="outlined"
                  onClick={handleOpenDebtsModal}
                  startIcon={<MoneyOffCsredOutlined />}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'error.main',
                      color: '#fff'
                    }
                  }}
                >
                  {convertToCurrency(remainingLoans, solPrice)} IN DEBT
                </Button>
              ) : (
                <Button
                  color="error"
                  variant="outlined"
                  onClick={handleOpenWithdrawModal}
                  startIcon={<AttachMoneyOutlined />}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'error.main',
                      color: '#fff'
                    }
                  }}
                >
                  Withdraw
                </Button>
              )}

              <Button
                color="error"
                variant="outlined"
                onClick={handleOpenDepositModal}
                startIcon={<AccountBalanceWalletOutlined />}
                sx={{
                  '&:hover': {
                    backgroundColor: 'error.main',
                    color: '#fff'
                  }
                }}
              >
                Deposit
              </Button>
            </Box>

            <Box sx={{ mt: 2 }}>
              <hr style={{ borderColor: '#444' }} />
            </Box>

            {/* Phantom Wallet connect or address display */}
            {connectedAccount ? (
              <Box sx={{ mt: 2 }}>
                <input id="wallet-address" type="text" value={connectedAccount} readOnly />
                <Button
                  color="error"
                  variant="outlined"
                  onClick={disconnectWeb3}
                  fullWidth
                  sx={{
                    '&:hover': {
                      backgroundColor: 'error.main',
                      color: '#fff'
                    },
                    mt: 1
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
                onClick={loadSolanaWallet}
                sx={{
                  '&:hover': {
                    backgroundColor: 'error.main',
                    color: '#fff'
                  },
                  mt: 2
                }}
              >
                CONNECT WALLET
              </Button>
            )}
          </Popover>
        </div>
        {/* Conflict Dialog */}
        <ConflictDialog open={walletConflictOpen} onClose={handleCloseConflictDialog} />
        {/* ========== MAIN CONTENT ========== */}
        <div className="game_wrapper">
          <div className="contents_wrapper">{children}</div>
        </div>

        {/* ========== MODALS ========== */}

        {showProfileModal && (
          <ProfileModal
            modalIsOpen={showProfileModal}
            closeModal={handleCloseProfileModal}
            player_name={userName}
            balance={balance}
            accessory={user?.accessory}
            avatar={user?.avatar}
            totalWagered={user?.totalWagered}
            selectedCreator={user?._id}
          />
        )}

        {showPlayerModal && (
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={handleClosePlayerModal}
          />
        )}

        {showSettingsModal && (
          <SettingsModal
            modalIsOpen={showSettingsModal}
            closeModal={handleCloseSettingsModal}
            handleMute={() => {
              audioWinRef.current.muted = true;
              audioLoseRef.current.muted = true;
              audioSplitRef.current.muted = true;
              needALoanRef.current.muted = true;
              notificationSoundRef.current.muted = true;
            }}
            handleUnmute={() => {
              audioWinRef.current.muted = false;
              audioLoseRef.current.muted = false;
              audioSplitRef.current.muted = false;
              needALoanRef.current.muted = false;
              notificationSoundRef.current.muted = false;
            }}
          />
        )}

        {showBonusModal && (
          <BonusModal
            modalIsOpen={showBonusModal}
            closeModal={handleCloseBonusModal}
            user={user}
            solPrice={solPrice}
          />
        )}

        {showLeaderboardsModal && (
          <LeaderboardsModal
            modalIsOpen={showLeaderboardsModal}
            closeModal={handleCloseLeaderboardsModal}
            player_name={userName}
            balance={balance}
            isDarkMode={isDarkMode}
          />
        )}

        {showHowToPlayModal && (
          <HowToPlayModal
            modalIsOpen={showHowToPlayModal}
            closeModal={handleCloseHowToPlayModal}
            player_name={userName}
            balance={balance}
            isDarkMode={isDarkMode}
          />
        )}

        {showBankModal && (
          <BankModal
            modalIsOpen={showBankModal}
            closeModal={handleCloseBankModal}
            player_name={userName}
            balance={balance}
            isDarkMode={isDarkMode}
            remainingLoans={remainingLoans}
          />
        )}

        {showMarketplaceModal && (
          <MarketplaceModal
            modalIsOpen={showMarketplaceModal}
            closeModal={handleCloseMarketplaceModal}
            player_name={userName}
            balance={balance}
            isDarkMode={isDarkMode}
          />
        )}

        {showLoginModal && (
          <LoginModal
            modalIsOpen={showLoginModal}
            closeModal={handleCloseLoginModal}
            openSignupModal={handleOpenSignupModal}
          />
        )}

        {showDebtsModal && (
          <DebtsModal
            modalIsOpen={showDebtsModal}
            closeModal={handleCloseDebtsModal}
            openDebtsModal={handleOpenDebtsModal}
          />
        )}

        {showSignupModal && (
          <SignupModal
            modalIsOpen={showSignupModal}
            closeModal={handleCloseSignupModal}
            openLoginModal={handleOpenLoginModal}
          />
        )}

        {showDepositModal && (
          <DepositModal
            modalIsOpen={showDepositModal}
            closeModal={handleCloseDepositModal}
            web3={null} // pass if needed
            loadSolanaWallet={loadSolanaWallet}
            tokenBalance={tokenBalance}
            balance={solanaBalance}
            account={account}
          />
        )}

        {showInventoryModal && (
          <InventoryModal
            modalIsOpen={showInventoryModal}
            closeModal={handleCloseInventoryModal}
          />
        )}

        {showVaultModal && (
          <VaultModal
            vaultBal={vaultBal}
            modalIsOpen={showVaultModal}
            closeModal={handleCloseVaultModal}
            conversionRate={solPrice}
            isDarkMode={isDarkMode}
            onVaultBalChange={handleVaultBalChange}
          />
        )}

        {showWithdrawModal && (
          <WithdrawModal
            modalIsOpen={showWithdrawModal}
            closeModal={handleCloseWithdrawModal}
            balance={balance}
            web3={null} // or your web3 instance if needed
            account={walletAddress}
          />
        )}

        {/* Additional modals managed by Redux or sibling */}
        <ListItemModal />
        <DeListItemModal />
        <ConfirmTradeModal />
        <DeListLoanModal />
        <ConfirmLoanModal />
        <OfferLoanModal solPrice={solPrice} socket={socket} />
        <GamePasswordModal />

        <Joyride
  steps={tutorialStepsMain}
  run={runTutorial}
  callback={handleJoyrideCallback}
  continuous
  showProgress
  showSkipButton
  styles={{
    options: {
      zIndex: 1500,
      backgroundColor: isDarkMode
        ? 'rgba(33, 33, 33, 0.95)'   // Dark gray background for dark mode
        : 'rgba(255, 255, 255, 0.95)', // White background for light mode
      primaryColor: isDarkMode ? '#ff0000' : '#6200ea', // Vibrant green for dark, deep purple for light
      arrowColor: isDarkMode
        ? 'rgba(33, 33, 33, 0.95)'
        : 'rgba(255, 255, 255, 0.95)',
      textColor: isDarkMode ? '#eeeeee' : '#212121', // Light text for dark mode, dark text for light mode
      width: 320,
      padding: 24,
      borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    buttonClose: {
      borderRadius: 4,
      color: isDarkMode ? '#eeeeee' : '#212121',
    },
    buttonBack: {
      borderRadius: 4,
      backgroundColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
      color: isDarkMode ? '#eeeeee' : '#212121',
      marginRight: 8,
    },
    buttonNext: {
      borderRadius: 4,
      backgroundColor: isDarkMode ? '#ff0000' : '#6200ea',
      color: '#fff',
    },
    buttonSkip: {
      borderRadius: 4,
      color: isDarkMode ? '#eeeeee' : '#212121',
    },
  }}
/>
      </div>
    </ThemeProvider>
  );
}

// ------------------ REDUX CONNECT ------------------
const mapStateToProps = (state) => ({
  transactions: state.auth.transactions,
  loading_user: state.auth.loading_user,
  roomList: state.logic.roomList,
  isAuthenticated: state.auth.isAuthenticated,
  showDeListLoanModal: state.snackbar.showDeListLoanModal,
  showListItemModal: state.snackbar.showListItemModal,
  showDeListItemModal: state.snackbar.showDeListItemModal,
  showConfirmTradeModal: state.snackbar.showConfirmTradeModal,
  showGamePasswordModal: state.snackbar.showGamePasswordModal,
  socket: state.auth.socket,
  balance: state.auth.balance,
  connectedAccount: state.auth.connectedAccount,
  userName: state.auth.userName,
  isMuted: state.auth.isMuted,
  notificationSounds: state.auth.notificationSounds,
  isNotificationsAllowed: state.auth.isNotificationsAllowed,
  user: state.auth.user,
  selectedMainTabIndex: state.logic.selectedMainTabIndex,
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
  checkAndAddWalletAddress,
  disconnectWalletAddress,
  setNotificationsAllowed,
  selectMainTab,
  acCalculateRemainingLoans,
  globalChatReceived,
  setGlobalChat,
  updateBetResult,
  openOfferLoanModal,
  setCurrentOfferTargetInfo,
  fetchVaultBalance,
  getGlobalChatLogs,
  authenticateWithPhantom,
  getHistory,
};

export default connect(mapStateToProps, mapDispatchToProps)(SiteWrapper);
