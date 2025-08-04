// TabbedContent.jsx
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import {
  Tabs,
  Tab,
  Skeleton,
  Box,
  Chip,
  Typography,
  Avatar,
  Badge,
  Tooltip,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDice,
  faClock,
  faBolt,
  faPlay,
  faChartLine,
  faHistory,
  faComments
} from '@fortawesome/free-solid-svg-icons';
import LoadingComponent from './LoadingComponent';
import { formatDistanceToNow } from 'date-fns';

const Custom = lazy(() => import('../game_panel/JoinGame/Custom'));
const RoomHistory = lazy(() => import('./RoomHistory'));
const Comments = lazy(() => import('./Comments'));
const CoHostModal = lazy(() => import('../game_panel/modal/CoHostModal'));

function updateFromNow(history) {
  if (!history) return [];
  const result = JSON.parse(JSON.stringify(history));
  for (let i = 0; i < result.length; i++) {
    result[i].from_now = formatDistanceToNow(new Date(result[i].created_at), { addSuffix: true });
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
    handleOpenPlayerModal,
    predictedBetAmount,
    handleClosePlayerModal,
    join,
    handleSwitchChange,
    actionList,
    getRoomData,
    bet_amount,
    borderColor,
  } = props;

  // Fetch is_betting from Redux
  const is_betting = useSelector((state) => state.logic.is_betting);

  // Local state for result
  const [result, setResult] = useState(initialResult || '');
  const [selectedTab, setSelectedTab] = useState(0);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [roomHistory, setRoomHistory] = useState(
    updateFromNow(roomInfo?.room_history || []),
  );
  const [activeTabs, setActiveTabs] = useState([0]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 767);

  // Tab configuration with icons and colors
  const tabConfig = [
    {
      label: 'Play',
      icon: faPlay,
      color: '#4caf50',
      description: 'Start your game',
      tooltip: 'Game section opens below'
    },
    {
      label: 'Trade',
      icon: faChartLine,
      color: '#2196f3',
      description: 'Manage investments',
      tooltip: 'Trading section opens below'
    },
    {
      label: 'History',
      icon: faHistory,
      color: '#ff9800',
      description: 'View past games',
      tooltip: 'History section opens below'
    },
    {
      label: 'Comments',
      icon: faComments,
      color: '#9c27b0',
      description: 'Community discussion',
      tooltip: 'Comments section opens below'
    }
  ];

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

  // Clean Result Display Component
  const renderResultDisplay = () => (
    <Box
      sx={{
        padding: '8px 12px',
        borderRadius: '8px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minWidth: isMobile ? '100%' : '200px',
        transition: 'all 0.2s ease',
        width: isMobile ? '100%' : 'auto',
      }}
    >
      {result !== '' ? (
        <Chip
          label={result}
          size="small"
          sx={{
            backgroundColor: 'rgba(66, 66, 66, 0.6)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.75rem',
            height: '24px',
            flexGrow: 1,
            '& .MuiChip-label': {
              padding: '0 8px',
            },
          }}
        />
      ) : is_betting ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          >
            Processing...
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 500,
              fontSize: '0.75rem',
            }}
          >
            Ready to Play
          </Typography>
        </Box>
      )}

      <Avatar
        sx={{
          width: 24,
          height: 24,
          bgcolor: is_betting ? '#2196f3' : '#666',
          transition: 'all 0.2s ease',
        }}
      >
        <FontAwesomeIcon
          icon={is_betting ? faDice : faClock}
          style={{
            fontSize: '10px',
            color: '#fff',
          }}
        />
      </Avatar>
    </Box>
  );

  const renderTabContent = (tabIndex) => {
    switch (tabIndex) {
      case 0: {
        // "Play" Tab
        if (!roomInfo || !roomInfo.game_type) {
          return <LoadingComponent />;
        }

        return (
          <Box
            sx={{
              borderRadius: '8px',
              background: '#262626',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              overflow: 'hidden',
              mb: 2,
            }}
          >
            {/* Result Display for Mobile */}
            {isMobile && (
              <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                {renderResultDisplay()}
              </Box>
            )}

            <Suspense fallback={
              <Box sx={{ p: 4 }}>
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={300}
                  sx={{ borderRadius: '4px' }}
                />
              </Box>
            }>
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
                borderColor={borderColor}
                bgColorChanged={bgColorChanged}
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
                changeBgColor={changeBgColor}
                rank={rank}
                predictedBetAmount={predictedBetAmount}
              />
            </Suspense>
          </Box>
        );
      }

      case 1: {
        // "Trade" / CoHost
        return (
          <Suspense fallback={
            <Box sx={{ p: 4 }}>
              <Skeleton
                variant="rectangular"
                width="100%"
                height={200}
                sx={{ borderRadius: '4px' }}
              />
            </Box>
          }>
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
          <Box
            sx={{
              borderRadius: '8px',
              background: '#262626',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              overflow: 'hidden',
              mb: 2,
            }}
          >
            <Suspense fallback={
              <Box sx={{ p: 4 }}>
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={200}
                  sx={{ borderRadius: '4px' }}
                />
              </Box>
            }>
              <RoomHistory
                roomId={roomInfo._id}
                getRoomInfo={props.getRoomInfo}
                roomInfo={roomInfo}
                isLowGraphics={isLowGraphics}
              />
            </Suspense>
          </Box>
        );
      }

      case 3: {
        // "Comments"
        return (
          <Box
            sx={{
              borderRadius: '8px',
              background: '#262626',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              overflow: 'hidden',
              mb: 2,
            }}
          >
            <Suspense fallback={
              <Box sx={{ p: 4 }}>
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={200}
                  sx={{ borderRadius: '4px' }}
                />
              </Box>
            }>
              <Comments roomId={roomInfo._id} />
            </Suspense>
          </Box>
        );
      }

      default:
        return null;
    }
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <Box className="tabs-container">
        <Box
          sx={{
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
            mb: 2,
          }}
        >
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant="fullWidth"
            textColor="inherit"
            TabIndicatorProps={{
              style: {
                backgroundColor: '#ff0000',
                height: '2px',
              }
            }}
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.6)',
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'none',
                minHeight: 48,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  color: '#fff',
                },
                '&:hover': {
                  color: 'rgba(255, 255, 255, 0.8)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                },
              },
            }}
          >
            {tabConfig.map((tab, index) => (
              <Tab
                key={index}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FontAwesomeIcon
                      icon={tab.icon}
                      style={{
                        fontSize: '12px',
                        color: selectedTab === index ? tab.color : 'inherit',
                      }}
                    />
                    {tab.label}
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        {renderTabContent(selectedTab)}
      </Box>
    );
  }

  // Desktop Layout
  return (
    <Box>
      {/* Tab Control Bar */}
      <Box
        sx={{
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flex: 1 }}>
          {tabConfig.map((tab, index) => {
            const isActive = activeTabs.includes(index);
            return (
              <Tooltip
                key={index}
                title={tab.tooltip}
                placement="top"
                arrow
              >
                <Chip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FontAwesomeIcon
                        icon={tab.icon}
                        style={{
                          fontSize: '12px',
                          color: isActive ? '#fff' : tab.color,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      >
                        {tab.label}
                      </Typography>
                    </Box>
                  }
                  onClick={() => handleChipClick(index)}
                  clickable
                  variant={isActive ? 'filled' : 'outlined'}
                  size="small"
                  sx={{
                    height: 32,
                    backgroundColor: isActive ? tab.color : 'transparent',
                    borderColor: tab.color,
                    color: isActive ? '#fff' : tab.color,
                    fontWeight: 600,
                    border: `1px solid ${tab.color}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: isActive ? tab.color : `${tab.color}20`,
                    },
                    '& .MuiChip-label': {
                      padding: '0 8px',
                    },
                  }}
                />
              </Tooltip>
            );
          })}
        </Box>

        {/* Result Display for Desktop */}
        <Box sx={{ ml: 'auto' }}>
          {renderResultDisplay()}
        </Box>
      </Box>

      {/* Tab Content */}
      {activeTabs.map((tabIndex) => (
        <Box key={tabIndex}>
          {renderTabContent(tabIndex)}
        </Box>
      ))}
    </Box>
  );
}

export default TabbedContent;