import React, { useState, useEffect, useCallback } from 'react';
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
import {
  Tabs,
  Tab,
  Button,
  Tooltip,
  IconButton,
  TextField,
  Grid,
  Typography
} from '@material-ui/core';

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

function ProfileModal(props) {
  const {
    modalIsOpen,
    closeModal,
    isDarkMode,
    userInfo,
    solPrice,
    loading,
    setUserInfo,
    changePasswordAndAvatar,
    getUser,
    changeLink: dispatchChangeLink,
    changeUserName: dispatchChangeUserName,
    getSpendingHabit: dispatchGetSpendingHabit,
    getCustomerStatisticsData: dispatchGetCustomerStatisticsData,
    acGetCustomerInfo
  } = props;

  // -----------------------------
  // State
  // -----------------------------
  const [actorType, setActorType] = useState('Both');
  const [gameType, setGameType] = useState('All');
  const [timeType, setTimeType] = useState('24');
  const [referralCode, setReferralCode] = useState(userInfo.referralCode || '');
  const [rewards, setRewards] = useState(userInfo.rewards || []);
  const [username, setUsername] = useState(userInfo.username);
  const [link, setLink] = useState(userInfo.bio || '');
  const [profitAllTimeHigh, setProfitAllTimeHigh] = useState(userInfo.profitAllTimeHigh);
  const [profitAllTimeLow, setProfitAllTimeLow] = useState(userInfo.profitAllTimeLow);
  const [customerInfo, setCustomerInfo] = useState({});
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isReferralsModalOpen, setIsReferralsModalOpen] = useState(false);

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [status, setStatus] = useState('');
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [avatar, setAvatar] = useState(userInfo.avatar);
  const [rank, setRank] = useState(userInfo.totalWagered);
  const [dateJoined, setDateJoined] = useState(userInfo.created_at);
  const [creditScore, setCreditScore] = useState(userInfo.credit_score);

  // Username & Link modals
  const [newUsername, setNewUsername] = useState('');
  const [isNewUsernameModalOpen, setIsNewUsernameModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Local stats from fetchStatisticsData
  const [gameLogList, setGameLogList] = useState([]);
  const [deposit, setDeposit] = useState(0);
  const [withdraw, setWithdraw] = useState(0);
  const [gameProfit, setGameProfit] = useState(0);
  const [balance, setBalance] = useState(0);
  const [gamePlayed, setGamePlayed] = useState(0);
  const [gameHosted, setGameHosted] = useState(0);
  const [gameJoined, setGameJoined] = useState(0);
  const [totalWagered, setTotalWagered] = useState(userInfo.totalWagered);
  const [netProfit, setNetProfit] = useState(0);
  const [averageWager, setAverageWager] = useState(0);
  const [averageGamesPlayedPerRoom, setAverageGamesPlayedPerRoom] = useState(0);
  const [averageProfit, setAverageProfit] = useState(0);

  // Loading state for actions like updating password/username
  const [isLoading, setIsLoading] = useState(false);

  // -----------------------------
  // Derived State (Similar to getDerivedStateFromProps)
  // -----------------------------
  useEffect(() => {
    // If parent updates the userInfo, reflect the changes
    setAvatar(userInfo.avatar);
    setUsername(userInfo.username);
    setReferralCode(userInfo.referralCode || '');
    setRewards(userInfo.rewards || []);
  }, [
    userInfo.avatar,
    userInfo.username,
    userInfo.referralCode,
    userInfo.rewards
  ]);

  // -----------------------------
  // componentDidMount
  // -----------------------------
  useEffect(() => {
    // On mount, fetch spending habit & user statistics data
    const loadData = async () => {
      const data = await dispatchGetSpendingHabit(userInfo._id);
      if (data) {
        setStatus(data.status);
      }

      // For each reward, load customer info
      rewards.forEach(async (reward) => {
        const info = await acGetCustomerInfo(reward.user);
        if (info) {
          setCustomerInfo((prev) => ({
            ...prev,
            [reward.user]: info
          }));
        }
      });

      await fetchStatisticsData();
    };

    loadData();
  }, []);

  // -----------------------------
  // Functions
  // -----------------------------
  const fetchStatisticsData = async () => {
    const result = await dispatchGetCustomerStatisticsData(
      userInfo._id,
      actorType,
      gameType,
      timeType
    );
    if (!result) return;

    // We assume `result` has the same shape as
    // the class-based code expects to set on state
    setGameLogList(result.gameLogList || []);
    setDeposit(result.deposit || 0);
    setWithdraw(result.withdraw || 0);
    setGameProfit(result.gameProfit || 0);
    setBalance(result.balance || 0);
    setGamePlayed(result.gamePlayed || 0);
    setGameHosted(result.gameHosted || 0);
    setGameJoined(result.gameJoined || 0);
    setNetProfit(result.netProfit || 0);
    setAverageWager(result.averageWager || 0);
    setAverageGamesPlayedPerRoom(result.averageGamesPlayedPerRoom || 0);
    setAverageProfit(result.averageProfit || 0);
  };

  const refreshStatus = async () => {
    const data = await dispatchGetSpendingHabit(userInfo._id);
    if (data) {
      setStatus(data.status);
    }
  };

  const getStatusDetails = useCallback((spendingStatus) => {
    switch (spendingStatus) {
      case 'very good':
        return {
          color: 'rgb(118 221 119)',
          title: 'JEWISH JEDI',
          message: 'Your spending habits are outstanding!',
          progress: 100
        };
      case 'good':
        return {
          color: 'rgb(3 221 255)',
          title: 'SEASONED CZAR',
          message: 'Your spending habits are commendable.',
          progress: 80
        };
      case 'average':
        return {
          color: '#ffc107',
          title: 'UNCONSCIOUS COMPETENT',
          message: 'You’re doing fine, but there’s room for improvement.',
          progress: 60
        };
      case 'bad':
        return {
          color: '#fd7e14',
          title: 'PEASANT PUPPET',
          message: 'Consider revisiting your spending strategy.',
          progress: 40
        };
      case 'very bad':
        return {
          color: '#dc3545',
          title: 'MISERABLE MULE',
          message: 'Your spending habits need serious improvement.',
          progress: 20
        };
      default:
        return {
          color: '#6c757d',
          title: 'Unknown',
          message: 'Unable to determine spending habits.',
          progress: 0
        };
    }
  }, []);

  const handleChangeUsername = (event) => {
    setNewUsername(event.target.value);
  };

  const handleChangeLink = (event) => {
    setLink(event.target.value);
  };

  const handleLink = () => {
    setIsLinkModalOpen(true);
  };

  const handleNewUsername = () => {
    setIsNewUsernameModalOpen(true);
  };

  const handleReferrals = () => {
    setIsReferralsModalOpen(true);
  };

  const containsBadLanguage = (str) => {
    const explicitWords = [
      'admin',
      'ADMIN',
      'RPSGAME',
      'rps.game',
      'rpsdotgame',
      'system',
      'support',
      'BOT',
      'B0T',
      'bot',
      'BoT'
    ];
    const lowercased = str.toLowerCase();
    return explicitWords.some((word) => lowercased.includes(word));
  };

  const changeUserNameHandler = async () => {
    if (containsBadLanguage(newUsername)) {
      alertModal(isDarkMode, `Username contains reserved words.`);
      return;
    }
    if (newUsername.trim() === '') {
      alertModal(isDarkMode, 'Username cannot be thin air. Please enter some text.');
      return;
    }

    try {
      setIsLoading(true);
      const result = await dispatchChangeUserName(newUsername);
      setIsLoading(false);

      if (result.success) {
        alertModal(isDarkMode, result.message, '-cat');
        handleCloseNewUsernameModal();
      } else {
        alertModal(isDarkMode, 'USERNAME ALREADY EXISTS. CHOOSE A DIFFERENT ONE.');
      }
    } catch (error) {
      setIsLoading(false);
      alertModal(
        isDarkMode,
        'Username might be taken. Try something else more original.'
      );
    }
  };

  const changeLinkHandler = async () => {
    if (containsBadLanguage(link)) {
      alertModal(isDarkMode, `Bio contains reserved words.`);
      return;
    }
    try {
      setIsLoading(true);
      const result = await dispatchChangeLink(link);
      setIsLoading(false);

      if (result.success) {
        alertModal(isDarkMode, result.message, '-cat');
        handleCloseLinkModal();
      } else {
        alertModal(isDarkMode, 'FAILED TO UPDATE BIO');
      }
    } catch (error) {
      setIsLoading(false);
      alertModal(isDarkMode, 'FAILED TO UPDATE BIO');
    }
  };

  const handleOpenPlayerModal = (creator_id) => {
    setShowPlayerModal(true);
    setSelectedCreator(creator_id);
  };

  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCloseNewUsernameModal = () => {
    setIsNewUsernameModalOpen(false);
  };

  const handleCloseLinkModal = () => {
    setIsLinkModalOpen(false);
  };

  const handleCloseReferralsModal = () => {
    setIsReferralsModalOpen(false);
  };

  const handleDropdownChange = async (dropdownName, selectedValue) => {
    // Each dropdown changes a piece of state, then calls fetchStatisticsData
    if (dropdownName === 'actorType') setActorType(selectedValue);
    if (dropdownName === 'gameType') setGameType(selectedValue);
    if (dropdownName === 'timeType') setTimeType(selectedValue);

    // Wait a tick for state to update
    setTimeout(() => {
      fetchStatisticsData();
    }, 0);
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleAvatarLoaded = (filename) => {
    // Update Redux store with new avatar
    setUserInfo({ ...userInfo, avatar: filename });
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setPassword(e.target.value);
  };

  const handleChangePasswordConfirmation = (e) => {
    e.preventDefault();
    setPasswordConfirmation(e.target.value);
  };

  const handleCloseModal = () => {
    getUser(true);
    closeModal();
  };


  const saveUserInfo = useCallback(
    async (e) => {
      e.preventDefault();
      if (password !== passwordConfirmation) {
        alertModal(isDarkMode, `PASSWORD CONFIRMATION DOESN'T MATCH NEW PASSWORD`);
        return;
      }

      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous'; // to avoid tainted canvas
        img.src = avatar;

        img.onload = () => {
          const maxWidth = 600;
          const maxHeight = 600;
          let width = img.width;
          let height = img.height;

          // Scale down if necessary
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

          canvas.toBlob(
            async (blob) => {
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = async () => {
                const base64Avatar = reader.result;
                const is_success = await changePasswordAndAvatar(password, base64Avatar);
                if (is_success) {
                  handleCloseModal();
                }
              };
            },
            'image/webp',
            0.5
          );
        };
      } catch (error) {
        console.error('Error converting image to WebP:', error);
        alertModal(isDarkMode, 'Failed to convert image. Please try again.');
      }
    },
    [
      password,
      passwordConfirmation,
      avatar,
      isDarkMode,
      changePasswordAndAvatar,
      handleCloseModal
    ]
  );

  // -----------------------------------
  // Rendering & Markup
  // -----------------------------------
  const { color, title, message, progress } = getStatusDetails(status);
  const barStyle = {
    width: `${progress}%`,
    backgroundColor: progress <= 50 ? 'yellow' : 'green'
  };
  const isLink = /^https?:\/\//.test(link);

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={handleCloseModal}
      style={customStyles}
      contentLabel="Profile Modal"
    >
      <div className={isDarkMode ? 'dark_mode' : ''}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title title">
            <FontAwesomeIcon icon={faUser} className="mr-2" />
            Your Profile
          </h2>
          <Button className="btn-close title" onClick={handleCloseModal}>
            ×
          </Button>
        </div>

        {/* Body */}
        <div className="modal-body profile edit-modal-body">
          <Tabs value={activeTab} onChange={handleTabChange}>
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

          {/* Tab 0: Edit Profile */}
          {activeTab === 0 && (
            <div>
              <div className="align-center">
                {loading ? (
                  <div className="loading-spinner" />
                ) : (
                  <div className="edit-avatar-panel">
                    <AvatarUpload
                      setImageFilename={handleAvatarLoaded}
                      darkMode={isDarkMode}
                      rank={rank}
                      username={username}
                      avatar={avatar}
                    />
                    <div style={{ marginTop: '30px', borderBottom: '2px solid' }}>
                      <h4 className="modal-title title">{username}</h4>
                      <div
                        style={{
                          marginBottom: '20px',
                          color: isDarkMode ? '#e5e5e5' : '#333'
                        }}
                      >
                        {isLink ? (
                          <a
                            href={link}
                            style={{
                              marginBottom: '20px',
                              color: isDarkMode ? '#e5e5e5' : '#333'
                            }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {link}
                          </a>
                        ) : (
                          <span
                            style={{
                              marginBottom: '20px',
                              paddingBottom: '10px',
                              color: isDarkMode ? '#e5e5e5' : '#333'
                            }}
                          >
                            {link}
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
                    value={referralCode}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'} placement="top">
                          <IconButton color="inherit" onClick={() => handleCopyToClipboard(referralCode)}>
                            <FileCopyIcon />
                          </IconButton>
                        </Tooltip>
                      )
                    }}
                  />
                </div>

                <div
                  className="input-wrapper"
                  style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                  <Button className="form-control" onClick={handleReferrals}>
                    See All Referrals
                  </Button>
                  <Tooltip
                    title={
                      <>
                        <h6 style={{ marginBottom: '0.5rem' }}>
                          HOW DO I EARN REFERRAL REWARDS?
                        </h6>
                        <p style={{ marginBottom: '0.5rem' }}>
                          Referral earnings depend on your referrals' deposit activity and
                          are calculated based on{' '}
                          <span style={{ fontWeight: 'bold', color: '#28a745' }}>5%</span> of
                          the deposit amount of your referred users.
                        </p>
                        <p style={{ marginBottom: '0.5rem' }}>
                          For example, if your referral deposits{' '}
                          <strong>{convertToCurrency(100, solPrice)}</strong> in total, you
                          will earn 5% which is{' '}
                          <strong>{convertToCurrency(5, solPrice)}</strong>.
                        </p>
                      </>
                    }
                    placement="top"
                  >
                    <Info
                      style={{
                        cursor: 'pointer',
                        float: 'right',
                        paddingLeft: '5px'
                      }}
                    />
                  </Tooltip>
                </div>

                <div>
                  <TextField
                    className="form-control"
                    value={link}
                    variant="filled"
                    label="CHANGE BIO"
                    readOnly
                  />
                </div>
                <div>
                  <Button className="form-control" onClick={handleLink}>
                    CHANGE BIO
                  </Button>
                </div>

                <div>
                  <TextField
                    className="form-control"
                    value={username}
                    variant="filled"
                    label="USERNAME"
                    readOnly
                  />
                </div>
                <div>
                  <Button className="form-control" onClick={handleNewUsername}>
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
                    value={password}
                    variant="filled"
                    label="PASSWORD"
                    autoComplete="off"
                    onChange={handleChangePassword}
                  />
                </div>
                <div>
                  <TextField
                    type="password"
                    InputLabelProps={{
                      shrink: true
                    }}
                    className="form-control"
                    variant="filled"
                    label="PASSWORD"
                    autoComplete="off"
                    value={passwordConfirmation}
                    onChange={handleChangePasswordConfirmation}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 1: Stats */}
          {activeTab === 1 && (
            <div className="user-statistics">
              <StatisticsForm
                onDropdownChange={handleDropdownChange}
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
                rank={totalWagered}
                netProfit={netProfit}
                profitAllTimeHigh={profitAllTimeHigh}
                profitAllTimeLow={profitAllTimeLow}
                averageWager={averageWager}
                averageGamesPlayedPerRoom={averageGamesPlayedPerRoom}
                solPrice={solPrice}
                averageProfit={averageProfit}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 0 && (
          <div className="modal-footer">
            <Button className="btn-submit" onClick={saveUserInfo}>
              Save
            </Button>
          </div>
        )}
      </div>

      {/* New Username Modal */}
      <Modal
        isOpen={isNewUsernameModalOpen}
        onRequestClose={handleCloseNewUsernameModal}
        style={customStyles}
        contentLabel="New Username Modal"
      >
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title title">ENTER NEW USERNAME</h2>
            <Button className="btn-close title" onClick={handleCloseModal}>
              ×
            </Button>
          </div>
          <div className="modal-body">
            <div className="modal-content-wrapper">
              <div className="modal-content-panel">
                <div className="input-username">
                  <TextField
                    label="e.g. PUSSY_D3STROY3R"
                    value={newUsername}
                    onChange={handleChangeUsername}
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
            <Button className="btn-submit" onClick={changeUserNameHandler}>
              Update
            </Button>
            <Button className="btn-back" onClick={handleCloseNewUsernameModal}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Link Modal */}
      <Modal
        isOpen={isLinkModalOpen}
        onRequestClose={handleCloseLinkModal}
        style={customStyles}
        contentLabel="New Link Modal"
      >
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title title">ENTER NEW BIO</h2>
            <Button className="btn-close title" onClick={handleCloseModal}>
              ×
            </Button>
          </div>
          <div className="modal-body">
            <div className="modal-content-wrapper">
              <div className="modal-content-panel">
                <div className="input-username">
                  <TextField
                    label="e.g. a link"
                    value={link}
                    onChange={handleChangeLink}
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
            <Button className="btn-submit" onClick={changeLinkHandler}>
              Update
            </Button>
            <Button className="btn-back" onClick={handleCloseLinkModal}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Referrals Modal */}
      <Modal
        isOpen={isReferralsModalOpen}
        onRequestClose={handleCloseReferralsModal}
        style={customStyles}
        contentLabel="Referrals Modal"
      >
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title title">ALL REFERRALS</h2>
            <Button className="btn-close title" onClick={handleCloseModal}>
              ×
            </Button>
          </div>
          {showPlayerModal && (
            <PlayerModal
              selectedCreator={selectedCreator}
              modalIsOpen={showPlayerModal}
              closeModal={handleClosePlayerModal}
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
                                handleOpenPlayerModal(customerInfo[reward.user]._id)
                              }
                            >
                              <Avatar
                                src={customerInfo[reward.user].avatar}
                                alt="User Avatar"
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
                      <div
                        style={{
                          border: '2px solid rgb(40, 167, 69)',
                          borderRadius: '0.3em',
                          padding: '2px'
                        }}
                      >
                        <Typography
                          style={{ margin: 'auto', textAlign: 'center', color: 'rgb(40, 167, 69)' }}
                          variant="body2"
                        >
                          + {convertToCurrency(reward.amount, solPrice)}
                        </Typography>
                      </div>
                    </Grid>
                  ))}
                </Grid>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button className="btn-back" onClick={handleCloseReferralsModal}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}

// ----------------------
// Redux Setup
// ----------------------
const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  userInfo: state.auth.user,
  solPrice: state.logic.solPrice,
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