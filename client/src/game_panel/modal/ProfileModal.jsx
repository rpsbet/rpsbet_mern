import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Modal,
  Box,
  Tabs,
  Tab,
  Button,
  Tooltip,
  IconButton,
  TextField,
  Grid,
  Typography,
  Chip,
  CircularProgress,
  ThemeProvider,
  useMediaQuery,
} from '@mui/material';
import { FileCopy as FileCopyIcon, Info as InfoIcon } from '@mui/icons-material';
import CircleIcon from '@mui/icons-material/Circle';
import LinkIcon from '@mui/icons-material/Link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEdit, faChartBar } from '@fortawesome/free-solid-svg-icons';

import PlayerModal from './PlayerModal';
import AvatarUpload from './upload/AvatarUpload';
import Avatar from '../../components/Avatar';
import StatisticsForm from '../../admin_panel/app/Customer/EditCustomerPage/StatisticsForm';

import {
  setUserInfo,
  changePasswordAndAvatar,
  getUser,
  changeLink,
  changeUserName,
  setReferralCode,
} from '../../redux/Auth/user.actions';
import { errorMsgBar } from '../../redux/Notification/notification.actions';

import {
  acGetCustomerInfo,
  getSpendingHabit,
} from '../../redux/Customer/customer.action';
import { convertToCurrency } from '../../util/conversion';
import { getCustomTheme } from '../../config/theme';

function ProfileModal({ modalIsOpen, closeModal }) {
  const dispatch = useDispatch();
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const userInfo = useSelector((state) => state.auth.user);
  const solPrice = useSelector((state) => state.logic.solPrice);
  const loading = useSelector((state) => state.logic.isActiveLoadingOverlay);
  const connectedAccount = useSelector((state) => state.auth.connectedAccount);

  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Destructure user info
  const {
    _id,
    rewards,
    username: initialUsername,
    bio: initialLink,
    avatar: initialAvatar,
    accessory,
    totalWagered,
    referralCode,
    referralUsername,
    created_at: dateJoined,
    credit_score: initialCreditScore,
    accounts = [],
  } = userInfo;

  // Local state
  const [actorType, setActorType] = useState('Both');
  const [gameType, setGameType] = useState('All');
  const [timeType, setTimeType] = useState('24');

  const [rewardsState, setRewardsState] = useState(rewards || []);
  const [username, setUsername] = useState(initialUsername || '');
  const [link, setLink] = useState(initialLink || '');
  const [avatar, setAvatar] = useState(initialAvatar || '');
  const [referralCodeState, setReferralCodeState] = useState(referralCode || '');
  const [referralUsernameState, setReferralUsernameState] = useState(referralUsername || '');
  const [referralInput, setReferralInput] = useState('');
  const [isReferralLoading, setIsReferralLoading] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({});
  const [copied, setCopied] = useState(false);

  const [activeTab, setActiveTab] = useState(0);
  const [loadingState, setLoadingState] = useState(loading || false);

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [status, setStatus] = useState('');
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [referredUser, setReferredUser] = useState(null);

  const [rank, setRank] = useState(totalWagered);
  const [newUsername, setNewUsername] = useState('');
  const [isNewUsernameModalOpen, setIsNewUsernameModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isReferralsModalOpen, setIsReferralsModalOpen] = useState(false);

  // Stats form data
  const [deposit, setDeposit] = useState(0);
  const [withdraw, setWithdraw] = useState(0);
  const [gameProfit, setGameProfit] = useState(0);
  const [balance, setBalance] = useState(0);
  const [gamePlayed, setGamePlayed] = useState(0);
  const [totalTraded, setTotalTraded] = useState(0);
  const [tradingProfit, setTradingProfit] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [averageProfit, setAverageProfit] = useState(0);
  const [creditScore, setCreditScore] = useState(initialCreditScore);

  // Effects
  useEffect(() => {
    fetchSpendingHabit(_id);
    fetchCustomerInfoForRewards(rewardsState);
    fetchStatisticsData();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setLoadingState(loading);
  }, [loading]);

  // Sync local state if userInfo changes
  useEffect(() => {
    setAvatar(userInfo.avatar);
    setUsername(userInfo.username);
    setReferralCodeState(userInfo.referralCode);
    setReferralUsernameState(userInfo.referralUsername);
    setRank(userInfo.totalWagered);
    setRewardsState(userInfo.rewards || []);
  }, [userInfo]);

  // Async functions
  const fetchSpendingHabit = async (userId) => {
    const data = await dispatch(getSpendingHabit(userId));
    if (data) {
      setStatus(data.status);
    }
  };

  const fetchCustomerInfoForRewards = async (rewardsArr) => {
    for (const reward of rewardsArr) {
      const info = await dispatch(acGetCustomerInfo(reward.user));
      if (info) {
        setCustomerInfo((prev) => ({ ...prev, [reward.user]: info }));
      }
    }
  };

  const fetchStatisticsData = () => {
    if (userInfo) {
      setGameProfit(userInfo.gameProfit || 0);
      setBalance(userInfo.balance || 0);
      setGamePlayed(userInfo.gamePlayed || 0);
      setNetProfit(userInfo.gameProfit || 0);
      setTotalTraded(userInfo.totalTraded || 0);
      setTradingProfit(userInfo.tradingProfit || 0);
    }
  };

  // Handlers
  const handleClose = () => {
    dispatch(getUser(true));
    closeModal();
  };

  const handleSaveReferralCode = async () => {
    setIsReferralLoading(true);
    try {
      const result = await dispatch(setReferralCode(referralInput.trim()));
      if (result.success) {
        setReferredUser(result.referredUser);
        setReferralUsernameState(result.referredUser);
      } else {
        setReferredUser(null);
        setReferralUsernameState('');
        dispatch(errorMsgBar(result.error || 'Failed to apply referral code.'));
      }
    } catch (error) {
      console.error('Error saving referral code:', error);
      dispatch(errorMsgBar('An error occurred while saving the referral code.'));
    } finally {
      setIsReferralLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleDropdownChange = async (dropdownName, selectedValue) => {
    if (dropdownName === 'actorType') setActorType(selectedValue);
    else if (dropdownName === 'gameType') setGameType(selectedValue);
    else if (dropdownName === 'timeType') setTimeType(selectedValue);
    await fetchStatisticsData();
  };

  const getStatusDetails = (st) => {
    switch (st) {
      case 'very good':
        return {
          color: 'rgb(118 221 119)',
          title: 'JEWISH DJEDI',
          message: 'Your greed is fueling your growth!',
          progress: 100,
        };
      case 'good':
        return {
          color: 'rgb(3 221 255)',
          title: 'SEASONED CZAR',
          message: 'Your spending habits are commendable.',
          progress: 80,
        };
      case 'average':
        return {
          color: '#ffc107',
          title: 'UNCONSCIOUS COMPETENT',
          message: 'You’re doing fine, but there’s room for improvement.',
          progress: 60,
        };
      case 'bad':
        return {
          color: '#fd7e14',
          title: 'PEASANT PUPPET',
          message: 'Consider revisiting your spending strategy.',
          progress: 40,
        };
      case 'very bad':
        return {
          color: '#dc3545',
          title: 'MISERABLE MULE',
          message: 'Your spending habits need serious improvement.',
          progress: 20,
        };
      default:
        return {
          color: '#6c757d',
          title: 'Unknown',
          message: 'Unable to determine spending habits.',
          progress: 0,
        };
    }
  };

  const { color, title, message: spendingMessage, progress: progressValue } = getStatusDetails(status);
  const barStyle = {
    width: `${progressValue}%`,
    backgroundColor: progressValue <= 50 ? 'yellow' : 'green',
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleAvatarLoaded = (filename) => {
    dispatch(setUserInfo({ ...userInfo, avatar: filename }));
  };

  const handleChangePassword = (e) => setPassword(e.target.value);
  const handleChangePasswordConfirmation = (e) => setPasswordConfirmation(e.target.value);

  const saveUserInfo = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      dispatch(errorMsgBar(`PASSWORD CONFIRMATION DOESN'T MATCH NEW PASSWORD`));
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
        if (width > height && width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        } else if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
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
              const is_success = await dispatch(changePasswordAndAvatar(password, base64Avatar));
              if (is_success) {
                closeModal();
              }
            };
          },
          'image/webp',
          0.5
        );
      };
    } catch (error) {
      console.error('Error converting image to WebP:', error);
      dispatch(errorMsgBar('Failed to convert image. Please try again.'));
    }
  };

  const containsBadLanguage = (checkUsername) => {
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
      'BoT',
    ];
    return explicitWords.some((word) => checkUsername.toLowerCase().includes(word));
  };

  const changeUserName = async () => {
    if (containsBadLanguage(newUsername)) {
      dispatch(errorMsgBar(`Username contains reserved words.`));
      return;
    }
    if (newUsername.trim() === '') {
      dispatch(errorMsgBar('Username cannot be empty. Please enter some text.'));
      return;
    }
    setLoadingState(true);
    try {
      const result = await dispatch(_changeUserName(newUsername));
      if (result.success) {
        setLoadingState(false);
        setIsNewUsernameModalOpen(false);
      } else {
        setLoadingState(false);
        dispatch(errorMsgBar('USERNAME ALREADY EXISTS. CHOOSE A DIFFERENT ONE.'));
      }
    } catch (e) {
      setLoadingState(false);
      dispatch(errorMsgBar(`Username might be taken. Try something else more original.`));
    }
  };

  const changeBio = async () => {
    if (containsBadLanguage(link)) {
      dispatch(errorMsgBar(`Bio contains reserved words.`));
      return;
    }
    setLoadingState(true);
    try {
      const result = await dispatch(_changeLink(link));
      if (result.success) {
        setLoadingState(false);
        setIsLinkModalOpen(false);
      } else {
        setLoadingState(false);
        dispatch(errorMsgBar('FAILED TO UPDATE BIO'));
      }
    } catch (e) {
      setLoadingState(false);
      dispatch(errorMsgBar('FAILED TO UPDATE BIO'));
    }
  };

  const handleReferrals = () => {
    setIsReferralsModalOpen(true);
  };

  const handleOpenPlayerModal = (creatorId) => {
    setShowPlayerModal(true);
    setSelectedCreator(creatorId);
  };
  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
  };

  const isBioUrl = /^https?:\/\//.test(link);
  const shortenAddress = (address) => {
    if (!address) return '';
    return address.slice(0, 6) + '...' + address.slice(-6);
  };

  return (
    <ThemeProvider theme={theme}>
      <>
        <Modal open={modalIsOpen || false} onClose={closeModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: isDarkMode ? '#2D3A4B' : '#fff',
              color: isDarkMode ? '#fff' : '#000',
              width: '80vw',
              maxWidth: 600,
              maxHeight: '80vh',
              overflowY: 'auto',
              borderRadius: 1,
              p: 3,
              boxShadow: 24,
            }}
          >
            <Box>
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2" className="modal-title title">
                  <FontAwesomeIcon icon={faUser} style={{ marginRight: 8 }} />
                  Your Profile
                </Typography>
                <Button color="error" onClick={closeModal}>
                  ×
                </Button>
              </Box>
              {/* Tabs */}
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                textColor="error"
                indicatorColor="error"
                sx={{
                  '& .MuiTabs-indicator': { backgroundColor: 'error.main', height: '3px' },
                }}
              >
                <Tab label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faEdit} style={{ marginRight: 4 }} />
                    Edit Profile
                  </Box>
                } />
                <Tab label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FontAwesomeIcon icon={faChartBar} style={{ marginRight: 4 }} />
                    Stats
                  </Box>
                } />
              </Tabs>
              {activeTab === 0 && (
                <Box sx={{ background: '#2D3A4A', borderRadius: '0.3em', p: '20px' }}>
                  {loadingState ? (
                    <CircularProgress color="error" />
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                      <AvatarUpload
                        setImageFilename={handleAvatarLoaded}
                        darkMode={isDarkMode}
                        rank={rank}
                        username={username}
                        accessory={accessory}
                        avatar={avatar}
                        user_id={_id}
                      />
                      <Box sx={{ mt: 3, borderBottom: '2px solid', textAlign: 'center', width: '100%' }}>
                        <Typography variant="h5" sx={{ mt: 1, mb: 1 }}>{username}</Typography>
                        {isBioUrl ? (
                          <a
                            href={link}
                            style={{
                              fontSize: '1.1em',
                              color: isDarkMode ? '#e5e5e5' : '#333',
                              textDecoration: 'none',
                            }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {link}
                          </a>
                        ) : (
                          <Typography variant="body1" sx={{ fontSize: '1.1em', color: isDarkMode ? '#e5e5e5' : '#333', mb: 2 }}>
                            {link}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                  <Box className="modal-edit-panel" sx={{ mt: 2 }}>
                    <Box sx={{ mb: 2, background: '#2D3A4A', borderRadius: '0.3em', p: '20px' }}>
                      <Typography variant="h6" gutterBottom>A.K.A</Typography>
                      {accounts.length === 0 ? (
                        <p>No associated accounts found.</p>
                      ) : (
                        <Grid container spacing={1}>
                          {accounts.map((acc, index) => {
                            const displayed = isMobile ? shortenAddress(acc) : acc;
                            const isConnected = connectedAccount?.toLowerCase() === acc.toLowerCase();
                            return (
                              <Grid item xs={12} key={index}>
                                <Box display="flex" alignItems="center">
                                  <Chip label={displayed} variant="outlined" sx={{ mr: 1 }} />
                                  {isConnected && (
                                    <CircleIcon sx={{ color: '#00ff3a', mr: 1 }} fontSize="xx-small" />
                                  )}
                                  <IconButton
                                    component="a"
                                    href={`https://solscan.io/account/${acc}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="small"
                                  >
                                    <LinkIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Grid>
                            );
                          })}
                        </Grid>
                      )}
                    </Box>
                    {!referralUsernameState && (
                      <>
                        <Typography variant="h6" gutterBottom>REFERRED BY</Typography>
                        <TextField
                          variant="filled"
                          label="Enter Referral Code"
                          color="error"
                          value={referralInput}
                          onChange={(e) => setReferralInput(e.target.value)}
                          sx={{ mb: 1, width: '100%' }}
                        />
                        <Button
                          sx={{ mb: 1, width: '100%' }}
                          color="error"
                          variant="outlined"
                          onClick={handleSaveReferralCode}
                          disabled={isReferralLoading}
                        >
                          {isReferralLoading ? <CircularProgress size={24} sx={{ color: '#000' }} /> : 'Save Referral Code'}
                        </Button>
                      </>
                    )}
                    {referralUsernameState && (
                      <Typography variant="body2" sx={{ color: '#f44336', mt: 1, mb: 2 }}>
                        REFERRED BY: <strong>{referralUsernameState}</strong>
                      </Typography>
                    )}
                    <TextField
                      color="error"
                      variant="filled"
                      label="YOUR REFERRAL CODE"
                      value={referralCodeState}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'} placement="top">
                            <IconButton color="inherit" onClick={() => handleCopyToClipboard(referralCodeState)}>
                              <FileCopyIcon />
                            </IconButton>
                          </Tooltip>
                        ),
                      }}
                      sx={{ mb: 2, width: '100%' }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Button
                        color="error"
                        variant="outlined"
                        sx={{ flex: 1 }}
                        onClick={handleReferrals}
                      >
                        See All Referrals
                      </Button>
                      <Tooltip
                        title={
                          <>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              HOW DO I EARN REFERRAL REWARDS?
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              Referral earnings depend on your referrals' deposit activity and are calculated based on
                              <Box component="span" sx={{ fontWeight: 'bold', color: '#28a745' }}>
                                &nbsp;1%&nbsp;
                              </Box>
                              of the deposit amount of your referred users.
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              For example, if your referral deposits
                              <Box component="span" sx={{ fontWeight: 'bold' }}>
                                &nbsp;{convertToCurrency(100, solPrice)}
                              </Box>
                              &nbsp;in total, you will earn 1% which is
                              <Box component="span" sx={{ fontWeight: 'bold' }}>
                                &nbsp;{convertToCurrency(1, solPrice)}
                              </Box>
                              .
                            </Typography>
                          </>
                        }
                        placement="top"
                      >
                        <InfoIcon sx={{ cursor: 'pointer', ml: 1 }} />
                      </Tooltip>
                    </Box>
                    <TextField
                      color="error"
                      variant="filled"
                      label="CHANGE BIO"
                      value={link}
                      InputProps={{ readOnly: true }}
                      sx={{ mb: 1, width: '100%' }}
                    />
                    <Button
                      color="error"
                      variant="outlined"
                      sx={{ mb: 2, width: '100%' }}
                      onClick={() => setIsLinkModalOpen(true)}
                    >
                      CHANGE BIO
                    </Button>
                    <TextField
                      color="error"
                      variant="filled"
                      label="USERNAME"
                      value={username}
                      InputProps={{ readOnly: true }}
                      sx={{ mb: 1, width: '100%' }}
                    />
                    <Button
                      color="error"
                      variant="outlined"
                      sx={{ mb: 2, width: '100%' }}
                      onClick={() => setIsNewUsernameModalOpen(true)}
                    >
                      Change Username
                    </Button>
                    <TextField
                      color="error"
                      type="password"
                      variant="filled"
                      label="PASSWORD"
                      autoComplete="off"
                      value={password}
                      onChange={handleChangePassword}
                      sx={{ mb: 1, width: '100%' }}
                    />
                    <TextField
                      color="error"
                      type="password"
                      variant="filled"
                      label="CONFIRM PASSWORD"
                      autoComplete="off"
                      value={passwordConfirmation}
                      onChange={handleChangePasswordConfirmation}
                      sx={{ mb: 2, width: '100%' }}
                    />
                  </Box>
                </Box>
              )}
              {activeTab === 1 && (
                <Box
                  className="user-statistics"
                  sx={{ background: '#2D3A4A', borderRadius: '0.3em', p: '20px' }}
                >
                  <StatisticsForm
                    onDropdownChange={handleDropdownChange}
                    username={username}
                    dateJoined={dateJoined}
                    creditScore={creditScore}
                    title={title}
                    color={color}
                    barStyle={barStyle}
                    message={spendingMessage}
                    actorType={actorType}
                    gameType={gameType}
                    timeType={timeType}
                    gameProfit={gameProfit}
                    balance={balance}
                    gamePlayed={gamePlayed}
                    netProfit={netProfit}
                    totalWagered={totalWagered}
                    rank={rank}
                    solPrice={solPrice}
                    totalTraded={totalTraded}
                    tradingProfit={tradingProfit}
                    averageProfit={averageProfit}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </Modal>

        {/* NEW USERNAME MODAL */}
        <Modal open={isNewUsernameModalOpen} onClose={() => setIsNewUsernameModalOpen(false)}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: isDarkMode ? '#2D3A4B' : '#fff',
              color: isDarkMode ? '#fff' : '#000',
              width: '80vw',
              maxWidth: 600,
              maxHeight: '80vh',
              overflowY: 'auto',
              borderRadius: 1,
              p: 3,
              boxShadow: 24,
            }}
          >
            <Box>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
              >
                <Typography variant="h6">ENTER NEW USERNAME</Typography>
                <Button color="error" onClick={() => setIsNewUsernameModalOpen(false)}>
                  ×
                </Button>
              </Box>
              <Box sx={{ mb: 2 }}>
                <TextField
                  color="error"
                  label="e.g. PUSSY_D3STROY3R"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  variant="filled"
                  autoComplete="off"
                  inputProps={{ maxLength: 12 }}
                  sx={{ width: '100%' }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button color="error" variant="contained" onClick={changeUserName}>
                  Update
                </Button>
                <Button color="error" variant="outlined" onClick={() => setIsNewUsernameModalOpen(false)}>
                  Cancel
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* LINK/BIO MODAL */}
        <Modal open={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: isDarkMode ? '#2D3A4B' : '#fff',
              color: isDarkMode ? '#fff' : '#000',
              width: '80vw',
              maxWidth: 600,
              maxHeight: '80vh',
              overflowY: 'auto',
              borderRadius: 1,
              p: 3,
              boxShadow: 24,
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">ENTER NEW BIO</Typography>
                <Button color="error" onClick={() => setIsLinkModalOpen(false)}>
                  ×
                </Button>
              </Box>
              <Box sx={{ mb: 2 }}>
                <TextField
                  color="error"
                  label="e.g. a link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  variant="filled"
                  autoComplete="off"
                  multiline
                  maxRows={4}
                  inputProps={{ maxLength: 40 }}
                  sx={{ width: '100%' }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button color="error" variant="contained" onClick={changeBio}>
                  Update
                </Button>
                <Button color="error" variant="outlined" onClick={() => setIsLinkModalOpen(false)}>
                  Cancel
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>

        {/* REFERRALS MODAL */}
        <Modal open={isReferralsModalOpen} onClose={() => setIsReferralsModalOpen(false)}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: isDarkMode ? '#2D3A4B' : '#fff',
              color: isDarkMode ? '#fff' : '#000',
              width: '80vw',
              maxWidth: 600,
              maxHeight: '80vh',
              overflowY: 'auto',
              borderRadius: 1,
              p: 3,
              boxShadow: 24,
            }}
          >
            {showPlayerModal && (
              <PlayerModal
                selectedCreator={selectedCreator}
                modalIsOpen={showPlayerModal}
                closeModal={handleClosePlayerModal}
              />
            )}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">ALL REFERRALS</Typography>
                <Button color="error" onClick={() => setIsReferralsModalOpen(false)}>
                  ×
                </Button>
              </Box>
              <Box sx={{ mb: 2, background: '#2D3A4A', borderRadius: '0.3em', p: '20px' }}>
                <Grid container spacing={2}>
                  {rewardsState.map((reward, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      {customerInfo[reward.user] && (
                        <Grid container direction="column" alignItems="center">
                          <Grid item>
                            <a
                              className="player"
                              onClick={() => handleOpenPlayerModal(customerInfo[reward.user]._id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <Avatar
                                src={customerInfo[reward.user].avatar}
                                user_id={customerInfo[reward.user]._id}
                                alt="User Avatar"
                                rank={customerInfo[reward.user].totalWagered}
                                accessory={customerInfo[reward.user].accessory}
                                username={customerInfo[reward.user].username}
                              />
                            </a>
                          </Grid>
                          <Grid item>
                            <Typography variant="body1">{customerInfo[reward.user].username}</Typography>
                          </Grid>
                        </Grid>
                      )}
                      <Box sx={{ border: '2px solid rgb(40, 167, 69)', borderRadius: '0.3em', p: '2px', textAlign: 'center', mt: 1 }}>
                        <Typography variant="body2" sx={{ color: 'rgb(40, 167, 69)' }}>
                          + {convertToCurrency(reward.amount, solPrice)}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button color="error" variant="outlined" onClick={() => setIsReferralsModalOpen(false)}>
                  Close
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>
      </>
    </ThemeProvider>
  );
}

export default ProfileModal;