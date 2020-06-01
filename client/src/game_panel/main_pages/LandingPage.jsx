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
        <h1 className="main_title">INFORMATION</h1>
        <div style={{height: "88%", overflowY: "scroll"}} class="latest_updates">
        <div class="single_update">
          <h4>Update June 8th 2020</h4>
          <ul>
          <li>Real-money beta release</li>
          </ul>
          </div>
        <div class="single_update">
          <h4>Update December 2019</h4>
          <ul>
          <li>Entire site is re-written in<br />React.js for real-time improvements.</li>
          </ul>
          </div>
        <div class="single_update">
          <h4>Update July 2019 > November 2019</h4>
          <ul>
          <li>User Profiles</li>
          <li>Messaging System</li>
          <li>Added Mystery Box</li>
          </ul>
          </div>
        <div class="single_update">
          <h4>Update May 31st 2019</h4>
          <ul><li>Third Trial</li></ul>
          </div>
        <div class="single_update">
          <h4>Update May 26th 2019</h4>
          <ul><li> Added 'Brain Game'</li></ul>
          </div>
        <div class="single_update">
          <h4>Update April 30th 2019</h4>
          <ul>
          <li>Added 'PR'</li>
          <li>Second Trial</li>
          </ul>
          </div>

        <div class="single_update">
          <h4>Update April 21st 2019</h4>
          <ul><li>Added 'My GAMES'</li>
          <li>First trial</li></ul>
          </div>
        <div class="single_update">
          <h4>Update April 11th 2019</h4>
          <ul><li>Added '<i>Spleesh!</i>'</li></ul>
          </div>
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
