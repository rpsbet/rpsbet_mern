import React, { useState, useEffect } from 'react';
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
  Paper,
  Divider,
  Container,
} from '@mui/material';
import { 
  FileCopy as FileCopyIcon, 
  Info as InfoIcon, 
  Close as CloseIcon,
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import CircleIcon from '@mui/icons-material/Circle';
import LinkIcon from '@mui/icons-material/Link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEdit, faChartBar, faLink, faKey, faUserPlus, faUserCheck } from '@fortawesome/free-solid-svg-icons';

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
    elite,
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
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false); // New state for password modal
  const [gameProfit, setGameProfit] = useState(0);
  const [balance, setBalance] = useState(0);
  const [gamePlayed, setGamePlayed] = useState(0);
  const [totalTraded, setTotalTraded] = useState(0);
  const [tradingProfit, setTradingProfit] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  // Effects
  useEffect(() => {
    fetchSpendingHabit(_id);
    fetchCustomerInfoForRewards(rewardsState);
    fetchStatisticsData();
  }, []);

  useEffect(() => {
    setLoadingState(loading);
  }, [loading]);

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
          message: "You're doing fine, but there's room for improvement.",
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
    backgroundColor: progressValue <= 50 ? 'yellow' : '#FF0000',
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

  const saveUserInfo = async () => {
    if (password !== passwordConfirmation) {
      dispatch(errorMsgBar(`PASSWORD CONFIRMATION DOESN'T MATCH NEW PASSWORD`));
      return;
    }
    setLoadingState(true);
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
                setIsPasswordModalOpen(false);
                setPassword('');
                setPasswordConfirmation('');
                dispatch(getUser(true));
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
    } finally {
      setLoadingState(false);
    }
  };

  const containsBadLanguage = (checkUsername) => {
    const explicitWords = [
      'admin',
      'ADMIN',
      'RPSGAME',
      'catsino.fun',
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
      const result = await dispatch(changeUserName(newUsername));
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
      const result = await dispatch(changeLink(link));
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
    return address.slice(0, 12) + '...' + address.slice(-12);
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
              color: '#fff',
              maxHeight: '90vh',
              width: { xs: '95%', sm: '80%', md: '70%', lg: '60%' },
              maxWidth: '900px',
              overflowY: 'auto',
              borderRadius: 2,
              boxShadow: 24,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '@supports not (backdrop-filter: blur(10px))': {
                background: 'rgba(0, 0, 0, 0.85)',
              },
            }}
          >
            <Paper
              elevation={3}
              sx={{
                background: isDarkMode ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderRadius: 2,
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(240, 240, 240, 0.9)',
                }}
              >
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: isDarkMode ? '#fff' : '#333' }}>
                  <FontAwesomeIcon icon={faUser} style={{ marginRight: 12 }} />
                  Your Profile
                </Typography>
                <IconButton
                  onClick={closeModal}
                  sx={{
                    color: isDarkMode ? '#fff' : '#333',
                    '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              {/* Tabs */}
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                textColor="error"
                indicatorColor="error"
                variant="fullWidth"
                sx={{
                  '& .MuiTabs-indicator': { backgroundColor: 'error.main', height: '3px' },
                  '& .MuiTab-root': {
                    fontSize: '1rem',
                    fontWeight: 500,
                    color: isDarkMode ? '#ccc' : '#555',
                    '&.Mui-selected': { color: '#ff0000' },
                  },
                }}
              >
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FontAwesomeIcon icon={faEdit} style={{ marginRight: 8 }} />
                      Edit Profile
                    </Box>
                  }
                />
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FontAwesomeIcon icon={faChartBar} style={{ marginRight: 8 }} />
                      Stats
                    </Box>
                  }
                />
              </Tabs>

              {/* Tab Content */}
              <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                {/* Edit Profile Tab */}
                {activeTab === 0 && (
                  <Grid container spacing={3}>
                    {/* Left Column - Profile Image & Status */}
                    <Grid item xs={12} md={4}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* Avatar Box */}
                        <Box
                          sx={{
                            width: { xs: 180, sm: 220, md: 240 },
                            height: { xs: 180, sm: 220, md: 240 },
                            position: 'relative',
                            mb: 3,
                            borderRadius: '50%',
                            padding: '4px',
                            background: `linear-gradient(45deg, ${color || '#ff0000'}, transparent)`,
                            boxShadow: `0 0 15px 5px ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                          }}
                        >
                          <AvatarUpload
                            setImageFilename={handleAvatarLoaded}
                            darkMode={isDarkMode}
                            rank={rank}
                            username={username}
                            accessory={accessory}
                            elite={elite}
                            avatar={avatar}
                            user_id={_id}
                            style={{ width: '100%', height: '100%' }}
                          />
                        </Box>

                        {/* Username */}
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 700,
                            textAlign: 'center',
                            mb: 2,
                            color: isDarkMode ? '#fff' : '#333',
                          }}
                        >
                          {username}
                          <IconButton
                            size="small"
                            color="error"
                            sx={{ ml: 1 }}
                            onClick={() => setIsNewUsernameModalOpen(true)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Typography>

                        {/* Status/Title */}
                        <Chip
                          label={title}
                          sx={{
                            backgroundColor: color || 'primary.main',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            mb: 3,
                            padding: '20px 10px',
                          }}
                        />

                        {/* Key Metrics */}
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={12}>
                            <Box sx={{ textAlign: 'center' }}>
                              <FontAwesomeIcon icon={faUserCheck} style={{ marginBottom: 8, fontSize: '1.2rem' }} />
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Member Since
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {new Date(dateJoined).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Security Section */}
                        <Paper
                          elevation={1}
                          sx={{
                            mt: 3,
                            p: 3,
                            backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(250, 250, 250, 0.7)',
                            borderRadius: 2,
                          }}
                        >
                          <Button
                            color="error"
                            variant="contained"
                            fullWidth
                            onClick={() => setIsPasswordModalOpen(true)}
                            sx={{ py: 1.5 }}
                          >
                            Change Password
                          </Button>
                        </Paper>
                      </Box>
                    </Grid>

                    {/* Right Column - Bio & Accounts */}
                    <Grid item xs={12} md={8}>
                      {/* Bio Section */}
                      <Box sx={{ mb: 4 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            mb: 2,
                            pb: 1,
                            borderBottom: '2px solid',
                            borderColor: color || 'error.main',
                          }}
                        >
                          About
                        </Typography>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 3,
                            backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(250, 250, 250, 0.7)',
                            borderRadius: 2,
                            minHeight: '120px',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {isBioUrl ? (
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '1.1rem',
                                  color: isDarkMode ? '#e5e5e5' : '#333',
                                  textDecoration: 'none',
                                  fontWeight: 500,
                                }}
                              >
                                {link}
                              </a>
                            ) : (
                              <Typography
                                variant="body1"
                                sx={{
                                  fontSize: '1.1rem',
                                  color: isDarkMode ? '#e5e5e5' : '#333',
                                  fontStyle: link ? 'normal' : 'italic',
                                  fontWeight: 500,
                                }}
                              >
                                {link || 'No bio available'}
                              </Typography>
                            )}
                            <IconButton
                              size="small"
                              color="error"
                              sx={{ ml: 1 }}
                              onClick={() => setIsLinkModalOpen(true)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Paper>
                      </Box>

                      {/* Accounts Section */}
                      <Box sx={{ mb: 4 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            mb: 2,
                            pb: 1,
                            borderBottom: '2px solid',
                            borderColor: color || 'error.main',
                          }}
                        >
                          Associated Addresses
                        </Typography>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 3,
                            backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(250, 250, 250, 0.7)',
                            borderRadius: 2,
                          }}
                        >
                          {accounts.length === 0 ? (
                            <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                              No associated accounts found
                            </Typography>
                          ) : (
                            <Grid container spacing={2}>
                              {accounts.map((acc, index) => {
                                const displayed = isMobile ? shortenAddress(acc) : acc;
                                const isConnected = connectedAccount?.toLowerCase() === acc.toLowerCase();
                                return (
                                  <Grid item xs={12} key={index}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: 1.5,
                                        borderRadius: 1,
                                        backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                                        '&:hover': {
                                          backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)',
                                        },
                                      }}
                                    >
                                      <Typography
                                        variant="body1"
                                        sx={{
                                          fontFamily: 'monospace',
                                          fontWeight: 500,
                                        }}
                                      >
                                        {displayed}
                                      </Typography>
                                      <Box>
                                        {isConnected && (
                                          <Tooltip title="Connected Account" placement="top">
                                            <CircleIcon sx={{ color: '#00ff3a', mr: 1 }} fontSize="small" />
                                          </Tooltip>
                                        )}
                                        <IconButton
                                          sx={{ ml: 1 }}
                                          onClick={() => navigator.clipboard.writeText(acc)}
                                          size="small"
                                          color="primary"
                                        >
                                          <FileCopyIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          component="a"
                                          href={`https://solscan.io/account/${acc}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          size="small"
                                          color="primary"
                                        >
                                          <LinkIcon fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    </Box>
                                  </Grid>
                                );
                              })}
                            </Grid>
                          )}
                        </Paper>
                      </Box>

                      {/* Referral Section */}
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            mb: 2,
                            pb: 1,
                            borderBottom: '2px solid',
                            borderColor: color || 'error.main',
                          }}
                        >
                          Referrals
                        </Typography>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 3,
                            backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(250, 250, 250, 0.7)',
                            borderRadius: 2,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <TextField
                              color="error"
                              size="small"
                              variant="outlined"
                              label="Your Referral Code"
                              value={referralCodeState}
                              InputProps={{
                                readOnly: true,
                                endAdornment: (
                                  <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'} placement="top">
                                    <IconButton
                                      color="inherit"
                                      onClick={() => handleCopyToClipboard(referralCodeState)}
                                    >
                                      {copied ? <CheckCircleIcon color="success" /> : <ContentCopyIcon />}
                                    </IconButton>
                                  </Tooltip>
                                ),
                              }}
                              sx={{ mr: 2, flexGrow: 1 }}
                            />
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<FontAwesomeIcon icon={faUserPlus} />}
                              onClick={handleReferrals}
                            >
                              Referrals
                            </Button>
                          </Box>
                          {!referralUsernameState && (
                            <Box>
                              <TextField
                                variant="outlined"
                                label="Enter Referral Code"
                                color="error"
                                size="small"
                                fullWidth
                                value={referralInput}
                                onChange={(e) => setReferralInput(e.target.value)}
                                sx={{ mb: 2 }}
                              />
                              <Button
                                color="error"
                                variant="outlined"
                                fullWidth
                                onClick={handleSaveReferralCode}
                                disabled={isReferralLoading || !referralInput.trim()}
                              >
                                {isReferralLoading ? (
                                  <CircularProgress size={24} color="error" />
                                ) : (
                                  'Apply Referral Code'
                                )}
                              </Button>
                            </Box>
                          )}
                          {referralUsernameState && (
                            <Chip
                              icon={<FontAwesomeIcon icon={faUserCheck} />}
                              label={`Referred by ${referralUsernameState}`}
                              color="success"
                              variant="outlined"
                            />
                          )}
                        </Paper>
                      </Box>
                    </Grid>
                  </Grid>
                )}

                {/* Stats Tab */}
                {activeTab === 1 && (
                  <Box sx={{ mt: 2 }}>
                    <StatisticsForm
                      onDropdownChange={handleDropdownChange}
                      username={username}
                      dateJoined={dateJoined}
                      // creditScore={creditScore}
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
                      // averageProfit={averageProfit}
                    />
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        </Modal>

        {/* New Username Modal */}
        <Modal open={isNewUsernameModalOpen} onClose={() => setIsNewUsernameModalOpen(false)}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fff',
              width: { xs: '95%', sm: '50%' },
              maxWidth: '500px',
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: 24,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '@supports not (backdrop-filter: blur(10px))': {
                background: 'rgba(0, 0, 0, 0.85)',
              },
            }}
          >
            <Paper
              elevation={3}
              sx={{
                background: isDarkMode ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(240, 240, 240, 0.9)',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, color: isDarkMode ? '#fff' : '#333' }}>
                  Change Username
                </Typography>
                <IconButton
                  onClick={() => setIsNewUsernameModalOpen(false)}
                  sx={{
                    color: isDarkMode ? '#fff' : '#333',
                    '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={{ p: 3 }}>
                <TextField
                  color="error"
                  label="New Username (e.g., PUSSY_D3STROY3R)"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  variant="outlined"
                  autoComplete="off"
                  inputProps={{ maxLength: 12 }}
                  fullWidth
                  sx={{ mb: 3 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    color="error"
                    variant="contained"
                    onClick={changeUserName}
                    disabled={loadingState}
                  >
                    {loadingState ? <CircularProgress size={24} color="inherit" /> : 'Update'}
                  </Button>
                  <Button
                    color="error"
                    variant="outlined"
                    onClick={() => setIsNewUsernameModalOpen(false)}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Modal>

        {/* Bio/Link Modal */}
        <Modal open={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fff',
              width: { xs: '95%', sm: '50%' },
              maxWidth: '500px',
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: 24,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '@supports not (backdrop-filter: blur(10px))': {
                background: 'rgba(0, 0, 0, 0.85)',
              },
            }}
          >
            <Paper
              elevation={3}
              sx={{
                background: isDarkMode ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(240, 240, 240, 0.9)',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, color: isDarkMode ? '#fff' : '#333' }}>
                  Change Bio
                </Typography>
                <IconButton
                  onClick={() => setIsLinkModalOpen(false)}
                  sx={{
                    color: isDarkMode ? '#fff' : '#333',
                    '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={{ p: 3 }}>
                <TextField
                  color="error"
                  label="Bio or Link (e.g., https://example.com)"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  variant="outlined"
                  autoComplete="off"
                  multiline
                  maxRows={4}
                  inputProps={{ maxLength: 40 }}
                  fullWidth
                  sx={{ mb: 3 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    color="error"
                    variant="contained"
                    onClick={changeBio}
                    disabled={loadingState}
                  >
                    {loadingState ? <CircularProgress size={24} color="inherit" /> : 'Update'}
                  </Button>
                  <Button
                    color="error"
                    variant="outlined"
                    onClick={() => setIsLinkModalOpen(false)}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Modal>
        {/* End of Bio/Link Modal */}

        {/* Password Modal */}
        <Modal open={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fff',
              width: { xs: '95%', sm: '50%' },
              maxWidth: '500px',
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: 24,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '@supports not (backdrop-filter: blur(10px))': {
                background: 'rgba(0, 0, 0, 0.85)',
              },
            }}
          >
            <Paper
              elevation={3}
              sx={{
                background: isDarkMode ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(240, 240, 240, 0.9)',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, color: isDarkMode ? '#fff' : '#333' }}>
                  Change Password
                </Typography>
                <IconButton
                  onClick={() => setIsPasswordModalOpen(false)}
                  sx={{
                    color: isDarkMode ? '#fff' : '#333',
                    '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={{ p: 3 }}>
                <TextField
                  color="error"
                  type="password"
                  variant="outlined"
                  fullWidth
                  size="medium"
                  label="New Password"
                  autoComplete="new-password"
                  value={password}
                  onChange={handleChangePassword}
                  sx={{ mb: 3 }}
                />
                <TextField
                  color="error"
                  type="password"
                  variant="outlined"
                  fullWidth
                  size="medium"
                  label="Confirm Password"
                  autoComplete="new-password"
                  value={passwordConfirmation}
                  onChange={handleChangePasswordConfirmation}
                  sx={{ mb: 3 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    color="error"
                    variant="contained"
                    onClick={saveUserInfo}
                    disabled={loadingState || !password || !passwordConfirmation}
                  >
                    {loadingState ? <CircularProgress size={24} color="inherit" /> : 'Update'}
                  </Button>
                  <Button
                    color="error"
                    variant="outlined"
                    onClick={() => setIsPasswordModalOpen(false)}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Modal>

        {/* Referrals Modal */}
        <Modal open={isReferralsModalOpen} onClose={() => setIsReferralsModalOpen(false)}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fff',
              maxHeight: '90vh',
              width: { xs: '95%', sm: '80%', md: '70%', lg: '60%' },
              maxWidth: '900px',
              overflowY: 'auto',
              borderRadius: 2,
              boxShadow: 24,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '@supports not (backdrop-filter: blur(10px))': {
                background: 'rgba(0, 0, 0, 0.85)',
              },
            }}
          >
            <Paper
              elevation={3}
              sx={{
                background: isDarkMode ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  borderBottom: '1px solid',
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(240, 240, 240, 0.9)',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, color: isDarkMode ? '#fff' : '#333' }}>
                  Your Referrals
                </Typography>
                <IconButton
                  onClick={() => setIsReferralsModalOpen(false)}
                  sx={{
                    color: isDarkMode ? '#fff' : '#333',
                    '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={{ p: 3 }}>
                {showPlayerModal && (
                  <PlayerModal
                    selectedCreator={selectedCreator}
                    modalIsOpen={showPlayerModal}
                    closeModal={handleClosePlayerModal}
                  />
                )}
                <Grid container spacing={3}>
                  {rewardsState.length === 0 ? (
                    <Grid item xs={12}>
                      <Typography color="text.secondary" align="center">
                        No referrals yet. Share your referral code to earn rewards!
                      </Typography>
                    </Grid>
                  ) : (
                    rewardsState.map((reward, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        {customerInfo[reward.user] && (
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              background: isDarkMode
                                ? 'rgba(40, 40, 40, 0.5)'
                                : 'rgba(255, 255, 255, 0.7)',
                              textAlign: 'center',
                            }}
                          >
                            <Box
                              sx={{ cursor: 'pointer' }}
                              onClick={() => handleOpenPlayerModal(customerInfo[reward.user]._id)}
                            >
                              <Avatar
                                src={customerInfo[reward.user].avatar}
                                user_id={customerInfo[reward.user]._id}
                                alt="User Avatar"
                                rank={customerInfo[reward.user].totalWagered}
                                elite={customerInfo[reward.user].elite}
                                accessory={customerInfo[reward.user].accessory}
                                username={customerInfo[reward.user].username}
                                sx={{ mx: 'auto', mb: 1, width: '90px' }}
                              />
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {customerInfo[reward.user].username}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                mt: 2,
                                py: 1,
                                px: 2,
                                border: '2px solid rgb(40, 167, 69)',
                                borderRadius: 1,
                              }}
                            >
                              <Typography variant="body2" sx={{ color: 'rgb(40, 167, 69)' }}>
                                + {convertToCurrency(reward.amount, solPrice)}
                              </Typography>
                            </Box>
                          </Paper>
                        )}
                      </Grid>
                    ))
                  )}
                </Grid>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    color="error"
                    variant="outlined"
                    onClick={() => setIsReferralsModalOpen(false)}
                  >
                    Close
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Modal>
      </>
    </ThemeProvider>
  );
}

export default ProfileModal;