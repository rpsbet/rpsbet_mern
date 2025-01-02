import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import StatisticsPage from './StatisticsPage/StatisticsPage';
import CustomersPage from './Customer/CustomerPage';
import ActivityPage from './Activity/ActivityPage';
import SettingsPage from './SettingsPage/SettingsPage';
import CountdownPage from '../CountdownPage'

export class AppMainRoute extends Component {
  render() {
    const { match } = this.props;
    return (
        <Switch>
          <Route
            exact
            path={`${match.path}/customers`}
            component={CustomersPage}
          />
         
          <Route
            exact
            path={`${match.path}/activities`}
            component={ActivityPage}
          />
          <Route 
            
            path={`/investors`}
            component={CountdownPage}
            />
      
          <Route
            exact
            path={`${match.path}/statistics`}
            component={StatisticsPage}
          />
          <Route
            exact
            path={`${match.path}/settings`}
            component={SettingsPage}
          />
          
        </Switch>
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
)(AppMainRoute);
