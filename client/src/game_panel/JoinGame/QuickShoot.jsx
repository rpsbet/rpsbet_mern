import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { Info } from '@mui/icons-material';
import GuessesSection from '../../components/GuessesSection';
import PlayerModal from '../modal/PlayerModal';
import AiPanel from '../../components/AiPanel';
import ViewIcon from '@mui/icons-material/Visibility';
import SwordsIcon from '@mui/icons-material/VisibilityOff';
import { getQsLottieAnimation } from '../../util/helper';
import { setSpectateMode } from '../../redux/Auth/user.actions';
import {
  Button,
  IconButton,
  Tooltip,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  validateIsAuthenticated,
  validateBetAmount,
  validateBankroll,
} from '../modal/betValidations';
import Lottie from 'react-lottie';
import ImageResultModal from '../modal/ImageResultModal';
import { convertToCurrency } from '../../util/conversion';
import football from '../LottieAnimations/football.json';
import progress from '../LottieAnimations/progress.json';

// Custom hook for socket management
const useGameSocket = (socket, roomId, user_id, isWatching, onBankrollUpdate, onGameDataUpdate) => {
  useEffect(() => {
    if (!socket) return;

    const handleBankrollUpdate = (data) => {
      onBankrollUpdate(data);
    };

    const handleGameData = (data) => {
      onGameDataUpdate(data);

      if (!data.qs) return;

      const filtered = data.qs.filter((game) => game.joiner === user_id);
      const newQsHistory = isWatching ? filtered : data.qs;

      return {
        qsHistory: newQsHistory,
        fullHistory: data.qs,
      };
    };

    socket.on(`UPDATED_BANKROLL_${roomId}`, handleGameData);
    socket.on(`UPDATED_BANKROLL2_${roomId}`, handleBankrollUpdate);

    return () => {
      socket.off(`UPDATED_BANKROLL_${roomId}`, handleGameData);
      socket.off(`UPDATED_BANKROLL2_${roomId}`, handleBankrollUpdate);
    };
  }, [socket, roomId, user_id, isWatching, onBankrollUpdate, onGameDataUpdate]);
};

// Custom hook for confirmation dialog
const useConfirmationDialog = () => {
  const [dialogState, setDialogState] = useState({
    open: false,
    message: '',
    callback: null,
    skipConfirm: localStorage.getItem('hideConfirmModal') === 'true',
  });

  const openDialog = useCallback((message, callback) => {
    if (dialogState.skipConfirm) {
      callback();
      return;
    }
    setDialogState((prev) => ({ ...prev, open: true, message, callback }));
  }, [dialogState.skipConfirm]);

  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, open: false, message: '', callback: null }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (dialogState.callback) {
      dialogState.callback();
    }
    closeDialog();
  }, [dialogState.callback, closeDialog]);

  const handleSkipChange = useCallback((event) => {
    const checked = event.target.checked;
    setDialogState((prev) => ({ ...prev, skipConfirm: checked }));
    localStorage.setItem('hideConfirmModal', checked ? 'true' : 'false');
  }, []);

  return {
    dialogState,
    openDialog,
    closeDialog,
    handleConfirm,
    handleSkipChange,
  };
};

// Game button component
const GameButton = React.memo(
  ({ id, position, isActive, bgColorChanged, joinerQsValueAtLastIndex, betResult, isBetting, isDisabled, onClick, ariaLabel }) => {
    const classes = [];
    let showBall = false;

    if (isActive) {
      classes.push('active');
    }

    if (bgColorChanged && joinerQsValueAtLastIndex === position && !isBetting) {
      if (betResult === -1) {
        showBall = true;
        classes.push('lose-bg');
      } else if (betResult === 0) {
        showBall = true;
        classes.push('draw-bg');
      } else if (betResult === 1) {
        showBall = true;
        classes.push('win-bg');
      }
    }

    if (isDisabled) classes.push('disabled');

    return (
      <IconButton
        id={id}
        onClick={onClick}
        className={classes.join(' ')}
        sx={{
          position: 'relative',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.05)',
            opacity: 0.9,
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        }}
        disabled={isDisabled}
        aria-label={ariaLabel}
      >
        {showBall && (
          <img
            src="/img/football.svg"
            alt="ball"
            className="ball-kicked"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '30px',
              height: '30px',
              animation: 'bounce 0.5s ease-in-out infinite alternate',
            }}
          />
        )}
      </IconButton>
    );
  }
);

// Confirmation dialog component
const ConfirmBetDialog = React.memo(({ open, message, skipConfirm, onClose, onConfirm, onSkipChange }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      sx={{
        '& .MuiPaper-root': {
          borderRadius: 2,
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
        },
      }}
    >
      <DialogTitle id="confirm-dialog-title">Confirmation</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
        <FormControlLabel
          control={<Checkbox checked={skipConfirm} onChange={onSkipChange} color="error" />}
          label="Don't show this again"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="error" variant="outlined" sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" autoFocus sx={{ borderRadius: 2 }}>
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
});

// Main QuickShoot Component
function QuickShoot(props) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    rank,
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
    rank: state.logic.curRoomInfo.rank,
    isLowGraphics: state.auth.isLowGraphics,
  }));

  // Extract remaining props from parent component
  const {
    bankroll,
    user_id,
    creator_id,
    roomInfo,
    qs_game_type,
    updateUserStrategy,
    bet_amount,
    selected_qs_position,
    onChangeState,
    playSound,
    changeBgColor,
    join,
    updateSelectedQs,
    handleOpenPlayerModal,
    handleClosePlayerModal,
    showPlayerModal,
    selectedCreator,
    handleSwitchChange,
    updateUserPrompt,
    ai_mode,
    strategies,
    betting,
    predictedBetAmount,
    gameResult,
    betResult,
    bgColorChanged,
    result,
    handle2xButtonClick,
    handleHalfXButtonClick,
    handleMaxButtonClick,
  } = props;

  // Local state (using useState for all state management)
  const [qsHistory, setQsHistory] = useState([]);
  const [joinerQsValueAtLastIndex, setJoinerQsValueAtLastIndex] = useState('');
  const [qsValueAtLastIndex, setQsValueAtLastIndex] = useState('');
  const [startedPlaying, setStartedPlaying] = useState(false);
  const [prev_qs, setPrevQs] = useState([]);
  const [players, setPlayers] = useState([]);
  const [host_pr, setHostPr] = useState(roomInfo.host_pr);
  const [status, setStatus] = useState(roomInfo.status);
  const [poolId, setPoolId] = useState(roomInfo.pool_id);
  const [animation, setAnimation] = useState(<div />);
  const [localSelectedQs, setLocalSelectedQs] = useState(selected_qs_position);
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(propIsPasswordCorrect);
  const [showImageModal, setShowImageModal] = useState(false);
  const [image, setImage] = useState('');
  const [productName, setProductName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isComponentMountedRef = useRef(false);

  // Use custom confirmation dialog hook
  const { dialogState, openDialog, closeDialog, handleConfirm, handleSkipChange } = useConfirmationDialog();

  // Memoized position information
  const positionInfo = useMemo(() => {
    let position_name, position_short_name;

    if (qs_game_type === 2) {
      position_name = ['Left', 'Right'];
      position_short_name = ['bl', 'br'];
    } else if (qs_game_type === 3) {
      position_name = ['Bottom-Left', 'Center', 'Bottom-Right'];
      position_short_name = ['bl', 'c', 'br'];
    } else if (qs_game_type === 4) {
      position_name = ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'];
      position_short_name = ['tl', 'tr', 'bl', 'br'];
    } else {
      position_name = ['Center', 'Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'];
      position_short_name = ['c', 'tl', 'tr', 'bl', 'br'];
    }

    return { position_name, position_short_name };
  }, [qs_game_type]);

  const isCreator = creator_id && user_id && creator_id.toString() === user_id.toString();
  const subTitleText = isCreator ? 'This is Your Own Room' : 'Choose WHERE TO SHOOT';
  const tooltipText = isCreator ? 'Shooting is disabled in your own room.' : 'Play against the AI; at the same time, train your AI.';

  // Animation update logic
  const updateAnimation = useCallback(
    async (qsHistoryArg, lastIndexVal) => {
      if (!qsHistoryArg?.length || !lastIndexVal) {
        console.warn('updateAnimation: Missing qsHistory or lastIndexVal', { qsHistoryArg, lastIndexVal });
        return;
      }

      let qsIndex = parseInt(lastIndexVal, 10);
      if (Number.isNaN(qsIndex)) {
        console.warn('updateAnimation: Invalid qsIndex', lastIndexVal);
        return;
      }

      try {
        setIsLoading(true);

        const position_short_name = positionInfo.position_short_name;

        if (qsIndex < 0 || qsIndex >= position_short_name.length) {
          console.warn('updateAnimation: qsIndex out of bounds', qsIndex, position_short_name);
          qsIndex = 0;
        }

        const animData = await getQsLottieAnimation(roomInfo.qs_nation, position_short_name[qsIndex]);

        setAnimation(
          <div className="qs-image-panel" id="quickShoot_lottie">
            <Lottie
              options={{
                loop: false,
                autoplay: true,
                animationData: animData,
                rendererSettings: {
                  preserveAspectRatio: 'xMidYMid slice',
                },
              }}
              style={{
                maxWidth: '100%',
                width: '600px',
                borderRadius: '10px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              }}
            />
          </div>
        );
      } catch (error) {
        console.error('Error updating animation:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [positionInfo.position_short_name, roomInfo.qs_nation]
  );

  // Socket event handlers
  const handleBankrollUpdate = useCallback(
    (data) => {
      onChangeState({ bankroll: data.bankroll });
    },
    [onChangeState]
  );

  const handleGameData = useCallback(
    (data) => {
      setPlayers((prev) => [...prev, data.user].slice(-5));

      if (playSound) playSound('blip');

      onChangeState({
        bankroll: data.bankroll,
        battles: 1,
        hosts: data.hosts,
      });

      if (data.host_pr !== undefined) setHostPr(parseFloat(data.host_pr));

      // Handle game data updates
      if (data.qs) {
        const filtered = data.qs.filter((game) => game.joiner === user_id);
        const newQsHistory = isWatching ? filtered : data.qs;

        setQsHistory(newQsHistory);
        setJoinerQsValueAtLastIndex(parseFloat(newQsHistory[newQsHistory.length - 1]?.joiner_qs ?? ''));
        setQsValueAtLastIndex(parseFloat(newQsHistory[newQsHistory.length - 1]?.qs ?? ''));
        setStartedPlaying(true);
        setPrevQs(data.qs);

        const lastItem = newQsHistory[newQsHistory.length - 1];
        if (lastItem) {
          updateAnimation(newQsHistory, lastItem.qs);
        }
      }
    },
    [playSound, user_id, isWatching, onChangeState, updateAnimation]
  );

  // Use custom socket hook
  useGameSocket(socket, roomInfo._id, user_id, isWatching, handleBankrollUpdate, handleGameData);

  // Effect for room info updates
  useEffect(() => {
    if (roomInfo) {
      if (roomInfo.host_pr !== undefined) setHostPr(parseFloat(roomInfo.host_pr));
      if (roomInfo.status !== undefined) setStatus(roomInfo.status);
      if (roomInfo.pool_id !== undefined && roomInfo.pool_id) setPoolId(roomInfo.pool_id);
    }
  }, [roomInfo]);

  // Effect for password validation
  useEffect(() => {
    if (isPasswordCorrect !== propIsPasswordCorrect) {
      setIsPasswordCorrect(propIsPasswordCorrect);
    }
  }, [propIsPasswordCorrect, isPasswordCorrect]);

  // Effect to join game when password is correct
  useEffect(() => {
    if (isPasswordCorrect && !startedPlaying) {
      joinGame(localSelectedQs);
    }
  }, [isPasswordCorrect, localSelectedQs, startedPlaying]);

  // Join game function
  const joinGame = useCallback(
    async (position) => {
      onChangeState({ result: '' });
      setIsLoading(true);

      try {
        const resultData = await join({
          bet_amount: parseFloat(bet_amount),
          selected_qs_position: position,
        });

        playSound && playSound('ballKick');

        let text;
        let color;

        if (resultData.betResult === 1) {
          playSound && playSound('win');
          text = '+';
          color = '#00ff3a';
          changeBgColor && changeBgColor(resultData.betResult);
        } else {
          text = '-';
          color = '#f50000';
          playSound && playSound('lose');
          changeBgColor && changeBgColor(resultData.betResult);
        }

        const currencyElement = convertToCurrency(Math.abs(resultData.amount), solPrice);

        onChangeState({
          result: (
            <>
              <span
                style={{
                  color,
                  fontSize: '1.2rem', // Updated font size to match QuickShoot
                  fontWeight: 'bold',
                  textShadow: '0 0 10px rgba(0,0,0,0.5)',
                }}
              >
                {text} {currencyElement}
              </span>
            </>
          ),
          gameResult: resultData.betResult,
        });
      } catch (error) {
        console.error('Error joining game:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [bet_amount, join, playSound, changeBgColor, solPrice, onChangeState]
  );

  // Button click handler
  const onBtnBetClick = useCallback(
    async (position) => {
      setLocalSelectedQs(position);
      if (!validateIsAuthenticated(isAuthenticated, dispatch)) return;
      if (!validateBetAmount(bet_amount, balance, dispatch)) return;

      const costPerSide = bet_amount / (qs_game_type - 1);
      if (!validateBankroll(costPerSide + parseFloat(bet_amount) - bankroll * (qs_game_type - 1), bankroll, dispatch)) {
        return;
      }

      const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
      const passwordCorrect = rooms[roomInfo._id];

      updateSelectedQs(position, () => {
        if (localStorage.getItem('hideConfirmModal') === 'true') {
          if (roomInfo.is_private && passwordCorrect !== true) {
            dispatch(openGamePasswordModal());
          } else {
            joinGame(position);
          }
        } else {
          openDialog('ARE YOU SURE YOU WANT TO PLACE THIS BET?', async () => {
            if (roomInfo.is_private && passwordCorrect !== true) {
              dispatch(openGamePasswordModal());
            } else {
              await joinGame(position);
            }
          });
        }
      });

      playSound && playSound('select');
    },
    [bet_amount, balance, bankroll, dispatch, isAuthenticated, joinGame, openDialog, playSound, qs_game_type, roomInfo._id, roomInfo.is_private, updateSelectedQs]
  );

  // Spectate mode toggle
  const handleSpectateMode = useCallback(() => {
    dispatch(setSpectateMode(!isWatching));
  }, [dispatch, isWatching]);

  // Render game buttons
  const renderButtons = useCallback(() => {
    const buttons = [];
    const numButtons = qs_game_type;
    const isDisabled = is_betting || isCreator;

    for (let i = 0; i < numButtons; i++) {
      const buttonId = positionInfo.position_short_name[i];
      const position = i;
      const isActive = joinerQsValueAtLastIndex === position;

      buttons.push(
        <GameButton
          key={buttonId}
          id={buttonId}
          position={position}
          isActive={isActive}
          bgColorChanged={bgColorChanged}
          joinerQsValueAtLastIndex={joinerQsValueAtLastIndex}
          betResult={betResult}
          isBetting={is_betting}
          isDisabled={isDisabled}
          onClick={() => onBtnBetClick(position)}
          ariaLabel={`Shoot to ${positionInfo.position_name[i]}`}
        />
      );
    }

    // Group buttons based on game type
    if (qs_game_type === 2) {
      return <div className="qs-buttons">{buttons}</div>;
    } else if (qs_game_type === 3) {
      return <div className="qs-buttons">{buttons}</div>;
    } else if (qs_game_type === 4) {
      return <div className="qs-buttons">{buttons}</div>;
    } else if (qs_game_type === 5) {
      // Center button is special for 5-button layout
      return (
        <div className="qs-buttons">
          <div className="outer-buttons">{buttons.slice(1, 5)}</div>
          <div className="center-button">{buttons[0]}</div>
        </div>
      );
    }

    return <div className="qs-buttons">{buttons}</div>;
  }, [
    bgColorChanged,
    betResult,
    joinerQsValueAtLastIndex,
    is_betting,
    isCreator,
    onBtnBetClick,
    positionInfo.position_name,
    positionInfo.position_short_name,
    qs_game_type,
  ]);

  return (
    <Box
      className="game-page"
      sx={{
        position: 'relative',
      }}
    >
      {/* Confirmation Dialog */}
      <ConfirmBetDialog
        open={dialogState.open}
        message={dialogState.message}
        skipConfirm={dialogState.skipConfirm}
        onClose={closeDialog}
        onConfirm={handleConfirm}
        onSkipChange={handleSkipChange}
      />

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
        <PlayerModal selectedCreator={selectedCreator} modalIsOpen={showPlayerModal} closeModal={handleClosePlayerModal} />
      )}

      <Box
        className="game-contents title"
        sx={{
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
        }}
      >
        <Box
          className="game-info-panel"
          sx={{
            position: 'relative',
            pt: 4,
            px: { xs: 1, sm: 2, md: 3 },
          }}
        >
          <GuessesSection prevRps={prev_qs} players={players} isDarkMode={isDarkMode} handleOpenPlayerModal={handleOpenPlayerModal} />

          {status === 'open' ? (
            <>
              <Tooltip title={!isWatching ? 'CLICK TO STOP WATCHING' : 'CLICK TO START WATCHING'} placement="left">
                <Button
                  color="error"
                  variant='text'
                  startIcon={isWatching ? <ViewIcon /> : <SwordsIcon />}
                  sx={{
                    position: 'absolute',
                    right: '15px',
                    top: { xs: 0, sm: '20px' },
                    borderRadius: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    },
                  }}
                  onClick={handleSpectateMode}
                >
                  {isWatching ? 'PLAYING' : 'SPECTATING'}
                </Button>
              </Tooltip>

              <Box className="game-info-panel" sx={{ mt: 3 }}>
                {!startedPlaying && (
                  <Typography
                    variant="h6"
                    className="game-sub-title roll-tag"
                    sx={{
                      mt: 2,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontWeight: 'bold',
                      color: isDarkMode ? '#f0f0f0' : '#333',
                    }}
                  >
                    {subTitleText}
                    <Tooltip title={tooltipText} placement="top">
                      <Info
                        sx={{
                          cursor: 'pointer',
                          ml: 1,
                        }}
                      />
                    </Tooltip>
                  </Typography>
                )}

                <Box
                  className="qs-image-panel"
                  sx={{
                    m: { xs: '30px 0' },
                    position: 'relative',
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  {/* Game Field Image */}
                  <img
                    src={`/img/gametype/quick_shoot/gametype${qs_game_type}/type${qs_game_type}-${positionInfo.position_short_name[selected_qs_position]}.png`}
                    alt={`Football field with ${qs_game_type} shooting positions`}
                    style={{
                      width: '600px',
                      maxWidth: '100%',
                      borderRadius: '10px',
                      height: '238px',
                      objectFit: 'cover',
                      transition: 'all 0.3s ease',
                      filter: isLoading ? 'blur(3px)' : 'none',
                    }}
                  />

                  {/* Football Animation and Game Animation */}
                  {result !== '' && (
                    <>
                      <div id="cat-football">
                        <Lottie
                          options={{
                            loop: true,
                            autoplay: true,
                            animationData: football,
                          }}
                          style={{ transform: 'translate(15px, 60px)', width: '100px' }}
                        />
                      </div>
                      {animation}
                    </>
                  )}

                  {/* Game Buttons */}
                  {renderButtons()}
                </Box>

                {/* AI Panel for non-creators */}
                {!isCreator && (
                  <AiPanel
                    qsbetitems={props.qsbetitems}
                    updateUserStrategy={updateUserStrategy}
                    updateUserPrompt={updateUserPrompt}
                    strategies={strategies}
                    betting={betting}
                    is_betting={is_betting}
                    handle2xButtonClick={handle2xButtonClick}
                    handleHalfXButtonClick={handleHalfXButtonClick}
                    handleMaxButtonClick={handleMaxButtonClick}
                    playSound={playSound}
                    predictedBetAmount={predictedBetAmount}
                    roomId={roomInfo._id}
                    handleSwitchChange={handleSwitchChange}
                    game_type={roomInfo.game_type}
                    rank={rank}
                    user_id={user_id}
                    ai_mode={ai_mode}
                    bankroll={bankroll}
                    user_balance={balance}
                    bet_amount={bet_amount}
                    creator_id={creator_id}
                    qs_game_type={qs_game_type}
                    isDarkMode={isDarkMode}
                  />
                )}
              </Box>
            </>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                p: 4,
                borderRadius: 2,
                backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <Typography variant="h5" sx={{ color: '#D32F2F', fontWeight: 'bold', mb: 2, textTransform: 'uppercase' }}>
                Game Ended
              </Typography>

              {poolId ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Pool seeded successfully!
                  </Typography>
                  <Button
                    variant="contained"
                    color="error"
                    component="a"
                    href={`https://www.geckoterminal.com/solana/pools/${poolId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<Box component="span" sx={{ fontSize: 20 }}>
                      🚀
                    </Box>}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                      },
                    }}
                  >
                    View on DEX
                  </Button>
                </Box>
              ) : (
                <Typography variant="body1" sx={{ textAlign: 'center' }}>
                  Pool is either being seeded, or the room has ended.
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default React.memo(QuickShoot);