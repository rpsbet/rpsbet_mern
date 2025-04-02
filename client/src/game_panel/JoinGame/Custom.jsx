import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import progress from '../LottieAnimations/progress.json';
import PlayerModal from '../modal/PlayerModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AiPanel from '../../components/AiPanel';
import { faDice, faCoins, faRocket, faGem, faTrophy, faRedo, faBomb, faStar } from '@fortawesome/free-solid-svg-icons';
import {
  Button,
  Paper,
  FormControlLabel,
  Checkbox,
  Dialog,
  TextField,
  CircularProgress,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  useMediaQuery,
} from '@mui/material';
import {
  validateIsAuthenticated,
  validateBetAmount,
  validateBankroll,
} from '../modal/betValidations';
import Lottie from 'react-lottie';
import ImageResultModal from '../modal/ImageResultModal';
import { convertToCurrency } from '../../util/conversion';
import * as Babel from '@babel/standalone';

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
    username: state.logic.curRoomInfo.username,
    isLowGraphics: state.auth.isLowGraphics,
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
  const [proxiedAssets, setProxiedAssets] = useState({ images: [], audio: [] });

  // Confirm dialog state
  const [openConfirmBet, setOpenConfirmBet] = useState(false);
  const [confirmBetMessage, setConfirmBetMessage] = useState('');
  const [confirmBetCallback, setConfirmBetCallback] = useState(null);
  const [skipConfirm, setSkipConfirm] = useState(
    localStorage.getItem('hideConfirmModal') === 'true',
  );
  const bankrollRef = useRef(bankroll);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const isComponentMountedRef = useRef(false);

  useEffect(() => {
    bankrollRef.current = bankroll;
  }, [bankroll]);

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
    [playSound, user_id, isWatching, onChangeState],
  );

  const handleSocketData2 = useCallback(
    (data) => {
      onChangeState({ bankroll: data.bankroll });
    },
    [onChangeState],
  );

  const removeSocketListeners = useCallback(() => {
    if (socket) {
      socket.off(`UPDATED_BANKROLL_${roomInfo._id}`, handleSocketData);
      socket.off(`UPDATED_BANKROLL2_${roomInfo._id}`, handleSocketData2);
    }
  }, [socket, roomInfo._id, handleSocketData, handleSocketData2]);

  const joinGame = useCallback(
    async (result, multiplier) => {
      onChangeState({ result: '' });
      const resultData = await join({
        bet_amount: parseFloat(bet_amount),
        result: result || null,
        multiplier:
          result === 'win' && multiplier !== undefined
            ? parseFloat(multiplier)
            : undefined,
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

      onChangeState({
        result: (
          <span style={{ color: amount >= 0 ? '#00ff3a' : '#D32F2F' }}>
            {sign} {currencyElement}
          </span>
        ),
        gameResult: resultData.betResult,
      });

      setGameStartedCount((prev) => prev + 1);
    },
    [bet_amount, join, onChangeState, solPrice, playSound] // Added playSound to dependencies
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

  const logEvent = useCallback((eventType, data) => {
    console.log(`Game Event: ${eventType}`, data);
  
    if (playSound) {
      playSound('select');
    }
  
    if (eventType === 'gameStarted') {
      setGameStartedCount((prev) => prev + 1);
      console.log('Game started, resetting interaction state. Count:', gameStartedCount + 1);
    } else if (eventType === 'gameEnded') {
      const { result, multiplier } = data;
      const validResults = ['win', 'loss', 'other'];
      if (validResults.includes(result) && gameStartedCount > 0) {
        console.log('Processing game result:', result, 'Multiplier:', multiplier);
        onBtnBetClick(result, result === 'win' ? multiplier : undefined);
      } else {
        console.log('Ignoring game result: Game has not started.');
      }
    }
  }, [gameStartedCount, onBtnBetClick, playSound]);

  // Load and transpile the gameCode
  useEffect(() => {
    if (roomInfo.gameCode) {
      try {
        setComponentError(null);

        const cleanedCode = roomInfo.gameCode
          .replace(/import .*? from .+?;/g, '')
          .replace('export default App;', '')
          .trim();

        const transpiledCode = Babel.transform(cleanedCode, {
          presets: ['react'],
          filename: 'app.jsx',
        }).code;

        const componentFactory = new Function(
          'React',
          'useState',
          'useEffect',
          'useRef',
          'Box',
          'Typography',
          'TextField',
          'Button',
          'CircularProgress',
          'logEvent',
          'FontAwesomeIcon',
          'faDice', 'faCoins', 'faRocket', 'faGem', 'faTrophy', 'faRedo', 'faBomb', 'faStar',
          `${transpiledCode}; return App;`
        );

        const GeneratedApp = componentFactory(
          React,
          useState,
          useEffect,
          useRef,
          Box,
          Typography,
          TextField,
          Button,
          CircularProgress,
          logEvent,
          FontAwesomeIcon,
          faDice, faCoins, faRocket, faGem, faTrophy, faRedo, faBomb, faStar
        );

        if (typeof GeneratedApp === 'function') {
          setGameComponent(() => GeneratedApp);
        } else {
          throw new Error('Generated code did not return a valid React component');
        }
      } catch (error) {
        console.error('Error creating component:', error);
        setComponentError(`Failed to create component: ${error.message}`);
        setGameComponent(null);
      }
    } else {
      setGameComponent(null);
      setComponentError(null);
    }
  }, [roomInfo.gameCode]);

  const toggleBlueishHue = useCallback(() => {
    const elements = document.querySelectorAll('.rps-radio-host');
    elements.forEach((element) => {
      element.classList.toggle('blueish-hue');
    });
  }, []);

  useEffect(() => {
    isComponentMountedRef.current = true;
    const intervalDuration = 3000;
    const id = setInterval(() => {
      toggleBlueishHue();
    }, intervalDuration);
    setIntervalId(id);

    return () => {
      isComponentMountedRef.current = false;
      clearInterval(id);
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
    if (isPasswordCorrect) {
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
            label="Don’t show this again"
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
              <div
                className={`rps-radio-host ${is_betting || betting ? 'blueish-hue' : ''}`}
                style={{
                  top: '150px',
                  right: isMobile ? 'unset' : '10px',
                  position: 'absolute',
                  width: '12.5px',
                  height: '12.5px',
                  borderRadius: '50%',
                }}
              >
                <span
                  className="result"
                  style={{
                    display: 'flex',
                    top: isMobile ? '15px' : '0',
                    width: isMobile ? '100%' : '130px',
                    right: isMobile ? 'unset' : '0',
                  }}
                >
                  {result !== '' ? (
                    <>{result}</>
                  ) : (
                    <div className="lottie-progress" style={{ position: 'absolute', right: '30px', top: '0px' }}>
                      <Lottie
                        options={{
                          loop: isLowGraphics ? false : true,
                          autoplay: isLowGraphics ? false : true,
                          animationData: progress,
                        }}
                      />
                    </div>
                  )}
                </span>
              </div>

              <Paper
                square
                variant="inherit"
                sx={{
                  background: '#2D3A4A',
                  position: 'relative',
                  width: '100%',
                }}
                className="join-game-panel"
              >
                <Box sx={{ p: 2, width: '100%', position: 'relative' }}>
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
                      <Typography variant="h6" sx={{ mb: 2 }}>Error</Typography>
                      <Typography>{componentError}</Typography>
                    </Box>
                  ) : GameComponent ? (
                    <Box
                      sx={{
                        width: '100%',
                        height: '600px',
                        overflow: 'auto',
                        backgroundColor: '#1E2525', // Match the neutral color from systemPrompt
                      }}
                    >
                      <GameComponent proxiedAssets={proxiedAssets} logEvent={logEvent} />
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
                        bottom: 0,
                        zIndex: 1,
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
              {!isCreator && (
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