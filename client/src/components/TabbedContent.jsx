import React, { useState, useEffect, useCallback } from 'react';
import {
  Tabs,
  Tab,
  Skeleton,
  Box,
  Chip,
  Paper,
  Typography,
} from '@mui/material';
import Leaderboards from './Leaderboards';
import RoomHistory from './RoomHistory';
import Comments from './Comments';
import Moment from 'moment';
import Joyride from 'react-joyride';
import { tutorialStepsGame } from '../util/tutorialStepsGame';
import RPS from '../game_panel/JoinGame/RPS';
import QuickShoot from '../game_panel/JoinGame/QuickShoot';
import CoHostModal from '../game_panel/modal/CoHostModal';
import { getRank } from '../util/getRank';

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
    // Joyride / tutorial
    run,
    handleJoyrideCallback,
    // RPS / QuickShoot shared props:
    strategies,
    betting,
    result,
    attached,
    ai_mode,
    user_id,
    bankroll,
    betResult,
    bgColorChanged,
    playSound,
    changeBgColor,
    getAttachedRooms,
    updateAttachment,
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

  // ------------------ LOCAL STATE ------------------
  const [selectedTab, setSelectedTab] = useState(0);
  const [numToShow, setNumToShow] = useState(10);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [roomHistory, setRoomHistory] = useState(
    updateFromNow(roomInfo?.room_history || []),
  );
  // activeTabs for desktop view
  const [activeTabs, setActiveTabs] = useState([0, 1]); // e.g. 0="Play", 1="Chart"
  const [isMobile, setIsMobile] = useState(window.innerWidth < 767);

  // Replicate getDerivedStateFromProps
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
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    attachUserLinkListeners();
  }, [roomInfo?.room_history]);

  // ------------------ HANDLERS ------------------
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
    // If it's Insights => skip or show "coming soon"
    if (index === 4) return; // skip
    setActiveTabs((prevActiveTabs) => {
      const isActive = prevActiveTabs.includes(index);
      if (isActive) {
        return prevActiveTabs.filter((tab) => tab !== index);
      } else {
        return [...prevActiveTabs, index];
      }
    });
  }, []);

  // ------------------ RENDERERS ------------------
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
                {/* Skeleton placeholders */}
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
            <Joyride
              steps={tutorialStepsGame}
              run={run}
              callback={handleJoyrideCallback}
              continuous
              showProgress
              showSkipButton
              styles={{
                options: {
                  zIndex: 1500,
                  backgroundColor: isDarkMode
                    ? 'rgba(33, 33, 33, 0.95)' // Dark gray background for dark mode
                    : 'rgba(255, 255, 255, 0.95)', // White background for light mode
                  primaryColor: isDarkMode ? '#ff0000' : '#6200ea', // Vibrant green for dark, deep purple for light
                  arrowColor: isDarkMode
                    ? 'rgba(33, 33, 33, 0.95)'
                    : 'rgba(255, 255, 255, 0.95)',
                  textColor: isDarkMode ? '#eeeeee' : '#212121', // Light text for dark mode, dark text for light mode
                  width: 320,
                  padding: 24,
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                },
                buttonClose: {
                  borderRadius: 4,
                  color: isDarkMode ? '#eeeeee' : '#212121',
                },
                buttonBack: {
                  borderRadius: 4,
                  backgroundColor: isDarkMode
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)',
                  color: isDarkMode ? '#eeeeee' : '#212121',
                  marginRight: 8,
                },
                buttonNext: {
                  borderRadius: 4,
                  backgroundColor: isDarkMode ? '#ff0000' : '#6200ea',
                  color: '#fff',
                },
                buttonSkip: {
                  borderRadius: 4,
                  color: isDarkMode ? '#eeeeee' : '#212121',
                },
              }}
            />
            {roomInfo.game_type === 'RPS' ? (
              <RPS
                changeBgColor={changeBgColor}
                bgColorChanged={bgColorChanged}
                betting={betting}
                strategies={strategies}
                result={result}
                ai_mode={ai_mode}
                getAttachedRooms={getAttachedRooms}
                handle2xButtonClick={handle2xButtonClick}
                handleHalfXButtonClick={handleHalfXButtonClick}
                handleMaxButtonClick={handleMaxButtonClick}
                onChangeState={onChangeState}
                is_mobile={is_mobile}
                gameResult={gameResult}
                rpsbetitems={rpsbetitems}
                attached={attached}
                updateSelectedRps={updateSelectedRps}
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
                showPlayerModal={showPlayerModal}
                creator_id={roomInfo.creator_id}
                bet_amount={bet_amount}
                updateAttachment={updateAttachment}
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
                updateAttachment={updateAttachment}
                getAttachedRooms={getAttachedRooms}
                attached={attached}
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
            ) : (
              <div>Unsupported game type.</div>
            )}
          </Paper>
        );
      }

      case 1: {
        // "Chart" / CoHost
        return (
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
        );
      }

      case 2: {
        // "History"
        return (
          <RoomHistory
            roomId={roomInfo._id}
            getRoomInfo={props.getRoomInfo}
            roomInfo={roomInfo}
            isLowGraphics={isLowGraphics}
          />
        );
      }

      case 3: {
        // "Thread"
        return (
          <Box>
            <Comments roomId={roomInfo._id} />
          </Box>
        );
      }

      // case 4: {
      //   // "Insights" -> COMING SOON
      //   return (
      //     <Box textAlign="center" p={2}>
      //       <Typography variant="h6" color="error">
      //         Insights Coming Soon
      //       </Typography>
      //     </Box>
      //   );
      // }

      default:
        return null;
    }
  };

  // ------------------ MOBILE LAYOUT ------------------
  if (isMobile) {
    return (
      <div className="tabs-container">
        <Tabs
          TabIndicatorProps={{ style: { background: '#ff0000' } }}
          value={selectedTab}
          onChange={handleTabChange}
          textColor="inherit"
          indicatorColor="error"
        >
          {/* 0: "Play" */}
          <Tab label="Play" />
          {/* 1: "Chart" */}
          <Tab label="Chart" />
          {/* 2: "History" */}
          <Tab label="History" />
          {/* 3: "Thread" */}
          <Tab label="Comments" />
        </Tabs>

        <div>
          {selectedTab === 0 && renderTabContent(0)}
          {selectedTab === 1 && renderTabContent(1)}
          {selectedTab === 2 && renderTabContent(2)}
          {selectedTab === 3 && renderTabContent(3)}
          {/* {selectedTab === 4 && (
            <Box textAlign="center" p={2}>
              <Typography variant="h6" color="error">
                Insights Coming Soon
              </Typography>
            </Box>
          )} */}
        </div>
      </div>
    );
  }

  // ------------------ DESKTOP LAYOUT ------------------
  return (
    <div>
      <Box
        component={Paper}
        elevation={0}
        square
        variant="filled"
        sx={{
          background: 'linear-gradient(45deg, #322a37, #2b212f)',
          padding: '20px 10px',
          marginTop: '5px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        {['Play', 'Chart', 'History', 'Comments'].map(
          (label, index) => {
            const isInsights = index === 4;
            return (
              <Chip
                key={index}
                label={isInsights ? `${label} (Coming Soon)` : label}
                // disable the onClick if it's Insights
                onClick={isInsights ? undefined : () => handleChipClick(index)}
                clickable={!isInsights}
                color={
                  // if it's active, highlight; else default
                  activeTabs.includes(index) ? 'error' : 'error'
                }
                variant={activeTabs.includes(index) ? 'filled' : 'outlined'}
              />
            );
          },
        )}
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
