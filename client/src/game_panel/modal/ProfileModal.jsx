import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import AvatarUpload from './upload/AvatarUpload';
import {
  setUserInfo,
  changePasswordAndAvatar,
  getUser,
  changeLink,
  changeUserName
} from '../../redux/Auth/user.actions';
import {
  getCustomerStatisticsData,
  acGetCustomerInfo,
  getSpendingHabit
} from '../../redux/Customer/customer.action';
import { alertModal } from './ConfirmAlerts';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { Tabs, Tab, Button, Tooltip, IconButton, TextField, Grid, Typography } from '@material-ui/core';
import StatisticsForm from '../../admin_panel/app/Customer/EditCustomerPage/StatisticsForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Info } from '@material-ui/icons';
import PlayerModal from './PlayerModal';
import { faUser, faEdit, faChartBar } from '@fortawesome/free-solid-svg-icons';
import Avatar from '../../components/Avatar';

import moment from 'moment';
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
    padding: 0,
    border: 'none'
  }
};

class ProfileModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      _id: this.props.userInfo._id,
      actorType: 'Both',
      gameType: 'All',
      timeType: '24',
      referralCode: '',
      rewards: this.props.userInfo.rewards,
      username: this.props.userInfo.username,
      link: this.props.userInfo.bio,
      profitAllTimeHigh: this.props.userInfo.profitAllTimeHigh,
      profitAllTimeLow: this.props.userInfo.profitAllTimeLow,
      customerInfo: {},
      copied: false,
      activeTab: 0,
      isReferralsModalOpen: false,
      loading: this.props.loading,
      password: '',
      passwordConfirmation: '',
    status: '',
      showPlayerModal: false,
      selectedCreator: '',
      avatar: this.props.userInfo.avatar,
      rank: this.props.userInfo.totalWagered,
      dateJoined: this.props.userInfo.created_at,
      creditScore: this.props.userInfo.credit_score,
      newUsername: "",
      isNewUsernameModalOpen: false,
      isLinkModalOpen: false,
    };
  }

  static getDerivedStateFromProps(props, current_state) {
    if (
      current_state.avatar !== props.avatar ||
      current_state.accessory !== props.accessory ||
      current_state.username !== props.username ||
      current_state.rewards !== props.rewards
    ) {
      return {
        ...current_state,
        avatar: props.userInfo.avatar,
        accessory: props.userInfo.accessory,
        username: props.userInfo.username,
        referralCode: props.userInfo.referralCode,
        rewards: props.userInfo.rewards
      };
    }
    return null;
  }

  async componentDidMount() {
    const { userInfo } = this.props;
    const { rewards } = userInfo;
    const data = await this.props.getSpendingHabit(userInfo._id); // Dispatching the action
    if (data) {
      this.setState({
        status: data.status,
      });
    } 
    rewards.forEach(async reward => {
      const info = await this.props.acGetCustomerInfo(reward.user);
      if (info) {
        this.setState(prevState => ({
          customerInfo: {
            ...prevState.customerInfo,
            [reward.user]: info
          }
        }));
      }
    });


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

  refreshStatus = async () => {
    const { _id } = this.state;
    const data = await this.props.getSpendingHabit(_id);

    if (data) {
      this.setState({
        status: data.status,
      });
    }
  };

  getStatusDetails = (status) => {
    switch (status) {
      case 'very good':
        return { color: 'rgb(118 221 119)', title: 'JEWISH JEDI', message: 'Your spending habits are outstanding!', progress: 100 };
      case 'good':
        return { color: 'rgb(3 221 255)', title: 'SEASONED CZAR', message: 'Your spending habits are commendable.', progress: 80 };
      case 'average':
        return { color: '#ffc107', title: 'UNCONSCIOUS COMPETENT', message: 'You’re doing fine, but there’s room for improvement.', progress: 60 };
      case 'bad':
        return { color: '#fd7e14', title: 'PEASANT PUPPET', message: 'Consider revisiting your spending strategy.', progress: 40 };
      case 'very bad':
        return { color: '#dc3545', title: 'MISERABLE MULE', message: 'Your spending habits need serious improvement.', progress: 20 };
      default:
        return { color: '#6c757d', title: 'Unknown', message: 'Unable to determine spending habits.', progress: 0 };
    }
  };

  handleChangeUsername = event => {
    this.setState({ newUsername: event.target.value });
  };
  handleChangeLink = event => {
    this.setState({ link: event.target.value });
  };

  handleLink = () => {
    this.setState({ isLinkModalOpen: true });
  };
  handleNewUsername = () => {
    this.setState({ isNewUsernameModalOpen: true });
  };
  handleReferrals = () => {
    this.setState({ isReferralsModalOpen: true });
  };

  containsBadLanguage = (username) => {
    const explicitWords = ['admin', 'ADMIN', 'RPSGAME', 'rps.game', 'rpsdotgame', 'system', 'support', 'BOT', 'B0T', 'bot', 'BoT'];
    const lowercasedUsername = username.toLowerCase();

    return explicitWords.some((word) => lowercasedUsername.includes(word));
  };

  changeUserName = async () => {
    const { newUsername } = this.state;
    try {
      if (this.containsBadLanguage(newUsername)) {
        alertModal(
          this.props.isDarkMode,
          `Username contains reserved words.`
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
  changeLink = async () => {
    const { link } = this.state;
    try {
      if (this.containsBadLanguage(link)) {
        alertModal(
          this.props.isDarkMode,
          `Bio contains reserved words.`
        );
        return;
      }

      this.setState({ isLoading: true });
      const result = await this.props.changeLink(
        link
      );

      if (result.success) {
        alertModal(this.props.isDarkMode, result.message, "-cat");
        this.setState({ isLoading: false });
        this.handleCloseLinkModal();
      } else {
        this.setState({ isLoading: false });
        alertModal(this.props.isDarkMode, "FAILED TO UPDATE BIO");
      }
    } catch (e) {
      this.setState({ isLoading: false });
      if (this.state.link <= 0) {
        alertModal(this.props.isDarkMode, `FAILED TO UPDATE BIO`);
        return;
      }
    }
  };

  handleOpenPlayerModal = creator_id => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  handleTabChange = (event, newValue) => {
    this.setState({ activeTab: newValue });
  };
  handleCloseNewUsernameModal = () => {
    this.setState({ isNewUsernameModalOpen: false });
  };
  handleCloseLinkModal = () => {
    this.setState({ isLinkModalOpen: false });
  };
  handleCloseReferralsModal = () => {
    this.setState({ isReferralsModalOpen: false });
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

  handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 1500);
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

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Added CORS
      img.src = this.state.avatar;

      img.onload = () => {
        const maxWidth = 600;
        const maxHeight = 600;

        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(async blob => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = async () => {
            const base64Avatar = reader.result;

            const is_success = await this.props.changePasswordAndAvatar(
              this.state.password,
              base64Avatar
            );

            if (is_success) {
              this.props.closeModal();
            }
          };
        }, 'image/webp', 0.5);
      };
    } catch (error) {
      console.error('Error converting image to WebP:', error);
      alertModal(this.props.isDarkMode, 'Failed to convert image. Please try again.');
    }
  };


  handleCloseModal = () => {
    this.props.getUser(true);
    this.props.closeModal();
  };

  render() {
    const { modalIsOpen, isDarkMode, userInfo } = this.props;
    const { rewards } = userInfo;
    const {
      rank,
      accessory,
      actorType,
      gameType,
      timeType,
      avatar,
      username,
      gameLogList,
      customerInfo,
      deposit,
      withdraw,
      gameProfit,
      balance,
      gamePlayed,
      gameHosted,
      status,
      gameJoined,
      showPlayerModal,
      selectedCreator,
      totalWagered,
      netProfit,
      profitAllTimeHigh,
      profitAllTimeLow,
      averageWager,
      averageGamesPlayedPerRoom,
      loading,
      averageProfit,
      dateJoined,
      creditScore,
      activeTab,
      copied
    } = this.state;
    const isLink = /^https?:\/\//.test(this.state.link);
    const { color, title, message, progress } = this.getStatusDetails(status);
    const barStyle = {
      width: `${progress}%`,
      backgroundColor: progress <= 50 ? 'yellow' : 'green'
    };
    return (
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={this.handleCloseModal}
        style={customStyles}
        contentLabel="Profile Modal"
      >
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title title">
              <FontAwesomeIcon icon={faUser} className="mr-2" />

              Your Profile</h2>
            <Button className="btn-close title" onClick={this.handleCloseModal}>
              ×
            </Button>
          </div>
          <div className="modal-body profile edit-modal-body">

            <Tabs value={activeTab} onChange={this.handleTabChange}>
              <Tab
                label={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faEdit} className="mr-2" />
                    Edit Profile
                  </div>
                }
              />
              <Tab
                label={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faChartBar} className="mr-2" />
                    Stats
                  </div>
                }
              />
            </Tabs>
            {activeTab === 0 && (
              <div>
                <div className="align-center">
                  {loading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <div className="edit-avatar-panel ">
                      <AvatarUpload
                        setImageFilename={this.handleAvatarLoaded}
                        darkMode={isDarkMode}
                        rank={rank}
                        username={username}
                        accessory={accessory}
                        avatar={avatar}
                      />
                      <div style={{ marginTop: '30px', borderBottom: '2px solid' }}>
                        <h4 className="modal-title title">
                          {this.state.username}
                        </h4>
                        <div style={{ marginBottom: '20px', color: isDarkMode ? "#e5e5e5" : "#333" }}>
                          {isLink ? (
                            <a
                              href={this.state.link}
                              style={{
                                marginBottom: '20px',
                                color: isDarkMode ? "#e5e5e5" : "#333"
                              }}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {this.state.link}
                            </a>
                          ) : (
                            <span
                              style={{
                                marginBottom: '20px',
                                paddingBottom: '10px',
                                color: isDarkMode ? "#e5e5e5" : "#333"
                              }}
                            >
                              {this.state.link}
                            </span>
                          )}
                        </div>


                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-edit-panel">
                  <div>
                    <TextField
                      className="form-control"
                      variant="filled"
                      label="REFERRAL CODE"
                      value={this.state.referralCode}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <Tooltip title={copied ? "Copied!" : "Copy to clipboard"} placement="top">
                            <IconButton color="inherit" onClick={() => this.handleCopyToClipboard(this.state.referralCode)}>
                              <FileCopyIcon />
                            </IconButton>
                          </Tooltip>
                        ),
                      }}
                    />
                  </div>
                  <div className="input-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <Button
                      className="form-control"
                      onClick={this.handleReferrals}
                    >
                      See All Referrals
                    </Button>

                    <Tooltip
                      title={
                        <>
                          <h6 style={{ marginBottom: "0.5rem" }}>HOW DO I EARN REFERRAL REWARDS?</h6>
                          <p style={{ marginBottom: "0.5rem" }}>
                            Referral earnings depend on your referrals' deposit activity and are calculated based on <span style={{ fontWeight: "bold", color: "#28a745" }}>5%</span> of the deposit amount of your referred users.
                          </p>
                          <p style={{ marginBottom: "0.5rem" }}>
                            For example, if your referral deposits <strong>{convertToCurrency(100)}</strong> in total,
                            you will earn 5% which is <strong>{convertToCurrency(5)}</strong>.
                          </p>
                        </>
                      }
                      placement="top"
                    >
                      <Info style={{ cursor: "pointer", float: "right", paddingLeft: "5px" }} />
                    </Tooltip>
                  </div>

                  <div>
                    <TextField
                      className="form-control"
                      value={this.state.link}
                      variant="filled"
                      label="CHANGE BIO"
                      readOnly
                    />
                  </div>
                  <div>
                    <Button
                      className="form-control"
                      onClick={this.handleLink}
                    >
                      CHANGE BIO
                    </Button>
                  </div>
                  <div>
                    <TextField
                      className="form-control"
                      value={this.state.username}
                      variant="filled"
                      label="USERNAME"
                      readOnly
                    />
                  </div>
                  <div>
                    <Button
                      className="form-control"
                      onClick={this.handleNewUsername}
                    >
                      Change Username
                    </Button>
                  </div>
                  <div>
                    <TextField
                      type="password"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      className="form-control"
                      value={this.state.password}
                      variant="filled"
                      label="PASSWORD"
                      autoComplete="off"
                      onChange={this.handleChangePassword}
                    />
                  </div>
                  <div>
                    <TextField
                      type="password"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      className="form-control"
                      variant="filled"
                      label="PASSWORD"
                      autoComplete="off"
                      value={this.state.passwordConfirmation}
                      onChange={this.handleChangePasswordConfirmation}
                    />
                  </div>
                </div>
              </div>
            )}
            <div>
            
          </div>
            {activeTab === 1 && (
              <div className="user-statistics">
                <StatisticsForm
                  onDropdownChange={this.handleDropdownChange}
                  username={username}
                  dateJoined={dateJoined}
                  creditScore={creditScore}
                  title={title}
                  color={color}
                  barStyle={barStyle}
                  message={message}
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
          </div>
          {activeTab === 0 && (
            <div className="modal-footer">
              <Button className="btn-submit" onClick={this.saveUserInfo}>
                Save
              </Button>
            </div>
          )}
        </div>
        <Modal
          isOpen={this.state.isNewUsernameModalOpen}
          onRequestClose={this.handleCloseNewUsernameModal}
          style={customStyles}
          contentLabel="New Username Modal"
        >
          <div className={isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-header">
              <h2 className="modal-title title">ENTER NEW USERNAME</h2>
              <Button className="btn-close title" onClick={this.handleCloseModal}>
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
                      variant="filled"
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
        <Modal
          isOpen={this.state.isLinkModalOpen}
          onRequestClose={this.handleCloseLinkModal}
          style={customStyles}
          contentLabel="New Username Modal"
        >
          <div className={isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-header">
              <h2 className="modal-title title">ENTER NEW BIO</h2>
              <Button className="btn-close title" onClick={this.handleCloseModal}>
                ×
              </Button>
            </div>
            <div className="modal-body">
              <div className="modal-content-wrapper">
                <div className="modal-content-panel">
                  <div className="input-username">
                    <TextField
                      label="e.g. a link"
                      value={this.state.link}
                      onChange={this.handleChangeLink}
                      variant="filled"
                      autoComplete="off"
                      multiline
                      maxRows={4}
                      className="form-control"
                      inputProps={{ maxLength: 40 }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button className="btn-submit" onClick={this.changeLink}>
                Update
              </Button>
              <Button
                className="btn-back"
                onClick={this.handleCloseLinkModal}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
        <Modal
          isOpen={this.state.isReferralsModalOpen}
          onRequestClose={this.handleCloseReferralsModal}
          style={customStyles}
          contentLabel="Referrals Modal"
        >
          <div className={isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-header">
              <h2 className="modal-title title">ALL REFERRALS</h2>
              <Button className="btn-close title" onClick={this.handleCloseModal}>
                ×
              </Button>
            </div>
            {showPlayerModal && (
              <PlayerModal
                selectedCreator={selectedCreator}
                modalIsOpen={showPlayerModal}
                closeModal={this.handleClosePlayerModal}
              />
            )}
            <div className="modal-body">
              <div className="modal-content-wrapper">
                <div className="modal-content-panel">
                  <Grid container spacing={2}>
                    {rewards.map((reward, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        {customerInfo[reward.user] && (
                          <Grid container direction="column" alignItems="center">
                            <Grid item>
                              <a
                                className="player"
                                onClick={() =>
                                  this.handleOpenPlayerModal(customerInfo[reward.user]._id)
                                }
                              >
                                <Avatar src={customerInfo[reward.user].avatar} alt="User Avatar"
                                  rank={customerInfo[reward.user].totalWagered}
                                  accessory={customerInfo[reward.user].accessory}
                                  username={customerInfo[reward.user].username}
                                />
                              </a>
                            </Grid>
                            <Grid item>
                              <Typography variant="body1">
                                {customerInfo[reward.user].username}
                              </Typography>
                            </Grid>
                          </Grid>
                        )}
                        <div style={{ border: "2px solid rgb(40, 167, 69)", borderRadius: "0.3em", padding: "2px" }}>
                          <Typography style={{ margin: "auto", textAlign: 'center', color: "rgb(40, 167, 69)" }} variant="body2">
                            + {convertToCurrency(reward.amount)}
                          </Typography>
                        </div>
                      </Grid>
                    ))}
                  </Grid>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button
                className="btn-back"
                onClick={this.handleCloseReferralsModal}
              >
                Close
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
  changeLink,
  changeUserName,
  getSpendingHabit,
  getCustomerStatisticsData,
  acGetCustomerInfo
};

export default connect(mapStateToProps, mapDispatchToProps)(ProfileModal);
