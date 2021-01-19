import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
// import LandingPage from '../main_pages/LandingPage';
import CreateGame from '../main_pages/CreateGame';
import SiteWrapper from '../SiteWrapper';
import RoomList from '../main_pages/RoomList';
import JoinGame from '../main_pages/JoinGame';
import ChatPage from '../MyGames/ChatPage';

export class GameMainRoute extends Component {
  render() {
    const { match } = this.props;

    return (
      <SiteWrapper>
        <Switch>
          <Route 
            exact
            path={`${match.path}create/:game_type_name`}
            component={CreateGame}
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
            path={`${match.path}`}
            component={RoomList}
          />
        </Switch>
      </SiteWrapper>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth
});

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(GameMainRoute);
