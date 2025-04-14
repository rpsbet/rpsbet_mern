import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Modal,
  Box,
  Typography,
  Button,
  TextField,
  ButtonBase,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Info from '@mui/icons-material/Info';

import TermsModal from '../modal/TermsModal';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';
import { userSignUp, setFocused } from '../../redux/Auth/user.actions';
import { errorMsgBar } from '../../redux/Notification/notification.actions';

function SignupModal({ modalIsOpen, closeModal, openLoginModal }) {
  const dispatch = useDispatch();
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const theme = getCustomTheme(isDarkMode);

  // -------------------- LOCAL STATE --------------------
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [avatarMethod, setAvatarMethod] = useState('robohash');
  const [termsChecked, setTermsChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');

  // -------------------- HANDLERS --------------------
  const handleCheckboxChange = () => setTermsChecked((prev) => !prev);
  const handleOpenTermsModal = () => setShowTermsModal(true);
  const handleCloseTermsModal = () => setShowTermsModal(false);
  const onChangeAvatarMethod = (value) => setAvatarMethod(value);

  const onChangeUserName = (e) => {
    const username = e.target.value;
    const allowedCharsRegex = /^[a-zA-Z0-9_]+$/;
    if (username === '') {
      setUserName('');
      return;
    }
    if (allowedCharsRegex.test(username)) {
      setUserName(username);
    } else {
      dispatch(
        errorMsgBar(
          'Invalid characters in username. Only alphanumeric characters and underscores are allowed.'
        )
      );
    }
  };

  const onFocusHandler = () => dispatch(setFocused(true));
  const onBlurHandler = () => dispatch(setFocused(false));
  const onChangePassword = (e) => setPassword(e.target.value);
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const onChangeReferralCode = (e) => setReferralCode(e.target.value);

  // Runs reCAPTCHA and returns token as a Promise
  const executeRecaptcha = () => {
    return new Promise((resolve) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute('6Lfto1EpAAAAAD5UzhL6Fp7YCZeIDmenzpZewpCv', {
            action: 'submit',
          })
          .then((token) => {
            resolve(token);
          });
      });
    });
  };

  // React onSubmit handler
  const onSubmitForm = async (e) => {
    e.preventDefault();
    console.log('Called onSubmitForm!');
    const token = await executeRecaptcha();
    setRecaptchaToken(token);
    if (!token) {
      dispatch(errorMsgBar('reCAPTCHA verification failed. Please try again.'));
      return;
    }
    if (!termsChecked) {
      dispatch(errorMsgBar('Please agree to the Terms and Conditions.'));
      return;
    }
    const newUser = {
      userName,
      password,
      bio,
      avatar,
      referralCode,
      avatarMethod,
      termsChecked,
      showPassword,
      recaptchaToken: token,
    };
    console.log('newUser', newUser);
    const result = await dispatch(userSignUp(newUser));
    if (result.status === 'success') {
      confirmAlert({
        customUI: ({ onClose }) => {
          return (
            <Box sx={{ bgcolor: isDarkMode ? 'grey.900' : 'background.paper', p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                WELCOME TO CATSINO.FUN TIGER! 🐯⚔
              </Typography>
              <Typography sx={{ mb: 2 }}>CLICK YOUR BALANCE TO MAKE A DEPOSIT</Typography>
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  onClose();
                  closeModal();
                  openLoginModal();
                }}
              >
                LOGIN NOW!
              </Button>
            </Box>
          );
        },
      });
    }
  };

  // -------------------- MUI STYLES --------------------
  const modalBoxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: '#0a0a0a',
    color: '#fff',
    boxShadow: 24,
    borderRadius: 1,
    p: 3,
    width: 400,
    maxWidth: '90vw',
  };

  return (
    <ThemeProvider theme={theme}>
      <Modal
        open={modalIsOpen || false}
        onClose={closeModal}
        closeAfterTransition
        BackdropProps={{ style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' } }}
      >
        <Box sx={modalBoxStyle}>
          {/* HEADER */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: 8 }} />
              REGISTER
            </Typography>
            <Button variant="text" color="error" onClick={closeModal}>
              ×
            </Button>
          </Box>
          {/* FORM */}
          <Box
            component="form"
            onSubmit={onSubmitForm}
            noValidate
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              variant="filled"
              color="error"
              label="Your Username"
              required
              value={userName}
              onChange={onChangeUserName}
              onFocus={onFocusHandler}
              onBlur={onBlurHandler}
              placeholder="e.g. PU55YD35TROY3R"
              fullWidth
            />
            {/* AVATAR SELECT */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                AVATAR
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <ButtonBase
                  onClick={() => onChangeAvatarMethod('robohash')}
                  sx={{
                    border: avatarMethod === 'robohash' ? '2px solid #fff' : '2px solid transparent',
                    borderRadius: 1,
                    p: 0.5,
                  }}
                >
                  <Typography>[ CAT ]</Typography>
                </ButtonBase>
                <ButtonBase
                  onClick={() => onChangeAvatarMethod('jdenticon')}
                  sx={{
                    border: avatarMethod === 'jdenticon' ? '2px solid #fff' : '2px solid transparent',
                    borderRadius: 1,
                    p: 0.5,
                  }}
                >
                  <Typography>[ PATTERN ]</Typography>
                </ButtonBase>
              </Box>
            </Box>
            <TextField
              variant="filled"
              color="error"
              label="Your Password"
              required
              placeholder="●●●●●●"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={onChangePassword}
              onFocus={onFocusHandler}
              onBlur={onBlurHandler}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePasswordVisibility} edge="end">
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                    <IconButton>
                      <Tooltip title="You will not be able to reset your password.">
                        <Info />
                      </Tooltip>
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              variant="filled"
              color="error"
              placeholder="V9FTGY"
              label="Re-furr-al"
              value={referralCode}
              onChange={onChangeReferralCode}
              onFocus={onFocusHandler}
              onBlur={onBlurHandler}
              fullWidth
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={termsChecked}
                  onChange={handleCheckboxChange}
                  color="error"
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{' '}
                  <Typography
                    component="span"
                    onClick={handleOpenTermsModal}
                    sx={{
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      color: '#ff8500',
                    }}
                  >
                    Terms and Conditions
                  </Typography>
                </Typography>
              }
            />
            <input type="hidden" name="recaptchaToken" value={recaptchaToken} readOnly />
            <Button variant="contained" color="error" type="submit" fullWidth>
              Register{' '}
              <Typography component="span" fontStyle="italic">
                [↵]
              </Typography>
            </Button>
          </Box>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" component="span">
              GOT ACCOUNT?{' '}
            </Typography>
            <Button
              variant="text"
              color="error"
              onClick={() => {
                closeModal();
                openLoginModal();
              }}
            >
              LOGIN HERE →
            </Button>
          </Box>
          {showTermsModal && (
            <TermsModal
              modalIsOpen={showTermsModal}
              closeModal={handleCloseTermsModal}
              isDarkMode={isDarkMode}
            />
          )}
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

export default SignupModal;