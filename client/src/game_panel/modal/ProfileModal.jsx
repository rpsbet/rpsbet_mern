import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import AvatarUpload from './upload/AvatarUpload';
import {
  setUserInfo,
  changePasswordAndAvatar,
  getUser
} from '../../redux/Auth/user.actions';
import {
  getCustomerStatisticsData
  // getRoomStatisticsData
} from '../../redux/Customer/customer.action';
import { alertModal } from './ConfirmAlerts';
import ReactApexChart from 'react-apexcharts';
import styled from 'styled-components';
import { Button, TextField } from '@material-ui/core';

import Elevation from '../../Styles/Elevation';
import StatisticsForm from '../../admin_panel/app/Customer/EditCustomerPage/StatisticsForm';
import { addCurrencySignal } from '../../util/helper';
import moment from 'moment';
import './Modals.css';
import { convertToCurrency } from '../../util/conversion';

Modal.setAppElement('#root');

function generateData(gameLogList) {
  const series = [];
  let totalProfit = 0;
  gameLogList &&
    gameLogList.forEach((log, index) => {
      totalProfit += log.profit;
      series.push({ x: `${Number(index) + 1}`, y: totalProfit });
    });
  return series;
}

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    background: 'transparent',
    padding: 0
  }
};

class ProfileModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      _id: this.props.userInfo._id,
      actorType: 'Both',
      gameType: 'All',
      timeType: '7',
      referralCode: '',
      rewards: this.props.userInfo.rewards,
      username: this.props.userInfo.username,
      profitAllTimeHigh: this.props.userInfo.profitAllTimeHigh,
      profitAllTimeLow: this.props.userInfo.profitAllTimeLow,
      email: this.props.userInfo.email,
      password: '',
      passwordConfirmation: '',
      avatar: this.props.userInfo.avatar,
      rank: this.props.userInfo.totalWagered,
      joined_date: this.props.userInfo.joined_date
    };
  }

  static getDerivedStateFromProps(props, current_state) {
    if (
      current_state.avatar !== props.avatar ||
      current_state.accessory !== props.accessory ||
      current_state.username !== props.username ||
      current_state.email !== props.email ||
      current_state.totalWagered !== props.totalWagered ||
      current_state.rewards !== props.rewards
    ) {
      return {
        ...current_state,
        avatar: props.userInfo.avatar,
        accessory: props.userInfo.accessory,
        username: props.userInfo.username,
        email: props.userInfo.email,
        totalWagered: props.userInfo.totalWagered,
        referralCode: props.userInfo.referralCode,
        rewards: props.userInfo.rewards
      };
    }
    return null;
  }

  async componentDidMount() {
    await this.fetchStatisticsData();
  }

  fetchStatisticsData = async () => {
    const { _id, actorType, gameType, timeType } = this.state;
    const result = await this.props.getCustomerStatisticsData(
      _id,
      actorType,
      gameType,
      timeType
    );

    this.setState({
      ...result
    });
  };

  handleDropdownChange = (dropdownName, selectedValue) => {
    this.setState(
      {
        [dropdownName]: selectedValue
      },
      async () => {
        await this.fetchStatisticsData();
      }
    );
  };

  handleAvatarLoaded = filename => {
    this.props.setUserInfo({ ...this.props.userInfo, avatar: filename });
  };

  handleChangePassword = e => {
    e.preventDefault();
    this.setState({ password: e.target.value });
  };

  handleChangePasswordConfirmation = e => {
    e.preventDefault();
    this.setState({ passwordConfirmation: e.target.value });
  };

  saveUserInfo = async e => {
    e.preventDefault();
    if (this.state.password !== this.state.passwordConfirmation) {
      alertModal(
        this.props.isDarkMode,
        `PASSWORD CONFIRMATION DOESN'T MATCH NEW PASSWORD`
      );
      return;
    }

    const is_success = await this.props.changePasswordAndAvatar(
      this.state.password,
      this.state.avatar
    );
    if (is_success) {
      this.props.closeModal();
    }
  };

  handleCloseModal = () => {
    this.props.getUser(true);
    this.props.closeModal();
  };

  render() {
    const { loading, gameLogList, modalIsOpen, isDarkMode } = this.props;

    const {
      rank,
      accessory,
      avatar,
      username,
      joined_date,
      deposit,
      withdraw,
      gameProfit,
      balance,
      gamePlayed,
      gameHosted,
      gameJoined,
      totalWagered,
      netProfit,
      profitAllTimeHigh,
      profitAllTimeLow,
      averageWager,
      averageGamesPlayedPerRoom,
      averageProfit
    } = this.state;

    const series = [{ name: 'Jan', data: generateData(gameLogList) }];
    return (
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={this.handleCloseModal}
        style={customStyles}
        contentLabel="Profile Modal"
      >
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title">Your Profile</h2>
            <Button className="btn-close" onClick={this.handleCloseModal}>
              ×
            </Button>
          </div>
          <div className="modal-body edit-modal-body">
            <div className="align-center">
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                <div className="edit-avatar-panel">
                  <AvatarUpload
                    setImageFilename={this.handleAvatarLoaded}
                    darkMode={isDarkMode}
                    rank={rank}
                    accessory={accessory}
                    avatar={avatar}
                  />
                </div>
              )}
            </div>
            {loading ? null : (
              <div className="user-statistics">
                <StatisticsForm
                  onDropdownChange={this.handleDropdownChange}
                  username={username}
                  joined_date={joined_date}
                  gameLogList={gameLogList}
                  deposit={deposit}
                  withdraw={withdraw}
                  gameProfit={gameProfit}
                  balance={balance}
                  gamePlayed={gamePlayed}
                  gameHosted={gameHosted}
                  gameJoined={gameJoined}
                  totalWagered={totalWagered}
                  rank={this.props.totalWagered}
                  netProfit={netProfit}
                  profitAllTimeHigh={profitAllTimeHigh}
                  profitAllTimeLow={profitAllTimeLow}
                  averageWager={averageWager}
                  averageGamesPlayedPerRoom={averageGamesPlayedPerRoom}
                  averageProfit={averageProfit}
                  // getRoomStatisticsData={this.props.getRoomStatisticsData}
                />
              </div>
            )}
            <div className="modal-edit-panel">
              <div>
                <TextField
                  className="form-control"
                  variant="outlined"
                  label="REFERRAL CODE"
                  value={this.state.referralCode}
                  readOnly
                />
              </div>
              <div className="input-wrapper">
                <TextField
                  value={this.props.userInfo.rewards}
                  className="form-control"
                  variant="outlined"
                  label="REFERRAL REWARDS"
                  InputProps={{
                    endAdornment: 'ETH'
                  }}
                  readOnly
                />
              </div>

              <div>
                <TextField
                  className="form-control"
                  value={this.state.username}
                  variant="outlined"
                  label="USERNAME"
                  readOnly
                />
              </div>
              <div>
                <TextField
                  className="form-control"
                  value={this.state.email}
                  variant="outlined"
                  label="EMAIL"
                  readOnly
                />
              </div>
              <div>
                <TextField
                  type="password"
                  InputLabelProps={{
                    shrink: true
                  }}
                  className="form-control"
                  value={this.state.password}
                  variant="outlined"
                  label="PASSWORD"
                  autoComplete="off"
                  onChange={this.handleChangePassword}
                />
              </div>
              <div>
                <TextField
                  type="password"
                  InputLabelProps={{
                    shrink: true
                  }}
                  className="form-control"
                  value={this.state.password}
                  variant="outlined"
                  label="PASSWORD"
                  autoComplete="off"
                  value={this.state.passwordConfirmation}
                  onChange={this.handleChangePasswordConfirmation}
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button className="btn-submit" onClick={this.saveUserInfo}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
}

const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,
  userInfo: state.auth.user,
  loading: state.logic.isActiveLoadingOverlay
});

const mapDispatchToProps = {
  setUserInfo,
  changePasswordAndAvatar,
  getUser,
  getCustomerStatisticsData
  // getRoomStatisticsData
};

export default connect(mapStateToProps, mapDispatchToProps)(ProfileModal);

const ChartDivEl = styled.div`
  grid-area: Charts;
  justify-self: center;
  width: 100%;
  border-radius: 5px;
  background-color: #424242;
  padding: 25px;
  align-items: center;
  ${Elevation[2]}
`;

const H2 = styled.h2`
  border-bottom: 3px solid white;
`;

const Span = styled.span`
  font-size: 14px;
  float: right;
  margin-top: 18px;
`;

const ChartEl = styled(ReactApexChart)``;
