import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { connect, useDispatch } from 'react-redux';
import Moment from 'moment';

import TabbedContent from '../../components/TabbedContent';
import { getRoomStatisticsData } from '../../redux/Customer/customer.action';
import { Button, Drawer, Box, Tabs, Tab } from '@mui/material';

import {
  toggleDrawer,
  updateTutorialCompleted,
} from '../../redux/Auth/user.actions';

import PreSummaryPanel from '../../components/PreSummaryPanel';
import CoHostModal from '../modal/CoHostModal';
import AiPanel from '../../components/AiPanel';
import RoomTokenDetails from '../../components/RoomTokenDetails';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { getRank } from '../../util/getRank';
import { convertToCurrency } from '../../util/conversion';

import {
  bet3,
  getRoomInfo,
  setCurRoomInfo,
  getGameTypeList,
  updateUserStrategy,
  updateUserPrompt,
  getRpsBetItems,
  getQsBetItems,
  getStrategies,
  updateAttachment,
  detachPlayerFromRoom,
  getAttachedRooms,
  addNewTransaction,
  pumpGame,
  getRoomList,
  getTransactionCandles,
} from '../../redux/Logic/logic.actions';
import {
  successMsgBar,
  errorMsgBar,
} from '../../redux/Notification/notification.actions';
import {
  predictNext,
  reinforcementAI,
  predictNextByGPT,
} from '../../util/predictNext';
import {
  predictNextQs,
  reinforcementAI_qs,
  predictQuickNextByGPT,
} from '../../util/predictNextQs';

import ChatPanel from '../ChatPanel/ChatPanel';
import MyGamesTable from '../MyGames/MyGamesTable';
import MyHistoryTable from '../MyGames/MyHistoryTable';
import HistoryTable from '../LiveGames/HistoryTable';
import DrawerButton from './DrawerButton';
import SupportButton from './SupportButton';
import Footer from './Footer';
import PlayerModal from '../modal/PlayerModal';

import {
  validateIsAuthenticated,
  validateCreatorId,
} from '../modal/betValidations';

function updateFromNow(history) {
  const result = JSON.parse(JSON.stringify(history));
  for (let i = 0; i < result.length; i++) {
    result[i]['from_now'] = Moment(result[i]['created_at']).fromNow();
  }
  return result;
}

function JoinGame(props) {
  const {
    // props from mapStateToProps
    auth,
    history: propsHistory,
    strategies,
    roomInfo,
    rpsbetitems,
    qsbetitems,
    user_id,
    total_wagered,
    rank: roomRank,
    user,
    creator_avatar,
    creator_accessory,
    username,
    accessory,
    connectedAccount,
    user_balance,
    ai_mode,
    isMuted,
    gameSounds,
    selectedMainTabIndex,
    isDrawerOpen,
    loading: propsLoading,
    isDarkMode,
    isLowGraphics,
    is_betting,
    attached,
    solPrice,
    // props from mapDispatchToProps
    toggleDrawer,
    updateTutorialCompleted,
    getRoomInfo: getRoomInfoAction,
    getStrategies,
    getTransactionCandles,
    bet3: bet3Action,
    updateAttachment,
    detachPlayerFromRoom,
    updateUserStrategy,
    updateUserPrompt,
    addNewTransaction,
    pumpGame: pumpGameAction,
    getRoomList: getRoomListAction,
    getRoomStatisticsData: getRoomStatisticsDataAction,
    getAttachedRooms,
    getGameTypeList,
    getRpsBetItems,
    getQsBetItems,
    openGamePasswordModal,

    match,
  } = props;

  // Check if on mobile
  const [is_mobile, setIsMobile] = useState(window.innerWidth < 1024);

  // State from original constructor
  const [actionList, setActionList] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [betting, setBetting] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [selectedMobileTab, setSelectedMobileTab] = useState('live_games');
  const [hosts, setHosts] = useState(roomInfo.hosts ?? []);

  const [localRoomInfo, setLocalRoomInfo] = useState(roomInfo);
  const [bankroll, setBankroll] = useState(roomInfo.bankroll);
  const [battles, setBattles] = useState(roomInfo.battles);

  const [selected_rps, setSelected_rps] = useState('');
  const [selected_qs_position, setSelected_qs_position] = useState(0);
  const [index, setIndex] = useState(0); // used in markov logic
  const [qs_game_type, setQsGameType] = useState(2);
  const [run, setRun] = useState(false);
  const [selected_id, setSelectedId] = useState('');
  const [image, setImage] = useState('');
  const [bgColorChanged, setBgColorChanged] = useState(false);
  const [borderColor, setBorderColor] = useState('');
  const [gameResult, setGameResult] = useState(-100);
  const [betResult, setBetResult] = useState(null);
  const [result, setResult] = useState(0);
  const [productName, setProductName] = useState('');
  const [coHostAmount, setCoHostAmount] = useState(0.01);
  const [intervalId, setIntervalId] = useState(null);
  const [isMax, setIsMax] = useState(false);
  const [bet_amount, setBetAmount] = useState(0.0005);
  const [predictedBetAmount, setPredictedBetAmount] = useState(0);
  const [componentHistory, setComponentHistory] = useState(
    updateFromNow(propsHistory),
  );
  const [loading, setLoading] = useState(propsLoading);

  // Audio references
  const soundsRef = useRef({
    win: new Audio('/sounds/win-sound.mp3'),
    split: new Audio('/sounds/split-sound.mp3'),
    lose: new Audio('/sounds/lose-sound.mp3'),
    start: new Audio('/sounds/start.mp3'),
    stop: new Audio('/sounds/stop.mp3'),
    select: new Audio('/sounds/select.mp3'),
    wrong: new Audio('/sounds/wrong.mp3'),
    correct: new Audio('/sounds/correct.mp3'),
    shine: new Audio('/sounds/shine.mp3'),
    ballKick: new Audio('/sounds/ball_kick.mp3'),
    grunt2: new Audio('/sounds/grunt2.mp3'),
    grunt: new Audio('/sounds/grunt.mp3'),
  });
  const [currentSound, setCurrentSound] = useState(null);
  const dispatch = useDispatch();
  const isMountedRef = useRef(true);
  const rpsbetitemsRef = useRef(rpsbetitems);
  const qsbetitemsRef = useRef(qsbetitems);

  // Replaces: componentDidMount
  useEffect(() => {
    isMountedRef.current = true;

    const init = async () => {
      try {
        const { id } = match.params;

        // ------------------ FETCH CANDL
        await getTransactionCandles({ roomId: id, timeFrame: '1m' });
        await initializeRoomData();
      } catch (error) {
        console.error('Error in init useEffect:', error);
      }
    };

    init();
    // event listener for unload => handleUnload
    window.addEventListener('unload', handleUnload);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('unload', handleUnload);
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    rpsbetitemsRef.current = rpsbetitems;
  }, [rpsbetitems]);
  useEffect(() => {
    qsbetitemsRef.current = qsbetitems;
  }, [qsbetitems]);
  // Replaces some logic from componentDidUpdate
  // 1) If user changes & we haven't fetched qBot yet => set run
  useEffect(() => {
    if (user && !run) {
      // if user not done tutorial #2 => set run
      setRun(!user.completedTutorials?.includes(2));
    }
  }, [user, run]);

  // 2) If roomInfo changes => update bankroll, qBot status, etc.
  useEffect(() => {
    setLocalRoomInfo(roomInfo);
    setBankroll(roomInfo.user_bet);
    const gameType = roomInfo.game_type;
    if (gameType === 'Quick Shoot') {
      getQsBetItems(roomInfo._id);
    } else {
      getRpsBetItems(roomInfo._id);
    }
    if (isMountedRef.current && attached) {
      setBetting(true);
      // isQbot => not explicitly stored in original state?
      // We'll store it if we want to replicate that logic.
    }
  }, [roomInfo]);

  // 3) If user_balance changes & gameResult != -1 & isMax => handleMaxButtonClick
  useEffect(() => {
    if (gameResult !== -1 && isMax) {
      handleMaxButtonClick();
    }
  }, [user_balance]);

  // Replaces: getDerivedStateFromProps
  // If `propsHistory` changes or is empty => update our local state `componentHistory`
  useEffect(() => {
    if (
      componentHistory?.length === 0 ||
      (propsHistory &&
        componentHistory[0] &&
        propsHistory[0] &&
        componentHistory[0]['created_at'] !== propsHistory[0]['created_at'])
    ) {
      setComponentHistory(updateFromNow(propsHistory));
    }
    // Also if localRoomInfo changes
    if (localRoomInfo._id !== roomInfo._id) {
      setLocalRoomInfo(roomInfo);
      setBankroll(roomInfo.user_bet);
      setBattles(roomInfo.battles);
      setHosts(roomInfo.hosts);
    }
  }, [propsHistory, roomInfo]);

  // keep local loading in sync with propsLoading
  useEffect(() => {
    setLoading(propsLoading);
  }, [propsLoading]);

  // ---------- LIFECYCLE METHODS (Converted) ----------
  const initializeRoomData = async () => {
    try {
      await Promise.all([
        loadSounds(),
        getStrategies(),
        getRoomInfoAction(match.params.id, 10),
      ]);
      // Done: The room data, bet items, sounds, and strategies are all loaded
    } catch (error) {
      console.error('Error initializing room data:', error);
    }
  };

  // ---------- EVENT HANDLERS / HELPER FUNCTIONS ----------
  const toggleDrawerHandler = useCallback(() => {
    toggleDrawer(!isDrawerOpen);
  }, [toggleDrawer, isDrawerOpen]);

  // Replacing "join" => manual bet
  const join = useCallback(
    async (betInfo) => {
      return await bet3Action({
        _id: roomInfo._id,
        user: user_id,
        game_type: roomInfo.game_type,
        ...betInfo,
      });
    },
    [bet3Action, roomInfo, user_id],
  );

  // Replacing "join2" => auto bet
  const join2 = useCallback(
    async (betInfo) => {
      return await bet3Action({
        _id: localRoomInfo._id,
        user: user_id,
        game_type: localRoomInfo.game_type,
        ...betInfo,
      });
    },
    [bet3Action, localRoomInfo, user_id],
  );

  const playSound = useCallback(
    (soundKey) => {
      // Only play if user not muted
      if (!isMuted || !gameSounds) {
        const audio = soundsRef.current[soundKey];
        if (audio && audio.paused !== undefined) {
          if (!audio.paused) {
            return;
          }
          audio.currentTime = 0;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.log(`Error playing sound "${soundKey}":`, error);
            });
          }
          setCurrentSound(audio);
        }
      }
    },
    [isMuted, gameSounds],
  );

  // ---------- AI-Related Predict Logic ----------
  function predictNextBetAmount(risk, user_range, user_balance, bankroll) {
    // 1) If risk=1 => random bet in [0.0005..0.001]
    if (risk === 1) {
      const minFixed = 0.0005;
      const maxFixed = 0.001;
      const randomBet = minFixed + Math.random() * (maxFixed - minFixed);
      return parseFloat(randomBet.toFixed(6));
    }

    // 2) If no user_range, use [0.0005 .. user_balance or 0.1]
    if (!user_range) {
      // If user_balance is falsy => fallback to 0.1
      const upperBound = user_balance && user_balance > 0 ? user_balance : 0.1;
      user_range = [0.0005, upperBound];
    }

    // 3) Decide final minVal/maxVal
    //    - At least 0.0005
    //    - No more than user_balance
    //    - Also check bankroll if provided
    const minVal = Math.max(user_range[0], 0.0005);
    let maxVal = user_range[1];

    // If user_balance is defined => clamp maxVal
    if (typeof user_balance === 'number') {
      maxVal = Math.min(maxVal, user_balance);
    }
    // Also clamp by bankroll if defined
    if (typeof bankroll === 'number') {
      maxVal = Math.min(maxVal, bankroll);
    }

    // If invalid data => fallback to minVal
    if (isNaN(minVal) || isNaN(maxVal) || maxVal < minVal) {
      return minVal;
    }

    // 4) Risk-based logic
    let lowerFrac, upperFrac;
    switch (risk) {
      case 2:
        // "Low" portion of range
        lowerFrac = 0.025;
        upperFrac = 0.2;
        break;
      case 3:
        // "Medium" portion
        lowerFrac = 0.2;
        upperFrac = 0.4;
        break;
      case 4:
        // "High" portion
        lowerFrac = 0.4;
        upperFrac = 1.0;
        break;
      default:
        // Full range
        lowerFrac = 0;
        upperFrac = 1;
        break;
    }

    // 5) Calculate numeric sub-range
    const range = maxVal - minVal;
    const chosenMin = minVal + range * lowerFrac;
    const chosenMax = minVal + range * upperFrac;

    // 6) Pick a random value in [chosenMin..chosenMax]
    const randomBet = chosenMin + Math.random() * (chosenMax - chosenMin);
    // 7) Round to 6 decimals
    return parseFloat(randomBet.toFixed(6));
  }

  const changeBgColor = useCallback(async (resultVal) => {
    setBetResult(resultVal);
    const flickerCount = 3;
    const delay = 50;

    for (let i = 0; i < flickerCount; i++) {
      setBgColorChanged(i % 2 === 0);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    setBgColorChanged(false);
    setBetResult(null);
  }, []);

  const changeBgColorQs = useCallback(
    async (resultVal) => {
      setBetResult(resultVal);
      setBgColorChanged(true);

      let newBorderColor = '';
      let defaultColor =
        roomInfo.game_type === 'Mystery Box' ? '#ffd000' : 'grey';

      switch (resultVal) {
        case 1:
          newBorderColor = '#49ff08';
          break;
        case -1:
          newBorderColor = '#ffd000';
          break;
        default:
          newBorderColor = defaultColor;
          break;
      }
      setBorderColor(newBorderColor);

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setBorderColor('');
      setBgColorChanged(false);
      setBetResult(null);
    },
    [roomInfo],
  );
  // Example Refactored joinGame2
  const joinGame2 = useCallback(
    async (randomItem, bet_amount) => {
      const { game_type: gameType, _id: roomId, status: status } = roomInfo;
      // 1) Early exits for basic conditions
      // 2) Extract room info & determine game type
      if (roomInfo.status !== 'open') return;
      const isQuickShoot = gameType === 'Quick Shoot';
      const isRps = gameType === 'RPS';

      // Update local states before async call
      setSelected_rps(randomItem);
      setSelected_qs_position(randomItem);
      setPredictedBetAmount(bet_amount || 0);

      try {
        // 4) Build payload & call `join2`
        let joinResult = null;
        const payload = { bet_amount };
        if (isRps) {
          payload.selected_rps = randomItem;
          joinResult = await join2(payload);
        } else if (isQuickShoot) {
          payload.selected_qs_position = randomItem;
          joinResult = await join2(payload);

          // Play special SFX for Quick Shoot if success
          if (joinResult?.status === 'success' && !isMuted) {
            playSound('ballKick');
          }
        }

        // 5) If join was not successful, stop
        if (!joinResult || joinResult.status !== 'success') return;

        // 7) Handle bet result
        const { betResult, amount } = joinResult;
        const absAmount = Math.abs(amount);
        const currencyElement = convertToCurrency(absAmount, solPrice);

        // Helper to set UI state after the bet result
        const handleBetResult = (result) => {
          if (isQuickShoot) {
            changeBgColorQs(result);
          } else {
            changeBgColor(result);
          }
        };

        switch (betResult) {
          case 1: // Win
            playSound('win');
            handleBetResult(1);
            setResult(
              <span style={{ color: '#7ed321' }}>+ {currencyElement}</span>,
            );
            setGameResult(1);
            break;

          case 0: // Tie
            playSound('split');
            handleBetResult(0);
            setResult(
              <span style={{ color: 'grey' }}>- {currencyElement}</span>,
            );
            setGameResult(0);
            break;

          default: // Lose
            playSound('lose');
            handleBetResult(-1);
            setResult(
              <span style={{ color: '#f50000' }}>- {currencyElement}</span>,
            );
            setGameResult(-1);

            // For Quick Shoot, refresh the QS bet items
            if (isQuickShoot) {
              await getQsBetItems(roomId);
            }
            break;
        }

        // 8) Refresh RPS items if game is RPS
        if (isRps) {
          await getRpsBetItems(roomId);
        }
      } catch (error) {
        console.error('Error in joinGame2:', error);
      }
    },
    [
      betting,
      roomInfo,
      selected_rps,
      selected_qs_position,
      solPrice,
      isMuted,
      join2,
      playSound,
      changeBgColor,
      changeBgColorQs,
      setSelected_rps,
      setSelected_qs_position,
      setPredictedBetAmount,
      setResult,
      setGameResult,
      getRpsBetItems,
      getQsBetItems,
    ],
  );

  async function getNextAIMove(aiMode, gameType, dataRef, qsGameType, roomId) {
    const isQuickShoot = gameType === 'Quick Shoot';

    // if (!dataRef.current || dataRef.current.length === 0) {
    //   return { move: null, risk: 1 };
    // }

    if (isQuickShoot) {
      if (aiMode === 'Adam') {
        return await reinforcementAI_qs(dataRef.current, qsGameType);
      } else if (aiMode === 'Markov') {
        return await predictNextQs(dataRef.current, qsGameType);
      } else if (aiMode === 'GPT3') {
        return await predictQuickNextByGPT(roomId, qsGameType, user_id);
      }
    } else {
      // RPS logic
      if (aiMode === 'Adam') {
        return await reinforcementAI(dataRef.current);
      } else if (aiMode === 'Markov') {
        return await predictNext(dataRef.current, true);
      } else if (aiMode === 'GPT3') {
        return await predictNextByGPT(roomId, user_id);
      }
    }

    // fallback if none matched
    return { move: null, risk: 1 };
  }

  const startBetting = useCallback(() => {
    const executeBetting = async () => {
      const {
        game_type: gameType,
        _id: roomId,
        qs_game_type,
        is_private,
      } = roomInfo;

      try {
        let randomItem;
        let nextBetAmount;

        const isQuickShoot = gameType === 'Quick Shoot';
        const dataRef = isQuickShoot ? qsbetitemsRef : rpsbetitemsRef;

        // Get the next AI move + risk
        const nextMove = await getNextAIMove(
          ai_mode,
          gameType,
          dataRef,
          qs_game_type,
          roomId,
        );

        if (nextMove.move !== null) {
          randomItem = nextMove.move;
          nextBetAmount = await predictNextBetAmount(nextMove.risk);
        }

        const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
        const passwordCorrect = rooms[roomId];
        if (is_private && !passwordCorrect) {
          openGamePasswordModal();
        } else {
          await joinGame2(randomItem, nextBetAmount);
        }

        const delay = ai_mode === 'Adam' || ai_mode === 'GPT3' ? 6000 : 3300;

        const timerId = setTimeout(executeBetting, delay);
        setIntervalId(timerId);
      } catch (error) {
        console.error('Error in betting process:', error);
      }
    };

    executeBetting();
  }, [
    ai_mode,
    roomInfo,
    qsbetitemsRef,
    rpsbetitemsRef,
    openGamePasswordModal,
    joinGame2,
    predictNextBetAmount,
    getNextAIMove,
  ]);

  const stopBetting = useCallback(() => {
    try {
      clearTimeout(intervalId);
      setIntervalId(null);
      setBetting(false);
    } catch (error) {
      console.error('Error stopping betting:', error);
    }
  }, [intervalId, attached, playSound, roomInfo]);

  useEffect(() => {
    return () => {
      if (betting) {
        stopBetting();
      }
    };
  }, []);

  const loadSounds = useCallback(async () => {
    const soundObjects = soundsRef.current;
    // Just ensure .load() is called; many browsers do lazy loading anyway
    await Promise.all(Object.values(soundObjects).map((snd) => snd.load()));
  }, []);

  const stopAllSounds = useCallback(() => {
    if (currentSound) {
      currentSound.pause();
      currentSound.currentTime = 0;
      setCurrentSound(null);
    }
  }, [currentSound]);

  const handleUnload = useCallback(() => {
    stopBetting();
    stopAllSounds();
  }, []);

  // ---------- Betting Loop ----------
  const handleSwitchChange = useCallback(() => {
    if (!validateIsAuthenticated(auth, isDarkMode)) return;
    if (!validateCreatorId(roomInfo.creator_id, user_id, isDarkMode)) return;

    // Toggle logic
    if (!betting) {
      // We are not betting; start now

      setBetting(true);
      startBetting();
      dispatch(successMsgBar('Turn on Isocratic mode'));
    } else {
      setBetting(false);
      stopBetting();
      dispatch(successMsgBar('Turn off Isocratic mode'));
    }
  }, [
    auth,
    isDarkMode,
    roomInfo,
    user_id,
    betting,
    playSound,
    validateIsAuthenticated,
    validateCreatorId,
    startBetting,
    stopBetting,
  ]);

  const handleOpenPlayerModal = useCallback((creator_id) => {
    setShowPlayerModal(true);
    setSelectedCreator(creator_id);
  }, []);

  const handleClosePlayerModal = useCallback(() => {
    setShowPlayerModal(false);
  }, []);

  const handleCoHostAmountChange = useCallback((event) => {
    setCoHostAmount(event.target.value);
  }, []);

  const handleSendCoHost = useCallback(async () => {
    if (coHostAmount <= 0) {
      dispatch(errorMsgBar('R U FURR-REAL? AMOUNT MUST BE MORE THAN 0!'));
      return;
    }
    if (coHostAmount > user_balance) {
      dispatch(errorMsgBar('NOT ENUFF FUNDS AT THIS MEOWMENT'));
      return;
    }

    try {
      const result = await pumpGameAction(
        coHostAmount,
        roomInfo._id,
        connectedAccount,
      );
      if (result.success) {
        addNewTransaction(result.newTransaction);
        await getRoomListAction({
          game_type: roomInfo.game_type,
        });
      } else {
        dispatch(errorMsgBar(result.message));
      }
    } catch (error) {
      dispatch(errorMsgBar('ROOM TOO BUSY, TRY AGAIN LATER'));
    }
  }, [
    coHostAmount,
    user_balance,
    isDarkMode,
    roomInfo,
    pumpGameAction,
    addNewTransaction,
    getRoomListAction,
  ]);

  const onChangeState = useCallback((newState) => {
    // For instance, if `bankroll` is included in newState:
    if ('bankroll' in newState) {
      setBankroll(newState.bankroll);
    }
    if ('hosts' in newState && Array.isArray(newState.hosts)) {
      setHosts(newState.hosts);
    }
    if ('result' in newState) {
      setResult(newState.result);
    }
    if ('bet_amount' in newState) {
      setBetAmount(newState.bet_amount);
    }
    if ('battles' in newState) {
      setBattles((prevBattles) => prevBattles + newState.battles);
    }
  }, []);

  const handleHalfXButtonClick = useCallback(() => {
    const multipliedBetAmount = bet_amount * 0.5;
    setBetAmount(multipliedBetAmount);
    setIsMax(false);
  }, [bet_amount]);

  const handle2xButtonClick = useCallback(() => {
    const maxBetAmount = user_balance;
    const multipliedBetAmount = bet_amount * 2;
    const limitedBetAmount = Math.min(multipliedBetAmount, maxBetAmount);

    setBetAmount(limitedBetAmount);
    setIsMax(false);
  }, [bet_amount, user_balance]);

  const handleMaxButtonClick = useCallback(() => {
    const maxBetAmount = Math.min(user_balance, bankroll);
    setBetAmount(maxBetAmount);
    setIsMax(true);
  }, [user_balance, bankroll]);

  // ---------- RENDER ----------
  const gameTypeList = []; // not explicitly in state, but you can fetch it
  const payoutPercentage = useMemo(() => {
    if (isNaN((bankroll / roomInfo.endgame_amount) * 100)) return 0;
    return Math.ceil((bankroll / roomInfo.endgame_amount) * 100);
  }, [bankroll, roomInfo]);

  const isLowBankroll = bankroll <= 0.01;
  const isHighCommission = roomInfo.tax > 16;
  const isLowProfit = roomInfo.host_pr - roomInfo.total_stakes > 0;
  const hostProfit = parseFloat(roomInfo.host_pr) || 0;
  const totalStakes = parseFloat(roomInfo?.total_stakes) || 0;
  const winChance =
    roomInfo.game_type === 'Quick Shoot'
      ? (((roomInfo.qs_game_type - 1) / roomInfo.qs_game_type) * 100).toFixed(2)
      : 33;

  const maxBankroll = roomInfo.endgame_amount;
  const progressPercentage = Math.min(
    (bankroll / maxBankroll) * 100,
    100,
  ).toFixed(2);
  return (
    <Box
      className="main-game join"
      sx={{
        display: 'grid',
        gridTemplateColumns: is_mobile ? '100%' : 'calc(100% - 360px) 350px',
        gap: '8px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {is_mobile && selectedMobileTab === 'chat' && (
        <Drawer
          className="mat-chat"
          style={{ display: isDrawerOpen ? 'flex' : 'none' }}
          variant="persistent"
          anchor="left"
          open={isDrawerOpen}
        >
          <ChatPanel />
        </Drawer>
      )}

      {showPlayerModal && (
        <PlayerModal
          modalIsOpen={showPlayerModal}
          closeModal={handleClosePlayerModal}
          selectedCreator={selectedCreator}
        />
      )}
      {/* MAIN PANEL */}
      <Box className="main-panel" sx={{ margin: '8px' }}>
        {/* PreSummaryPanel */}
        <PreSummaryPanel
          status={roomInfo.status}
          bankroll={bankroll}
          isDarkMode={isDarkMode}
          solPrice={solPrice}
          isQbot={false}
          winChance={winChance}
          payoutPercentage={payoutPercentage}
          roomInfo={roomInfo}
          handleOpenPlayerModal={handleOpenPlayerModal}
          creator_id={roomInfo.creator_id}
          creator_avatar={creator_avatar}
          username={username}
          rank={roomRank}
          battles={battles}
          accessory={creator_accessory}
          rps_game_type={roomInfo.rps_game_type}
          qs_game_type={roomInfo.qs_game_type}
          pr={roomInfo.pr}
          isLowBankroll={isLowBankroll}
          isHighCommission={isHighCommission}
          isLowProfit={isLowProfit}
          hostProfit={hostProfit}
          totalStakes={totalStakes}
          bet_amount={bet_amount}
        />

        {/* TabbedContent */}
        <TabbedContent
          changeBgColor={changeBgColor}
          changeBgColorQs={changeBgColorQs}
          bgColorChanged={bgColorChanged}
          betting={betting}
          connectedAccount={connectedAccount}
          strategies={strategies}
          result={result}
          detachPlayerFromRoom={detachPlayerFromRoom}
          updateAttachment={updateAttachment}
          solPrice={solPrice}
          handle2xButtonClick={handle2xButtonClick}
          handleHalfXButtonClick={handleHalfXButtonClick}
          handleMaxButtonClick={handleMaxButtonClick}
          ai_mode={ai_mode}
          getAttachedRooms={getAttachedRooms}
          onChangeState={onChangeState}
          bet_amount={bet_amount}
          is_mobile={is_mobile}
          gameResult={gameResult}
          rpsbetitems={rpsbetitems}
          attached={attached}
          run={run}
          updateSelectedRps={(selection, callback) => {
            setSelected_rps(selection);
            if (callback) callback();
          }}
          selected_rps={selected_rps}
          handleJoyrideCallback={(data) => {
            const { status, type } = data;
            if (status === 'finished' || status === 'skipped') {
              updateTutorialCompleted(2);
              setRun(false);
            }
          }}
          playSound={playSound}
          join={join}
          handleSwitchChange={handleSwitchChange}
          betResult={betResult}
          roomInfo={roomInfo}
          rps_game_type={roomInfo.rps_game_type}
          user_id={user_id}
          rank={getRank(total_wagered)}
          handleOpenPlayerModal={handleOpenPlayerModal}
          handleClosePlayerModal={handleClosePlayerModal}
          selectedCreator={selectedCreator}
          showPlayerModal={showPlayerModal}
          creator_id={roomInfo.creator_id}
          pr={roomInfo.pr}
          updateUserStrategy={updateUserStrategy}
          updateUserPrompt={updateUserPrompt}
          bankroll={bankroll}
          predictedBetAmount={predictedBetAmount}
          is_private={roomInfo.is_private}
          isDarkMode={isDarkMode}
          actionList={actionList}
          getRoomData={() => {}} // or remove if not needed
          user={user}
          coHostAmount={coHostAmount}
          getRoomInfo={getRoomInfoAction}
          balance={user_balance}
          isLowGraphics={isLowGraphics}
          handleCoHostAmountChange={handleCoHostAmountChange}
          handleSendCoHost={handleSendCoHost}
          has_joined={true}
          borderColor={borderColor}
          updateSelectedQs={(position, callback) => {
            setSelected_qs_position(position);
            if (callback) callback();
          }}
          qsbetitems={qsbetitems}
          qs_game_type={roomInfo.qs_game_type}
          selected_qs_position={selected_qs_position}
        />

        <div>
          {/* MyGamesTable / HistoryTable / MyHistoryTable based on your conditions */}
          {/* Example logic: */}
          {!is_mobile && selectedMainTabIndex === 1 && (
            <MyGamesTable gameTypeList={gameTypeList} />
          )}

          {/* {is_mobile && selectedMobileTab === 'my_games' && <MyHistoryTable />} */}
        </div>
      </Box>

      {/* SUB PANEL */}
      <Box className="sub-panel">
        {/* AiPanel & CoHostModal & RoomTokenDetails, etc. */}
        {!is_mobile && selectedMainTabIndex === 0 && (
          <Box>
            {/* <AiPanel
              rpsbetitems={rpsbetitems}
              qsbetitems={qsbetitems}
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
              rank={getRank(total_wagered)}
              qs_game_type={roomInfo.qs_game_type}
              user_id={user_id}
              ai_mode={ai_mode}
              user_balance={user_balance}
              isDarkMode={isDarkMode}
            /> */}
            <CoHostModal
              isDarkMode={isDarkMode}
              coHostAmount={coHostAmount}
              selectedRow={roomInfo}
              hosts={hosts}
              connectedAccount={connectedAccount}
              balance={user_balance}
              solPrice={solPrice}
              user={user}
              togglePopup={() => {}}
              handleClose={() => {}}
              handleSendCoHost={handleSendCoHost}
              handleCoHostAmountChange={handleCoHostAmountChange}
              has_joined={true}
              input_only={true}
            />

            <RoomTokenDetails
              solPrice={solPrice}
              hosts={hosts}
              progressPercentage={progressPercentage}
              handleOpenPlayerModal={handleOpenPlayerModal}
              roomInfo={roomInfo}
            />
          </Box>
        )}

        <DrawerButton open={isDrawerOpen} toggleDrawer={toggleDrawerHandler} />
        {/* <SupportButton open={props.isSupportOpen} /> */}

        {/* {!is_mobile && selectedMainTabIndex === 1 && <MyHistoryTable />} */}
      </Box>

      {!is_mobile && (
        <div className="mobile-only main-page-nav-button-group">
          <Button
            className={`mobile-tab-live ${selectedMobileTab === 'live_games' ? 'active' : ''}`}
            onClick={() => setSelectedMobileTab('live_games')}
          >
            LIVE GAMES
          </Button>
          <Button
            className={`mobile-tab-my ${selectedMobileTab === 'my_games' ? 'active' : ''}`}
            onClick={() => setSelectedMobileTab('my_games')}
          >
            YOUR GAMES
          </Button>
          <Button
            className={`mobile-tab-marketplace ${selectedMobileTab === 'marketplace' ? 'active' : ''}`}
            onClick={() => setSelectedMobileTab('marketplace')}
          >
            MARKETPLACE
          </Button>
          <Button
            className={`mobile-tab-chat ${selectedMobileTab === 'chat' ? 'active' : ''}`}
            onClick={() => setSelectedMobileTab('chat')}
          >
            CHAT
          </Button>
        </div>
      )}

      <Footer className="footer" open={isDrawerOpen} />
    </Box>
  );
}

// ------------------ REDUX CONNECT ------------------
const mapStateToProps = (state) => ({
  auth: state.auth.isAuthenticated,
  history: state.logic.history,
  strategies: state.logic.strategies,
  roomInfo: state.logic.curRoomInfo,
  rpsbetitems: state.logic.rpsbetitems,
  qsbetitems: state.logic.qsbetitems,
  user_id: state.auth.user._id,
  user_range: state.auth.user.range,
  total_wagered: state.auth.user.totalWagered,
  rank: state.logic.curRoomInfo.rank,
  user: state.auth.user,
  connectedAccount: state.auth.connectedAccount,
  creator_avatar: state.logic.curRoomInfo.creator_avatar,
  creator_accessory: state.logic.curRoomInfo.accessory,
  username: state.logic.curRoomInfo.username,
  accessory: state.auth.user.accessory,
  user_balance: state.auth.user.balance,
  ai_mode: state.auth.user.ai_mode,
  isMuted: state.auth.isMuted,
  gameSounds: state.auth.gameSounds,
  selectedMainTabIndex: state.logic.selectedMainTabIndex,
  isDrawerOpen: state.auth.isDrawerOpen,
  loading: state.logic.isActiveLoadingOverlay,
  isDarkMode: state.auth.isDarkMode,
  isLowGraphics: state.auth.isLowGraphics,
  is_betting: state.logic.is_betting,
  attached: state.logic.attached,
  solPrice: state.logic.solPrice,
});

const mapDispatchToProps = {
  getRoomInfo,
  getStrategies,
  bet3,
  setCurRoomInfo,
  detachPlayerFromRoom,
  updateAttachment,
  updateUserStrategy,
  updateUserPrompt,
  addNewTransaction,
  pumpGame,
  getRoomList,
  getRoomStatisticsData,
  getAttachedRooms,
  toggleDrawer,
  getGameTypeList,
  getRpsBetItems,
  getQsBetItems,
  openGamePasswordModal,
  getTransactionCandles,
  updateTutorialCompleted,
};

export default connect(mapStateToProps, mapDispatchToProps)(JoinGame);
