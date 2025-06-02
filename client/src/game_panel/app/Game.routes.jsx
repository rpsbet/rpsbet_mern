import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, useParams, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';

import SiteWrapper from '../SiteWrapper';
import { getSolToUsdPrice } from '../../redux/Logic/logic.actions';
import LoadingComponent from '../../components/LoadingComponent';

const CreateGame = lazy(() => import('../main_pages/CreateGame'));
const MainPage = lazy(() => import('../main_pages/MainPage'));
const ApiDocumentation = lazy(() => import('../main_pages/ApiDocumentation'));
const JoinGame = lazy(() => import('../main_pages/JoinGame'));
const ChatPage = lazy(() => import('../MyGames/ChatPage'));
const LeaderboardsModal = lazy(() => import('../modal/LeaderboardsModal'));
// MyGames is likely part of MainPage or another lazy-loaded component
const ChatPanel = lazy(() => import('../ChatPanel/ChatPanel'));

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
              element={
                <Suspense fallback={<LoadingComponent />}>
                  <ChatPanel highlightChatId={params.id} />
                </Suspense>
              }
            />
            <Route
              path="*"
              element={
                <Suspense fallback={<LoadingComponent />}>
                  <ChatPanel />
                </Suspense>
              }
            />
          </Routes>
        </Box>
      )}

      <Box sx={{ overflowY: 'auto' }}>
        <SiteWrapper>
          <Routes>
            <Route
              path="create/:game_type_name"
              element={
                <Suspense fallback={<LoadingComponent />}>
                  <CreateGame />
                </Suspense>
              }
            />
            <Route
              path="create"
              element={
                <Suspense fallback={<LoadingComponent />}>
                  <CreateGame />
                </Suspense>
              }
            />
            <Route
              path="join/:id"
              element={
                <Suspense fallback={<LoadingComponent />}>
                  <JoinGame />
                </Suspense>
              }
            />
            <Route
              path="chat/:id"
              element={
                <Suspense fallback={<LoadingComponent />}>
                  <ChatPage />
                </Suspense>
              }
            />
            <Route
              path="leaderboards"
              element={
                <Suspense fallback={<LoadingComponent />}>
                  <LeaderboardsModal />
                </Suspense>
              }
            />
            <Route
              path="portfolio"
              element={
                <Suspense fallback={<LoadingComponent />}>
                  <MainPage />
                </Suspense>
              }
            />
            <Route
              path="api/docs"
              element={
                <Suspense fallback={<LoadingComponent />}>
                  <ApiDocumentation />
                </Suspense>
              }
            />
            <Route
              path="/"
              element={
                <Suspense fallback={<LoadingComponent />}>
                  <MainPage />
                </Suspense>
              }
            />
          </Routes>
        </SiteWrapper>
      </Box>
    </Box>
  );
}

export default GameMainRoute;