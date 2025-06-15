import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  getUser,
  changePasswordAndAvatar,
  changeUserName,
  changeLink,
  setNotificationsAllowed,
  toggleGameSounds,
  toggleLowGraphics,
  disconnectWalletAddress
} from '../../redux/Auth/user.actions';
import { errorMsgBar, successMsgBar } from '../../redux/Notification/notification.actions';
import {
  Modal,
  Box,
  Button,
  Tabs,
  Tab,
  IconButton,
  Typography,
  Switch,
  TextField,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  FormControlLabel,
  ThemeProvider
} from '@mui/material';
import {
  Close as CloseIcon,
  FileCopy as FileCopyIcon,
  Link as LinkIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faCog,
  faLock,
  faCode,
  faVolumeUp,
  faBell,
  faPalette,
  faWallet,
  faEye,
  faKey
} from '@fortawesome/free-solid-svg-icons';
import axios from '../../util/Api';
import { getCustomTheme } from '../../config/theme';

const AccountManagementModal = ({ modalIsOpen, closeModal }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  // Redux state
  const user = useSelector(state => state.auth.user);
  const isDarkMode = useSelector(state => state.auth.isDarkMode);
  const isNotificationsAllowed = useSelector(state => state.auth.isNotificationsAllowed);
  const gameSounds = useSelector(state => state.auth.gameSounds);
  const isLowGraphics = useSelector(state => state.auth.isLowGraphics);

  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    avatar: user?.avatar || ''
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // API Keys state
  const [apiKeys, setApiKeys] = useState([]);
  const [loadingApiKeys, setLoadingApiKeys] = useState(false);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    permissions: [],
    rateLimit: { requestsPerHour: 10, requestsPerDay: 100 }
  });
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [expandedKey, setExpandedKey] = useState(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        bio: user.bio || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  // Fetch API keys when developer tab is opened
  useEffect(() => {
    if (activeTab === 3) {
      fetchApiKeys();
    }
  }, [activeTab]);

  const fetchApiKeys = async () => {
    try {
      setLoadingApiKeys(true);
      const response = await axios.get('/api-keys/list');
      if (response.data.success) {
        setApiKeys(response.data.apiKeys);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
      dispatch(errorMsgBar('Failed to load API keys'));
    } finally {
      setLoadingApiKeys(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      dispatch(errorMsgBar('Please select an image file'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      dispatch(errorMsgBar('File size must be less than 5MB'));
      return;
    }

    setIsLoading(true);

    try {
      const avatarUrl = await uploadAvatarToPinata(file);
      setProfileData({
        ...profileData,
        avatar: avatarUrl
      });
      dispatch(successMsgBar('Avatar uploaded successfully!'));
    } catch (error) {
      console.error('Avatar upload failed:', error);
      dispatch(errorMsgBar('Failed to upload avatar. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAvatarToPinata = async (file) => {
    const resizeAvatar = (file) => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target.result;
        };

        img.onload = () => {
          const maxSize = 200;
          let width = img.width;
          let height = img.height;
          const size = Math.min(width, height);
          const x = (width - size) / 2;
          const y = (height - size) / 2;

          canvas.width = maxSize;
          canvas.height = maxSize;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, x, y, size, size, 0, 0, maxSize, maxSize);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject('Failed to generate avatar blob.');
            }
          }, 'image/webp', 0.8);
        };

        img.onerror = (error) => {
          reject('Error processing avatar: ' + error);
        };

        reader.readAsDataURL(file);
      });
    };

    try {
      const resizedBlob = await resizeAvatar(file);
      const formData = new FormData();
      formData.append('file', resizedBlob, 'avatar.webp');

      const response = await axios.post('/game/upload-to-pinata', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status !== 200) {
        throw new Error('Failed to upload avatar to Pinata.');
      }

      const { success, imageUrl, message } = response.data;
      if (!success || !imageUrl) {
        throw new Error(message || 'Avatar upload failed, no imageUrl received.');
      }

      return imageUrl;
    } catch (error) {
      console.error('❌ Avatar upload error:', error);
      throw new Error('Failed to upload avatar: ' + error.message);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      if (profileData.username !== user.username) {
        const result = await dispatch(changeUserName(profileData.username));
        if (!result.success) {
          setIsLoading(false);
          return;
        }
      }

      if (profileData.bio !== user.bio) {
        const result = await dispatch(changeLink(profileData.bio));
        if (!result.success) {
          setIsLoading(false);
          return;
        }
      }

      if (profileData.avatar !== user.avatar) {
        const result = await dispatch(changePasswordAndAvatar(null, profileData.avatar));
        if (!result.success) {
          setIsLoading(false);
          return;
        }
      }

      await dispatch(getUser());
      dispatch(successMsgBar('Profile updated successfully!'));
    } catch (error) {
      dispatch(errorMsgBar('Failed to update profile'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      dispatch(errorMsgBar('Password confirmation does not match'));
      return;
    }

    if (passwordData.newPassword.length < 6) {
      dispatch(errorMsgBar('Password must be at least 6 characters'));
      return;
    }

    setIsLoading(true);
    try {
      const success = await dispatch(changePasswordAndAvatar(passwordData.newPassword, profileData.avatar));
      if (success) {
        setPasswordData({ newPassword: '', confirmPassword: '' });
        setShowPasswordDialog(false);
        dispatch(successMsgBar('Password updated successfully!'));
      }
    } catch (error) {
      dispatch(errorMsgBar('Failed to update password'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateApiKey = async () => {
    if (!newKeyData.name.trim()) {
      dispatch(errorMsgBar('Please enter a key name'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api-keys/generate', {
        name: newKeyData.name,
        permissions: newKeyData.permissions,
        rateLimit: newKeyData.rateLimit
      });

      if (response.data.success) {
        setGeneratedKey(response.data.apiKey);
        setShowNewKeyDialog(false);
        setNewKeyData({
          name: '',
          permissions: [],
          rateLimit: { requestsPerHour: 100, requestsPerDay: 1000 }
        });
        dispatch(successMsgBar('API key generated successfully!'));
        fetchApiKeys();
      } else {
        dispatch(errorMsgBar(response.data.error || 'Failed to generate API key'));
      }
    } catch (error) {
      dispatch(errorMsgBar(error.response?.data?.error || 'Failed to generate API key'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKey = (key) => {
    navigator.clipboard.writeText(key);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleRevokeKey = async (keyId) => {
    try {
      const response = await axios.delete(`/api/api-keys/${keyId}`);
      if (response.data.success) {
        dispatch(successMsgBar('API key revoked successfully!'));
        fetchApiKeys();
      } else {
        dispatch(errorMsgBar('Failed to revoke API key'));
      }
    } catch (error) {
      dispatch(errorMsgBar('Failed to revoke API key'));
    }
  };

  const togglePermission = (permission) => {
    const newPermissions = newKeyData.permissions.includes(permission)
      ? newKeyData.permissions.filter(p => p !== permission)
      : [...newKeyData.permissions, permission];
    setNewKeyData({ ...newKeyData, permissions: newPermissions });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const shortenAddress = (address) => {
    if (!address) return '';
    return address.slice(0, 8) + '...' + address.slice(-8);
  };

  if (!modalIsOpen) return null;

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      <ThemeProvider theme={theme}>
        <Modal open={modalIsOpen || false} onClose={closeModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '95%', sm: '80%', md: '70%', lg: '60%' },
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '8px',
              background: '#262626',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              color: '#fff',
            }}
          >
            {/* Clean Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FontAwesomeIcon
                  icon={faCog}
                  style={{
                    color: '#ff0000',
                    fontSize: '14px'
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                >
                  Account Management
                </Typography>
              </Box>
              <IconButton
                onClick={closeModal}
                size="small"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    color: '#fff'
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Clean Tabs */}
            <Box
              sx={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                textColor="inherit"
                variant="fullWidth"
                TabIndicatorProps={{
                  style: {
                    backgroundColor: '#ff0000',
                    height: '2px',
                  }
                }}
                sx={{
                  '& .MuiTab-root': { 
                    fontSize: '0.8rem', 
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.6)',
                    textTransform: 'none',
                    minHeight: 40,
                    '&.Mui-selected': { color: '#fff' } 
                  },
                }}
              >
                <Tab label="Profile" />
                <Tab label="Settings" />
                <Tab label="Security" />
                <Tab label="Developer" />
              </Tabs>
            </Box>

            {/* Content */}
            <Box sx={{ padding: '16px' }}>

              {/* Profile Tab */}
              {activeTab === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {/* Avatar */}
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          mb: 1.5,
                          border: '2px solid rgba(255, 0, 0, 0.3)',
                          overflow: 'hidden',
                          position: 'relative',
                          backgroundColor: '#ff0000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {profileData.avatar ? (
                          <img
                            src={profileData.avatar}
                            alt="Avatar"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}

                        <Box
                          sx={{
                            position: profileData.avatar ? 'absolute' : 'static',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: profileData.avatar ? 'none' : 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '36px',
                            color: 'white'
                          }}
                        >
                          {profileData.username ? profileData.username.charAt(0).toUpperCase() : '👤'}
                        </Box>

                        {isLoading && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'rgba(0, 0, 0, 0.7)',
                              borderRadius: '50%'
                            }}
                          >
                            <CircularProgress color="error" size={30} />
                          </Box>
                        )}
                      </Box>

                      {/* Username & Status */}
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          textAlign: 'center',
                          mb: 0.5,
                          fontSize: '1.1rem'
                        }}
                      >
                        {profileData.username}
                      </Typography>

                      <Chip
                        label={user?.elite ? 'Elite Member' : 'Standard Member'}
                        size="small"
                        sx={{
                          backgroundColor: user?.elite ? '#ffd700' : '#666',
                          color: user?.elite ? '#000' : '#fff',
                          fontWeight: 600,
                          fontSize: '0.65rem',
                          height: 18,
                          mb: 2,
                        }}
                      />

                      {/* Upload Button */}
                      <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        size="small"
                        startIcon={isLoading ? <CircularProgress size={16} color="error" /> : <UploadIcon fontSize="small" />}
                        onClick={triggerFileUpload}
                        disabled={isLoading}
                        sx={{
                          fontSize: '0.75rem',
                          py: 0.5,
                          color: '#ff0000',
                          borderColor: 'rgba(255, 0, 0, 0.5)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 0, 0, 0.1)',
                            borderColor: '#ff0000',
                          },
                        }}
                      >
                        {isLoading ? 'Uploading...' : 'Upload Avatar'}
                      </Button>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={8}>
                    <Box
                      sx={{
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px',
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          mb: 1.5,
                          fontSize: '0.85rem'
                        }}
                      >
                        Profile Information
                      </Typography>
                      
                      <Grid container spacing={1.5}>
                        <Grid item xs={12}>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                            Username
                          </Typography>
                          <TextField
                            fullWidth
                            value={profileData.username}
                            onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                            size="small"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                fontSize: '0.8rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                color: '#fff',
                                '& fieldset': {
                                  borderColor: 'rgba(255, 255, 255, 0.1)',
                                },
                                '&:hover fieldset': {
                                  borderColor: 'rgba(255, 0, 0, 0.5)',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#ff0000',
                                },
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                            Bio
                          </Typography>
                          <TextField
                            fullWidth
                            value={profileData.bio}
                            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                            multiline
                            rows={2}
                            size="small"
                            placeholder="Tell us about yourself..."
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                fontSize: '0.8rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                color: '#fff',
                                '& fieldset': {
                                  borderColor: 'rgba(255, 255, 255, 0.1)',
                                },
                                '&:hover fieldset': {
                                  borderColor: 'rgba(255, 0, 0, 0.5)',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#ff0000',
                                },
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                            Member Since
                          </Typography>
                          <TextField
                            fullWidth
                            value={formatDate(user?.created_at)}
                            size="small"
                            disabled
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                fontSize: '0.8rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                                '& input': {
                                  color: 'rgba(255, 255, 255, 0.5)',
                                  WebkitTextFillColor: 'rgba(255, 255, 255, 0.5)',
                                },
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                            Total Wagered
                          </Typography>
                          <TextField
                            fullWidth
                            value={`${(user?.totalWagered || 0).toFixed(4)} SOL`}
                            size="small"
                            disabled
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                fontSize: '0.8rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                                '& input': {
                                  color: 'rgba(255, 255, 255, 0.5)',
                                  WebkitTextFillColor: 'rgba(255, 255, 255, 0.5)',
                                },
                              },
                            }}
                          />
                        </Grid>
                      </Grid>

                      <Button
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        variant="contained"
                        color="error"
                        size="small"
                        sx={{ mt: 2, fontSize: '0.75rem', py: 0.5 }}
                        startIcon={isLoading ? <CircularProgress color='error' size={16} /> : <SaveIcon fontSize="small" />}
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              )}

              {/* Settings Tab */}
              {activeTab === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box
                      sx={{
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px',
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          mb: 1.5,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <FontAwesomeIcon icon={faBell} style={{ fontSize: '12px' }} />
                        Notifications
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={isNotificationsAllowed}
                            onChange={(e) => dispatch(setNotificationsAllowed(e.target.checked))}
                            color="error"
                            size="small"
                          />
                        }
                        label={
                          <Typography sx={{ fontSize: '0.8rem' }}>
                            Push Notifications
                          </Typography>
                        }
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          width: '100%',
                          m: 0
                        }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box
                      sx={{
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px',
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          mb: 1.5,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <FontAwesomeIcon icon={faVolumeUp} style={{ fontSize: '12px' }} />
                        Audio
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={gameSounds}
                            onChange={(e) => dispatch(toggleGameSounds(e.target.checked))}
                            color="error"
                            size="small"
                          />
                        }
                        label={
                          <Typography sx={{ fontSize: '0.8rem' }}>
                            Game Sounds
                          </Typography>
                        }
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          width: '100%',
                          m: 0
                        }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box
                      sx={{
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px',
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          mb: 1.5,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <FontAwesomeIcon icon={faPalette} style={{ fontSize: '12px' }} />
                        Appearance
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={isLowGraphics}
                            onChange={(e) => dispatch(toggleLowGraphics(e.target.checked))}
                            color="error"
                            size="small"
                          />
                        }
                        label={
                          <Typography sx={{ fontSize: '0.8rem' }}>
                            Low Graphics Mode
                          </Typography>
                        }
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          width: '100%',
                          m: 0
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              )}

              {/* Security Tab */}
              {activeTab === 2 && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      mb: 1.5,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <FontAwesomeIcon icon={faWallet} style={{ fontSize: '12px' }} />
                    Connected Wallets
                  </Typography>
                  <Box
                    sx={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '4px',
                    }}
                  >
                    {user?.accounts?.length > 0 ? (
                      <Grid container spacing={1}>
                        {user.accounts.map((account, index) => (
                          <Grid item xs={12} key={index}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                borderRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem',
                                  color: 'rgba(255, 255, 255, 0.8)',
                                }}
                              >
                                💳 {shortenAddress(account)}
                              </Typography>
                              <Box>
                                <IconButton
                                  size="small"
                                  onClick={() => navigator.clipboard.writeText(account)}
                                  sx={{ p: 0.5, color: 'rgba(255, 255, 255, 0.6)' }}
                                >
                                  <FileCopyIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                                <IconButton
                                  component="a"
                                  href={`https://solscan.io/account/${account}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="small"
                                  sx={{ p: 0.5, color: 'rgba(255, 255, 255, 0.6)' }}
                                >
                                  <LinkIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Box>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>
                        No connected wallets
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* Developer Tab */}
              {activeTab === 3 && (
                <Box>
                  {!user?.elite && (
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 2, 
                        fontSize: '0.8rem',
                        backgroundColor: 'rgba(211, 47, 47, 0.1)',
                        border: '1px solid rgba(211, 47, 47, 0.3)',
                        color: '#fff'
                      }}
                    >
                      Elite Membership Required for API access
                    </Alert>
                  )}

                  {/* API Keys Section */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <FontAwesomeIcon icon={faKey} style={{ fontSize: '12px' }} />
                        API Keys
                      </Typography>
                      <Button
                        onClick={() => setShowNewKeyDialog(true)}
                        disabled={!user?.elite}
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<AddIcon fontSize="small" />}
                        sx={{
                          fontSize: '0.75rem',
                          py: 0.5,
                          px: 1,
                          color: '#ff0000',
                          borderColor: 'rgba(255, 0, 0, 0.5)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 0, 0, 0.1)',
                            borderColor: '#ff0000',
                          },
                        }}
                      >
                        Generate
                      </Button>
                    </Box>

                    <Box
                      sx={{
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px',
                        minHeight: '80px',
                      }}
                    >
                      {loadingApiKeys ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                          <CircularProgress color='error' size={24} />
                        </Box>
                      ) : apiKeys.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                            No API keys generated yet
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.7rem' }}>
                            Generate your first API key to get started
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {apiKeys.slice(0, 3).map((key) => (
                            <Box
                              key={key.id}
                              sx={{
                                padding: '8px 12px',
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                              onClick={() => setExpandedKey(expandedKey === key.id ? null : key.id)}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                    {key.name}
                                  </Typography>
                                  <Chip
                                    label={key.isActive ? 'Active' : 'Revoked'}
                                    size="small"
                                    sx={{
                                      height: 16,
                                      fontSize: '0.6rem',
                                      backgroundColor: key.isActive ? '#4caf50' : '#666',
                                      color: 'white',
                                    }}
                                  />
                                </Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem' }}>
                                  {key.usageCount} uses
                                </Typography>
                              </Box>
                              
                              {expandedKey === key.id && (
                                <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                                      {key.keyId}
                                    </Typography>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyKey(key.keyId);
                                      }}
                                      sx={{ p: 0.25, color: 'rgba(255, 255, 255, 0.6)' }}
                                    >
                                      <FileCopyIcon sx={{ fontSize: 12 }} />
                                    </IconButton>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
                                      Last used: {key.lastUsed ? formatDate(key.lastUsed) : 'Never'}
                                    </Typography>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRevokeKey(key.keyId);
                                      }}
                                      disabled={!key.isActive}
                                      variant="outlined"
                                      color="error"
                                      size="small"
                                      startIcon={<DeleteIcon sx={{ fontSize: 12 }} />}
                                      sx={{
                                        fontSize: '0.65rem',
                                        py: 0.25,
                                        px: 0.75,
                                        minWidth: 'auto',
                                        color: '#ff0000',
                                        borderColor: 'rgba(255, 0, 0, 0.5)',
                                      }}
                                    >
                                      Revoke
                                    </Button>
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          ))}
                          {apiKeys.length > 3 && (
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', fontSize: '0.7rem' }}>
                              +{apiKeys.length - 3} more keys
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Usage Stats & Documentation */}
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box
                        sx={{
                          padding: '12px',
                          textAlign: 'center',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '4px'
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#ff0000', fontSize: '1.1rem' }}>
                          {apiKeys.reduce((sum, key) => sum + key.usageCount, 0)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem' }}>
                          Total Requests
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box
                        sx={{
                          padding: '12px',
                          textAlign: 'center',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '4px'
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#10b981', fontSize: '1.1rem' }}>
                          {apiKeys.filter(key => key.isActive).length}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem' }}>
                          Active Keys
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box
                        sx={{
                          padding: '12px',
                          textAlign: 'center',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '4px'
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3b82f6', fontSize: '1.1rem' }}>
                          {apiKeys.reduce((sum, key) => sum + (key.roomsCreated || 0), 0)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem' }}>
                          Games Created
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Documentation Section */}
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        mb: 1.5,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <FontAwesomeIcon icon={faCode} style={{ fontSize: '12px' }} />
                      Documentation & API Info
                    </Typography>
                    <Box
                      sx={{
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '4px',
                      }}
                    >
                      <Alert 
                        severity="info" 
                        sx={{ 
                          mb: 2, 
                          fontSize: '0.75rem',
                          backgroundColor: 'rgba(33, 150, 243, 0.1)',
                          border: '1px solid rgba(33, 150, 243, 0.3)',
                          color: '#fff'
                        }}
                      >
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          <strong>🚀 Streamlined API v1.0.0</strong><br />
                          Single endpoint for complete game creation with mandatory blockchain deposits
                        </Typography>
                      </Alert>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button
                          variant="outlined"
                          color="error"
                          fullWidth
                          size="small"
                          sx={{
                            fontSize: '0.75rem',
                            py: 0.5,
                            color: '#ff0000',
                            borderColor: 'rgba(255, 0, 0, 0.5)',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 0, 0, 0.1)',
                              borderColor: '#ff0000',
                            }
                          }}
                          startIcon={<span style={{ fontSize: '12px' }}>📖</span>}
                          component="a"
                          href="/docs"
                          target="_blank"
                        >
                          View Complete Documentation
                        </Button>
                        <Typography variant="caption" sx={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
                          Includes migration guide from legacy endpoints
                        </Typography>
                      </Box>

                      {/* Quick API Reference */}
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.8)', mb: 1, display: 'block' }}>
                          Primary Endpoint:
                        </Typography>
                        <Box
                          sx={{
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            padding: '8px',
                            fontFamily: 'monospace',
                            fontSize: '0.7rem',
                            color: '#ff0000',
                            mb: 1
                          }}
                        >
                          POST /api/public-api/create-room
                        </Box>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                          React generation • AI images • SOL deposits • Blockchain signing
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Modal>
      </ThemeProvider>

      {/* Password Change Dialog */}
      {showPasswordDialog && (
        <Modal open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: '400px' },
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              color: '#fff',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                Change Password
              </Typography>
              <IconButton
                onClick={() => setShowPasswordDialog(false)}
                size="small"
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ padding: '16px' }}>
              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                size="small"
                sx={{
                  mb: 1.5,
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.8rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 0, 0, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ff0000',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.8rem',
                    '&.Mui-focused': {
                      color: '#ff0000',
                    }
                  }
                }}
              />
              <TextField
                fullWidth
                type="password"
                label="Confirm Password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                size="small"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.8rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 0, 0, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ff0000',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.8rem',
                    '&.Mui-focused': {
                      color: '#ff0000',
                    }
                  }
                }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  onClick={() => setShowPasswordDialog(false)}
                  variant="outlined"
                  fullWidth
                  size="small"
                  sx={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleChangePassword}
                  disabled={isLoading || !passwordData.newPassword.trim() || !passwordData.confirmPassword.trim()}
                  variant="contained"
                  color="error"
                  fullWidth
                  size="small"
                  startIcon={isLoading ? <CircularProgress color='error' size={16} /> : <SaveIcon fontSize="small" />}
                  sx={{ fontSize: '0.75rem' }}
                >
                  {isLoading ? 'Updating...' : 'Update'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>
      )}

      {/* New API Key Dialog */}
      {showNewKeyDialog && (
        <Modal open={showNewKeyDialog} onClose={() => setShowNewKeyDialog(false)}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: '500px' },
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              color: '#fff',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
                Generate New API Key
              </Typography>
              <IconButton
                onClick={() => setShowNewKeyDialog(false)}
                size="small"
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ padding: '16px' }}>
              <TextField
                fullWidth
                label="Key Name"
                value={newKeyData.name}
                onChange={(e) => setNewKeyData({ ...newKeyData, name: e.target.value })}
                placeholder="e.g., Production API"
                size="small"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.8rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 0, 0, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ff0000',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.8rem',
                    '&.Mui-focused': {
                      color: '#ff0000',
                    }
                  }
                }}
              />

              <Typography variant="body2" sx={{ mb: 1, fontSize: '0.8rem', fontWeight: 500 }}>
                Permissions
              </Typography>

              <Box
                sx={{
                  padding: '12px',
                  border: newKeyData.permissions.includes('create_room')
                    ? '2px solid #ff0000'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  backgroundColor: newKeyData.permissions.includes('create_room')
                    ? 'rgba(255, 0, 0, 0.1)'
                    : 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  mb: 2,
                }}
                onClick={() => togglePermission('create_room')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Switch
                    checked={newKeyData.permissions.includes('create_room')}
                    onChange={() => togglePermission('create_room')}
                    color="error"
                    size="small"
                  />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                      🎮 Complete Game Creation
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem' }}>
                      React generation, images, deposits & blockchain signing
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  onClick={() => setShowNewKeyDialog(false)}
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateApiKey}
                  disabled={isLoading || !newKeyData.name.trim() || newKeyData.permissions.length === 0}
                  variant="contained"
                  color="error"
                  fullWidth
                  size="small"
                  startIcon={isLoading ? <CircularProgress color='error' size={16} /> : null}
                  sx={{ fontSize: '0.75rem' }}
                >
                  {isLoading ? 'Generating...' : 'Generate'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>
      )}

      {/* Generated Key Success Dialog */}
      {generatedKey && (
        <Modal open={!!generatedKey} onClose={() => setGeneratedKey(null)}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: '500px' },
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              color: '#fff',
            }}
          >
            <Box sx={{ padding: '16px' }}>
              <Typography variant="h6" sx={{ mb: 2, fontSize: '0.9rem', fontWeight: 600, textAlign: 'center' }}>
                ✅ API Key Generated
              </Typography>

              <Alert 
                severity="warning" 
                sx={{ 
                  mb: 2, 
                  fontSize: '0.75rem',
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  color: '#fff'
                }}
              >
                Copy this key now - you won't see it again!
              </Alert>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  value={generatedKey.fullKey}
                  InputProps={{
                    readOnly: true,
                    style: {
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: '#fff'
                    }
                  }}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      }
                    }
                  }}
                />
                <Button
                  onClick={() => handleCopyKey(generatedKey.fullKey)}
                  variant="contained"
                  color="error"
                  size="small"
                  startIcon={<FileCopyIcon fontSize="small" />}
                  sx={{ fontSize: '0.75rem', minWidth: 'auto', px: 1 }}
                >
                  Copy
                </Button>
              </Box>

              <Button
                onClick={() => setGeneratedKey(null)}
                variant="contained"
                color="error"
                fullWidth
                size="small"
                sx={{ fontSize: '0.75rem' }}
              >
                I've Saved My Key
              </Button>
            </Box>
          </Box>
        </Modal>
      )}

      {/* Copy Success Notification */}
      {copySuccess && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            backgroundColor: '#10b981',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            zIndex: 2000,
            fontSize: '0.8rem',
          }}
        >
          ✅ Copied!
        </Box>
      )}
    </>
  );
};

export default AccountManagementModal;