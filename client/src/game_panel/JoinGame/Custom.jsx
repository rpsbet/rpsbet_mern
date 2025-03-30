import React, { useState, useEffect, useRef, useCallback } from 'react';
import { connect, useDispatch } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import progress from '../LottieAnimations/progress.json';
import pressHold from '../LottieAnimations/pressHold.json';
import PlayerModal from '../modal/PlayerModal';
import { setSpectateMode } from '../../redux/Auth/user.actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AiPanel from '../../components/AiPanel';
import { faRobot, faBrain, faBan } from '@fortawesome/free-solid-svg-icons';
import {
  Button,
  Paper,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  useMediaQuery
} from '@mui/material';
import {
  validateIsAuthenticated,
  validateBetAmount,
  validateBankroll
} from '../modal/betValidations';

import Lottie from 'react-lottie';
import ImageResultModal from '../modal/ImageResultModal';

import { convertToCurrency } from '../../util/conversion';

function Custom(props) {
  // Extract props
  const {
    socket: socket, //  <-- Directly use this instead of local state
    isAuthenticated,
    isPasswordCorrect: propIsPasswordCorrect,
    balance,
    bankroll,
    user_id,
    creator_id,
    roomInfo,
    isDarkMode,
    isWatching,
    is_betting,
    bet_amount,
    // Additional props
    onChangeState,
    playSound,
    changeBgColor,
    solPrice,
    openGamePasswordModal,
    getRoomBotCount,
    join,
    handle2xButtonClick,
    handleHalfXButtonClick,
    handleMaxButtonClick,
    // UI logic / other props
    actionList,
    handleOpenPlayerModal,
    handleClosePlayerModal,
    showPlayerModal,
    selectedCreator,
    isLowGraphics,
    betting,
    result,
  } = props;

  // Local state
  const [intervalId, setIntervalId] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [gameStartedCount, setGameStartedCount] = useState(0);
  const [poolId, setPoolId] = useState(roomInfo.pool_id);
  const [startedPlaying, setStartedPlaying] = useState(false);
  const [players, setPlayers] = useState([]);
  const [host_pr, setHostPr] = useState(roomInfo.host_pr);
  const [productName, setProductName] = useState('');
  const [status, setStatus] = useState(roomInfo.status);
  const [image, setImage] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(propIsPasswordCorrect);
  const [gameResult, setGameResult] = useState(null);

  // Confirm dialog state
  const [openConfirmBet, setOpenConfirmBet] = useState(false);
  const [confirmBetMessage, setConfirmBetMessage] = useState('');
  const [confirmBetCallback, setConfirmBetCallback] = useState(null);
  const [skipConfirm, setSkipConfirm] = useState(
    localStorage.getItem('hideConfirmModal') === 'true'
  );
  const bankrollRef = useRef(bankroll);


  const dispatch = useDispatch();
  const isMobile = useMediaQuery("(max-width: 768px)");


  // We track mounted status to avoid setting state after unmount
  const isComponentMountedRef = useRef(false);

  useEffect(() => {
    bankrollRef.current = bankroll;
  }, [bankroll]);

  // =========== Socket Handlers ===========

  const handleSocketData = useCallback((data) => {
    // Update players
    setPlayers((prevPlayers) => {
      const updated = [...prevPlayers, data.user];
      if (updated.length > 5) updated.shift();
      return updated;
    });

    // Play sound if defined
    if (playSound) {
      playSound('blip');
    }

    onChangeState({
      bankroll: data.bankroll,
      battles: 1,
      hosts: data.hosts,
    });
    setHostPr(data.host_pr);

  }, [playSound, user_id, isWatching, onChangeState]);

  const handleSocketData2 = useCallback(
    (data) => {
      onChangeState({ bankroll: data.bankroll });
    },
    [onChangeState]
  );

  const removeSocketListeners = useCallback(() => {
    // If you want an explicit cleanup that runs on unmount or socket changes:
    if (socket) {
      socket.off(`UPDATED_BANKROLL_${roomInfo._id}`, handleSocketData);
      socket.off(`UPDATED_BANKROLL2_${roomInfo._id}`, handleSocketData2);
    }
  }, [socket, roomInfo._id, handleSocketData, handleSocketData2]);

  const joinGame = useCallback(async (result, multiplier) => {
    onChangeState({ result: '' });
    console.log("result______", result, "multiplier______", multiplier);
    const resultData = await join({
      bet_amount: parseFloat(bet_amount),
      result: result || null,
      multiplier: result === 'win' && multiplier !== undefined ? parseFloat(multiplier) : undefined,
    });

    const amount = resultData.amount || 0;
    const currencyElement = convertToCurrency(Math.abs(amount), solPrice);
    const sign = amount >= 0 ? '+' : '-';

    onChangeState({
      result: (
        <span style={{ color: amount >= 0 ? '#00ff00' : '#D32F2F' }}>
          {sign} {currencyElement}
          {result === 'win' && multiplier !== undefined && ` (x${multiplier})`}
        </span>
      ),
      gameResult: resultData.betResult,
    });

    // Reset interaction after a bet is processed
    setHasInteracted(false);
    setGameStartedCount((prev) => prev + 1);
  }, [bet_amount, join, onChangeState, solPrice]);

  // =========== Effect Hooks ===========

  // Simulate componentDidMount
  useEffect(() => {
    isComponentMountedRef.current = true;
    const intervalDuration = 3000; // Or any logic to get this from your old code
    const id = setInterval(() => {
      toggleBlueishHue();
    }, intervalDuration);
    setIntervalId(id);

    // Socket setup is now in a separate effect below

    return () => {
      isComponentMountedRef.current = false;
      clearInterval(id);
      removeSocketListeners(); // clean up
    };
  }, []);

  // Set up and remove socket listeners whenever socket changes
  useEffect(() => {
    if (!socket) return;

    // Attach listeners
    socket.on(`UPDATED_BANKROLL_${roomInfo._id}`, handleSocketData);
    socket.on(`UPDATED_BANKROLL2_${roomInfo._id}`, handleSocketData2);

    return () => {
      // Remove listeners on unmount or when socket changes
      socket.off(`UPDATED_BANKROLL_${roomInfo._id}`, handleSocketData);
      socket.off(`UPDATED_BANKROLL2_${roomInfo._id}`, handleSocketData2);
    };
  }, [socket, roomInfo._id, handleSocketData, handleSocketData2]);

  // =============== Main Methods ===============
  const onBtnBetClick = async (result, multiplier) => {
    if (!validateIsAuthenticated(isAuthenticated, dispatch)) return;
    if (!validateBetAmount(bet_amount, balance, dispatch)) return;
    if (!validateBankroll(bet_amount, bankrollRef.current, dispatch)) return;

    const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
    const passwordCorrect = rooms[roomInfo._id];

    if (localStorage.getItem('hideConfirmModal') === 'true') {
      if (roomInfo.is_private && passwordCorrect !== true) {
        openGamePasswordModal();
      } else {
        await joinGame(result, multiplier);
      }
    } else {
      openConfirmBetDialog('ARE YOU SURE YOU WANT TO PLACE THIS BET?', async () => {
        if (roomInfo.is_private && passwordCorrect !== true) {
          openGamePasswordModal();
        } else {
          await joinGame(result, multiplier);
        }
      });
    }
  };

  useEffect(() => {
    const handleGameMessage = (event) => {
      if (!event.data || !event.data.type) return;
  
      switch (event.data.type) {
        case 'INPUT_LOG':
          const inputLog = event.data.inputLog || [];
          const lastInput = inputLog[inputLog.length - 1];
  
          if (lastInput) {
            const action = lastInput.action.toLowerCase();
  
            if (action === 'createscene') {
              // Reset interaction state when a new game scene is created
              setHasInteracted(false);
              setGameStartedCount((prev) => prev + 1);
              console.log('Game scene created, resetting interaction state. Count:', gameStartedCount + 1);
            } else if (gameStartedCount > 0 && !hasInteracted) {
              // Any INPUT_LOG after createScene counts as interaction
              setHasInteracted(true);
              console.log('User interaction detected:', lastInput.action);
            }
          }
          break;
  
        case 'GAME_RESULT':
          const { result, multiplier: rawMultiplier } = event.data;
          const multiplier =
            rawMultiplier !== undefined && !isNaN(parseFloat(rawMultiplier))
              ? parseFloat(rawMultiplier)
              : 2;
          console.log('Frontend: Received result -', result, 'Multiplier:', multiplier);
  
          const validResults = ['win', 'won', 'lose', 'lost', 'loss'];
          if (
            validResults.includes(result) &&
            hasInteracted &&
            gameStartedCount > 0
          ) {
            console.log('Processing game result after interaction and game start.');
            onBtnBetClick(result, result === 'win' ? multiplier : undefined);
          } else {
            console.log('Ignoring game result: No prior interaction or game start.');
            console.log('hasInteracted:', hasInteracted, 'gameStartedCount:', gameStartedCount);
          }
          break;
  
        default:
          break;
      }
    };
  
    window.addEventListener('message', handleGameMessage);
    return () => window.removeEventListener('message', handleGameMessage);
  }, [hasInteracted, gameStartedCount, onBtnBetClick]); // Dependencies are correct

  // Simulate getDerivedStateFromProps for password correctness
  useEffect(() => {
    if (isPasswordCorrect !== propIsPasswordCorrect) {
      setIsPasswordCorrect(propIsPasswordCorrect);
    }
  }, [propIsPasswordCorrect, isPasswordCorrect]);

  // If newly correct password => auto join
  useEffect(() => {
    if (isPasswordCorrect) {
      joinGame(gameResult);
    }
  }, [isPasswordCorrect, joinGame]);

  // Watch for changes to roomInfo (host_pr, status)
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

  // Watch changes to is_betting or actionList if needed
  useEffect(() => {
    if (props.actionList !== actionList) {
      // Example: handle changes to the actionList
    }
  }, [props.actionList, actionList]);

  // =============== Event Handlers ===============

  const toggleBlueishHue = useCallback(() => {
    // Placeholder from original snippet
  }, []);

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

  // =============== Render ===============

  // Determine if the current user is the creator
  const isCreator = creator_id && user_id && creator_id.toString() === user_id.toString();

  return (
    <div className="game-page">
      {/* Confirm Dialog */}
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
                color='error'
              />
            }
            label="Don’t show this again"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmBetDialog} color="error">
            Cancel
          </Button>
          <Button onClick={handleConfirmBet} color='error' autoFocus>
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Result Modal */}
      {showImageModal && (
        <ImageResultModal
          modalIsOpen={showImageModal}
          closeModal={() => setShowImageModal(false)}
          isDarkMode={isDarkMode}
          image={image}
          productName={productName}
        />
      )}

      {/* Player Modal */}
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
                  right: isMobile ? 'unset' : '-25px',
                  position: 'absolute',
                  width: '12.5px',
                  height: '12.5px',
                  borderRadius: '50%'
                }}
              >
                <span
                  className="result"
                  style={{
                    display: 'flex',
                    top: isMobile ? '15px' : '0',
                    width: isMobile ? '100%' : '130px',
                    right: isMobile ? 'unset' : '0'
                    }}
                >
                  {result !== '' ? (
                    <>
                      {result}
                      
                    </>
                  ) : (
                    <>
                      <div className="lottie-progress" style={{position: 'absolute', right: '30px', top: '-40px'}}>
                        <Lottie
                          options={{
                            loop: isLowGraphics ? false : true,
                            autoplay: isLowGraphics ? false : true,
                            animationData: progress
                          }}
                        />
                      </div>
                    </>
                  )}
                </span>
              </div>

              {/*
  Instead of conditionally rendering only a message for creators,
  we always render the iframe inside a Paper. Then, if isCreator is true,
  we disable interaction on the iframe and overlay a message.
*/}
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
                <iframe
  title="Generated Game"
  sandbox="allow-scripts allow-same-origin"
  style={{ width: '100%', height: '600px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#000' }}
  srcDoc={`
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js"></script>
      </head>
      <body style="margin: 0; padding: 0; overflow: hidden; background: #000;">
        <script>
          window.sendGameMessage = function(type, data) {
          console.log(data)
            window.parent.postMessage({ type: type, ...data }, '*');
          };
          window.addEventListener('message', (e) => {
            if (e.data.type === 'RANDOM_RESULT' || e.data.type === 'GAME_RESULT') {
              window.dispatchEvent(new CustomEvent(e.data.type, { detail: e.data }));
            }
          });
          ${roomInfo.gameCode}
        </script>
      </body>
    </html>
  `}
/>
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
                        pointerEvents: 'auto', // This box intercepts all pointer events.
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
              {creator_id &&
                user_id &&
                creator_id.toString() === user_id.toString() ? (
                <></>
              ) : (
                <>
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
                    creator_id={roomInfo.creator_id}
                    roomId={roomInfo._id}
                    game_type={roomInfo.game_type}
                    user_id={user_id}
                    user_balance={balance}
                    isDarkMode={isDarkMode}
                  />
                </>
              )}
            </div>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
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

// Redux connection
const mapStateToProps = (state) => ({
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
});

const mapDispatchToProps = {
  openGamePasswordModal,
  setSpectateMode
};

export default connect(mapStateToProps, mapDispatchToProps)(Custom);
