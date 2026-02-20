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
  useTheme,
  Popover,
  Typography,
  Table,
  TableBody,
  TableCell,
  useMediaQuery,
  TableRow,
  Badge,
  DialogTitle,
  Chip,
} from '@mui/material';

import { ThemeProvider } from '@mui/material/styles';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXTwitter, faTelegram } from '@fortawesome/free-brands-svg-icons';

import {
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
  Home
} from '@mui/icons-material';
import WalletBalanceDisplay from '../components/WalletBalanceDisplay.jsx';
import socketClient from '../util/socketClient.js';
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
  loadIndividualRoom,
  getRoomIds,
  updateSingleRoom,
} from '../redux/Logic/logic.actions.js';
import PrivyLogin from './modal/PrivyLogin.jsx';
import { usePrivy } from '@privy-io/react-auth';
import { faBell, faBellSlash, faHistory } from '@fortawesome/free-solid-svg-icons';

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

function SiteWrapper({ children, selectedMobileTab, setSelectedMobileTab }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
  const [showLeaderboardsModal, setShowLeaderboardsModal] = useState(false);
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
  const initializationRef = useRef(false);

  // Stable socket endpoint - allow override for production/staging
  const endpoint = useMemo(() => {
    const override = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_BASE;
    if (override && typeof override === 'string' && override.trim() !== '') {
      return override.trim();
    }

    return process.env.NODE_ENV === 'production'
      ? window.location.origin
      : `http://${window.location.hostname}:5001`;
  }, []);

  const disableSocket =
    process.env.REACT_APP_DISABLE_SOCKET === 'true' ||
    process.env.REACT_APP_USE_MOCK === 'true';

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

  // UPDATED: Create socket handlers using the new socketClient
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
              socketClient.markMessageAsRead(user._id, data.from);
            } else {
              socketClient.requestUnreadMessageCount(user._id);
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

      handleRoomDataUpdate: (data) => {
        try {
          console.log('🔔 ROOM_DATA_UPDATE received:', data);
          if (data?.roomId && data?.roomData) {
            console.log('🔄 Room data received:', {
              roomId: data.roomId,
              liquidity: data.roomData.user_bet,
              battles: data.roomData.battles,
              likes: Array.isArray(data.roomData.likes) ? data.roomData.likes.length : data.roomData.likes,
              dislikes: Array.isArray(data.roomData.dislikes) ? data.roomData.dislikes.length : data.roomData.dislikes
            });
            
            // Directly update the Redux store with the provided room data
            console.log('🔄 Directly updating Redux store for room:', data.roomId);
            console.log('🔄 Room data being saved:', {
              name: data.roomData.name,
              user_bet: data.roomData.user_bet,
              battles: data.roomData.battles,
              likes: data.roomData.likes?.length || 'unknown',
              dislikes: data.roomData.dislikes?.length || 'unknown',
              updateType: data.updateType
            });
            
            dispatch({
              type: 'INDIVIDUAL_ROOM_LOADED',
              payload: {
                roomId: data.roomId,
                room: data.roomData
              }
            });
          }
        } catch (error) {
          console.error('Error handling room data update:', error);
        }
      },

      handleRoomsCacheInvalidate: (data) => {
        try {
          console.log('🔔 ROOMS_CACHE_INVALIDATE received:', data);
          if (data?.affectedRoomId) {
            console.log('🔄 Refreshing ONLY specific room:', data.affectedRoomId);
            dispatch(loadIndividualRoom(data.affectedRoomId));
          } else {
            console.log('🔄 Refreshing all rooms');
            dispatch(getRoomIds({ game_type: 'All' }));
          }
        } catch (error) {
          console.error('Error handling cache invalidation:', error);
        }
      },
    };
  }, [
    dispatch, user?._id, isMuted, notificationSounds, isNotificationsAllowed, location.pathname
  ]);

  // Event handlers - simplified
  const handleClickOutside = useCallback(() => {
    if (anchorElProfile) {
      setAnchorElProfile(null);
    }
  }, [anchorElProfile]);

  // 3. Fixed logout function to properly disconnect socket
  const handleLogout = useCallback(async (clearToken) => {
  // Prevent multiple logout calls
  if (handleLogout.isLoggingOut) {
    return;
  }
  handleLogout.isLoggingOut = true;

  try {
    // IMMEDIATE UI Updates (optimistic)
    setAnchorElProfile(null);
    setAuthState({
      isReady: true,
      isAuthenticated: false,
      isLoading: false,
      hasCheckedAuth: true
    });

    // Start all operations in parallel (don't wait)
    const operations = [];

    // 1. Socket cleanup (non-blocking)
    operations.push(
      new Promise((resolve) => {
        try {
          socketClient.disconnect();
          resolve();
        } catch (error) {
          console.warn('Socket disconnect error:', error);
          resolve(); // Don't block on socket errors
        }
      })
    );

    // 2. Backend logout (with timeout)
    operations.push(
      Promise.race([
        dispatch(userSignOut(clearToken, navigate)),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Backend logout timeout')), 3000)
        )
      ]).catch(error => {
        console.warn('Backend logout failed:', error);
        // Continue anyway - don't block UI
      })
    );

    // 3. Privy logout (with timeout)
    operations.push(
      Promise.race([
        privyLogout(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Privy logout timeout')), 3000)
        )
      ]).catch(error => {
        console.warn('Privy logout failed:', error);
        // Continue anyway
      })
    );

    // Execute all operations in parallel with timeout
    await Promise.allSettled(operations);

    // Force cleanup regardless of operation results
    if (clearToken) {
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      setAuthToken();
    }

    // Clear Redux state
    dispatch({ type: 'LOGOUT' });

    // Navigate immediately
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }

  } catch (error) {
    console.error('Logout error:', error);
    // Force cleanup even on error
    if (clearToken) {
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      setAuthToken();
    }
    dispatch({ type: 'LOGOUT' });
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  } finally {
    handleLogout.isLoggingOut = false;
  }
}, [dispatch, navigate, privyLogout, location.pathname]);


  window.socketDebug = () => {
    const status = socketClient.getConnectionStatus();

    return status;
  };



  const handlePortfolio = useCallback(() => {
    navigate('/portfolio');
    dispatch(selectMainTab(1));
  }, [navigate, dispatch]);

  // Handler functions - simplified
  const handleOpenHowToPlayModal = () => setShowHowToPlayModal(true);
  const handleOpenProfileMenu = (e) => {

    e.stopPropagation(); // Stop the event from bubbling up
    setAnchorElProfile(e.currentTarget);
  };
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

  // UPDATED: Load history and chat immediately in SiteWrapper.jsx

  useEffect(() => {
    if (!authState.hasCheckedAuth || isInitialized) return;

    const initializeApp = async () => {
      try {
        // CRITICAL: Show UI immediately
        setIsInitialized(true);
        setWebsiteLoading(false);

        // IMMEDIATE: Load history and chat logs right away (don't wait for anything)
        const immediateDataPromises = [
          dispatch(getGlobalChatLogs()),
          dispatch(getHistory()),
        ];

        // Start loading immediately in parallel
        Promise.allSettled(immediateDataPromises).catch(error => {
          console.error('⚠️ Failed to load immediate data:', error);
        });

        // Load user-specific data if authenticated
        if (authState.isAuthenticated && user?._id) {
          dispatch(getNotifications()).catch(error => {
            console.error('⚠️ Failed to load notifications:', error);
          });
        }

        // Initialize basic functionality
        document.addEventListener('mousedown', handleClickOutside);

        // Connect socket in background AFTER UI is ready (don't block data loading)
        if (!disableSocket) {
          setTimeout(async () => {
            try {
              const socket = await socketClient.connect(endpoint);
              if (socket) {
                dispatch(setSocket(socket));
              }
            } catch (socketError) {
              console.error('❌ Socket connection failed during init:', socketError);
              // Don't block the app if socket fails
            }

            // Initialize audio
            initializeAudio().catch(console.warn);
          }, 100); // Small delay to let UI render
        } else {
          initializeAudio().catch(console.warn);
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
  }, [authState.hasCheckedAuth, authState.isAuthenticated, isInitialized, user?._id, endpoint, dispatch, disableSocket]);


  useEffect(() => {
    if (disableSocket || !isInitialized || !authState.hasCheckedAuth) return;

    let isMounted = true;
    let socketConnectionRef = null;

    const connectSocket = async () => {
      try {
        // Don't create multiple connections
        if (socketClient.getConnectionStatus().isConnected) {
          return;
        }

        socketConnectionRef = await socketClient.connect(endpoint);

        if (socketConnectionRef && isMounted) {
          dispatch(setSocket(socketConnectionRef));
        }

      } catch (error) {
        console.error('❌ Socket connection failed:', error);
        // Don't retry immediately to prevent loops
        if (isMounted) {
          setTimeout(() => {
            if (isMounted && !socketClient.getConnectionStatus().isConnected) {
              connectSocket();
            }
          }, 3000); // Wait 3 seconds before retry
        }
      }
    };

    connectSocket();

    return () => {
      isMounted = false;
      // Don't disconnect here - let other effects handle cleanup
    };
  }, [isInitialized, authState.hasCheckedAuth, endpoint, dispatch, disableSocket]);

  useEffect(() => {
    if (!socket?.id || !socket.connected) {
      return;
    }

    const handlers = createSocketHandlers();

    try {
      socketClient.setupGlobalHandlers(handlers);
    } catch (error) {
      console.error('❌ Failed to setup global handlers:', error);
    }

    return () => {
      try {
        // Don't clear all handlers, just the global ones
        if (socketClient.socket?.id === socket.id) {
          socketClient.clearHandlers();
        }
      } catch (error) {
        console.error('❌ Error cleaning up handlers:', error);
      }
    };
  }, [socket?.id]);  // Use socket.id to detect actual socket changes

  // UPDATED: User-specific socket events
  useEffect(() => {
    if (!user?._id || !socket?.id || !socket.connected) {

      return;
    }

    const handlers = createSocketHandlers();

    try {
      socketClient.setupUserHandlers(user._id, handlers);
    } catch (error) {
      console.error('❌ Failed to setup user handlers:', error);
    }

    return () => {
      try {
        if (socketClient.socket?.id === socket.id) {
          socketClient.clearUserHandlers(user._id);
        }
      } catch (error) {
        console.error('❌ Error cleaning up user handlers:', error);
      }
    };
  }, [user?._id, socket?.id]);

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


  const HomeButton = () => (
    <Tooltip title="Home" arrow placement="top">
      <ButtonBase
        onClick={() => navigate('/')}
        sx={{
          padding: '6px 8px',
          borderRadius: '12px',
          background: 'transparent',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          minWidth: '40px',
          '&:hover': {
            transform: 'scale(1.05)',
            borderColor: 'rgba(255, 255, 255, 0.4)',
            boxShadow: '0 4px 20px rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        <Home
          sx={{
            width: '16px',
            height: '16px',
            color: '#e1e5e9',
            transition: 'transform 0.2s ease',
          }}
        />
      </ButtonBase>
    </Tooltip>
  );

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
         background: 'rgba(22, 22, 22, 0.98)', // nearly solid, very dark
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          minWidth: '160px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          mt: 0.5,
          '& .MuiMenuItem-root': {
            py: 0.75,
            px: 1.5,
            fontSize: '0.75rem',
            fontWeight: 500,
            color: '#ffffff',
            minHeight: '32px',
            borderRadius: '4px',
            mx: 0.5,
            my: 0.25,
            '&:hover': {
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              color: '#ffffff',
            },
            '&.elite-item': {
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              '&:hover': {
                backgroundColor: 'rgba(255, 215, 0, 0.2)',
              },
            },
            '&.logout-item': {
              '&:hover': {
                backgroundColor: 'rgba(220, 53, 69, 0.2)',
              },
            },
          },
          '& .MuiListItemIcon-root': {
            color: '#ffffff',
            minWidth: '24px',
            '& .MuiSvgIcon-root': {
              fontSize: '0.9rem',
            },
          },
          '& .elite-item .MuiListItemIcon-root': {
            color: '#ffd700',
          },
          '& .MuiListItemText-root': {
            '& .MuiListItemText-primary': {
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.5px',
            },
          },
          '& .MuiDivider-root': {
            borderColor: 'rgba(255, 255, 255, 0.1)',
            my: 0.5,
            mx: 0.5,
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
          <Star />
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
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            color: '#fff',
            minWidth: '350px',
            maxWidth: '90vw',
          },
        },
      }}
    >
      {/* Clean Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FontAwesomeIcon
            icon={faHistory}
            style={{
              color: '#ff0000',
              fontSize: '14px'
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            Balance History
          </Typography>
        </Box>
        <Tooltip
          title="Net profit shown (winnings - bet - fees)"
          placement="top"
          arrow
        >
          <IconButton
            size="small"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { color: '#fff' },
            }}
          >
            <QuestionMark sx={{ fontSize: '14px' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Content */}
      <Box sx={{ padding: '16px' }}>
        <Box
          sx={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '4px',
            mb: 2,
            overflow: 'hidden',
          }}
        >
          <Table size="small">
            <TableBody>
              {isLoadingTransactions ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    <TableCell sx={{ py: 1, px: 1.5, borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                      <Skeleton variant="text" width="60%" height={16} />
                    </TableCell>
                    <TableCell sx={{ py: 1, px: 1.5, borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                      <Skeleton variant="text" width="80%" height={16} />
                    </TableCell>
                    <TableCell sx={{ py: 1, px: 1.5, borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                      <Skeleton variant="text" width="40%" height={16} />
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
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '0.8rem',
                      borderColor: 'rgba(255, 255, 255, 0.05)',
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
                          borderColor: 'rgba(255, 255, 255, 0.05)',
                          py: 1,
                          px: 1.5,
                        }
                      }}
                    >
                      <TableCell sx={{
                        color: isPositive ? '#00ff00' : '#ff0000',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}>
                        {isPositive
                          ? `+ ${amount.toFixed(4)} SOL`
                          : `- ${Math.abs(amount).toFixed(4)} SOL`}
                      </TableCell>
                      <TableCell sx={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '0.75rem',
                      }}>
                        {row.description}
                      </TableCell>
                      <TableCell sx={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.7rem',
                      }}>
                        {row.from_now || 'Invalid Date'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>

        <Button
          color="error"
          variant="contained"
          onClick={() => setShowAllGameLogs(true)}
          fullWidth
          disabled={isLoadingTransactions}
          size="small"
          sx={{
            borderRadius: '4px',
            py: 0.75,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.75rem',
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
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            color: '#fff',
            width: 320,
            maxWidth: '90vw',
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      {/* Clean Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FontAwesomeIcon
            icon={faBell}
            style={{
              color: '#ff0000',
              fontSize: '14px'
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            Notifications
          </Typography>
        </Box>

        {/* Notification count */}
        {processedNotifications.filter(n => !n.is_read).length > 0 && (
          <Chip
            label={processedNotifications.filter(n => !n.is_read).length}
            size="small"
            sx={{
              backgroundColor: '#ff0000',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.65rem',
              height: '18px',
              '& .MuiChip-label': { px: 0.75 },
            }}
          />
        )}
      </Box>

      {/* Content */}
      <Box sx={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
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
                    gap: 1,
                    p: 1.5,
                    borderRadius: '4px',
                    background: notification.is_read
                      ? 'transparent'
                      : 'rgba(255, 0, 0, 0.05)',
                    border: '1px solid',
                    borderColor: notification.is_read
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(255, 0, 0, 0.2)',
                    cursor: 'pointer',
                    position: 'relative',
                    mb: 0.5,
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
                    sx={{ borderRadius: '4px' }}
                  >
                    <Avatar
                      user_id={notification._id}
                      src={notification.avatar}
                      rank={notification.rank}
                      accessory={notification.accessory}
                      elite={notification.elite}
                      username={notification.username}
                      className="avatar"
                      style={{ width: 32, height: 32 }}
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
                            width: 6,
                            height: 6,
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
                          color: '#e1e5e9',
                          fontSize: '0.75rem',
                        }}
                        dangerouslySetInnerHTML={{ __html: processedMessage }}
                      />

                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '0.65rem',
                        }}
                      >
                        {notification.from_now}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {index < processedNotifications.length - 1 && (
                  <Box sx={{ height: '1px', background: 'rgba(255, 255, 255, 0.05)', mx: 1, my: 0.5 }} />
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
            <FontAwesomeIcon
              icon={faBellSlash}
              style={{
                fontSize: '2rem',
                color: 'rgba(255, 255, 255, 0.3)',
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                textAlign: 'center',
                fontSize: '0.8rem',
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

  // SiteWrapper.jsx - Updated main_header section


  const renderMobileNavButtons = () => {
    if (!selectedMobileTab || !setSelectedMobileTab) return null;

    return (
      <Box
        className="mobile-nav-header"
        sx={{
          display: { xs: 'flex', lg: 'none' },
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        {/* Live Games Button */}
        <Button
           onClick={() => {
            setSelectedMobileTab('live_games');
            navigate('/');
          }}
          sx={{
            minWidth: 0,
            px: 1.5,
            py: 0.5,
            color: selectedMobileTab === 'live_games' ? '#fff' : '#8E9297',
            backgroundColor: selectedMobileTab === 'live_games' ? 'rgba(255, 0, 0, 0.2)' : 'transparent',
            border: selectedMobileTab === 'live_games' ? '1px solid #ff0000' : '1px solid transparent',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            '&:hover': {
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              color: '#fff',
            },
          }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 32 32" style={{ marginRight: '4px' }}>
            <path
              stroke="currentColor"
              strokeWidth="1.5"
              d="M24.9 25.945c2.625-2.578 4.1-6.076 4.1-9.722 0-3.647-1.475-7.144-4.1-9.723M7.1 25.945C4.476 23.367 3 19.87 3 16.223 3 12.576 4.475 9.079 7.1 6.5M21 22.5c1.92-1.658 3-3.906 3-6.25s-1.08-4.592-3-6.25M14 17.678v-3.356c0-.79.871-1.268 1.537-.844l2.637 1.678c.618.393.618 1.295 0 1.688l-2.637 1.678c-.666.424-1.537-.055-1.537-.844zM11 22.5c-1.92-1.658-3-3.906-3-6.25s1.08-4.592 3-6.25"
            />
          </svg>
          Games
        </Button>

        {/* My Games Button */}
        <Button
          onClick={() => {
            setSelectedMobileTab('my_games');
            navigate('/portfolio');
          }}
          sx={{
            minWidth: 0,
            px: 1.5,
            py: 0.5,
            color: selectedMobileTab === 'my_games' ? '#fff' : '#8E9297',
            backgroundColor: selectedMobileTab === 'my_games' ? 'rgba(255, 0, 0, 0.2)' : 'transparent',
            border: selectedMobileTab === 'my_games' ? '1px solid #ff0000' : '1px solid transparent',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            '&:hover': {
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              color: '#fff',
            },
          }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 33 32" style={{ marginRight: '4px' }}>
            <path
              stroke="currentColor"
              strokeWidth="1.5"
              d="M27.5 27.5c0-2.917-1.159-5.715-3.222-7.778-2.063-2.063-4.86-3.222-7.778-3.222-2.917 0-5.715 1.159-7.778 3.222C6.659 21.785 5.5 24.582 5.5 27.5"
            />
            <path
              fill="currentColor"
              d="M18.651 12.702l-.674.33.674-.33zm-.294-.602l.674-.33c-.126-.257-.387-.42-.674-.42v.75zm-3.714 0v-.75c-.287 0-.548.163-.674.42l.674.33zm7.607-4.75v4.302h1.5V7.35h-1.5zm-2.925 5.022l-.294-.601-1.348.658.294.602 1.348-.659zm-.968-1.022h-3.714v-1.5h3.714v-1.5zm-4.388.42l-.294.602 1.348.66.294-.603-1.348-.658zm-3.219-.118V7.35h-1.5v4.302h1.5zm2.036-6.402h7.428v-1.5h-7.428v1.5zm-.49 8c-.838 0-1.546-.7-1.546-1.598h-1.5c0 1.695 1.348 3.098 3.046 3.098v-1.5zm8.408 0c-.576 0-1.113-.333-1.379-.878l-1.348.66c.512 1.046 1.565 1.718 2.727 1.718v-1.5zm1.546-1.598c0 .899-.708 1.598-1.546 1.598v1.5c1.698 0 3.046-1.403 3.046-3.098h-1.5zm-8.575.72c-.266.545-.803.878-1.38.878v1.5c1.163 0 2.216-.672 2.728-1.719l-1.348-.659zM23.75 7.35c0-1.972-1.567-3.6-3.536-3.6v1.5c1.109 0 2.036.924 2.036 2.1h1.5zm-13 0c0-1.176.928-2.1 2.036-2.1v-1.5c-1.969 0-3.536 1.628-3.536 3.6h1.5zm1.571 1.7h2.786v-1.5h-2.786v1.5zm.643-2.175v2.85h1.5v-2.85h-1.5zM19.75 8.1h.929V6.6h-.929v1.5zM17.893 10h.928V8.5h-.928V10z"
            />
          </svg>
          Portfolio
        </Button>

        {/* Chat Button */}
        <Button
          onClick={() => {
            setSelectedMobileTab('chat');
            navigate('/');
          }}
          sx={{
            minWidth: 0,
            px: 1.5,
            py: 0.5,
            color: selectedMobileTab === 'chat' ? '#fff' : '#8E9297',
            backgroundColor: selectedMobileTab === 'chat' ? 'rgba(255, 0, 0, 0.2)' : 'transparent',
            border: selectedMobileTab === 'chat' ? '1px solid #ff0000' : '1px solid transparent',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            '&:hover': {
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              color: '#fff',
            },
          }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 33 32" style={{ marginRight: '4px' }}>
            <path
              stroke="currentColor"
              strokeWidth="1.5"
              d="M28 16c0 6.351-5.149 11.5-11.5 11.5-1.407 0-2.754-.253-4-.715-2.75-1.02-4.091 1.378-4.75.965-.685-.43 1.328-2.929.75-3.489C6.342 22.171 5 19.242 5 16 5 9.649 10.149 4.5 16.5 4.5S28 9.649 28 16z"
            />
            <circle cx="10.5" cy="16" r="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="16.5" cy="16" r="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="22.5" cy="16" r="2" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Chat
        </Button>
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      {showCookieConsent && <CookieConsent />}

      {renderRestrictedCountryDialog()}

      <div className={`site_wrapper ${isDarkMode ? 'dark_mode' : ''}`}>
        <div className="game_header">
          <div className="main_header" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            minHeight: '56px',
            width: '100%',
            boxSizing: 'border-box',
          }}>
            {/* Left section - Logo and Help */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              flex: { xs: '0 0 auto', lg: '1' },
              minWidth: 0,
            }}>
              <a
                className="game_logo"
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/';
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <img src="/img/game-logo.svg" alt="Game Logo" width="25" height="25" />
                <span className="title" style={{
                  display: window.innerWidth > 768 ? 'inline' : 'none',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                }}>
                  CATSINO
                </span>
              </a>
              <a
                href="#"
                style={{
                  position: "relative",
                  fontWeight: "400",
                  marginLeft: window.innerWidth > 768 ? '20px' : '12px',
                  fontSize: window.innerWidth > 768 ? '1rem' : '0.8rem',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  setShowHowToPlayModal(true);
                }}
              >
                [ HELP ]
              </a>
            </Box>

            {/* Center section - Mobile nav buttons (only on mobile) */}
            {renderMobileNavButtons()}

            {/* Center section - History table (desktop only) */}
            <Box sx={{
              display: { xs: 'none', lg: 'flex' },
              flex: 1,
              justifyContent: 'center',
            }}>
              <Suspense fallback={<Skeleton variant="rectangular" width={200} height={40} />}>
                <HistoryTable userId={shouldShowAuthenticatedContent ? user._id : null} />
              </Suspense>
            </Box>

            {/* Right section - User actions */}
            <div className="header_action_panel" style={{
              display: 'flex',
              alignItems: 'center',
              gap: window.innerWidth > 768 ? '12px' : '6px',
              flex: '0 0 auto',
            }}>
              {shouldShowAuthenticatedContent && (
                <>
                  {/* Desktop-only action buttons */}
                  <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 1.5 }}>
                    <Box
                      component="a"
                      href="#"
                      className="action-icon"
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
                        '&:hover': { color: '#ff3030' }
                      }}
                    >
                      <LeaderboardOutlined fontSize="medium" />
                    </Box>

                    <Box
                      component="a"
                      href="#"
                      className="action-icon"
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
                  </Box>
                  {isMobile && <HomeButton />}

                  {/* Wallet Balance */}
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
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

                  {/* Mobile notifications */}
                  <Box
                    component="a"
                    href="#"
                    sx={{
                      display: { xs: 'inline-flex', lg: 'none' },
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#ffffff',
                      '&:hover': { color: '#ff3030' }
                    }}
                    onClick={handleNotificationsClick}
                    id="btn_notifications_mobile"
                  >
                    <Badge
                      badgeContent={unreadNotificationsCount > 10 ? '9+' : unreadNotificationsCount}
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '9px',
                          height: '14px',
                          minWidth: '14px',
                          backgroundColor: '#ff3030'
                        }
                      }}
                    >
                      <NotificationsOutlined fontSize="small" />
                    </Badge>
                  </Box>

                  {/* Profile Button */}
                  <Button
                    aria-controls="profile-menu"
                    aria-haspopup="true"
                    onClick={handleOpenProfileMenu}
                    className="profile-menu"
                    sx={{
                      padding: '4px',
                      minWidth: 'auto',
                      borderRadius: '50%',
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
                        sx={{ width: window.innerWidth > 768 ? 38 : 32, height: window.innerWidth > 768 ? 38 : 32 }}
                      />
                    ) : (
                      <Skeleton variant="circular" width={32} height={32} />
                    )}
                    <ArrowDropDown sx={{
                      color: '#ffffff',
                      fontSize: window.innerWidth > 768 ? '1.5rem' : '1.2rem'
                    }} />
                  </Button>
                </>
              )}

              {!shouldShowAuthenticatedContent && (
                <Suspense fallback={
                  <Skeleton variant="rectangular" width={80} height={36} sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                }>
                  <PrivyLogin />
                </Suspense>
              )}
            </div>
          </div>
          {renderProfileMenu()}
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
