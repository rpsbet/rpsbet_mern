import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // Replace history with useNavigate
import { Button, TextField, Modal, Box, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
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

function LoginModal({ modalIsOpen, closeModal }) {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Add useNavigate hook

  // Retrieve values from Redux state
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const initialEmail = useSelector((state) => state.auth.user.email) || '';
  const initialPassword = useSelector((state) => state.auth.user.password) || '';

  // ------------------ LOCAL STATE ------------------
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [isInvestorsPage, setIsInvestorsPage] = useState(
    window.location.pathname.startsWith('/investors')
  );

  const theme = getCustomTheme(isDarkMode);

  // ------------------ HANDLERS ------------------
  const onFocusHandler = () => dispatch(setFocused(true));
  const onBlurHandler = () => dispatch(setFocused(false));

  const onChangeEmail = (e) => setEmail(e.target.value);
  const onChangePassword = (e) => setPassword(e.target.value);

  const initializeGoogleSignIn = () => {
    setTimeout(() => {
      const buttonElement = document.getElementById('googleSignInButton');
      if (buttonElement) {
        /* global google */
        google.accounts.id.initialize({
          client_id:
            '565609210873-2ajd0detnt4h6q8ufhrl5nvlv4h01ol0.apps.googleusercontent.com',
          callback: handleGoogleCredentialResponse,
        });

        google.accounts.id.renderButton(buttonElement, {
          theme: 'outline',
          size: 'large',
        });

        google.accounts.id.prompt();
      }
    }, 100);
  };

  const handlePhantomConnect = async () => {
    try {
      if (!window.solana || !window.solana.isPhantom) {
        console.error('Phantom wallet not found');
        return;
      }
      await window.solana.connect();
      const walletAddress = window.solana.publicKey.toString();
      const result = await dispatch(authenticateWithPhantom({ walletAddress }));
      if (result.status === 'success') {
        onSuccessfulLogin(result.user);
      } else {
        console.error('Phantom login failed:', result.error);
      }
    } catch (error) {
      console.error('Error connecting Phantom wallet:', error);
    }
  };

  const handleGoogleCredentialResponse = (response) => {
    if (!response || !response.credential) {
      console.error('No Google credential found');
      return;
    }
    const jwt = response.credential;
    dispatch(authenticateWithGoogle({ token: jwt }))
      .then((result) => {
        if (result.status === 'success') {
          closeModal();
          onSuccessfulLogin(result.user);
        } else {
          console.error('Login failed:', result.error);
        }
      })
      .catch((error) => {
        console.error('Error during Google auth:', error);
      });
  };

  const onSubmitForm = async (e) => {
    e.preventDefault();
    const result = await dispatch(userSignIn({ email, password }));
    if (result.status === 'success') {
      onSuccessfulLogin(result.user);
    }
  };

  const onSuccessfulLogin = (user) => {
    dispatch(getNotifications());
    dispatch(getMyHistory());
    dispatch(getMyChat());
    dispatch(getUser());
    navigate('/');
    closeModal();
  };

  // ------------------ EFFECTS ------------------
  useEffect(() => {
    setTimeout(() => {
      initializeGoogleSignIn();
    }, 100);
  }, []);

  // ------------------ RENDER ------------------
  return (
    <ThemeProvider theme={theme}>
      <Modal
        open={modalIsOpen || false}
        onClose={closeModal}
        closeAfterTransition
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
        }}
        sx={{ zIndex: 1300 }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff', // Preserve text color conditional
            overflowY: 'auto',
            borderRadius: 2,
            boxShadow: 24,
            p: 3,
            // Glassmorphism styles (default dark mode colors)
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)', // For Safari
            border: '1px solid rgba(255, 255, 255, 0.2)',
            // Fallback for browsers without backdrop-filter
            '@supports not (backdrop-filter: blur(10px))': {
              background: 'rgba(0, 0, 0, 0.4)',
            },
          }}
        >
          {/* HEADER */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faSignInAlt} style={{ marginRight: 8 }} />
              LOGIN
            </Typography>
            <Button
              onClick={closeModal}
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                minWidth: 'auto',
                p: 1,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                borderRadius: '50%',
              }}
            >
              <CloseIcon />
            </Button>
          </Box>

          {/* FORM */}
          <Box component="form" onSubmit={onSubmitForm} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              variant="filled"
              color="error"
              label="Username"
              value={email}
              onChange={onChangeEmail}
              onFocus={onFocusHandler}
              onBlur={onBlurHandler}
              autoComplete="on"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              variant="filled"
              color="error"
              label="Password"
              type="password"
              value={password}
              onChange={onChangePassword}
              onFocus={onFocusHandler}
              onBlur={onBlurHandler}
              autoComplete="new-password"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSubmitForm(e);
                }
              }}
            />
          </Box>

          {/* ACTIONS */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                color="error"
                onClick={onSubmitForm}
                fullWidth
              >
                Login
                <Typography component="span" fontStyle="italic">
                  [↵]
                </Typography>
              </Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ flex: 1, borderBottom: 1, borderColor: 'divider' }} />
              <Typography variant="body2" sx={{ mx: 2 }}>
                OR
              </Typography>
              <Box sx={{ flex: 1, borderBottom: 1, borderColor: 'divider' }} />
            </Box>
            <Button
              variant="outlined"
              color="error"
              onClick={handlePhantomConnect}
              fullWidth
            >
              Connect Wallet
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Box sx={{ flex: 1, borderBottom: 1, borderColor: 'divider' }} />
              <Typography variant="body2" sx={{ mx: 2 }}>
                OR
              </Typography>
              <Box sx={{ flex: 1, borderBottom: 1, borderColor: 'divider' }} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box
                id="googleSignInButton"
                sx={{
                  width: '100%',
                  maxWidth: 300,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              />
            </Box>
          </Box>
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

export default LoginModal;