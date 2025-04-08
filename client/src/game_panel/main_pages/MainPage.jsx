import React, { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  getMyChat,
} from '../../redux/Logic/logic.actions';
import { useNavigate, useLocation } from 'react-router-dom';
import { toggleDrawer } from '../../redux/Auth/user.actions';
import { Add, Remove } from '@mui/icons-material';
import {
  Button,
  Tabs,
  Tab,
  Drawer,
  Box,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faStore, faLink } from '@fortawesome/free-solid-svg-icons';
import DrawerButton from './DrawerButton';
import SupportButton from './SupportButton';
import Footer from './Footer';

// Lazy-load components
const MyGamesTable = lazy(() => import('../MyGames/MyGamesTable'));
const OpenGamesTable = lazy(() => import('../LiveGames/OpenGamesTable'));
const HistoryTable = lazy(() => import('../LiveGames/HistoryTable'));
const ProductPage = lazy(() => import('../../admin_panel/app/ProductPages/ProductSerchPage/ProductPage.jsx'));
const BankPage = lazy(() => import('../../admin_panel/app/ProductPages/ProductSerchPage/BankPage.jsx'));
const ChatPanel = lazy(() => import('../ChatPanel/ChatPanel'));

function MainPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Redux state
  const {
    isAuthenticated,
    roomList,
    balance,
    user,
    isDrawerOpen,
    selectedMainTabIndex,
    isDarkMode,
    onlineUserList,
    gameTypeList,
    pageNumber,
  } = useSelector((state) => ({
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
  }));

  // Local state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [selectedMobileTab, setSelectedMobileTab] = useState('live_games');
  const [showOpenGame, setShowOpenGame] = useState(0);
  const [selectedGameType, setSelectedGameType] = useState('All');
  const [showP2PLending, setShowP2PLending] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [showPlayerModal, setShowPlayerModal] = useState(false);

  const isMountedRef = useRef(false);
  const prevLocationRef = useRef(location.pathname);
  const isSmallScreen = useMediaQuery('(max-width:1024px)');

  // Lifecycle effects
  useEffect(() => {
    isMountedRef.current = true;

    if (window.location.pathname === '/portfolio') {
      setSelectedMobileTab('my_games');
      setShowOpenGame(0);
    }

    if (isAuthenticated) {
      dispatch(getMyChat());
    }

    if (isMobile && !isDrawerOpen) {
      handleToggleDrawer();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [isAuthenticated, isMobile, isDrawerOpen, dispatch]);

  useEffect(() => {
    if (
      location.pathname === '/portfolio' &&
      location.pathname !== prevLocationRef.current
    ) {
      setSelectedMobileTab('my_games');
      setShowOpenGame(0);
    } else if (
      location.pathname === '/' &&
      location.pathname !== prevLocationRef.current
    ) {
      setShowOpenGame(1);
    }
    prevLocationRef.current = location.pathname;
  }, [location.pathname]);

  // Handlers
  const toggleP2PLending = () => {
    setShowP2PLending((prev) => !prev);
    setShowMarketplace(false);
  };

  const toggleMarketplace = () => {
    setShowMarketplace((prev) => !prev);
    setShowP2PLending(false);
  };

  const handleOpenPlayerModal = (creatorId) => {
    setShowPlayerModal(true);
    setSelectedCreator(creatorId);
  };

  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
  };

  const handleToggleDrawer = useCallback(() => {
    dispatch(toggleDrawer(!isDrawerOpen));
  }, [dispatch, isDrawerOpen]);

  const handleCreateBtnClicked = () => {
    navigate('/create');
  };

  // UI Helpers
  const getActiveTabText = () => {
    if (selectedMobileTab === 'marketplace') {
      return null;
    }

    const totalUserBet = roomList.reduce((total, room) => {
      return total + (room.user_bet || 0);
    }, 0);

    if (
      (isMobile && selectedMobileTab === 'live_games' && showOpenGame !== 1) ||
      (!isMobile && selectedMainTabIndex === 0)
    ) {
      return (
        <div className="create-room-btn-panel">
          <Button
            variant="text"
            color="error"
            className="btn-create-room"
            onClick={handleCreateBtnClicked}
          >
            CREATE A GAME +
          </Button>
        </div>
      );
    }

    return 'Your Games';
  };

  // Render
  return (
    <Box className="main-game">
      {/* Chat Drawer */}
      {isMobile && selectedMobileTab === 'chat' && (
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

      {/* Marketplace and P2P Lending Toggles */}
      {isMobile && selectedMobileTab === 'marketplace' && (
        <Box sx={{ p: '30px' }}>
          {/* CENTRAL BANK */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Button
              color="error"
              sx={{
                width: '100%',
                py: '60px',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={toggleP2PLending}
            >
              {showP2PLending ? <Remove /> : <Add />}
              <Typography variant="h6" className="title" sx={{ mt: 1 }}>
                <FontAwesomeIcon icon={faCoins} className="mr-2" />
                CENTRAL BANK
              </Typography>
            </Button>
            {showP2PLending && (
              <Suspense fallback={<Typography>Loading Bank...</Typography>}>
                <BankPage />
              </Suspense>
            )}
          </Box>

          {/* MARKETPLACE */}
          <Box sx={{ textAlign: 'center' }}>
            <Button
              color="error"
              sx={{
                width: '100%',
                py: '60px',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={toggleMarketplace}
            >
              {showMarketplace ? <Remove /> : <Add />}
              <Typography variant="h6" className="title" sx={{ mt: 1 }}>
                <FontAwesomeIcon icon={faStore} className="mr-2" />
                Marketplace
              </Typography>
            </Button>
            {showMarketplace && (
              <Suspense fallback={<Typography>Loading Marketplace...</Typography>}>
                <ProductPage />
              </Suspense>
            )}
          </Box>
        </Box>
      )}

      <Box className="main-panel" style={{ overflowX: 'hidden' }}>
        <h2 className="main-title">{getActiveTabText()}</h2>

        {/* Open Games */}
        {((!isMobile && selectedMainTabIndex === 0) ||
          (isMobile &&
            selectedMobileTab === 'live_games' &&
            showOpenGame === 0)) &&
          location.pathname !== '/portfolio' && (
            <Suspense fallback={<Typography>Loading Games...</Typography>}>
              <OpenGamesTable
                selectedCreator={selectedCreator}
                refreshing={refreshing}
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

        {/* My Games */}
        {selectedMobileTab === 'my_games' && showOpenGame === 0 && (
          <Suspense fallback={<Typography>Loading Your Games...</Typography>}>
            <MyGamesTable />
          </Suspense>
        )}

        {/* History */}
        {isMobile &&
          selectedMobileTab === 'live_games' &&
          showOpenGame === 1 && (
            <Suspense fallback={<Typography>Loading History...</Typography>}>
              <HistoryTable userId={user._id} />
            </Suspense>
          )}

        <DrawerButton open={isDrawerOpen} toggleDrawer={handleToggleDrawer} />
      </Box>

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <div className="mobile-only main-page-nav-button-group">
          <Button
            className={`mobile-tab-live ${selectedMobileTab === 'live_games' ? 'active' : ''}`}
            onClick={() => setSelectedMobileTab('live_games')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="none"
              viewBox="0 0 32 32"
            >
              <path
                stroke={selectedMobileTab === 'live_games' ? '#fff' : '#8E9297'}
                strokeWidth="1.5"
                d="M24.9 25.945c2.625-2.578 4.1-6.076 4.1-9.722 0-3.647-1.475-7.144-4.1-9.723M7.1 25.945C4.476 23.367 3 19.87 3 16.223 3 12.576 4.475 9.079 7.1 6.5M21 22.5c1.92-1.658 3-3.906 3-6.25s-1.08-4.592-3-6.25M14 17.678v-3.356c0-.79.871-1.268 1.537-.844l2.637 1.678c.618.393.618 1.295 0 1.688l-2.637 1.678c-.666.424-1.537-.055-1.537-.844zM11 22.5c-1.92-1.658-3-3.906-3-6.25s1.08-4.592 3-6.25"
              />
            </svg>
            {selectedMobileTab === 'live_games' && 'LIVE GAMES'}
          </Button>

          <Button
            className={`mobile-tab-my ${selectedMobileTab === 'my_games' ? 'active' : ''}`}
            onClick={() => setSelectedMobileTab('my_games')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="33"
              height="32"
              fill="none"
              viewBox="0 0 33 32"
            >
              <path
                stroke={selectedMobileTab === 'my_games' ? '#fff' : '#8E9297'}
                strokeWidth="1.5"
                d="M27.5 27.5c0-2.917-1.159-5.715-3.222-7.778-2.063-2.063-4.86-3.222-7.778-3.222-2.917 0-5.715 1.159-7.778 3.222C6.659 21.785 5.5 24.582 5.5 27.5"
              />
              <path
                fill={selectedMobileTab === 'my_games' ? '#fff' : '#8E9297'}
                d="M18.651 12.702l-.674.33.674-.33zm-.294-.602l.674-.33c-.126-.257-.387-.42-.674-.42v.75zm-3.714 0v-.75c-.287 0-.548.163-.674.42l.674.33zm7.607-4.75v4.302h1.5V7.35h-1.5zm-2.925 5.022l-.294-.601-1.348.658.294.602 1.348-.659zm-.968-1.022h-3.714v-1.5h3.714v-1.5zm-4.388.42l-.294.602 1.348.66.294-.603-1.348-.658zm-3.219-.118V7.35h-1.5v4.302h1.5zm2.036-6.402h7.428v-1.5h-7.428v1.5zm-.49 8c-.838 0-1.546-.7-1.546-1.598h-1.5c0 1.695 1.348 3.098 3.046 3.098v-1.5zm8.408 0c-.576 0-1.113-.333-1.379-.878l-1.348.66c.512 1.046 1.565 1.718 2.727 1.718v-1.5zm1.546-1.598c0 .899-.708 1.598-1.546 1.598v1.5c1.698 0 3.046-1.403 3.046-3.098h-1.5zm-8.575.72c-.266.545-.803.878-1.38.878v1.5c1.163 0 2.216-.672 2.728-1.719l-1.348-.659zM23.75 7.35c0-1.972-1.567-3.6-3.536-3.6v1.5c1.109 0 2.036.924 2.036 2.1h1.5zm-13 0c0-1.176.928-2.1 2.036-2.1v-1.5c-1.969 0-3.536 1.628-3.536 3.6h1.5zm1.571 1.7h2.786v-1.5h-2.786v1.5zm.643-2.175v2.85h1.5v-2.85h-1.5zM19.75 8.1h.929V6.6h-.929v1.5zM17.893 10h.928V8.5h-.928V10z"
              />
            </svg>
            {selectedMobileTab === 'my_games' && 'YOUR GAMES'}
          </Button>

          <Button
            className={`mobile-tab-marketplace ${selectedMobileTab === 'marketplace' ? 'active' : ''}`}
            onClick={() => setSelectedMobileTab('marketplace')}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M25 14L21.5 7L18 14H25Z"
                fill={selectedMobileTab === 'marketplace' ? '#fff' : '#8E9297'}
                stroke="#EEEEEC"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M7 18.25L13.75 25"
                fill={selectedMobileTab === 'marketplace' ? '#fff' : '#8E9297'}
                stroke="#ECEDEE"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M13.75 18.25L7 25"
                fill={selectedMobileTab === 'marketplace' ? '#fff' : '#8E9297'}
                stroke="#ECEDEE"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <rect
                x="7"
                y="7"
                width="7"
                height="7"
                rx="1"
                fill="#FFA7A7"
                stroke="#ECEDEE"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle
                cx="21.5"
                cy="21.5"
                r="3.5"
                fill={selectedMobileTab === 'marketplace' ? '#fff' : '#8E9297'}
                stroke="#ECEDEE"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            {selectedMobileTab === 'marketplace' && 'ASSETS'}
          </Button>

          <Button
            className={`mobile-tab-chat ${selectedMobileTab === 'chat' ? 'active' : ''}`}
            onClick={() => setSelectedMobileTab('chat')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="33"
              height="32"
              fill="none"
              viewBox="0 0 33 32"
            >
              <path
                stroke={selectedMobileTab === 'chat' ? '#fff' : '#8E9297'}
                strokeWidth="1.5"
                d="M28 16c0 6.351-5.149 11.5-11.5 11.5-1.407 0-2.754-.253-4-.715-2.75-1.02-4.091 1.378-4.75.965-.685-.43 1.328-2.929.75-3.489C6.342 22.171 5 19.242 5 16 5 9.649 10.149 4.5 16.5 4.5S28 9.649 28 16z"
              />
              <circle
                cx="10.5"
                cy="16"
                r="2"
                stroke={selectedMobileTab === 'chat' ? '#fff' : '#8E9297'}
                strokeWidth="1.5"
              />
              <circle
                cx="16.5"
                cy="16"
                r="2"
                stroke={selectedMobileTab === 'chat' ? '#fff' : '#8E9297'}
                strokeWidth="1.5"
              />
              <circle
                cx="22.5"
                cy="16"
                r="2"
                stroke={selectedMobileTab === 'chat' ? '#fff' : '#8E9297'}
                strokeWidth="1.5"
              />
            </svg>
            {selectedMobileTab === 'chat' && 'CHAT'}
          </Button>
        </div>
      )}

      <Footer className="footer" open={isDrawerOpen} />
    </Box>
  );
}

export default MainPage;