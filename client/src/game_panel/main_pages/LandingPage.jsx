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
        <h1 className="main_title">LEADERBOARD (TOP 10)</h1>
        <h2>TRIAL 4 STARTS xth SEPTEMBER!</h2>
        <div>
          Our final trial is almost here, click the information icon ('i') and scroll down to see which prizes are available. Or visit Our Facebook Page as we're posting all winners there! Don't miss out on winning millions (actually our biggest prize is £75...but we still have £500 worth in prizes!) so get playing. Don't feel like you're starting too late either as user balances fluctuate like UK Politics. So if there's still prizes available - go for it! Trial ENDs once all prizes have been claimed - then we're switching over to real money...uh oh! Thanks for joining us.
        </div>
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
