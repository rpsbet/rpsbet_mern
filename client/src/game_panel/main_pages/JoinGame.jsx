import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo
} from 'react';
import { connect } from 'react-redux';
import Moment from 'moment';

import TabbedContent from '../../components/TabbedContent';
import { getRoomStatisticsData } from '../../redux/Customer/customer.action';
import {
  Button,
  Drawer,
  Box,
  Tabs,
  Tab
} from '@mui/material';

import {
  toggleDrawer,
  updateTutorialCompleted,
  setBalance
} from '../../redux/Auth/user.actions';

import PreSummaryPanel from '../../components/PreSummaryPanel';
import CoHostModal from '../modal/CoHostModal';
import AiPanel from '../../components/AiPanel';
import RoomTokenDetails from '../../components/RoomTokenDetails';
import { openGamePasswordModal } from '../../redux/Notification/notification.actions';
import { getCustomerStatisticsData } from '../../redux/Customer/customer.action';
import { getRank } from '../../util/getRank';
import { convertToCurrency } from '../../util/conversion';

import {
  bet,
  bet2,
  bet3,
  getRoomInfo,
  setCurRoomInfo,
  loadRoomInfo,
  fetchAccessory,
  getGameTypeList,
  updateUserStrategy,
  getRpsBetItems,
  getQsBetItems,
  getStrategies,
  attachPlayerToRoom,
  detachPlayerFromRoom,
  checkPlayerAttachment,
  getAttachedRooms,
  addNewTransaction,
  coHost,
  getRoomList,
  getSolToUsdPrice
} from '../../redux/Logic/logic.actions';

import { predictNext, reinforcementAI } from '../../util/predictNext';
import { predictNextQs, reinforcementAI_qs } from '../../util/predictNextQs';

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
  validateCreatorId
} from '../modal/betValidations';
import { alertModal } from '../modal/ConfirmAlerts';

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
    setBalance,
    getRoomInfo: getRoomInfoAction,
    getStrategies,
    bet: betAction,
    bet2: bet2Action,
    bet3: bet3Action,
    setCurRoomInfo,
    loadRoomInfo: loadRoomInfoAction,
    detachPlayerFromRoom,
    attachPlayerToRoom,
    checkPlayerAttachment,
    updateUserStrategy,
    addNewTransaction,
    coHost: coHostAction,
    getRoomList: getRoomListAction,
    getRoomStatisticsData: getRoomStatisticsDataAction,
    getAttachedRooms,
    getGameTypeList,
    getRpsBetItems: getRpsBetItemsAction,
    getQsBetItems: getQsBetItemsAction,
    openGamePasswordModal,
    getCustomerStatisticsData: getCustomerStatisticsDataAction,
    fetchAccessory: fetchAccessoryAction,
    getSolToUsdPrice,
    match
  } = props;

  // Check if on mobile
  const [is_mobile, setIsMobile] = useState(window.innerWidth < 1024);

  // State from original constructor
  const [actionList, setActionList] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [betting, setBetting] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [selectedMobileTab, setSelectedMobileTab] = useState('live_games');

  const [localRoomInfo, setLocalRoomInfo] = useState(roomInfo);
  const [bankroll, setBankroll] = useState(roomInfo.bankroll);
  const [limit, setLimit] = useState(10);

  const [cp, setCp] = useState(0);
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
  const [coHostAmount, setCoHostAmount] = useState(0.1);
  const [intervalId, setIntervalId] = useState(null);
  const [isMax, setIsMax] = useState(false);
  const [bet_amount, setBetAmount] = useState(0.0005);
  const [predictedBetAmount, setPredictedBetAmount] = useState(0);
  const [componentHistory, setComponentHistory] = useState(
    updateFromNow(propsHistory)
  );
  const [showAnimation, setShowAnimation] = useState(false);
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
    grunt: new Audio('/sounds/grunt.mp3')
  });
  const [currentSound, setCurrentSound] = useState(null);

  const isMountedRef = useRef(true);

  // Replaces: componentDidMount
  useEffect(() => {
    isMountedRef.current = true;

    const init = async () => {
      try {
        const { id } = match.params;

        // 1) load room data
        await initializeRoomData(id);
        // 2) fetch accessory
        await fetchAccessory();
        // 3) check player attachment
        await checkPlayerAttachment(id);
        // 4) get SOL price if not loaded
        if (!solPrice) {
          await getSolToUsdPrice();
        }
      } catch (error) {
        console.error('Error in init useEffect:', error);
      }
    };

    init();

    // event listener for unload => handleUnload
    window.addEventListener('unload', handleUnload);

    return () => {
      // cleanup
      isMountedRef.current = false;
      window.removeEventListener('unload', handleUnload);
      stopAllSounds();
      clearInterval(intervalId);
    };
  }, []);

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
    }
  }, [propsHistory, roomInfo]);

  // keep local loading in sync with propsLoading
  useEffect(() => {
    setLoading(propsLoading);
  }, [propsLoading]);

  // ---------- LIFECYCLE METHODS (Converted) ----------
  const initializeRoomData = async (id) => {
    try {
      await Promise.all([
        getRpsBetItemsAction(id),
        getQsBetItemsAction(id),
        loadSounds(),
        getStrategies(),
        getRoomInfoAction(match.params.id, limit, true)
      ]);
    } catch (error) {
      console.error('Error initializing room data:', error);
    }
  };

  const handleUnload = useCallback(() => {
    stopAllSounds();
  }, []);

  const loadSounds = useCallback(async () => {
    const soundObjects = soundsRef.current;
    // Just ensure .load() is called; many browsers do lazy loading anyway
    await Promise.all(
      Object.values(soundObjects).map((snd) => snd.load())
    );
  }, []);

  const stopAllSounds = useCallback(() => {
    if (currentSound) {
      currentSound.pause();
      currentSound.currentTime = 0;
      setCurrentSound(null);
    }
  }, [currentSound]);

  // ---------- EVENT HANDLERS / HELPER FUNCTIONS ----------
  const toggleDrawerHandler = useCallback(() => {
    toggleDrawer(!isDrawerOpen);
  }, [toggleDrawer, isDrawerOpen]);

  const fetchAccessory = useCallback(async () => {
    try {
      const creatorId = roomInfo.creator_id;
      if (!creatorId) return;

      const _id = creatorId.toString();
      const accessoryData = await fetchAccessoryAction({ _id });
      const dp = await fetchAccessoryAction({ _id: user_id });

      if (isMountedRef.current && accessoryData.accessory?.CP !== undefined) {
        setCp(accessoryData.accessory.CP - dp.accessory.DP);
      }
    } catch (error) {
      console.error('Error fetching accessory:', error);
    }
  }, [roomInfo.creator_id, user_id, fetchAccessoryAction]);

  // Replacing "join" => manual bet
  const join = useCallback(async (betInfo) => {
    return await bet3Action({
      _id: roomInfo._id,
      user: user_id,
      game_type: roomInfo.game_type,
      ...betInfo
    });
  }, [bet3Action, roomInfo, user_id]);

  // Replacing "join2" => auto bet
  const join2 = useCallback(async (betInfo) => {
    return await bet2Action({
      _id: localRoomInfo._id,
      user: user_id,
      game_type: localRoomInfo.game_type,
      ...betInfo
    });
  }, [bet2Action, localRoomInfo, user_id]);

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
    [isMuted, gameSounds]
  );

  const handleDetachAttachChange = useCallback(() => {
    const gameType = roomInfo.game_type;
    const items = gameType === 'Quick Shoot' ? qsbetitems : rpsbetitems;

    if (!Array.isArray(items)) {
      console.error('Items is not an array:', items);
      return;
    }

    const uniqueBetAmounts = [...new Set(items.map((item) => item.bet_amount))];

    if (attached) {
      // Detach
      detachPlayerFromRoom(roomInfo._id)
        .then((result) => {
          if (result) {
            // If successfully detached, restart betting
            startBetting(uniqueBetAmounts);
            checkPlayerAttachment(roomInfo._id);
          }
        })
        .catch((error) => console.error('Error detaching player:', error));
    } else {
      // Attach
      attachPlayerToRoom(roomInfo._id, uniqueBetAmounts)
        .then(() => {
          clearInterval(intervalId);
          setIntervalId(null);
        })
        .catch((error) => console.error('Error attaching player:', error));
    }
  }, [
    attached,
    roomInfo,
    qsbetitems,
    rpsbetitems,
    detachPlayerFromRoom,
    attachPlayerToRoom,
    intervalId,
    checkPlayerAttachment
  ]);

  // ---------- AI-Related Predict Logic ----------
  const createTransitionMatrix = useCallback((betArray, smoothingFactor = 0.01, decayFactor = 0.9) => {
    const transitionMatrix = {};
    const betArrayLength = betArray.length;

    for (let i = 0; i < betArrayLength - 1; i++) {
      const currentBet = betArray[i];
      const nextBet = betArray[i + 1];
      const distance = betArrayLength - i;

      if (!transitionMatrix[currentBet]) {
        transitionMatrix[currentBet] = {};
      }

      if (!transitionMatrix[currentBet][nextBet]) {
        transitionMatrix[currentBet][nextBet] =
          smoothingFactor * Math.pow(decayFactor, distance);
      } else {
        transitionMatrix[currentBet][nextBet] +=
          smoothingFactor * Math.pow(decayFactor, distance);
      }
    }

    const allStates = Array.from(new Set(betArray));

    allStates.forEach((currentState) => {
      if (!transitionMatrix[currentState]) {
        transitionMatrix[currentState] = {};
      }
      allStates.forEach((nextState) => {
        if (!transitionMatrix[currentState][nextState]) {
          transitionMatrix[currentState][nextState] = smoothingFactor;
        }
      });
    });

    Object.keys(transitionMatrix).forEach((currentState) => {
      const possibleNextStates = Object.keys(transitionMatrix[currentState]);
      possibleNextStates.forEach((nextState) => {
        transitionMatrix[currentState][nextState] += smoothingFactor;
      });
    });

    return transitionMatrix;
  }, []);

  const chooseRandomIndex = useCallback((probabilities) => {
    const totalProbability = probabilities.reduce((sum, prob) => sum + prob, 0);
    const randomValue = Math.random() * totalProbability;

    let cumulativeProbability = 0;
    for (let i = 0; i < probabilities.length; i++) {
      cumulativeProbability += probabilities[i];
      if (randomValue <= cumulativeProbability) {
        return i;
      }
    }
    return probabilities.length - 1;
  }, []);

  const predictNextBetAmount = useCallback(
    async (betArray, penultimateSameAsLast, smoothingFactor = 0.01, randomnessFactor = 0.2, threshold = 0.0005) => {
      if (betArray.length < 2) {
        return null;
      }

      const allStates = Array.from(new Set(betArray));

      // Some custom logic for penultimateSameAsLast
      if (penultimateSameAsLast !== 0) {
        if (penultimateSameAsLast >= 3) {
          // highest value from allStates
          const maxState = Math.max(...allStates);
          return Math.min(Math.max(maxState, 0.05), bankroll);
        } else if (penultimateSameAsLast === 2) {
          // second-highest value
          const sortedStates = allStates.sort((a, b) => b - a);
          if (sortedStates.length >= 2) {
            const secondHighestState = sortedStates[index] || sortedStates[0];
            setIndex((prev) => prev + 1);
            return Math.min(Math.max(secondHighestState, 0.05), roomInfo.bet_amount);
          } else {
            // fallback to first
            const firstState = sortedStates[0];
            return Math.min(Math.max(firstState, 0.05), roomInfo.bet_amount);
          }
        } else if (penultimateSameAsLast === 1) {
          setIndex(0);
          // lowest value
          const minState = Math.min(...allStates);
          return Math.min(Math.max(minState, 0.05), roomInfo.bet_amount);
        }
      }

      // Markov-like logic
      const transitionMatrix = createTransitionMatrix(betArray, smoothingFactor);
      const lastBet = betArray[betArray.length - 1];
      const possibleNextStates = transitionMatrix[lastBet]
        ? Object.keys(transitionMatrix[lastBet])
        : [];

      if (possibleNextStates.length === 0) {
        const fallbackState = allStates[Math.floor(Math.random() * betArray.length)];
        const returnValue = Math.min(
          Math.max(fallbackState, threshold),
          roomInfo.bet_amount
        );
        return Math.max(returnValue, 0.05);
      }

      const adjustedProbabilities = possibleNextStates.map(
        (nextState) =>
          transitionMatrix[lastBet][nextState] + Math.random() * randomnessFactor
      );

      const nextStateIndex = chooseRandomIndex(adjustedProbabilities);
      const nextState = possibleNextStates[nextStateIndex];

      const returnValue = Math.min(
        Math.max(nextState, threshold),
        roomInfo.bet_amount
      );
      return Math.max(returnValue, 0.05);
    },
    [
      bankroll,
      roomInfo.bet_amount,
      index,
      chooseRandomIndex,
      createTransitionMatrix,
      setIndex
    ]
  );

  // ---------- Betting Loop ----------
  const handleSwitchChange = useCallback(async () => {
    // Validate user
    if (!validateIsAuthenticated(auth, isDarkMode)) {
      return;
    }
    if (!validateCreatorId(roomInfo.creator_id, user_id, isDarkMode)) {
      return;
    }

    if (betting) {
      // stop
      stopBetting();
    } else {
      playSound('start');
      setBetting(true);

      if (!attached) {
        // pass empty bet array for now
        startBetting([]);
      }
    }
  }, [auth, isDarkMode, roomInfo, user_id, betting, attached, playSound]);


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
      let defaultColor = roomInfo.game_type === 'Mystery Box' ? '#ffd000' : 'grey';

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
    [roomInfo]
  );


  // joinGame2
  const joinGame2 = useCallback(
    async (randomItem, nextBetAmount, betArray) => {
      if (!betting) return;
      if (roomInfo.status !== 'open') return;

      let newSelectedRps = selected_rps;
      let newSelectedQs = selected_qs_position;

      if (roomInfo.game_type === 'RPS') {
        newSelectedRps = randomItem;
      } else if (roomInfo.game_type === 'Quick Shoot') {
        newSelectedQs = parseInt(randomItem);
      }

      // local states before the async call
      setSelected_rps(newSelectedRps);
      setSelected_qs_position(newSelectedQs);
      setPredictedBetAmount(nextBetAmount || 0);

      try {
        let joinResult;
        if (roomInfo.game_type === 'RPS') {
          joinResult = await join2({
            bet_amount: parseFloat(nextBetAmount),
            selected_rps: newSelectedRps
          });
        } else if (roomInfo.game_type === 'Quick Shoot') {
          joinResult = await join2({
            bet_amount: parseFloat(nextBetAmount),
            selected_qs_position: newSelectedQs
          });
          if (joinResult.status === 'success' && !isMuted) {
            playSound('ballKick');
          }
        }

        if (joinResult && joinResult.status === 'success') {
          // update local bet array
          betArray.push(parseFloat(nextBetAmount));

          if (joinResult.betResult === 1) {
            playSound('win');
            if (roomInfo.game_type === 'Quick Shoot') changeBgColorQs(1);
            else changeBgColor(1);
            const currencyElement = convertToCurrency(Math.abs(joinResult.amount), solPrice);
            setResult(
              <span style={{ color: '#7ed321' }}>
                + {currencyElement}
              </span>
            );
            setGameResult(1);
          } else if (joinResult.betResult === 0) {
            playSound('split');
            if (roomInfo.game_type === 'Quick Shoot') changeBgColorQs(0);
            else changeBgColor(0);
            const currencyElement = convertToCurrency(Math.abs(joinResult.amount), solPrice);
            setResult(
              <span style={{ color: 'grey' }}>
                - {currencyElement}
              </span>
            );
            setGameResult(0);
          } else {
            if (roomInfo.game_type === 'Quick Shoot') changeBgColorQs(-1);
            else changeBgColor(-1);
            setResult(
              <span style={{ color: '#f50000' }}>
                - {convertToCurrency(Math.abs(joinResult.amount), solPrice)}
              </span>
            );
            setGameResult(-1);
            playSound('lose');
          }

          await getRpsBetItemsAction(roomInfo._id);
          await getQsBetItemsAction(roomInfo._id);
        }
      } catch (error) {
        console.error('Error in joinGame2:', error);
      }
    },
    [
      betting,
      roomInfo,
      join2,
      selected_rps,
      selected_qs_position,
      playSound,
      isMuted,
      getRpsBetItemsAction,
      getQsBetItemsAction,
      changeBgColorQs,
      changeBgColor,
      solPrice
    ]
  );

  const startBetting = useCallback(
    (betArray) => {
      const gameType = roomInfo.game_type;
      let interval = 5000;
      if (ai_mode === 'Adam' || ai_mode === 'Sniper') {
        interval = 6200;
      } else if (ai_mode === 'Skill-issue' || ai_mode === 'Innovate') {
        interval = 3000;
      }

      const newIntervalId = setInterval(async () => {
        try {
          let randomItem;
          let nextBetAmount;

          // refetch bet items
          await getRpsBetItemsAction(roomInfo._id);
          await getQsBetItemsAction(roomInfo._id);

          switch (gameType) {
            case 'Quick Shoot':
              if (qsbetitems && qsbetitems.length > 0) {
                if (ai_mode === 'Adam') {
                  const nextMove = await reinforcementAI_qs(qsbetitems, roomInfo.qs_game_type);
                  randomItem = nextMove.move;
                  nextBetAmount = await predictNextBetAmount(
                    betArray,
                    nextMove.risk,
                    0,
                    0.01,
                    0.2
                  );
                } else if (ai_mode === 'Markov') {
                  randomItem = await predictNextQs(qsbetitems, roomInfo.qs_game_type);
                  nextBetAmount = await predictNextBetAmount(betArray, 0, 0.01, 0.2);
                }
              }
              break;
            default:
              // RPS
              if (rpsbetitems && rpsbetitems.length > 0) {
                if (ai_mode === 'Adam') {
                  const nextMove = await reinforcementAI(rpsbetitems);
                  randomItem = nextMove.move;
                  nextBetAmount = await predictNextBetAmount(
                    betArray,
                    nextMove.risk,
                    0,
                    0.01,
                    0.2
                  );
                } else if (ai_mode === 'Markov') {
                  randomItem = await predictNext(rpsbetitems, true);
                  nextBetAmount = await predictNextBetAmount(betArray, 0, 0.01, 0.2);
                }
              }
              break;
          }

          // check if private game
          const rooms = JSON.parse(localStorage.getItem('rooms')) || {};
          const passwordCorrect = rooms[roomInfo._id];

          if (roomInfo.is_private === true && passwordCorrect !== true) {
            openGamePasswordModal();
          } else {
            await joinGame2(randomItem, nextBetAmount, betArray);
          }
        } catch (error) {
          console.error('Error in interval function:', error);
        }
      }, interval);

      setIntervalId(newIntervalId);
    },
    [
      qsbetitems,
      rpsbetitems,
      ai_mode,
      roomInfo,
      getRpsBetItemsAction,
      getQsBetItemsAction,
      openGamePasswordModal,
      joinGame2,
      predictNextBetAmount
    ]
  );

  const stopBetting = useCallback(() => {
    try {
      playSound('stop');
      clearInterval(intervalId);
      setIntervalId(null);
      setBetting(false);
      // if attached => detach
      if (attached) {
        handleDetachAttachChange(roomInfo._id);
      }
    } catch (error) {
      console.error('Error stopping betting:', error);
    }
  }, [intervalId, attached, handleDetachAttachChange, playSound, roomInfo]);

  const handleOpenPlayerModal = useCallback((creator_id) => {
    setShowPlayerModal(true);
    setSelectedCreator(creator_id);
  }, []);

  const handleClosePlayerModal = useCallback(() => {
    setShowPlayerModal(false);
  }, []);

  const refreshHistory = useCallback(async () => {
    await getRoomInfoAction(match.params.id, limit, false);
  }, [getRoomInfoAction, match, limit]);

  const handleCoHostAmountChange = useCallback((event) => {
    setCoHostAmount(event.target.value);
  }, []);

  const handleSendCoHost = useCallback(async () => {
    if (coHostAmount <= 0) {
      alertModal(isDarkMode, 'R U FURR-REAL? AMOUNT MUST BE MORE THAN 0!');
      return;
    }
    if (coHostAmount > user_balance) {
      alertModal(isDarkMode, 'NOT ENUFF FUNDS AT THIS MEOWMENT');
      return;
    }

    try {
      const result = await coHostAction(coHostAmount, roomInfo._id);
      if (result.success) {
        setBalance(result.balance);
        addNewTransaction(result.newTransaction);
        await getRoomListAction({
          pageSize: 10, // or dynamic
          game_type: roomInfo.game_type
        });
      } else {
        alertModal(isDarkMode, result.message);
      }
    } catch (error) {
      alertModal(isDarkMode, 'ROOM TOO BUSY, TRY AGAIN LATER');
    }
  }, [
    coHostAmount,
    user_balance,
    isDarkMode,
    roomInfo,
    coHostAction,
    setBalance,
    addNewTransaction,
    getRoomListAction
  ]);

  const onChangeState = useCallback((newState) => {
    // For instance, if `bankroll` is included in newState:
    if ('bankroll' in newState) {
      setBankroll(newState.bankroll);
    }
    if ('result' in newState) {
      setResult(newState.result);
    }
    if ('bet_amount' in newState) {
      setBetAmount(newState.bet_amount);
    }
    // Handle other fields similarly...
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
  const isHighCommission = cp > 16;
  const isLowProfit = (roomInfo.host_pr - roomInfo.total_stakes) > 0;
  const hostProfit = parseFloat(roomInfo.host_pr) || 0;
  const totalStakes = parseFloat(roomInfo?.total_stakes) || 0;
  const winChance =
    roomInfo.game_type === 'Quick Shoot'
      ? (((roomInfo.qs_game_type - 1) / roomInfo.qs_game_type) * 100).toFixed(2)
      : 33;

  const maxBankroll = 80;
  const progressPercentage = Math.min((bankroll / maxBankroll) * 100, 100).toFixed(2);

  return (
    <Box
      className="main-game join"
      sx={{
        display: 'grid',
        gridTemplateColumns: is_mobile ? '100%' : 'calc(100% - 360px) 350px',
        gap: '8px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {(is_mobile && selectedMobileTab === 'chat') && (
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
          cp={cp}
          // isQbot => if you still want to track that, you can pass a boolean
          isQbot={false}
          winChance={winChance}
          payoutPercentage={payoutPercentage}
          roomInfo={roomInfo}
          handleOpenPlayerModal={handleOpenPlayerModal}
          creator_id={roomInfo.creator_id}
          creator_avatar={creator_avatar}
          username={username}
          rank={roomRank}
          accessory={creator_accessory}
          rps_game_type={roomInfo.rps_game_type}
          qs_game_type={roomInfo.qs_game_type}
          endgame_type={roomInfo.endgame_type}
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
          strategies={strategies}
          result={result}
          solPrice={solPrice}
          ai_mode={ai_mode}
          getAttachedRooms={getAttachedRooms}
          handleDetachAttachChange={handleDetachAttachChange}
          onChangeState={onChangeState}
          cp={cp}
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
          refreshHistory={refreshHistory}
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
          bankroll={bankroll}
          predictedBetAmount={predictedBetAmount}
          is_private={roomInfo.is_private}
          isDarkMode={isDarkMode}
          endgame_type={roomInfo.endgame_type}
          actionList={actionList}
          getRoomData={() => { }} // or remove if not needed
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
          {(!is_mobile && selectedMainTabIndex === 1) && (
            <MyGamesTable gameTypeList={gameTypeList} />
          )}
          {is_mobile && selectedMobileTab === 'live_games' && <HistoryTable userId={user_id} />}
          {is_mobile && selectedMobileTab === 'my_games' && <MyHistoryTable />}
        </div>
      </Box>

      {/* SUB PANEL */}
      <Box className="sub-panel">
        {/* AiPanel & CoHostModal & RoomTokenDetails, etc. */}
        {!is_mobile && selectedMainTabIndex === 0 && (
          <Box>
            <AiPanel
              handleDetachAttachChange={handleDetachAttachChange}
              rpsbetitems={rpsbetitems}
              qsbetitems={qsbetitems}
              onChangeState={onChangeState}
              updateUserStrategy={updateUserStrategy}
              strategies={strategies}
              betting={betting}
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
            />
            <CoHostModal
              isDarkMode={isDarkMode}
              coHostAmount={coHostAmount}
              selectedRow={roomInfo}
              balance={user_balance}
              solPrice={solPrice}
              user={user}
              togglePopup={() => { }}
              handleClose={() => { }}
              handleSendCoHost={handleSendCoHost}
              handleCoHostAmountChange={handleCoHostAmountChange}
              has_joined={true}
              input_only={true}
            />

            <RoomTokenDetails
              solPrice={solPrice}
              progressPercentage={progressPercentage}
              handleOpenPlayerModal={handleOpenPlayerModal}
              roomInfo={roomInfo}
            />
          </Box>
        )}

        <DrawerButton open={isDrawerOpen} toggleDrawer={toggleDrawerHandler} />
        {/* <SupportButton open={props.isSupportOpen} /> */}

        {!is_mobile && selectedMainTabIndex === 1 && <MyHistoryTable />}
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
  total_wagered: state.auth.user.totalWagered,
  rank: state.logic.curRoomInfo.rank,
  user: state.auth.user,
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
  solPrice: state.logic.solPrice
});

const mapDispatchToProps = {
  getRoomInfo,
  getStrategies,
  bet,
  bet2,
  bet3,
  setCurRoomInfo,
  loadRoomInfo,
  detachPlayerFromRoom,
  attachPlayerToRoom,
  checkPlayerAttachment,
  updateUserStrategy,
  addNewTransaction,
  setBalance,
  coHost,
  getRoomList,
  getRoomStatisticsData,
  getAttachedRooms,
  toggleDrawer,
  getGameTypeList,
  getRpsBetItems,
  getQsBetItems,
  openGamePasswordModal,
  getCustomerStatisticsData,
  fetchAccessory,
  updateTutorialCompleted,
  getSolToUsdPrice
};

export default connect(mapStateToProps, mapDispatchToProps)(JoinGame);
