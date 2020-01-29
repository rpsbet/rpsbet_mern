import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import LayoutCop from '../Layout/LayoutCop';
import StatisticsPage from './StatisticsPage/StatisticsPage';
import ProductPage from '../app/ProductPages/ProductSerchPage/ProductPage';
import ProductCreatePage from './ProductPages/ProductCreactPage/ProductCreatePage';
import CustomersPage from './Customer/CustomerPage';

export class AppMainRoute extends Component {
  render() {
    const { match } = this.props;

    console.log('Admin Route', match.path);
    return (
      <LayoutCop>
        <Switch>
          <Route 
            exact
            path={`${match.path}`}
            component={ProductPage}
          />
          <Route 
            exact
            path={`${match.path}/product`}
            component={ProductPage}
          />
          <Route
            exact
            path={`${match.path}/product/new`}
            component={ProductCreatePage}
          />
          <Route
            exact
            path={`${match.path}/product/:_id`}
            component={ProductCreatePage}
          />
          <Route
            exact
            path={`${match.path}/customers`}
            component={CustomersPage}
          />
          <Route
            exact
            path={`${match.path}/statistics`}
            component={StatisticsPage}
          />
        </Switch>
      </LayoutCop>
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
