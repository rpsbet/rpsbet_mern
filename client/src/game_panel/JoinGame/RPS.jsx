import React, { useState, useEffect, useRef, useCallback } from 'react';
import { connect } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { acQueryMyItem } from '../../redux/Item/item.action';
import { setSpectateMode } from '../../redux/Auth/user.actions';
import {
  getRpsBetItems,
  getRoomBotCount,
  updateRoomBot,
  kickBots
} from '../../redux/Logic/logic.actions';

import {
  validateIsAuthenticated,
  validateCreatorId,
  callBot,
  validateBetAmount,
  validateBankroll
} from '../modal/betValidations';

import { alertModal } from '../modal/ConfirmAlerts';
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
  FormControlLabel
} from '@mui/material';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Info } from '@mui/icons-material';
import ViewIcon from '@mui/icons-material/Visibility';
import SwordsIcon from '@mui/icons-material/VisibilityOff';

import Lottie from 'react-lottie';
import Avatar from '../../components/Avatar';
import BetAmountInput from '../../components/BetAmountInput';
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
    socket: propSocket,
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
    isFocused,
    is_betting,
    openGamePasswordModal,
    acQueryMyItem,
    updateRoomBot,
    kickBots,
    setSpectateMode,
    getRpsBetItems,
    getRoomBotCount,

    // Additional props from parent or Redux:
    roomInfo,
    creator_id,
    user_id,
    bankroll,
    bet_amount: propBetAmount = 1,
    changeBgColor,
    join, // function from parent: e.g. props.joinGame
    selected_rps,
    onChangeState,
    playSound,
    handleDetachAttachChange,
    handleClosePlayerModal,
    showPlayerModal,
    ai_mode,
    attached,
    getAttachedRooms,
    betting,
    predictedBetAmount,
    betResult,
    handleOpenPlayerModal,
    creator_avatar,
    rps_game_type,
    strategies,
    endgame_type,
    pr,
    cp,
    result, // from parent state
    gameResult, // from parent state
    is_mobile, // if provided
  } = props;

  /**
   * Local React state
   */
  const [showImageModal, setShowImageModal] = useState(false);
  const [image, setImage] = useState('');
  const [productName, setProductName] = useState('');
  const [localSelectedRps, setLocalSelectedRps] = useState(selected_rps);
  const [modalOpen, setModalOpen] = useState(false);
  const [players, setPlayers] = useState([]);
  const [botsCount, setBotsCount] = useState(0);
  const [intervalDuration, setIntervalDuration] = useState(500);
  const [startedPlaying, setStartedPlaying] = useState(false);
  const [isQbot, setIsQbot] = useState(false);
  const [advancedStatus, setAdvancedStatus] = useState('');
  const [status, setStatus] = useState(roomInfo.status);
  const [hostPr, setHostPr] = useState(roomInfo.host_pr);
  const [rpsHistory, setRpsHistory] = useState([]); // current RPS array
  const [prevRps, setPrevRps] = useState([]);
  const [localIsPasswordCorrect, setLocalIsPasswordCorrect] = useState(propIsPasswordCorrect);

  // For bet amount:
  const [currentBetAmount, setCurrentBetAmount] = useState(propBetAmount);
  const [potentialReturn, setPotentialReturn] = useState(0);
  const [isMax, setIsMax] = useState(false);

  // MUI v5 Confirm dialog
  const [openConfirmBet, setOpenConfirmBet] = useState(false);
  const [confirmBetMessage, setConfirmBetMessage] = useState('');
  const [confirmBetCallback, setConfirmBetCallback] = useState(null);

  // "Don't show again" checkbox
  const [skipConfirm, setSkipConfirm] = useState(localStorage.getItem('hideConfirmModal') === 'true');

  // Refs
  const settingsRef = useRef(null);
  const panelRef = useRef(null);
  const intervalIdRef = useRef(null);

  /**
   * Effects
   */

  // On mount
  useEffect(() => {
    // "componentDidMount" - attach keydown
    document.addEventListener('keydown', handleKeyPress);

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
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('mousedown', handleClickOutside);
      clearInterval(intervalIdRef.current);
    };
    // eslint-disable-next-line
  }, []);

  // Attach socket listeners whenever propSocket / roomInfo._id / isWatching changes
  useEffect(() => {
    if (!propSocket) return;

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

      if (!data.rps) return;

      // Filter for user's RPS if isWatching
      const filteredRPS = data.rps.filter((game) => game.joiner === user_id);
      const rpsState = isWatching ? filteredRPS : data.rps;

      onChangeState({ bankroll: data.bankroll });
      setHostPr(data.host_pr);
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

    // If you only want to listen while *not* isWatching, or always listen:
    // For example, let's say we always attach, but you can conditionally attach if needed:
    propSocket.on(channel1, handleSocketData);
    propSocket.on(channel2, handleSocketData2);

    // --- CLEANUP ---
    return () => {
      propSocket.off(channel1, handleSocketData);
      propSocket.off(channel2, handleSocketData2);
    };
  }, [propSocket, roomInfo._id, isWatching, onChangeState, user_id, playSound]);

  // Watch for is_betting changes (to fetch RPS items if done)
  useEffect(() => {
    if (!is_betting) {
      // Compare the last item IDs as in class-based code
      const prevLastItemId =
        rpsbetitems.length > 4
          ? rpsbetitems.slice(0, 5).reverse()[4]._id
          : null;
      const currentLastItemId =
        rpsHistory.length > 4 ? rpsHistory[4]._id : null;
      if (prevLastItemId === currentLastItemId) {
        (async () => {
          await getRpsBetItems(roomInfo._id);
        
        })();
      }
    }
  }, [is_betting, rpsHistory, rpsbetitems, getRpsBetItems, roomInfo]);

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
        bet_amount: parseFloat(currentBetAmount),
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
      currentBetAmount,
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
      joinGame(selected_rps);
    }
    setLocalIsPasswordCorrect(propIsPasswordCorrect);
  }, [propIsPasswordCorrect, localIsPasswordCorrect, joinGame, selected_rps]);

  
  /**
   * UI helpers
   */
  const handleKeyPress = (event) => {
    if (!isFocused) {
      const ctrlKeyPressed = event.ctrlKey || event.metaKey;
      const isRKeyPressed = event.key === 'r';

      if (!(ctrlKeyPressed && isRKeyPressed)) {
        switch (event.key) {
          case 'r':
            onBtnBetClick('R');
            break;
          case 'p':
            onBtnBetClick('P');
            break;
          case 's':
            onBtnBetClick('S');
            break;
          default:
            break;
        }
      }
    }
  };

  const handleClickOutside = (e) => {
    if (settingsRef.current && !settingsRef.current.contains(e.target)) {
      // close a panel or do something if needed
    }
  };

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
   * BOT / end game
   */
  const handleBotClick = () => {
    if (creator_id && user_id && creator_id.toString() === user_id.toString()) {
      callBot(creator_id, roomInfo._id, user_id, isDarkMode, async () => {
        const botAttached = await updateRoomBot(roomInfo._id);
        if (botAttached) {
          setBotsCount((prev) => prev + 1);
        }
      });
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
      if (!validateIsAuthenticated(isAuthenticated, isDarkMode)) {
        return;
      }

      // 2) If host is the same user => call BOT
      if (creator_id && user_id && creator_id.toString() === user_id.toString()) {
        callBot(creator_id, roomInfo._id, user_id, isDarkMode, async () => {
          const botAttached = await updateRoomBot(roomInfo._id);
          if (botAttached) {
            setBotsCount((prev) => prev + 1);
          }
        });
        return;
      }

      // 3) Validate bet amount
      if (!validateBetAmount(currentBetAmount, balance, isDarkMode)) {
        return;
      }

      // 4) Validate bankroll
      if (!validateBankroll(currentBetAmount, bankroll, isDarkMode)) {
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
                color="primary"
              />
            }
            label="Don’t show this again"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmBetDialog} color="error">
            Cancel
          </Button>
          <Button onClick={handleConfirmBet} color="primary" autoFocus>
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
          <div className="guesses">
            <div>
              {prevRps.slice().map((item, index) => (
                <p key={index}>{item.rps}</p>
              ))}
            </div>
            <div>
              {players.length !== 0 && (
                <>
                  {players.slice(0, 5).map((player, index) => (
                    <div
                      key={index}
                      style={{
                        opacity: '0.4',
                        width: '29px',
                        cursor: 'pointer'
                      }}
                    >
                      <a
                        className="avatar"
                        onClick={() => handleOpenPlayerModal(player._id)}
                      >
                        <Avatar
                          className="avatar"
                          src={player.avatar}
                          rank={player.totalWagered}
                          username={player.username}
                          accessory={player.accessory}
                          alt=""
                          darkMode={isDarkMode}
                        />
                      </a>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

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
                  className={`rps-radio-host ${
                    is_betting || betting ? 'blueish-hue' : ''
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
                                filter: `hue-rotate(${
                                  gameResult === -1
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
                      className={`rps-option ${
                        rpsHistory[rpsHistory.length - 1]?.rps === 'R'
                          ? 'rock'
                          : ''
                      }${rpsValueAtLastIndex === 'R' ? ' active' : ''}${
                        props.bgColorChanged &&
                        betResult === -1 &&
                        rpsValueAtLastIndex === 'R'
                          ? ' win-bg'
                          : ''
                      }${
                        betResult === 0 && rpsValueAtLastIndex === 'R'
                          ? ' draw-bg'
                          : ''
                      }${
                        betResult === 1 && rpsValueAtLastIndex === 'R'
                          ? ' lose-bg'
                          : ''
                      }`}
                    ></div>

                    <div
                      className={`rps-option ${
                        rpsHistory[rpsHistory.length - 1]?.rps === 'P'
                          ? 'paper'
                          : ''
                      }${rpsValueAtLastIndex === 'P' ? ' active' : ''}${
                        props.bgColorChanged &&
                        betResult === -1 &&
                        rpsValueAtLastIndex === 'P'
                          ? ' win-bg'
                          : ''
                      }${
                        betResult === 0 && rpsValueAtLastIndex === 'P'
                          ? ' draw-bg'
                          : ''
                      }${
                        betResult === 1 && rpsValueAtLastIndex === 'P'
                          ? ' lose-bg'
                          : ''
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
                      }${
                        betResult === 0 && rpsValueAtLastIndex === 'S'
                          ? ' draw-bg'
                          : ''
                      }${
                        betResult === 1 && rpsValueAtLastIndex === 'S'
                          ? ' lose-bg'
                          : ''
                      }`}
                    ></div>
                  </div>
                )}

                {!startedPlaying ? (
                  <h3 className="game-sub-title roll-tag">
                    Select: R - P - S! &nbsp;
                    <Tooltip
                      style={{
                        position: 'absolute',
                        right: '20px',
                        marginBottom: '30px'
                      }}
                      title={'Play against the AI, at the same time, train your AI.'}
                      placement="top"
                    >
                      <Info style={{ cursor: 'pointer', float: 'right' }} />
                    </Tooltip>
                  </h3>
                ) : (
                  <h3 className="game-sub-title roll-tag fade-out">
                    Select: R - P - S! &nbsp;
                    <Tooltip
                      style={{
                        position: 'absolute',
                        right: '20px',
                        marginBottom: '30px'
                      }}
                      title={'Play against the AI, at the same time, train your AI.'}
                      placement="top"
                    >
                      <Info style={{ cursor: 'pointer', float: 'right' }} />
                    </Tooltip>
                  </h3>
                )}

                <div id="rps-radio" style={{ marginTop: '45px' }}>
                  {options.map(({ classname, selection }, index) => (
                    <Button
                      key={index}
                      variant="contained"
                      color="secondary"
                      id={`rps-${classname}`}
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
                      }${is_betting ? ' disabled' : ''}`}
                      onClick={() => {
                        if (!is_betting) {
                          onBtnBetClick(selection);
                          playSound && playSound('select');
                        }
                      }}
                    >
                      &nbsp;
                      <span className="roll-tag">[{selection}]</span>
                    </Button>
                  ))}
                </div>

                {creator_id &&
                user_id &&
                creator_id.toString() === user_id.toString() ? (
                  <div className="host-controls">
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleBotClick}
                      className="hover-text-button"
                    >
                      <FontAwesomeIcon className="button-icon" icon={faRobot} />
                      <span className="button-text">&nbsp;CALL BOT? [{botsCount}]</span>
                    </Button>
                    {botsCount > 0 && (
                      <Button onClick={bootBots} className="hover-text-button">
                        <FontAwesomeIcon className="button-icon" icon={faBan} />
                        <span className="button-text">&nbsp;KICK BOTS?</span>
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {is_mobile && (
                      <AiPanel
                        rpsbetitems={rpsbetitems}
                        updateUserStrategy={props.updateUserStrategy}
                        strategies={strategies}
                        betting={betting}
                        is_betting={is_betting}
                        predictedBetAmount={predictedBetAmount}
                        roomId={roomInfo._id}
                        handleSwitchChange={props.handleSwitchChange}
                        game_type={roomInfo.game_type}
                        rank={props.rank}
                        user_id={user_id}
                        ai_mode={ai_mode}
                        user_balance={balance}
                        handleDetachAttachChange={handleDetachAttachChange}
                        attached={attached}
                        creator_id={roomInfo.creator_id}
                        getAttachedRooms={getAttachedRooms}
                        rps_game_type={roomInfo.rps_game_type}
                        isDarkMode={isDarkMode}
                      />
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <span style={{ color: '#ff0000' }}>THIS GAME HAS ENDED</span>
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
  isFocused: state.auth.isFocused,
  is_betting: state.logic.is_betting
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
