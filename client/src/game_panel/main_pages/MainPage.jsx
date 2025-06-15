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
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ThemeProvider } from '@mui/material/styles';
import VerifiedIcon from '@mui/icons-material/Verified';
import {
  AutoAwesome as AutoAwesomeIcon,
  Add as AddIcon,
} from '@mui/icons-material';

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

const selectWalletBalance = (state) => {
  const liveWalletBalance = state?.auth?.liveWalletBalance ?? 0;
  const backendBalance = state?.auth?.user?.balance ?? 0;
  const walletAddress = state?.auth?.walletAddress;

  // Use live wallet balance if available, otherwise fall back to backend balance
  return {
    balance: walletAddress ? liveWalletBalance : backendBalance,
    isWalletBalance: Boolean(walletAddress),
    walletAddress
  };
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


// Redesigned CreateRoomPanel component with clean, compact design matching HistoryTable
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
    <Box
      className="create-room-btn-panel"
      sx={{
        width: '100%',
        maxWidth: 'none',
        padding: { xs: 1, sm: 2 },
        margin: 0,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box
        className="btn-create-room"
        sx={{
          width: '100%',
          maxWidth: { xs: 'none', sm: 400 },
        }}
      >
        {/* Clean Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1.5,
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            Create Room
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VerifiedIcon
              sx={{
                fontSize: '14px',
                color: isEliteUser 
                  ? (user.elite === 'red' ? '#ff0000' : '#e5e5e5')
                  : '#666',
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: isEliteUser
                  ? (user.elite === 'red' ? '#ff0000' : '#e5e5e5')
                  : '#666',
                fontWeight: 600,
                fontSize: '0.65rem',
                whiteSpace: 'nowrap',
              }}
            >
              {isEliteUser ? `${user.elite.toUpperCase()} ELITE` : 'ELITE ONLY'}
            </Typography>
          </Box>
        </Box>

        {/* Clean AI Prompt Input */}
        <Box
          sx={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            mb: 1,
            transition: 'all 0.2s ease',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 0, 0, 0.2)',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              variant="standard"
              placeholder="Create a crash-style game..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              size="small"
              fullWidth
              sx={{
                '& .MuiInput-underline': {
                  '&:before': { display: 'none' },
                  '&:after': { display: 'none' },
                },
                '& .MuiInputBase-input': {
                  color: '#fff',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  padding: 0,
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    opacity: 1,
                  },
                },
              }}
            />
            <Button
              variant="text"
              onClick={onPromptSubmit}
              disabled={!aiPrompt.trim()}
              sx={{
                minWidth: 'auto',
                padding: '4px 8px',
                color: aiPrompt.trim() ? '#ff0000' : '#666',
                fontSize: '0.75rem',
                fontWeight: 600,
                '&:hover': {
                  background: 'rgba(255, 0, 0, 0.1)',
                },
                '&:disabled': {
                  color: '#666',
                },
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: '16px' }} />
            </Button>
          </Box>
        </Box>

        {/* Clean Suggested Prompts */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.75,
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          {SUGGESTED_PROMPTS.map((prompt, index) => (
            <Chip
              key={index}
              label={prompt}
              onClick={() => handleSuggestedPromptClick(prompt)}
              size="small"
              sx={{
                height: '24px',
                fontSize: '0.65rem',
                fontWeight: 500,
                backgroundColor: 'transparent',
                color: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                maxWidth: { xs: '120px', sm: '150px' },
                '& .MuiChip-label': {
                  padding: '0 8px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  color: '#ff0000',
                  border: '1px solid rgba(255, 0, 0, 0.3)',
                },
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

function MainPage({ selectedMobileTab, setSelectedMobileTab }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

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
      // console.log('Creating pre-made game with prompt:', aiPrompt);
    } else {
      setOpenModal(true);
    }
  }, [user, dispatch, navigate, aiPrompt]);

  const shouldShowCreatePanel =
    (isMobile && selectedMobileTab === 'live_games' && showOpenGame !== 1) ||
    (!isMobile && selectedMainTabIndex === 0);

  const shouldShowOpenGames =
    ((!isMobile && selectedMainTabIndex === 0) ||
      (isMobile && selectedMobileTab === 'live_games' && showOpenGame === 0)) &&
    location.pathname !== '/portfolio';

  const shouldShowMyGames =
    selectedMobileTab === 'my_games' && showOpenGame === 0;

  const shouldShowHistory =
    isMobile && selectedMobileTab === 'live_games' && showOpenGame === 1;

  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');
  const walletData = useSelector(selectWalletBalance);


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
            PaperProps={{
              sx: {
                width: '100vw',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
              }
            }}
          >
            {/* Chat Header with Back Button */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              p: 2,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: '#1a1a1a',
              minHeight: '64px', // Match header height
            }}>
              <IconButton
                onClick={() => setSelectedMobileTab(MOBILE_TABS.LIVE_GAMES)}
                sx={{
                  color: '#fff',
                  mr: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <ArrowBackIcon />
              </IconButton>

              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                Chat
              </Typography>

            </Box>

            {/* Chat Content */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              {isSmallScreen && (
                <Suspense fallback={<Typography>Loading Chat...</Typography>}>
                  <ChatPanel toggleDrawer={handleToggleDrawer} is_mobile={isMobile} />
                </Suspense>
              )}
            </Box>
          </Drawer>
        )}

        {/* Elite Subscription Modal */}
        <Suspense fallback={null}>
          <EliteSubscriptionModal
            walletBalance={walletData.balance}
            isWalletBalance={walletData.isWalletBalance}
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

        <Footer className="footer" open={isDrawerOpen} />
      </Box>
    </ThemeProvider>
  );
}

export default MainPage;