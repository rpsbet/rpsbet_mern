import React, { Component } from 'react';
import { connect } from 'react-redux';
import history from '../../redux/history';
import { acQueryItem } from '../../redux/Landing/landing.action';
import { getGameTypeList } from "../../redux/Logic/logic.actions";

class LandingPage extends Component {
  componentDidMount() {
    this.IsAuthenticatedReroute();
    this.props.getGameTypeList();
  }

  IsAuthenticatedReroute = () => {
    if (this.props.auth) {
      history.push('/');
    }
  };

  render() {
    return (
      <>
        LandingPage
      </>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  landingItemList: state.landingReducer.landingItemList
});

const mapDispatchToProps = {
  getGameTypeList,
  acQueryItem
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LandingPage);
