import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { Route, Switch, Redirect } from 'react-router-dom';
import { getUser } from './redux/Auth/user.actions';
import GameMainRoute from './game_panel/app/Game.routes';
import AppMainRoute from './admin_panel/app/App.routes';
import DepositModal from './game_panel/modal/DepositModal'
import Error404Page from './admin_panel/Error404Page';
import setAuthToken from './util/setAuthToken';

if (localStorage.token) {
  setAuthToken(localStorage.token);
}

const App = () => {
  return (
    <>
      <Switch>
        <Route
          exact
          path="/investors"
          render={routeProps => <AppMainRoute {...routeProps} />}
        />
        <Route
          path="/investors/deposit"
          render={routeProps => (
            <>
              <AppMainRoute {...routeProps} /> 
              <DepositModal {...routeProps} />
            </>
          )}
        />
        <Route
          path="/"
          render={routeProps => <GameMainRoute {...routeProps} />}
        />
        <Route component={Error404Page} />
      </Switch>
    </>
  );
};

const mapStateToProps = state => ({
  auth: state.auth,
  admin_auth: state.admin_auth,
});

const mapDispatchToProps = { getUser };

export default connect(mapStateToProps, mapDispatchToProps)(App);
