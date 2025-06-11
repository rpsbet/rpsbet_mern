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
  Card,
  Fade,
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
import { yellow, blue, grey } from '@mui/material/colors';
import Lottie from 'react-lottie';
import progress from '../game_panel/LottieAnimations/progress.json';
import LoadingComponent from './LoadingComponent';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Tab configuration with icons and colors
  const tabConfig = [
    { 
      label: 'Play', 
      icon: faPlay, 
      color: '#4caf50',
      description: 'Start your game'
    },
    { 
      label: 'Trade', 
      icon: faChartLine, 
      color: '#2196f3',
      description: 'Manage investments'
    },
    { 
      label: 'History', 
      icon: faHistory, 
      color: '#ff9800',
      description: 'View past games'
    },
    { 
      label: 'Comments', 
      icon: faComments, 
      color: '#9c27b0',
      description: 'Community discussion'
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

  // Enhanced glassmorphism style
  const glassmorphismStyle = {
    background: 'rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    '@supports not (backdrop-filter: blur(20px))': {
      background: 'rgba(0, 0, 0, 0.35)',
    },
  };

  // Enhanced Result Display Component
  const renderResultDisplay = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Card
        sx={{
          ...glassmorphismStyle,
          p: isMobile ? 1.5 : 2,
          mt: isMobile ? 2 : 0,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          minWidth: isMobile ? '100%' : '240px',
          transition: 'all 0.2s ease',
          width: isMobile ? '100%' : 'auto',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: is_betting ? '-100%' : '100%',
            width: '100%',
            height: '100%',
            transition: 'left 1.5s ease-in-out',
            ...(is_betting && { left: '100%' }),
          },
        }}
      >
        {result !== '' ? (
          <Chip
            label={
              <Typography
                variant={isMobile ? 'caption' : 'body2'}
                sx={{ 
                  color: '#fff', 
                  fontWeight: 600,
                  letterSpacing: '0.2px',
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                }}
              >
                {result}
              </Typography>
            }
            sx={{
              bgcolor: 'rgba(66, 66, 66, 0.8)',
              color: '#fff',
              borderRadius: '10px',
              flexGrow: 1,
              height: isMobile ? 28 : 32,
              border: '1px solid rgba(145, 145, 145, 0.37)',
              boxShadow: '0 2px 8px rgba(100, 100, 100, 0.25)',
              '& .MuiChip-label': { 
                px: 1.5,
              },
            }}
          />
        ) : is_betting ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <Box sx={{ width: isMobile ? '32px' : '36px' }}>
              <Lottie
                options={{
                  loop: isLowGraphics ? false : true,
                  autoplay: isLowGraphics ? false : true,
                  animationData: progress,
                }}
              />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#fff',
                  fontWeight: 600,
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                }}
              >
                Processing...
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.65rem',
                  display: 'block',
                }}
              >
                Please wait
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 500,
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
              }}
            >
              Ready to Play
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.65rem',
                display: 'block',
              }}
            >
              Place your bet
            </Typography>
          </Box>
        )}
        
        <Badge
          badgeContent={
            is_betting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <FontAwesomeIcon 
                  icon={faBolt} 
                  style={{ 
                    color: '#ffd700', 
                    fontSize: '8px',
                    filter: 'drop-shadow(0 0 3px rgba(255, 215, 0, 0.6))',
                  }} 
                />
              </motion.div>
            ) : null
          }
          sx={{
            '& .MuiBadge-badge': {
              right: -4,
              top: 4,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              border: '1px solid rgba(255, 215, 0, 0.5)',
              borderRadius: '50%',
              p: 0.3,
              minWidth: 16,
              height: 16,
            },
          }}
        >
          <Avatar
            sx={{
              width: isMobile ? 28 : 32,
              height: isMobile ? 28 : 32,
              bgcolor: is_betting ? '#2196f3' : '#666',
              transition: 'all 0.2s ease',
              border: `1px solid ${is_betting ? 'rgba(33, 150, 243, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
              boxShadow: is_betting 
                ? '0 0 12px rgba(33, 150, 243, 0.3)' 
                : '0 2px 6px rgba(0, 0, 0, 0.2)',
            }}
          >
            <FontAwesomeIcon
              icon={is_betting ? faDice : faClock}
              style={{ 
                fontSize: isMobile ? '12px' : '14px', 
                color: '#fff',
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
              }}
            />
          </Avatar>
        </Badge>
      </Card>
    </motion.div>
  );

  const renderTabContent = (tabIndex) => {
    switch (tabIndex) {
      case 0: {
        // "Play" Tab
        if (!roomInfo || !roomInfo.game_type) {
          return <LoadingComponent />;
        }

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Card
              sx={{
                ...glassmorphismStyle,
                borderRadius: '0',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                mb: 2,
              }}
            >
              {/* Result Display for Mobile */}
              {isMobile && (
                <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  {renderResultDisplay()}
                </Box>
              )}

              <Suspense fallback={
                <Skeleton 
                  variant="rectangular" 
                  width="100%" 
                  height={300}
                 
                />
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
            </Card>
          </motion.div>
        );
      }

      case 1: {
        // "Trade" / CoHost
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Suspense fallback={
              <Skeleton 
                variant="rectangular" 
                width="100%" 
                height={200}
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '24px',
                }}
              />
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
          </motion.div>
        );
      }

      case 2: {
        // "History"
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Card
              sx={{
                ...glassmorphismStyle,
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                mb: 2,
              }}
            >
              <Suspense fallback={
                <Skeleton 
                  variant="rectangular" 
                  width="100%" 
                  height={200}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '24px',
                  }}
                />
              }>
                <RoomHistory
                  roomId={roomInfo._id}
                  getRoomInfo={props.getRoomInfo}
                  roomInfo={roomInfo}
                  isLowGraphics={isLowGraphics}
                />
              </Suspense>
            </Card>
          </motion.div>
        );
      }

      case 3: {
        // "Comments"
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Card
              sx={{
                ...glassmorphismStyle,
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                mb: 2,
              }}
            >
              <Suspense fallback={
                <Skeleton 
                  variant="rectangular" 
                  width="100%" 
                  height={200}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '24px',
                  }}
                />
              }>
                <Comments roomId={roomInfo._id} />
              </Suspense>
            </Card>
          </motion.div>
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
        <Card
          sx={{
            ...glassmorphismStyle,
            overflow: 'hidden',
            mb: 0,
          }}
        >
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant="fullWidth"
            textColor="inherit"
            TabIndicatorProps={{ 
              style: { 
                background: 'linear-gradient(90deg, #f44336, #ff5722)',
                height: '3px',
                borderRadius: '2px',
              } 
            }}
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 600,
                fontSize: '0.85rem',
                textTransform: 'none',
                minHeight: 64,
                transition: 'all 0.3s ease',
                '&.Mui-selected': {
                  color: '#fff',
                },
                '&:hover': {
                  color: 'rgba(255, 255, 255, 0.9)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
              },
            }}
          >
            {tabConfig.map((tab, index) => (
              <Tab 
                key={index}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FontAwesomeIcon 
                      icon={tab.icon} 
                      style={{ 
                        fontSize: '14px',
                        color: selectedTab === index ? tab.color : 'inherit',
                      }} 
                    />
                    {tab.label}
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Card>

        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent(selectedTab)}
          </motion.div>
        </AnimatePresence>
      </Box>
    );
  }

  // Desktop Layout
  return (
    <Box>
      {/* Tab Control Bar */}
      <Card
        sx={{
          ...glassmorphismStyle,
          p: 2.5,
          mb: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.75,
          flexWrap: 'wrap',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.75, flexWrap: 'wrap', flex: 1 }}>
          {tabConfig.map((tab, index) => {
            const isActive = activeTabs.includes(index);
            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Chip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875 }}>
                      <FontAwesomeIcon 
                        icon={tab.icon} 
                        style={{ 
                          fontSize: '13px',
                          color: isActive ? '#fff' : tab.color,
                        }} 
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          letterSpacing: '0.25px',
                          fontSize: '0.85rem',
                        }}
                      >
                        {tab.label}
                      </Typography>
                    </Box>
                  }
                  onClick={() => handleChipClick(index)}
                  clickable
                  variant={isActive ? 'filled' : 'outlined'}
                  sx={{
                    height: 40,
                    borderRadius: '14px',
                    backgroundColor: isActive ? tab.color : 'transparent',
                    borderColor: tab.color,
                    color: isActive ? '#fff' : tab.color,
                    fontWeight: 600,
                    border: `1.5px solid ${tab.color}`,
                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    boxShadow: isActive 
                      ? `0 4px 12px ${tab.color}40` 
                      : '0 1px 4px rgba(0, 0, 0, 0.1)',
                    '&:hover': {
                      backgroundColor: isActive ? tab.color : `${tab.color}20`,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 6px 16px ${tab.color}50`,
                    },
                    '& .MuiChip-label': {
                      px: 1.75,
                    },
                  }}
                />
              </motion.div>
            );
          })}
        </Box>
  
        {/* Result Display for Desktop */}
        <Box sx={{ ml: 'auto' }}>
          {renderResultDisplay()}
        </Box>
      </Card>
  
      {/* Tab Content */}
      <AnimatePresence>
        {activeTabs.map((tabIndex) => (
          <motion.div
            key={tabIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {renderTabContent(tabIndex)}
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  );
}

export default TabbedContent;