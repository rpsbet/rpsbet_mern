// TabbedContent.jsx
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import {
  Tabs,
  Tab,
  Skeleton,
  Box,
  Chip,
  Paper,
  Typography,
  Avatar,
  Badge,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDice, faClock, faBolt } from '@fortawesome/free-solid-svg-icons';
import { yellow, blue, grey } from '@mui/material/colors';
import Lottie from 'react-lottie';
import progress from '../game_panel/LottieAnimations/progress.json';
import LoadingComponent from './LoadingComponent';
import Moment from 'moment';
import { motion } from 'framer-motion';
import RPS from '../game_panel/JoinGame/RPS';
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
    result: initialResult,
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
    account
  } = props;

  // Fetch is_betting from Redux
  const is_betting = useSelector((state) => state.logic.is_betting);

  // Local state for result
  const [result, setResult] = useState(initialResult || '');
  const [selectedTab, setSelectedTab] = useState(0);
  const [numToShow, setNumToShow] = useState(10);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [roomHistory, setRoomHistory] = useState(
    updateFromNow(roomInfo?.room_history || []),
  );
  const [activeTabs, setActiveTabs] = useState([0, 1]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 767);

  // Effects
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

  useEffect(() => {
    setResult(initialResult || '');
  }, [initialResult]);

  // Handlers
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

  // Callback to update result
  const handleResultChange = useCallback(
    (newResult, newBetting) => {
      setResult(newResult);
      onChangeState({ result: newResult, betting: newBetting });
    },
    [onChangeState]
  );

  // Glassmorphism style
  const glassmorphismStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    '@supports not (backdrop-filter: blur(12px))': {
      background: 'rgba(255, 255, 255, 0.2)',
    },
  };

  // Result Display Component
  const renderResultDisplay = () => (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box
        sx={{
          ...glassmorphismStyle,
          p: isMobile ? 1 : 1.5,
          mt: isMobile ? 4 : 0,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          zIndex: 10,
          minWidth: isMobile ? '100%' : '200px',
          background:
            is_betting
              ? 'linear-gradient(45deg, rgba(33, 150, 243, 0.2), rgba(33, 150, 243, 0.4))'
              : 'rgba(255, 255, 255, 0.1)',
          transition: 'background 0.3s ease',
          width: isMobile ? '100%' : 'auto',
          boxSizing: 'border-box',
        }}
      >
        {result !== '' ? (
          <Chip
            label={
              <Typography
                variant={isMobile ? 'body2' : 'body1'}
                sx={{ color: '#fff', fontWeight: 400 }}
              >
                {result}
              </Typography>
            }
            sx={{
              bgcolor: is_betting ? 'rgba(33, 150, 243, 0.5)' : 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              borderRadius: '16px',
              flexGrow: 1,
              height: isMobile ? 28 : 32,
              '& .MuiChip-label': { px: 1 },
            }}
          />
        ) : is_betting ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <Box sx={{ width: isMobile ? '40px' : '50px' }}>
              <Lottie
                options={{
                  loop: isLowGraphics ? false : true,
                  autoplay: isLowGraphics ? false : true,
                  animationData: progress,
                }}
              />
            </Box>
            <Typography
              variant={isMobile ? 'caption' : 'body2'}
              sx={{
                color: '#fff',
                fontWeight: 400,
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
              }}
            >
              Betting...
            </Typography>
          </Box>
        ) : (
          <Typography
            variant={isMobile ? 'caption' : 'body2'}
            sx={{
              color: '#fff',
              fontWeight: 400,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
              flexGrow: 1,
              textAlign: 'center',
            }}
          >
            Waiting for bet
          </Typography>
        )}
        <Badge
          badgeContent={
            is_betting ? (
              <FontAwesomeIcon icon={faBolt} style={{ color: yellow[500], fontSize: '12px' }} />
            ) : null
          }
          sx={{
            '& .MuiBadge-badge': {
              right: -8,
              top: 8,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '50%',
              p: 0.5,
            },
          }}
        >
          <Avatar
            sx={{
              width: isMobile ? 28 : 32,
              height: isMobile ? 28 : 32,
              bgcolor: is_betting ? blue[500] : grey[700],
              transition: 'background-color 0.3s ease',
            }}
          >
            <FontAwesomeIcon
              icon={is_betting ? faDice : faClock}
              style={{ fontSize: isMobile ? '14px' : '16px', color: '#fff' }}
            />
          </Avatar>
        </Badge>
      </Box>
    </motion.div>
  );

  // Renderers
  // Replace the current loading skeleton in the renderTabContent function (case 0)
  // with this professional loading progress bar

  const renderTabContent = (tabIndex) => {
    switch (tabIndex) {
      case 0: {
        // "Play" Tab
        if (!roomInfo || !roomInfo.game_type) {
          return <LoadingComponent />;
        }

        return (
          <Paper
            square
            variant="inherit"
            sx={{ backgroundColor: '#111213', position: 'relative', mb: 1, border: '1px solid #414242' }}
            className="join-game-panel"
          >
            {/* Result Display for Mobile */}
            {isMobile && (
              <Box sx={{ mb: 2, px: 2 }}>
                {renderResultDisplay()}
              </Box>
            )}

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
                onResultChange={handleResultChange}
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
                  onResultChange={handleResultChange}
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
                  onResultChange={handleResultChange}
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
              account={account}
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

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="tabs-container">
        <Tabs
          TabIndicatorProps={{ style: { background: '#FF0000' } }}
          value={selectedTab}
          onChange={handleTabChange}
          textColor="inherit"
          indicatorColor="error"
        >
          <Tab label="Play" />
          <Tab label="Trade" />
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

  // Desktop Layout
  return (
    <div>
      <Box
        component={Paper}
        elevation={0}
        square
        variant="filled"
        sx={{
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          '@supports not (backdrop-filter: blur(10px))': {
            background: 'rgba(0, 0, 0, 0.4)',
          },
          padding: '10px',
          marginTop: '5px',
          display: 'flex',
          alignItems: 'center',
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
        {/* Result Display for Desktop */}
        <Box sx={{ marginLeft: 'auto' }}>
          {renderResultDisplay()}
        </Box>
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