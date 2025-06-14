import React, { useEffect, useState, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDice, faCoins, faChevronDown, faRocket, faHome, faSpinner, faGem, faTrophy,
  faRedo, faBomb, faStar, faCogs, faExchangeAlt, faInfoCircle, faChevronUp,
  faArrowUp, faArrowDown, faVolumeUp, faVolumeMute, faCog, faExclamationTriangle,
  faCheck, faTimes, faPlay, faHistory, faChartLine, faWallet, faShieldAlt,
  faHeart, faSkull, faClock, faBolt,
} from '@fortawesome/free-solid-svg-icons';
import { createAccountFromPrivyUser } from '../../util/solana';
import { usePrivy } from '@privy-io/react-auth';

import {
  Paper, Button, Tooltip, CircularProgress, TextField, useMediaQuery, Typography,
  Box, Slider, Avatar, Chip, Card, Fade, Dialog, DialogContent, DialogContentText,
  DialogActions, DialogTitle, Grid, Divider, Collapse, IconButton, Container,
  Table, TableBody, TableCell, TableHead, TableRow, Badge, Snackbar, Alert,
  Zoom, Grow, CardContent, CardActions, TableContainer, Checkbox, Modal, FormControlLabel,
} from '@mui/material';
import styled from 'styled-components';
import * as Babel from '@babel/standalone';
import { convertToCurrency } from '../../util/conversion';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  validateIsAuthenticated,
  validateBetAmount,
  validateBankroll,
} from '../modal/betValidations';
import { sendSolDeposit } from '../../util/solana';
import { safeDeepEqual, createShallowComparison } from '../../util/safeStateComparison';

// Lazy load components for better performance
const PlayerModal = lazy(() => import('../modal/PlayerModal'));
const AiPanel = lazy(() => import('../../components/AiPanel'));

// Custom hooks for better organization
const useResponsiveGameContainer = () => {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  const resizeObserverRef = useRef(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setContainerSize({ width: offsetWidth, height: offsetHeight });
      }
    };

    // Use ResizeObserver for better performance than window resize
    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(updateSize);
      if (containerRef.current) {
        resizeObserverRef.current.observe(containerRef.current);
      }
    } else {
      // Fallback for older browsers
      updateSize();
      window.addEventListener('resize', updateSize);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      } else {
        window.removeEventListener('resize', updateSize);
      }
    };
  }, []);

  return { containerRef, containerSize };
};

const usePhysicsEngine = () => {
  const [Physics, setPhysics] = useState(null);
  const [isPhysicsLoading, setIsPhysicsLoading] = useState(true);
  const [physicsError, setPhysicsError] = useState(null);

  const loadPhysics = useCallback(async () => {
    try {
      // Check if already loaded
      if (window.Matter && window.Matter.World && typeof window.Matter.World === 'function') {
        return window.Matter;
      }

      try {
        const matterModule = await import('matter-js');
        if (!matterModule || !matterModule.World || !matterModule.Engine) {
          throw new Error('Matter.js module loaded but missing required properties');
        }
        window.Matter = matterModule;
        return matterModule;
      } catch (importError) {

        // CDN fallback
        const matterModule = await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/build/matter.min.js';
          script.onload = () => {
            if (window.Matter && window.Matter.World && window.Matter.Engine) {
              resolve(window.Matter);
            } else {
              reject(new Error('Matter.js CDN loaded but missing required properties'));
            }
          };
          script.onerror = () => reject(new Error('Failed to load Matter.js from CDN'));
          document.head.appendChild(script);
        });
        return matterModule;
      }
    } catch (error) {
      console.error('[Custom] Failed to load Matter.js:', error);
      throw new Error(`Failed to load Matter.js: ${error.message}`);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initPhysics = async () => {
      setIsPhysicsLoading(true);
      setPhysicsError(null);

      try {
        const matterModule = await loadPhysics();
        if (mounted) {
          setPhysics(matterModule);
        }
      } catch (error) {
        if (mounted) {
          setPhysicsError(error.message);
        }
      } finally {
        if (mounted) {
          setIsPhysicsLoading(false);
        }
      }
    };

    initPhysics();

    return () => {
      mounted = false;
    };
  }, [loadPhysics]);

  return { Physics, isPhysicsLoading, physicsError };
};

const ResponsiveGameContainer = React.memo(({
  GameComponent,
  componentError,
  proxiedAssets,
  logEvent,
  Physics,
  isWalletPopupActive,
  isProcessing, // Add this prop
  processingMessage,
  isCreator,
  containerSize,
  isMobile,
  isTablet
}) => {

  const containerStyles = useMemo(() => ({
    width: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    overflow: 'visible',
    position: 'relative',

  }), []);

  const renderGameContent = () => {
    if (componentError) {
      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          textAlign: 'center'
        }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f44336, #d32f2f)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              boxShadow: '0 8px 24px rgba(244, 67, 54, 0.4)',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: '#fff',
                fontWeight: 800,
              }}
            >
              ⚠️
            </Typography>
          </Box>
          <Typography
            variant={isMobile ? "h6" : "h5"}
            sx={{
              mb: 2,
              color: '#f44336',
              fontWeight: 700,
              fontSize: isMobile ? '1.1rem' : '1.3rem',
            }}
          >
            Game Error
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: 1.5,
              maxWidth: '400px',
            }}
          >
            {componentError}
          </Typography>
        </Box>
      );
    }

    if (!GameComponent) {
      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          p: 4,
          textAlign: 'center'
        }}>
          <CircularProgress
            color='error'
            sx={{
              mb: 3,
            }}
            size={isMobile ? 40 : 48}
          />
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? '1rem' : '1.1rem',
              fontWeight: 600,
              mb: 1,
            }}
          >
            Loading Game...
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
            }}
          >
            Please wait while we prepare your game
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{
        width: '100%',
        height: '100%',
        overflow: 'visible',
        filter: (isWalletPopupActive || isProcessing) ? 'blur(8px)' : 'none',
        pointerEvents: (isWalletPopupActive || isProcessing) ? 'none' : 'auto',
        position: 'relative',
        transition: 'filter 0.3s ease',
      }}>
        <GameComponent
          proxiedAssets={proxiedAssets}
          logEvent={logEvent}
          Physics={Physics}
          containerSize={containerSize}
          isMobile={isMobile}
          isTablet={isTablet}
        />
      </Box>
    );
  };

  return (
    <Box sx={containerStyles} tabIndex="0">
      {renderGameContent()}

      {isProcessing && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          zIndex: 10,
          pointerEvents: 'auto',
          borderRadius: '20px',
        }}>
          <Box
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              p: 4,
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(20px)',
              maxWidth: '300px',
              mx: 2,
            }}
          >
            <CircularProgress
              color='error'
              sx={{ mb: 3 }}
              size={isMobile ? 40 : 48}
            />
            <Typography sx={{
              color: 'white',
              fontWeight: 700,
              fontSize: isMobile ? '1rem' : '1.1rem',
              mb: 1,
            }}>
              Processing
            </Typography>
            <Typography sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              lineHeight: 1.5,
            }}>
              {processingMessage || 'Please wait while we process your request...'}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Enhanced Creator Overlay */}
      {isCreator && (
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
        }}>
          <Box
            sx={{
              background: 'rgba(255, 152, 0, 0.1)',
              borderRadius: '20px',
              p: 4,
              textAlign: 'center',
              border: '1px solid rgba(255, 152, 0, 0.3)',
              backdropFilter: 'blur(20px)',
              maxWidth: '350px',
              mx: 2,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                mb: 2,
                fontSize: '2.5rem',
              }}
            >
              🚫
            </Typography>
            <Typography sx={{
              color: '#ff9800',
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: 700,
              mb: 2,
            }}>
              Creator Restriction
            </Typography>
            <Typography sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? '0.9rem' : '1rem',
              lineHeight: 1.6,
            }}>
              As the creator of this game, you cannot participate in your own room. Please invite others to join!
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
});

ResponsiveGameContainer.displayName = 'ResponsiveGameContainer';

// Main Custom Component
function Custom(props) {
  const dispatch = useDispatch();
  const { user: privyUser } = usePrivy();

  // Separate socket from other state to avoid circular reference issues
  const socket = useSelector((state) => state.auth.socket, (prev, next) => prev === next);

  // Memoized selector for non-circular state with safe comparison
  const reduxState = useSelector((state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    isPasswordCorrect: state.snackbar.isPasswordCorrect,
    balance: state.auth.balance,
    isDarkMode: state.auth.isDarkMode,
    isWatching: state.auth.isWatching,
    is_betting: state.logic.is_betting,
    solPrice: state.logic.solPrice,
    creator: state.logic.curRoomInfo.creator_name,
    creator_avatar: state.logic.curRoomInfo.creator_avatar,
    rank: state.logic.curRoomInfo.rank,
    accessory: state.logic.curRoomInfo.accessory,
    elite: state.logic.curRoomInfo.elite,
    username: state.logic.curRoomInfo.username,
    isLowGraphics: state.auth.isLowGraphics,
    connectedAccount: state.auth.walletAddress,
    account: state.logic.account,
    user_id: state.auth.user._id,
  }), safeDeepEqual);

  // Destructure props
  const {
    bankroll, user_id, creator_id, roomInfo, bet_amount, onChangeState, playSound,
    join, handle2xButtonClick, handleHalfXButtonClick, handleMaxButtonClick,
    actionList, handleOpenPlayerModal, handleClosePlayerModal, showPlayerModal,
    selectedCreator, betting, result, onResultChange,
  } = props;

  // Custom hooks
  const { containerRef, containerSize } = useResponsiveGameContainer();
  const { Physics, isPhysicsLoading, physicsError } = usePhysicsEngine();

  // Responsive breakpoints
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  // Local state - organized and optimized
  const [gameState, setGameState] = useState({
    isWalletPopupActive: false,
    gameStartedCount: 0,
    isGameActive: false,
    hasDeposited: false,
    isProcessing: false, // Add this
    processingMessage: '', // Add this
  });

  const blockGamePanel = (message = 'Processing...') => {
    setGameState(prev => ({ ...prev, isProcessing: true, processingMessage: message }));
  };

  const unblockGamePanel = () => {
    setGameState(prev => ({ ...prev, isProcessing: false, processingMessage: '' }));
  };

  const [roomState, setRoomState] = useState({
    poolId: roomInfo.pool_id,
    players: [],
    hostPr: roomInfo.host_pr,
    status: roomInfo.status,
  });

  const [componentState, setComponentState] = useState({
    GameComponent: null,
    componentError: physicsError,
    proxiedAssets: { images: [], audio: [], theme: {}, background: {} },
    gameResult: null,
    isPasswordCorrect: reduxState.isPasswordCorrect,
  });

  // Refs for performance
  const bankrollRef = useRef(bankroll);
  const isComponentMountedRef = useRef(false);
  const hasDepositedRef = useRef(false);

  // Update refs when props change
  useEffect(() => {
    bankrollRef.current = bankroll;
  }, [bankroll]);

  useEffect(() => {
    hasDepositedRef.current = gameState.hasDeposited;
  }, [gameState.hasDeposited]);

  // Memoized values
  const isCreator = useMemo(() =>
    creator_id && user_id && creator_id.toString() === user_id.toString(),
    [creator_id, user_id]
  );

  // Optimized keyboard handler
  const handleKeyDown = useCallback((event) => {
    const gameKeys = ['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '];
    const keyCodes = [32, 37, 38, 39, 40];

    if (gameKeys.includes(event.key) || keyCodes.includes(event.keyCode)) {
      if (gameState.isGameActive) {
        event.preventDefault();
      }
    }
  }, [gameState.isGameActive]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Optimized socket handlers
  const handleSocketData = useCallback((data) => {
    setRoomState(prev => ({
      ...prev,
      players: [...prev.players.slice(-4), data.user], // Keep only last 5 players
      hostPr: data.host_pr
    }));

    if (playSound) {
      playSound('blip');
    }

    onChangeState({
      bankroll: data.bankroll,
      battles: 1,
      hosts: data.hosts,
    });
  }, [playSound, onChangeState]);

  const handleSocketData2 = useCallback((data) => {
    onChangeState({ bankroll: data.bankroll });
  }, [onChangeState]);

  // Socket cleanup
  const removeSocketListeners = useCallback(() => {
    if (socket) {
      socket.off(`UPDATED_BANKROLL_${roomInfo._id}`, handleSocketData);
      socket.off(`UPDATED_BANKROLL2_${roomInfo._id}`, handleSocketData2);
    }
  }, [socket, roomInfo._id, handleSocketData, handleSocketData2]);

  // Solana deposit handler
  const processSolDeposit = useCallback(async () => {
    if (hasDepositedRef.current) {
      // console.log('[Custom] Deposit already processed for this game, skipping.');
      return true;
    }
    blockGamePanel('Please check your wallet and confirm the transaction to continue');

    // Enhanced account creation with multiple fallbacks (copied from EliteSubscriptionModal)
    let account = null;

    // Method 1: Try creating from Privy user
    if (privyUser?.wallet?.address) {
      try {
        account = createAccountFromPrivyUser(privyUser);
      } catch (error) {
        console.error('[Custom] Failed to create account from Privy user:', error);
      }
    }

    // Method 2: Try using Redux account
    if (!account && reduxState.account?.publicKey) {
      account = reduxState.account;
    }

    // Method 3: Try getting from connected wallet directly
    if (!account && window.solana?.publicKey) {
      try {
        account = {
          publicKey: window.solana.publicKey
        };
      } catch (error) {
        console.error('[Custom] Failed to create account from window.solana:', error);
      }
    }

    // Method 4: Try connecting wallet if not connected
    if (!account && window.solana) {
      try {
        if (!window.solana.isConnected) {
          // console.log('[Custom] Wallet not connected, attempting to connect...');
          await window.solana.connect();
        }

        if (window.solana.publicKey) {
          account = {
            publicKey: window.solana.publicKey
          };
        }
      } catch (error) {
        console.error('[Custom] Failed to connect wallet:', error);
      }
    }

    // Final validation
    if (!account?.publicKey) {
      console.error('[Custom] Failed to create account - no valid source found', {
        privyUser: !!privyUser?.wallet?.address,
        reduxAccount: !!reduxState.account?.publicKey,
        windowSolana: !!window.solana?.publicKey,
        walletConnected: window.solana?.isConnected
      });

      // Show user-friendly error
      dispatch({
        type: 'ERROR_MSG_BAR',
        payload: 'Wallet not connected. Please connect your Solana wallet and try again.'
      });
      onChangeState({ betting: false });
      return false;
    }

    // console.log('[Custom] Final account object:', {
    //   publicKey: account.publicKey.toString(),
    //   source: privyUser?.wallet?.address ? 'privy' :
    //     reduxState.account?.publicKey ? 'redux' : 'wallet'
    // });
    try {
      const depositResult = await sendSolDeposit(
        dispatch,
        parseFloat(bet_amount),
        roomInfo._id,
        roomInfo.name,
        'join',
        account, // Now using the properly created account
        reduxState.balance,
        () => {
          hasDepositedRef.current = true;
          setGameState(prev => ({ ...prev, hasDeposited: true }));
        },
        () => {
          console.error('[Custom] Solana deposit failed');
          onChangeState({ betting: false });
        },
        () => setGameState(prev => ({ ...prev, isWalletPopupActive: true })),
        () => setGameState(prev => ({ ...prev, isWalletPopupActive: false }))
      );

      if (!depositResult.success) {
        console.error('[Custom] Deposit failed:', depositResult.message);
        dispatch({ type: 'ERROR_MSG_BAR', payload: depositResult.message || 'Deposit failed.' });
        onChangeState({ betting: false });
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Custom] Error processing deposit:', error);
      dispatch({ type: 'ERROR_MSG_BAR', payload: 'Error processing deposit.' });
      onChangeState({ betting: false });
      return false;
    } finally {
      unblockGamePanel();
    }
  }, [dispatch, bet_amount, roomInfo._id, roomInfo.name, reduxState.account, reduxState.balance, onChangeState, privyUser]);

  // Game join logic
  const joinGame = useCallback(async (result, multiplier) => {
    onChangeState({ result: '' });
    blockGamePanel('Joining game...');

    try {
      const resultData = await join({
        bet_amount: parseFloat(bet_amount),
        result: result || null,
        multiplier: result === 'win' && multiplier !== undefined ? parseFloat(multiplier) : undefined,
      });

      const amount = resultData.amount || 0;
      const currencyElement = convertToCurrency(Math.abs(amount), reduxState.solPrice);
      const sign = amount >= 0 ? '+' : '-';

      let soundToPlay = null;
      if (resultData.betResult === 1) soundToPlay = 'win';
      else if (resultData.betResult === 0) soundToPlay = 'split';
      else soundToPlay = 'lose';

      if (playSound && soundToPlay) {
        playSound(soundToPlay);
      }

      const formattedResult = (
        <span style={{
          color: amount >= 0 ? '#00ff3a' : '#ff0000',
          fontSize: '1.2rem',
          fontWeight: 'bold',
        }}>
          {sign} {currencyElement}{' '}
          <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>
            ({Math.abs(amount).toFixed(4)} SOL)
          </span>
        </span>
      );

      onResultChange(formattedResult, false);
      onChangeState({ gameResult: resultData.betResult });

      setGameState(prev => ({
        ...prev,
        gameStartedCount: prev.gameStartedCount + 1,
        hasDeposited: false
      }));

    } catch (error) {
      console.error('[Custom] Error joining game:', error);

      // Show user-friendly error message
      const errorMessage = error.message || 'Failed to join game. Please try again.';
      onResultChange(
        <span style={{ color: '#ff0000', fontSize: '1rem' }}>
          {errorMessage}
        </span>,
        false
      );

      // Reset betting state
      onChangeState({ betting: false });

    } finally {
      // Always unblock the game panel, regardless of success or failure
      unblockGamePanel();
    }
  }, [bet_amount, join, onChangeState, reduxState.solPrice, playSound, onResultChange, blockGamePanel, unblockGamePanel, dispatch]);

  // Bet click handler
  const onBtnBetClick = useCallback(async (result, multiplier) => {
    blockGamePanel('Validating bet...');

    try {
      if (!validateIsAuthenticated(reduxState.isAuthenticated, dispatch)) return;
      console.log('[Custom] Validating bet amount:', bet_amount);
      console.log('[Custom] Current balance:', reduxState.balance);
      if (!validateBetAmount(bet_amount, reduxState.balance, dispatch)) return;
      if (!validateBankroll(bet_amount, bankrollRef.current, dispatch)) return;

      const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
      const passwordCorrect = rooms[roomInfo._id];

      const executeJoin = async () => {
        if (roomInfo.is_private && passwordCorrect !== true) {
          dispatch(openGamePasswordModal());
        } else {
          await joinGame(result, multiplier);
        }
      };

      await executeJoin();

    } finally {
      unblockGamePanel();
    }
  }, []);

  const logEvent = useCallback((eventType, data) => {
    if (playSound) {
      playSound('select');
    }

    if (eventType === 'gameStarted') {
      setGameState(prev => ({
        ...prev,
        gameStartedCount: prev.gameStartedCount + 1,
        isGameActive: true
      }));

      onResultChange('', true);

      const executeDeposit = async () => {
        const depositSuccess = await processSolDeposit();
        if (!depositSuccess) {
          setGameState(prev => ({ ...prev, isGameActive: false }));
          onResultChange('Deposit failed, please try again.', false);
        }
      };

      executeDeposit();
    } else if (eventType === 'gameEnded') {
      setGameState(prev => ({ ...prev, isGameActive: false }));

      const { result, multiplier } = data;
      const validResults = ['win', 'loss', 'other'];

      if (validResults.includes(result) && gameState.gameStartedCount > 0 && hasDepositedRef.current) {
        onBtnBetClick(result, result === 'win' ? multiplier : undefined);
      } else {
        onBtnBetClick(result, result === 'loss' ? multiplier : undefined);
        hasDepositedRef.current = false;
      }
    }
  }, [gameState.gameStartedCount, onBtnBetClick, playSound, onResultChange, processSolDeposit]);


  // Game code processing - optimized with useMemo
  const processedGameCode = useMemo(() => {
    if (!roomInfo.gameCode || !Physics || isPhysicsLoading) {
      return null;
    }

    try {
      // Clean the code
      let cleanedCode = roomInfo.gameCode
        .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*;?/g, '')
        .replace(/require\s*\(\s*['"][^'"]+['"]\s*\)\s*;?/g, '')
        .replace(/export\s+default\s+[\w\s]*?\s*;?/g, '')
        .replace(/export\s+[\w\s]*?\s*;?/g, '')
        .replace(/import\s*\(\s*['"][^'"]+['"]\s*\)\s*;?/g, '')
        .trim();

      // Babel helpers (moved to external constant for performance)
      const babelHelpers = `
        function _defineProperty(obj, key, value) {
          if (key in obj) {
            Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });
          } else {
            obj[key] = value;
          }
          return obj;
        }
        function _slicedToArray(arr, i) {
          return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
        }
        function _arrayWithHoles(arr) {
          if (Array.isArray(arr)) return arr;
        }
        function _iterableToArrayLimit(arr, i) {
          var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
          if (_i == null) return;
          var _arr = [];
          var _n = true;
          var _d = false;
          var _s, _e;
          try {
            for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
              _arr.push(_s.value);
              if (i && _arr.length === i) break;
            }
          } catch (err) {
            _d = true;
            _e = err;
          } finally {
            try {
              if (!_n && _i["return"] != null) _i["return"]();
            } finally {
              if (_d) throw _e;
            }
          }
          return _arr;
        }
        function _unsupportedIterableToArray(o, minLen) {
          if (!o) return;
          if (typeof o === "string") return _arrayLikeToArray(o, minLen);
          var n = Object.prototype.toString.call(o).slice(8, -1);
          if (n === "Object" && o.constructor) n = o.constructor.name;
          if (n === "Map" || n === "Set") return Array.from(o);
          if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
        }
        function _arrayLikeToArray(arr, len) {
          if (len == null || len > arr.length) len = arr.length;
          for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
          return arr2;
        }
        function _nonIterableRest() {
          throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
        }
        function _objectSpread(target) {
          for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i] != null ? arguments[i] : {};
            var ownKeys = Object.keys(source);
            if (typeof Object.getOwnPropertySymbols === 'function') {
              ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
              }));
            }
            ownKeys.forEach(function (key) {
              _defineProperty(target, key, source[key]);
            });
          }
          return target;
        }
      `;

      // Transpile with Babel
      let transpiledCode;
      try {
        transpiledCode = Babel.transform(cleanedCode, {
          presets: ['react', ['env', { modules: false, targets: { browsers: ['last 2 versions'] } }]],
          filename: 'app.jsx',
        }).code;
        transpiledCode = `${babelHelpers}\n${transpiledCode}`;
      } catch (babelError) {
        throw new Error(`Babel transpilation failed: ${babelError.message}`);
      }

      // Create component factory
      const componentFactory = new Function(
        'React', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useAnimation',
        'Grid', 'Box', 'Typography', 'TextField', 'Button', 'Slider', 'Dialog', 'Divider', 'Paper', 'Chip',
        'Collapse', 'DialogContent', 'DialogTitle', 'CircularProgress', 'logEvent', 'FontAwesomeIcon',
        'TableContainer', 'Table', 'TableBody', 'TableRow', 'TableCell', 'TableHead',
        'faDice', 'faCoins', 'faPlay', 'faRocket', 'faChevronDown', 'faGem', 'faSpinner', 'faCogs',
        'faExchangeAlt', 'faTrophy', 'faArrowUp', 'faArrowDown', 'faRedo', 'faBomb', 'faStar', 'faHome',
        'Physics', 'Card', 'CardContent', 'CardActions', 'Tooltip', 'motion', 'styled', 'Modal',
        'AnimatePresence', 'IconButton', 'Container', 'Badge', 'Snackbar', 'Alert', 'DialogContentText',
        'DialogActions', 'Zoom', 'Grow', 'faInfoCircle', 'faChevronUp', 'faVolumeUp', 'faVolumeMute',
        'faCog', 'faExclamationTriangle', 'faCheck', 'faTimes', 'faHistory', 'faChartLine', 'faWallet',
        'faShieldAlt', 'faHeart', 'faSkull', 'faClock', 'faBolt', 'proxiedAssets',
        `return function App(props) { ${transpiledCode} return App(props); };`
      );

      return componentFactory(
        React, useState, useEffect, useRef, useMemo, useCallback, useAnimation,
        Grid, Box, Typography, TextField, Button, Slider, Dialog, Divider, Paper, Chip,
        Collapse, DialogContent, DialogTitle, CircularProgress, logEvent, FontAwesomeIcon,
        TableContainer, Table, TableBody, TableRow, TableCell, TableHead,
        faDice, faCoins, faPlay, faRocket, faChevronDown, faGem, faSpinner, faCogs,
        faExchangeAlt, faTrophy, faArrowUp, faArrowDown, faRedo, faBomb, faStar, faHome,
        Physics, Card, CardContent, CardActions, Tooltip, motion, styled, AnimatePresence,
        IconButton, Container, Badge, Snackbar, Alert, DialogContentText, DialogActions,
        Zoom, Modal, Grow, faInfoCircle, faChevronUp, faVolumeUp, faVolumeMute, faCog,
        faExclamationTriangle, faCheck, faTimes, faHistory, faChartLine, faWallet,
        faShieldAlt, faHeart, faSkull, faClock, faBolt, componentState.proxiedAssets
      );
    } catch (error) {
      console.error('[Custom] Error processing game code:', error);
      return null;
    }
  }, [roomInfo.gameCode, Physics, isPhysicsLoading, componentState.proxiedAssets]);

  // Update component when processed code changes
  useEffect(() => {
    if (processedGameCode) {
      try {
        setComponentState(prev => ({
          ...prev,
          GameComponent: (props) => React.createElement(processedGameCode, {
            ...props,
            Physics,
            proxiedAssets: componentState.proxiedAssets,
            containerSize,
            isMobile,
            isTablet
          }),
          componentError: null
        }));
      } catch (error) {
        console.error('[Custom] Failed to create component:', error);
        setComponentState(prev => ({
          ...prev,
          GameComponent: null,
          componentError: `Failed to create component: ${error.message}`
        }));
      }
    } else if (physicsError) {
      setComponentState(prev => ({
        ...prev,
        GameComponent: null,
        componentError: `Failed to load physics engine: ${physicsError}`
      }));
    } else if (!roomInfo.gameCode) {
      setComponentState(prev => ({
        ...prev,
        GameComponent: null,
        componentError: null
      }));
    }
  }, [processedGameCode, Physics, physicsError, componentState.proxiedAssets, containerSize, isMobile, isTablet, roomInfo.gameCode]);

  // Socket effects
  useEffect(() => {
    isComponentMountedRef.current = true;
    return () => {
      isComponentMountedRef.current = false;
      removeSocketListeners();
    };
  }, [removeSocketListeners]);

  useEffect(() => {
    if (!socket) return;

    socket.on(`UPDATED_BANKROLL_${roomInfo._id}`, handleSocketData);
    socket.on(`UPDATED_BANKROLL2_${roomInfo._id}`, handleSocketData2);

    return () => {
      socket.off(`UPDATED_BANKROLL_${roomInfo._id}`, handleSocketData);
      socket.off(`UPDATED_BANKROLL2_${roomInfo._id}`, handleSocketData2);
    };
  }, [socket, roomInfo._id, handleSocketData, handleSocketData2]);

  // Update room info when props change
  useEffect(() => {
    if (roomInfo) {
      setRoomState(prev => ({
        ...prev,
        hostPr: roomInfo.host_pr !== undefined ? parseFloat(roomInfo.host_pr) : prev.hostPr,
        status: roomInfo.status !== undefined ? roomInfo.status : prev.status,
        poolId: roomInfo.pool_id !== undefined && roomInfo.pool_id ? roomInfo.pool_id : prev.poolId,
      }));
    }
  }, [roomInfo]);

  // Password correction effect
  useEffect(() => {
    if (componentState.isPasswordCorrect !== reduxState.isPasswordCorrect) {
      setComponentState(prev => ({
        ...prev,
        isPasswordCorrect: reduxState.isPasswordCorrect
      }));
    }
  }, [reduxState.isPasswordCorrect, componentState.isPasswordCorrect]);

  useEffect(() => {
    if (componentState.isPasswordCorrect && hasDepositedRef.current) {
      joinGame(componentState.gameResult);
    }
  }, [componentState.isPasswordCorrect, joinGame, componentState.gameResult]);

  const renderGameSection = () => {
    if (roomState.status !== 'open') {
      return (
        <Card
          sx={{
            background: 'rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            overflow: 'visible',
            '@supports not (backdrop-filter: blur(20px))': {
              background: 'rgba(0, 0, 0, 0.35)',
            },
          }}
        >
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              p: 6,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f44336, #d32f2f)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3,
                boxShadow: '0 8px 24px rgba(244, 67, 54, 0.4)',
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '2rem',
                }}
              >
                🔚
              </Typography>
            </Box>

            <Typography
              variant="h5"
              sx={{
                color: '#f44336',
                mb: 3,
                fontWeight: 700,
                fontSize: '1.5rem',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              Game Ended
            </Typography>

            {roomState.poolId ? (
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    lineHeight: 1.5,
                  }}
                >
                  🎉 Pool successfully seeded!
                </Typography>
                <Button
                  component="a"
                  href={`https://www.geckoterminal.com/solana/pools/${roomState.poolId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(135deg, #4caf50, #45a049)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1rem',
                    textTransform: 'none',
                    borderRadius: '16px',
                    px: 4,
                    py: 1.5,
                    boxShadow: '0 8px 20px rgba(76, 175, 80, 0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #45a049, #388e3c)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 24px rgba(76, 175, 80, 0.5)',
                    },
                  }}
                >
                  View on DEX 🚀
                </Button>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress
                  color='error'
                  sx={{
                    mb: 3,
                  }}
                  size={40}
                />
                <Typography
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '1rem',
                    fontWeight: 500,
                    lineHeight: 1.6,
                  }}
                >
                  Pool is being seeded or the room has ended.
                  <br />
                  Please check back shortly.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Box className="game-info-panel">

        <Box ref={containerRef}>
          <ResponsiveGameContainer
            GameComponent={componentState.GameComponent}
            componentError={componentState.componentError}
            proxiedAssets={componentState.proxiedAssets}
            logEvent={logEvent}
            Physics={Physics}
            isWalletPopupActive={gameState.isWalletPopupActive}
            isProcessing={gameState.isProcessing} // Add this
            processingMessage={gameState.processingMessage} // Add this
            isCreator={isCreator}
            containerSize={containerSize}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        </Box>

        {!isCreator && !gameState.isGameActive && (
          <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress color="error" />
            </Box>
          }>
            <AiPanel
              onChangeState={onChangeState}
              betting={betting}
              playSound={playSound}
              bet_amount={bet_amount}
              handle2xButtonClick={handle2xButtonClick}
              handleHalfXButtonClick={handleHalfXButtonClick}
              handleMaxButtonClick={handleMaxButtonClick}
              bankroll={bankroll}
              is_betting={reduxState.is_betting}
              creator_id={creator_id}
              roomId={roomInfo._id}
              game_type={roomInfo.game_type}
              user_id={user_id}
              user_balance={reduxState.balance}
              isDarkMode={reduxState.isDarkMode}
            />
          </Suspense>
        )}
      </Box>
    );
  };

  return (
    <Box className="game-page">
      {/* Lazy loaded modals */}
      <Suspense fallback={null}>

        {showPlayerModal && (
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={handleClosePlayerModal}
          />
        )}
      </Suspense>

      {/* Main game content */}
      <Box className="game-contents title">
        {renderGameSection()}
      </Box>
    </Box>
  );
}

// Wrap with React.memo for performance optimization
export default React.memo(Custom, createShallowComparison([
  'bankroll', 'bet_amount', 'betting', 'result', 'roomInfo.gameCode',
  'roomInfo.status', 'roomInfo._id', 'creator_id', 'user_id'
]));