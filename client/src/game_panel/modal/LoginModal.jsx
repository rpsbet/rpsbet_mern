import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  TextField, 
  Modal, 
  Box, 
  Typography, 
  IconButton, 
  Divider,
  CircularProgress
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt, faWallet } from '@fortawesome/free-solid-svg-icons';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';
import {
  setFocused,
  userSignIn,
  getUser,
  authenticateWithGoogle,
  authenticateWithPhantom,
} from '../../redux/Auth/user.actions';
import {
  getMyHistory,
  getMyChat,
  getNotifications,
} from '../../redux/Logic/logic.actions';

/**
 * LoginModal Component - Professional authentication interface
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.modalIsOpen - Controls modal visibility
 * @param {Function} props.closeModal - Function to close the modal
 * @returns {JSX.Element} - Rendered component
 */
function LoginModal({ modalIsOpen, closeModal }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const initialEmail = useSelector((state) => state.auth.user.email) || '';
  const initialPassword = useSelector((state) => state.auth.user.password) || '';

  // Local state
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const theme = getCustomTheme(isDarkMode);

  // Form validation
  const validateForm = () => {
    const newErrors = { email: '', password: '' };
    let isValid = true;

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Focus handling
  const onFocusHandler = useCallback(() => dispatch(setFocused(true)), [dispatch]);
  const onBlurHandler = useCallback(() => dispatch(setFocused(false)), [dispatch]);

  // Input handlers
  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  
  // Google Sign-In initialization
  const initializeGoogleSignIn = useCallback(() => {
    const buttonElement = document.getElementById('googleSignInButton');
    if (buttonElement && window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: '565609210873-2ajd0detnt4h6q8ufhrl5nvlv4h01ol0.apps.googleusercontent.com',
        callback: handleGoogleCredentialResponse,
        context: 'signin',
        ux_mode: 'popup',
      });

      window.google.accounts.id.renderButton(buttonElement, {
        theme: isDarkMode ? 'filled_black' : 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: buttonElement.offsetWidth,
      });
    }
  }, [isDarkMode]);

  // Phantom wallet connection
  const handlePhantomConnect = async () => {
    try {
      setIsLoading(true);
      
      if (!window.solana || !window.solana.isPhantom) {
        setIsLoading(false);
        return;
      }
      
      await window.solana.connect();
      const walletAddress = window.solana.publicKey.toString();
      const result = await dispatch(authenticateWithPhantom({ walletAddress }));
      
      if (result.status === 'success') {
        onSuccessfulLogin(result.user);
      }
    } catch (error) {
      // Handle error silently or implement alternative error handling
    } finally {
      setIsLoading(false);
    }
  };

  // Google authentication
  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      return;
    }
    
    setIsLoading(true);
    try {
      const jwt = response.credential;
      const result = await dispatch(authenticateWithGoogle({ token: jwt }));
      
      if (result.status === 'success') {
        onSuccessfulLogin(result.user);
      }
    } catch (error) {
      // Handle error silently or implement alternative error handling
    } finally {
      setIsLoading(false);
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const result = await dispatch(userSignIn({ email, password }));
      if (result.status === 'success') {
        onSuccessfulLogin(result.user);
      }
    } catch (error) {
      // Handle error silently or implement alternative error handling
    } finally {
      setIsLoading(false);
    }
  };

  // Process successful login
  const onSuccessfulLogin = (user) => {
    closeModal();

    Promise.all([
      dispatch(getNotifications()),
      dispatch(getMyHistory()),
      dispatch(getMyChat()),
      dispatch(getUser())
    ]).then(() => {
      setTimeout(() => {
        navigate('/');
      }, 1000);
    });
  };

  // Initialize Google Sign-In after component mounts
  useEffect(() => {
    if (modalIsOpen) {
      const timer = setTimeout(() => {
        initializeGoogleSignIn();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [modalIsOpen, initializeGoogleSignIn]);

  return (
    <ThemeProvider theme={theme}>
      <Modal
        open={modalIsOpen || false}
        onClose={isLoading ? null : closeModal}
        closeAfterTransition
        aria-labelledby="login-modal-title"
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.85)' },
        }}
        sx={{ zIndex: 1300 }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 400 },
            maxHeight: '90vh',
            color: theme.palette.text.primary,
            overflowY: 'auto',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            // Glassmorphism styles
            background: theme.palette.mode === 'dark' 
              ? 'rgba(15, 15, 15, 0.85)'
              : 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${theme.palette.divider}`,
            // Fallback for browsers without backdrop-filter
            '@supports not (backdrop-filter: blur(12px))': {
              background: theme.palette.mode === 'dark'
                ? 'rgba(15, 15, 15, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
            },
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography 
              variant="h5" 
              component="h2" 
              id="login-modal-title"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                fontWeight: 500
              }}
            >
              <FontAwesomeIcon 
                icon={faSignInAlt} 
                style={{ marginRight: 12 }} 
              />
              Authentication
            </Typography>
            <IconButton
              aria-label="close"
              onClick={closeModal}
              disabled={isLoading}
              sx={{
                color: theme.palette.grey[500],
                '&:hover': { 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.1)' 
                    : 'rgba(0,0,0,0.1)' 
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Form */}
          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            noValidate 
            sx={{ mb: 3 }}
          >
            <TextField
              fullWidth
              variant="outlined"
              color="error"
              id="email"
              name="email"
              label="Email Address or Username"
              value={email}
              onChange={handleEmailChange}
              onFocus={onFocusHandler}
              onBlur={onBlurHandler}
              error={Boolean(errors.email)}
              helperText={errors.email}
              autoComplete="email"
              autoFocus
              disabled={isLoading}
              InputLabelProps={{
                style: { color: theme.palette.error.main } // Apply error color to the label
              }}
              sx={{ mb: 2 }}
              InputProps={{
                sx: { borderRadius: 1.5 }
              }}
            />
            <TextField
              fullWidth
              variant="outlined"
              color="error"
              id="password"
              name="password"
              label="Password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              onFocus={onFocusHandler}
              onBlur={onBlurHandler}
              error={Boolean(errors.password)}
              helperText={errors.password}
              autoComplete="current-password"
              disabled={isLoading}
              InputProps={{
                sx: { borderRadius: 1.5 }
              }}
              InputLabelProps={{
                style: { color: theme.palette.error.main } // Apply error color to the label
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="error"
              disabled={isLoading}
              sx={{ 
                mt: 3, 
                mb: 2, 
                py: 1.2,
                borderRadius: 1.5,
                position: 'relative'
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color='error' />
              ) : (
                <>
                  Sign In
                  <Typography 
                    component="span" 
                    sx={{ 
                      ml: 1,
                      fontSize: '0.85rem', 
                      opacity: 0.8 
                    }}
                  >
                    [↵]
                  </Typography>
                </>
              )}
            </Button>
          </Box>

          {/* Alternative auth methods */}
          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              OR CONTINUE WITH
            </Typography>
          </Divider>

          {/* Wallet connection */}
          <Button
            variant="outlined"
            fullWidth
            onClick={handlePhantomConnect}
            disabled={isLoading}
            color='error'
            startIcon={<FontAwesomeIcon icon={faWallet} />}
            sx={{ 
              mb: 2, 
              py: 1.2,
              borderRadius: 1.5,
              textTransform: 'none',
              position: 'relative'
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} color='error' />
            ) : (
              'Connect with Phantom Wallet'
            )}
          </Button>

          {/* Google Sign-In */}
          <Box 
            id="googleSignInButton"
            sx={{
              width: '100%',
              height: 42,
              display: 'flex',
              justifyContent: 'center',
              mt: 1
            }}
          />
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

export default LoginModal;