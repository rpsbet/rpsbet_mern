import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { userSignUp } from '../../redux/Auth/user.actions';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import {
  Button,
  TextField,
  Typography,
  ButtonBase,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import TermsModal from '../modal/TermsModal';
import { alertModal } from './ConfirmAlerts';
import Visibility from '@mui/icons-material/Visibility';
import Info from '@mui/icons-material/Info';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { setFocused } from '../../redux/Auth/user.actions';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    padding: 0,
    minWidth: '380px',
    border: 'none'
  }
};

function SignupModal(props) {
  const {
    modalIsOpen,
    closeModal,
    openLoginModal,
    isDarkMode,
    userSignUp,
    setFocused,
  } = props;

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
  const [loaded, setLoaded] = useState(false);

  // For referencing the form element directly
  const formRef = useRef(null);

  // -------------------- EFFECTS --------------------
  // componentDidMount equivalent
  useEffect(() => {
    setLoaded(true);
  }, []);

  // componentDidUpdate equivalent for `loaded` => attach form submit handler
  useEffect(() => {
    if (loaded && formRef.current) {
      attachFormSubmitHandler();
    }
  }, [loaded]);

  // -------------------- HANDLERS --------------------
  const attachFormSubmitHandler = () => {
    const form = formRef.current;
    if (form) {
      form.addEventListener('submit', handleFormSubmit);
    } else {
      console.error("Form element not found");
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    /* global grecaptcha */
    grecaptcha.ready(function () {
      grecaptcha.execute('6Lfto1EpAAAAAD5UzhL6Fp7YCZeIDmenzpZewpCv', { action: 'submit' })
        .then(function (token) {
          form.querySelector('input[name="recaptchaToken"]').value = token;
          form.submit();
        });
    });
  };

  const handleCheckboxChange = () => {
    setTermsChecked(prev => !prev);
  };

  const handleOpenTermsModal = () => {
    setShowTermsModal(true);
  };

  const handleCloseTermsModal = () => {
    setShowTermsModal(false);
  };

  const onChangeAvatarMethod = (value) => {
    setAvatarMethod(value);
  };

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
      alertModal(isDarkMode, 'Invalid characters in username. Only alphanumeric characters and underscores are allowed.');
    }
  };

  const onFocusHandler = () => {
    setFocused(true);
  };
  const onBlurHandler = () => {
    setFocused(false);
  };

  const onChangePassword = (e) => {
    setPassword(e.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  const onChangeReferralCode = (e) => {
    setReferralCode(e.target.value);
  };

  // reCAPTCHA: executes the reCAPTCHA to get a token
  const executeRecaptcha = () => {
    return new Promise((resolve) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha.execute('6Lfto1EpAAAAAD5UzhL6Fp7YCZeIDmenzpZewpCv', { action: 'submit' })
          .then((token) => {
            resolve(token);
          });
      });
    });
  };

  const onSubmitForm = async (e) => {
    e.preventDefault();

    const token = await executeRecaptcha();
    setRecaptchaToken(token);

    if (!token) {
      alertModal(isDarkMode, 'reCAPTCHA verification failed. Please try again.');
      return;
    }

    if (!termsChecked) {
      alertModal(isDarkMode, 'Please agree to the Terms and Conditions.');
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

    const result = await userSignUp(newUser);

    if (result.status === 'success') {
      confirmAlert({
        customUI: ({ onClose }) => {
          return (
            <div className={isDarkMode ? 'dark_mode' : ''}>
              <div className="modal-body">
                <h2 className="title">WELCOME TO RPS.GAME TIGER! 🐯⚔</h2>
                <p>CLICK YOUR BALANCE TO MAKE A DEPOSIT</p>
              </div>
              <div className="modal-footer">
                <Button
                  id="login_now"
                  onClick={() => {
                    onClose();
                    closeModal();
                    openLoginModal();
                  }}
                >
                  LOGIN NOW!
                </Button>
              </div>
            </div>
          );
        }
      });
    }
  };

  // -------------------- RENDER --------------------
  return (
    <Modal
      isOpen={modalIsOpen}
      style={customStyles}
      contentLabel={props.title}
    >
      <div className={isDarkMode ? 'dark_mode' : ''}>
        <div className="modal-container">
          <div className="modal-left">
            <img className="giant-picture" src="/img/giant.svg" alt="Register" />
          </div>

          <div className="modal-right">
            <div style={{ borderTopLeftRadius: '0' }} className="modal-header">
              <h2 className="modal-title title">
                <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                REGISTER
              </h2>
              <Button className="btn-close" variant='text' color='error'  onClick={closeModal}>×</Button>
            </div>

            <div className="modal-body">
              <h4 className="title">JOIN THE CAT (FIGHT) CLUB! 🥋</h4>
              <form onSubmit={onSubmitForm} id="signupForm" ref={formRef}>
                 <TextField color="secondary" 
                  placeholder="e.g. PU55YD35TROY3R"
                  label="Your Username"
                  required
                  value={userName}
                  onChange={onChangeUserName}
                  fullWidth
                  className="form-control"
                  variant="filled"
                />

                <div className="avatar-method-selection">
                  <Typography>CHOOSE DEFAULT AVATAR</Typography>
                  <ButtonBase
                    focusRipple
                    key="robohash"
                    className={`avatar-option ${avatarMethod === 'robohash' ? 'selected' : ''}`}
                    onClick={() => onChangeAvatarMethod('robohash')}
                    style={{ borderRadius: '0.3em' }}
                  >
                    <img
                      width="52px"
                      height="52px"
                      src="/img/robohashCat.webp"
                      alt="Robohash"
                    />
                  </ButtonBase>

                  <ButtonBase
                    focusRipple
                    style={{ borderRadius: '0.3em' }}
                    key="jdenticon"
                    className={`avatar-option ${avatarMethod === 'jdenticon' ? 'selected' : ''}`}
                    onClick={() => onChangeAvatarMethod('jdenticon')}
                  >
                    <img
                      width="52px"
                      height="52px"
                      src="/img/jdenticon.webp"
                      alt="Jdenticon"
                    />
                  </ButtonBase>
                </div>

                 <TextField color="secondary" 
                  required
                  placeholder="●●●●●●"
                  type={showPassword ? 'text' : 'password'}
                  label="Your Password"
                  value={password}
                  onFocus={onFocusHandler}
                  onBlur={onBlurHandler}
                  onChange={onChangePassword}
                  fullWidth
                  className="form-control"
                  variant="filled"
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
                    )
                  }}
                />

                 <TextField color="secondary" 
                  placeholder="V9FTGY"
                  label="Re-furr-al"
                  value={referralCode}
                  onFocus={onFocusHandler}
                  onBlur={onBlurHandler}
                  onChange={onChangeReferralCode}
                  fullWidth
                  className="form-control"
                  variant="filled"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={termsChecked}
                      onChange={handleCheckboxChange}
                      color='error'
                    />
                  }
                  label={
                    <span>
                      I agree to the{' '}
                      <a onClick={handleOpenTermsModal}>
                        <Typography component="span" style={{ color: '#ff8500' }}>
                          Terms and Conditions
                        </Typography>
                      </a>
                    </span>
                  }
                />
                <input type="hidden" name="recaptchaToken" value={recaptchaToken} />
              </form>
            </div>

            <div style={{ borderBottomLeftRadius: '0' }} className="modal-footer">
              <Button
                variant='contained' color='error'
                style={{ margin: '20px 0 0' }}
                type="submit"
                form="signupForm"
              >
                Register&nbsp;<span className="roll-tag">[ ↵ ]</span>
              </Button>
              <p className="m-0 sm-text-center">
                GOT ACCOUNT?{' '}
                <Button variant='text' color='error' onClick={() => { closeModal(); openLoginModal(); }}>
                  LOGIN HERE →
                </Button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {showTermsModal && (
        <TermsModal
          modalIsOpen={showTermsModal}
          closeModal={handleCloseTermsModal}
          isDarkMode={isDarkMode}
        />
      )}
    </Modal>
  );
}

const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  isActiveLoadingOverlay: state.logic.isActiveLoadingOverlay
});

const mapDispatchToProps = {
  userSignUp,
  setFocused
};

export default connect(mapStateToProps, mapDispatchToProps)(SignupModal);