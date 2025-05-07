import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { setSpectateMode } from '../../redux/Auth/user.actions';
import GuessesSection from '../../components/GuessesSection';
import {
  validateIsAuthenticated,
  validateBetAmount,
  validateBankroll,
} from '../modal/betValidations';
import { convertToCurrency } from '../../util/conversion';
import {
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Checkbox,
  FormControlLabel,
  Box,
  CircularProgress,
  Fade,
  Paper,
} from '@mui/material';
import { Info } from '@mui/icons-material';
import ViewIcon from '@mui/icons-material/Visibility';
import SwordsIcon from '@mui/icons-material/VisibilityOff';
import PlayerModal from '../modal/PlayerModal';
import AiPanel from '../../components/AiPanel';
import ImageResultModal from '../modal/ImageResultModal';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

// Constants moved outside the component
const RPS_OPTIONS = [
  { classname: 'rock', selection: 'R', label: 'Rock' },
  { classname: 'paper', selection: 'P', label: 'Paper' },
  { classname: 'scissors', selection: 'S', label: 'Scissors' },
];

// Game result styling constants
const RESULT_STYLES = {
  WIN: { color: '#00ff3a', prefix: '+' },
  DRAW: { color: 'grey', prefix: '+' },
  LOSE: { color: '#f50000', prefix: '-' },
};

function RPS(props) {
  const {
    roomInfo,
    creator_id,
    user_id,
    bet_amount,
    changeBgColor,
    join,
    selected_rps,
    onChangeState,
    playSound,
    handleClosePlayerModal,
    showPlayerModal,
    ai_mode,
    betting,
    predictedBetAmount,
    betResult,
    handleOpenPlayerModal,
    handleSwitchChange,
    strategies,
    handle2xButtonClick,
    handleHalfXButtonClick,
    handleMaxButtonClick,
    result,
    gameResult,
    bankroll,
    updateUserPrompt,
    is_private,
    updateSelectedRps,
    bgColorChanged,
    selectedCreator,
  } = props;

  const dispatch = useDispatch();
  const theme = useMemo(() => getCustomTheme(), []);

  // Redux state selectors consolidated
  const {
    socket,
    isAuthenticated,
    isPasswordCorrect: propIsPasswordCorrect,
    isDarkMode,
    isWatching,
    balance,
    rpsbetitems,
    solPrice,
    isLowGraphics,
    is_betting,
    rank,
  } = useSelector((state) => ({
    socket: state.auth.socket,
    isAuthenticated: state.auth.isAuthenticated,
    isPasswordCorrect: state.snackbar.isPasswordCorrect,
    isDarkMode: state.auth.isDarkMode,
    isWatching: state.auth.isWatching,
    balance: state.auth.balance,
    rpsbetitems: state.logic.rpsbetitems,
    solPrice: state.logic.solPrice,
    isLowGraphics: state.auth.isLowGraphics,
    is_betting: state.logic.is_betting,
    rank: state.logic.curRoomInfo.rank,
  }));

  // Consolidated game state
  const [gameState, setGameState] = useState({
    showImageModal: false,
    image: '',
    productName: '',
    modalOpen: false,
    players: [],
    botsCount: 0,
    startedPlaying: false,
    status: roomInfo.status,
    pool_id: roomInfo.pool_id,
    hostPr: roomInfo.host_pr,
    rpsHistory: [],
    prevRps: [],
    localIsPasswordCorrect: propIsPasswordCorrect,
    localSelectedRps: selected_rps,
    isLoading: false,
  });

  // Separate modal state
  const [confirmDialogState, setConfirmDialogState] = useState({
    open: false,
    message: '',
    callback: null,
    skipConfirm: localStorage.getItem('hideConfirmModal') === 'true',
  });

  // Memoized values for performance
  const isCreator = useMemo(
    () => creator_id && user_id && creator_id.toString() === user_id.toString(),
    [creator_id, user_id]
  );

  const subTitleText = useMemo(
    () => isCreator ? 'This is Your Own Room' : 'Select: Rock - Paper - Scissors!',
    [isCreator]
  );

  const tooltipText = useMemo(
    () => isCreator
      ? 'Betting is disabled in your own room.'
      : 'Play against the AI, at the same time, train your AI.',
    [isCreator]
  );

  // Derived values from game state
  const { rpsHistory, startedPlaying, prevRps, players, showImageModal, image, productName } = gameState;
  const rpsValueAtLastIndex = rpsHistory[rpsHistory.length - 1]?.rps;
  const joinerRpsValueAtLastIndex = rpsHistory[rpsHistory.length - 1]?.joiner_rps;

  // Socket event handlers - memoized to prevent recreation on each render
  const handleSocketData = useCallback((data) => {
    if (!data) {
      console.error('Error: Received undefined or null data from the socket.');
      return;
    }

    setGameState(prevState => ({
      ...prevState,
      players: [...prevState.players, data.user].slice(-5),
      hostPr: data.host_pr,
      pool_id: data.pool_id || prevState.pool_id,
      rpsHistory: data.rps ? (isWatching ? data.rps.filter(game => game.joiner === user_id) : data.rps) : prevState.rpsHistory,
      prevRps: data.rps || prevState.prevRps,
      startedPlaying: true
    }));

    playSound && playSound('blip');
    onChangeState({
      bankroll: data.bankroll,
      battles: 1,
      hosts: data.hosts,
    });
  }, [isWatching, onChangeState, playSound, user_id]);

  const handleBankrollUpdate = useCallback((data) => {
    onChangeState({ bankroll: data.bankroll });
  }, [onChangeState]);

  // Effect for socket event listeners
  useEffect(() => {
    if (!socket) return;

    const channel1 = `UPDATED_BANKROLL_${roomInfo._id}`;
    const channel2 = `UPDATED_BANKROLL2_${roomInfo._id}`;

    socket.on(channel1, handleSocketData);
    socket.on(channel2, handleBankrollUpdate);

    return () => {
      socket.off(channel1, handleSocketData);
      socket.off(channel2, handleBankrollUpdate);
    };
  }, [socket, roomInfo._id, handleSocketData, handleBankrollUpdate]);

  // Update host profit rate when room info changes
  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      hostPr: parseFloat(roomInfo.host_pr),
      status: roomInfo.status
    }));
  }, [roomInfo.host_pr, roomInfo.status]);

  const joinGame = useCallback(
    async (chosenRps) => {
      if (!join) return;
  
      setGameState(prev => ({ ...prev, isLoading: true }));
      onChangeState({ result: '' });
  
      try {
        const resultData = await join({
          bet_amount: parseFloat(bet_amount),
          selected_rps: chosenRps,
        });
        let style;
        if (resultData.betResult === 1) {
          playSound && playSound('win');
          style = RESULT_STYLES.WIN;
          changeBgColor && changeBgColor(resultData.betResult);
        } else if (resultData.betResult === 0) {
          style = RESULT_STYLES.DRAW;
          playSound && playSound('split');
          changeBgColor && changeBgColor(resultData.betResult);
        } else {
          style = RESULT_STYLES.LOSE;
          playSound && playSound('lose');
          changeBgColor && changeBgColor(resultData.betResult);
        }
  
        const currencyElement = convertToCurrency(
          Math.abs(resultData.amount),
          solPrice,
        );
  
        onChangeState({
          result: (
            <span style={{ color: style.color, fontSize: '1.2rem', fontWeight: 'bold' }}>
              {style.prefix} {currencyElement}{' '}
              <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>
                ({Math.abs(resultData.amount).toFixed(4)} SOL)
              </span>
            </span>
          ),
          gameResult: resultData.betResult,
        });
      } finally {
        setGameState(prev => ({ ...prev, isLoading: false }));
      }
    },
    [join, bet_amount, onChangeState, playSound, changeBgColor, solPrice],
  );

  // Password correct effect
  useEffect(() => {
    if (!gameState.localIsPasswordCorrect && propIsPasswordCorrect) {
      joinGame(gameState.localSelectedRps);
    }
    setGameState(prev => ({ ...prev, localIsPasswordCorrect: propIsPasswordCorrect }));
  }, [propIsPasswordCorrect, gameState.localIsPasswordCorrect, joinGame, gameState.localSelectedRps]);

  // Confirm dialog handlers
  const openConfirmBetDialog = useCallback((message, callback) => {
    if (confirmDialogState.skipConfirm) {
      callback();
      return;
    }
    setConfirmDialogState(prev => ({
      ...prev,
      open: true,
      message,
      callback
    }));
  }, [confirmDialogState.skipConfirm]);

  const closeConfirmBetDialog = useCallback(() => {
    setConfirmDialogState(prev => ({
      ...prev,
      open: false,
      message: '',
      callback: null
    }));
  }, []);

  const handleConfirmBet = useCallback(async () => {
    if (confirmDialogState.callback) {
      await confirmDialogState.callback();
    }
    closeConfirmBetDialog();
  }, [confirmDialogState.callback, closeConfirmBetDialog]);

  const handleSkipConfirmChange = useCallback((event) => {
    const checked = event.target.checked;
    setConfirmDialogState(prev => ({ ...prev, skipConfirm: checked }));
    localStorage.setItem('hideConfirmModal', checked ? 'true' : 'false');
  }, []);

  // On user selection: R, P, or S
  const onBtnBetClick = useCallback(async (selection) => {
    setGameState(prev => ({ ...prev, localSelectedRps: selection }));

    updateSelectedRps(selection, async () => {
      if (!validateIsAuthenticated(isAuthenticated, dispatch)) {
        return;
      }

      if (!validateBetAmount(bet_amount, balance, dispatch)) {
        return;
      }

      if (!validateBankroll(bet_amount, bankroll, dispatch)) {
        return;
      }

      const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
      const passwordCorrect = rooms[roomInfo._id];

      const callback = async () => {
        if (is_private === true && passwordCorrect !== true) {
          dispatch(openGamePasswordModal());
        } else {
          await joinGame(selection);
        }
      };

      if (confirmDialogState.skipConfirm) {
        callback();
      } else {
        openConfirmBetDialog('ARE YOU SURE YOU WANT TO PLACE THIS BET?', callback);
      }
    });
  }, [
    updateSelectedRps, isAuthenticated, dispatch, bet_amount,
    balance, bankroll, is_private, roomInfo._id, joinGame,
    confirmDialogState.skipConfirm, openConfirmBetDialog
  ]);

  // Spectate mode toggle
  const handleSpectateMode = useCallback(() => {
    dispatch(setSpectateMode(!isWatching));
  }, [dispatch, isWatching]);

  // Modal toggles
  const toggleImageModal = useCallback(() => {
    setGameState(prev => ({ ...prev, showImageModal: false }));
  }, []);

  // Render the RPS option button with appropriate classes
  const renderRpsOption = useCallback((option, index) => {
    const { classname, selection, label } = option;
    const shouldDisable = is_betting || isCreator;
    const isActive = joinerRpsValueAtLastIndex === selection;

    let resultClass = '';
    if (bgColorChanged && isActive) {
      if (betResult === 1) resultClass = ' win-bg';
      else if (betResult === 0) resultClass = ' draw-bg';
      else if (betResult === -1) resultClass = ' lose-bg';
    }

    return (
      <Tooltip key={index} title={label} placement="top">
        <span>
          <Button
            variant="outlined"
            color="error"
            id={`rps-${classname}`}
            disabled={shouldDisable || gameState.isLoading}
            className={`rps-option ${classname}${isActive ? ' active' : ''}${resultClass}${shouldDisable ? ' disabled' : ''}`}
            onClick={() => {
              if (!shouldDisable && !gameState.isLoading) {
                onBtnBetClick(selection);
                playSound && playSound('select');
              }
            }}
            aria-label={label}
            sx={{
              height: '60px',
              width: '60px',
              margin: '0 10px',
              borderRadius: '50%',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1)',
              },
              '&.disabled': {
                opacity: 0.5,
              },
              position: 'relative',
            }}
          >
            {gameState.isLoading && selection === gameState.localSelectedRps && (
              <CircularProgress
                size={24}
                color="error"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  marginTop: '-12px',
                  marginLeft: '-12px',
                }}
              />
            )}
          </Button>
        </span>
      </Tooltip>
    );
  }, [
    is_betting, isCreator, joinerRpsValueAtLastIndex, bgColorChanged,
    betResult, gameState.isLoading, gameState.localSelectedRps, onBtnBetClick, playSound
  ]);

  // Render opponent's selection with appropriate styling
  const renderOpponentSelection = useCallback(() => {
    if (!startedPlaying) return null;

    return (
      <Box id="rps-radio" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        {RPS_OPTIONS.map(({ classname, selection }) => {
          let resultClass = '';
          const isActive = rpsValueAtLastIndex === selection;

          if (isActive) {
            if (betResult === -1) resultClass = ' win-bg';
            else if (betResult === 0) resultClass = ' draw-bg';
            else if (betResult === 1) resultClass = ' lose-bg';
          }

          return (
            <Paper
              key={selection}
              elevation={3}
              className={`rps-option ${classname}${isActive ? ' active' : ''}${bgColorChanged ? resultClass : ''}`}
              sx={{
                width: '50px',
                height: '50px',
                margin: '0 10px',
                opacity: isActive ? 1 : 0.3,
                borderRadius: '50%',
                transition: 'all 0.3s ease',
              }}
            />
          );
        })}
      </Box>
    );
  }, [startedPlaying, rpsValueAtLastIndex, betResult, bgColorChanged]);

  return (
    <ThemeProvider theme={theme}>
      <Box className="game-page" sx={{ padding: { xs: 1, sm: '0 30px' }, position: 'relative' }}>
        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialogState.open}
          onClose={closeConfirmBetDialog}
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-description"
        >
          <DialogTitle id="confirm-dialog-title">Confirmation</DialogTitle>
          <DialogContent>
            <Typography>{confirmDialogState.message}</Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={confirmDialogState.skipConfirm}
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

        {/* Image Result Modal */}
        {showImageModal && (
          <ImageResultModal
            modalIsOpen={showImageModal}
            closeModal={toggleImageModal}
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

        {/* Main Game Content */}
        <Box
          className="game-contents"
          sx={{
            backgroundColor: 'transparent',
            position: 'relative'
          }}
        >
          <Box sx={{ position: 'relative' }}>
            {/* Guesses Section */}
            <GuessesSection
              prevRps={prevRps}
              players={players}
              isDarkMode={isDarkMode}
              handleOpenPlayerModal={handleOpenPlayerModal}
            />

            {gameState.status === 'open' ? (
              <>
                {/* Spectate Button */}
                <Tooltip
                  title={!isWatching ? 'CLICK TO STOP WATCHING' : 'CLICK TO START WATCHING'}
                >
                  <Button
                    color='error'
                    variant="text"
                    sx={{
                      position: 'absolute',
                      right: { xs: '10px', sm: '15px' },
                      top: { xs: '0px', sm: '15px' },
                      minWidth: 'auto',
                      borderRadius: 2,
                    }}
                    onClick={handleSpectateMode}
                    startIcon={isWatching ? <SwordsIcon /> : <ViewIcon />}
                  >
                    {isWatching ? 'PLAYING' : 'SPECTATING'}
                  </Button>
                </Tooltip>

                <Box className="game-info-panel" sx={{ mt: 2 }}>
                  {/* Opponent's Selection Display */}
                  <Fade in={startedPlaying} timeout={800}>
                    <Box>
                      {renderOpponentSelection()}
                    </Box>
                  </Fade>

                  {/* Game Title with Info Tooltip */}
                  <Box sx={{ mt: 4, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                      <IconButton size="small" sx={{ ml: 1 }}>
                        <Info fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    </Typography>
                  </Box>

                  {/* Player RPS Options */}
                  <Box
                    id="rps-radio"
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mt: 2,
                      mb: 3,
                      gap: 2
                    }}
                  >
                    {RPS_OPTIONS.map(renderRpsOption)}
                  </Box>

                  {/* AI Panel (if not creator) */}
                  {!isCreator && (
                    <AiPanel
                      rpsbetitems={rpsbetitems}
                      onChangeState={onChangeState}
                      updateUserPrompt={updateUserPrompt}
                      strategies={strategies}
                      betting={betting}
                      playSound={playSound}
                      bet_amount={bet_amount}
                      handle2xButtonClick={handle2xButtonClick}
                      handleHalfXButtonClick={handleHalfXButtonClick}
                      handleMaxButtonClick={handleMaxButtonClick}
                      bankroll={bankroll}
                      is_betting={is_betting}
                      creator_id={creator_id}
                      predictedBetAmount={predictedBetAmount}
                      roomId={roomInfo._id}
                      handleSwitchChange={handleSwitchChange}
                      game_type={roomInfo.game_type}
                      rank={rank}
                      user_id={user_id}
                      ai_mode={ai_mode}
                      user_balance={balance}
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
                }}
              >
                <Typography variant="h6" sx={{ color: '#FF0000', fontWeight: 'bold', mb: 2 }}>
                  GAME ENDED
                </Typography>

                {gameState.pool_id ? (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography>
                      Pool seeded! SEE
                    </Typography>
                    <Button
                      component="a"
                      href={`https://www.geckoterminal.com/solana/pools/${gameState.pool_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ ml: 1 }}
                      variant="outlined"
                      color="error"
                      size="small"
                    >
                      DEX 🚀
                    </Button>
                  </Box>
                ) : (
                  <Typography sx={{ textAlign: 'center', color: '#fff'}}>
                    Pool is either being seeded, or the room has ended.
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default React.memo(RPS);