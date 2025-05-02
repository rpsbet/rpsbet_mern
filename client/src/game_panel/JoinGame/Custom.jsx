import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import PlayerModal from '../modal/PlayerModal';
import AiPanel from '../../components/AiPanel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDice,
  faCoins,
  faChevronDown,
  faRocket,
  faHome,
  faSpinner,
  faGem,
  faTrophy,
  faRedo,
  faBomb,
  faStar,
  faCogs,
  faExchangeAlt,
  faInfoCircle,
  faChevronUp,
  faArrowUp,
  faArrowDown,
  faVolumeUp,
  faVolumeMute,
  faCog,
  faExclamationTriangle,
  faCheck,
  faTimes,
  faPlay,
  faHistory,
  faChartLine,
  faWallet,
  faShieldAlt,
  faHeart,
  faSkull,
  faClock,
  faBolt,
} from '@fortawesome/free-solid-svg-icons';
import {
  Paper,
  Button,
  Tooltip,
  CircularProgress,
  TextField,
  useMediaQuery,
  Typography,
  Box,
  Slider,
  Avatar,
  Chip,
  Modal,
  Card,
  Fade,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogActions,
  DialogTitle,
  Grid,
  Divider,
  Collapse,
  IconButton,
  Container,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Badge,
  Snackbar,
  Alert,
  Zoom,
  Grow,
  CardContent,
  CardActions,
  TableContainer,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import styled from 'styled-components';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import { green, yellow, blue, grey } from '@mui/material/colors';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChatIcon from '@mui/icons-material/Chat';
import * as Babel from '@babel/standalone';
import ImageResultModal from '../modal/ImageResultModal';
import { convertToCurrency } from '../../util/conversion';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
  validateIsAuthenticated,
  validateBetAmount,
  validateBankroll,
} from '../modal/betValidations';
import { sendSolDeposit } from '../../util/solana'; // Import sendSolDeposit

function Custom(props) {
  const dispatch = useDispatch();

  // Map state from Redux using useSelector
  const {
    socket,
    isAuthenticated,
    isPasswordCorrect: propIsPasswordCorrect,
    balance,
    isDarkMode,
    isWatching,
    is_betting,
    solPrice,
    isLowGraphics,
    connectedAccount,
    account,
    user_id: reduxUserId,
  } = useSelector((state) => ({
    socket: state.auth.socket,
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
    connectedAccount: state.auth.connectedAccount,
    account: state.logic.account,
    user_id: state.auth.user._id,
  }));

  // Extract remaining props from parent component
  const {
    bankroll,
    user_id,
    creator_id,
    roomInfo,
    bet_amount,
    onChangeState,
    playSound,
    join,
    handle2xButtonClick,
    handleHalfXButtonClick,
    handleMaxButtonClick,
    actionList,
    handleOpenPlayerModal,
    handleClosePlayerModal,
    showPlayerModal,
    selectedCreator,
    betting,
    result,
    onResultChange,
  } = props;

  // Local state
  const [intervalId, setIntervalId] = useState(null);
  const [gameStartedCount, setGameStartedCount] = useState(0);
  const [poolId, setPoolId] = useState(roomInfo.pool_id);
  const [players, setPlayers] = useState([]);
  const [host_pr, setHostPr] = useState(roomInfo.host_pr);
  const [productName, setProductName] = useState('');
  const [status, setStatus] = useState(roomInfo.status);
  const [image, setImage] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(propIsPasswordCorrect);
  const [gameResult, setGameResult] = useState(null);
  const [GameComponent, setGameComponent] = useState(null);
  const [componentError, setComponentError] = useState(null);
  const [proxiedAssets, setProxiedAssets] = useState({ images: [], audio: [], theme: {}, background: {} });
  const [isGameActive, setIsGameActive] = useState(false);
  const [openConfirmBet, setOpenConfirmBet] = useState(false);
  const [confirmBetMessage, setConfirmBetMessage] = useState('');
  const [confirmBetCallback, setConfirmBetCallback] = useState(null);
  const [skipConfirm, setSkipConfirm] = useState(localStorage.getItem('hideConfirmModal') === 'true');
  const [Physics, setPhysics] = useState(null);
  const [isPhysicsLoading, setIsPhysicsLoading] = useState(true);
  const bankrollRef = useRef(bankroll);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isComponentMountedRef = useRef(false);
  const gameContainerRef = useRef(null);
  const hasDepositedRef = useRef(false); // Track if deposit has been made for the current game

  useEffect(() => {
    bankrollRef.current = bankroll;
  }, [bankroll]);

  const loadPhysics = async () => {
    try {
      if (window.Matter && window.Matter.World && typeof window.Matter.World === 'function') {
        console.log('[Custom] Using cached Matter.js');
        return window.Matter;
      }
      console.log('[Custom] Attempting to load Matter.js dynamically');
      const matterModule = await import('matter-js');
      if (!matterModule || !matterModule.World || !matterModule.Engine) {
        throw new Error('Matter.js module loaded but missing required properties');
      }
      console.log('[Custom] Successfully loaded Matter.js:', matterModule);
      window.Matter = matterModule;
      return matterModule;
    } catch (error) {
      console.error('[Custom] Local import failed:', error.message);
      console.log('[Custom] Falling back to CDN');
      try {
        const matterModule = await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/build/matter.min.js';
          script.onload = () => {
            if (window.Matter && window.Matter.World && window.Matter.Engine) {
              console.log('[Custom] Loaded via CDN');
              resolve(window.Matter);
            } else {
              reject(new Error('Matter.js CDN loaded but missing required properties'));
            }
          };
          script.onerror = () => reject(new Error('Failed to load Matter.js from CDN'));
          document.head.appendChild(script);
        });
        return matterModule;
      } catch (cdnError) {
        console.error('[Custom] CDN fallback failed:', cdnError.message);
        throw new Error(`Failed to load Matter.js: ${cdnError.message}`);
      }
    }
  };

  useEffect(() => {
    const loadPhysicsOnMount = async () => {
      setIsPhysicsLoading(true);
      try {
        console.log('[Custom] Loading Matter.js on page load');
        const matterModule = await loadPhysics();
        if (!matterModule || !matterModule.World || !matterModule.Engine) {
          throw new Error('Matter.js loaded but missing required properties');
        }
        console.log('[Custom] Matter.js loaded successfully:', matterModule);
        setPhysics(matterModule);
      } catch (error) {
        console.error('[Custom] Failed to load Matter.js:', error.message, error.stack);
        setComponentError(`Failed to load physics engine: ${error.message}`);
      } finally {
        setIsPhysicsLoading(false);
      }
    };

    loadPhysicsOnMount();
  }, []);

  // Add event handler for keyboard controls
  const handleKeyDown = useCallback(
    (event) => {
      if (
        ['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key) ||
        event.keyCode === 32 ||
        event.keyCode === 37 ||
        event.keyCode === 38 ||
        event.keyCode === 39 ||
        event.keyCode === 40
      ) {
        if (isGameActive) {
          event.preventDefault();
        }
      }
    },
    [isGameActive]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Socket Handlers
  const handleSocketData = useCallback(
    (data) => {
      setPlayers((prevPlayers) => {
        const updated = [...prevPlayers, data.user];
        if (updated.length > 5) updated.shift();
        return updated;
      });

      if (playSound) {
        playSound('blip');
      }

      onChangeState({
        bankroll: data.bankroll,
        battles: 1,
        hosts: data.hosts,
      });
      setHostPr(data.host_pr);
    },
    [playSound, user_id, isWatching, onChangeState]
  );

  const handleSocketData2 = useCallback(
    (data) => {
      onChangeState({ bankroll: data.bankroll });
    },
    [onChangeState]
  );

  const removeSocketListeners = useCallback(() => {
    if (socket) {
      socket.off(`UPDATED_BANKROLL_${roomInfo._id}`, handleSocketData);
      socket.off(`UPDATED_BANKROLL2_${roomInfo._id}`, handleSocketData2);
    }
  }, [socket, roomInfo._id, handleSocketData, handleSocketData2]);

  const processSolDeposit = useCallback(async () => {
    if (hasDepositedRef.current) {
      console.log('[Custom] Deposit already processed for this game, skipping.');
      return true;
    }

    try {
      const depositResult = await sendSolDeposit(
        dispatch,
        parseFloat(bet_amount),
        roomInfo._id,
        roomInfo.name,
        'join',
        account,
        balance,
        () => {
          hasDepositedRef.current = true;
        },
        () => {
          console.error('[Custom] Solana deposit failed');
          onChangeState({ betting: false });
        }
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
    }
  }, [dispatch, bet_amount, roomInfo._id, account, balance, onChangeState]);

  const joinGame = useCallback(
    async (result, multiplier) => {
      onChangeState({ result: '' });
      const resultData = await join({
        bet_amount: parseFloat(bet_amount),
        result: result || null,
        multiplier:
          result === 'win' && multiplier !== undefined ? parseFloat(multiplier) : undefined,
      });

      const amount = resultData.amount || 0;
      const currencyElement = convertToCurrency(Math.abs(amount), solPrice);
      const sign = amount >= 0 ? '+' : '-';
      let soundToPlay = null;

      if (resultData.betResult === 1) {
        soundToPlay = 'win';
      } else if (resultData.betResult === 0) {
        soundToPlay = 'split';
      } else {
        soundToPlay = 'lose';
      }

      if (playSound && soundToPlay) {
        playSound(soundToPlay);
      }

      const formattedResult = (
        <span
          style={{
            color: amount >= 0 ? '#00ff3a' : '#ff0000',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(0,0,0,0.5)',
          }}
        >
          {sign} {currencyElement}
        </span>
      );

      onResultChange(formattedResult, false);
      onChangeState({
        gameResult: resultData.betResult,
      });

      setGameStartedCount((prev) => prev + 1);
      hasDepositedRef.current = false; // Reset deposit flag after game ends
    },
    [bet_amount, join, onChangeState, solPrice, playSound, onResultChange]
  );

  const onBtnBetClick = async (result, multiplier) => {
    if (!validateIsAuthenticated(isAuthenticated, dispatch)) return;
    if (!validateBetAmount(bet_amount, balance, dispatch)) return;
    if (!validateBankroll(bet_amount, bankrollRef.current, dispatch)) return;

    const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
    const passwordCorrect = rooms[roomInfo._id];

    if (localStorage.getItem('hideConfirmModal') === 'true') {
      if (roomInfo.is_private && passwordCorrect !== true) {
        dispatch(openGamePasswordModal());
      } else {
        await joinGame(result, multiplier);
      }
    } else {
      openConfirmBetDialog('ARE YOU SURE YOU WANT TO PLACE THIS BET?', async () => {
        if (roomInfo.is_private && passwordCorrect !== true) {
          dispatch(openGamePasswordModal());
        } else {
          await joinGame(result, multiplier);
        }
      });
    }
  };

  const logEvent = useCallback(
    (eventType, data) => {
      console.log(`Game Event: ${eventType}`, data);

      if (playSound) {
        playSound('select');
      }

      if (eventType === 'gameStarted') {
        setGameStartedCount((prev) => prev + 1);
        setIsGameActive(true);
        console.log('Game started, resetting interaction state. Count:', gameStartedCount + 1);
        onResultChange('', true);

        // Process Solana deposit on game start
        openConfirmBetDialog('ARE YOU SURE YOU WANT TO JOIN THIS GAME?', async () => {
          const depositSuccess = await processSolDeposit();
          if (!depositSuccess) {
            setIsGameActive(false);
            onResultChange('Deposit failed, please try again.', false);
          }
        });
      } else if (eventType === 'gameEnded') {
        setIsGameActive(false);
        const { result, multiplier } = data;
        const validResults = ['win', 'loss', 'other'];
        if (validResults.includes(result) && gameStartedCount > 0 && hasDepositedRef.current) {
          console.log('Processing game result:', result, 'Multiplier:', multiplier);
          onBtnBetClick(result, result === 'win' ? multiplier : undefined);
        } else {
          console.log('[Custom] Skipping bet placement: No deposit made or invalid state');
          hasDepositedRef.current = false;
        }
      }
    },
    [gameStartedCount, onBtnBetClick, playSound, onResultChange, processSolDeposit]
  );

  // Load and transpile the gameCode
  useEffect(() => {
    if (roomInfo.gameCode && Physics && !isPhysicsLoading) {
      let isMounted = true;
      setComponentError(null);

      const processGameCode = async () => {
        try {
          if (!Physics || !Physics.World) {
            throw new Error('Matter.js not loaded or missing World property');
          }

          let cleanedCode = roomInfo.gameCode
            .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*;?/g, '')
            .replace(/require\s*\(\s*['"][^'"]+['"]\s*\)\s*;?/g, '')
            .replace(/export\s+default\s+[\w\s]*?\s*;?/g, '')
            .replace(/export\s+[\w\s]*?\s*;?/g, '')
            .replace(/import\s*\(\s*['"][^'"]+['"]\s*\)\s*;?/g, '')
            .trim();

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

          let transpiledCode;
          try {
            transpiledCode = Babel.transform(cleanedCode, {
              presets: ['react', ['env', { modules: false, targets: { browsers: ['last 2 versions'] } }]],
              filename: 'app.jsx',
            }).code;
            transpiledCode = `${babelHelpers}\n${transpiledCode}`;
          } catch (babelError) {
            console.error('[Custom] Babel Transpile Error:', babelError);
            throw new Error(`Babel transpilation failed: ${babelError.message}`);
          }

          const componentFactory = new Function(
            'React',
            'useState',
            'useEffect',
            'useRef',
            'useMemo',
            'useCallback',
            'useAnimation',
            'Grid',
            'Box',
            'Typography',
            'TextField',
            'Button',
            'Slider',
            'Dialog',
            'Divider',
            'Paper',
            'Chip',
            'Collapse',
            'DialogContent',
            'DialogTitle',
            'CircularProgress',
            'logEvent',
            'FontAwesomeIcon',
            'TableContainer',
            'Table',
            'TableBody',
            'TableRow',
            'TableCell',
            'TableHead',
            'faDice',
            'faCoins',
            'faPlay',
            'faRocket',
            'faChevronDown',
            'faGem',
            'faSpinner',
            'faCogs',
            'faExchangeAlt',
            'faTrophy',
            'faArrowUp',
            'faArrowDown',
            'faRedo',
            'faBomb',
            'faStar',
            'faHome',
            'Physics',
            'Card',
            'CardContent',
            'CardActions',
            'Tooltip',
            'motion',
            'styled',
            'AnimatePresence',
            'IconButton',
            'Container',
            'Badge',
            'Snackbar',
            'Alert',
            'DialogContentText',
            'DialogActions',
            'Zoom',
            'Grow',
            'faInfoCircle',
            'faChevronUp',
            'faVolumeUp',
            'faVolumeMute',
            'faCog',
            'faExclamationTriangle',
            'faCheck',
            'faTimes',
            'faHistory',
            'faChartLine',
            'faWallet',
            'faShieldAlt',
            'faHeart',
            'faSkull',
            'faClock',
            'faBolt',
            'proxiedAssets',
            `
              return function App(props) {
                ${transpiledCode}
                return App(props);
              };
            `
          );

          const GeneratedApp = componentFactory(
            React,
            useState,
            useEffect,
            useRef,
            useMemo,
            useCallback,
            useAnimation,
            Grid,
            Box,
            Typography,
            TextField,
            Button,
            Slider,
            Dialog,
            Divider,
            Paper,
            Chip,
            Collapse,
            DialogContent,
            DialogTitle,
            CircularProgress,
            logEvent,
            FontAwesomeIcon,
            TableContainer,
            Table,
            TableBody,
            TableRow,
            TableCell,
            TableHead,
            faDice,
            faCoins,
            faPlay,
            faRocket,
            faChevronDown,
            faGem,
            faSpinner,
            faCogs,
            faExchangeAlt,
            faTrophy,
            faArrowUp,
            faArrowDown,
            faRedo,
            faBomb,
            faStar,
            faHome,
            Physics,
            Card,
            CardContent,
            CardActions,
            Tooltip,
            motion,
            styled,
            AnimatePresence,
            IconButton,
            Container,
            Badge,
            Snackbar,
            Alert,
            DialogContentText,
            DialogActions,
            Zoom,
            Grow,
            faInfoCircle,
            faChevronUp,
            faVolumeUp,
            faVolumeMute,
            faCog,
            faExclamationTriangle,
            faCheck,
            faTimes,
            faHistory,
            faChartLine,
            faWallet,
            faShieldAlt,
            faHeart,
            faSkull,
            faClock,
            faBolt,
            proxiedAssets
          );

          if (typeof GeneratedApp === 'function') {
            if (isMounted) {
              setGameComponent(() => (props) => <GeneratedApp {...props} Physics={Physics} proxiedAssets={proxiedAssets} />);
            }
          } else {
            throw new Error('Generated code did not return a valid React component');
          }
        } catch (error) {
          console.error('[Custom] Error creating component:', error);
          if (isMounted) {
            setComponentError(`Failed to create component: ${error.message}`);
            setGameComponent(null);
          }
        }
      };

      processGameCode();
      return () => {
        isMounted = false;
      };
    } else if (roomInfo.gameCode && isPhysicsLoading) {
      console.log('[Custom] Waiting for Matter.js to load before processing game code');
    } else {
      setGameComponent(null);
      setComponentError(null);
    }
  }, [roomInfo.gameCode, Physics, isPhysicsLoading, proxiedAssets]);

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

  useEffect(() => {
    if (isPasswordCorrect !== propIsPasswordCorrect) {
      setIsPasswordCorrect(propIsPasswordCorrect);
    }
  }, [propIsPasswordCorrect, isPasswordCorrect]);

  useEffect(() => {
    if (isPasswordCorrect && hasDepositedRef.current) {
      // Only proceed with bet if deposit was successful
      joinGame(gameResult);
    }
  }, [isPasswordCorrect, joinGame, gameResult]);

  useEffect(() => {
    if (roomInfo) {
      if (roomInfo.host_pr !== undefined) {
        setHostPr(parseFloat(roomInfo.host_pr));
      }
      if (roomInfo.status !== undefined) {
        setStatus(roomInfo.status);
      }
      if (roomInfo.pool_id !== undefined && roomInfo.pool_id) {
        setPoolId(roomInfo.pool_id);
      }
    }
  }, [roomInfo]);

  useEffect(() => {
    if (props.actionList !== actionList) {
      // Handle changes to actionList if needed
    }
  }, [props.actionList, actionList]);

  const openConfirmBetDialog = (message, callback) => {
    if (localStorage.getItem('hideConfirmModal') === 'true') {
      callback();
      return;
    }
    setOpenConfirmBet(true);
    setConfirmBetMessage(message);
    setConfirmBetCallback(() => callback);
  };

  const closeConfirmBetDialog = () => {
    setOpenConfirmBet(false);
    setConfirmBetMessage('');
    setConfirmBetCallback(null);
  };

  const handleConfirmBet = useCallback(async () => {
    if (confirmBetCallback) {
      await confirmBetCallback();
    }
    closeConfirmBetDialog();
  }, [confirmBetCallback]);

  const handleSkipConfirmChange = (event) => {
    const checked = event.target.checked;
    setSkipConfirm(checked);
    localStorage.setItem('hideConfirmModal', checked ? 'true' : 'false');
  };

  // Render Logic
  const isCreator = creator_id && user_id && creator_id.toString() === user_id.toString();

  return (
    <div className="game-page">
      <Dialog
        open={openConfirmBet}
        onClose={closeConfirmBetDialog}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">Confirmation</DialogTitle>
        <DialogContent>
          <Typography>{confirmBetMessage}</Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={skipConfirm}
                onChange={handleSkipConfirmChange}
                color="error"
              />
            }
            label="Don't show this again"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmBetDialog} color="error">
            Cancel
          </Button>
          <Button onClick={handleConfirmBet} color="error" autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      {showImageModal && (
        <ImageResultModal
          modalIsOpen={showImageModal}
          closeModal={() => setShowImageModal(false)}
          isDarkMode={isDarkMode}
          image={image}
          productName={productName}
        />
      )}

      {showPlayerModal && (
        <PlayerModal
          selectedCreator={selectedCreator}
          modalIsOpen={showPlayerModal}
          closeModal={handleClosePlayerModal}
        />
      )}

      <div className="game-contents title">
        {status === 'open' ? (
          <>
            <div className="game-info-panel">
              <Paper
                square
                variant="inherit"
                sx={{
                  background: '#080808',
                  position: 'relative',
                  width: '100%',
                }}
                className="join-game-panel"
              >
                <Box
                  ref={gameContainerRef}
                  sx={{ width: '100%', overflow: 'hidden', position: 'relative' }}
                  tabIndex="0"
                >
                  {componentError ? (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '600px',
                        color: 'red',
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Error
                      </Typography>
                      <Typography>{componentError}</Typography>
                    </Box>
                  ) : GameComponent ? (
                    <Box
                      sx={{
                        width: '100%',
                        overflow: 'auto',
                        backgroundColor: '#080808',
                        '& canvas': {
                          maxWidth: '100%',
                          objectFit: 'contain',
                        },
                      }}
                    >
                      <GameComponent proxiedAssets={proxiedAssets} logEvent={logEvent} Physics={Physics} />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '600px',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                      }}
                    >
                      <Typography variant="body1" color="text.secondary">
                        No game loaded yet.
                      </Typography>
                    </Box>
                  )}
                  {isCreator && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: '0px',
                        zIndex: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        pointerEvents: 'auto',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      <Box
                        sx={{
                          color: 'white',
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          textAlign: 'center',
                        }}
                      >
                        You cannot join your own game.
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>
              {!isCreator && !isGameActive && (
                <AiPanel
                  onChangeState={onChangeState}
                  betting={betting}
                  playSound={playSound}
                  bet_amount={bet_amount}
                  handle2xButtonClick={handle2xButtonClick}
                  handleHalfXButtonClick={handleHalfXButtonClick}
                  handleMaxButtonClick={handleMaxButtonClick}
                  bankroll={bankroll}
                  is_betting={is_betting}
                  creator_id={creator_id}
                  roomId={roomInfo._id}
                  game_type={roomInfo.game_type}
                  user_id={user_id}
                  user_balance={balance}
                  isDarkMode={isDarkMode}
                />
              )}
            </div>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Typography variant="subtitle2" sx={{ color: '#D32F2F' }}>
              GAME ENDED
            </Typography>
            <br />
            {roomInfo.pool_id && roomInfo.pool_id ? (
              <Typography>
                Pool seeded! SEE{' '}
                <Box
                  component="a"
                  href={`https://www.geckoterminal.com/solana/pools/${roomInfo.pool_id}`}
                  sx={{ ml: 0.5, cursor: 'pointer', textDecoration: 'underline' }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  DEX 🚀
                </Box>
              </Typography>
            ) : (
              <Typography>
                Pool is either being seeded, or the room has ended.
              </Typography>
            )}
          </Box>
        )}
      </div>
    </div>
  );
}

export default Custom;