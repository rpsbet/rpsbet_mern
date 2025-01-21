import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import { Box } from '@mui/material';
import CreateGame from '../main_pages/CreateGame';
import RPS from '../CreateGame/RPS';
import QuickShoot from '../CreateGame/QuickShoot';
import SiteWrapper from '../SiteWrapper';
import MainPage from '../main_pages/MainPage';
import JoinGame from '../main_pages/JoinGame';
import ChatPage from '../MyGames/ChatPage';
import ChangePasswordPage from '../main_pages/ChangePasswordPage';
import LeaderboardsModal from '../modal/LeaderboardsModal';
import MyGames from '../MyGames/MyGamesTable';
import ChatPanel from '../ChatPanel/ChatPanel';

export class GameMainRoute extends Component {
  render() {
    const { match, isDrawerOpen } = this.props;
    const isMobile = window.innerWidth < 1024; // Determine if the user is on mobile

    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: isDrawerOpen && !isMobile ? '260px auto' : '1fr',
          height: '100vh',
        }}
      >
        {/* Left Column: ChatPanel */}
        {isDrawerOpen && !isMobile && (
          <Box
            sx={{
              borderRight: '1px solid #ccc',
              backgroundColor: 'background.default',
              overflowY: 'auto',
            }}
          >
            <ChatPanel />
          </Box>
        )}

        {/* Right Column: SiteWrapper and Routes */}
        <Box
          sx={{
            overflowY: 'auto',
          }}
        >
          <SiteWrapper>
            <Switch>
              <Route
                exact
                path={`${match.path}create/:game_type_name`}
                component={CreateGame}
              />
              <Route
                exact
                path={`${match.path}create/`}
                component={CreateGame}
              />
              <Route
                exact
                path={`${match.path}/create/quick-shoot/`}
                component={QuickShoot}
              />
              <Route
                exact
                path={`${match.path}/create/rps/`}
                component={RPS}
              />

              <Route
                exact
                path={`${match.path}join/:id`}
                component={JoinGame}
              />
              <Route
                exact
                path={`${match.path}chat/:id`}
                component={ChatPage}
              />
              <Route
                exact
                path={`${match.path}changePassword/:code`}
                component={ChangePasswordPage}
              />
              <Route
                exact
                path={`${match.path}leaderboards`}
                component={LeaderboardsModal}
              />

              <Route
                exact
                path={`${match.path}dashboard`}
                component={MainPage}
              />

              <Route path={`${match.path}`} component={MainPage} />
            </Switch>
          </SiteWrapper>
        </Box>
      </Box>
    );
  }
}

const mapStateToProps = (state) => ({
  auth: state.auth,
  isDrawerOpen: state.auth.isDrawerOpen
});

const mapDispatchToProps = {};

export default connect(mapStateToProps, mapDispatchToProps)(GameMainRoute);