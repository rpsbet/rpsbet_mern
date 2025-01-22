import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';

import {
  Tabs,
  Tab,
  Button,
  Tooltip,
  IconButton,
  TextField,
  Grid,
  Typography,
  Box,
  Modal,
  Skeleton,
  InputAdornment
} from '@mui/material';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { Info, Warning } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEdit, faChartBar } from '@fortawesome/free-solid-svg-icons';

import AvatarUpload from './upload/AvatarUpload';
import StatisticsForm from '../../admin_panel/app/Customer/EditCustomerPage/StatisticsForm';
import PlayerModal from './PlayerModal';
import Avatar from '../../components/Avatar';

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
import { convertToCurrency } from '../../util/conversion';

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
  // MUI "Modal" Styles
  // -----------------------------
  const modalBoxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: '#400068', // Purple background
    color: '#fff',
    boxShadow: 24,
    borderRadius: 1,
    p: 3,
    width: 600,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  // We can reuse the same style for nested modals:
  const nestedModalBoxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: '#400068',
    color: '#fff',
    boxShadow: 24,
    borderRadius: 1,
    p: 3,
    width: 500,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto'
  };

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

  // Manage modals
  const [isReferralsModalOpen, setIsReferralsModalOpen] = useState(false);
  const [isNewUsernameModalOpen, setIsNewUsernameModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Password fields
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  // Spending status
  const [status, setStatus] = useState('');

  // Nested PlayerModal
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');

  // Profile fields
  const [avatar, setAvatar] = useState(userInfo.avatar);
  const [rank, setRank] = useState(userInfo.totalWagered);
  const [dateJoined, setDateJoined] = useState(userInfo.created_at);
  const [creditScore, setCreditScore] = useState(userInfo.credit_score);
  const [newUsername, setNewUsername] = useState('');

  // Stats from fetchStatisticsData
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

  // Loading state for updates
  const [isLoading, setIsLoading] = useState(false);

  // -----------------------------
  // Lifecycle & Derived State
  // -----------------------------
  useEffect(() => {
    // If parent updates userInfo, reflect changes
    setAvatar(userInfo.avatar);
    setUsername(userInfo.username);
    setReferralCode(userInfo.referralCode || '');
    setRewards(userInfo.rewards || []);
  }, [userInfo]);

  useEffect(() => {
    // On mount, fetch spending habit & user stats
    const loadData = async () => {
      const data = await dispatchGetSpendingHabit(userInfo._id);
      if (data) {
        setStatus(data.status);
      }

      rewards.forEach(async (reward) => {
        const info = await acGetCustomerInfo(reward.user);
        if (info) {
          setCustomerInfo((prev) => ({ ...prev, [reward.user]: info }));
        }
      });

      await fetchStatisticsData();
    };

    loadData();
    // eslint-disable-next-line
  }, []);

  // -----------------------------
  // Data Fetch
  // -----------------------------
  const fetchStatisticsData = async () => {
    const result = await dispatchGetCustomerStatisticsData(
      userInfo._id,
      actorType,
      gameType,
      timeType
    );
    if (!result) return;

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

  // -----------------------------
  // Spending Habits
  // -----------------------------
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

  const { color, title, message, progress } = getStatusDetails(status);
  const barStyle = {
    width: `${progress}%`,
    backgroundColor: progress <= 50 ? 'yellow' : 'green'
  };

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleCloseProfileModal = () => {
    // Re-fetch user info from the server to reflect any changes
    getUser(true);
    closeModal();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleChangePassword = (e) => setPassword(e.target.value);
  const handleChangePasswordConfirmation = (e) => setPasswordConfirmation(e.target.value);

  const handleDropdownChange = async (dropdownName, selectedValue) => {
    if (dropdownName === 'actorType') setActorType(selectedValue);
    if (dropdownName === 'gameType') setGameType(selectedValue);
    if (dropdownName === 'timeType') setTimeType(selectedValue);

    setTimeout(() => {
      fetchStatisticsData();
    }, 0);
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

  // -----------------------------
  // Save / Update Profile
  // -----------------------------
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
        img.crossOrigin = 'anonymous';
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
                const success = await changePasswordAndAvatar(password, base64Avatar);
                if (success) {
                  handleCloseProfileModal();
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
      handleCloseProfileModal
    ]
  );

  // -----------------------------
  // Username
  // -----------------------------
  const handleNewUsername = () => setIsNewUsernameModalOpen(true);
  const handleCloseNewUsernameModal = () => setIsNewUsernameModalOpen(false);
  const handleChangeUsername = (e) => setNewUsername(e.target.value);

  const changeUserNameHandler = async () => {
    if (containsBadLanguage(newUsername)) {
      alertModal(isDarkMode, `Username contains reserved words.`);
      return;
    }
    if (newUsername.trim() === '') {
      alertModal(isDarkMode, 'Username cannot be empty. Please enter something.');
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
        'Username might be taken or an error occurred. Try again.'
      );
    }
  };

  // -----------------------------
  // Link / Bio
  // -----------------------------
  const handleLink = () => setIsLinkModalOpen(true);
  const handleCloseLinkModal = () => setIsLinkModalOpen(false);
  const handleChangeLink = (e) => setLink(e.target.value);

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

  // -----------------------------
  // Referrals
  // -----------------------------
  const handleReferrals = () => {
    setIsReferralsModalOpen(true);
  };
  const handleCloseReferralsModal = () => setIsReferralsModalOpen(false);

  // -----------------------------
  // PlayerModal for each referral
  // -----------------------------
  const handleOpenPlayerModal = (creator_id) => {
    setSelectedCreator(creator_id);
    setShowPlayerModal(true);
  };
  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
  };

  // -----------------------------
  // Derived Data
  // -----------------------------
  const isLinkUrl = /^https?:\/\//.test(link);

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <>
      {/* Main Profile Modal */}
      <Modal
        open={modalIsOpen}
        onClose={handleCloseProfileModal}
        sx={{ zIndex: 1300 }}
        BackdropProps={{ style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' } }}
      >
        <Box sx={modalBoxStyle}>
          {/* HEADER */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
            >
              <FontAwesomeIcon icon={faUser} style={{ marginRight: 8 }} />
              Your Profile
            </Typography>
            <Button variant="text" color="error" onClick={handleCloseProfileModal}>
              X
            </Button>
          </Box>

          {/* BODY */}
          <Tabs value={activeTab} onChange={handleTabChange} textColor="inherit">
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FontAwesomeIcon icon={faEdit} />
                  Edit Profile
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FontAwesomeIcon icon={faChartBar} />
                  Stats
                </Box>
              }
            />
          </Tabs>

          {/* EDIT PROFILE TAB */}
          {activeTab === 0 && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {loading ? (
                <Skeleton variant="rectangular" sx={{ width: '100%', height: 200 }} />
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <AvatarUpload
                    setImageFilename={(filename) => {
                      setUserInfo({ ...userInfo, avatar: filename });
                    }}
                    darkMode={isDarkMode}
                    rank={rank}
                    username={username}
                    avatar={avatar}
                  />

                  <Box
                    sx={{
                      mt: 3,
                      borderTop: '2px solid',
                      borderBottom: '2px solid',
                      textAlign: 'center',
                      py: 1
                    }}
                  >
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                      {username}
                    </Typography>
                    {isLinkUrl ? (
                      <Typography
                        component="a"
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: '#fff' }}
                      >
                        {link}
                      </Typography>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#fff' }}>
                        {link}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* FORM FIELDS */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Referral Code */}
                <TextField
                  variant="filled"
                  color="secondary"
                  label="REFERRAL CODE"
                  value={referralCode}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'} arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleCopyToClipboard(referralCode)}
                        >
                          <FileCopyIcon />
                        </IconButton>
                      </Tooltip>
                    )
                  }}
                />

                {/* See Referrals */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button variant="contained" onClick={handleReferrals}>
                    See All Referrals
                  </Button>
                  <Tooltip
                    title={
                      <Box>
                        <Typography variant="subtitle1">
                          HOW DO I EARN REFERRAL REWARDS?
                        </Typography>
                        <Typography variant="body2">
                          Referral earnings depend on your referrals' deposit activity, usually 5%
                          of their deposit total. If your referral deposits{' '}
                          <strong>{convertToCurrency(100, solPrice)}</strong> total, you earn{' '}
                          <strong>{convertToCurrency(5, solPrice)}</strong>.
                        </Typography>
                      </Box>
                    }
                    placement="top"
                  >
                    <Info sx={{ cursor: 'pointer' }} />
                  </Tooltip>
                </Box>

                {/* Bio */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    variant="filled"
                    color="secondary"
                    label="CHANGE BIO"
                    value={link}
                    InputProps={{
                      readOnly: true
                    }}
                    sx={{ flex: 1 }}
                  />
                  <Button variant="contained" onClick={handleLink}>
                    Change Bio
                  </Button>
                </Box>

                {/* Username */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    variant="filled"
                    color="secondary"
                    label="USERNAME"
                    value={username}
                    InputProps={{ readOnly: true }}
                    sx={{ flex: 1 }}
                  />
                  <Button variant="contained" onClick={handleNewUsername}>
                    Change Username
                  </Button>
                </Box>

                {/* Password */}
                <TextField
                  variant="filled"
                  color="secondary"
                  type="password"
                  label="PASSWORD"
                  autoComplete="off"
                  value={password}
                  onChange={handleChangePassword}
                />

                {/* Password Confirmation */}
                <TextField
                  variant="filled"
                  color="secondary"
                  type="password"
                  label="CONFIRM PASSWORD"
                  autoComplete="off"
                  value={passwordConfirmation}
                  onChange={handleChangePasswordConfirmation}
                />
              </Box>
            </Box>
          )}

          {/* STATS TAB */}
          {activeTab === 1 && (
            <Box sx={{ mt: 2 }}>
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
            </Box>
          )}

          {/* FOOTER (Only show SAVE if on Edit Profile tab) */}
          {activeTab === 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="contained" color="error" onClick={saveUserInfo}>
                Save
              </Button>
            </Box>
          )}
        </Box>
      </Modal>

      {/* NEW USERNAME MODAL */}
      <Modal
        open={isNewUsernameModalOpen}
        onClose={handleCloseNewUsernameModal}
        sx={{ zIndex: 1300 }}
        BackdropProps={{ style: { backgroundColor: 'rgba(0,0,0,0.8)' } }}
      >
        <Box sx={nestedModalBoxStyle}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              ENTER NEW USERNAME
            </Typography>
            <Button variant="text" color="error" onClick={handleCloseProfileModal}>
              X
            </Button>
          </Box>

          <Box sx={{ mb: 2 }}>
            <TextField
              variant="filled"
              color="secondary"
              label="e.g. PUSSY_D3STROY3R"
              value={newUsername}
              onChange={handleChangeUsername}
              autoComplete="off"
              inputProps={{ maxLength: 12 }}
              fullWidth
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="contained" color="error" onClick={changeUserNameHandler}>
              Update
            </Button>
            <Button variant="contained" color="secondary" onClick={handleCloseNewUsernameModal}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* LINK (BIO) MODAL */}
      <Modal
        open={isLinkModalOpen}
        onClose={handleCloseLinkModal}
        sx={{ zIndex: 1300 }}
        BackdropProps={{ style: { backgroundColor: 'rgba(0,0,0,0.8)' } }}
      >
        <Box sx={nestedModalBoxStyle}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              ENTER NEW BIO
            </Typography>
            <Button variant="text" color="error" onClick={handleCloseProfileModal}>
              X
            </Button>
          </Box>

          <Box sx={{ mb: 2 }}>
            <TextField
              variant="filled"
              color="secondary"
              label="e.g. a link"
              value={link}
              onChange={handleChangeLink}
              autoComplete="off"
              multiline
              maxRows={4}
              inputProps={{ maxLength: 40 }}
              fullWidth
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button variant="contained" color="error" onClick={changeLinkHandler}>
              Update
            </Button>
            <Button variant="contained" color="secondary" onClick={handleCloseLinkModal}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* REFERRALS MODAL */}
      <Modal
        open={isReferralsModalOpen}
        onClose={handleCloseReferralsModal}
        sx={{ zIndex: 1300 }}
        BackdropProps={{ style: { backgroundColor: 'rgba(0,0,0,0.8)' } }}
      >
        <Box sx={modalBoxStyle}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              ALL REFERRALS
            </Typography>
            <Button variant="text" color="error" onClick={handleCloseProfileModal}>
              X
            </Button>
          </Box>

          {/* PlayerModal for each referral (nested) */}
          {showPlayerModal && (
            <PlayerModal
              selectedCreator={selectedCreator}
              modalIsOpen={showPlayerModal}
              closeModal={handleClosePlayerModal}
            />
          )}

          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {rewards.map((reward, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  {customerInfo[reward.user] && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Button
                        variant="text"
                        onClick={() => handleOpenPlayerModal(customerInfo[reward.user]._id)}
                        sx={{ p: 0, minWidth: 0 }}
                      >
                        <Avatar
                          src={customerInfo[reward.user].avatar}
                          rank={customerInfo[reward.user].totalWagered}
                          accessory={customerInfo[reward.user].accessory}
                          username={customerInfo[reward.user].username}
                        />
                      </Button>
                      <Typography variant="body1">
                        {customerInfo[reward.user].username}
                      </Typography>
                    </Box>
                  )}
                  <Box
                    sx={{
                      border: '2px solid rgb(40, 167, 69)',
                      borderRadius: 1,
                      p: 0.5,
                      mt: 1,
                      textAlign: 'center'
                    }}
                  >
                    <Typography sx={{ color: 'rgb(40, 167, 69)' }} variant="body2">
                      + {convertToCurrency(reward.amount, solPrice)}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="contained" color="secondary" onClick={handleCloseReferralsModal}>
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
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