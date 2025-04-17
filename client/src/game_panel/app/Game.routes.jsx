import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, useParams, useLocation } from 'react-router-dom';
import { Box, LinearProgress } from '@mui/material';

import CreateGame from '../main_pages/CreateGame';
import SiteWrapper from '../SiteWrapper';
import MainPage from '../main_pages/MainPage';
import JoinGame from '../main_pages/JoinGame';
import ChatPage from '../MyGames/ChatPage';
import LeaderboardsModal from '../modal/LeaderboardsModal';
import MyGames from '../MyGames/MyGamesTable';
import ChatPanel from '../ChatPanel/ChatPanel';
import { getSolToUsdPrice } from '../../redux/Logic/logic.actions';

function GameMainRoute() {
  const isDrawerOpen = useSelector((state) => state.auth.isDrawerOpen);
  const isMobile = window.innerWidth < 1024;
  const dispatch = useDispatch();
  const params = useParams();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    dispatch(getSolToUsdPrice()).then(() => {
      setTimeout(() => setIsLoading(false), 500);
    });

    return () => setIsLoading(true);
  }, [dispatch, location.pathname]);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: isDrawerOpen && !isMobile ? '260px auto' : '1fr',
        height: '100vh',
      }}
    >
      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '4px',
            background: 'rgba(0, 0, 0, 0.2)',
            zIndex: 2000,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: '100vw',
              height: '100%',
              background: 'linear-gradient(to right,rgb(210, 25, 25),rgb(245, 66, 66))',
              animation: 'progress 1.2s ease-in-out infinite',
              '@keyframes progress': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)' },
              },
            }}
          />
        </Box>
      )}

      {isDrawerOpen && !isMobile && (
        <Box
          sx={{
            backgroundColor: 'background.default',
            overflowY: 'auto',
          }}
        >
          <Routes>
            <Route
              path="chat/:id"
              element={<ChatPanel highlightChatId={params.id} />}
            />
            <Route path="*" element={<ChatPanel />} />
          </Routes>
        </Box>
      )}

      <Box sx={{ overflowY: 'auto' }}>
        <SiteWrapper>
          <Routes>
            <Route path="create/:game_type_name" element={<CreateGame />} />
            <Route path="create" element={<CreateGame />} />
            <Route path="join/:id" element={<JoinGame />} />
            <Route path="chat/:id" element={<ChatPage />} />
            <Route path="leaderboards" element={<LeaderboardsModal />} />
            <Route path="portfolio" element={<MainPage />} />
            <Route path="/" element={<MainPage />} />
          </Routes>
        </SiteWrapper>
      </Box>
    </Box>
  );
}

export default GameMainRoute;