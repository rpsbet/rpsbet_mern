import React, { useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
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

function GameMainRoute({ match, isDrawerOpen }) {
  const isMobile = window.innerWidth < 1024; // Determine if the user is on mobile
  const dispatch = useDispatch();

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
          {/*
            Switch + Route on the LEFT column so that:
              - If the path is /chat/:id, we extract match.params.id
                and pass it to ChatPanel as highlightChatId.
              - Otherwise (fallback), render a ChatPanel with no id.
          */}
          <Switch>
            <Route
              path={`${match.path}chat/:id`}
              render={({ match }) => (
                <ChatPanel highlightChatId={match.params.id} />
              )}
            />
            {/* Fallback if the above route doesn't match */}
            <Route render={() => <ChatPanel />} />
          </Switch>
        </Box>
      )}

      {/* RIGHT COLUMN: SiteWrapper and Content Routes */}
      <Box sx={{ overflowY: 'auto' }}>
        <SiteWrapper>
          <Switch>
            <Route
              exact
              path={`${match.path}create/:game_type_name`}
              component={CreateGame}
            />
            <Route exact path={`${match.path}create/`} component={CreateGame} />
            <Route exact path={`${match.path}join/:id`} component={JoinGame} />
            <Route exact path={`${match.path}chat/:id`} component={ChatPage} />
            <Route
              exact
              path={`${match.path}leaderboards`}
              component={LeaderboardsModal}
            />
            <Route exact path={`${match.path}portfolio`} component={MainPage} />
            <Route path={`${match.path}`} component={MainPage} />
          </Switch>
        </SiteWrapper>
      </Box>
    </Box>
  );
}

const mapStateToProps = (state) => ({
  isDrawerOpen: state.auth.isDrawerOpen,
});

export default connect(mapStateToProps)(GameMainRoute);
