import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
  useMemo,
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
  DialogTitle,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../util/Api';
import LoadingOverlay from 'react-loading-overlay';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faTelegram } from '@fortawesome/free-brands-svg-icons';

import {
  AccountBalanceWallet,
  ArrowDropDown,
  ExitToApp,
  ManageAccounts,
  ListTwoTone,
  Help,
  Star,
  QuestionMark,
  LeaderboardOutlined,
  NotificationsOutlined,
  PersonOutline,
  Settings,
} from '@mui/icons-material';
import socketIOClient from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../components/Avatar';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Actions (grouped by feature)
import { setCurrentOfferTargetInfo } from '../redux/Loan/loan.action';
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
import { openOfferLoanModal } from '../redux/Notification/notification.actions';
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
import PrivyLogin from './modal/PrivyLogin.jsx';
import { usePrivy } from '@privy-io/react-auth';
import { faCoins } from '@fortawesome/free-solid-svg-icons';
// Lazy-loaded components
const HistoryTable = lazy(() => import('../game_panel/LiveGames/HistoryTable.jsx'));
const BonusModal = lazy(() => import('./modal/BonusModal.jsx'));
const AllTransactionsModal = lazy(() => import('./modal/AllTransactionsModal.jsx'));
const AccountManagementModal = lazy(() => import('./modal/AccountManagementModal.jsx'));
const PlayerModal = lazy(() => import('./modal/PlayerModal'));
const HowToPlayModal = lazy(() => import('./modal/HowToPlayModal'));
const LeaderboardsModal = lazy(() => import('./modal/LeaderboardsModal'));
const GamePasswordModal = lazy(() => import('./modal/GamePasswordModal'));
const LoginModal = lazy(() => import('./modal/LoginModal'));
const EliteSubscriptionModal = lazy(() => import('./modal/EliteSubscriptionModal'));

// Constants and utilities
LoadingOverlay.propTypes = undefined;

const CUSTOM_TEXT_FIELD_STYLES = {
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

const THEMES = {
  main: createTheme({
    palette: { type: 'light' },
    overrides: CUSTOM_TEXT_FIELD_STYLES
  }),
  dark: createTheme({
    palette: { type: 'dark' },
    overrides: CUSTOM_TEXT_FIELD_STYLES
  })
};

const RESTRICTED_COUNTRIES = ['UK'];

// Utility functions
const updateFromNow = (items, timestampField = 'created_at') => {
  if (!items?.length) return [];

  return items.map(item => {
    if (!item[timestampField]) return item;

    try {
      const fromNow = formatDistanceToNow(new Date(item[timestampField]), { addSuffix: true });
      const processedTime = fromNow === 'less than a minute ago'
        ? 'just now'
        : fromNow
          .replace('less than a minute', 'a few s')
          .replace('about ', '')
          .replace(/ (seconds|minutes|hours|days|weeks|months|years)/g, (match, unit) =>
            ({ seconds: 's', minutes: 'm', hours: 'h', days: 'd', weeks: 'w', months: 'mo', years: 'y' })[unit]
          )
          .replace(/^(a|an) /g, '1')
          .replace(' ago', '');

      return { ...item, from_now: processedTime };
    } catch (error) {
      console.error('Error processing timestamp:', error);
      return item;
    }
  });
};

const appendCurrencyBracket = (message, amount, solPrice) => {
  if (!amount || !solPrice) return message;
  try {
    const currencyStr = convertToCurrency(amount, solPrice);
    return `${message} (${currencyStr}) / ${amount} SOL`;
  } catch (error) {
    console.error('Error formatting currency:', error);
    return message;
  }
};

// Stable selectors with proper memoization
const selectUserData = (state) => ({
  isDarkMode: state.auth?.isDarkMode ?? false,
  user: state.auth?.user,
  userName: state.auth?.userName,
  balance: state.auth?.balance ?? 0,
  socket: state.auth?.socket,
  transactions: state.auth?.transactions ?? [],
  isNotificationsAllowed: state.auth?.isNotificationsAllowed ?? false,
  isMuted: state.auth?.isMuted ?? false,
  notificationSounds: state.auth?.notificationSounds ?? true,
  isLowGraphics: state.auth?.isLowGraphics ?? false,
  showCookieConsent: state.auth?.showCookieConsent ?? false,
  connectedAccount: state.auth?.connectedAccount,
});

const selectLogicData = (state) => ({
  solanaBalance: state.logic?.solanaBalance ?? 0,
  solPrice: state.logic?.solPrice ?? 0,
  notifications: state.logic?.notifications ?? [],
  account: state.logic?.account,
});

const selectLoanData = (state) => ({
  remainingLoans: state.loanReducer?.remainingLoans ?? 0,
});

function SiteWrapper({ children }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Stable selectors to prevent unnecessary re-renders
  const userData = useSelector(selectUserData);
  const logicData = useSelector(selectLogicData);
  const loanData = useSelector(selectLoanData);
  const { logout } = usePrivy();

  // Destructure with defaults
  const {
    isDarkMode, user, userName, balance, socket, transactions,
    isNotificationsAllowed, isMuted, notificationSounds, isLowGraphics,
    showCookieConsent, connectedAccount
  } = userData;

  const { solanaBalance, solPrice, notifications, account } = logicData;
  const { remainingLoans } = loanData;

  // Local state with stable initial values
  const [state, setState] = useState({
    // Modal states
    showAccountModal: false,
    showPlayerModal: false,
    showHowToPlayModal: false,
    showBankModal: false,
    showLeaderboardsModal: false,
    showLoginModal: false,
    showNegativeBalanceDialog: false,
    walletConflictOpen: false,
    tokenModalOpen: true,
    showBonusModal: false,
    eliteModalOpen: false,
    showAllGameLogs: false,

    // Anchor states
    anchorElProfile: null,
    anchorElNotifications: null,
    anchorElGameLog: null,

    // Other states
    walletAddress: connectedAccount || null,
    selectedCreator: null,
    isRestrictedCountry: false,
    isHovered: false,
    websiteLoading: true,
    isInitialized: false,
  });
  const [isHovered, setIsHovered] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  // Refs
  const notificationSoundRef = useRef(null);
  const needALoanRef = useRef(null);
  const intervalRef = useRef(null);
  const isUnmountedRef = useRef(false);
  const socketRef = useRef(null);
  const initializationRef = useRef(false);

  // Stable endpoint
  const endpoint = useMemo(() =>
    process.env.NODE_ENV === 'production'
      ? 'https://catsino.fun'
      : `http://${window.location.hostname}:5001`,
    []
  );

  // Memoized theme
  const theme = useMemo(() =>
    isDarkMode ? THEMES.dark : THEMES.main,
    [isDarkMode]
  );

  // Memoized processed data with stability checks
  const processedNotifications = useMemo(() => {
    if (!notifications?.length) return [];
    return updateFromNow(notifications);
  }, [notifications]);

  const processedTransactions = useMemo(() => {
    if (!transactions?.length) return [];
    return updateFromNow(transactions, 'created_at');
  }, [transactions]);

  const unreadNotificationsCount = useMemo(() =>
    processedNotifications?.filter(n => !n?.is_read)?.length || 0,
    [processedNotifications]
  );

  const balanceDisplay = useMemo(() => {
    if (!balance) return 0;
    const balanceString = balance.toString();
    const decimalIndex = balanceString.indexOf('.');
    return decimalIndex !== -1 ? Math.min(2, balanceString.length - decimalIndex - 1) : 0;
  }, [balance]);

  // Stable update function
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Audio initialization with error handling
  const initializeAudio = useCallback(async () => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    try {
      const [notificationSound, loanSound] = await Promise.all([
        new Promise((resolve) => {
          const audio = new Audio('/sounds/notification.mp3');
          audio.addEventListener('canplaythrough', () => resolve(audio), { once: true });
          audio.addEventListener('error', () => resolve(null), { once: true });
          audio.load();
        }),
        new Promise((resolve) => {
          const audio = new Audio('/sounds/need_a_loan.mp3');
          audio.addEventListener('canplaythrough', () => resolve(audio), { once: true });
          audio.addEventListener('error', () => resolve(null), { once: true });
          audio.load();
        })
      ]);

      notificationSoundRef.current = notificationSound;
      needALoanRef.current = loanSound;
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }, []);

  // Stable Solana functions
  const fetchSolanaBalance = useCallback(async (walletAddress) => {
    if (!walletAddress) return null;

    try {
      const response = await axios.get('/stripe/get_provider_url');
      if (!response?.data?.providerUrl) return null;

      const solanaConnection = new Connection(response.data.providerUrl, 'confirmed');
      const solBalLamports = await solanaConnection.getBalance(new PublicKey(walletAddress));
      const solBalance = solBalLamports / LAMPORTS_PER_SOL;

      dispatch(setSolanaBalance({ solanaBalance: solBalance }));
      return solBalance;
    } catch (error) {
      console.error('Failed to fetch Solana balance:', error);
      return null;
    }
  }, [dispatch]);

  const loadSolanaWallet = useCallback(async () => {
    if (!window.solana?.isPhantom || !user?._id) return;

    try {
      await window.solana.connect();
      const wAddress = window.solana.publicKey?.toString();
      if (!wAddress) return;

      const result = await dispatch(checkAndAddWalletAddress(wAddress));
      if (!result?.success && user._id) {
        console.warn('Wallet conflict:', result?.message);
        updateState({ walletConflictOpen: true });
        return;
      }

      updateState({ walletAddress: wAddress });
      dispatch(setSolanaAccount({ publicKey: new PublicKey(wAddress) }));
      await fetchSolanaBalance(wAddress);
    } catch (error) {
      console.error('Failed to connect Phantom:', error);
    }
  }, [dispatch, user?._id, fetchSolanaBalance, updateState]);

  const disconnectWeb3 = useCallback(() => {
    updateState({ walletAddress: null });
    dispatch(setSolanaBalance(null));
    dispatch(disconnectWalletAddress());
  }, [dispatch, updateState]);

  // Stable socket handlers with fewer dependencies
  const createSocketHandlers = useCallback(() => {
    return {
      handleSendChat: (data) => {
        try {
          if (!isMuted && notificationSounds && notificationSoundRef.current) {
            notificationSoundRef.current.play().catch(() => { });
          }
          dispatch(addChatLog(data));

          if (user?._id) {
            const pathSegments = location.pathname.split('/');
            if (location.pathname.startsWith('/chat/') && pathSegments[2] === data.from) {
              socketRef.current?.emit('READ_MESSAGE', { to: user._id, from: data.from });
            } else {
              socketRef.current?.emit('REQUEST_UNREAD_MESSAGE_COUNT', { to: user._id });
            }
          }
        } catch (error) {
          console.error('Error handling chat:', error);
        }
      },

      handleLoanOffer: (payload) => {
        try {
          dispatch(openOfferLoanModal());
          if (!isMuted && needALoanRef.current) {
            needALoanRef.current.play().catch(() => { });
          }
          if (user?._id) {
            dispatch(setCurrentOfferTargetInfo({
              _id: user._id,
              lender: payload.lender,
              avatar: payload.avatar,
              accessory: payload.accessory,
              elite: payload.elite,
              username: payload.username,
              totalWagered: payload.totalWagered,
            }));
          }
        } catch (error) {
          console.error('Error handling loan offer:', error);
        }
      },

      handleBetResult: (data) => {
        try {
          dispatch(updateBetResult(data));
        } catch (error) {
          console.error('Error handling bet result:', error);
        }
      },

      handleSendNotification: (data) => {
        try {
          if (!isMuted && notificationSounds && notificationSoundRef.current) {
            notificationSoundRef.current.play().catch(() => { });
          }

          if (isNotificationsAllowed && window.Notification && Notification.permission === 'granted') {
            new Notification('New Notification', {
              body: data.message,
              silent: false,
              tag: 'game-notification'
            });
          }

          dispatch(addNewNotification(data));
        } catch (error) {
          console.error('Error handling notification:', error);
        }
      },

      handleAddTransaction: async (data) => {
        try {
          dispatch(addNewTransaction(data));

          if (connectedAccount && user?._id && data.user === user._id &&
            data.status === 'completed' &&
            (data.description?.startsWith('Joined') || data.description?.startsWith('Pumped'))) {
            await fetchSolanaBalance(connectedAccount);
          }
        } catch (error) {
          console.error('Error handling transaction:', error);
        }
      },

      handleBalanceUpdate: (data) => {
        try {
          if (typeof data.solanaBalance === 'number') {
            dispatch(setSolanaBalance({ solanaBalance: data.solanaBalance }));
          }
        } catch (error) {
          console.error('Error handling balance update:', error);
        }
      },

      handleUnreadCount: (countData) => {
        try {
          dispatch(setUnreadMessageCount(countData));
        } catch (error) {
          console.error('Error handling unread count:', error);
        }
      },

      handleOnlineStatusUpdated: (data) => {
        try {
          if (data?.user_list) {
            dispatch(updateOnlineUserList(data.user_list));
          }
        } catch (error) {
          console.error('Error handling online status:', error);
        }
      },

      handleGlobalChat: (data) => {
        try {
          dispatch(globalChatReceived(data));
        } catch (error) {
          console.error('Error handling global chat:', error);
        }
      },

      handleUpdatedRoomList: (data) => {
        try {
          dispatch(setRoomList(data));
          dispatch(endLoading());
        } catch (error) {
          console.error('Error handling room list:', error);
        }
      },

      handleRoomEnded: (data) => {
        try {
          if (data?.roomId) {
            dispatch(removeRoomFromList(data.roomId));
          }
        } catch (error) {
          console.error('Error handling room end:', error);
        }
      },
    };
  }, [
    dispatch, user?._id, isMuted, notificationSounds, isNotificationsAllowed,
    location.pathname, connectedAccount, fetchSolanaBalance
  ]);

  // Event handlers
  const handleClickOutside = useCallback(() => {
    if (state.anchorElProfile) {
      updateState({ anchorElProfile: null });
    }
  }, [state.anchorElProfile, updateState]);

  const handleLogout = (clearToken) => {
    updateState({ walletAddress: null }); // Fix: Use updateState to update walletAddress
    dispatch(setSolanaBalance(null));
    updateState({ anchorElProfile: null });
    if (socket) socket.disconnect();
    logout();
    dispatch(userSignOut(clearToken, navigate));
  };

  const handlePortfolio = useCallback(() => {
    navigate('/portfolio');
    dispatch(selectMainTab(1));
  }, [navigate, dispatch]);

  // Initialize app only once
  useEffect(() => {
    if (state.isInitialized) return;

    let mounted = true;
    isUnmountedRef.current = false;

    const initializeApp = async () => {
      try {
        updateState({ websiteLoading: true });
        document.addEventListener('mousedown', handleClickOutside);

        // Initialize audio first (non-blocking)
        initializeAudio();

        // Fetch initial data in parallel
        await Promise.allSettled([
          dispatch(getGlobalChatLogs()),
          dispatch(getHistory()),
          dispatch(getUser()),
          dispatch(getNotifications()),
        ]);

        // Load wallet after initial data
        if (mounted) {
          await loadSolanaWallet();

          // Check location
          // try {
          //   const { data } = await axios.get('/user/location');
          //   if (mounted && RESTRICTED_COUNTRIES.includes(data?.location?.country_code)) {
          //     updateState({ isRestrictedCountry: true });
          //   }
          // } catch (error) {
          //   console.warn('Location check failed:', error);
          // }

          if (location.pathname.startsWith('/play')) {
            updateState({ tokenModalOpen: false });
          }

          updateState({
            websiteLoading: false,
            isInitialized: true
          });
        }
      } catch (error) {
        console.error('App initialization error:', error);
        if (mounted) {
          updateState({ websiteLoading: false });
        }
      }
    };

    initializeApp();

    return () => {
      mounted = false;
      isUnmountedRef.current = true;
      document.removeEventListener('mousedown', handleClickOutside);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isInitialized, dispatch, handleClickOutside, initializeAudio, loadSolanaWallet, location.pathname, updateState]);

  // Handle balance changes
  useEffect(() => {
    updateState({ showNegativeBalanceDialog: balance < 0 });
  }, [balance, updateState]);

  // Socket connection management - only connect once
  useEffect(() => {
    if (!state.isInitialized || socketRef.current) return;

    let isMounted = true;

    const connectSocket = () => {
      try {
        const newSocket = socketIOClient(endpoint, {
          transports: ['websocket'],
          withCredentials: true,
          forceNew: false, // Changed to false to prevent unnecessary reconnections
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
          if (isMounted) {
            console.log('Socket connected');
            dispatch(setSocket(newSocket));
          }
        });

        newSocket.on('disconnect', () => {
          console.log('Socket disconnected');
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });

        return newSocket;
      } catch (error) {
        console.error('Socket connection failed:', error);
        return null;
      }
    };

    const socket = connectSocket();

    return () => {
      isMounted = false;
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [state.isInitialized, endpoint, dispatch]); // Removed createSocketHandlers from deps

  // Global socket events - separate from user events
  useEffect(() => {
    const currentSocket = socketRef.current;
    if (!currentSocket || !currentSocket.connected) return;

    const handlers = createSocketHandlers();

    const globalEvents = {
      'ONLINE_STATUS_UPDATED': handlers.handleOnlineStatusUpdated,
      'GLOBAL_CHAT_RECEIVED': handlers.handleGlobalChat,
      'ROOMS_UPDATED': handlers.handleUpdatedRoomList,
      'ROOM_ENDED': handlers.handleRoomEnded,
    };

    // Add event listeners
    Object.entries(globalEvents).forEach(([event, handler]) => {
      if (handler) {
        currentSocket.on(event, handler);
      }
    });

    return () => {
      // Remove event listeners
      Object.keys(globalEvents).forEach(event => {
        currentSocket.off(event);
      });
    };
  }, [createSocketHandlers]); // Only depend on handlers, not socket state

  // User-specific socket events
  useEffect(() => {
    const currentSocket = socketRef.current;
    if (!currentSocket || !user?._id || !currentSocket.connected) return;

    try {
      currentSocket.emit('STORE_CLIENT_USER_ID', { user_id: user._id });

      const handlers = createSocketHandlers();
      const userEvents = {
        'SEND_CHAT': handlers.handleSendChat,
        [`RECEIVED_LOAN_OFFER_${user._id}`]: handlers.handleLoanOffer,
        'UPDATE_BET_RESULT': handlers.handleBetResult,
        'SEND_NOTIFICATION': handlers.handleSendNotification,
        'NEW_TRANSACTION': handlers.handleAddTransaction,
        'UPDATE_SOLANA_BALANCE': handlers.handleBalanceUpdate,
        'SET_UNREAD_MESSAGE_COUNT': handlers.handleUnreadCount,
      };

      Object.entries(userEvents).forEach(([event, handler]) => {
        if (handler) {
          currentSocket.on(event, handler);
        }
      });

      return () => {
        Object.keys(userEvents).forEach(event => {
          currentSocket.off(event);
        });
      };
    } catch (error) {
      console.error('Error setting up user socket events:', error);
    }
  }, [user?._id, createSocketHandlers]); // Removed socket from deps

  // Render functions for complex UI parts
  const renderRestrictedCountryDialog = () => (
    <Dialog
      open={state.isRestrictedCountry}
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
  );
  const handleOpenSettingsModal = () => setShowSettingsModal(true);
  const handleOpenHowToPlayModal = () => setShowHowToPlayModal(true);
  const handleOpenProfileMenu = e => updateState({ anchorElProfile: e.currentTarget })
  const handleCloseProfileMenu = () => updateState({ anchorElProfile: null })
  const handleOpenEliteSubscriptionModal = () => {
    setEliteModalOpen(true);
  };
  const handleOpenProfileModal = () => {
    setShowProfileModal(true);
    updateState({ anchorElProfile: null })
  };
  const renderNegativeBalanceDialog = () => (
    <Dialog
      open={state.showNegativeBalanceDialog}
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
  );

  const renderUserActions = () => {
    if (state.websiteLoading) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Skeleton variant="text" sx={{ width: '80px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
          <Skeleton variant="rectangular" sx={{ width: '10px', height: '30px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
          <Skeleton variant="circular" width={40} height={40} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
        </Box>
      );
    }

    

    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            onClick={(e) => updateState({ anchorElGameLog: e.currentTarget })}
            color="error"
            variant="outlined"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccountBalanceWallet sx={{ width: '18px', height: '18px', color: '#ff0000' }} />
                <Typography variant="body2">
                  {state.isHovered
                    ? `${((solanaBalance * solPrice) || 0).toFixed(balanceDisplay)}`
                    : solanaBalance || '0'
                  }
                </Typography>
              </Box>
            }
            onMouseEnter={() => updateState({ isHovered: true })}
            onMouseLeave={() => updateState({ isHovered: false })}
          />
        </Box>

        <Box
          component="a"
          href="#"
          className="mobile-only"
          onClick={(e) => {
            e.preventDefault();
            updateState({ anchorElNotifications: e.currentTarget });
          }}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#ffffff',
            mx: 1.5,
            '&:hover': { color: '#ff3030' }
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
          onClick={(e) => updateState({ anchorElProfile: e.currentTarget })}
          className="profile-menu"
          sx={{
            padding: '4px',
            minWidth: 'auto',
            borderRadius: '50%',
            ml: 1,
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
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
      </>
    );
  };

  // const renderProfileMenu = () => (
  //   <Menu
  //     anchorEl={state.anchorElProfile}
  //     open={Boolean(state.anchorElProfile)}
  //     onClose={() => updateState({ anchorElProfile: null })}
  //     transitionDuration={200}
  //     anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
  //     transformOrigin={{ vertical: 'top', horizontal: 'right' }}
  //     PaperProps={{
  //       sx: {
  //         background: 'rgba(20, 20, 25, 0.95)',
  //         backdropFilter: 'blur(10px)',
  //         WebkitBackdropFilter: 'blur(10px)',
  //         border: '1px solid rgba(255, 255, 255, 0.1)',
  //         borderRadius: '8px',
  //         minWidth: '180px',
  //         boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  //         mt: 1,
  //         '& .MuiMenuItem-root': {
  //           py: 1,
  //           px: 2,
  //           fontSize: '14px',
  //           fontWeight: 500,
  //           color: '#ffffff',
  //           transition: 'all 0.2s ease',
  //           '&:hover': {
  //             backgroundColor: '#ff3030',
  //             color: '#ffffff',
  //           },
  //         },
  //         '& .MuiListItemIcon-root': {
  //           color: '#ffffff',
  //           minWidth: '36px',
  //         },
  //         '& .MuiDivider-root': {
  //           borderColor: 'rgba(255, 255, 255, 0.1)',
  //           my: 0.5,
  //         },
  //       },
  //     }}
  //     BackdropProps={{ invisible: true }}
  //   >
  //     <MenuItem onClick={() => {
  //       updateState({ showAccountModal: true, anchorElProfile: null });
  //     }}>
  //       <ListItemIcon>
  //         <ManageAccounts fontSize="small" />
  //       </ListItemIcon>
  //       <ListItemText primary="ACCOUNT" />
  //     </MenuItem>

  //     <Divider />

  //     <MenuItem className="desktop-only" onClick={handlePortfolio}>
  //       <ListItemIcon>
  //         <ListTwoTone fontSize="small" />
  //       </ListItemIcon>
  //       <ListItemText primary="PORTFOLIO" />
  //     </MenuItem>

  //     <MenuItem onClick={() => updateState({ showHowToPlayModal: true })}>
  //       <ListItemIcon>
  //         <Help fontSize="small" />
  //       </ListItemIcon>
  //       <ListItemText primary="HOW IT WORKS" />
  //     </MenuItem>

  //     <MenuItem onClick={() => updateState({ eliteModalOpen: true })}>
  //       <ListItemIcon>
  //         <Star fontSize="small" sx={{ color: '#ffd700' }} />
  //       </ListItemIcon>
  //       <ListItemText primary="ELITE" />
  //     </MenuItem>

  //     <Divider />

  //     <MenuItem
  //       onClick={() => handleLogout(true)}
  //       sx={{ color: '#ffffff' }}
  //     >
  //       <ListItemIcon>
  //         <ExitToApp fontSize="small" />
  //       </ListItemIcon>
  //       <ListItemText primary="LOG OUT" />
  //     </MenuItem>
  //   </Menu>
  // );

  const renderNotificationsPopover = () => (
    <Popover
      open={Boolean(state.anchorElNotifications)}
      anchorEl={state.anchorElNotifications}
      onClose={() => {
        dispatch(readNotifications());
        updateState({ anchorElNotifications: null });
      }}
      transitionDuration={0}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
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
      <Box sx={{ maxHeight: 300, overflowY: 'auto', px: 2, pb: 2 }}>
        {processedNotifications.length > 0 ? (
          processedNotifications.map((notification, index) => {
            const processedMessage = appendCurrencyBracket(
              notification.message,
              notification.amount,
              solPrice
            );

            return (
              <Box key={`notification-${notification._id}-${index}`}>
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
                    onClick={() => {
                      updateState({
                        selectedCreator: notification._id,
                        showPlayerModal: true
                      });
                    }}
                    style={{ display: 'flex', flexDirection: 'row', cursor: 'pointer' }}
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
                      dangerouslySetInnerHTML={{ __html: processedMessage }}
                    />
                    <Typography variant="caption" sx={{ color: '#ccc' }}>
                      {notification.from_now}
                    </Typography>
                  </a>
                </Box>
                {index < processedNotifications.length - 1 && (
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
  );

  const renderGameLogPopover = () => (
    <Popover
      open={Boolean(state.anchorElGameLog)}
      anchorEl={state.anchorElGameLog}
      onClose={() => updateState({ anchorElGameLog: null })}
      transitionDuration={0}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
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
          p: 2,
          '& .MuiPaper-root': { background: 'inherit', color: 'inherit' },
          '& .MuiTableContainer-root': { background: 'inherit', color: 'inherit' },
          '& .MuiTableCell-root': { color: '#fff', borderColor: '#2c2c2c' },
          '& #wallet-address': {
            background: 'rgba(0, 0, 0, 0.3)',
            color: '#fff',
            border: '1px solid #2c2c2c',
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
      <Box sx={{ position: 'relative' }}>
        <Tooltip
          style={{ position: 'absolute', right: '20px' }}
          title="Why do my winnings appear less? You see net profit (winning - bet amount) minus platform fees."
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
        <Table aria-label="balance history table" size="small">
          <TableBody>
            {processedTransactions.length === 0 ? (
              <TableRow>
                <TableCell>No transactions available</TableCell>
              </TableRow>
            ) : (
              processedTransactions.slice(0, 5).map((row, key) => {
                const clickable = row.hash && row.hash.length !== 10 && row.status !== 'processing';
                const isPositive = parseFloat(row.amount) > 0;
                const amount = parseFloat(row.amount);

                return (
                  <TableRow
                    key={`transaction-${row._id}-${key}`}
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
                        ? `+ ${amount.toFixed(4)} SOL (${convertToCurrency(amount, solPrice)})`
                        : `- ${Math.abs(amount).toFixed(4)} SOL (${convertToCurrency(Math.abs(amount), solPrice)})`}
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
        onClick={() => updateState({ showAllGameLogs: true })}
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
  );

  const renderModals = () => (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <EliteSubscriptionModal
          user={user}
          open={state.eliteModalOpen}
          onClose={() => updateState({ eliteModalOpen: false })}
          isLowGraphics={isLowGraphics}
        />
      </Suspense>

      {state.showAccountModal && (
        <Suspense fallback={<div>Loading Profile...</div>}>
          <AccountManagementModal
            modalIsOpen={state.showAccountModal}
            closeModal={() => updateState({ showAccountModal: false })}
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

      {state.showPlayerModal && (
        <Suspense fallback={<div>Loading Player...</div>}>
          <PlayerModal
            selectedCreator={state.selectedCreator}
            modalIsOpen={state.showPlayerModal}
            closeModal={() => updateState({ showPlayerModal: false })}
          />
        </Suspense>
      )}

      {state.showBonusModal && (
        <Suspense fallback={<div>Loading Bonus...</div>}>
          <BonusModal
            modalIsOpen={state.showBonusModal}
            closeModal={() => updateState({ showBonusModal: false })}
            user={user}
            solPrice={solPrice}
          />
        </Suspense>
      )}

      {state.showLeaderboardsModal && (
        <Suspense fallback={<div>Loading Leaderboards...</div>}>
          <LeaderboardsModal
            modalIsOpen={state.showLeaderboardsModal}
            closeModal={() => updateState({ showLeaderboardsModal: false })}
            player_name={userName}
            balance={balance}
            isDarkMode={isDarkMode}
          />
        </Suspense>
      )}

      {state.showHowToPlayModal && (
        <Suspense fallback={<div>Loading How To Play...</div>}>
          <HowToPlayModal
            modalIsOpen={state.showHowToPlayModal}
            closeModal={() => updateState({ showHowToPlayModal: false })}
            player_name={userName}
            balance={balance}
            isDarkMode={isDarkMode}
          />
        </Suspense>
      )}

      {state.showLoginModal && (
        <Suspense fallback={<div>Loading Login...</div>}>
          <LoginModal
            modalIsOpen={state.showLoginModal}
            closeModal={() => updateState({ showLoginModal: false })}
          />
        </Suspense>
      )}

      {state.showAllGameLogs && (
        <Suspense fallback={<div>Loading Transactions...</div>}>
          <AllTransactionsModal
            modalIsOpen={state.showAllGameLogs}
            isDarkMode={isDarkMode}
            close={() => updateState({ showAllGameLogs: false })}
            user={user?._id}
            solPrice={solPrice}
            transactions={transactions}
          />
        </Suspense>
      )}

      <Suspense fallback={<div>Loading...</div>}>
        <GamePasswordModal />
      </Suspense>

      <ConflictDialog
        open={state.walletConflictOpen}
        onClose={() => updateState({ walletConflictOpen: false })}
      />
    </>
  );

  // Don't render anything if still loading
  if (!state.isInitialized) {
    return (
      <ThemeProvider theme={theme}>
        <div className={`site_wrapper ${isDarkMode ? 'dark_mode' : ''}`}>
          <div className="game_header">
            <div className="main_header">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="rectangular" width={150} height={30} />
                <Skeleton variant="text" width={100} />
              </Box>
              <Skeleton variant="rectangular" width={200} height={40} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="rectangular" width={80} height={30} />
                <Skeleton variant="circular" width={40} height={40} />
              </Box>
            </div>
          </div>
          <div className="game_wrapper">
            <div className="contents_wrapper">
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <Typography>Loading...</Typography>
              </Box>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      {showCookieConsent && <CookieConsent />}

      {renderNegativeBalanceDialog()}
      {renderRestrictedCountryDialog()}

      <div className={`site_wrapper ${isDarkMode ? 'dark_mode' : ''}`}>
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
                <span className="title desktop-only">CATSINO</span>
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
                  updateState({ showHowToPlayModal: true });
                }}
              >
                [ how it works ]
              </a>
            </Box>

            <Suspense fallback={<Typography>Loading History...</Typography>}>
              <HistoryTable userId={user?._id} />
            </Suspense>

            <div className="header_action_panel">
              {user && (
                <>
                  <Box
                    component="a"
                    href="#"
                    className="desktop-only action-icon"
                    onClick={(e) => {
                      e.preventDefault();
                      updateState({ showLeaderboardsModal: true });
                    }}
                    id="btn_leaderboards"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#ffffff',
                      mx: 1.5,
                      '&:hover': { color: '#ff3030' }
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
                      updateState({ anchorElNotifications: e.currentTarget });
                    }}
                    id="btn_notifications"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#ffffff',
                      mx: 1.5,
                      '&:hover': { color: '#ff3030' }
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
              )}

              {state.websiteLoading ? (
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
                          {state.isHovered ? (
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
                    anchorEl={state.anchorElProfile}
                    open={Boolean(state.anchorElProfile)}
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
                <PrivyLogin />
              )}
{/* 
              {renderUserActions()}
              {renderProfileMenu()} */}
            </div>
          </div>

          {renderNotificationsPopover()}
          {renderGameLogPopover()}
        </div>

        <div className="game_wrapper">
          <div className="contents_wrapper">{children}</div>
        </div>

        {renderModals()}
      </div>
    </ThemeProvider>
  );
}

export default SiteWrapper;