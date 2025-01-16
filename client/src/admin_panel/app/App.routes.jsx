import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import CountdownPage from '../CountdownPage'

export class AppMainRoute extends Component {
  render() {
    const { match } = this.props;
    return (
        <Switch>
          <Route 
            path={`/investors`}
            component={CountdownPage}
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
