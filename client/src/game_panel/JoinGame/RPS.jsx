import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { acQueryMyItem } from '../../redux/Item/item.action';
import { setSpectateMode } from '../../redux/Auth/user.actions';
import GuessesSection from '../../components/GuessesSection';
import {
  getRpsBetItems,
  getRoomBotCount,
  updateRoomBot,
  kickBots,
} from '../../redux/Logic/logic.actions';
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
  Stack,
} from '@mui/material';
import { Info } from '@mui/icons-material';
import ViewIcon from '@mui/icons-material/Visibility';
import SwordsIcon from '@mui/icons-material/VisibilityOff';
import Lottie from 'react-lottie';
import Avatar from '../../components/Avatar';
import PlayerModal from '../modal/PlayerModal';
import AiPanel from '../../components/AiPanel';
import ImageResultModal from '../modal/ImageResultModal';
import progress from '../LottieAnimations/progress.json';
import pressHold from '../LottieAnimations/pressHold.json';
import { faRobot, faBan, faBrain } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const options = [
  { classname: 'rock', selection: 'R' },
  { classname: 'paper', selection: 'P' },
  { classname: 'scissors', selection: 'S' },
];

function RPS(props) {
  const dispatch = useDispatch();

  // Map state from Redux using useSelector
  const {
    socket,
    isAuthenticated,
    isPasswordCorrect: propIsPasswordCorrect,
    isDarkMode,
    isWatching,
    balance,
    rpsbetitems,
    solPrice,
    data,
    isLowGraphics,
    isMusicEnabled,
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
    data: state.itemReducer.myItemArray,
    isLowGraphics: state.auth.isLowGraphics,
    isMusicEnabled: state.auth.isMusicEnabled,
    is_betting: state.logic.is_betting,
    rank: state.logic.curRoomInfo.rank,
  }));

  // Destructure remaining props from parent component
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
    updateUserStrategy,
    updateUserPrompt,
  } = props;

  // Local React state
  const [showImageModal, setShowImageModal] = useState(false);
  const [image, setImage] = useState('');
  const [productName, setProductName] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [players, setPlayers] = useState([]);
  const [botsCount, setBotsCount] = useState(0);
  const [intervalDuration, setIntervalDuration] = useState(500);
  const [startedPlaying, setStartedPlaying] = useState(false);
  const [status, setStatus] = useState(roomInfo.status);
  const [pool_id, setPoolId] = useState(roomInfo.pool_id);
  const [hostPr, setHostPr] = useState(roomInfo.host_pr);
  const [rpsHistory, setRpsHistory] = useState([]);
  const [prevRps, setPrevRps] = useState([]);
  const [localIsPasswordCorrect, setLocalIsPasswordCorrect] = useState(propIsPasswordCorrect);
  const [localSelectedRps, setLocalSelectedRps] = useState(selected_rps);
  const [openConfirmBet, setOpenConfirmBet] = useState(false);
  const [confirmBetMessage, setConfirmBetMessage] = useState('');
  const [confirmBetCallback, setConfirmBetCallback] = useState(null);
  const [skipConfirm, setSkipConfirm] = useState(
    localStorage.getItem('hideConfirmModal') === 'true',
  );

  // Refs
  const intervalIdRef = useRef(null);

  // Effects
  useEffect(() => {
    (async () => {
      try {
        const count = await dispatch(getRoomBotCount(roomInfo._id));
        setBotsCount(count);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    })();

    return () => {
      clearInterval(intervalIdRef.current);
    };
  }, [dispatch, roomInfo._id]);

  useEffect(() => {
    if (!socket) return;

    const handleSocketData = (data) => {
      if (!data) {
        console.error('Error: Received undefined or null data from the socket.');
        return;
      }
      setPlayers((prev) => {
        const updated = [...prev, data.user];
        if (updated.length > 5) {
          updated.shift();
        }
        return updated;
      });
      playSound && playSound('blip');
      onChangeState({
        bankroll: data.bankroll,
        battles: 1,
        hosts: data.hosts,
      });
      setHostPr(data.host_pr);

      if (data.pool_id) {
        setPoolId(data.pool_id);
      }

      if (!data.rps) return;

      const filteredRPS = data.rps.filter((game) => game.joiner === user_id);
      const rpsState = isWatching ? filteredRPS : data.rps;
      setRpsHistory(rpsState);
      setPrevRps(data.rps);
      setStartedPlaying(true);
    };

    const handleSocketData2 = (data) => {
      onChangeState({ bankroll: data.bankroll });
    };

    const channel1 = `UPDATED_BANKROLL_${roomInfo._id}`;
    const channel2 = `UPDATED_BANKROLL2_${roomInfo._id}`;

    socket.on(channel1, handleSocketData);
    socket.on(channel2, handleSocketData2);

    return () => {
      socket.off(channel1, handleSocketData);
      socket.off(channel2, handleSocketData2);
    };
  }, [socket, roomInfo._id, isWatching, onChangeState, user_id, playSound]);

  useEffect(() => {
    setHostPr(parseFloat(roomInfo.host_pr));
  }, [roomInfo.host_pr]);


  // Join game
  const joinGame = useCallback(
    async (chosenRps) => {
      if (!join) return;
      onChangeState({ result: '' });
      const resultData = await join({
        bet_amount: parseFloat(bet_amount),
        selected_rps: chosenRps,
      });

      let text;
      let color;

      if (resultData.betResult === 1) {
        playSound && playSound('win');
        text = '+';
        color = '#00ff3a';
        changeBgColor && changeBgColor(resultData.betResult);
      } else if (resultData.betResult === 0) {
        text = '-';
        color = 'grey';
        playSound && playSound('split');
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
    [join, bet_amount, onChangeState, playSound, changeBgColor, solPrice],
  );

  useEffect(() => {
    if (!localIsPasswordCorrect && propIsPasswordCorrect) {
      joinGame(localSelectedRps);
    }
    setLocalIsPasswordCorrect(propIsPasswordCorrect);
  }, [propIsPasswordCorrect, localIsPasswordCorrect, joinGame, localSelectedRps]);

  // MUI confirm dialog logic
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

  const handleConfirmBet = async () => {
    if (confirmBetCallback) {
      await confirmBetCallback();
    }
    closeConfirmBetDialog();
  };

  const handleSkipConfirmChange = (event) => {
    const checked = event.target.checked;
    setSkipConfirm(checked);
    localStorage.setItem('hideConfirmModal', checked ? 'true' : 'false');
  };


  // On user click: R, P, or S
  const onBtnBetClick = async (selection) => {
    const { is_private } = props;
    setLocalSelectedRps(selection);
    props.updateSelectedRps(selection, async () => {
      if (!validateIsAuthenticated(isAuthenticated, dispatch)) {
        return;
      }

      if (creator_id && user_id && creator_id.toString() === user_id.toString()) {
        const botAttached = await dispatch(updateRoomBot(roomInfo._id));
        if (botAttached) {
          setBotsCount((prev) => prev + 1);
        }
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

      if (skipConfirm || localStorage.getItem('hideConfirmModal') === 'true') {
        callback();
      } else {
        openConfirmBetDialog('ARE YOU SURE YOU WANT TO PLACE THIS BET?', callback);
      }
    });
  };

  // Spectate mode
  const handleSpectateMode = () => {
    dispatch(setSpectateMode(!isWatching));
  };

  // Modal controls
  const toggleImageModal = () => {
    setShowImageModal(false);
  };

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  // Render
  const rpsValueAtLastIndex = rpsHistory[rpsHistory.length - 1]?.rps;
  const joinerRpsValueAtLastIndex = rpsHistory[rpsHistory.length - 1]?.joiner_rps;
  const isCreator = creator_id && user_id && creator_id.toString() === user_id.toString();
  const subTitleText = isCreator ? 'This is Your Own Room' : 'Select: R - P - S!';
  const tooltipText = isCreator
    ? 'Betting is disabled in your own room.'
    : 'Play against the AI, at the same time, train your AI.';

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
          closeModal={toggleImageModal}
          isDarkMode={isDarkMode}
          image={image}
          productName={productName}
        />
      )}
      {showPlayerModal && (
        <PlayerModal
          selectedCreator={props.selectedCreator}
          modalIsOpen={showPlayerModal}
          closeModal={handleClosePlayerModal}
        />
      )}

      <div className="game-contents title">
        <div className="game-info-panel" style={{ position: 'relative' }}>
          <GuessesSection
            prevRps={prevRps}
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

              <div className="game-info-panel">
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
                                filter: `hue-rotate(${
                                  gameResult === -1
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

                {startedPlaying && (
                  <div id="rps-radio" className={ai_mode !== 'Skill-issue' ? '' : ''}>
                    <div
                      className={`rps-option ${
                        rpsHistory[rpsHistory.length - 1]?.rps === 'R' ? 'rock' : ''
                      }${rpsValueAtLastIndex === 'R' ? ' active' : ''}${
                        props.bgColorChanged &&
                        betResult === -1 &&
                        rpsValueAtLastIndex === 'R'
                          ? ' win-bg'
                          : ''
                      }${betResult === 0 && rpsValueAtLastIndex === 'R' ? ' draw-bg' : ''}${
                        betResult === 1 && rpsValueAtLastIndex === 'R' ? ' lose-bg' : ''
                      }`}
                    ></div>

                    <div
                      className={`rps-option ${
                        rpsHistory[rpsHistory.length - 1]?.rps === 'P' ? 'paper' : ''
                      }${rpsValueAtLastIndex === 'P' ? ' active' : ''}${
                        props.bgColorChanged &&
                        betResult === -1 &&
                        rpsValueAtLastIndex === 'P'
                          ? ' win-bg'
                          : ''
                      }${betResult === 0 && rpsValueAtLastIndex === 'P' ? ' draw-bg' : ''}${
                        betResult === 1 && rpsValueAtLastIndex === 'P' ? ' lose-bg' : ''
                      }`}
                    ></div>

                    <div
                      className={`rps-option ${
                        rpsHistory[rpsHistory.length - 1]?.rps === 'S'
                          ? 'scissors'
                          : ''
                      }${rpsValueAtLastIndex === 'S' ? ' active' : ''}${
                        props.bgColorChanged &&
                        betResult === -1 &&
                        rpsValueAtLastIndex === 'S'
                          ? ' win-bg'
                          : ''
                      }${betResult === 0 && rpsValueAtLastIndex === 'S' ? ' draw-bg' : ''}${
                        betResult === 1 && rpsValueAtLastIndex === 'S' ? ' lose-bg' : ''
                      }`}
                    ></div>
                  </div>
                )}

                {!startedPlaying ? (
                  <h3 className="game-sub-title roll-tag">
                    {subTitleText}  
                    <Tooltip
                      style={{
                        position: 'absolute',
                        right: '20px',
                        marginBottom: '30px',
                      }}
                      title={tooltipText}
                      placement="top"
                    >
                      <Info style={{ cursor: 'pointer', float: 'right' }} />
                    </Tooltip>
                  </h3>
                ) : (
                  <h3 className="game-sub-title roll-tag fade-out">
                    {subTitleText}  
                    <Tooltip
                      style={{
                        position: 'absolute',
                        right: '20px',
                        marginBottom: '30px',
                      }}
                      title={tooltipText}
                      placement="top"
                    >
                      <Info style={{ cursor: 'pointer', float: 'right' }} />
                    </Tooltip>
                  </h3>
                )}

                <div id="rps-radio" style={{ marginTop: '15px' }}>
                  {options.map(({ classname, selection }, index) => {
                    const shouldDisable = is_betting || isCreator;

                    return (
                      <Button
                        key={index}
                        variant="contained"
                        color="error"
                        id={`rps-${classname}`}
                        disabled={shouldDisable}
                        className={`rps-option ${classname}${
                          joinerRpsValueAtLastIndex === selection ? ' active' : ''
                        }${
                          props.bgColorChanged &&
                          betResult === -1 &&
                          joinerRpsValueAtLastIndex === selection
                            ? ' lose-bg'
                            : ''
                        }${
                          betResult === 0 && joinerRpsValueAtLastIndex === selection
                            ? ' draw-bg'
                            : ''
                        }${
                          betResult === 1 && joinerRpsValueAtLastIndex === selection
                            ? ' win-bg'
                            : ''
                        }${shouldDisable ? ' disabled' : ''}`}
                        onClick={() => {
                          if (!shouldDisable) {
                            onBtnBetClick(selection);
                            playSound && playSound('select');
                          }
                        }}
                      ></Button>
                    );
                  })}
                </div>

                {isCreator ? (
                  <></>
                ) : (
                  <AiPanel
                    rpsbetitems={rpsbetitems}
                    onChangeState={onChangeState}
                    updateUserStrategy={updateUserStrategy}
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
                    attached={attached}
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

export default RPS;