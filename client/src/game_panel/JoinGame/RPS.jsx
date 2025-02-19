import React, { useState, useEffect, useRef, useCallback } from 'react';
import { connect, useDispatch } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { acQueryMyItem } from '../../redux/Item/item.action';
import { setSpectateMode } from '../../redux/Auth/user.actions';
import GuessesSection from '../../components/GuessesSection';
import {
  getRpsBetItems,
  getRoomBotCount,
  updateRoomBot,
  kickBots,
  detachPlayerFromRoom
} from '../../redux/Logic/logic.actions';

import {
  validateIsAuthenticated,
  validateBetAmount,
  validateBankroll
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
  Stack
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
  { classname: 'scissors', selection: 'S' }
];

function RPS(props) {
  /**
   * Destructure props
   */
  const {
    // Redux
    socket: socket,
    isAuthenticated,
    isPasswordCorrect: propIsPasswordCorrect,
    isDarkMode,
    isWatching,
    balance,
    rank,
    rpsbetitems,
    solPrice,
    updateUserStrategy,
    isLowGraphics,
    is_betting,
    openGamePasswordModal,
    updateRoomBot,
    kickBots,
    setSpectateMode,
    getRpsBetItems,
    getRoomBotCount,
    updateAttachment,
    updateUserPrompt,
    roomInfo,
    creator_id,
    user_id,
    bet_amount,
    changeBgColor,
    join, // function from parent: e.g. props.joinGame
    selected_rps,
    onChangeState,
    playSound,
    handleClosePlayerModal,
    showPlayerModal,
    ai_mode,
    attached,
    getAttachedRooms,
    betting,
    predictedBetAmount,
    betResult,
    handleOpenPlayerModal,
    handleSwitchChange,
    strategies,
    handle2xButtonClick,
    handleHalfXButtonClick,
    handleMaxButtonClick,
    result, // from parent state
    gameResult, // from parent state
    bankroll, // if provided
  } = props;

  /**
   * Local React state
   */
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
  const [rpsHistory, setRpsHistory] = useState([]); // current RPS array
  const [prevRps, setPrevRps] = useState([]);
  const [localIsPasswordCorrect, setLocalIsPasswordCorrect] = useState(propIsPasswordCorrect);
  const [localSelectedRps, setLocalSelectedRps] = useState(selected_rps);
  const [openConfirmBet, setOpenConfirmBet] = useState(false);
  const [confirmBetMessage, setConfirmBetMessage] = useState('');
  const [confirmBetCallback, setConfirmBetCallback] = useState(null);
  const [skipConfirm, setSkipConfirm] = useState(localStorage.getItem('hideConfirmModal') === 'true');

  const dispatch = useDispatch();

  // Refs
  const intervalIdRef = useRef(null);

  /**
   * Effects
   */

  // On mount
  useEffect(() => {
    // Fetch botsCount initially
    (async () => {
      try {
        const count = await getRoomBotCount(roomInfo._id);
        setBotsCount(count);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    })();

    // Cleanup
    return () => {
      // "componentWillUnmount"
      clearInterval(intervalIdRef.current);
    };
    // eslint-disable-next-line
  }, []);

  // Attach socket listeners whenever socket / roomInfo._id / isWatching changes
  useEffect(() => {
    if (!socket) return;

    // --- LISTENERS ---
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

      // Set pool_id if it exists in the data
      if (data.pool_id) {
        setPoolId(data.pool_id);
      }

      if (!data.rps) return;

      // Filter for user's RPS if isWatching
      const filteredRPS = data.rps.filter((game) => game.joiner === user_id);
      const rpsState = isWatching ? filteredRPS : data.rps;
      setRpsHistory(rpsState);
      setPrevRps(data.rps);
      setStartedPlaying(true);
    };

    const handleSocketData2 = (data) => {
      onChangeState({ bankroll: data.bankroll });
    };

    // --- ATTACH ---
    const channel1 = `UPDATED_BANKROLL_${roomInfo._id}`;
    const channel2 = `UPDATED_BANKROLL2_${roomInfo._id}`;

    socket.on(channel1, handleSocketData);
    socket.on(channel2, handleSocketData2);

    // --- CLEANUP ---
    return () => {
      socket.off(channel1, handleSocketData);
      socket.off(channel2, handleSocketData2);
    };
  }, [socket, roomInfo._id, isWatching, onChangeState, user_id, playSound, setPoolId]);

  // Watch for host_pr changes
  useEffect(() => {
    setHostPr(parseFloat(roomInfo.host_pr));
  }, [roomInfo.host_pr]);

  // If currently betting, do quick "flashing" effect
  useEffect(() => {
    if (is_betting) {
      const id = setInterval(toggleBlueishHue, intervalDuration);
      const flashingDuration = 2000;
      setTimeout(() => {
        clearInterval(id);
        document.querySelectorAll('.rps-radio-host').forEach((element) => {
          element.classList.remove('blueish-hue');
        });
      }, flashingDuration);
    }
  }, [is_betting, intervalDuration]);

  // Interval for toggling "blueish hue" in the background
  useEffect(() => {
    intervalIdRef.current = setInterval(toggleBlueishHue, intervalDuration);
    return () => clearInterval(intervalIdRef.current);
  }, [intervalDuration]);

  /**
   * Join game (once user truly confirms or skipping confirm)
   */
  const joinGame = useCallback(
    async (chosenRps) => {
      if (!join) return;
      onChangeState({ result: '' });
      const resultData = await join({
        bet_amount: parseFloat(bet_amount),
        selected_rps: chosenRps
      });

      let text;
      let color;

      if (resultData.betResult === 1) {
        playSound && playSound('win');
        text = '+';
        color = '#7ed321';
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
        solPrice
      );

      onChangeState({
        result: (
          <>
            <span style={{ color }}>
              {text} {currencyElement}
            </span>
          </>
        ),
        gameResult: resultData.betResult
      });
    },
    [
      join,
      bet_amount,
      onChangeState,
      playSound,
      changeBgColor,
      solPrice
    ]
  );

  // Watch for password correctness
  useEffect(() => {
    if (!localIsPasswordCorrect && propIsPasswordCorrect) {
      // Just turned true
      joinGame(localSelectedRps);
    }
    setLocalIsPasswordCorrect(propIsPasswordCorrect);
  }, [propIsPasswordCorrect, localIsPasswordCorrect, joinGame, selected_rps]);


  /**
   * MUI confirm dialog logic
   */
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

  /**
   * BOT
   */
  const handleBotClick = async () => {
    if (creator_id && user_id && creator_id.toString() === user_id.toString()) {
      // Dispatch the action directly
      const botAttached = await updateRoomBot(roomInfo._id);
      if (botAttached) {
        setBotsCount((prev) => prev + 1);
      }
    }
  };

  const bootBots = async () => {
    setBotsCount(0);
    if (creator_id && user_id && creator_id.toString() === user_id.toString()) {
      await kickBots(roomInfo._id);
    }
  };

  /**
   * On user click: R, P, or S
   */
  const onBtnBetClick = async (selection) => {
    const {
      is_private,
      updateSelectedRps,
      user_id,
      creator_id,
      balance,
      bankroll
    } = props;
    setLocalSelectedRps(selection);
    updateSelectedRps(selection, async () => {
      // 1) Auth check
      if (!validateIsAuthenticated(isAuthenticated, dispatch)) {
        return;
      }

      // 2) If host is the same user => call BOT
      if (creator_id && user_id && creator_id.toString() === user_id.toString()) {
        // Dispatch the action directly
        const botAttached = await updateRoomBot(roomInfo._id);
        if (botAttached) {
          setBotsCount((prev) => prev + 1);
        }
        return;
      }

      // 3) Validate bet amount
      if (!validateBetAmount(bet_amount, balance, dispatch)) {
        return;
      }

      // 4) Validate bankroll
      if (!validateBankroll(bet_amount, bankroll, dispatch)) {
        return;
      }

      // 5) Check room password
      const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
      const passwordCorrect = rooms[roomInfo._id];

      // If skipConfirm is active or hideConfirmModal is true
      const callback = async () => {
        if (is_private === true && passwordCorrect !== true) {
          openGamePasswordModal();
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

  /**
   * Toggling "blueish hue"
   */
  const toggleBlueishHue = () => {
    const elements = document.querySelectorAll('.rps-radio-host');
    elements.forEach((element) => {
      element.classList.toggle('blueish-hue');
    });
  };

  /**
   * Spectate mode
   */
  const handleSpectateMode = () => {
    setSpectateMode(!isWatching);
  };

  /**
   * Modal controls
   */
  const toggleImageModal = () => {
    setShowImageModal(false);
  };

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  /**
   * Render
   */
  const rpsValueAtLastIndex = rpsHistory[rpsHistory.length - 1]?.rps;
  const joinerRpsValueAtLastIndex =
    rpsHistory[rpsHistory.length - 1]?.joiner_rps;
  const isCreator =
    creator_id && user_id && creator_id.toString() === user_id.toString();
  const subTitleText = isCreator ? "This is Your Own Room" : "Select: R - P - S!";
  const tooltipText = isCreator
    ? "Betting is disabled in your own room."
    : "Play against the AI, at the same time, train your AI.";

  return (
    <div className="game-page">
      {/* MUI DIALOG for Confirmation */}
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
      {/* END MUI DIALOG */}

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
          {/* RPS history + players */}
          <GuessesSection
            prevRps={prevRps}
            players={players}
            isDarkMode={isDarkMode}
            handleOpenPlayerModal={handleOpenPlayerModal}
          />

          {status === 'open' ? (
            <>
              <Tooltip
                title={
                  !isWatching
                    ? 'CLICK TO STOP WATCHING'
                    : 'CLICK TO START WATCHING'
                }
              >
                <IconButton className="spectate title" onClick={handleSpectateMode}>
                  {isWatching ? (
                    <>
                      PLAYING&nbsp;
                      <SwordsIcon />
                    </>
                  ) : (
                    <>
                      SPECTATING&nbsp;
                      <ViewIcon />
                    </>
                  )}
                </IconButton>
              </Tooltip>

              <div className="game-info-panel">
                <div
                  className={`rps-radio-host ${is_betting || betting ? 'blueish-hue' : ''
                    }`}
                  style={{
                    top: '25px',
                    right: '25px',
                    boxShadow: '0px 0 5px 0px #ffc107',
                    background: 'radial-gradient(#ffd000, rgb(255, 0, 0, 0.2)',
                    position: 'absolute',
                    width: '12.5px',
                    height: '12.5px',
                    borderRadius: '50%'
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
                                animationData: pressHold
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
                                  }deg)`
                              }}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <span>
                          <FontAwesomeIcon icon={faBrain} />
                          &nbsp;
                          <span className="desktop-only">thinking...</span>
                        </span>
                        <div className="lottie-progress">
                          <Lottie
                            options={{
                              loop: isLowGraphics ? false : true,
                              autoplay: isLowGraphics ? false : true,
                              animationData: progress
                            }}
                            style={{ position: 'relative' }}
                          />
                        </div>
                      </>
                    )}
                  </span>
                </div>

                {startedPlaying && (
                  <div
                    id="rps-radio"
                    className={ai_mode !== 'Skill-issue' ? '' : ''}
                  >
                    <div
                      className={`rps-option ${rpsHistory[rpsHistory.length - 1]?.rps === 'R'
                        ? 'rock'
                        : ''
                        }${rpsValueAtLastIndex === 'R' ? ' active' : ''}${props.bgColorChanged &&
                          betResult === -1 &&
                          rpsValueAtLastIndex === 'R'
                          ? ' win-bg'
                          : ''
                        }${betResult === 0 && rpsValueAtLastIndex === 'R'
                          ? ' draw-bg'
                          : ''
                        }${betResult === 1 && rpsValueAtLastIndex === 'R'
                          ? ' lose-bg'
                          : ''
                        }`}
                    ></div>

                    <div
                      className={`rps-option ${rpsHistory[rpsHistory.length - 1]?.rps === 'P'
                        ? 'paper'
                        : ''
                        }${rpsValueAtLastIndex === 'P' ? ' active' : ''}${props.bgColorChanged &&
                          betResult === -1 &&
                          rpsValueAtLastIndex === 'P'
                          ? ' win-bg'
                          : ''
                        }${betResult === 0 && rpsValueAtLastIndex === 'P'
                          ? ' draw-bg'
                          : ''
                        }${betResult === 1 && rpsValueAtLastIndex === 'P'
                          ? ' lose-bg'
                          : ''
                        }`}
                    ></div>

                    <div
                      className={`rps-option ${rpsHistory[rpsHistory.length - 1]?.rps === 'S'
                        ? 'scissors'
                        : ''
                        }${rpsValueAtLastIndex === 'S' ? ' active' : ''}${props.bgColorChanged &&
                          betResult === -1 &&
                          rpsValueAtLastIndex === 'S'
                          ? ' win-bg'
                          : ''
                        }${betResult === 0 && rpsValueAtLastIndex === 'S'
                          ? ' draw-bg'
                          : ''
                        }${betResult === 1 && rpsValueAtLastIndex === 'S'
                          ? ' lose-bg'
                          : ''
                        }`}
                    ></div>
                  </div>
                )}

                {!startedPlaying ? (
                  <h3 className="game-sub-title roll-tag">
                    {subTitleText} &nbsp;
                    <Tooltip
                      style={{
                        position: 'absolute',
                        right: '20px',
                        marginBottom: '30px'
                      }}
                      title={tooltipText}
                      placement="top"
                    >
                      <Info style={{ cursor: 'pointer', float: 'right' }} />
                    </Tooltip>
                  </h3>
                ) : (
                  <h3 className="game-sub-title roll-tag fade-out">
                    {subTitleText} &nbsp;
                    <Tooltip
                      style={{
                        position: 'absolute',
                        right: '20px',
                        marginBottom: '30px'
                      }}
                      title={tooltipText}
                      placement="top"
                    >
                      <Info style={{ cursor: 'pointer', float: 'right' }} />
                    </Tooltip>
                  </h3>
                )}

                <div id="rps-radio" style={{ marginTop: '45px' }}>
                  {options.map(({ classname, selection }, index) => {
                    // Condition to disable
                    const shouldDisable = is_betting || isCreator;

                    return (
                      <Button
                        key={index}
                        variant="contained"
                        color="error"
                        id={`rps-${classname}`}
                        disabled={shouldDisable}  // MUI will style it as disabled
                        className={`rps-option ${classname}${joinerRpsValueAtLastIndex === selection ? ' active' : ''
                          }${props.bgColorChanged && betResult === -1 && joinerRpsValueAtLastIndex === selection
                            ? ' lose-bg'
                            : ''
                          }${betResult === 0 && joinerRpsValueAtLastIndex === selection
                            ? ' draw-bg'
                            : ''
                          }${betResult === 1 && joinerRpsValueAtLastIndex === selection
                            ? ' win-bg'
                            : ''
                          }${shouldDisable ? ' disabled' : ''}`}
                        onClick={() => {
                          if (!shouldDisable) {
                            onBtnBetClick(selection);
                            playSound && playSound('select');
                          }
                        }}
                      >
                      </Button>
                    );
                  })}
                </div>

                {creator_id &&
                  user_id &&
                  creator_id.toString() === user_id.toString() ? (
                  // <div className="host-controls">
                  //   <Button
                  //     variant="outlined"
                  //     color='error'
                  //     onClick={handleBotClick}
                  //     className="hover-text-button"
                  //   >
                  //     <FontAwesomeIcon className="button-icon" icon={faRobot} />
                  //     <span className="button-text">&nbsp;CAT CALL x{botsCount}</span>
                  //   </Button>
                  //   {botsCount > 0 && (
                  //     <Button sx={{ ml: 1 }} variant="outlined"
                  //       color='warning' onClick={bootBots} className="hover-text-button">
                  //       <FontAwesomeIcon className="button-icon" icon={faBan} />
                  //       <span className="button-text">&nbsp;KICK BOTS?</span>
                  //     </Button>
                  //   )}
                  // </div>
                  <></>
                ) : (
                  <>
                     <AiPanel
                     rpsbetitems={rpsbetitems}
                     onChangeState={onChangeState}
                     updateUserStrategy={updateUserStrategy}
                     updateUserPrompt={updateUserPrompt}
                     updateAttachment={updateAttachment}
                     detachPlayerFromRoom={detachPlayerFromRoom}
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
                     creator_id={roomInfo.creator_id}
                     getAttachedRooms={getAttachedRooms}
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
              <Typography variant="subtitle2" sx={{ color: '#ff0000' }}>
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

/**
 * Redux mappings
 */
const mapStateToProps = (state) => ({
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
});

const mapDispatchToProps = {
  openGamePasswordModal,
  acQueryMyItem,
  updateRoomBot,
  kickBots,
  setSpectateMode,
  getRpsBetItems,
  getRoomBotCount
};

export default connect(mapStateToProps, mapDispatchToProps)(RPS);
