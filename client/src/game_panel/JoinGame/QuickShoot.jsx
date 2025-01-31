import React, { useState, useEffect, useRef, useCallback } from 'react';
import { connect } from 'react-redux';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { Info } from '@mui/icons-material';
import Moment from 'moment';
import Avatar from '../../components/Avatar';
import progress from '../LottieAnimations/progress.json';
import pressHold from '../LottieAnimations/pressHold.json';
import PlayerModal from '../modal/PlayerModal';
import AiPanel from '../../components/AiPanel';
import ViewIcon from '@mui/icons-material/Visibility';
import SwordsIcon from '@mui/icons-material/VisibilityOff';
import InfoIcon from '@mui/icons-material/Info';
import { getQsLottieAnimation } from '../../util/helper';
import { updateRoomBot, kickBots, getQsBetItems, getRoomBotCount } from '../../redux/Logic/logic.actions';
import { setSpectateMode } from '../../redux/Auth/user.actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import WarningIcon from '@mui/icons-material/Warning';
import { faRobot, faMoneyBillWave, faBrain, faBan } from '@fortawesome/free-solid-svg-icons';
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
  Typography
} from '@mui/material';
import { YouTubeVideo } from '../../components/YoutubeVideo';
import BetAmountInput from '../../components/BetAmountInput';
import {
  validateIsAuthenticated,
  validateBetAmount,
  validateBankroll
} from '../modal/betValidations';

import Lottie from 'react-lottie';
import ImageResultModal from '../modal/ImageResultModal';
import {
  alertModal,
  // confirmModalCreate, <== removed
} from '../modal/ConfirmAlerts';
import history from '../../redux/history';
import { convertToCurrency } from '../../util/conversion';
import football from '../LottieAnimations/football.json';
import animationData from '../LottieAnimations/spinningIcon';

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: animationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
};

function QuickShoot(props) {
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
    qs_game_type,
    isDarkMode,
    isFocused,
    isWatching,
    is_betting,
    bet_amount,
    selected_qs_position,

    // Additional props
    onChangeState,
    playSound,
    changeBgColor,
    solPrice,
    openGamePasswordModal,
    updateRoomBot,
    kickBots,
    getRoomBotCount,
    setSpectateMode,
    endGame,
    join,
    updateSelectedQs,

    // UI logic / other props
    actionList,
    handleOpenPlayerModal,
    handleClosePlayerModal,
    showPlayerModal,
    selectedCreator,
    isLowGraphics,
    borderColor,
    handleSwitchChange,
    is_mobile,
    rank,
    ai_mode,
    attached,
    getAttachedRooms,
    strategies,
    betting,
    predictedBetAmount,

    // Possibly for RPS-like logic
    gameResult,
    betResult,
    bgColorChanged,
    result,
    endgame_type,
    cp,
    username,
    creator_avatar,
    isMusicEnabled
  } = props;

  // Local state
  const [items, setItems] = useState([]);
  const [bettingState, setBettingState] = useState(false);
  const [timer, setTimer] = useState(null);
  const [timerValue, setTimerValue] = useState(2000);
  const [intervalId, setIntervalId] = useState(null);
  const [advanced_status, setAdvancedStatus] = useState('');
  const [animation, setAnimation] = useState(<div />);
  const [qsHistory, setQsHistory] = useState([]);
  const [localSelectedQs, setLocalSelectedQs] = useState(selected_qs_position);

  const [ballClassApplied, setBallClassApplied] = useState(false);
  const [joinerQsValueAtLastIndex, setJoinerQsValueAtLastIndex] = useState('');
  const [qsValueAtLastIndex, setQsValueAtLastIndex] = useState('');
  const [startedPlaying, setStartedPlaying] = useState(false);
  const [prev_qs, setPrevQs] = useState([]);
  const [isQbot, setIsQbot] = useState(false);
  const [players, setPlayers] = useState([]);
  const [botsCount, setBotsCount] = useState(0);
  const [potential_return, setPotentialReturn] = useState(1.25);
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
    localStorage.getItem('hideConfirmModal') === 'true'
  );

  // Refs
  const settingsRef = useRef(null);
  const panelRef = useRef(null);

  // We track mounted status to avoid setting state after unmount
  const isComponentMountedRef = useRef(false);

  const updateAnimation = useCallback(
    async (qsHistoryArg, lastIndexVal) => {

      if (!qsHistoryArg?.length) return;
      if (!lastIndexVal) return;

      let qsIndex = parseInt(lastIndexVal, 10);
      if (Number.isNaN(qsIndex)) return;

      let position_short_name = ["center", "tl", "tr", "bl", "br"];

      // Example game type checks
      if (qs_game_type === 2) {
        position_short_name = ["bl", "br"];
      } else if (qs_game_type === 3) {
        position_short_name = ["bl", "center", "br"];
      } else if (qs_game_type === 4) {
        position_short_name = ["tl", "tr", "bl", "br"];
      }

      if (qsIndex < 0 || qsIndex >= position_short_name.length) {
        qsIndex = 0;
      }

      const animData = await getQsLottieAnimation(
        roomInfo.qs_nation,
        position_short_name[qsIndex]
      );

      setAnimation(
        <div className="qs-image-panel" id="quickShoot_lottie">
          <Lottie
            options={{ loop: false, autoplay: true, animationData: animData }}
            style={{ maxWidth: "100%", width: "600px", borderRadius: "10px" }}
          />
        </div>
      );
    },
    [qs_game_type, roomInfo] // dependencies, but note we no longer rely on qsHistory state
  );

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

    // Filter or use entire array
    const filtered = data.qs.filter((game) => game.joiner === user_id);
    const newQsHistory = isWatching ? filtered : data.qs;

    // Update your state
    setQsHistory(newQsHistory);

    // Compute the last shot
    const newPlayerShot = newQsHistory?.[newQsHistory.length - 1]?.joiner_qs ?? null;
    const newLastShot = newQsHistory?.[newQsHistory.length - 1]?.qs ?? null;
    setJoinerQsValueAtLastIndex(parseFloat(newPlayerShot));
    setQsValueAtLastIndex(parseFloat(newLastShot));

    // The rest of your updates
    setPrevQs(data.qs);
    setStartedPlaying(true);
    onChangeState({ bankroll: data.bankroll });
    setHostPr(data.host_pr);

    updateAnimation(newQsHistory, newLastShot);

  }, [playSound, user_id, isWatching, onChangeState, updateAnimation]);

  const handleSocketData2 = useCallback(
    (data) => {
      onChangeState({ bankroll: data.bankroll });
    },
    [onChangeState]
  );

  const removeSocketListeners = useCallback(() => {
    // If you want an explicit cleanup that runs on unmount or socket changes:
    if (socket) {
      socket.off(`UPDATED_BANKROLL_QS_${roomInfo._id}`, handleSocketData);
      socket.off(`UPDATED_BANKROLL_QS2_${roomInfo._id}`, handleSocketData2);
    }
  }, [socket, roomInfo._id, handleSocketData, handleSocketData2]);


  // =========== Effect Hooks ===========

  // Simulate componentDidMount
  useEffect(() => {
    isComponentMountedRef.current = true;

    document.addEventListener('keydown', handleKeyPress);

    const intervalDuration = 3000; // Or any logic to get this from your old code
    const id = setInterval(() => {
      toggleBlueishHue();
    }, intervalDuration);
    setIntervalId(id);

    // Socket setup is now in a separate effect below

    // Fetch initial bots count
    (async () => {
      try {
        const count = await getRoomBotCount(roomInfo._id);
        if (isComponentMountedRef.current) {
          setBotsCount(count);
        }
      } catch (error) {
        console.error('Error fetching botsCount:', error);
      }
    })();

    return () => {
      isComponentMountedRef.current = false;
      document.removeEventListener('keydown', handleKeyPress);
      clearInterval(id);
      removeSocketListeners(); // clean up
    };
  }, []);

  // Set up and remove socket listeners whenever socket changes
  useEffect(() => {
    if (!socket) return;

    // Attach listeners
    socket.on(`UPDATED_BANKROLL_QS_${roomInfo._id}`, handleSocketData);
    socket.on(`UPDATED_BANKROLL_QS2_${roomInfo._id}`, handleSocketData2);

    return () => {
      // Remove listeners on unmount or when socket changes
      socket.off(`UPDATED_BANKROLL_QS_${roomInfo._id}`, handleSocketData);
      socket.off(`UPDATED_BANKROLL_QS2_${roomInfo._id}`, handleSocketData2);
    };
  }, [socket, roomInfo._id, handleSocketData, handleSocketData2]);

  // =============== Main Methods ===============

  const joinGame = useCallback(async (position) => {
    onChangeState({ result: '' });

    const resultData = await join({
      bet_amount: parseFloat(bet_amount),
      selected_qs_position: position
    });

    playSound('ballKick');

    let sign;
    if (resultData.betResult === 1) {
      playSound('win');
      sign = '+';
      changeBgColor(resultData.betResult);
    } else {
      playSound('lose');
      sign = '-';
      changeBgColor(resultData.betResult);
    }
    const currencyElement = convertToCurrency(
      Math.abs(resultData.amount),
      solPrice
    );

    onChangeState({
      result: (
        <span style={{ color: '' }}>
          {sign} {currencyElement}
        </span>
      ),
      gameResult: resultData.betResult
    });
  }, [
    bet_amount,
    join,
    onChangeState,
    playSound,
    changeBgColor,
    solPrice
  ]);

  useEffect(() => {
    // Some code if needed, or skip entirely if your logic is handled in the main effect
  }, [isWatching]);

  // Simulate getDerivedStateFromProps for password correctness
  useEffect(() => {
    if (isPasswordCorrect !== propIsPasswordCorrect) {
      setIsPasswordCorrect(propIsPasswordCorrect);
    }
  }, [propIsPasswordCorrect, isPasswordCorrect]);

  // If newly correct password => auto join
  useEffect(() => {
    if (isPasswordCorrect) {
      joinGame(localSelectedQs);
    }
  }, [isPasswordCorrect, joinGame]);

  // Watch for changes to roomInfo (host_pr, status)
  useEffect(() => {
    if (roomInfo && roomInfo.host_pr !== undefined) {
      setHostPr(parseFloat(roomInfo.host_pr));
    }
    if (roomInfo && roomInfo.status !== undefined) {
      setStatus(roomInfo.status);
    }
  }, [roomInfo]);

  // Watch changes to is_betting or actionList if needed
  useEffect(() => {
    if (props.actionList !== actionList) {
      // Example: handle changes to the actionList
    }
  }, [props.actionList, actionList]);

  // If `is_betting` changes from true -> false, replicate old componentDidUpdate logic
  // useEffect(() => {
  //   if (!is_betting) {
  //     const prevLastItemId =
  //       props.qsbetitems.length > 4
  //         ? props.qsbetitems.slice(0, 5).reverse()[4]._id
  //         : null;
  //     const currentLastItemId = qs.length > 4 ? qs[4]._id : null;

  //     if (prevLastItemId === currentLastItemId) {
  //       (async () => {
  //         await props.getQsBetItems(roomInfo._id);
  //         const newQs = props.qsbetitems.slice(0, 5).reverse();
  //         console.log("newQs", newQs)
  //         setQs(newQs);
  //         setPrevQs(newQs);
  //       })();
  //     }
  //   }
  // }, [is_betting, props, qs, roomInfo._id]);


  // =============== Event Handlers ===============

  const handleKeyPress = useCallback(
    (event) => {
      if (!isFocused) {
        const ctrlKeyPressed = event.ctrlKey || event.metaKey;
        const isRKeyPressed = event.key === 'r';
        if (!(ctrlKeyPressed && isRKeyPressed)) {
          switch (event.key) {
            case 'p':
              onBtnBetClick(0);
              break;
            case 'q':
              onBtnBetClick(1);
              break;
            case 'w':
              onBtnBetClick(2);
              break;
            case 'e':
              onBtnBetClick(3);
              break;
            case 'r':
              onBtnBetClick(4);
              break;
            default:
              break;
          }
        }
      }
    },
    [isFocused]
  );

  const toggleBlueishHue = useCallback(() => {
    // Placeholder from original snippet
  }, []);

  const handleSpectateMode = () => {
    setSpectateMode(!isWatching);
  };




  // Example: if you had half, double, max bet logic:
  const handleHalfXButtonClick = () => {
    // ...
  };
  const handle2xButtonClick = () => {
    // ...
  };
  const handleMaxButtonClick = () => {
    // ...
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
    if (!validateIsAuthenticated(isAuthenticated, isDarkMode)) return;

    // If the room creator is the same as the current user, try attaching a bot
    if (creator_id && user_id && creator_id.toString() === user_id.toString()) {
      const botAttached = await updateRoomBot(roomInfo._id);
      if (botAttached) {
        setBotsCount((prev) => prev + 1);
      }
      return; 
    }

    // Otherwise, proceed with normal bet validations
    if (!validateBetAmount(bet_amount, balance, isDarkMode)) return;

    const costPerSide = bet_amount / (qs_game_type - 1);
    if (
      !validateBankroll(
        costPerSide + parseFloat(bet_amount) - bankroll * (qs_game_type - 1),
        bankroll,
        isDarkMode
      )
    ) {
      return;
    }

    const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
    const passwordCorrect = rooms[roomInfo._id];

    updateSelectedQs(position, () => {
      if (localStorage.getItem('hideConfirmModal') === 'true') {
        // If private room but password not verified yet, ask for password
        if (roomInfo.is_private && passwordCorrect !== true) {
          openGamePasswordModal();
        } else {
          joinGame(position);
        }
      } else {
        openConfirmBetDialog('ARE YOU SURE YOU WANT TO PLACE THIS BET?', async () => {
          if (roomInfo.is_private && passwordCorrect !== true) {
            openGamePasswordModal();
          } else {
            await joinGame(position);
          }
        });
      }
    });
  };

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

  const handleEndClick = async () => {
    if (roomInfo.status !== 'finished') {
      await endGame(roomInfo._id);
      setStatus('finished');
    } else {
      alertModal(isDarkMode, 'THIS GAME HAS ALREADY ENDED.');
    }
  };

  const getPositionLetter = (position) => {
    switch (position) {
      case 0:
        return 'P';
      case 1:
        return 'q';
      case 2:
        return 'w';
      case 3:
        return 'e';
      case 4:
        return 'r';
      default:
        return '';
    }
  };

  // Render each shot button
  const renderButton = (id, position) => {
    const classes = [];
    let showBall = false; // your snippet logic
    
    if (joinerQsValueAtLastIndex === position) {
      classes.push('active');
    }
    if (bgColorChanged && joinerQsValueAtLastIndex === position && !is_betting) {
      if (betResult === -1) {
        showBall = true; // your snippet logic
        classes.push('lose-bg');
      } else if (betResult === 0) {
        showBall = true; // your snippet logic
        classes.push('draw-bg');
      } else if (betResult === 1) {
        showBall = true; // your snippet logic
        classes.push('win-bg');
      }
    }

    if (is_betting) classes.push('disabled');
    return (
      <IconButton
        id={id}
        onClick={() => {
          onBtnBetClick(position);
          playSound('select');
        }}
        className={classes.join(' ')}
        style={{ position: 'relative' }}
        disabled={is_betting}
      >
        <span className="roll-tag">{getPositionLetter(position)}</span>
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
              height: '30px'
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

  // =============== Render ===============

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
        <div className="game-info-panel" style={{ position: 'relative' }}>
          {/* Example guesses panel */}
          <div className="guesses">
            <div>
              {prev_qs.map((item, index) => (
                <p key={index}>{item.qs}</p>
              ))}
            </div>
            <div>
              {players.length > 0 &&
                players.slice(0, 5).map((p, i) => (
                  <div key={i} style={{ opacity: '0.4', width: '29px', cursor: 'pointer' }}>
                    <a className="avatar" onClick={() => handleOpenPlayerModal(p._id)}>
                      <Avatar
                        className="avatar"
                        src={p.avatar}
                        rank={p.totalWagered}
                        username={p.username}
                        accessory={p.accessory}
                        alt=""
                        darkMode={isDarkMode}
                      />
                    </a>
                  </div>
                ))}
            </div>
          </div>

          {/* Second row of guesses if needed */}
          <div className="guesses">
            <div>
              {prev_qs.map((item, index) => (
                <p key={index}>{item.qs}</p>
              ))}
            </div>
            <div>
              {players.length > 0 &&
                players.slice(0, 5).map((p, i) => (
                  <div key={i} style={{ opacity: '0.4', width: '29px', cursor: 'pointer' }}>
                    <a className="avatar" onClick={() => handleOpenPlayerModal(p._id)}>
                      <Avatar
                        className="avatar"
                        src={p.avatar}
                        rank={p.totalWagered}
                        username={p.username}
                        accessory={p.accessory}
                        alt=""
                        darkMode={isDarkMode}
                      />
                    </a>
                  </div>
                ))}
            </div>
          </div>

          {status === 'open' ? (
            <>
              <Tooltip
                title={!isWatching ? 'CLICK TO STOP WATCHING' : 'CLICK TO START WATCHING'}
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
                  className={`rps-radio-host ${is_betting || betting ? 'blueish-hue' : ''}`}
                  style={{
                    top: '25px',
                    right: '25px',
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
                          &nbsp;<span className="desktop-only">thinking...</span>
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

                {!startedPlaying && (
                  <h3 className="game-sub-title roll-tag">
                    Choose WHERE TO SHOOT &nbsp;
                    <Tooltip
                      style={{ position: 'absolute', right: '20px', marginBottom: '30px' }}
                      title="Play against the AI; at the same time, train your AI."
                      placement="top"
                    >
                      <Info style={{ cursor: 'pointer', float: 'right' }} />
                    </Tooltip>
                  </h3>
                )}

                <div className="qs-image-panel">
                  <img
                    src={`/img/gametype/quick_shoot/gametype${qs_game_type}/type${qs_game_type}-${position_short_name[selected_qs_position]
                      }.png`}
                    alt=""
                    style={{
                      width: '600px',
                      maxWidth: '100%',
                      borderRadius: '10px',
                      border: `3px solid ${borderColor}`,
                      height: '238px'
                    }}
                  />

                  {result !== '' && (
                    <div id="cat-football">
                      <Lottie
                        options={{
                          loop: true,
                          autoplay: true,
                          animationData: football
                        }}
                        style={{ transform: 'translate(15px, 60px)', width: '100px' }}
                      />
                    </div>
                  )}
                  {result !== '' && <>{animation}</>}

                  {renderButtons()}
                </div>

                {creator_id && user_id && creator_id.toString() === user_id.toString() ? (
                  <div className="host-controls">
                    <Button
                      variant="outlined"
                      color='error'
                      onClick={handleBotClick}
                      className="hover-text-button"
                    >
                      <FontAwesomeIcon className="button-icon" icon={faRobot} />
                      <span className="button-text">&nbsp;CALL BOT? [{botsCount}]</span>
                    </Button>
                    {botsCount > 0 && (
                      <Button variant="outlined"
                      color='warning' onClick={bootBots} className="hover-text-button">
                        <FontAwesomeIcon className="button-icon" icon={faBan} />
                        <span className="button-text">&nbsp;KICK BOTS?</span>
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {is_mobile && (
                      <AiPanel
                        qsbetitems={props.qsbetitems}
                        updateUserStrategy={props.updateUserStrategy}
                        updateUserPrompt={props.updateUserPrompt}
                        strategies={strategies}
                        betting={betting}
                        is_betting={is_betting}
                        predictedBetAmount={predictedBetAmount}
                        roomId={roomInfo._id}
                        handleSwitchChange={handleSwitchChange}
                        game_type={roomInfo.game_type}
                        rank={rank}
                        user_id={user_id}
                        ai_mode={ai_mode}
                        user_balance={balance}
                        handleDetachAttachChange={props.handleDetachAttachChange}
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
  isFocused: state.auth.isFocused,
  isMusicEnabled: state.auth.isMusicEnabled
});

const mapDispatchToProps = {
  openGamePasswordModal,
  getRoomBotCount,
  getQsBetItems,
  updateRoomBot,
  kickBots,
  setSpectateMode
};

export default connect(mapStateToProps, mapDispatchToProps)(QuickShoot);
