import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import {
  Tabs,
  Tab,
  Skeleton,
  Box,
  Chip,
  Paper,
} from '@mui/material';
import Moment from 'moment';

// Statically import the most common game component (assuming RPS is default)
import RPS from '../game_panel/JoinGame/RPS';

// Lazy-load other components
const QuickShoot = lazy(() => import('../game_panel/JoinGame/QuickShoot'));
const Custom = lazy(() => import('../game_panel/JoinGame/Custom'));
const RoomHistory = lazy(() => import('./RoomHistory'));
const Comments = lazy(() => import('./Comments'));
const CoHostModal = lazy(() => import('../game_panel/modal/CoHostModal'));

function updateFromNow(history) {
  if (!history) return [];
  const result = JSON.parse(JSON.stringify(history));
  for (let i = 0; i < result.length; i++) {
    result[i].from_now = Moment(result[i].created_at).fromNow();
  }
  return result;
}

function TabbedContent(props) {
  const {
    roomInfo,
    isLowGraphics,
    isDarkMode,
    solPrice,
    balance,
    user,
    handle2xButtonClick,
    handleHalfXButtonClick,
    handleMaxButtonClick,
    has_joined,
    coHostAmount,
    handleCoHostAmountChange,
    handleSendCoHost,
    handleCloseCoHostModal,
    togglePopup,
    rank,
    strategies,
    betting,
    result,
    ai_mode,
    user_id,
    bankroll,
    betResult,
    bgColorChanged,
    playSound,
    changeBgColor,
    onChangeState,
    is_mobile,
    gameResult,
    updateSelectedRps,
    rpsbetitems,
    handleOpenPlayerModal,
    predictedBetAmount,
    handleClosePlayerModal,
    join,
    selected_qs_position,
    handleSwitchChange,
    selected_rps,
    total_wagered,
    updateUserStrategy,
    updateUserPrompt,
    actionList,
    getRoomData,
    qsbetitems,
    bet_amount,
    borderColor,
    updateSelectedQs,
    changeBgColorQs,
  } = props;

  // Local state (unchanged)
  const [selectedTab, setSelectedTab] = useState(0);
  const [numToShow, setNumToShow] = useState(10);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [roomHistory, setRoomHistory] = useState(
    updateFromNow(roomInfo?.room_history || []),
  );
  const [activeTabs, setActiveTabs] = useState([0, 1]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 767);

  // Effects (unchanged)
  useEffect(() => {
    if (
      !roomHistory ||
      roomHistory.length === 0 ||
      (roomInfo?.room_history &&
        roomHistory[0]?.created_at !== roomInfo.room_history[0]?.created_at)
    ) {
      setRoomHistory(updateFromNow(roomInfo?.room_history || []));
    }
  }, [roomInfo?.room_history]);

  useEffect(() => {
    attachUserLinkListeners();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    attachUserLinkListeners();
  }, [roomInfo?.room_history]);

  // Handlers (unchanged)
  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth < 767);
  }, []);

  const attachUserLinkListeners = useCallback(() => {
    const userLinks = document.querySelectorAll('.user-link');
    userLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        const userId = event.target.getAttribute('data-userid');
        handleOpenPlayerModalLocal(userId);
      });
    });
  }, []);

  const handleOpenPlayerModalLocal = useCallback((creator_id) => {
    setShowPlayerModal(true);
  }, []);

  const handleClosePlayerModalLocal = useCallback(() => {
    setShowPlayerModal(false);
  }, []);

  const handleTabChange = useCallback((event, newValue) => {
    setSelectedTab(newValue);
  }, []);

  const handleChipClick = useCallback((index) => {
    if (index === 4) return;
    setActiveTabs((prevActiveTabs) => {
      const isActive = prevActiveTabs.includes(index);
      if (isActive) {
        return prevActiveTabs.filter((tab) => tab !== index);
      } else {
        return [...prevActiveTabs, index];
      }
    });
  }, []);

  // Renderers
  const renderTabContent = (tabIndex) => {
    switch (tabIndex) {
      case 0: {
        // "Play" Tab
        if (!roomInfo || !roomInfo.game_type) {
          return (
            <Box square="true" className="join-game-panel">
              <Box
                className="game-page loading-skeleton"
                sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                <Box
                  className="game-contents"
                  sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                >
                  <Skeleton
                    variant="rectangular"
                    sx={{ width: '100%', height: 60 }}
                  />
                  <Box
                    className="game-info-panel"
                    sx={{
                      position: 'relative',
                      paddingBottom: '90px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <Skeleton
                      variant="text"
                      sx={{ width: '20%', height: 30 }}
                    />
                    <Skeleton
                      variant="text"
                      sx={{ width: '80%', height: 30 }}
                    />
                    <Skeleton
                      variant="text"
                      sx={{ width: '60%', height: 100 }}
                    />
                    <Skeleton
                      variant="text"
                      sx={{ width: '80%', height: 30 }}
                    />
                    <Skeleton
                      variant="text"
                      sx={{ width: '10%', height: 90 }}
                    />
                    <Skeleton
                      variant="text"
                      sx={{ width: '20%', height: 90 }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          );
        }

        return (
          <Paper
            square
            variant="inherit"
            sx={{ backgroundColor: 'transparent' }}
            className="join-game-panel"
          >
            {roomInfo.game_type === 'RPS' ? (
              <RPS
                changeBgColor={changeBgColor}
                bgColorChanged={bgColorChanged}
                betting={betting}
                strategies={strategies}
                result={result}
                ai_mode={ai_mode}
                handle2xButtonClick={handle2xButtonClick}
                handleHalfXButtonClick={handleHalfXButtonClick}
                handleMaxButtonClick={handleMaxButtonClick}
                onChangeState={onChangeState}
                is_mobile={is_mobile}
                gameResult={gameResult}
                rpsbetitems={rpsbetitems}
                updateSelectedRps={updateSelectedRps}
                selected_rps={selected_rps}
                playSound={playSound}
                join={join}
                handleSwitchChange={handleSwitchChange}
                betResult={betResult}
                roomInfo={roomInfo}
                rps_game_type={roomInfo.rps_game_type}
                user_id={user_id}
                rank={rank}
                handleOpenPlayerModal={handleOpenPlayerModal}
                handleClosePlayerModal={handleClosePlayerModal}
                showPlayerModal={showPlayerModal}
                creator_id={roomInfo.creator_id}
                bet_amount={bet_amount}
                pr={roomInfo.pr}
                updateUserStrategy={updateUserStrategy}
                updateUserPrompt={updateUserPrompt}
                bankroll={bankroll}
                predictedBetAmount={predictedBetAmount}
                is_private={roomInfo.is_private}
                actionList={actionList}
                getRoomData={getRoomData}
              />
            ) : roomInfo.game_type === 'Quick Shoot' ? (
              <Suspense fallback={<Skeleton variant="rectangular" width="100%" height={300} />}>
                <QuickShoot
                  changeBgColor={changeBgColorQs}
                  onChangeState={onChangeState}
                  handleOpenPlayerModal={handleOpenPlayerModal}
                  handleClosePlayerModal={handleClosePlayerModal}
                  showPlayerModal={showPlayerModal}
                  handle2xButtonClick={handle2xButtonClick}
                  handleHalfXButtonClick={handleHalfXButtonClick}
                  handleMaxButtonClick={handleMaxButtonClick}
                  join={join}
                  result={result}
                  gameResult={gameResult}
                  updateUserStrategy={updateUserStrategy}
                  updateUserPrompt={updateUserPrompt}
                  borderColor={borderColor}
                  bgColorChanged={bgColorChanged}
                  updateSelectedQs={updateSelectedQs}
                  user_id={user_id}
                  betResult={betResult}
                  is_mobile={is_mobile}
                  qsbetitems={qsbetitems}
                  creator_id={roomInfo.creator_id}
                  qs_game_type={roomInfo.qs_game_type}
                  bankroll={bankroll}
                  bet_amount={bet_amount}
                  is_private={roomInfo.is_private}
                  selected_qs_position={selected_qs_position}
                  roomInfo={roomInfo}
                  playSound={playSound}
                  ai_mode={ai_mode}
                  betting={betting}
                  strategies={strategies}
                  handleSwitchChange={handleSwitchChange}
                  pr={roomInfo.pr}
                  actionList={actionList}
                  getRoomData={getRoomData}
                />
              </Suspense>
            ) : (
              <Suspense fallback={<Skeleton variant="rectangular" width="100%" height={300} />}>
                <Custom
                  onChangeState={onChangeState}
                  handleOpenPlayerModal={handleOpenPlayerModal}
                  handleClosePlayerModal={handleClosePlayerModal}
                  showPlayerModal={showPlayerModal}
                  handle2xButtonClick={handle2xButtonClick}
                  handleHalfXButtonClick={handleHalfXButtonClick}
                  handleMaxButtonClick={handleMaxButtonClick}
                  join={join}
                  result={result}
                  gameResult={gameResult}
                  updateUserStrategy={updateUserStrategy}
                  updateUserPrompt={updateUserPrompt}
                  borderColor={borderColor}
                  bgColorChanged={bgColorChanged}
                  updateSelectedQs={updateSelectedQs}
                  user_id={user_id}
                  betResult={betResult}
                  is_mobile={is_mobile}
                  creator_id={roomInfo.creator_id}
                  bankroll={bankroll}
                  bet_amount={bet_amount}
                  is_private={roomInfo.is_private}
                  roomInfo={roomInfo}
                  playSound={playSound}
                  ai_mode={ai_mode}
                  betting={betting}
                  strategies={strategies}
                  handleSwitchChange={handleSwitchChange}
                  pr={roomInfo.pr}
                  actionList={actionList}
                  getRoomData={getRoomData}
                />
              </Suspense>
            )}
          </Paper>
        );
      }

      case 1: {
        // "Chart" / CoHost
        return (
          <Suspense fallback={<Skeleton variant="rectangular" width="100%" height={200} />}>
            <CoHostModal
              isDarkMode={isDarkMode}
              coHostAmount={coHostAmount}
              selectedRow={roomInfo}
              balance={balance}
              user={user}
              togglePopup={togglePopup}
              handleClose={handleCloseCoHostModal}
              handleSendCoHost={handleSendCoHost}
              handleCoHostAmountChange={handleCoHostAmountChange}
              has_joined={has_joined}
              solPrice={solPrice}
              input_only={false}
            />
          </Suspense>
        );
      }

      case 2: {
        // "History"
        return (
          <Suspense fallback={<Skeleton variant="rectangular" width="100%" height={200} />}>
            <RoomHistory
              roomId={roomInfo._id}
              getRoomInfo={props.getRoomInfo}
              roomInfo={roomInfo}
              isLowGraphics={isLowGraphics}
            />
          </Suspense>
        );
      }

      case 3: {
        // "Thread"
        return (
          <Suspense fallback={<Skeleton variant="rectangular" width="100%" height={200} />}>
            <Comments roomId={roomInfo._id} />
          </Suspense>
        );
      }

      default:
        return null;
    }
  };

  // Mobile Layout (unchanged except for Suspense wrapping)
  if (isMobile) {
    return (
      <div className="tabs-container">
        <Tabs
          TabIndicatorProps={{ style: { background: '#D32F2F' } }}
          value={selectedTab}
          onChange={handleTabChange}
          textColor="inherit"
          indicatorColor="error"
        >
          <Tab label="Play" />
          <Tab label="Chart" />
          <Tab label="History" />
          <Tab label="Comments" />
        </Tabs>

        <div>
          {selectedTab === 0 && renderTabContent(0)}
          {selectedTab === 1 && renderTabContent(1)}
          {selectedTab === 2 && renderTabContent(2)}
          {selectedTab === 3 && renderTabContent(3)}
        </div>
      </div>
    );
  }

  // Desktop Layout (unchanged except for Suspense wrapping)
  return (
    <div>
      <Box
        component={Paper}
        elevation={0}
        square
        variant="filled"
        sx={{
          background: '#080808',
          padding: '20px 10px',
          marginTop: '5px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        {['Play', 'Chart', 'History', 'Comments'].map((label, index) => {
          const isInsights = index === 4;
          return (
            <Chip
              key={index}
              label={isInsights ? `${label} (Coming Soon)` : label}
              onClick={isInsights ? undefined : () => handleChipClick(index)}
              clickable={!isInsights}
              color={activeTabs.includes(index) ? 'error' : 'error'}
              variant={activeTabs.includes(index) ? 'filled' : 'outlined'}
            />
          );
        })}
      </Box>

      <Box>
        {activeTabs.map((tabIndex) => (
          <Box key={tabIndex}>{renderTabContent(tabIndex)}</Box>
        ))}
      </Box>
    </div>
  );
}

export default TabbedContent;