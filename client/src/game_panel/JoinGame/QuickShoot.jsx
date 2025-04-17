import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { Info } from '@mui/icons-material';
import GuessesSection from '../../components/GuessesSection';
import progress from '../LottieAnimations/progress.json';
import pressHold from '../LottieAnimations/pressHold.json';
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

function QuickShoot(props) {
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
    creator: state.logic.curRoomInfo.creator_name,
    creator_avatar: state.logic.curRoomInfo.creator_avatar,
    rank: state.logic.curRoomInfo.rank,
    accessory: state.logic.curRoomInfo.accessory,
    elite: state.logic.curRoomInfo.elite,
    username: state.logic.curRoomInfo.username,
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
    borderColor,
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

  // Local state
  const [intervalId, setIntervalId] = useState(null);
  const [animation, setAnimation] = useState(<div />);
  const [qsHistory, setQsHistory] = useState([]);
  const [localSelectedQs, setLocalSelectedQs] = useState(selected_qs_position);
  const [poolId, setPoolId] = useState(roomInfo.pool_id);
  const [joinerQsValueAtLastIndex, setJoinerQsValueAtLastIndex] = useState('');
  const [qsValueAtLastIndex, setQsValueAtLastIndex] = useState('');
  const [startedPlaying, setStartedPlaying] = useState(false);
  const [prev_qs, setPrevQs] = useState([]);
  const [players, setPlayers] = useState([]);
  const [host_pr, setHostPr] = useState(roomInfo.host_pr);
  const [productName, setProductName] = useState('');
  const [status, setStatus] = useState(roomInfo.status);
  const [image, setImage] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(propIsPasswordCorrect);

  // Confirm dialog state
  const [openConfirmBet, setOpenConfirmBet] = useState(false);
  const [confirmBetMessage, setConfirmBetMessage] = useState('');
  const [confirmBetCallback, setConfirmBetCallback] = useState(null);
  const [skipConfirm, setSkipConfirm] = useState(
    localStorage.getItem('hideConfirmModal') === 'true',
  );

  const isComponentMountedRef = useRef(false);

  const updateAnimation = useCallback(
    async (qsHistoryArg, lastIndexVal) => {
      if (!qsHistoryArg?.length) return;
      if (!lastIndexVal) return;

      let qsIndex = parseInt(lastIndexVal, 10);
      if (Number.isNaN(qsIndex)) return;

      let position_short_name = ['center', 'tl', 'tr', 'bl', 'br'];

      if (qs_game_type === 2) {
        position_short_name = ['bl', 'br'];
      } else if (qs_game_type === 3) {
        position_short_name = ['bl', 'center', 'br'];
      } else if (qs_game_type === 4) {
        position_short_name = ['tl', 'tr', 'bl', 'br'];
      }

      if (qsIndex < 0 || qsIndex >= position_short_name.length) {
        qsIndex = 0;
      }

      const animData = await getQsLottieAnimation(
        roomInfo.qs_nation,
        position_short_name[qsIndex],
      );

      setAnimation(
        <div className="qs-image-panel" id="quickShoot_lottie">
          <Lottie
            options={{ loop: false, autoplay: true, animationData: animData }}
            style={{ maxWidth: '100%', width: '600px', borderRadius: '10px' }}
          />
        </div>,
      );
    },
    [qs_game_type, roomInfo.user_bet],
  );

  // Socket Handlers
  const handleSocketData = useCallback(
    (data) => {
      setPlayers((prev) => {
        const updated = [...prev, data.user].slice(-5);
        return updated;
      });

      if (playSound) playSound('blip');

      onChangeState({
        bankroll: data.bankroll,
        battles: 1,
        hosts: data.hosts,
      });
      setHostPr(data.host_pr);
      if (!data.qs) return;

      const filtered = data.qs.filter((game) => game.joiner === user_id);
      const newQsHistory = isWatching ? filtered : data.qs;

      setQsHistory(newQsHistory);
      setJoinerQsValueAtLastIndex(parseFloat(newQsHistory[newQsHistory.length - 1]?.joiner_qs ?? ''));
      setQsValueAtLastIndex(parseFloat(newQsHistory[newQsHistory.length - 1]?.qs ?? ''));
      setStartedPlaying(true);
      setPrevQs(data.qs);

      updateAnimation(newQsHistory, newQsHistory[newQsHistory.length - 1]?.qs);
    },
    [playSound, user_id, isWatching, onChangeState, updateAnimation]
  );

  const handleSocketData2 = useCallback(
    (data) => {
      onChangeState({ bankroll: data.bankroll });
    },
    [onChangeState],
  );

  useEffect(() => {
    if (!socket) return;

    socket.on(`UPDATED_BANKROLL_${roomInfo._id}`, handleSocketData);
    socket.on(`UPDATED_BANKROLL2_${roomInfo._id}`, handleSocketData2);

    return () => {
      socket.off(`UPDATED_BANKROLL_${roomInfo._id}`, handleSocketData);
      socket.off(`UPDATED_BANKROLL2_${roomInfo._id}`, handleSocketData2);
    };
  }, [socket, roomInfo._id, handleSocketData, handleSocketData2]);

  // Main Methods
  const joinGame = useCallback(
    async (position) => {
      onChangeState({ result: '' });

      const resultData = await join({
        bet_amount: parseFloat(bet_amount),
        selected_qs_position: position,
      });

      playSound('ballKick');

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
      const currencyElement = convertToCurrency(
        Math.abs(resultData.amount),
        solPrice,
      );

      onChangeState({
        result: (
          <>
            <span style={{ color }}>
              {text} {currencyElement}
            </span>
          </>
        ),
        gameResult: resultData.betResult,
      });
      
    },
    [bet_amount, join, onChangeState, playSound, changeBgColor, solPrice],
  );

  useEffect(() => {
    if (isPasswordCorrect !== propIsPasswordCorrect) {
      setIsPasswordCorrect(propIsPasswordCorrect);
    }
  }, [propIsPasswordCorrect, isPasswordCorrect]);

  useEffect(() => {
    if (isPasswordCorrect && !startedPlaying) { // Add condition to prevent re-running
      joinGame(localSelectedQs);
    }
  }, [isPasswordCorrect, joinGame, localSelectedQs, startedPlaying]);

  useEffect(() => {
    if (roomInfo) {
      if (roomInfo.host_pr !== undefined) setHostPr(parseFloat(roomInfo.host_pr));
      if (roomInfo.status !== undefined) setStatus(roomInfo.status);
      if (roomInfo.pool_id !== undefined && roomInfo.pool_id) setPoolId(roomInfo.pool_id);
    }
  }, [roomInfo]);

  const handleSpectateMode = () => {
    dispatch(setSpectateMode(!isWatching));
  };

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

  const onBtnBetClick = async (position) => {
    setLocalSelectedQs(position);
    if (!validateIsAuthenticated(isAuthenticated, dispatch)) return;


    if (!validateBetAmount(bet_amount, balance, dispatch)) return;

    const costPerSide = bet_amount / (qs_game_type - 1);
    if (
      !validateBankroll(
        costPerSide + parseFloat(bet_amount) - bankroll * (qs_game_type - 1),
        bankroll,
        dispatch,
      )
    ) {
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
        openConfirmBetDialog('ARE YOU SURE YOU WANT TO PLACE THIS BET?', async () => {
          if (roomInfo.is_private && passwordCorrect !== true) {
            dispatch(openGamePasswordModal());
          } else {
            await joinGame(position);
          }
        });
      }
    });
  };

  // Render each shot button
  const renderButton = (id, position) => {
    const classes = [];
    let showBall = false;

    const isCreator =
      creator_id && user_id && creator_id.toString() === user_id.toString();
    const isDisabled = is_betting || isCreator;

    if (joinerQsValueAtLastIndex === position) {
      classes.push('active');
    }

    if (bgColorChanged && joinerQsValueAtLastIndex === position && !is_betting) {
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
        onClick={() => {
          onBtnBetClick(position);
          playSound('select');
        }}
        className={classes.join(' ')}
        sx={{ position: 'relative' }}
        disabled={isDisabled}
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
            }}
          />
        )}
      </IconButton>
    );
  };

  // Return the set of buttons based on qs_game_type
  const renderButtons = () => {
    if (qs_game_type === 2) {
      return (
        <div className="qs-buttons">
          {renderButton('l', 0)}
          {renderButton('r', 1)}
        </div>
      );
    } else if (qs_game_type === 3) {
      return (
        <div className="qs-buttons">
          {renderButton('l', 0)}
          {renderButton('cc', 1)}
          {renderButton('r', 2)}
        </div>
      );
    } else if (qs_game_type === 4) {
      return (
        <div className="qs-buttons">
          {renderButton('tl', 0)}
          {renderButton('tr', 1)}
          {renderButton('bl', 2)}
          {renderButton('br', 3)}
        </div>
      );
    } else if (qs_game_type === 5) {
      return (
        <div className="qs-buttons">
          {renderButton('tl', 1)}
          {renderButton('tr', 2)}
          {renderButton('bl', 3)}
          {renderButton('br', 4)}
          {renderButton('c', 0)}
        </div>
      );
    }
  };

  // Render Logic
  let position_name = ['Center', 'Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'];
  let position_short_name = ['c', 'tl', 'tr', 'bl', 'br'];

  if (qs_game_type === 2) {
    position_name = ['Left', 'Right'];
    position_short_name = ['bl', 'br'];
  } else if (qs_game_type === 3) {
    position_name = ['Bottom-Left', 'Center', 'Bottom-Right'];
    position_short_name = ['bl', 'c', 'br'];
  } else if (qs_game_type === 4) {
    position_name = ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'];
    position_short_name = ['tl', 'tr', 'bl', 'br'];
  }

  const isCreator = creator_id && user_id && creator_id.toString() === user_id.toString();
  const subTitleText = isCreator ? 'This is Your Own Room' : 'Choose WHERE TO SHOOT';
  const tooltipText = isCreator
    ? 'Shooting is disabled in your own room.'
    : 'Play against the AI; at the same time, train your AI.';

  return (
    <div className="game-page" style={{ paddingTop: "30px" }}>
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
        <div className="game-info-panel" style={{ position: 'relative' }}>
          <GuessesSection
            prevRps={prev_qs}
            players={players}
            isDarkMode={isDarkMode}
            handleOpenPlayerModal={handleOpenPlayerModal}
          />

          {status === 'open' ? (
            <>
              <Tooltip
                title={!isWatching ? 'CLICK TO STOP WATCHING' : 'CLICK TO START WATCHING'}
              >
                <IconButton className="spectate title" onClick={handleSpectateMode}>
                  {isWatching ? (
                    <>
                      PLAYING
                      <SwordsIcon />
                    </>
                  ) : (
                    <>
                      SPECTATING
                      <ViewIcon />
                    </>
                  )}
                </IconButton>
              </Tooltip>

              <div className="game-info-panel" >
                <div
                  className={`rps-radio-host ${is_betting || betting ? 'blueish-hue' : ''}`}
                  style={{
                    top: '25px',
                    right: '25px',
                    position: 'absolute',
                    width: '12.5px',
                    height: '12.5px',
                  }}
                >
                  <span
                    className="result"
                    style={{ display: !startedPlaying ? 'none' : 'flex' }}
                  >
                    {result !== '' ? (
                      <>
                        {result}
                        {betting && (
                          <div className="lottie-pressHold">
                            <Lottie
                              options={{
                                loop: isLowGraphics ? false : true,
                                autoplay: isLowGraphics ? false : true,
                                animationData: pressHold,
                              }}
                              style={{
                                position: 'relative',
                                filter: `hue-rotate(${gameResult === -1
                                    ? 0
                                    : gameResult === 0
                                      ? 195
                                      : gameResult === 1
                                        ? 80
                                        : 20
                                  }deg)`,
                              }}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="lottie-progress">
                          <Lottie
                            options={{
                              loop: isLowGraphics ? false : true,
                              autoplay: isLowGraphics ? false : true,
                              animationData: progress,
                            }}
                            style={{ position: 'relative' }}
                          />
                        </div>
                      </>
                    )}
                  </span>
                </div>

                {!startedPlaying && (
                  <h3 className="game-sub-title roll-tag">
                    {subTitleText}
                    <Tooltip
                      style={{ position: 'absolute', right: '20px', marginBottom: '30px' }}
                      title={tooltipText}
                      placement="top"
                    >
                      <Info style={{ cursor: 'pointer', float: 'right' }} />
                    </Tooltip>
                  </h3>
                )}

                <div className="qs-image-panel" style={{ marginTop: '20px' }}>
                  <img
                    src={`/img/gametype/quick_shoot/gametype${qs_game_type}/type${qs_game_type}-${position_short_name[selected_qs_position]}.png`}
                    alt=""
                    style={{
                      width: '600px',
                      maxWidth: '100%',
                      borderRadius: '10px',
                      border: `3px solid ${borderColor}`,
                      height: '238px',
                    }}
                  />

                  {result !== '' && (
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
                  )}
                  {result !== '' && <>{animation}</>}

                  {renderButtons()}
                </div>

                {isCreator ? (
                  <></>
                ) : (
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
    </div>
  );
}

export default QuickShoot;