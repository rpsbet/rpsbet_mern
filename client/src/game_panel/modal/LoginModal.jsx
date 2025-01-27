import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import {
  Button,
  TextField,
  Modal,
  Box,
  Typography
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';
import {
  setFocused,
  userSignIn,
  getUser,
  authenticateWithGoogle
} from '../../redux/Auth/user.actions';
import {
  getMyHistory,
  getMyChat,
  getNotifications
} from '../../redux/Logic/logic.actions';

import history from '../../redux/history';

function LoginModal(props) {
  const { email: initialEmail, password: initialPassword } = props;

  // ------------------ LOCAL STATE ------------------
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [isInvestorsPage, setIsInvestorsPage] = useState(
    window.location.pathname.startsWith('/investors')
  );

  const theme = getCustomTheme(props.isDarkMode);

  // ------------------ HANDLERS ------------------
  const onFocusHandler = () => props.setFocused(true);
  const onBlurHandler = () => props.setFocused(false);

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
          callback: handleGoogleCredentialResponse
        });

        google.accounts.id.renderButton(buttonElement, {
          theme: 'outline',
          size: 'large'
        });

        google.accounts.id.prompt();
      }
    }, 100);
  };

  const handleGoogleCredentialResponse = (response) => {
    if (!response || !response.credential) {
      console.error('No Google credential found');
      return;
    }
    const jwt = response.credential;

    props
      .authenticateWithGoogle({ token: jwt })
      .then((result) => {
        if (result.status === 'success') {
          props.closeModal();
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
    const result = await props.userSignIn({ email, password });
    if (result.status === 'success') {
      onSuccessfulLogin(result.user);
    }
  };

  const onSuccessfulLogin = (user) => {
    props.initSocket();
    props.getNotifications();
    props.getMyHistory();
    props.getMyChat();

    const currentPath = window.location.pathname;
    currentPath.startsWith('/investors')
      ? history.push('/investors')
      : history.push('/');
    props.closeModal();
  };

  // ------------------ EFFECTS ------------------
  useEffect(() => {
    initializeGoogleSignIn();

    setTimeout(() => {
      initializeGoogleSignIn();
    }, 100);

    setIsInvestorsPage(window.location.pathname.startsWith('/investors'));

  }, []);

  // ------------------ STYLES ------------------
  const modalBoxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: '#1f1a25',      // Custom background color
    color: '#fff',           // Text color for contrast
    boxShadow: 24,
    borderRadius: 1,
    p: 3,
    width: 360,
    maxWidth: '90vw'
  };

  // ------------------ RENDER ------------------
  return (
    <ThemeProvider theme={theme}>

      <Modal
        open={props.modalIsOpen}
        onClose={props.closeModal}
        closeAfterTransition
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
        }}
        sx={{ zIndex: 1300 }}
      >
        <Box sx={modalBoxStyle}>
          {/* HEADER */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <FontAwesomeIcon icon={faSignInAlt} style={{ marginRight: 8 }} />
              LOGIN
            </Typography>
            <Button variant="text" color="error" onClick={props.closeModal}>
            ×
            </Button>
          </Box>

          {/* FORM */}
          <Box component="form" onSubmit={onSubmitForm} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              variant="filled"
              color='error'
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
              color='error'
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
            {/* Row with Login and Register Buttons */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="error"
                onClick={onSubmitForm}
                fullWidth
              >
                Login&nbsp;
                <Typography component="span" fontStyle="italic">
                  [↵]
                </Typography>
              </Button>
              <Button
                variant="text"
                color="error"
                onClick={() => {
                  props.closeModal();
                  props.openSignupModal();
                }}
                fullWidth
              >
                SIGN UP →
              </Button>
            </Box>

            {/* OR Separator */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ flex: 1, borderBottom: 1, borderColor: 'divider' }} />
              <Typography variant="body2" sx={{ mx: 2 }}>
                OR
              </Typography>
              <Box sx={{ flex: 1, borderBottom: 1, borderColor: 'divider' }} />
            </Box>

            {/* Google Sign-In (centered) */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box
                id="googleSignInButton"
                sx={{
                  width: '100%',
                  maxWidth: 300,
                  display: 'flex',
                  justifyContent: 'center'
                }}
              />
            </Box>

            {/* Conditional Links */}
            {!isInvestorsPage ? (
              <Typography
                component="a"
                onClick={() => {
                  props.closeModal();
                  history.push('/investors');
                }}
                sx={{
                  color: 'secondary.main',
                  textDecoration: 'underline',
                  textAlign: 'center',
                  cursor: 'pointer',
                  mt: 1
                }}
              >
                INVESTOR? ($RPS PORTAL)&nbsp;
                <FontAwesomeIcon icon={faExternalLinkAlt} />
              </Typography>
            ) : (
              <Typography
                component="a"
                onClick={() => {
                  props.closeModal();
                  history.push('/play');
                }}
                sx={{
                  color: 'secondary.main',
                  textDecoration: 'underline',
                  textAlign: 'center',
                  cursor: 'pointer',
                  mt: 1
                }}
              >
                Play RPS.Game&nbsp;
                <FontAwesomeIcon icon={faExternalLinkAlt} />
              </Typography>
            )}
          </Box>
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

// ------------------ REDUX CONNECT ------------------
const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  email: state.auth.user.email,
  password: state.auth.user.password
});

const mapDispatchToProps = {
  userSignIn,
  getUser,
  getMyHistory,
  getMyChat,
  getNotifications,
  setFocused,
  authenticateWithGoogle
};

export default connect(mapStateToProps, mapDispatchToProps)(LoginModal);