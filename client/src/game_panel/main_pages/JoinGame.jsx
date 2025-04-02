import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Moment from 'moment';
import { useParams } from 'react-router-dom'; 
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

function JoinGame({ match }) { // Keep match as a prop since it’s from React Router
  const dispatch = useDispatch();
  const { id } = useParams();
  // Map state from Redux using useSelector
  const {
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
  } = useSelector((state) => ({
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
  }));

  // Local State
  const [is_mobile, setIsMobile] = useState(window.innerWidth < 1024);
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
  const [index, setIndex] = useState(0);
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
  const [bet_amount, setBetAmount] = useState(0.001);
  const [predictedBetAmount, setPredictedBetAmount] = useState(0);
  const [loading, setLoading] = useState(propsLoading);
  const [componentHistory, setComponentHistory] = useState(
    updateFromNow(propsHistory),
  );

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
  const isMountedRef = useRef(true);
  const rpsbetitemsRef = useRef(rpsbetitems);
  const qsbetitemsRef = useRef(qsbetitems);

  // Effects
  useEffect(() => {
    isMountedRef.current = true;

    const init = async () => {
      try {
        await dispatch(getTransactionCandles({ roomId: id, timeFrame: '1m' }));
        await initializeRoomData();
      } catch (error) {
        console.error('Error in init useEffect:', error);
      }
    };

    init();
    window.addEventListener('unload', handleUnload);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('unload', handleUnload);
      clearInterval(intervalId);
    };
  }, [dispatch, id]);

  useEffect(() => {
    rpsbetitemsRef.current = rpsbetitems;
  }, [rpsbetitems]);
  useEffect(() => {
    qsbetitemsRef.current = qsbetitems;
  }, [qsbetitems]);

  useEffect(() => {
    if (user && !run) {
      setRun(!user.completedTutorials?.includes(2));
    }
  }, [user, run]);

  useEffect(() => {
    setLocalRoomInfo(roomInfo);
    setBankroll(roomInfo.user_bet);
    const gameType = roomInfo.game_type;
    if (gameType === 'Quick Shoot') {
      dispatch(getQsBetItems(roomInfo._id));
    } else if (gameType === 'RPS') {
      dispatch(getRpsBetItems(roomInfo._id));
    }

    if (isMountedRef.current && attached) {
      setBetting(true);
    }
  }, [roomInfo, attached, dispatch]);

  useEffect(() => {
    if (gameResult !== -1 && isMax) {
      handleMaxButtonClick();
    }
  }, [user_balance, gameResult, isMax]);

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
    if (localRoomInfo._id !== roomInfo._id) {
      setLocalRoomInfo(roomInfo);
      setBankroll(roomInfo.user_bet);
      setBattles(roomInfo.battles);
      setHosts(roomInfo.hosts);
    }
  }, [propsHistory, roomInfo]);

  useEffect(() => {
    setLoading(propsLoading);
  }, [propsLoading]);

  // Helper Functions
  const initializeRoomData = async () => {
    try {
      await Promise.all([
        loadSounds(),
        dispatch(getStrategies()),
        dispatch(getRoomInfo(id, 10)),
      ]);
    } catch (error) {
      console.error('Error initializing room data:', error);
    }
  };

  const toggleDrawerHandler = useCallback(() => {
    dispatch(toggleDrawer(!isDrawerOpen));
  }, [dispatch, isDrawerOpen]);

  const join = useCallback(
    async (betInfo) => {
      return await dispatch(
        bet3({
          _id: roomInfo._id,
          user: user_id,
          game_type: roomInfo.game_type,
          ...betInfo,
        }),
      );
    },
    [dispatch, roomInfo, user_id],
  );

  const join2 = useCallback(
    async (betInfo) => {
      return await dispatch(
        bet3({
          _id: localRoomInfo._id,
          user: user_id,
          game_type: localRoomInfo.game_type,
          ...betInfo,
        }),
      );
    },
    [dispatch, localRoomInfo, user_id],
  );

  const playSound = useCallback(
    (soundKey) => {
      if (!isMuted || !gameSounds) {
        const audio = soundsRef.current[soundKey];
        if (audio && audio.paused !== undefined) {
          if (!audio.paused) return;
          audio.currentTime = 0;
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch((error) =>
              console.log(`Error playing sound "${soundKey}":`, error),
            );
          }
          setCurrentSound(audio);
        }
      }
    },
    [isMuted, gameSounds],
  );

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
          newBorderColor = '#00ff3a';
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

  const loadSounds = useCallback(async () => {
    const soundObjects = soundsRef.current;
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
    stopAllSounds();
  }, [stopAllSounds]);

  const handleSwitchChange = useCallback(() => {
    if (!validateIsAuthenticated(auth, isDarkMode)) return;
    if (!validateCreatorId(roomInfo.creator_id, user_id, isDarkMode)) return;

   
  }, [
    auth,
    isDarkMode,
    roomInfo,
    user_id,
    betting,
    dispatch,
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
      const result = await dispatch(
        pumpGame(coHostAmount, roomInfo._id, connectedAccount),
      );
      if (result.success) {
        dispatch(addNewTransaction(result.newTransaction));
        await dispatch(getRoomList({ game_type: roomInfo.game_type }));
      } else {
        dispatch(errorMsgBar(result.message));
      }
    } catch (error) {
      dispatch(errorMsgBar('ROOM TOO BUSY, TRY AGAIN LATER'));
    }
  }, [
    coHostAmount,
    user_balance,
    roomInfo,
    connectedAccount,
    dispatch,
  ]);

  const onChangeState = useCallback((newState) => {
    if ('bankroll' in newState) setBankroll(newState.bankroll);
    if ('hosts' in newState && Array.isArray(newState.hosts))
      setHosts(newState.hosts);
    if ('result' in newState) setResult(newState.result);
    if ('bet_amount' in newState) setBetAmount(newState.bet_amount);
    if ('battles' in newState)
      setBattles((prevBattles) => prevBattles + newState.battles);
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

  // Render Logic
  const gameTypeList = [];
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
          getRoomData={() => {}}
          user={user}
          coHostAmount={coHostAmount}
          getRoomInfo={getRoomInfo}
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
          {!is_mobile && selectedMainTabIndex === 1 && (
            <MyGamesTable gameTypeList={gameTypeList} />
          )}
        </div>
      </Box>

      {/* SUB PANEL */}
      <Box className="sub-panel">
        {!is_mobile && selectedMainTabIndex === 0 && (
          <Box>
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

export default JoinGame;