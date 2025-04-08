import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
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
import { ThemeProvider } from '@mui/material/styles';
import { useSelector, useDispatch } from 'react-redux'; // Add Redux hooks
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../util/Api';
import LoadingOverlay from 'react-loading-overlay';
import CountUp from 'react-countup';
import { debounce } from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faTelegram, faYoutube, faTiktok } from '@fortawesome/free-brands-svg-icons';
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
import socketIOClient from 'socket.io-client';
import Moment from 'moment';
import Avatar from '../components/Avatar';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import EmailIcon from "@mui/icons-material/Email";

import {
  acCalculateRemainingLoans,
  setCurrentOfferTargetInfo
} from '../redux/Loan/loan.action';

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
  addNewNotification,
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
  endLoading,
} from '../redux/Logic/logic.actions';

// Lazy-loaded components
const CatsinoModalOverlay = lazy(() => import('../game_panel/main_pages/CatsinoModalOverlay.jsx'));
const HistoryTable = lazy(() => import('../game_panel/LiveGames/HistoryTable.jsx'));
const SettingsModal = lazy(() => import('./modal/SettingsModal.jsx'));
const BonusModal = lazy(() => import('./modal/BonusModal.jsx'));
const AllTransactionsModal = lazy(() => import('./modal/AllTransactionsModal.jsx'));
const ProfileModal = lazy(() => import('./modal/ProfileModal'));
const PlayerModal = lazy(() => import('./modal/PlayerModal'));
const HowToPlayModal = lazy(() => import('./modal/HowToPlayModal'));
const MarketplaceModal = lazy(() => import('./modal/MarketplaceModal'));
const BankModal = lazy(() => import('./modal/BankModal'));
const DebtsModal = lazy(() => import('./modal/DebtsModal'));
const LeaderboardsModal = lazy(() => import('./modal/LeaderboardsModal'));
const ConfirmTradeModal = lazy(() => import('./modal/ConfirmTradeModal'));
const ConfirmLoanModal = lazy(() => import('./modal/ConfirmLoanModal'));
const OfferLoanModal = lazy(() => import('./modal/OfferLoanModal'));
const ListItemModal = lazy(() => import('./modal/ListItemModal'));
const DeListItemModal = lazy(() => import('./modal/DeListItemModal'));
const DeListLoanModal = lazy(() => import('./modal/DeListLoanModal'));
const GamePasswordModal = lazy(() => import('./modal/GamePasswordModal'));
const LoginModal = lazy(() => import('./modal/LoginModal'));
const SignupModal = lazy(() => import('./modal/SignupModal'));
const DepositModal = lazy(() => import('./modal/DepositModal'));
const WithdrawModal = lazy(() => import('./modal/WithdrawModal'));
const InventoryModal = lazy(() => import('./modal/InventoryModal'));
const VaultModal = lazy(() => import('./modal/VaultModal'));

// Remove PropTypes override
LoadingOverlay.propTypes = undefined;

// Create theme configurations
const customTextFieldStyles = {
  MuiOutlinedInput: {
    root: {
      '&:hover $notchedOutline': { borderColor: 'currentColor' },
      '&$focused $notchedOutline': { borderColor: 'currentColor' },
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
      '&$focused': { backgroundColor: 'transparent' },
      '&:-webkit-autofill': {
        '-webkit-box-shadow': '0 0 0 100px inherit inset',
        '-webkit-text-fill-color': 'currentColor'
      }
    },
    focused: {}
  }
};

const mainTheme = createTheme({
  palette: { type: 'light' },
  overrides: customTextFieldStyles
});

const darkTheme = createTheme({
  palette: { type: 'dark' },
  overrides: customTextFieldStyles
});

// Helper function to format timestamps
function updateFromNow(items) {
  if (!items) return [];
  const result = JSON.parse(JSON.stringify(items));
  for (let i = 0; i < result.length; i++) {
    result[i]['from_now'] = Moment(result[i]['created_at']).fromNow();
  }
  return result;
}

// Random gif selection for game animations
const gifUrls = ['/img/rock.gif', '/img/paper.gif', '/img/scissors.gif'];
const randomGifUrl = gifUrls[Math.floor(Math.random() * gifUrls.length)];
const hueRotateValue = (gifUrls.indexOf(randomGifUrl) + 1) * 75;

function SiteWrapper({ children }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Redux state
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
    connectedAccount
  } = useSelector((state) => ({
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
  }));

  // Local state
  const currentPath = window.location.pathname;
  const [endpoint, setEndpoint] = useState(
    process.env.NODE_ENV === 'production'
      ? 'https://rps.game'
      : `http://${window.location.hostname}:5001`
  );

  const [balance, setLocalBalance] = useState(propsBalance);
  const [oldBalance, setOldBalance] = useState(propsBalance);
  const [hoverTabIndex, setHoverTabIndex] = useState(-1);
  const [anchorElProfile, setAnchorElProfile] = useState(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);
  const [anchorElGameLog, setAnchorElGameLog] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [runTutorial, setRunTutorial] = useState(false);
  const [isInvestorsPage, setIsInvestorsPage] = useState(location.pathname.startsWith('/investors'));
  const [isPlayer, setIsPlayer] = useState(location.pathname.startsWith('/play'));
  const [showHowToPlayModal, setShowHowToPlayModal] = useState(false);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showLeaderboardsModal, setShowLeaderboardsModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(currentPath === '/deposit/' || currentPath === '/deposit');
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showNegativeBalanceDialog, setShowNegativeBalanceDialog] = useState(false);
  const [walletConflictOpen, setWalletConflictOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [blurValue, setBlurValue] = useState(3);
  const [currentGif, setCurrentGif] = useState('');
  const [tokenModalOpen, setTokenModalOpen] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [websiteLoading, setWebsiteLoading] = useState(true);
  const [isCoinsAnimation, setIsCoinsAnimation] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [showDebtsModal, setShowDebtsModal] = useState(false);
  const [bonusCheck, setBonusCheck] = useState(false);
  const [remainingLoans, setRemainingLoans] = useState(propsRemainingLoans);
  const [highlightedRooms, setHighlightedRooms] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [walletAddress, setWalletAddress] = useState(connectedAccount);
  const [solanaBalance, setSolanaBalance] = useState(0);
  const [account, setAccount] = useState(null);
  const [showAllGameLogs, setShowAllGameLogs] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);

  // Audio Refs
  const notificationSoundRef = useRef(null);
  const needALoanRef = useRef(null);

  const intervalRef = useRef(null);
  const isUnmountedRef = useRef(false);

  // Initialize app on mount
  useEffect(() => {
    isUnmountedRef.current = false;

    const doMount = async () => {
      dispatch(getGlobalChatLogs());
      setWebsiteLoading(true);
      setIsInvestorsPage(location.pathname.startsWith('/investors'));
      setIsPlayer(location.pathname.startsWith('/play'));
      dispatch(getHistory());
      document.addEventListener('mousedown', handleClickOutside);

      try {
        await Promise.all([
          dispatch(getNotifications()),
          dispatch(getUser()),
          initializeAudio(),
          dispatch(acCalculateRemainingLoans()),
        ]);
        setWebsiteLoading(false);
      } catch (error) {
        console.error('Mount error:', error);
      }

      intervalRef.current = setInterval(() => {
        updateReminderTime();
      }, 3000);

      loadSolanaWallet();

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
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dispatch]);

  // Check for tutorial completion
  useEffect(() => {
    if (user && user.completedTutorials) {
      setRunTutorial(!user.completedTutorials.includes(1));
    }
  }, [user]);

  // Update remaining loans
  useEffect(() => {
    setRemainingLoans(propsRemainingLoans);
  }, [propsRemainingLoans]);

  // Check for negative balance
  useEffect(() => {
    setShowNegativeBalanceDialog(propsBalance < 0);
  }, [propsBalance]);

  // Update transactions
  useEffect(() => {
    if (propTransactions?.length > 0) {
      setTransactions(updateFromNow(propTransactions));
    }
  }, [propTransactions]);

  // Update local balance
  useEffect(() => {
    setLocalBalance(propsBalance);
  }, [propsBalance]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = socketIOClient(endpoint, { transports: ['websocket'] });

    // Socket event handlers
    const handleOnlineStatusUpdated = data => dispatch(updateOnlineUserList(data.user_list));
    newSocket.on('ONLINE_STATUS_UPDATED', handleOnlineStatusUpdated);

    let lastGlobalChat = null;
    const handleGlobalChat = data => {
      if (
        lastGlobalChat &&
        lastGlobalChat.senderId === data.senderId &&
        lastGlobalChat.time === data.time &&
        lastGlobalChat.message === data.message
      ) {
        return;
      }
      lastGlobalChat = data;
      dispatch(globalChatReceived(data));
    };
    newSocket.on('GLOBAL_CHAT_RECEIVED', handleGlobalChat);

    const handleUpdatedRoomList = data => {
      dispatch(setRoomList(data));
      dispatch(endLoading());
    };
    newSocket.on('UPDATED_ROOM_LIST', handleUpdatedRoomList);

    const handleRoomEnded = data => dispatch(removeRoomFromList(data.roomId));
    newSocket.on('ROOM_ENDED', handleRoomEnded);

    dispatch(setSocket(newSocket));

    return () => {
      newSocket.off('GLOBAL_CHAT_RECEIVED', handleGlobalChat);
      newSocket.off('UPDATED_ROOM_LIST', handleUpdatedRoomList);
      newSocket.off('ROOM_ENDED', handleRoomEnded);
      newSocket.off('ONLINE_STATUS_UPDATED', handleOnlineStatusUpdated);
      newSocket.disconnect();
    };
  }, [dispatch, endpoint]);

  // Handle user-specific socket events
  useEffect(() => {
    if (!socket || !user || !user._id) return;

    socket.emit('STORE_CLIENT_USER_ID', { user_id: user._id });

    // Chat events
    const handleSendChat = data => {
      if (!isMuted || !notificationSounds) {
        notificationSoundRef.current?.play();
      }
      dispatch(addChatLog(data));

      const pathName = location.pathname;
      const segments = pathName.split('/');
      const chatUserId = segments[2];

      if (pathName.startsWith('/chat/') && chatUserId === data.from) {
        socket.emit('READ_MESSAGE', { to: user._id, from: data.from });
      } else {
        socket.emit('REQUEST_UNREAD_MESSAGE_COUNT', { to: user._id });
      }
    };
    socket.on('SEND_CHAT', handleSendChat);

    // Loan events
    const handleLoanOffer = payload => {
      dispatch(openOfferLoanModal());
      if (!isMuted) {
        needALoanRef.current?.play();
      }
      dispatch(
        setCurrentOfferTargetInfo({
          _id: user._id,
          lender: payload.lender,
          avatar: payload.avatar,
          accessory: payload.accessory,
          username: payload.username,
          totalWagered: payload.totalWagered,
        })
      );
    };
    socket.on(`RECEIVED_LOAN_OFFER_${user._id}`, handleLoanOffer);

    // Bet events
    const handleBetResult = data => dispatch(updateBetResult(data));
    socket.on('UPDATE_BET_RESULT', handleBetResult);

    // Notification events
    const handleSendNotification = data => {
      if (!isMuted || !notificationSounds) {
        notificationSoundRef.current?.play();
      }
      if (isNotificationsAllowed && window.Notification) {
        const options = { body: data.message, silent: false };
        if (Notification.permission === 'granted') {
          new Notification('New Notification', options);
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              dispatch(setNotificationsAllowed(true));
              new Notification('New Notification', options);
            }
          });
        }
      }
      dispatch(addNewNotification(data));
    };
    socket.on('SEND_NOTIFICATION', handleSendNotification);

    // Transaction events
    const handleAddTransaction = data => dispatch(addNewTransaction(data));
    socket.on('NEW_TRANSACTION', handleAddTransaction);

    // Unread message count
    const handleUnreadCount = countData => dispatch(setUnreadMessageCount(countData));
    socket.on('SET_UNREAD_MESSAGE_COUNT', handleUnreadCount);

    return () => {
      socket.off('SEND_CHAT', handleSendChat);
      socket.off(`RECEIVED_LOAN_OFFER_${user._id}`, handleLoanOffer);
      socket.off('UPDATE_BET_RESULT', handleBetResult);
      socket.off('SEND_NOTIFICATION', handleSendNotification);
      socket.off('NEW_TRANSACTION', handleAddTransaction);
      socket.off('SET_UNREAD_MESSAGE_COUNT', handleUnreadCount);
    };
  }, [dispatch, socket, user, isMuted, notificationSounds, isNotificationsAllowed, location.pathname]);

  // Utility functions
  const handleClickOutside = useCallback(() => {
    if (anchorElProfile) {
      setAnchorElProfile(null);
    }
  }, [anchorElProfile]);

  const updateReminderTime = useCallback(
    debounce(() => {
      setTransactions(prev => updateFromNow(prev));
    }, 300),
    []
  );

  const initializeAudio = useCallback(async () => {
    try {
      notificationSoundRef.current = new Audio('/sounds/notification.mp3');
      needALoanRef.current = new Audio('/sounds/need_a_loan.mp3');

      await notificationSoundRef.current.load();
      await needALoanRef.current.load();

    } catch (error) {
      console.log('Audio initialization error:', error);
    }
  }, []);

  // Wallet functionality
  const loadSolanaWallet = useCallback(async () => {
    try {
      if (window.solana && window.solana.isPhantom) {
        await window.solana.connect();
        const wAddress = window.solana.publicKey.toString();

        const { success, message } = await dispatch(checkAndAddWalletAddress(wAddress));
        if (!success && user?._id !== null) {
          console.warn('Wallet conflict:', message);
          setWalletConflictOpen(true);
          return;
        }

        const response = await axios.get('/stripe/get_provider_url');
        const providerUrl = response.data.providerUrl;
        const solanaConnection = new Connection(providerUrl, 'confirmed');
        const solBalLamports = await solanaConnection.getBalance(new PublicKey(wAddress));
        const solBalance = solBalLamports / LAMPORTS_PER_SOL;

        setWalletAddress(wAddress);
        setAccount({ publicKey: new PublicKey(wAddress) });
        setSolanaBalance(solBalance);
      }
    } catch (error) {
      console.error('Failed to connect Phantom or fetch SOL balance:', error);
    }
  }, [dispatch, user]);

  const disconnectWeb3 = useCallback(() => {
    setWalletAddress(null);
    setSolanaBalance(0);
    dispatch(disconnectWalletAddress());
  }, [dispatch]);

  // Modal handlers
  const handleCloseConflictDialog = () => setWalletConflictOpen(false);
  const handleOpenProfileMenu = e => setAnchorElProfile(e.currentTarget);
  const handleCloseProfileMenu = () => setAnchorElProfile(null);
  const handleNotificationsClick = e => setAnchorElNotifications(e.currentTarget);

  const handleCloseNotifications = () => {
    dispatch(readNotifications());
    setAnchorElNotifications(null);
  };

  const handleBalanceClick = e => setAnchorElGameLog(e.currentTarget);
  const handleCloseGameLog = () => setAnchorElGameLog(null);
  const handleMouseEnter = index => setHoverTabIndex(index);
  const handleMouseLeave = () => setHoverTabIndex(-1);
  const toggleAllTransactions = () => setShowAllGameLogs(prev => !prev);

  const handleLogout = clearToken => {
    setWalletAddress(null);
    setSolanaBalance(null);
    setAnchorElProfile(null);
    if (socket) socket.disconnect();
    dispatch(userSignOut(clearToken, navigate));
  };

  // Modal toggle handlers
  const toggleModal = (setter, value = null) => setter(value === null ? prev => !prev : value);

  const handleOpenProfileModal = () => {
    setShowProfileModal(true);
    setAnchorElProfile(null);
  };

  const handleCloseProfileModal = () => setShowProfileModal(false);

  const handleOpenPlayerModal = creatorId => {
    setShowPlayerModal(true);
    setSelectedCreator(creatorId);
  };

  const handleClosePlayerModal = () => setShowPlayerModal(false);
  const handleOpenHowToPlayModal = () => setShowHowToPlayModal(true);
  const handleCloseHowToPlayModal = () => setShowHowToPlayModal(false);
  const handleOpenMarketplaceModal = () => setShowMarketplaceModal(true);
  const handleCloseMarketplaceModal = () => setShowMarketplaceModal(false);
  const handleOpenBankModal = () => setShowBankModal(true);
  const handleCloseBankModal = () => setShowBankModal(false);
  const handleOpenLeaderboardsModal = () => setShowLeaderboardsModal(true);
  const handleCloseLeaderboardsModal = () => setShowLeaderboardsModal(false);
  const handleOpenLoginModal = () => setShowLoginModal(true);
  const handleCloseLoginModal = () => setShowLoginModal(false);
  const handleOpenSignupModal = () => setShowSignupModal(true);
  const handleCloseSignupModal = () => setShowSignupModal(false);

  const handleOpenDepositModal = () => {
    setShowDepositModal(true);
    setAnchorElProfile(null);
  };

  const handleCloseDepositModal = () => setShowDepositModal(false);

  const handleOpenWithdrawModal = () => {
    setShowWithdrawModal(true);
    setAnchorElProfile(null);
  };

  const handleCloseWithdrawModal = () => setShowWithdrawModal(false);

  const handleOpenInventoryModal = () => {
    setShowInventoryModal(true);
    setAnchorElProfile(null);
  };

  const handleCloseInventoryModal = () => setShowInventoryModal(false);

  const handleOpenVaultModal = () => {
    setShowVaultModal(true);
    setAnchorElProfile(null);
  };

  const handleCloseVaultModal = () => setShowVaultModal(false);
  const handleOpenDebtsModal = () => setShowDebtsModal(true);
  const handleCloseDebtsModal = () => setShowDebtsModal(false);
  const handleOpenSettingsModal = () => setShowSettingsModal(true);
  const handleCloseSettingsModal = () => setShowSettingsModal(false);
  const handleBonusModal = () => setShowBonusModal(true);
  const handleCloseBonusModal = () => setShowBonusModal(false);
  const closeTokenModal = () => setTokenModalOpen(false);

  const handlePortfolio = () => {
    navigate('/portfolio');
    dispatch(selectMainTab(1));
  };

  // Helper function for notification messages
  function appendCurrencyBracket(message, amount) {
    if (!amount) return message;
    const amountStr = String(amount);
    const currencyStr = convertToCurrency(amount, solPrice);
    return message + ` (${currencyStr}) / ${amountStr} SOL`;
  }

  // UI helpers
  const width = window.innerWidth;
  const notificationsArray = updateFromNow(notifications);
  const unreadNotificationsCount = notificationsArray?.filter(n => !n.is_read).length || 0;

  const balanceString = balance?.toString() || '0';
  const decimalIndex = balanceString.indexOf('.');
  const numDecimals = decimalIndex !== -1 ? Math.min(2, balanceString.length - decimalIndex - 1) : 0;

  const halloween = new Date(`${new Date().getFullYear()}-02-14T00:00:00`);
  const currentDate = new Date();
  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : mainTheme}>
      {showCookieConsent && <CookieConsent />}
      <Dialog
        open={showNegativeBalanceDialog}
        disableEscapeKeyDown
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
          onClick: (e) => e.stopPropagation(),
        }}
        PaperProps={{
          sx: {
            backgroundColor: '#2D3A4B',
            color: '#fff',
          },
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          Account Under Review
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ color: '#fff' }}>
            Your profile is currently under review due to breaking our terms of service.
            We cannot give any details at this moment. Your balance is to be negative
            during this verification period.
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc', mt: 1 }}>
            Need assistance? Contact us via:
          </Typography>
          <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<FontAwesomeIcon icon={faXTwitter} />}
              onClick={() => window.open("https://x.com/rpsdotgame", "_blank")}
            >
              X
            </Button>
            <Button
              variant="contained"
              color="info"
              startIcon={<FontAwesomeIcon icon={faTelegram} />}
              onClick={() => window.open("https://t.me/rpsgamesol", "_blank")}
            >
              Telegram
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<EmailIcon />}
              onClick={() => window.open("mailto:inv_inquiries@rps.game")}
            >
              Email
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
      {isLive && tokenModalOpen && (
        <Suspense fallback={''}>
          <CatsinoModalOverlay
            currentGif={currentGif}
            blurValue={blurValue}
            halloween={halloween}
            handleCountdownButtonClick={() => {
              navigate('/investors');
              closeTokenModal();
            }}
            handleYoutubeButtonClick={() => {
              handleOpenLoginModal();
              closeTokenModal();
            }}
          />
        </Suspense>
      )}

      <div className={`site_wrapper ${isDarkMode ? 'dark_mode' : ''}`}>
        {/* Header and rest of the JSX remains unchanged */}
        <div className="game_header">
          <div className="main_header">
            <Box>
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
              <a
                href="#"
                style={{
                  position: "relative",
                  fontWeight: "400",
                  marginLeft: '20px'
                }}
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenHowToPlayModal();
                }}
              >
                [ how it works ]
              </a>
            </Box>


            {!isInvestorsPage ? (
              <Suspense fallback={<Typography>Loading History...</Typography>}>
                <HistoryTable userId={user?._id} />
              </Suspense>
            ) : (
              <div style={{ padding: width < 600 ? '0' : '48px' }} />
            )}

            <div className="header_action_panel">
              {user ? (
                <>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Skeleton variant="text" sx={{ width: '80px' }} />
                  <Skeleton variant="rectangular" sx={{ width: '10px', height: '30px' }} />
                  <Skeleton variant="circular" width={40} height={40} />
                </Box>
              ) : user?._id ? (
                <>
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

                  <Button
                    aria-controls="profile-menu"
                    aria-haspopup="true"
                    onClick={handleOpenProfileMenu}
                    className="profile-menu"
                  >
                    <Avatar
                      src={user.avatar}
                      user_id={user._id}
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
                        backgroundColor: '#2D3A4B',
                        color: '#fff',
                        '& .MuiMenuItem-root': {
                          textTransform: 'none',
                          color: 'inherit',
                          '&:hover': {
                            backgroundColor: '#D32F2F',
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
                    <MenuItem onClick={handleOpenHowToPlayModal}>
                      <ListItemIcon>
                        <Help />
                      </ListItemIcon>
                      <ListItemText>HOW IT WORKS</ListItemText>
                    </MenuItem>
                    <Divider />
                    <MenuItem
                      onClick={() => {
                        window.open('https://raydium.io/swap/?inputMint=sol&outputMint=BBDULAQQBG1UYBK9ay7hSf1Arfhme4jnugxwzjbipump', '_blank');
                      }}
                    >
                      <ListItemIcon>
                        <MonetizationOn fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>BUY $RPS 🚀</ListItemText>
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
                backgroundColor: '#2D3A4B',
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
                backgroundColor: '#2D3A4B',
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
                notificationsArray.map((notification, index) => {
                  const processedMessage = appendCurrencyBracket(
                    notification.message,
                    notification.amount
                  );

                  return (
                    <Box key={index}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'flex-start',
                          py: 1.5
                        }}
                        className={`notification-container ${notification.is_read ? 'read' : ''}`}
                      >
                        <a
                          className="player"
                          onClick={() => handleOpenPlayerModal(notification._id)}
                          style={{ display: 'flex', flexDirection: 'row' }}
                        >
                          <Avatar
                            user_id={notification._id}
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
                              __html: processedMessage
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
                  );
                })
              ) : (
                <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                  No notifications available.
                </Typography>
              )}
            </Box>
          </Popover>

          {showAllGameLogs && (
            <Suspense fallback={<Typography>Loading Transactions...</Typography>}>
              <AllTransactionsModal
                modalIsOpen={showAllGameLogs}
                isDarkMode={isDarkMode}
                close={toggleAllTransactions}
                user={user?._id}
                solPrice={solPrice}
                transactions={transactions}
              />
            </Suspense>
          )}

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
                backgroundColor: '#2D3A4B',
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
                  borderColor: '#607D8B'
                },
                '& #wallet-address': {
                  backgroundColor: '#2D3A4B',
                  color: '#fff',
                  border: '1px solid #607D8B',
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
                      <Box component="span" sx={{ fontWeight: 'bold', color: '#28a745' }}>
                        winning amount
                      </Box>
                      {' - '}
                      <Box component="span" sx={{ fontWeight: 'bold', color: '#D32F2F' }}>
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

            <TableContainer component={Paper} style={{ backgroundColor: '#2D3A4A', marginBottom: '15px' }} elevation={0}>
              <Table aria-label="a dense table" size="small">
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell>...</TableCell>
                    </TableRow>
                  ) : (
                    transactions.slice(0, 5).map((row, key) => {
                      const clickable = row.hash && row.hash.length !== 10 && row.status !== 'processing';
                      const isPositive = row.amount > 0;

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
                              backgroundColor: clickable ? 'rgba(255,255,255,0.05)' : 'inherit'
                            }
                          }}
                        >
                          <TableCell className={isPositive ? 'green-text' : 'red-text'}>
                            {isPositive
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
            </TableContainer>
            <Button
              color="error"
              variant="outlined"
              onClick={toggleAllTransactions}
              sx={{
                '&:hover': {
                  backgroundColor: 'error.main',
                  color: '#fff'
                },
                width: '100%'
              }}
            >
              ALL TRANSACTIONS
            </Button>

            <Box
              sx={{
                mt: 2,
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1,
              }}
            >
              <Button
                color="error"
                variant="outlined"
                onClick={handleOpenInventoryModal}
                startIcon={<Inventory2Outlined />}
                sx={{ '&:hover': { backgroundColor: 'error.main', color: '#fff' } }}
              >
                Inventory
              </Button>
              <Button
                color="error"
                variant="outlined"
                onClick={handleOpenVaultModal}
                startIcon={<SavingsOutlined />}
                sx={{ '&:hover': { backgroundColor: 'error.main', color: '#fff' } }}
              >
                Vault
              </Button>
              <Button
                color="error"
                variant="outlined"
                onClick={handleOpenDepositModal}
                startIcon={<AccountBalanceWalletOutlined />}
                sx={{ '&:hover': { backgroundColor: 'error.main', color: '#fff' } }}
              >
                Deposit
              </Button>
              {remainingLoans > 0 ? (
                <Button
                  color="error"
                  variant="outlined"
                  onClick={handleOpenDebtsModal}
                  startIcon={<MoneyOffCsredOutlined />}
                  sx={{ '&:hover': { backgroundColor: 'error.main', color: '#fff' } }}
                >
                  {convertToCurrency(remainingLoans, solPrice)} IN DEBT
                </Button>
              ) : (
                <Button
                  color="error"
                  variant="outlined"
                  onClick={handleOpenWithdrawModal}
                  startIcon={<AttachMoneyOutlined />}
                  sx={{ '&:hover': { backgroundColor: 'error.main', color: '#fff' } }}
                >
                  Withdraw
                </Button>
              )}
            </Box>
            {connectedAccount ? (
              <Box sx={{ mt: 2 }}>
                <input id="wallet-address" type="text" value={connectedAccount} readOnly />
                <Button
                  color="error"
                  variant="outlined"
                  onClick={disconnectWeb3}
                  fullWidth
                  sx={{ '&:hover': { backgroundColor: 'error.main', color: '#fff' }, mt: 1 }}
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
                sx={{ '&:hover': { backgroundColor: 'error.main', color: '#fff' }, mt: 2 }}
              >
                CONNECT WALLET
              </Button>
            )}
          </Popover>
        </div>

        <ConflictDialog open={walletConflictOpen} onClose={handleCloseConflictDialog} />

        <div className="game_wrapper">
          <div className="contents_wrapper">{children}</div>
        </div>

        {showProfileModal && (
          <Suspense fallback={<Typography>Loading Profile...</Typography>}>
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
          </Suspense>
        )}
        {showPlayerModal && (
          <Suspense fallback={<Typography>Loading Player...</Typography>}>
            <PlayerModal
              selectedCreator={selectedCreator}
              modalIsOpen={showPlayerModal}
              closeModal={handleClosePlayerModal}
            />
          </Suspense>
        )}
        {showSettingsModal && (
          <Suspense fallback={<Typography>Loading Settings...</Typography>}>
            <SettingsModal
              modalIsOpen={showSettingsModal}
              closeModal={handleCloseSettingsModal}
              handleMute={() => {

                needALoanRef.current.muted = true;
                notificationSoundRef.current.muted = true;
              }}
              handleUnmute={() => {

                needALoanRef.current.muted = false;
                notificationSoundRef.current.muted = false;
              }}
            />
          </Suspense>
        )}
        {showBonusModal && (
          <Suspense fallback={<Typography>Loading Bonus...</Typography>}>
            <BonusModal
              modalIsOpen={showBonusModal}
              closeModal={handleCloseBonusModal}
              user={user}
              solPrice={solPrice}
            />
          </Suspense>
        )}
        {showLeaderboardsModal && (
          <Suspense fallback={<Typography>Loading Leaderboards...</Typography>}>
            <LeaderboardsModal
              modalIsOpen={showLeaderboardsModal}
              closeModal={handleCloseLeaderboardsModal}
              player_name={userName}
              balance={balance}
              isDarkMode={isDarkMode}
            />
          </Suspense>
        )}
        {showHowToPlayModal && (
          <Suspense fallback={<Typography>Loading How To Play...</Typography>}>
            <HowToPlayModal
              modalIsOpen={showHowToPlayModal}
              closeModal={handleCloseHowToPlayModal}
              player_name={userName}
              balance={balance}
              isDarkMode={isDarkMode}
            />
          </Suspense>
        )}
        {showBankModal && (
          <Suspense fallback={<Typography>Loading Bank...</Typography>}>
            <BankModal
              modalIsOpen={showBankModal}
              closeModal={handleCloseBankModal}
              player_name={userName}
              balance={balance}
              isDarkMode={isDarkMode}
              remainingLoans={remainingLoans}
            />
          </Suspense>
        )}
        {showMarketplaceModal && (
          <Suspense fallback={<Typography>Loading Marketplace...</Typography>}>
            <MarketplaceModal
              modalIsOpen={showMarketplaceModal}
              closeModal={handleCloseMarketplaceModal}
              player_name={userName}
              balance={balance}
              isDarkMode={isDarkMode}
            />
          </Suspense>
        )}
        {showLoginModal && (
          <Suspense fallback={<Typography>Loading Login...</Typography>}>
            <LoginModal
              modalIsOpen={showLoginModal}
              closeModal={handleCloseLoginModal}
              openSignupModal={handleOpenSignupModal}
            />
          </Suspense>
        )}
        {showDebtsModal && (
          <Suspense fallback={<Typography>Loading Debts...</Typography>}>
            <DebtsModal
              modalIsOpen={showDebtsModal}
              closeModal={handleCloseDebtsModal}
              openDebtsModal={handleOpenDebtsModal}
            />
          </Suspense>
        )}
        {showSignupModal && (
          <Suspense fallback={<Typography>Loading Signup...</Typography>}>
            <SignupModal
              modalIsOpen={showSignupModal}
              closeModal={handleCloseSignupModal}
              openLoginModal={handleOpenLoginModal}
            />
          </Suspense>
        )}
        {showDepositModal && (
          <Suspense fallback={<Typography>Loading Deposit...</Typography>}>
            <DepositModal
              modalIsOpen={showDepositModal}
              closeModal={handleCloseDepositModal}
              web3={null}
              loadSolanaWallet={loadSolanaWallet}
              balance={solanaBalance}
              account={account}
            />
          </Suspense>
        )}
        {showInventoryModal && (
          <Suspense fallback={<Typography>Loading Inventory...</Typography>}>
            <InventoryModal
              modalIsOpen={showInventoryModal}
              closeModal={handleCloseInventoryModal}
            />
          </Suspense>
        )}
        {showVaultModal && (
          <Suspense fallback={<Typography>Loading Vault...</Typography>}>
            <VaultModal
              modalIsOpen={showVaultModal}
              closeModal={handleCloseVaultModal}
              conversionRate={solPrice}
              isDarkMode={isDarkMode}
            />
          </Suspense>
        )}
        {showWithdrawModal && (
          <Suspense fallback={<Typography>Loading Withdraw...</Typography>}>
            <WithdrawModal
              modalIsOpen={showWithdrawModal}
              closeModal={handleCloseWithdrawModal}
              balance={balance}
              web3={null}
              account={account}
            />
          </Suspense>
        )}
        <Suspense fallback={''}>
          <ListItemModal />
        </Suspense>
        <Suspense fallback={''}>
          <DeListItemModal />
        </Suspense>
        <Suspense fallback={''}>
          <ConfirmTradeModal />
        </Suspense>
        <Suspense fallback={''}>
          <DeListLoanModal />
        </Suspense>
        <Suspense fallback={''}>
          <ConfirmLoanModal />
        </Suspense>
        <Suspense fallback={''}>
          <OfferLoanModal solPrice={solPrice} socket={socket} />
        </Suspense>
        <Suspense fallback={''}>
          <GamePasswordModal />
        </Suspense>
      </div>
    </ThemeProvider>
  );
}

export default SiteWrapper;