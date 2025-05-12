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
  Chip,
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faTelegram, faYoutube, faTiktok } from '@fortawesome/free-brands-svg-icons';
import { faCoins } from '@fortawesome/free-solid-svg-icons';

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
} from '@mui/icons-material';
import socketIOClient from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../components/Avatar';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

import {
  // acCalculateRemainingLoans,
  setCurrentOfferTargetInfo
} from '../redux/Loan/loan.action';

import CookieConsent from '../util/cookieConsent';
import { convertToCurrency } from '../util/conversion';
import {
  setSocket,
  userSignOut,
  getUser,
  setUnreadMessageCount,
  setNotificationsAllowed,
  checkAndAddWalletAddress,
  disconnectWalletAddress,
} from '../redux/Auth/user.actions';
import {
  openOfferLoanModal
} from '../redux/Notification/notification.actions';
import { ConflictDialog } from './modal/ConfirmAlerts.jsx';
import {
  setRoomList,
  addChatLog,
  addNewTransaction,
  addNewNotification,
  updateOnlineUserList,
  selectMainTab,
  globalChatReceived,
  setSolanaAccount,
  setSolanaBalance,
  updateBetResult,
  getNotifications,
  readNotifications,
  removeRoomFromList,
  getGlobalChatLogs,
  getHistory,
  endLoading,
} from '../redux/Logic/logic.actions';

// Lazy-loaded components
const HistoryTable = lazy(() => import('../game_panel/LiveGames/HistoryTable.jsx'));
const SettingsModal = lazy(() => import('./modal/SettingsModal.jsx'));
const BonusModal = lazy(() => import('./modal/BonusModal.jsx'));
const AllTransactionsModal = lazy(() => import('./modal/AllTransactionsModal.jsx'));
const ProfileModal = lazy(() => import('./modal/ProfileModal'));
const PlayerModal = lazy(() => import('./modal/PlayerModal'));
const HowToPlayModal = lazy(() => import('./modal/HowToPlayModal'));;
const LeaderboardsModal = lazy(() => import('./modal/LeaderboardsModal'));
const GamePasswordModal = lazy(() => import('./modal/GamePasswordModal'));
const LoginModal = lazy(() => import('./modal/LoginModal'));
const EliteSubscriptionModal = lazy(() => import('./modal/EliteSubscriptionModal'));

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

function updateFromNow(items, timestampField = 'created_at') {
  if (!items) return [];

  // Deep clone items to avoid mutating the original array
  const result = JSON.parse(JSON.stringify(items));

  for (let i = 0; i < result.length; i++) {
    if (result[i][timestampField]) {
      const fromNow = formatDistanceToNow(new Date(result[i][timestampField]), { addSuffix: true });

      if (fromNow === 'less than a minute ago') {
        result[i]['from_now'] = 'just now';
      } else {
        result[i]['from_now'] = fromNow
          .replace('less than a minute', 'a few s')
          .replace('about ', '')
          .replace(' seconds', 's')
          .replace(' minutes', 'm')
          .replace(' hours', 'h')
          .replace(' days', 'd')
          .replace(' weeks', 'w')
          .replace(' months', 'mo')
          .replace(' years', 'y')
          .replace('a second', '1s')
          .replace('a minute', '1m')
          .replace('an hour', '1h')
          .replace('a day', '1d')
          .replace('a week', '1w')
          .replace('a month', '1mo')
          .replace('a year', '1y')
          .replace(' ago', '');
      }
    }
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

  // Split useSelector calls
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const user = useSelector((state) => state.auth.user);
  const userName = useSelector((state) => state.auth.userName);
  const balance = useSelector((state) => state.auth.balance);
  const solanaBalance = useSelector((state) => state.logic.solanaBalance);
  const solPrice = useSelector((state) => state.logic.solPrice);
  const socket = useSelector((state) => state.auth.socket);
  const transactions = useSelector((state) => state.auth.transactions);
  const notifications = useSelector((state) => state.logic.notifications);
  const isNotificationsAllowed = useSelector((state) => state.auth.isNotificationsAllowed);
  const isMuted = useSelector((state) => state.auth.isMuted);
  const notificationSounds = useSelector((state) => state.auth.notificationSounds);
  const isLowGraphics = useSelector((state) => state.auth.isLowGraphics);
  const showCookieConsent = useSelector((state) => state.auth.showCookieConsent);
  const remainingLoans = useSelector((state) => state.loanReducer.remainingLoans);
  const connectedAccount = useSelector((state) => state.auth.connectedAccount);
  const account = useSelector((state) => state.logic.account);


  // Local state
  const currentPath = window.location.pathname;
  const [endpoint, setEndpoint] = useState(
    process.env.NODE_ENV === 'production'
      ? 'https://catsino.fun'
      : `http://${window.location.hostname}:5001`
  );

  const [hoverTabIndex, setHoverTabIndex] = useState(-1);
  const [anchorElProfile, setAnchorElProfile] = useState(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);
  const [anchorElGameLog, setAnchorElGameLog] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showHowToPlayModal, setShowHowToPlayModal] = useState(false);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showLeaderboardsModal, setShowLeaderboardsModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showNegativeBalanceDialog, setShowNegativeBalanceDialog] = useState(false);
  const [walletConflictOpen, setWalletConflictOpen] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [websiteLoading, setWebsiteLoading] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [showDebtsModal, setShowDebtsModal] = useState(false);
  const [eliteModalOpen, setEliteModalOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState(connectedAccount);
  const [showAllGameLogs, setShowAllGameLogs] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [isRestrictedCountry, setIsRestrictedCountry] = useState(false);

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
      dispatch(getHistory());
      document.addEventListener('mousedown', handleClickOutside);

      try {
        await Promise.all([
          dispatch(getUser()),
          dispatch(getNotifications()),
          initializeAudio(),
          // dispatch(acCalculateRemainingLoans()),
        ]);
        setWebsiteLoading(false);
      } catch (error) {
        console.error('Mount error:', error);
      }

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

  useEffect(() => {
    setShowNegativeBalanceDialog(balance < 0);
  }, [balance]);

  useEffect(() => {
    const newSocket = socketIOClient(endpoint, {
      transports: ['websocket'],
      withCredentials: true,
    });

    // Promise to wait for socket connection
    const waitForConnection = new Promise((resolve, reject) => {
      newSocket.on('connect', () => {
        resolve();
      });
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });
    });

    // Set up event listeners
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
    newSocket.on('ROOMS_UPDATED', handleUpdatedRoomList);

    const handleRoomEnded = data => dispatch(removeRoomFromList(data.roomId));
    newSocket.on('ROOM_ENDED', handleRoomEnded);

    // Wait for connection before dispatching socket
    waitForConnection
      .then(() => {
        dispatch(setSocket(newSocket));
      })
      .catch(error => {
        console.error('Failed to connect socket:', error);
      });

    return () => {
      newSocket.off('GLOBAL_CHAT_RECEIVED', handleGlobalChat);
      newSocket.off('ROOMS_UPDATED', handleUpdatedRoomList);
      newSocket.off('ROOM_ENDED', handleRoomEnded);
      newSocket.off('ONLINE_STATUS_UPDATED', handleOnlineStatusUpdated);
      newSocket.disconnect();
    };
  }, [dispatch, endpoint]);


  const fetchSolanaBalance = useCallback(async (walletAddress) => {
    try {
      const response = await axios.get('/stripe/get_provider_url');
      const providerUrl = response.data.providerUrl;
      const solanaConnection = new Connection(providerUrl, 'confirmed');
      const solBalLamports = await solanaConnection.getBalance(new PublicKey(walletAddress));
      const solBalance = solBalLamports / LAMPORTS_PER_SOL;
      dispatch(setSolanaBalance({ solanaBalance: solBalance }));
      return solBalance;
    } catch (error) {
      console.error('Failed to fetch Solana balance:', error);
      return null;
    }
  }, [dispatch]);

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
          elite: payload.elite,
          username: payload.username,
          totalWagered: payload.totalWagered,
        })
      );
    };
    socket.on(`RECEIVED_LOAN_OFFER_${user._id}`, handleLoanOffer);

    // Bet events
    const handleBetResult = data => dispatch(updateBetResult(data));
    socket.on('UPDATE_BET_RESULT', handleBetResult);

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

    const handleAddTransaction = async (data) => {
      dispatch(addNewTransaction(data));
      if (
        connectedAccount &&
        data.user === user._id &&
        data.status === 'completed' &&
        (data.description.startsWith('Joined') || data.description.startsWith('Pumped'))
      ) {
        await fetchSolanaBalance(connectedAccount);
      }
    };

    socket.on('NEW_TRANSACTION', handleAddTransaction);

    const handleBalanceUpdate = (data) => {
      if (data.solanaBalance !== undefined) {
        dispatch(setSolanaBalance({ solanaBalance: data.solanaBalance }));
      }
    };
    socket.on('UPDATE_SOLANA_BALANCE', handleBalanceUpdate);


    // Unread message count
    const handleUnreadCount = countData => dispatch(setUnreadMessageCount(countData));
    socket.on('SET_UNREAD_MESSAGE_COUNT', handleUnreadCount);

    return () => {
      socket.off('SEND_CHAT', handleSendChat);
      socket.off(`RECEIVED_LOAN_OFFER_${user._id}`, handleLoanOffer);
      socket.off('UPDATE_BET_RESULT', handleBetResult);
      socket.off('SEND_NOTIFICATION', handleSendNotification);
      socket.off('NEW_TRANSACTION', handleAddTransaction);
      socket.off('UPDATE_SOLANA_BALANCE', handleBalanceUpdate);
      socket.off('SET_UNREAD_MESSAGE_COUNT', handleUnreadCount);
    };
  }, [
    dispatch,
    socket,
    user,
    isMuted,
    notificationSounds,
    isNotificationsAllowed,
    location.pathname,
    connectedAccount,
    fetchSolanaBalance
  ]);

  // Utility functions
  const handleClickOutside = useCallback(() => {
    if (anchorElProfile) {
      setAnchorElProfile(null);
    }
  }, [anchorElProfile]);

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

        setWalletAddress(wAddress);
        dispatch(setSolanaAccount({ publicKey: new PublicKey(wAddress) }));
        await fetchSolanaBalance(wAddress);
      }
    } catch (error) {
      console.error('Failed to connect Phantom or fetch SOL balance:', error);
    }
  }, [dispatch, user, fetchSolanaBalance]);

  const disconnectWeb3 = useCallback(() => {
    setWalletAddress(null);
    dispatch(setSolanaBalance(null));
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
  const handleOpenBankModal = () => setShowBankModal(true);
  const handleCloseBankModal = () => setShowBankModal(false);
  const handleOpenLeaderboardsModal = () => setShowLeaderboardsModal(true);
  const handleCloseLeaderboardsModal = () => setShowLeaderboardsModal(false);
  const handleOpenLoginModal = () => setShowLoginModal(true);
  const handleCloseLoginModal = () => setShowLoginModal(false);
  const handleOpenEliteSubscriptionModal = () => {
    setEliteModalOpen(true);
  };
  const handleCloseEliteSubscriptionModal = () => {
    setEliteModalOpen(false);
  };
  const handleOpenSettingsModal = () => setShowSettingsModal(true);
  const handleCloseSettingsModal = () => setShowSettingsModal(false);
  const handleBonusModal = () => setShowBonusModal(true);
  const handleCloseBonusModal = () => setShowBonusModal(false);
  const closeTokenModal = () => setTokenModalOpen(false);

  const handlePortfolio = () => {
    navigate('/portfolio');
    dispatch(selectMainTab(1));
  };

  function appendCurrencyBracket(message, amount) {
    if (!amount) return message;
    const amountStr = String(amount);
    const currencyStr = convertToCurrency(amount, solPrice);
    return message + ` (${currencyStr}) / ${amountStr} SOL`;
  }

  // UI helpers
  const width = window.innerWidth;
  const notificationsArray = updateFromNow(notifications);
  const transactionsArray = updateFromNow(transactions, 'created_at'); // Replace 'created_at' with the correct field if needed
  const unreadNotificationsCount = notificationsArray?.filter(n => !n.is_read).length || 0;

  const balanceString = balance?.toString() || '0';
  const decimalIndex = balanceString.indexOf('.');
  const numDecimals = decimalIndex !== -1 ? Math.min(2, balanceString.length - decimalIndex - 1) : 0;

  const halloween = new Date(`${new Date().getFullYear()}-02-14T00:00:00`);
  const currentDate = new Date();

  useEffect(() => {
    const checkRestrictedCountry = async () => {
      try {
        const { data } = await axios.get('/user/location');
        const restrictedCountries = ['UK',]; // Add restricted country codes
        if (restrictedCountries.includes(data.location.country_code)) {
          setIsRestrictedCountry(true);
        }
      } catch (error) {
        console.error('Error fetching location:', error);
      }
    };

    checkRestrictedCountry();
  }, []);

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
            backgroundColor: '#0a0a0a',
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
              variant="outlined"
              color="error"
              startIcon={<FontAwesomeIcon icon={faXTwitter} />}
              onClick={() => window.open("https://x.com/catsinofun", "_blank")}
            >
              X
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<FontAwesomeIcon icon={faTelegram} />}
              onClick={() => window.open("https://t.me/catsinofun", "_blank")}
            >
              Telegram
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
      {isRestrictedCountry && (
        <Dialog
          open={true}
          disableEscapeKeyDown
          fullScreen
          BackdropProps={{
            style: { backgroundColor: 'rgba(0, 0, 0, 0.9)' },
            onClick: (e) => e.stopPropagation(),
          }}
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
            },
          }}
        >
          <DialogTitle sx={{
            fontSize: { xs: '1.8rem', md: '2.5rem' },
            fontWeight: 700,
            textAlign: 'center',
            color: '#ff4d4d',
            mb: 2,
          }}>
            Region Restriction Notice
          </DialogTitle>
          <DialogContent sx={{
            maxWidth: '600px',
            textAlign: 'center',
            px: { xs: 2, md: 4 },
          }}>
            <Typography
              variant="body1"
              sx={{
                color: '#f0f0f0',
                fontSize: { xs: '1rem', md: '1.2rem' },
                lineHeight: 1.6,
                mb: 2,
              }}
            >
              We're sorry, but our services are currently unavailable in your region due to regulatory restrictions.
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#b0b0b0',
                fontSize: { xs: '0.9rem', md: '1rem' },
                lineHeight: 1.5,
                mb: 4,
              }}
            >
              If you believe this is an error or have any questions, please reach out to our support team through our official channels.
            </Typography>
            <Box sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
              <Button
                variant="contained"
                color="error"
                startIcon={<FontAwesomeIcon icon={faXTwitter} />}
                onClick={() => window.open("https://x.com/catsinofun", "_blank")}
                sx={{
                  borderRadius: '20px',
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(255, 77, 77, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Follow on X
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<FontAwesomeIcon icon={faTelegram} />}
                onClick={() => window.open("https://t.me/catsinofun", "_blank")}
                sx={{
                  borderRadius: '20px',
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(255, 77, 77, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Join Telegram
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      )}
      
      <Suspense fallback={''}>
        <EliteSubscriptionModal
          user={user}
          open={eliteModalOpen}
          onClose={handleCloseEliteSubscriptionModal}
          isLowGraphics={isLowGraphics}
        />
      </Suspense>
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
                <span
                  className="title desktop-only"

                >
                  CATSINO
                </span>
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


            <Suspense fallback={<Typography>Loading History...</Typography>}>
              <HistoryTable userId={user?._id} />
            </Suspense>


            <div className="header_action_panel">
              {user ? (
                <>
                  <Box
                    component="a"
                    href="#"
                    className="desktop-only action-icon"
                    onClick={(e) => {
                      e.preventDefault();
                      handleOpenLeaderboardsModal();
                    }}
                    id="btn_leaderboards"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#ffffff',
                      mx: 1.5,
                      '&:hover': {
                        color: '#ff3030',
                      }
                    }}
                  >
                    <LeaderboardOutlined fontSize="medium" />
                  </Box>

                  <Box
                    component="a"
                    href="#"
                    className="desktop-only action-icon"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNotificationsClick(e);
                    }}
                    id="btn_notifications"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#ffffff',
                      mx: 1.5,
                      '&:hover': {
                        color: '#ff3030',
                      }
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
                          backgroundColor: '#ff3030'
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
                  <Skeleton variant="text" sx={{ width: '80px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                  <Skeleton variant="rectangular" sx={{ width: '10px', height: '30px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                  <Skeleton variant="circular" width={40} height={40} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                </Box>
              ) : user?._id ? (
                <>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Chip
                      onClick={(e) => {
                        e.preventDefault();
                        handleBalanceClick(e);
                      }}
                      color="error"
                      variant="outlined"
                      label={
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5, // Adjust spacing between icon and text
                          }}
                        >
                          <AccountBalanceWallet
                            sx={{
                              width: '18px',
                              height: '18px',
                              color: '#ff0000', // Adjust color to match your theme
                            }}
                          />
                          {isHovered ? (
                            <Typography variant="body2">
                              ${((solanaBalance * solPrice) || 0).toFixed(numDecimals)}
                            </Typography>
                          ) : (
                            <Typography variant="body2">
                              {solanaBalance}
                            </Typography>
                          )}
                        </Box>
                      }
                      onMouseEnter={() => setIsHovered(true)}
                      onMouseLeave={() => setIsHovered(false)}
                    />
                  </Box>

                  <Box
                    component="a"
                    href="#"
                    className="mobile-only"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNotificationsClick(e);
                    }}
                    id="btn_notifications_mobile"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#ffffff',
                      mx: 1.5,
                      '&:hover': {
                        color: '#ff3030',
                      }
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
                          backgroundColor: '#ff3030'
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
                    sx={{
                      padding: '4px',
                      minWidth: 'auto',
                      borderRadius: '50%',
                      ml: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      }
                    }}
                  >
                    <Avatar
                      src={user.avatar}
                      user_id={user._id}
                      rank={user.totalWagered}
                      accessory={user.accessory}
                      elite={user.elite}
                      alt=""
                      username={user.username}
                      className="avatar"
                      darkMode={isDarkMode}
                      sx={{ width: 38, height: 38 }}
                    />
                    <ArrowDropDown sx={{ color: '#ffffff' }} />
                  </Button>

                  <Menu
                    anchorEl={anchorElProfile}
                    open={Boolean(anchorElProfile)}
                    onClose={handleCloseProfileMenu}
                    transitionDuration={200}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    PaperProps={{
                      sx: {
                        background: 'rgba(20, 20, 25, 0.95)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        minWidth: '180px',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                        mt: 1,
                        '& .MuiMenuItem-root': {
                          py: 1,
                          px: 2,
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#ffffff',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: '#ff3030',
                            color: '#ffffff',
                          },
                        },
                        '& .MuiListItemIcon-root': {
                          color: '#ffffff',
                          minWidth: '36px',
                        },
                        '& .MuiDivider-root': {
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          my: 0.5,
                        },
                      },
                    }}
                    BackdropProps={{
                      invisible: true,
                    }}
                  >
                    <MenuItem onClick={handleOpenProfileModal}>
                      <ListItemIcon>
                        <PersonOutline fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="PROFILE" />
                    </MenuItem>
                    <Divider />
                    <MenuItem className="desktop-only" onClick={handlePortfolio}>
                      <ListItemIcon>
                        <ListTwoTone fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="PORTFOLIO" />
                    </MenuItem>
                    <MenuItem onClick={handleOpenSettingsModal}>
                      <ListItemIcon>
                        <Settings fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="SETTINGS" />
                    </MenuItem>
                    <MenuItem onClick={handleOpenHowToPlayModal}>
                      <ListItemIcon>
                        <Help fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="HOW IT WORKS" />
                    </MenuItem>
                    <MenuItem onClick={handleOpenEliteSubscriptionModal}>
                      <ListItemIcon>
                        <Star fontSize="small" sx={{ color: '#ffd700' }} />
                      </ListItemIcon>
                      <ListItemText primary="ELITE" />
                    </MenuItem>
                    <MenuItem onClick={() => setShowBonusModal(true)}>
                      <ListItemIcon>
                        <FontAwesomeIcon icon={faCoins} style={{ color: '#ffd700' }} />
                      </ListItemIcon>
                      <ListItemText primary="BONUS" />
                    </MenuItem>
                    <Divider />
                  
                    <MenuItem
                      onClick={() => {
                        handleLogout(true);
                      }}
                      sx={{ color: '#ffffff' }}
                    >
                      <ListItemIcon>
                        <ExitToApp fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="LOG OUT" />
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  id="btn-login"
                  onClick={handleOpenLoginModal}
                  variant="contained"
                  sx={{
                    backgroundColor: '#ff3030',
                    color: '#ffffff',
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: '#d42020',
                    },
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  CONNECT
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
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            PaperProps={{
              sx: {
                background: 'rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                '@supports not (backdrop-filter: blur(10px))': {
                  background: 'rgba(0, 0, 0, 0.4)',
                },
                borderRadius: '16px',
                color: '#fff',
                width: 320,
                maxWidth: '90vw',
                display: 'flex',
                flexDirection: 'column',
              },
            }}
          >
            <Typography
              variant="h6"
              sx={{
                position: 'sticky',
                top: 0,
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
                            elite={notification.elite}
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
                                backgroundColor: '#FF0000',
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
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            PaperProps={{
              sx: {
                // Glassmorphism styles (default dark mode colors)
                background: 'rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)', // For Safari
                border: '1px solid rgba(255, 255, 255, 0.2)',
                // Fallback for browsers without backdrop-filter
                '@supports not (backdrop-filter: blur(10px))': {
                  background: 'rgba(0, 0, 0, 0.4)',
                },
                borderRadius: '16px',
                color: '#fff', // Preserve text color
                p: 2, // Preserve padding
                '& .MuiPaper-root': {
                  background: 'inherit', // Inherit glassmorphic background
                  color: 'inherit',
                },
                '& .MuiTableContainer-root': {
                  background: 'inherit', // Inherit glassmorphic background
                  color: 'inherit',
                },
                '& .MuiTableCell-root': {
                  color: '#fff', // Preserve cell text color
                  borderColor: '#2c2c2c', // Preserve cell border color
                },
                '& #wallet-address': {
                  background: 'rgba(0, 0, 0, 0.3)', // Glassmorphic background for wallet-address
                  color: '#fff',
                  border: '1px solid #2c2c2c',
                  borderRadius: '4px',
                  width: '100%',
                  padding: '0.5rem',
                  marginTop: '0.5rem',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  '@supports not (backdrop-filter: blur(10px))': {
                    background: 'rgba(0, 0, 0, 0.5)', // Fallback for wallet-address
                  },
                },
              },
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
                      <Box component="span" sx={{ fontWeight: 'bold', color: '#FF0000' }}>
                        bet amount
                      </Box>
                      ) and receive less due to:
                    </Typography>
                    <ul style={{ paddingLeft: '1rem', marginBottom: '0.5rem' }}>
                      <li>RTB fees awarded to the Host (0% - 15% returned to bankroll)</li>
                      <li>5% (2.5% for Black Elite members) towards platform fees</li>
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

            <TableContainer component={Paper} style={{ marginBottom: '15px' }} elevation={0}>
              <Table aria-label="a dense table" size="small">
                <TableBody>
                  {transactionsArray.length === 0 ? (
                    <TableRow>
                      <TableCell>...</TableCell>
                    </TableRow>
                  ) : (
                    transactionsArray.slice(0, 5).map((row, key) => {
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
                              ? `+ ${parseFloat(row.amount).toFixed(4)} SOL (${convertToCurrency(row.amount, solPrice)})`
                              : `- ${Math.abs(parseFloat(row.amount).toFixed(4))} SOL (${convertToCurrency(Math.abs(row.amount), solPrice)})`}
                          </TableCell>
                          <TableCell sx={{ color: '#fff' }}>{row.description}</TableCell>
                          <TableCell sx={{ color: '#fff' }}>
                            {row.from_now || 'Invalid Date'}
                          </TableCell>
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
              elite={user?.elite}
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
        {showLoginModal && (
          <Suspense fallback={<Typography>Loading Login...</Typography>}>
            <LoginModal
              modalIsOpen={showLoginModal}
              closeModal={handleCloseLoginModal}
            />
          </Suspense>
        )}
       
        <Suspense fallback={''}>
          <GamePasswordModal />
        </Suspense>
      </div>
    </ThemeProvider>
  );
}

export default SiteWrapper;