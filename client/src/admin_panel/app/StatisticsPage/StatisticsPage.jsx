import React, { Component } from 'react';
import { connect } from 'react-redux';
import { setUrl } from '../../../redux/Auth/user.actions';
import { warningMsgBar } from '../../../redux/Notification/notification.actions';
import ContainerHeader from '../../../components/ContainerHeader';
import styled from 'styled-components';
import MyChart from "./Charts";

class PalletPage extends Component {
  state = {
    data: null
  };
  componentDidMount() {
    this.props.setUrl(this.props.match.path);
  }
  
  render() {
    return (
      <>
        <ContainerHeader title={`Statistics`} />
        <MainContent>
          <MyChart></MyChart>
        </MainContent>
      </>
    );
  }
}

const mapStateToProps = state => ({});

const mapDispatchToProps = {
  setUrl,
  warningMsgBar
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(PalletPage);

const MainContent = styled.main`
  grid-area: MainContent;
  width: 100%;
  grid-gap: 20px;
  grid-template-columns: repeat(12, 1fr);
  grid-template-areas: 'PalletInfoCop PalletInfoCop PalletInfoCop HistoryCop HistoryCop HistoryCop Charts Charts Charts Charts Charts Charts';
  @media (max-width: 1200px) {
    grid-template-areas:
      'PalletInfoCop PalletInfoCop PalletInfoCop PalletInfoCop . . . HistoryCop HistoryCop HistoryCop HistoryCop HistoryCop'
      'Charts Charts Charts Charts Charts Charts Charts Charts Charts Charts Charts Charts';
  }
  
`;
