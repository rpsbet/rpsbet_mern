import React, { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Button,
  Chip,
  TextField,
  Drawer,
  Box,
  InputAdornment,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faStore, faHome } from '@fortawesome/free-solid-svg-icons';
import {
  AutoAwesome as AutoAwesomeIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import Lottie from 'react-lottie';

// Actions
import {
  getMyChat,
  submitAiPrompt,
  goToCreate,
} from '../../redux/Logic/logic.actions';
import { toggleDrawer } from '../../redux/Auth/user.actions';

// Components
import DrawerButton from './DrawerButton';
import Footer from './Footer';
import { getCustomTheme } from '../../config/theme';
import verified from '../LottieAnimations/verified.json';

// Lazy-loaded components
const MyGamesTable = lazy(() => import('../MyGames/MyGamesTable'));
const OpenGamesTable = lazy(() => import('../LiveGames/OpenGamesTable'));
const HistoryTable = lazy(() => import('../LiveGames/HistoryTable'));
const ChatPanel = lazy(() => import('../ChatPanel/ChatPanel'));
const EliteSubscriptionModal = lazy(() => import('../modal/EliteSubscriptionModal'));

// Constants
const SUGGESTED_PROMPTS = [
  "Create a dice roll game",
  "Create a pokemon-battling game where player wins 2x if they beat the house",
  "Make a stock-simulator game where user starts with $50k balance and add 3 stocks to choose from that fluctuate in price, user has to select one and sell at the right time, whatever they win compared to original is their multiplier.",
  "Rig a game of chance",
];

const MOBILE_TABS = {
  LIVE_GAMES: 'live_games',
  MY_GAMES: 'my_games',
  CHAT: 'chat',
};

// Custom hooks
const useMainPageState = () => {
  const location = useLocation();
  
  return useSelector((state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    roomList: state.logic.roomList,
    balance: state.auth.balance,
    user: state.auth.user,
    isDarkMode: state.auth.isDarkMode,
    onlineUserList: state.logic.onlineUserList,
    isDrawerOpen: state.auth.isDrawerOpen,
    gameTypeList: state.logic.gameTypeList,
    selectedMainTabIndex: state.logic.selectedMainTabIndex,
    pageNumber: state.logic.pageNumber,
    isLowGraphics: state.auth.isLowGraphics,
  }));
};

// Styled components
const CreateRoomPanel = ({ 
  user, 
  aiPrompt, 
  setAiPrompt, 
  onPromptSubmit, 
  onCreatePreMade, 
  isLowGraphics 
}) => {
  const isEliteUser = user?.elite === 'red' || user?.elite === 'black';

  const handleSuggestedPromptClick = (prompt) => {
    setAiPrompt(prompt);
    setTimeout(() => onPromptSubmit(), 100);
  };

  return (
    <Box className="create-room-btn-panel">
      
      <Box
        className="btn-create-room"
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 400,
          zIndex: 1,
        }}
      >
        {/* Header */}
        <Typography 
          variant="h6" 
          className="title" 
          sx={{ 
            mb: 2, 
            display: 'flex', 
            alignItems: 'center',
            gap: 1,
          }}
        >
          <FontAwesomeIcon icon={faHome} />
          Be The House👇😼
          
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            <Box
              sx={{
                width: 22,
                height: 'auto',
                transform: 'scale(0.6)',
                filter: user?.elite === 'black' ? 'grayscale(1)' : 'hue-rotate(132deg)',
              }}
            >
              <Lottie
                options={{
                  loop: !isLowGraphics,
                  autoplay: !isLowGraphics,
                  animationData: verified,
                }}
                style={{ width: '100%', height: '100%' }}
              />
            </Box>
            <Typography
              variant="caption"
              sx={{
                color: isEliteUser 
                  ? (user.elite === 'red' ? '#ff0000' : '#e5e5e5')
                  : '#ff0000',
                fontWeight: 'bold',
                fontSize: '0.7rem',
              }}
            >
              {isEliteUser ? `${user.elite.toUpperCase()} ELITE USER` : 'ELITE USERS ONLY'}
            </Typography>
          </Box>
        </Typography>

        {/* AI Prompt Input */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(216, 23, 25, 0.1)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(216, 23, 25, 0.2)',
            borderRadius: 2,
            p: 1,
            mb: 1.5,
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'rgba(216, 23, 25, 0.15)',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(216, 23, 25, 0.1)',
            },
          }}
        >
          <TextField
            variant="outlined"
            placeholder="Create a crash-style game..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            size="small"
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'transparent',
                '& fieldset': { border: 'none' },
                '&:hover fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: 'none' },
              },
              '& .MuiInputBase-input': {
                color: '#d81719',
                fontWeight: 'bold',
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    variant="contained"
                    disableElevation
                    onClick={onPromptSubmit}
                    sx={{
                      minWidth: 'auto',
                      p: 0.75,
                      background: 'rgba(216, 23, 25, 0.2)',
                      color: '#d81719',
                      '&:hover': {
                        background: 'rgba(216, 23, 25, 0.4)',
                      },
                    }}
                  >
                    <AutoAwesomeIcon />
                  </Button>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Suggested Prompts */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            mb: 1.5,
          }}
        >
          {SUGGESTED_PROMPTS.map((prompt, index) => (
            <Chip
              key={index}
              label={prompt}
              onClick={() => handleSuggestedPromptClick(prompt)}
              sx={{
                background: 'rgba(216, 23, 25, 0.08)',
                border: '1px solid rgba(216, 23, 25, 0.15)',
                color: '#d81719',
                fontWeight: 500,
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                maxWidth: 180,
                '& .MuiChip-label': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                },
                '&:hover': {
                  background: 'rgba(216, 23, 25, 0.2)',
                  transform: 'translateY(-1px)',
                },
              }}
            />
          ))}
        </Box>

       
      </Box>
    </Box>
  );
};

const MobileNavButton = ({ isActive, onClick, icon, label }) => (
  <Button
    className={`mobile-tab ${isActive ? 'active' : ''}`}
    onClick={onClick}
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0.5,
      minWidth: 0,
      flex: 1,
    }}
  >
    {icon}
    {isActive && (
      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
        {label}
      </Typography>
    )}
  </Button>
);

function MainPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Custom hook for Redux state
  const state = useMainPageState();
  const {
    isAuthenticated,
    roomList,
    balance,
    user,
    isDarkMode,
    onlineUserList,
    isDrawerOpen,
    gameTypeList,
    selectedMainTabIndex,
    pageNumber,
    isLowGraphics,
  } = state;

  // Local state
  const [selectedMobileTab, setSelectedMobileTab] = useState(MOBILE_TABS.LIVE_GAMES);
  const [showOpenGame, setShowOpenGame] = useState(0);
  const [selectedGameType, setSelectedGameType] = useState('All');
  const [selectedCreator, setSelectedCreator] = useState('');
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [openModal, setOpenModal] = useState(false);

  // Refs and media queries
  const isMountedRef = useRef(false);
  const prevLocationRef = useRef(location.pathname);
  const isSmallScreen = useMediaQuery('(max-width:1024px)');
  const isMobile = isSmallScreen;

  // Lifecycle effects
  useEffect(() => {
    isMountedRef.current = true;

    // Route-based state updates
    if (location.pathname === '/portfolio') {
      setSelectedMobileTab(MOBILE_TABS.MY_GAMES);
      setShowOpenGame(0);
    } else if (location.pathname === '/' && location.pathname !== prevLocationRef.current) {
      setShowOpenGame(1);
    }

    // Authentication-based effects
    if (isAuthenticated) {
      dispatch(getMyChat());
    }

    // Drawer management for mobile
    if (isMobile && !isDrawerOpen) {
      handleToggleDrawer();
    }

    prevLocationRef.current = location.pathname;

    return () => {
      isMountedRef.current = false;
    };
  }, [isAuthenticated, isMobile, isDrawerOpen, dispatch, location.pathname]);

  // Event handlers
  const handleToggleDrawer = useCallback(() => {
    dispatch(toggleDrawer(!isDrawerOpen));
  }, [dispatch, isDrawerOpen]);

  const handleOpenPlayerModal = useCallback((creatorId) => {
    setShowPlayerModal(true);
    setSelectedCreator(creatorId);
  }, []);

  const handleClosePlayerModal = useCallback(() => {
    setShowPlayerModal(false);
  }, []);

  const handleAiPromptSubmit = useCallback(async () => {
    if (aiPrompt.trim()) {
      if (user?.elite === 'red' || user?.elite === 'black') {
        dispatch(submitAiPrompt(aiPrompt, navigate));
      } else {
        setOpenModal(true);
      }
    }
  }, [aiPrompt, user, dispatch, navigate]);

  const handleCreatePreMadeGame = useCallback(() => {
    if (user?.elite === 'red' || user?.elite === 'black') {
      dispatch(goToCreate(navigate, aiPrompt));
      console.log('Creating pre-made game with prompt:', aiPrompt);
    } else {
      setOpenModal(true);
    }
  }, [user, dispatch, navigate, aiPrompt]);

  const shouldShowCreatePanel = 
    (isMobile && selectedMobileTab === MOBILE_TABS.LIVE_GAMES && showOpenGame !== 1) ||
    (!isMobile && selectedMainTabIndex === 0);

  const shouldShowOpenGames = 
    ((!isMobile && selectedMainTabIndex === 0) ||
     (isMobile && selectedMobileTab === MOBILE_TABS.LIVE_GAMES && showOpenGame === 0)) &&
    location.pathname !== '/portfolio';

  const shouldShowMyGames = 
    selectedMobileTab === MOBILE_TABS.MY_GAMES && showOpenGame === 0;

  const shouldShowHistory = 
    isMobile && selectedMobileTab === MOBILE_TABS.LIVE_GAMES && showOpenGame === 1;

  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  return (
    <ThemeProvider theme={theme}>
      <Box className="main-game">
        {/* Chat Drawer */}
        {isMobile && selectedMobileTab === MOBILE_TABS.CHAT && (
          <Drawer
            className="mat-chat"
            style={{ display: isDrawerOpen && isSmallScreen ? 'flex' : 'none' }}
            variant="persistent"
            anchor="left"
            open={isSmallScreen && isDrawerOpen}
          >
            {isSmallScreen && (
              <Suspense fallback={<Typography>Loading Chat...</Typography>}>
                <ChatPanel toggleDrawer={handleToggleDrawer} is_mobile={isMobile} />
              </Suspense>
            )}
          </Drawer>
        )}

        {/* Elite Subscription Modal */}
        <Suspense fallback={null}>
          <EliteSubscriptionModal 
            user={user} 
            isLowGraphics={isLowGraphics} 
            open={openModal} 
            onClose={() => setOpenModal(false)} 
          />
        </Suspense>

        <Box className="main-panel" style={{ overflowX: 'hidden' }}>
          {/* Create Room Panel */}
          {shouldShowCreatePanel && (
            <CreateRoomPanel
              user={user}
              aiPrompt={aiPrompt}
              setAiPrompt={setAiPrompt}
              onPromptSubmit={handleAiPromptSubmit}
              onCreatePreMade={handleCreatePreMadeGame}
              isLowGraphics={isLowGraphics}
            />
          )}

          {/* Open Games Table */}
          {shouldShowOpenGames && (
            <Suspense fallback={<Typography sx={{ ml: 3 }}>Loading Games...</Typography>}>
              <OpenGamesTable
                selectedCreator={selectedCreator}
                showPlayerModal={showPlayerModal}
                handleOpenPlayerModal={handleOpenPlayerModal}
                handleClosePlayerModal={handleClosePlayerModal}
                roomList={roomList}
                isAuthenticated={isAuthenticated}
                pageNumber={pageNumber}
                balance={balance}
                isDarkMode={isDarkMode}
                selectedGameType={selectedGameType}
                onlineUserList={onlineUserList}
                gameTypeList={gameTypeList}
              />
            </Suspense>
          )}

          {/* My Games Table */}
          {shouldShowMyGames && (
            <Suspense fallback={<Typography>Loading Your Games...</Typography>}>
              <MyGamesTable />
            </Suspense>
          )}

          {/* History Table */}
          {shouldShowHistory && (
            <Suspense fallback={<Typography>Loading History...</Typography>}>
              <HistoryTable userId={user._id} />
            </Suspense>
          )}

          <DrawerButton open={isDrawerOpen} toggleDrawer={handleToggleDrawer} />
        </Box>

        {/* Mobile Bottom Navigation */}
        {isMobile && selectedMobileTab !== MOBILE_TABS.CHAT && (
          <Box className="mobile-only main-page-nav-button-group">
            <MobileNavButton
              isActive={selectedMobileTab === MOBILE_TABS.LIVE_GAMES}
              onClick={() => setSelectedMobileTab(MOBILE_TABS.LIVE_GAMES)}
              label="BEAT THE HOUSE"
              icon={
                <svg width="32" height="32" fill="none" viewBox="0 0 32 32">
                  <path
                    stroke={selectedMobileTab === MOBILE_TABS.LIVE_GAMES ? '#fff' : '#8E9297'}
                    strokeWidth="1.5"
                    d="M24.9 25.945c2.625-2.578 4.1-6.076 4.1-9.722 0-3.647-1.475-7.144-4.1-9.723M7.1 25.945C4.476 23.367 3 19.87 3 16.223 3 12.576 4.475 9.079 7.1 6.5M21 22.5c1.92-1.658 3-3.906 3-6.25s-1.08-4.592-3-6.25M14 17.678v-3.356c0-.79.871-1.268 1.537-.844l2.637 1.678c.618.393.618 1.295 0 1.688l-2.637 1.678c-.666.424-1.537-.055-1.537-.844zM11 22.5c-1.92-1.658-3-3.906-3-6.25s1.08-4.592 3-6.25"
                  />
                </svg>
              }
            />

            <MobileNavButton
              isActive={selectedMobileTab === MOBILE_TABS.MY_GAMES}
              onClick={() => setSelectedMobileTab(MOBILE_TABS.MY_GAMES)}
              label="YOUR GAMES"
              icon={
                <svg width="33" height="32" fill="none" viewBox="0 0 33 32">
                  <path
                    stroke={selectedMobileTab === MOBILE_TABS.MY_GAMES ? '#fff' : '#8E9297'}
                    strokeWidth="1.5"
                    d="M27.5 27.5c0-2.917-1.159-5.715-3.222-7.778-2.063-2.063-4.86-3.222-7.778-3.222-2.917 0-5.715 1.159-7.778 3.222C6.659 21.785 5.5 24.582 5.5 27.5"
                  />
                  <path
                    fill={selectedMobileTab === MOBILE_TABS.MY_GAMES ? '#fff' : '#8E9297'}
                    d="M18.651 12.702l-.674.33.674-.33zm-.294-.602l.674-.33c-.126-.257-.387-.42-.674-.42v.75zm-3.714 0v-.75c-.287 0-.548.163-.674.42l.674.33zm7.607-4.75v4.302h1.5V7.35h-1.5zm-2.925 5.022l-.294-.601-1.348.658.294.602 1.348-.659zm-.968-1.022h-3.714v-1.5h3.714v-1.5zm-4.388.42l-.294.602 1.348.66.294-.603-1.348-.658zm-3.219-.118V7.35h-1.5v4.302h1.5zm2.036-6.402h7.428v-1.5h-7.428v1.5zm-.49 8c-.838 0-1.546-.7-1.546-1.598h-1.5c0 1.695 1.348 3.098 3.046 3.098v-1.5zm8.408 0c-.576 0-1.113-.333-1.379-.878l-1.348.66c.512 1.046 1.565 1.718 2.727 1.718v-1.5zm1.546-1.598c0 .899-.708 1.598-1.546 1.598v1.5c1.698 0 3.046-1.403 3.046-3.098h-1.5zm-8.575.72c-.266.545-.803.878-1.38.878v1.5c1.163 0 2.216-.672 2.728-1.719l-1.348-.659zM23.75 7.35c0-1.972-1.567-3.6-3.536-3.6v1.5c1.109 0 2.036.924 2.036 2.1h1.5zm-13 0c0-1.176.928-2.1 2.036-2.1v-1.5c-1.969 0-3.536 1.628-3.536 3.6h1.5zm1.571 1.7h2.786v-1.5h-2.786v1.5zm.643-2.175v2.85h1.5v-2.85h-1.5zM19.75 8.1h.929V6.6h-.929v1.5zM17.893 10h.928V8.5h-.928V10z"
                  />
                </svg>
              }
            />

            <MobileNavButton
              isActive={selectedMobileTab === MOBILE_TABS.CHAT}
              onClick={() => setSelectedMobileTab(MOBILE_TABS.CHAT)}
              label="CHAT"
              icon={
                <svg width="33" height="32" fill="none" viewBox="0 0 33 32">
                  <path
                    stroke={selectedMobileTab === MOBILE_TABS.CHAT ? '#fff' : '#8E9297'}
                    strokeWidth="1.5"
                    d="M28 16c0 6.351-5.149 11.5-11.5 11.5-1.407 0-2.754-.253-4-.715-2.75-1.02-4.091 1.378-4.75.965-.685-.43 1.328-2.929.75-3.489C6.342 22.171 5 19.242 5 16 5 9.649 10.149 4.5 16.5 4.5S28 9.649 28 16z"
                  />
                  <circle cx="10.5" cy="16" r="2" stroke={selectedMobileTab === MOBILE_TABS.CHAT ? '#fff' : '#8E9297'} strokeWidth="1.5" />
                  <circle cx="16.5" cy="16" r="2" stroke={selectedMobileTab === MOBILE_TABS.CHAT ? '#fff' : '#8E9297'} strokeWidth="1.5" />
                  <circle cx="22.5" cy="16" r="2" stroke={selectedMobileTab === MOBILE_TABS.CHAT ? '#fff' : '#8E9297'} strokeWidth="1.5" />
                </svg>
              }
            />
          </Box>
        )}

        <Footer className="footer" open={isDrawerOpen} />
      </Box>
    </ThemeProvider>
  );
}

export default MainPage;