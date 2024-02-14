import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import AvatarUpload from './upload/AvatarUpload';
import {
  setUserInfo,
  changePasswordAndAvatar,
  getUser,
  changeUserName
} from '../../redux/Auth/user.actions';
import {
  getCustomerStatisticsData
} from '../../redux/Customer/customer.action';
import { alertModal } from './ConfirmAlerts';

import { Button, TextField } from '@material-ui/core';
import StatisticsForm from '../../admin_panel/app/Customer/EditCustomerPage/StatisticsForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { faUser } from '@fortawesome/free-solid-svg-icons';

import moment from 'moment';
import './Modals.css';
import { convertToCurrency } from '../../util/conversion';

Modal.setAppElement('#root');


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
      // email: this.props.userInfo.email,
      password: '',
      passwordConfirmation: '',
      avatar: this.props.userInfo.avatar,
      rank: this.props.userInfo.totalWagered,
      dateJoined: this.props.userInfo.created_at,
      creditScore: this.props.userInfo.credit_score,
      newUsername: "",
      isNewUsernameModalOpen: false,
    };
  }

  static getDerivedStateFromProps(props, current_state) {
    if (
      current_state.avatar !== props.avatar ||
      current_state.accessory !== props.accessory ||
      current_state.username !== props.username ||
      // current_state.email !== props.email ||
      current_state.totalWagered !== props.totalWagered ||
      current_state.totalWagered !== props.totalWagered ||
      current_state.rewards !== props.rewards
    ) {
      return {
        ...current_state,
        avatar: props.userInfo.avatar,
        accessory: props.userInfo.accessory,
        username: props.userInfo.username,
        // email: props.userInfo.email,
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

  handleChangeUsername = event => {
    this.setState({ newUsername: event.target.value });
  };

  handleNewUsername = () => {
    this.setState({ isNewUsernameModalOpen: true });
  };

  containsBadLanguage = (username) => {
    const explicitWords = ['nigger', 'nigg3r', 'n1gger', 'coon', 'c00n', 'paki', 'chink', 'n i g g e r'];
    const lowercasedUsername = username.toLowerCase();

    return explicitWords.some((word) => lowercasedUsername.includes(word));
  };

  changeUserName = async () => {
    const { newUsername } = this.state;
    try {
      if (this.containsBadLanguage(newUsername)) {
        alertModal(
          this.props.isDarkMode,
          `HMMMmmmmmmmm ---___---`
        );
        return;
      }

      if (newUsername.trim() === '') {
        alertModal(this.props.isDarkMode, 'Username cannot be thin air. Please enter some text.');
        return;
      }

      this.setState({ isLoading: true });
      const result = await this.props.changeUserName(
        newUsername
      );

      if (result.success) {
        alertModal(this.props.isDarkMode, result.message, "-cat");
        this.setState({ isLoading: false });
        this.handleCloseNewUsernameModal();
      } else {
        this.setState({ isLoading: false });
        alertModal(this.props.isDarkMode, "USERNAME ALREADY EXISTS. CHOOSE A DIFFERENT ONE.");
      }
    } catch (e) {
      this.setState({ isLoading: false });
      if (this.state.newUsername <= 0) {
        alertModal(this.props.isDarkMode, `Username might be taken already. Try something else more original you common cat.`);
        return;
      }
    }
  };


  handleCloseNewUsernameModal = () => {
    this.setState({ isNewUsernameModalOpen: false });
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
    const { loading, modalIsOpen, isDarkMode } = this.props;

    const {
      rank,
      accessory,
      actorType,
      gameType,
      timeType,
      avatar,
      username,
      gameLogList,
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
      averageProfit,
      dateJoined,
      creditScore
    } = this.state;

    return (
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={this.handleCloseModal}
        style={customStyles}
        contentLabel="Profile Modal"
      >
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title">
            <FontAwesomeIcon icon={faUser} className="mr-2" />

              Your Profile</h2>
            <Button className="btn-close" onClick={this.handleCloseModal}>
              ×
            </Button>
          </div>
          <div className="modal-body profile edit-modal-body">
            <div className="align-center">
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                <div className="edit-avatar-panel ">
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
                  dateJoined={dateJoined}
                  creditScore={creditScore}
                  gameLogList={gameLogList}
                  actorType={actorType}
                  gameType={gameType}
                  timeType={timeType}
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
                <Button
                  className="form-control"
                  variant="outlined"
                  onClick={this.handleNewUsername}
                >
                  Change Username
                </Button>
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
        <Modal
          isOpen={this.state.isNewUsernameModalOpen}
          onRequestClose={this.handleCloseNewUsernameModal}
          style={customStyles}
          contentLabel="New Username Modal"
        >
          <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-header">
              <h2 className="modal-title">ENTER NEW USERNAME</h2>
              <Button className="btn-close" onClick={this.handleCloseModal}>
                ×
              </Button>
            </div>
            <div className="modal-body">
              <div className="modal-content-wrapper">
                <div className="modal-content-panel">
                  <div className="input-username">
                    <TextField
                      label="e.g. PUSSY_D3STROY3R"
                      value={this.state.newUsername}
                      onChange={this.handleChangeUsername}
                      variant="outlined"
                      autoComplete="off"
                      className="form-control"
                      inputProps={{ maxLength: 12 }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button className="btn-submit" onClick={this.changeUserName}>
                Update
              </Button>
              <Button
                className="btn-back"
                onClick={this.handleCloseNewUsernameModal}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
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
  changeUserName,
  getCustomerStatisticsData
};

export default connect(mapStateToProps, mapDispatchToProps)(ProfileModal);
