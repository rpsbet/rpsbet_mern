import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, useParams, useLocation } from 'react-router-dom'; // Add useLocation
import { Box } from '@mui/material';

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
  const location = useLocation(); // Add useLocation for current path

  useEffect(() => {
    dispatch(getSolToUsdPrice());
  }, [dispatch]);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: isDrawerOpen && !isMobile ? '260px auto' : '1fr',
        height: '100vh',
      }}
    >
      {/* LEFT COLUMN: ChatPanel */}
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

      {/* RIGHT COLUMN: SiteWrapper and Content Routes */}
      <Box sx={{ overflowY: 'auto' }}>
        <SiteWrapper>
          <Routes>
            <Route path="create/:game_type_name" element={<CreateGame />} />
            <Route path="create" element={<CreateGame />} /> {/* Remove trailing slash */}
            <Route path="join/:id" element={<JoinGame />} />
            <Route path="chat/:id" element={<ChatPage />} />
            <Route path="leaderboards" element={<LeaderboardsModal />} />
            <Route path="portfolio" element={<MainPage />} />
            <Route path="/" element={<MainPage />} /> {/* Base route */}
          </Routes>
        </SiteWrapper>
      </Box>
    </Box>
  );
}

export default GameMainRoute;