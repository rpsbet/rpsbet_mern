import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  lazy,
  Suspense
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Moment from 'moment';
import { useParams } from 'react-router-dom'; 
import { Button, Drawer, Box } from '@mui/material';
import { sendSolDeposit } from '../../util/solana';
import {
  toggleDrawer,
} from '../../redux/Auth/user.actions';

// Lazy load components that aren't immediately needed
const TabbedContent = lazy(() => import('../../components/TabbedContent'));
const PreSummaryPanel = lazy(() => import('../../components/PreSummaryPanel'));
const CoHostModal = lazy(() => import('../modal/CoHostModal'));
const AiPanel = lazy(() => import('../../components/AiPanel'));
const RoomTokenDetails = lazy(() => import('../../components/RoomTokenDetails'));
const ChatPanel = lazy(() => import('../ChatPanel/ChatPanel'));
const MyGamesTable = lazy(() => import('../MyGames/MyGamesTable'));
const PlayerModal = lazy(() => import('../modal/PlayerModal'));

// Import actions
import {
  bet3,
  getRoomInfo,
  updateUserPrompt,
  getRpsBetItems,
  getQsBetItems,
  addNewTransaction,
  pumpGame,
  getRoomList,
  getTransactionCandles,
} from '../../redux/Logic/logic.actions';
import {
  successMsgBar,
  errorMsgBar,
  openGamePasswordModal,
} from '../../redux/Notification/notification.actions';

// Import smaller components
import DrawerButton from './DrawerButton';
import SupportButton from './SupportButton';
import Footer from './Footer';

// Import utility functions
import { getRank } from '../../util/getRank';
import {
  validateIsAuthenticated,
  validateCreatorId,
} from '../modal/betValidations';

// Loading fallback component
const LoadingFallback = () => (
  <div className="loading-spinner"></div>
);

// Helper function moved outside component for better memory usage
function updateFromNow(history) {
  if (!history || !Array.isArray(history)) return [];
  
  return history.map(item => ({
    ...item,
    from_now: Moment(item.created_at).fromNow()
  }));
}

function JoinGame() {
  const dispatch = useDispatch();
  const { id } = useParams();
  
  // Redux state selectors - memoize with useSelector for performance
  const {
    auth,
    history: propsHistory,
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
    account,
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
    solPrice,
  } = useSelector((state) => ({
    auth: state.auth.isAuthenticated,
    history: state.logic.history,
    roomInfo: state.logic.curRoomInfo,
    rpsbetitems: state.logic.rpsbetitems,
    qsbetitems: state.logic.qsbetitems,
    user_id: state.auth.user._id,
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
    solPrice: state.logic.solPrice,
    account: state.logic.account,
  }));

  // Local state - group related state to reduce re-renders
  const [is_mobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [selectedMobileTab, setSelectedMobileTab] = useState('live_games');
  
  // Modal states
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  
  // Game states
  const [gameState, setGameState] = useState({
    actionList: null,
    betting: false,
    hosts: roomInfo.hosts || [],
    localRoomInfo: roomInfo,
    bankroll: roomInfo.bankroll,
    battles: roomInfo.battles,
    selected_rps: '',
    selected_qs_position: 0,
    run: false,
    bgColorChanged: false,
    borderColor: '',
    gameResult: -100,
    betResult: null,
    result: 0,
    coHostAmount: 0.01,
    intervalId: null,
    isMax: false,
    bet_amount: 0.001,
    predictedBetAmount: 0,
    loading: propsLoading,
    componentHistory: updateFromNow(propsHistory),
  });

  // Use refs for values that don't need to trigger re-renders
  const isMountedRef = useRef(true);
  const rpsbetitemsRef = useRef(rpsbetitems);
  const qsbetitemsRef = useRef(qsbetitems);
  
  // Audio setup - memoized to prevent recreating on each render
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

  // Memoize derived values
  const payoutPercentage = useMemo(() => {
    const { bankroll } = gameState;
    if (isNaN((bankroll / roomInfo.endgame_amount) * 100)) return 0;
    return Math.ceil((bankroll / roomInfo.endgame_amount) * 100);
  }, [gameState.bankroll, roomInfo.endgame_amount]);

  const winChance = useMemo(() => 
    roomInfo.game_type === 'Quick Shoot'
      ? (((roomInfo.qs_game_type - 1) / roomInfo.qs_game_type) * 100).toFixed(2)
      : 33,
  [roomInfo.game_type, roomInfo.qs_game_type]);

  const progressPercentage = useMemo(() => {
    const { bankroll } = gameState;
    const maxBankroll = roomInfo.endgame_amount;
    return Math.min((bankroll / maxBankroll) * 100, 100).toFixed(2);
  }, [gameState.bankroll, roomInfo.endgame_amount]);

  // Derived state for UI
  const isLowBankroll = gameState.bankroll <= 0.01;
  const isHighCommission = roomInfo.tax > 16;
  const isLowProfit = roomInfo.host_pr - roomInfo.total_stakes > 0;
  const hostProfit = parseFloat(roomInfo.host_pr) || 0;
  const totalStakes = parseFloat(roomInfo?.total_stakes) || 0;

  // Setup effects
  useEffect(() => {
    isMountedRef.current = true;
    
    // Resize handler
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('unload', handleUnload);

    // Initialize room data
    const init = async () => {
      try {
        await dispatch(getTransactionCandles({ roomId: id, timeFrame: '1m' }));
        await initializeRoomData();
      } catch (error) {
        console.error('Error in init useEffect:', error);
      }
    };
    
    init();

    // Cleanup
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('unload', handleUnload);
      if (gameState.intervalId) {
        clearInterval(gameState.intervalId);
      }
    };
  }, [dispatch, id]);

  // Update refs when dependencies change
  useEffect(() => {
    rpsbetitemsRef.current = rpsbetitems;
  }, [rpsbetitems]);
  
  useEffect(() => {
    qsbetitemsRef.current = qsbetitems;
  }, [qsbetitems]);

  useEffect(() => {
    if (!roomInfo || !isMountedRef.current) return;
    
    setGameState(prev => ({
      ...prev,
      localRoomInfo: roomInfo,
      bankroll: roomInfo.user_bet,
      hosts: roomInfo.hosts || [],
      battles: roomInfo.battles
    }));

    const gameType = roomInfo.game_type;
    if (gameType === 'Quick Shoot') {
      dispatch(getQsBetItems(roomInfo._id));
    } else if (gameType === 'RPS') {
      dispatch(getRpsBetItems(roomInfo._id));
    }

  }, [roomInfo, dispatch]);

  // Handle max button when balance changes
  useEffect(() => {
    if (gameState.gameResult !== -1 && gameState.isMax) {
      handleMaxButtonClick();
    }
  }, [user_balance, gameState.gameResult, gameState.isMax]);

  // Update history when it changes
  useEffect(() => {
    if (
      !propsHistory || 
      !Array.isArray(propsHistory) || 
      propsHistory.length === 0 ||
      !gameState.componentHistory ||
      gameState.componentHistory.length === 0 ||
      (propsHistory[0] && gameState.componentHistory[0] && 
       propsHistory[0].created_at !== gameState.componentHistory[0].created_at)
    ) {
      setGameState(prev => ({
        ...prev,
        componentHistory: updateFromNow(propsHistory)
      }));
    }
    
    if (gameState.localRoomInfo._id !== roomInfo._id) {
      setGameState(prev => ({
        ...prev,
        localRoomInfo: roomInfo,
        bankroll: roomInfo.user_bet,
        battles: roomInfo.battles,
        hosts: roomInfo.hosts || []
      }));
    }
  }, [propsHistory, roomInfo]);

  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      loading: propsLoading
    }));
  }, [propsLoading]);

  // Helper function to load sounds
  const loadSounds = useCallback(async () => {
    try {
      const soundPromises = Object.values(soundsRef.current).map(audio => {
        return new Promise((resolve, reject) => {
          const handleLoad = () => {
            audio.removeEventListener('canplaythrough', handleLoad);
            resolve();
          };
          
          audio.addEventListener('canplaythrough', handleLoad);
          audio.load();
          
          // Add timeout to prevent hanging if sound doesn't load
          setTimeout(resolve, 2000);
        });
      });
      
      await Promise.all(soundPromises);
    } catch (error) {
      console.error('Error loading sounds:', error);
    }
  }, []);

  // Handler for playing sounds
  
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

  // Handler for stopping sounds
  const stopAllSounds = useCallback(() => {
    if (currentSound) {
      currentSound.pause();
      currentSound.currentTime = 0;
      setCurrentSound(null);
    }
  }, [currentSound]);

  // Handler for window unload
  const handleUnload = useCallback(() => {
    stopAllSounds();
  }, [stopAllSounds]);

  // Initialize room data
  const initializeRoomData = async () => {
    try {
      await Promise.all([
        loadSounds(),
        dispatch(getRoomInfo(id, 10)),
      ]);
    } catch (error) {
      console.error('Error initializing room data:', error);
    }
  };

  // Handle drawer toggle
  const toggleDrawerHandler = useCallback(() => {
    dispatch(toggleDrawer(!isDrawerOpen));
  }, [dispatch, isDrawerOpen]);

const join = useCallback(
  async (betInfo) => {
    // Set betting state to true
    setGameState(prev => ({ ...prev, betting: true }));

    try {
      let betResult;

      if (roomInfo.game_type !== 'Custom') {
        // Process Solana deposit for non-Custom game types
        const depositResult = await sendSolDeposit(
          dispatch,
          betInfo.bet_amount,
          roomInfo._id,
          roomInfo.name,
          'join',
          account,
          user_balance,
          () => {
            // On success, no additional action needed here
          },
          () => {
            setGameState(prev => ({ ...prev, betting: false }));
          }
        );

        if (!depositResult.success) {
          setGameState(prev => ({ ...prev, betting: false }));
          return { success: false };
        }
      }

      // Place bet
      betResult = await dispatch(
        bet3({
          _id: roomInfo._id,
          connectedAccount,
          user: user_id,
          game_type: roomInfo.game_type,
          ...betInfo,
        })
      );
      setGameState(prev => ({ ...prev, betting: false }));

      if (betResult.status === 'success') {
        return betResult;
      } else {
        dispatch(errorMsgBar(betResult.message || 'Failed to place bet.'));
        return betResult;
      }
    } catch (error) {
      console.error('Error in join:', error);
      dispatch(errorMsgBar('Error processing bet.'));
      setGameState(prev => ({ ...prev, betting: false }));
      return { success: false };
    }
  },
  [dispatch, roomInfo, user_id, connectedAccount, account, user_balance]
);

  // Handle background color change for RPS
  const changeBgColor = useCallback(async (resultVal) => {
    setGameState(prev => ({
      ...prev,
      betResult: resultVal
    }));
    
    const flickerCount = 3;
    const delay = 50;

    for (let i = 0; i < flickerCount; i++) {
      setGameState(prev => ({
        ...prev,
        bgColorChanged: i % 2 === 0
      }));
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    setGameState(prev => ({
      ...prev,
      bgColorChanged: false,
      betResult: null
    }));
  }, []);

  // Handle background color change for Quick Shoot
  const changeBgColorQs = useCallback(async (resultVal) => {
    let newBorderColor = '';
    const defaultColor = roomInfo.game_type === 'Mystery Box' ? '#ffd000' : 'grey';

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
    
    setGameState(prev => ({
      ...prev,
      betResult: resultVal,
      bgColorChanged: true,
      borderColor: newBorderColor
    }));

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setGameState(prev => ({
      ...prev,
      borderColor: '',
      bgColorChanged: false,
      betResult: null
    }));
  }, [roomInfo.game_type]);

  // Handle switch change
  const handleSwitchChange = useCallback(() => {
    if (!validateIsAuthenticated(auth, isDarkMode)) return;
    if (!validateCreatorId(roomInfo.creator_id, user_id, isDarkMode)) return;
    
    // Additional implementation as needed
  }, [auth, isDarkMode, roomInfo.creator_id, user_id]);

  // Handle player modal
  const handleOpenPlayerModal = useCallback((creator_id) => {
    setShowPlayerModal(true);
    setSelectedCreator(creator_id);
  }, []);

  const handleClosePlayerModal = useCallback(() => {
    setShowPlayerModal(false);
  }, []);

  // Handle co-host amount change
  const handleCoHostAmountChange = useCallback((event) => {
    setGameState(prev => ({
      ...prev,
      coHostAmount: event.target.value
    }));
  }, []);

  // Handle sending co-host
  const handleSendCoHost = useCallback(async () => {
    const { coHostAmount } = gameState;
    
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
        await dispatch(getRoomList({ game_type: roomInfo.game_type }));
      } else {
        dispatch(errorMsgBar(result.message));
      }
    } catch (error) {
      console.log("error", error)
      dispatch(errorMsgBar('ROOM TOO BUSY, TRY AGAIN LATER'));
    }
  }, [gameState.coHostAmount, user_balance, roomInfo._id, connectedAccount, dispatch]);

  // Handle game state changes
  const onChangeState = useCallback((newState) => {
    setGameState(prev => {
      const updatedState = { ...prev };
      
      if ('bankroll' in newState) updatedState.bankroll = newState.bankroll;
      if ('hosts' in newState && Array.isArray(newState.hosts)) updatedState.hosts = newState.hosts;
      if ('result' in newState) updatedState.result = newState.result;
      if ('bet_amount' in newState) updatedState.bet_amount = newState.bet_amount;
      if ('battles' in newState) updatedState.battles = prev.battles + newState.battles;
      
      return updatedState;
    });
  }, []);

  // Handle bet amount adjustment
  const handleHalfXButtonClick = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      bet_amount: prev.bet_amount * 0.5,
      isMax: false
    }));
  }, []);

  const handle2xButtonClick = useCallback(() => {
    setGameState(prev => {
      const maxBetAmount = user_balance;
      const multipliedBetAmount = prev.bet_amount * 2;
      const limitedBetAmount = Math.min(multipliedBetAmount, maxBetAmount);
      
      return {
        ...prev,
        bet_amount: limitedBetAmount,
        isMax: false
      };
    });
  }, [user_balance]);

  const handleMaxButtonClick = useCallback(() => {
    setGameState(prev => {
      const maxBetAmount = Math.min(user_balance, prev.bankroll);
      
      return {
        ...prev,
        bet_amount: maxBetAmount,
        isMax: true
      };
    });
  }, [user_balance, gameState.bankroll]);

  // Update selected RPS or QS position
  const updateSelectedRps = useCallback((selection, callback) => {
    setGameState(prev => ({
      ...prev,
      selected_rps: selection
    }));
    
    if (callback) callback();
  }, []);

  const updateSelectedQs = useCallback((position, callback) => {
    setGameState(prev => ({
      ...prev,
      selected_qs_position: position
    }));
    
    if (callback) callback();
  }, []);

  // Game type list - could be expanded as needed
  const gameTypeList = [];

  // Render
  return (
    <>
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
          <Suspense fallback={<LoadingFallback />}>
            <ChatPanel />
          </Suspense>
        </Drawer>
      )}

      {showPlayerModal && (
        <Suspense fallback={<LoadingFallback />}>
          <PlayerModal
            modalIsOpen={showPlayerModal}
            closeModal={handleClosePlayerModal}
            selectedCreator={selectedCreator}
          />
        </Suspense>
      )}

      {/* MAIN PANEL */}
      <Box className="main-panel" sx={{ margin: '8px' }}>
        <Suspense fallback={<LoadingFallback />}>
          <PreSummaryPanel
            status={roomInfo.status}
            bankroll={gameState.bankroll}
            isDarkMode={isDarkMode}
            solPrice={solPrice}
            winChance={winChance}
            payoutPercentage={payoutPercentage}
            roomInfo={roomInfo}
            handleOpenPlayerModal={handleOpenPlayerModal}
            creator_id={roomInfo.creator_id}
            creator_avatar={creator_avatar}
            username={username}
            rank={roomRank}
            battles={gameState.battles}
            accessory={creator_accessory}
            rps_game_type={roomInfo.rps_game_type}
            qs_game_type={roomInfo.qs_game_type}
            pr={roomInfo.pr}
            isLowBankroll={isLowBankroll}
            isHighCommission={isHighCommission}
            isLowProfit={isLowProfit}
            hostProfit={hostProfit}
            totalStakes={totalStakes}
            bet_amount={gameState.bet_amount}
          />
        </Suspense>

        <Suspense fallback={<LoadingFallback />}>
          <TabbedContent
            changeBgColor={changeBgColor}
            changeBgColorQs={changeBgColorQs}
            bgColorChanged={gameState.bgColorChanged}
            betting={gameState.betting}
            connectedAccount={connectedAccount}
            result={gameState.result}
            solPrice={solPrice}
            handle2xButtonClick={handle2xButtonClick}
            handleHalfXButtonClick={handleHalfXButtonClick}
            handleMaxButtonClick={handleMaxButtonClick}
            ai_mode={ai_mode}
            onChangeState={onChangeState}
            bet_amount={gameState.bet_amount}
            is_mobile={is_mobile}
            gameResult={gameState.gameResult}
            rpsbetitems={rpsbetitems}
            run={gameState.run}
            updateSelectedRps={updateSelectedRps}
            selected_rps={gameState.selected_rps}
            playSound={playSound}
            join={join}
            handleSwitchChange={handleSwitchChange}
            betResult={gameState.betResult}
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
            updateUserPrompt={updateUserPrompt}
            bankroll={gameState.bankroll}
            predictedBetAmount={gameState.predictedBetAmount}
            is_private={roomInfo.is_private}
            isDarkMode={isDarkMode}
            actionList={gameState.actionList}
            getRoomData={() => {}}
            user={user}
            coHostAmount={gameState.coHostAmount}
            getRoomInfo={getRoomInfo}
            balance={user_balance}
            isLowGraphics={isLowGraphics}
            handleCoHostAmountChange={handleCoHostAmountChange}
            handleSendCoHost={handleSendCoHost}
            has_joined={true}
            borderColor={gameState.borderColor}
            updateSelectedQs={updateSelectedQs}
            qsbetitems={qsbetitems}
            account={account}
            qs_game_type={roomInfo.qs_game_type}
            selected_qs_position={gameState.selected_qs_position}
          />
        </Suspense>

        <div>
          {!is_mobile && selectedMainTabIndex === 1 && (
            <Suspense fallback={<LoadingFallback />}>
              <MyGamesTable gameTypeList={gameTypeList} />
            </Suspense>
          )}
        </div>
      </Box>

      {/* SUB PANEL */}
      <Box className="sub-panel">
        {!is_mobile && selectedMainTabIndex === 0 && (
          <Box>
             <Suspense fallback={<LoadingFallback />}>
              <RoomTokenDetails
                solPrice={solPrice}
                hosts={gameState.hosts}
                progressPercentage={progressPercentage}
                handleOpenPlayerModal={handleOpenPlayerModal}
                roomInfo={roomInfo}
              />
            </Suspense>
            <Suspense fallback={<LoadingFallback />}>
              <CoHostModal
                isDarkMode={isDarkMode}
                coHostAmount={gameState.coHostAmount}
                selectedRow={roomInfo}
                hosts={gameState.hosts}
                connectedAccount={connectedAccount}
                balance={user_balance}
                solPrice={solPrice}
                user={user}
                togglePopup={() => {}}
                handleClose={() => {}}
                handleSendCoHost={handleSendCoHost}
                handleCoHostAmountChange={handleCoHostAmountChange}
                has_joined={true}
                account={account}
                input_only={true}
              />
            </Suspense>

           
          </Box>
        )}

        <DrawerButton open={isDrawerOpen} toggleDrawer={toggleDrawerHandler} />
      </Box>

      {!is_mobile && (
        <div className="mobile-only main-page-nav-button-group">
          <Button
            className={`mobile-tab-live ${selectedMobileTab === 'live_games' ? 'active' : ''}`}
            onClick={() => setSelectedMobileTab('live_games')}
          >
            BEAT THE HOUSE
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

    </Box>
      <Footer className="footer" open={isDrawerOpen} />
    </>

  );
}

export default React.memo(JoinGame);