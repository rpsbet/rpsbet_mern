import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { Route, Switch, Redirect } from 'react-router-dom';

import { getUser } from './redux/Auth/user.actions';
import { getAdmin } from './redux/AdminAuth/admin.actions';

import SignInPage from './game_panel/auth/SignInPage';
import SignUpPage from './game_panel/auth/SignUpPage';
import ResetPasswordPage from './game_panel/auth/ResetPasswordPage';
import ChangePasswordPage from './game_panel/auth/ChangePasswordPage';
import GameMainRoute from './game_panel/app/Game.routes';

import AdminSignInPage from './admin_panel/auth/SignInPage';
import AdminSignUpPage from './admin_panel/auth/SignUpPage';
import Error404Page from './admin_panel/Error404Page';
import AdminMainRoute from './admin_panel/app/App.routes';
import setAuthToken from './util/setAuthToken';

if (localStorage.token) {
  setAuthToken(localStorage.token);
}

const App = props => {
  const { isAuthenticated } = props.auth;
  const { isAdminAuthenticated } = props.admin_auth;

  useEffect(() => {
    if (isAdminAuthenticated) {
      props.getAdmin();
    } else if (isAuthenticated) {
      props.getUser();
    }
  }, []);

  return (
    <Switch>
      {/* <Route exact path="/" component={LandingPage} /> */}
      <Route
        path="/admin/signin"
        render={routeProps =>
          isAdminAuthenticated ? (
            <Redirect to="/admin" />
          ) : (
            <AdminSignInPage {...routeProps} />
          )
        }
      />
      <Route
        path="/admin/signup"
        render={routeProps =>
          isAdminAuthenticated ? (
            <Redirect to="/admin" />
          ) : (
            <AdminSignUpPage {...routeProps} />
          )
        }
      />
      <Route
        path="/admin"
        render={routeProps =>
          !isAdminAuthenticated ? (
            <Redirect to="/admin/signin" />
          ) : (
            <AdminMainRoute {...routeProps} />
          )
        }
      />

      <Route
        path="/signin"
        render={routeProps =>
          isAuthenticated ? (
            <Redirect to="/" />
          ) : (
            <SignInPage {...routeProps} />
          )
        }
      />
      <Route
        path="/signup"
        render={routeProps =>
          isAuthenticated ? (
            <Redirect to="/" />
          ) : (
            <SignUpPage {...routeProps} />
          )
        }
      />
      <Route
        path="/resetPassword"
        render={routeProps => <ResetPasswordPage {...routeProps} />}
      />
      <Route
        path="/changePassword"
        render={routeProps => <ChangePasswordPage {...routeProps} />}
      />
      <Route
        path="/"
        render={routeProps =>
          !isAuthenticated ? (
            <Redirect to="/signin" />
          ) : (
            <GameMainRoute {...routeProps} />
          )
        }
      />

      <Route component={Error404Page} />
    </Switch>
  );
};

const mapStateToProps = state => ({
  auth: state.auth,
  admin_auth: state.admin_auth
});

const mapDispatchToProps = { getUser, getAdmin };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App);
