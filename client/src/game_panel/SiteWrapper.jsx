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
  ButtonBase,
  DialogContent,
  Skeleton,
  IconButton,
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
  Chip,
} from '@mui/material';

import { ThemeProvider } from '@mui/material/styles';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  History as HistoryIcon,
  TrendingUp,
} from '@mui/icons-material';
import WalletBalanceDisplay from '../components/WalletBalanceDisplay.jsx';
import socketIOClient from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../components/Avatar.jsx';

import { setCurrentOfferTargetInfo } from '../redux/Loan/loan.action.js';
import CookieConsent from '../util/cookieConsent.jsx';
import { convertToCurrency } from '../util/conversion.js';
import {
  setSocket,
  userSignOut,
  getUser,
  getUserTransactions,
  setUnreadMessageCount,
} from '../redux/Auth/user.actions.js';
import setAuthToken from '../util/setAuthToken.js';
import { openOfferLoanModal } from '../redux/Notification/notification.actions.js';
import { ConflictDialog } from './modal/ConfirmAlerts.jsx';
import {
  setRoomList,
  addChatLog,
  addNewTransaction,
  addNewNotification,
  updateOnlineUserList,
  selectMainTab,
  globalChatReceived,
  updateBetResult,
  getNotifications,
  readNotifications,
  removeRoomFromList,
  getGlobalChatLogs,
  getHistory,
  endLoading,
} from '../redux/Logic/logic.actions.js';
import PrivyLogin from './modal/PrivyLogin.jsx';
import { usePrivy } from '@privy-io/react-auth';

// Lazy-loaded components
const HistoryTable = lazy(() => import('./LiveGames/HistoryTable.jsx'));
const AllTransactionsModal = lazy(() => import('./modal/AllTransactionsModal.jsx'));
const AccountManagementModal = lazy(() => import('./modal/AccountManagementModal.jsx'));
const PlayerModal = lazy(() => import('./modal/PlayerModal.jsx'));
const HowToPlayModal = lazy(() => import('./modal/HowToPlayModal.jsx'));
const LeaderboardsModal = lazy(() => import('./modal/LeaderboardsModal.jsx'));
const GamePasswordModal = lazy(() => import('./modal/GamePasswordModal.jsx'));
const EliteSubscriptionModal = lazy(() => import('./modal/EliteSubscriptionModal.jsx'));

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

// Create themes once and reuse - significant performance improvement
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

// Optimized utility function - reduced complexity
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

function SiteWrapper({ children }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // FIXED: Add Privy authentication hooks first
  const {
    ready: privyReady,
    authenticated: privyAuthenticated,
    user: privyUser,
    logout: privyLogout
  } = usePrivy();

  // Direct selectors for better performance - avoid complex selector objects
  const isDarkMode = useSelector(state => state.auth?.isDarkMode ?? false);
  const user = useSelector(state => state.auth?.user);
  const userName = useSelector(state => state.auth?.userName);
  const balance = useSelector(state => state.auth?.balance ?? 0);
  const socket = useSelector(state => state.auth?.socket);
  const transactions = useSelector(state => state.auth?.transactions ?? []);
  const isNotificationsAllowed = useSelector(state => state.auth?.isNotificationsAllowed ?? false);
  const isMuted = useSelector(state => state.auth?.isMuted ?? false);
  const notificationSounds = useSelector(state => state.auth?.notificationSounds ?? true);
  const isLowGraphics = useSelector(state => state.auth?.isLowGraphics ?? false);
  const showCookieConsent = useSelector(state => state.auth?.showCookieConsent ?? false);
  const solPrice = useSelector(state => state.logic?.solPrice ?? 0);
  const notifications = useSelector(state => state.logic?.notifications ?? []);
  const isLoadingTransactions = useSelector(state => state.auth?.isLoadingTransactions ?? false);
  const transactionsLoaded = useSelector(state => state.auth?.transactionsLoaded ?? false);


  // Wallet balance selector - kept as is for wallet functionality
  const walletData = useSelector(state => {
    const liveWalletBalance = state?.auth?.liveWalletBalance ?? 0;
    const backendBalance = state?.auth?.user?.balance ?? 0;
    const walletAddress = state?.auth?.walletAddress;
    return {
      balance: walletAddress ? liveWalletBalance : backendBalance,
      isWalletBalance: Boolean(walletAddress),
      walletAddress
    };
  });

  // FIXED: Add authentication state management
  const [authState, setAuthState] = useState({
    isReady: false,
    isAuthenticated: false,
    isLoading: true,
    hasCheckedAuth: false
  });

  // Simple state management - individual useState calls for better performance
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showHowToPlayModal, setShowHowToPlayModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showLeaderboardsModal, setShowLeaderboardsModal] = useState(false);
  const [showNegativeBalanceDialog, setShowNegativeBalanceDialog] = useState(false);
  const [walletConflictOpen, setWalletConflictOpen] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(true);
  const [eliteModalOpen, setEliteModalOpen] = useState(false);
  const [showAllGameLogs, setShowAllGameLogs] = useState(false);
  const [anchorElProfile, setAnchorElProfile] = useState(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);
  const [anchorElGameLog, setAnchorElGameLog] = useState(null);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [isRestrictedCountry, setIsRestrictedCountry] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [websiteLoading, setWebsiteLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs
  const notificationSoundRef = useRef(null);
  const needALoanRef = useRef(null);
  const intervalRef = useRef(null);
  const isUnmountedRef = useRef(false);
  const socketRef = useRef(null);
  const initializationRef = useRef(false);

  // Stable endpoint - only calculate once
  const endpoint = useMemo(() =>
    process.env.NODE_ENV === 'production'
      ? 'https://catsino.fun'
      : `http://${window.location.hostname}:5001`,
    []
  );

  // Memoized theme - only recalculate when isDarkMode changes
  const theme = useMemo(() =>
    isDarkMode ? THEMES.dark : THEMES.main,
    [isDarkMode]
  );

  // Only memoize complex calculations that benefit from it
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

  // FIXED: Handle Privy authentication state changes
  useEffect(() => {

    if (!privyReady) {
      // Privy is still initializing
      setAuthState(prev => ({ ...prev, isLoading: true, isReady: false }));
      return;
    }

    // Privy is ready, now determine authentication state
    if (privyAuthenticated && privyUser) {
      // User is authenticated with Privy
      if (!user?._id) {
        // Redux doesn't have user data yet, fetch it
        dispatch(getUser())
          .then(() => {
            setAuthState({
              isReady: true,
              isAuthenticated: true,
              isLoading: false,
              hasCheckedAuth: true
            });
          })
          .catch((error) => {
            console.error('❌ Failed to fetch user data:', error);
            setAuthState({
              isReady: true,
              isAuthenticated: false,
              isLoading: false,
              hasCheckedAuth: true
            });
          });
      } else {
        // Both Privy and Redux have user data
        setAuthState({
          isReady: true,
          isAuthenticated: true,
          isLoading: false,
          hasCheckedAuth: true
        });
      }
    } else {
      // User is not authenticated
      setAuthState({
        isReady: true,
        isAuthenticated: false,
        isLoading: false,
        hasCheckedAuth: true
      });
    }
  }, [privyReady, privyAuthenticated, privyUser, user?._id, dispatch]);

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

  // Simplified socket handlers with better error handling
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
        } catch (error) {
          console.error('Error handling transaction:', error);
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
    dispatch, user?._id, isMuted, notificationSounds, isNotificationsAllowed
  ]);

  // Event handlers - simplified
  const handleClickOutside = useCallback(() => {
    if (anchorElProfile) {
      setAnchorElProfile(null);
    }
  }, [anchorElProfile]);

  // FIXED: Update logout function to work with Privy properly
  const handleLogout = useCallback(async (clearToken) => {

    if (handleLogout.isLoggingOut) {
      return;
    }

    handleLogout.isLoggingOut = true;

    try {
      // Step 1: Close UI elements first
      setAnchorElProfile(null);

      // Step 2: Disconnect socket
      if (socket) {
        socket.disconnect();
      }

      // Step 3: Backend logout with proper error handling
      try {
        await dispatch(userSignOut(clearToken, navigate));
      } catch (backendError) {
        console.warn('⚠️ Backend logout failed, continuing...', backendError);
      }

      // Step 4: Privy logout with error handling
      try {
        await privyLogout();
      } catch (privyError) {
        console.error('❌ Privy logout failed:', privyError);
      }

      // Step 5: Force cleanup to ensure consistent state
      if (clearToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        setAuthToken();
      }

      // Reset auth state
      setAuthState({
        isReady: true,
        isAuthenticated: false,
        isLoading: false,
        hasCheckedAuth: true
      });

      // Clear Redux state
      dispatch({ type: 'LOGOUT' });

      // Navigate to home (but don't force redirect)
      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      }

    } catch (error) {
      console.error('❌ Logout error, forcing cleanup:', error);

      // Force cleanup even if there's an error
      if (socket) socket.disconnect();

      if (clearToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('isAuthenticated');
        setAuthToken();
      }

      setAuthState({
        isReady: true,
        isAuthenticated: false,
        isLoading: false,
        hasCheckedAuth: true
      });

      dispatch({ type: 'LOGOUT' });

      if (location.pathname !== '/') {
        navigate('/', { replace: true });
      }
    } finally {
      handleLogout.isLoggingOut = false;
    }
  }, [dispatch, navigate, socket, privyLogout, location.pathname]);

  const handlePortfolio = useCallback(() => {
    navigate('/portfolio');
    dispatch(selectMainTab(1));
  }, [navigate, dispatch]);

  // Handler functions - simplified
  const handleOpenHowToPlayModal = () => setShowHowToPlayModal(true);
  const handleOpenProfileMenu = (e) => setAnchorElProfile(e.currentTarget);
  const handleCloseProfileMenu = () => setAnchorElProfile(null);
  const handleOpenEliteSubscriptionModal = () => setEliteModalOpen(true);
  const handleOpenAccountManagementModal = () => {
    setShowAccountModal(true);
    setAnchorElProfile(null);
  };

  // Balance click handler
  const handleBalanceClick = useCallback(async (e) => {
    e.preventDefault();
    setAnchorElGameLog(e.currentTarget);

    // Only fetch transactions if they haven't been loaded yet
    if (!transactionsLoaded && !isLoadingTransactions) {
      try {
        await dispatch(getUserTransactions());
      } catch (error) {
        console.error('Failed to load transactions:', error);
      }
    }
  }, [dispatch, transactionsLoaded, isLoadingTransactions]);


  // Notifications click handler
  const handleNotificationsClick = (e) => {
    e.preventDefault();
    setAnchorElNotifications(e.currentTarget);
  };

  useEffect(() => {
    if (!authState.hasCheckedAuth || isInitialized) return;

    const initializeApp = async () => {
      try {
        // CRITICAL: Show UI immediately
        setIsInitialized(true);
        setWebsiteLoading(false);

        // Initialize basic functionality
        document.addEventListener('mousedown', handleClickOutside);

        // Start loading data in background (non-blocking)
        setTimeout(() => {
          // Load global data with error handling
          Promise.allSettled([
            dispatch(getGlobalChatLogs()),
            dispatch(getHistory()),
            authState.isAuthenticated && user?._id ? dispatch(getNotifications()) : Promise.resolve()
          ]).catch(console.error);

          // Initialize audio after everything else
          initializeAudio().catch(console.warn);
        }, 50); // Small delay to let UI render first

        if (location.pathname.startsWith('/play')) {
          setTokenModalOpen(false);
        }

      } catch (error) {
        console.error('❌ App initialization error:', error);
        setIsInitialized(true);
        setWebsiteLoading(false);
      }
    };

    initializeApp();

    return () => {
      isUnmountedRef.current = true;
      document.removeEventListener('mousedown', handleClickOutside);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [authState.hasCheckedAuth, authState.isAuthenticated, isInitialized, user?._id]);

  // Handle balance changes - simple effect
  useEffect(() => {
    setShowNegativeBalanceDialog(balance < 0);
  }, [balance]);

  // Socket connection management - only connect once
  useEffect(() => {
    if (!isInitialized || socketRef.current) return;
    console.log('🔧 Starting socket connection...');
    console.log('🔧 Endpoint:', endpoint);
    console.log('🔧 isInitialized:', isInitialized);
    console.log('🔧 socketRef.current:', socketRef.current);

    let isMounted = true;

    const connectSocket = () => {
      console.log('🔧 Creating socket connection to:', endpoint);

      try {
        const newSocket = socketIOClient(endpoint, {
          transports: ['websocket', 'polling'],
          withCredentials: true,
          forceNew: false,
          timeout: 20000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
          if (isMounted) {
            console.log('✅ Frontend: Socket connected successfully');
            console.log('✅ Socket ID:', newSocket.id);
            console.log('✅ Transport:', newSocket.io.engine.transport.name);
            dispatch(setSocket(newSocket));
          }
        });

        newSocket.on('disconnect', () => {
          console.log('🔌 Socket disconnected');
        });

        newSocket.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
        });

        return newSocket;
      } catch (error) {
        console.error('❌ Socket connection failed:', error);
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
  }, [isInitialized, endpoint, dispatch]);

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
  }, [createSocketHandlers]);

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
  }, [user?._id, createSocketHandlers]);

  // Render functions for complex UI parts
  const renderRestrictedCountryDialog = () => (
    <Dialog
      open={isRestrictedCountry}
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

  const renderNegativeBalanceDialog = () => (
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
  );

  // Compact Profile Menu with Red Theme - No Animations
  const renderProfileMenu = () => (
    <Menu
      anchorEl={anchorElProfile}
      open={Boolean(anchorElProfile)}
      onClose={handleCloseProfileMenu}
      transitionDuration={0}
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
          background: '#1a1a1a',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '6px',
          minWidth: '160px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.3)',
          mt: 0.5,
          '& .MuiMenuItem-root': {
            py: 0.75,
            px: 1.5,
            fontSize: '0.8rem',
            fontWeight: 500,
            color: isDarkMode ? '#ffffff' : '#333333',
            minHeight: '36px',
            '&:hover': {
              backgroundColor: '#ff0000',
              color: '#ffffff',
            },
            '&.elite-item': {
              background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05))',
              borderLeft: '3px solid #ffd700',
              '&:hover': {
                backgroundColor: '#ff0000',
                borderLeftColor: '#ffd700',
              },
            },
            '&.logout-item': {
              '&:hover': {
                backgroundColor: '#cc0000',
              },
            },
          },
          '& .MuiListItemIcon-root': {
            color: isDarkMode ? '#ffffff' : '#333333',
            minWidth: '28px',
            '& .MuiSvgIcon-root': {
              fontSize: '1rem',
            },
          },
          '& .MuiMenuItem-root:hover .MuiListItemIcon-root': {
            color: '#ffffff',
          },
          '& .MuiListItemText-root': {
            '& .MuiListItemText-primary': {
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.5px',
            },
          },
          '& .MuiDivider-root': {
            borderColor: isDarkMode
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)',
            my: 0.25,
          },
        },
      }}
      BackdropProps={{
        invisible: true,
      }}
    >
      {/* Account Management */}
      <MenuItem onClick={handleOpenAccountManagementModal}>
        <ListItemIcon>
          <ManageAccounts />
        </ListItemIcon>
        <ListItemText primary="ACCOUNT" />
      </MenuItem>

      <Divider />

      {/* Portfolio - Desktop Only */}
      <MenuItem className="desktop-only" onClick={handlePortfolio}>
        <ListItemIcon>
          <ListTwoTone />
        </ListItemIcon>
        <ListItemText primary="PORTFOLIO" />
      </MenuItem>

      {/* How to Play */}
      <MenuItem onClick={handleOpenHowToPlayModal}>
        <ListItemIcon>
          <Help />
        </ListItemIcon>
        <ListItemText primary="HELP" />
      </MenuItem>

      {/* Elite Subscription - Special Styling */}
      <MenuItem
        onClick={handleOpenEliteSubscriptionModal}
        className="elite-item"
      >
        <ListItemIcon>
          <Star sx={{ color: '#ffd700' }} />
        </ListItemIcon>
        <ListItemText primary="ELITE" />
      </MenuItem>

      <Divider />

      {/* Logout */}
      <MenuItem
        onClick={() => handleLogout(true)}
        className="logout-item"
      >
        <ListItemIcon>
          <ExitToApp />
        </ListItemIcon>
        <ListItemText primary="LOG OUT" />
      </MenuItem>
    </Menu>
  );

  const renderGameLogPopover = () => (
    <Popover
      open={Boolean(anchorElGameLog)}
      anchorEl={anchorElGameLog}
      onClose={() => setAnchorElGameLog(null)}
      transitionDuration={0}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      slotProps={{
        paper: {
          sx: {
            background: '#1a1a1a',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            color: isDarkMode ? '#fff' : '#333',
            minWidth: '350px',
            maxWidth: '90vw',
          },
        },
      }}
    >
      {/* Header - same as before */}
      <Box sx={{
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'rgba(255, 0, 0, 0.2)',
        background: 'rgba(32, 32, 32, 0.05)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            background: '#ff0000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <HistoryIcon sx={{ color: 'white', fontSize: '16px' }} />
          </Box>

          <Typography variant="subtitle1" sx={{
            fontWeight: 600,
            color: '#ff0000',
            fontSize: '0.95rem',
          }}>
            BALANCE HISTORY
          </Typography>

          <Tooltip
            title="Net profit shown (winnings - bet - fees)"
            placement="top"
            arrow
          >
            <IconButton
              size="small"
              sx={{
                ml: 'auto',
                color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                '&:hover': { color: '#ff0000' },
              }}
            >
              <QuestionMark sx={{ fontSize: '16px' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Content with loading state */}
      <Box sx={{ p: 2 }}>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            background: 'transparent',
            mb: 2,
            borderRadius: '6px',
            border: '1px solid',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <Table size="small">
            <TableBody>
              {isLoadingTransactions ? (
                // Show loading skeletons
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    <TableCell sx={{ py: 1, px: 1.5 }}>
                      <Skeleton variant="text" width="60%" height={20} />
                    </TableCell>
                    <TableCell sx={{ py: 1, px: 1.5 }}>
                      <Skeleton variant="text" width="80%" height={20} />
                    </TableCell>
                    <TableCell sx={{ py: 1, px: 1.5 }}>
                      <Skeleton variant="text" width="40%" height={20} />
                    </TableCell>
                  </TableRow>
                ))
              ) : processedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    sx={{
                      textAlign: 'center',
                      py: 3,
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                    }}
                  >
                    No transactions available
                  </TableCell>
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
                          backgroundColor: clickable
                            ? 'rgba(255, 0, 0, 0.05)'
                            : 'inherit',
                        },
                        '& .MuiTableCell-root': {
                          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                          py: 1,
                          px: 1.5,
                        }
                      }}
                    >
                      <TableCell sx={{
                        color: isPositive ? '#00ff00' : '#ff0000',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                      }}>
                        {isPositive
                          ? `+ ${amount.toFixed(4)} SOL (${convertToCurrency(amount, solPrice)})`
                          : `- ${Math.abs(amount).toFixed(4)} SOL (${convertToCurrency(Math.abs(amount), solPrice)})`}
                      </TableCell>
                      <TableCell sx={{
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                        fontSize: '0.8rem',
                      }}>
                        {row.description}
                      </TableCell>
                      <TableCell sx={{
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                        fontSize: '0.75rem',
                      }}>
                        {row.from_now || 'Invalid Date'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Button */}
        <Button
          color="error"
          variant="contained"
          onClick={() => setShowAllGameLogs(true)}
          fullWidth
          disabled={isLoadingTransactions}
          sx={{
            borderRadius: '6px',
            py: 1,
            fontWeight: 600,
            textTransform: 'none',
            backgroundColor: '#ff0000',
            '&:hover': {
              backgroundColor: '#cc0000',
            },
            '&:disabled': {
              backgroundColor: 'rgba(255, 0, 0, 0.3)',
            },
          }}
        >
          {isLoadingTransactions ? 'Loading...' : 'All Transactions'}
        </Button>
      </Box>
    </Popover>
  );

  // Compact Notifications Popover with Red Theme
  const renderNotificationsPopover = () => (
    <Popover
      open={Boolean(anchorElNotifications)}
      anchorEl={anchorElNotifications}
      onClose={() => {
        dispatch(readNotifications());
        setAnchorElNotifications(null);
      }}
      transitionDuration={0}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      slotProps={{
        paper: {
          sx: {
            background: '#1a1a1a',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            color: isDarkMode ? '#fff' : '#333',
            width: 320,
            maxWidth: '90vw',
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      {/* Compact Header */}
      <Box sx={{
        p: 2,
        borderBottom: '1px solid',
        borderColor: 'rgba(45, 45, 45, 0.2)',
        background: 'rgba(255, 0, 0, 0.05)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            background: '#ff0000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <NotificationsIcon sx={{ color: 'white', fontSize: '16px' }} />
          </Box>

          <Typography variant="subtitle1" sx={{
            fontWeight: 600,
            color: '#ff0000',
            fontSize: '0.95rem',
          }}>
            NOTIFICATIONS
          </Typography>

          {/* Notification count */}
          {processedNotifications.filter(n => !n.is_read).length > 0 && (
            <Chip
              label={processedNotifications.filter(n => !n.is_read).length}
              size="small"
              sx={{
                ml: 'auto',
                backgroundColor: '#ff0000',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.7rem',
                height: '20px',
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          )}
        </Box>
      </Box>

      {/* Compact Content */}
      <Box sx={{
        flex: 1,
        overflowY: 'auto',
        px: 1,
        pb: 1,
      }}>
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
                    alignItems: 'flex-start',
                    gap: 1.5,
                    p: 1.5,
                    mx: 0.5,
                    my: 0.5,
                    borderRadius: '6px',
                    background: notification.is_read
                      ? 'transparent'
                      : 'rgba(255, 0, 0, 0.05)',
                    border: '1px solid',
                    borderColor: notification.is_read
                      ? 'transparent'
                      : 'rgba(255, 0, 0, 0.2)',
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover': {
                      background: 'rgba(255, 0, 0, 0.08)',
                      borderColor: 'rgba(255, 0, 0, 0.3)',
                    }
                  }}
                  className={`notification-container ${notification.is_read ? 'read' : ''}`}
                >
                  {/* Avatar */}
                  <ButtonBase
                    onClick={() => {
                      setSelectedCreator(notification._id);
                      setShowPlayerModal(true);
                    }}
                    sx={{ borderRadius: '6px' }}
                  >
                    <Avatar
                      user_id={notification._id}
                      src={notification.avatar}
                      rank={notification.rank}
                      accessory={notification.accessory}
                      elite={notification.elite}
                      username={notification.username}
                      className="avatar"
                      style={{ width: 36, height: 36 }}
                    />
                  </ButtonBase>

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      component="a"
                      href={`/join/${notification.room}/`}
                      sx={{
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'block',
                        position: 'relative',
                      }}
                    >
                      {/* Unread indicator */}
                      {!notification.is_read && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -2,
                            right: -2,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: '#ff0000',
                          }}
                        />
                      )}

                      <Typography
                        variant="body2"
                        component="div"
                        sx={{
                          mb: 0.25,
                          lineHeight: 1.3,
                          fontWeight: notification.is_read ? 400 : 600,
                          color: isDarkMode ? '#e1e5e9' : '#2c3e50',
                          fontSize: '0.8rem',
                        }}
                        dangerouslySetInnerHTML={{ __html: processedMessage }}
                      />

                      <Typography
                        variant="caption"
                        sx={{
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                          fontSize: '0.7rem',
                        }}
                      >
                        {notification.from_now}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {index < processedNotifications.length - 1 && (
                  <Divider
                    sx={{
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                      mx: 1,
                    }}
                  />
                )}
              </Box>
            );
          })
        ) : (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
            gap: 1,
          }}>
            <NotificationsOffIcon sx={{
              fontSize: '2rem',
              opacity: 0.3,
              color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
            }} />
            <Typography
              variant="body2"
              sx={{
                color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                textAlign: 'center',
                fontSize: '0.85rem',
              }}
            >
              No notifications available
            </Typography>
          </Box>
        )}
      </Box>
    </Popover>
  );

  const renderModals = () => (
    <>
      <Suspense fallback={<div></div>}>
        <EliteSubscriptionModal
          user={user}
          walletBalance={walletData.balance}
          isWalletBalance={walletData.isWalletBalance}
          open={eliteModalOpen}
          onClose={() => setEliteModalOpen(false)}
          isLowGraphics={isLowGraphics}
        />
      </Suspense>

      {showAccountModal && (
        <Suspense fallback={<div>Loading Account Management...</div>}>
          <AccountManagementModal
            modalIsOpen={showAccountModal}
            closeModal={() => setShowAccountModal(false)}
          />
        </Suspense>
      )}

      {showPlayerModal && (
        <Suspense fallback={<div>Loading Player...</div>}>
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={() => setShowPlayerModal(false)}
          />
        </Suspense>
      )}

      {showLeaderboardsModal && (
        <Suspense fallback={<div>Loading Leaderboards...</div>}>
          <LeaderboardsModal
            modalIsOpen={showLeaderboardsModal}
            closeModal={() => setShowLeaderboardsModal(false)}
            player_name={userName}
            balance={balance}
            isDarkMode={isDarkMode}
          />
        </Suspense>
      )}

      {showHowToPlayModal && (
        <Suspense fallback={<div>Loading How To Play...</div>}>
          <HowToPlayModal
            modalIsOpen={showHowToPlayModal}
            closeModal={() => setShowHowToPlayModal(false)}
            player_name={userName}
            balance={balance}
            isDarkMode={isDarkMode}
          />
        </Suspense>
      )}

      {showAllGameLogs && (
        <Suspense fallback={<div>Loading Transactions...</div>}>
          <AllTransactionsModal
            modalIsOpen={showAllGameLogs}
            isDarkMode={isDarkMode}
            close={() => setShowAllGameLogs(false)}
            user={user?._id}
            solPrice={solPrice}
            transactions={transactions}
          />
        </Suspense>
      )}

      <Suspense fallback={<div></div>}>
        <GamePasswordModal />
      </Suspense>

      <ConflictDialog
        open={walletConflictOpen}
        onClose={() => setWalletConflictOpen(false)}
      />
    </>
  );

  // FIXED: Show loading state properly for authentication
  const shouldShowAuthenticatedContent = authState.isAuthenticated && user?._id;

  // Show loading until both Privy and app are ready
  if (!privyReady || authState.isLoading || !authState.hasCheckedAuth || !isInitialized) {
    return (
      <ThemeProvider theme={theme}>
        <div className={`site_wrapper ${isDarkMode ? 'dark_mode' : ''}`}>
          <div className="game_header">
            <div className="main_header">
              <Box>
                <a className="game_logo" href="/">
                  <img src="/img/game-logo.svg" alt="Game Logo" width="25" height="25" />
                  <span className="title desktop-only">CATSINO</span>
                </a>
                <a href="#" onClick={(e) => {
                  e.preventDefault();
                  setShowHowToPlayModal(true);
                }}>
                  [ HELP ]
                </a>
              </Box>
              <Skeleton variant="rectangular" width={200} height={40} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="rectangular" width={80} height={30} />
                <Skeleton variant="circular" width={40} height={40} />
              </Box>
            </div>
          </div>
          <div className="game_wrapper">
            <div className="contents_wrapper">{children}</div>
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
                  setShowHowToPlayModal(true);
                }}
              >
                [ HELP ]
              </a>
            </Box>

            <Suspense fallback={<Skeleton variant="rectangular" width={200} height={40} />}>
              <HistoryTable userId={shouldShowAuthenticatedContent ? user._id : null} />
            </Suspense>

            <div className="header_action_panel">
              {shouldShowAuthenticatedContent && (
                <>
                  <Box
                    component="a"
                    href="#"
                    className="desktop-only action-icon"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowLeaderboardsModal(true);
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
                      setAnchorElNotifications(e.currentTarget);
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

              {shouldShowAuthenticatedContent ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Use WalletBalanceDisplay with fallback */}
                    <Suspense fallback={
                      <Skeleton variant="rectangular" width={80} height={30} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                    }>
                      <WalletBalanceDisplay
                        onBalanceClick={handleBalanceClick}
                        isHovered={isHovered}
                        setIsHovered={setIsHovered}
                      />
                    </Suspense>
                  </Box>

                  <Box
                    component="a"
                    href="#"
                    className="mobile-only"
                    onClick={handleNotificationsClick}
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
                    {user ? (
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
                    ) : (
                      <Skeleton variant="circular" width={38} height={38} />
                    )}
                    <ArrowDropDown sx={{ color: '#ffffff' }} />
                  </Button>

                  {renderProfileMenu()}
                </>
              ) : (
                <Suspense fallback={
                  <Skeleton variant="rectangular" width={80} height={36} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                }>
                  <PrivyLogin />
                </Suspense>
              )}
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