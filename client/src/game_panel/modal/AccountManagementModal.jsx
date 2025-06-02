import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  getUser,
  changePasswordAndAvatar,
  changeUserName,
  changeLink,
  setDarkMode,
  setNotificationsAllowed,
  toggleMute,
  toggleGameSounds,
  toggleNotificationSounds,
  toggleLowGraphics,
  toggleMusic,
  checkAndAddWalletAddress,
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
  Paper, 
  Switch,
  TextField,
  Grid,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  FormControlLabel
} from '@mui/material';
import { 
  Close as CloseIcon,
  FileCopy as FileCopyIcon,
  Link as LinkIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import axios from '../../util/Api';

const AccountManagementModal = ({ modalIsOpen, closeModal }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  
  // Redux state
  const user = useSelector(state => state.auth.user);
  const isDarkMode = useSelector(state => state.auth.isDarkMode);
  const isNotificationsAllowed = useSelector(state => state.auth.isNotificationsAllowed);
  const isMuted = useSelector(state => state.auth.isMuted);
  const gameSounds = useSelector(state => state.auth.gameSounds);
  const notificationSounds = useSelector(state => state.auth.notificationSounds);
  const isMusicEnabled = useSelector(state => state.auth.isMusicEnabled);
  const isLowGraphics = useSelector(state => state.auth.isLowGraphics);
  const loading = useSelector(state => state.auth.loading);

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
    rateLimit: { requestsPerHour: 100, requestsPerDay: 1000 }
  });
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [expandedKey, setExpandedKey] = useState(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const tabs = [
    { label: 'Profile', icon: '👤', value: 0 },
    { label: 'Settings', icon: '⚙️', value: 1 },
    { label: 'Security', icon: '🔒', value: 2 },
    { label: 'Developer', icon: '💻', value: 3 }
  ];

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
      const response = await axios.get('/api/api-keys/list');
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

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        dispatch(errorMsgBar('Please select an image file'));
        return;
      }
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        dispatch(errorMsgBar('File size must be less than 5MB'));
        return;
      }

      // Create FileReader to convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData({
          ...profileData,
          avatar: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // Update username if changed
      if (profileData.username !== user.username) {
        const result = await dispatch(changeUserName(profileData.username));
        if (!result.success) {
          setIsLoading(false);
          return;
        }
      }

      // Update bio if changed
      if (profileData.bio !== user.bio) {
        const result = await dispatch(changeLink(profileData.bio));
        if (!result.success) {
          setIsLoading(false);
          return;
        }
      }

      // Update avatar if changed
      if (profileData.avatar !== user.avatar) {
        const result = await dispatch(changePasswordAndAvatar(null, profileData.avatar));
        if (!result.success) {
          setIsLoading(false);
          return;
        }
      }

      // Refresh user data
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
      const response = await axios.post('/api/api-keys/generate', {
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
        fetchApiKeys(); // Refresh the list
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
        fetchApiKeys(); // Refresh the list
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
    setNewKeyData({...newKeyData, permissions: newPermissions});
  };

  const handleDisconnectWallet = (walletAddress) => {
    dispatch(disconnectWalletAddress());
    dispatch(successMsgBar('Wallet disconnected successfully!'));
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
            maxWidth: '1200px',
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
              color: isDarkMode ? '#fff' : '#333',
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
                borderRadius: '8px 8px 0 0',
              }}
            >
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: isDarkMode ? '#fff' : '#333' }}>
                Account Management
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
              textColor="inherit"
              variant="fullWidth"
              sx={{
                '& .MuiTabs-indicator': { backgroundColor: '#ff0000', height: '3px' },
                '& .MuiTab-root': { 
                  fontSize: '1rem', 
                  fontWeight: 500,
                  color: isDarkMode ? '#ccc' : '#555',
                  '&.Mui-selected': { color: '#ff0000' } 
                },
              }}
            >
              {tabs.map((tab) => (
                <Tab 
                  key={tab.value} 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{tab.icon}</span>
                      {tab.label}
                    </Box>
                  } 
                />
              ))}
            </Tabs>

            {/* Content */}
            <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              {/* Profile Tab */}
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(250, 250, 250, 0.7)',
                        borderRadius: 2,
                        color: isDarkMode ? '#fff' : '#333',
                      }}
                    >
                      <Box
                        sx={{
                          width: 120,
                          height: 120,
                          borderRadius: '50%',
                          backgroundColor: '#ff3030',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px',
                          fontSize: '48px',
                          color: 'white'
                        }}
                      >
                        {profileData.avatar ? (
                          <img src={profileData.avatar} alt="Avatar" style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }} />
                        ) : (
                          '👤'
                        )}
                      </Box>
                      <Typography variant="h6" sx={{ mb: 1, color: isDarkMode ? '#fff' : '#333' }}>
                        {profileData.username}
                      </Typography>
                      <Chip
                        label={user?.elite ? 'Elite Member' : 'Standard Member'}
                        sx={{
                          backgroundColor: user?.elite ? '#ffd700' : '#666',
                          color: user?.elite ? '#000' : '#fff',
                          mb: 2
                        }}
                      />
                      <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        startIcon={<span>📁</span>}
                        onClick={triggerFileUpload}
                        sx={{
                          color: '#ff0000',
                          borderColor: '#ff0000',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 0, 0, 0.1)',
                            borderColor: '#ff0000',
                          }
                        }}
                      >
                        Upload Avatar
                      </Button>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={8}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 3,
                        backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(250, 250, 250, 0.7)',
                        borderRadius: 2,
                        color: isDarkMode ? '#fff' : '#333',
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 3, color: isDarkMode ? '#fff' : '#333' }}>
                        Personal Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Username"
                            value={profileData.username}
                            onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
                                color: isDarkMode ? '#fff' : '#333',
                                '& fieldset': {
                                  borderColor: '#ff0000',
                                },
                                '&:hover fieldset': {
                                  borderColor: '#ff0000',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#ff0000',
                                },
                              },
                              '& .MuiInputLabel-root': {
                                color: isDarkMode ? '#fff' : '#333',
                                '&.Mui-focused': {
                                  color: '#ff0000',
                                }
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Bio"
                            value={profileData.bio}
                            onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                            variant="outlined"
                            multiline
                            rows={3}
                            placeholder="Tell us about yourself..."
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
                                color: isDarkMode ? '#fff' : '#333',
                                '& fieldset': {
                                  borderColor: '#ff0000',
                                },
                                '&:hover fieldset': {
                                  borderColor: '#ff0000',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#ff0000',
                                },
                              },
                              '& .MuiInputLabel-root': {
                                color: isDarkMode ? '#fff' : '#333',
                                '&.Mui-focused': {
                                  color: '#ff0000',
                                }
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Member Since"
                            value={formatDate(user?.created_at)}
                            variant="outlined"
                            disabled
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(200, 200, 200, 0.3)',
                                color: isDarkMode ? '#ccc' : '#666',
                              },
                              '& .MuiInputLabel-root': {
                                color: isDarkMode ? '#ccc' : '#666',
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Total Wagered"
                            value={`${user?.totalWagered || 0} SOL`}
                            variant="outlined"
                            disabled
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(200, 200, 200, 0.3)',
                                color: isDarkMode ? '#ccc' : '#666',
                              },
                              '& .MuiInputLabel-root': {
                                color: isDarkMode ? '#ccc' : '#666',
                              }
                            }}
                          />
                        </Grid>
                      </Grid>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        variant="contained"
                        color="error"
                        sx={{ mt: 3 }}
                        startIcon={isLoading ? <CircularProgress size={20} /> : <span>💾</span>}
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Settings Tab */}
              {activeTab === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 3,
                        backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(250, 250, 250, 0.7)',
                        borderRadius: 2,
                        color: isDarkMode ? '#fff' : '#333',
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: isDarkMode ? '#fff' : '#333' }}>
                        🔔 Notifications
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={isNotificationsAllowed}
                            onChange={(e) => dispatch(setNotificationsAllowed(e.target.checked))}
                            color="error"
                          />
                        }
                        label={<Typography sx={{ color: isDarkMode ? '#fff' : '#333' }}>Push Notifications</Typography>}
                        sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
                      />
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 3,
                        backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(250, 250, 250, 0.7)',
                        borderRadius: 2,
                        color: isDarkMode ? '#fff' : '#333',
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: isDarkMode ? '#fff' : '#333' }}>
                        🔊 Audio Settings
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={gameSounds}
                              onChange={(e) => dispatch(toggleGameSounds(e.target.checked))}
                              color="error"
                            />
                          }
                          label={<Typography sx={{ color: isDarkMode ? '#fff' : '#333' }}>Game Sounds</Typography>}
                          sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={notificationSounds}
                              onChange={(e) => dispatch(toggleNotificationSounds(e.target.checked))}
                              color="error"
                            />
                          }
                          label={<Typography sx={{ color: isDarkMode ? '#fff' : '#333' }}>Notification Sounds</Typography>}
                          sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={isMusicEnabled}
                              onChange={(e) => dispatch(toggleMusic(e.target.checked))}
                              color="error"
                            />
                          }
                          label={<Typography sx={{ color: isDarkMode ? '#fff' : '#333' }}>Background Music</Typography>}
                          sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
                        />
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 3,
                        backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(250, 250, 250, 0.7)',
                        borderRadius: 2,
                        color: isDarkMode ? '#fff' : '#333',
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: isDarkMode ? '#fff' : '#333' }}>
                        🎨 Appearance
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={isDarkMode}
                            onChange={(e) => dispatch(setDarkMode(e.target.checked))}
                            color="error"
                          />
                        }
                        label={<Typography sx={{ color: isDarkMode ? '#fff' : '#333' }}>Dark Mode</Typography>}
                        sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={isLowGraphics}
                            onChange={(e) => dispatch(toggleLowGraphics(e.target.checked))}
                            color="error"
                          />
                        }
                        label={<Typography sx={{ color: isDarkMode ? '#fff' : '#333' }}>Low Graphics Mode</Typography>}
                        sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
                      />
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Security Tab */}
              {activeTab === 2 && (
                <Box>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Keep your account secure by managing your password and reviewing your security settings regularly.
                  </Alert>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 3,
                          backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(250, 250, 250, 0.7)',
                          borderRadius: 2,
                          color: isDarkMode ? '#fff' : '#333',
                        }}
                      >
                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: isDarkMode ? '#fff' : '#333' }}>
                          🔑 Password & Authentication
                        </Typography>
                        <Button 
                          onClick={() => setShowPasswordDialog(true)}
                          variant="outlined"
                          color="error"
                          fullWidth
                          startIcon={<span>🔑</span>}
                          sx={{
                            color: '#ff0000',
                            borderColor: '#ff0000',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 0, 0, 0.1)',
                              borderColor: '#ff0000',
                            }
                          }}
                        >
                          Change Password
                        </Button>
                        <Typography variant="body2" sx={{ mt: 2, color: isDarkMode ? '#ccc' : '#666' }}>
                          Last password change: {formatDate(new Date())}
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={12}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 3,
                          backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(250, 250, 250, 0.7)',
                          borderRadius: 2,
                          color: isDarkMode ? '#fff' : '#333',
                        }}
                      >
                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: isDarkMode ? '#fff' : '#333' }}>
                          💳 Connected Wallets
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, color: isDarkMode ? '#ccc' : '#666' }}>
                          Manage your connected Solana wallet addresses
                        </Typography>
                        {user?.accounts?.length > 0 ? (
                          <Grid container spacing={1}>
                            {user.accounts.map((account, index) => (
                              <Grid item xs={12} sm={6} md={4} key={index}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    p: 1.5,
                                    borderRadius: 1,
                                    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                  }}
                                >
                                  <Typography variant="body2" sx={{ fontFamily: 'monospace', color: isDarkMode ? '#fff' : '#333' }}>
                                    💳 {shortenAddress(account)}
                                  </Typography>
                                  <Box>
                                    <IconButton
                                      size="small"
                                      onClick={() => navigator.clipboard.writeText(account)}
                                      sx={{ color: '#ff0000' }}
                                    >
                                      <FileCopyIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      component="a"
                                      href={`https://solscan.io/account/${account}`}
                                      target="_blank"
                                      sx={{ color: '#ff0000' }}
                                    >
                                      <LinkIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDisconnectWallet(account)}
                                      sx={{ color: '#ff0000' }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        ) : (
                          <Typography variant="body1" sx={{ fontStyle: 'italic', color: isDarkMode ? '#ccc' : '#666' }}>
                            No connected wallets
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Developer Tab */}
              {activeTab === 3 && (
                <Box>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body1">
                      <strong>🔧 Developer API Access</strong>
                    </Typography>
                    Create and manage API keys to integrate with external applications. 
                    Each key can have specific permissions and rate limits.
                  </Alert>

                  <Paper
                    elevation={1}
                    sx={{
                      p: 3,
                      backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(250, 250, 250, 0.7)',
                      borderRadius: 2,
                      mb: 3,
                      color: isDarkMode ? '#fff' : '#333',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: isDarkMode ? '#fff' : '#333' }}>
                        🔑 API Keys
                      </Typography>
                      <Button
                        onClick={() => setShowNewKeyDialog(true)}
                        variant="contained"
                        color="error"
                        startIcon={<AddIcon />}
                      >
                        Generate New Key
                      </Button>
                    </Box>

                    {loadingApiKeys ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                      </Box>
                    ) : apiKeys.length === 0 ? (
                      <Box sx={{ textAlign: 'center', p: 3 }}>
                        <Typography variant="body1" sx={{ mb: 2, color: isDarkMode ? '#ccc' : '#666' }}>
                          No API keys generated yet
                        </Typography>
                        <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                          Click "Generate New Key" to create your first API key
                        </Typography>
                      </Box>
                    ) : (
                      apiKeys.map((key) => (
                        <Paper
                          key={key.id}
                          elevation={0}
                          sx={{
                            mb: 2,
                            backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 1,
                            color: isDarkMode ? '#fff' : '#333',
                          }}
                        >
                          <Box
                            sx={{
                              p: 2,
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onClick={() => setExpandedKey(expandedKey === key.id ? null : key.id)}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="body1" sx={{ fontWeight: 500, color: isDarkMode ? '#fff' : '#333' }}>
                                {key.name}
                              </Typography>
                              <Chip
                                label={key.isActive ? 'Active' : 'Revoked'}
                                size="small"
                                color={key.isActive ? 'success' : 'error'}
                              />
                              <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                                {key.usageCount} requests
                              </Typography>
                            </Box>
                            <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#333' }}>
                              {expandedKey === key.id ? '▼' : '▶'}
                            </Typography>
                          </Box>
                          
                          {expandedKey === key.id && (
                            <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666', mb: 0.5 }}>
                                    Key ID
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: isDarkMode ? '#fff' : '#333' }}>
                                      {key.keyId}
                                    </Typography>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleCopyKey(key.keyId)}
                                      sx={{ color: '#ff0000' }}
                                    >
                                      <FileCopyIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666', mb: 0.5 }}>
                                    Last Used
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: isDarkMode ? '#fff' : '#333' }}>
                                    {key.lastUsed ? formatDate(key.lastUsed) : 'Never'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666', mb: 1 }}>
                                    Permissions
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {key.permissions.map((permission) => (
                                      <Chip
                                        key={permission}
                                        label={permission.replace('_', ' ')}
                                        size="small"
                                        variant="outlined"
                                        sx={{ 
                                          borderColor: '#ff0000',
                                          color: isDarkMode ? '#fff' : '#333'
                                        }}
                                      />
                                    ))}
                                  </Box>
                                </Grid>
                                <Grid item xs={12}>
                                  <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666', mb: 1 }}>
                                    Rate Limits: {key.rateLimit?.requestsPerHour || 100}/hour, {key.rateLimit?.requestsPerDay || 1000}/day
                                  </Typography>
                                  <Button
                                    onClick={() => handleRevokeKey(key.keyId)}
                                    disabled={!key.isActive}
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    startIcon={<DeleteIcon />}
                                    sx={{
                                      color: '#ff0000',
                                      borderColor: '#ff0000',
                                      '&:hover': {
                                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                                        borderColor: '#ff0000',
                                      }
                                    }}
                                  >
                                    Revoke Key
                                  </Button>
                                </Grid>
                              </Grid>
                            </Box>
                          )}
                        </Paper>
                      ))
                    )}
                  </Paper>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 3,
                          backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(250, 250, 250, 0.7)',
                          borderRadius: 2,
                          color: isDarkMode ? '#fff' : '#333',
                        }}
                      >
                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: isDarkMode ? '#fff' : '#333' }}>
                          📖 Documentation
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, color: isDarkMode ? '#ccc' : '#666' }}>
                          Get started with our API in minutes
                        </Typography>
                        <Button 
                          variant="outlined" 
                          color="error" 
                          fullWidth 
                          sx={{ 
                            mb: 1,
                            color: '#ff0000',
                            borderColor: '#ff0000',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 0, 0, 0.1)',
                              borderColor: '#ff0000',
                            }
                          }}
                          startIcon={<span>📖</span>}
                          component="a"
                          href="/api/docs"
                          target="_blank"
                        >
                          View Documentation
                        </Button>
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 3,
                          backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(250, 250, 250, 0.7)',
                          borderRadius: 2,
                          color: isDarkMode ? '#fff' : '#333',
                        }}
                      >
                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: isDarkMode ? '#fff' : '#333' }}>
                          📊 Usage Statistics
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2, color: isDarkMode ? '#ccc' : '#666' }}>
                          Your API usage for this month
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                            Requests Made
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff3030' }}>
                            {apiKeys.reduce((sum, key) => sum + key.usageCount, 0)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                            Active Keys
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#10b981' }}>
                            {apiKeys.filter(key => key.isActive).length}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </Modal>

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
              bgcolor: isDarkMode ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderRadius: 2,
              boxShadow: 24,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: isDarkMode ? '#fff' : '#333',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#333' }}>
                Change Password
              </Typography>
              <IconButton
                onClick={() => setShowPasswordDialog(false)}
                sx={{ color: isDarkMode ? '#fff' : '#333' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ p: 3 }}>
              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
                    color: isDarkMode ? '#fff' : '#333',
                    '& fieldset': {
                      borderColor: '#ff0000',
                    },
                    '&:hover fieldset': {
                      borderColor: '#ff0000',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ff0000',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: isDarkMode ? '#fff' : '#333',
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
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
                    color: isDarkMode ? '#fff' : '#333',
                    '& fieldset': {
                      borderColor: '#ff0000',
                    },
                    '&:hover fieldset': {
                      borderColor: '#ff0000',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ff0000',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: isDarkMode ? '#fff' : '#333',
                    '&.Mui-focused': {
                      color: '#ff0000',
                    }
                  }
                }}
              />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => setShowPasswordDialog(false)}
                  variant="outlined"
                  sx={{
                    color: isDarkMode ? '#fff' : '#333',
                    borderColor: isDarkMode ? '#fff' : '#333',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
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
                  startIcon={isLoading ? <CircularProgress size={20} /> : null}
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
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
              bgcolor: isDarkMode ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderRadius: 2,
              boxShadow: 24,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: isDarkMode ? '#fff' : '#333',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 2,
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#333' }}>
                Generate New API Key
              </Typography>
              <IconButton
                onClick={() => setShowNewKeyDialog(false)}
                sx={{ color: isDarkMode ? '#fff' : '#333' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ p: 3 }}>
              <TextField
                fullWidth
                label="Key Name"
                value={newKeyData.name}
                onChange={(e) => setNewKeyData({...newKeyData, name: e.target.value})}
                placeholder="e.g., Production API, Development Key"
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
                    color: isDarkMode ? '#fff' : '#333',
                    '& fieldset': {
                      borderColor: '#ff0000',
                    },
                    '&:hover fieldset': {
                      borderColor: '#ff0000',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#ff0000',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: isDarkMode ? '#fff' : '#333',
                    '&.Mui-focused': {
                      color: '#ff0000',
                    }
                  }
                }}
              />
              
              <Typography variant="body1" sx={{ mb: 2, color: isDarkMode ? '#fff' : '#333' }}>
                Permissions
              </Typography>
              <Grid container spacing={1} sx={{ mb: 3 }}>
                {['create_room', 'generate_image', 'generate_react', 'extract_room_info'].map(permission => (
                  <Grid item xs={6} key={permission}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={newKeyData.permissions.includes(permission)}
                          onChange={() => togglePermission(permission)}
                          color="error"
                        />
                      }
                      label={<Typography sx={{ color: isDarkMode ? '#fff' : '#333' }}>{permission.replace('_', ' ')}</Typography>}
                    />
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => setShowNewKeyDialog(false)}
                  variant="outlined"
                  sx={{
                    color: isDarkMode ? '#fff' : '#333',
                    borderColor: isDarkMode ? '#fff' : '#333',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateApiKey}
                  disabled={isLoading || !newKeyData.name.trim()}
                  variant="contained"
                  color="error"
                  startIcon={isLoading ? <CircularProgress size={20} /> : null}
                >
                  {isLoading ? 'Generating...' : 'Generate Key'}
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
              width: { xs: '90%', sm: '600px' },
              bgcolor: isDarkMode ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderRadius: 2,
              boxShadow: 24,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: isDarkMode ? '#fff' : '#333',
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: isDarkMode ? '#fff' : '#333' }}>
                ✅ API Key Generated Successfully
              </Typography>
              
              <Alert severity="warning" sx={{ mb: 3 }}>
                <strong>⚠️ Important:</strong> This is the only time you'll see the full API key. 
                Copy it now and store it securely.
              </Alert>
              
              <Typography variant="body2" sx={{ mb: 1, color: isDarkMode ? '#ccc' : '#666' }}>
                Your API Key
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <TextField
                  fullWidth
                  value={generatedKey.fullKey}
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                    style: { 
                      fontFamily: 'monospace', 
                      fontSize: '12px',
                      color: isDarkMode ? '#fff' : '#333'
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
                      '& fieldset': {
                        borderColor: '#ff0000',
                      }
                    }
                  }}
                />
                <Button
                  onClick={() => handleCopyKey(generatedKey.fullKey)}
                  variant="contained"
                  color="error"
                  startIcon={<FileCopyIcon />}
                >
                  Copy
                </Button>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  onClick={() => setGeneratedKey(null)}
                  variant="contained"
                  color="error"
                  size="large"
                >
                  I've Saved My Key
                </Button>
              </Box>
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
            p: 2,
            borderRadius: 2,
            zIndex: 2000,
            boxShadow: 3,
          }}
        >
          ✅ Copied to clipboard!
        </Box>
      )}
    </>
  );
};

export default AccountManagementModal;