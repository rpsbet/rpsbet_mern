import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import './Modals.css';
import { userSignUp } from '../../redux/Auth/user.actions';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { Button, TextField, Typography, ButtonBase, Checkbox, FormControlLabel, InputAdornment, IconButton, Tooltip } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import TermsModal from '../modal/TermsModal';
import { alertModal } from './ConfirmAlerts';
import Visibility from '@material-ui/icons/Visibility';
import Info from '@material-ui/icons/Info';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import { setFocused } from '../../redux/Auth/user.actions';

Modal.setAppElement('#root')

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
     minWidth: '380px'
  }
}

class SignupModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userName: '',
      // email: '',
      password: '',
      bio: '',
      avatar: '',
      referralCode: '',
      showTermsModal: false,
      avatarMethod: 'robohash',
      termsChecked: false,
      password: '',
      showPassword: false,
      recaptchaToken: '',
      loaded: false
    }
  }
  componentDidMount() {
    this.setState({loaded: true});
  }
  
  componentDidUpdate(prevState) {
    if (!prevState.loaded && this.state.loaded) {
      this.attachFormSubmitHandler();
    }
  }

  attachFormSubmitHandler = () => {
    const form = document.getElementById('signupForm');
    if (form) {
      form.addEventListener('submit', this.handleFormSubmit);
    } else {
      console.error("Form element not found");
    }
  };

  handleFormSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    grecaptcha.ready(function () {
      grecaptcha.execute('6Lfto1EpAAAAAD5UzhL6Fp7YCZeIDmenzpZewpCv', { action: 'submit' }).then(function (token) {
        form.querySelector('input[name="recaptchaToken"]').value = token;
        form.submit();
      });
    });
  };
  handleRecaptchaToken = (token) => {
    this.setState({ recaptchaToken: token });
  };


  handleCheckboxChange = () => {
    this.setState((prevState) => ({ termsChecked: !prevState.termsChecked }));
  };

  handleOpenTermsModal = () => {
    this.setState({ showTermsModal: true });
  };
  handleCloseTermsModal = () => {
    this.setState({ showTermsModal: false });
  };

  onChangeAvatarMethod = (e) => {
    this.setState({ avatarMethod: e.target.value });
  };

  onChangeUserName = (e) => {
    const username = e.target.value;

    // Define a regular expression for allowed characters (e.g., alphanumeric and underscores)
    const allowedCharsRegex = /^[a-zA-Z0-9_]+$/;

    // Check if the input value is empty (deletion), allow it
    if (username === '') {
      this.setState({ userName: '' });
      return;
    }

    if (allowedCharsRegex.test(username)) {
      this.setState({ userName: username });
    } else {
      alertModal(this.props.isDarkMode, 'Invalid characters in username. Only alphanumeric characters and underscores are allowed.');
    }
  }

  onFocusHandler = () => {
    this.props.setFocused(true);
  }
  onBlurHandler = () => {
    this.props.setFocused(false);
  }

  onChangePassword = (e) => {
    this.setState({ password: e.target.value });
  }

  togglePasswordVisibility = () => {
    this.setState((prevState) => ({ showPassword: !prevState.showPassword }));
  };


  onChangeReferralCode = (e) => {
    this.setState({ referralCode: e.target.value });
  }


  onSubmitForm = async (e) => {
    e.preventDefault();

    // Execute reCAPTCHA
    const recaptchaToken = await this.executeRecaptcha();
    this.setState({ recaptchaToken });

    // Check if reCAPTCHA token is available
    if (!recaptchaToken) {
      alertModal(this.props.isDarkMode, 'reCAPTCHA verification failed. Please try again.');
      return;
    }


    if (!this.state.termsChecked) {
      alertModal(this.props.isDarkMode, 'Please agree to the Terms and Conditions.');
      return;
    }


    const result = await this.props.userSignUp(this.state);

    if (result.status === 'success') {
      confirmAlert({
        customUI: ({ onClose }) => {
          return (
            <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
              <div className='modal-body'>
                <h2>WELCOME TO RPS.GAME TIGER! 🐯⚔</h2>
                <p>CLICK YOUR BALANCE TO MAKE A DEPOSIT</p>
              </div>
              <div className="modal-footer">
                <Button id="login_now" onClick={() => {
                  onClose();
                  this.props.closeModal();
                  this.props.openLoginModal();
                }}>LOGIN NOW!</Button>
              </div>
            </div>
          );
        }
      });
    }
  }

  executeRecaptcha = () => {
    return new Promise((resolve) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha.execute('6Lfto1EpAAAAAD5UzhL6Fp7YCZeIDmenzpZewpCv', { action: 'submit' }).then((token) => {
          resolve(token);
        });
      });
    });
  };



  render() {
    const { modalIsOpen, closeModal, openLoginModal, isDarkMode } = this.props;
    const { userName, password, referralCode, avatarMethod, termsChecked, showPassword } = this.state;

    return (
      <Modal
        isOpen={modalIsOpen}
        style={customStyles}
        contentLabel={this.props.title}
      >
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className={"modal-container"}>
            <div className='modal-left'>
              {/* Left column with giant picture */}
              <img className="giant-picture" src="/img/giant.svg" alt="Register" />
            </div>
            <div className='modal-right'>
              <div style={{ borderTopLeftRadius: "0" }} className='modal-header'>
                <h2 className='modal-title'>
                  <FontAwesomeIcon icon={faUserPlus} className="mr-2" />

                  REGISTER
                </h2>
                <Button className="btn-close" onClick={closeModal}>×</Button>
              </div>
              <div className="modal-body">
                <h4>JOIN THE CAT (FIGHT) CLUB! 🥋</h4>
                <form onSubmit={this.onSubmitForm} id="signupForm">
                  <TextField
                    placeholder="e.g. PU55YD35TROY3R"
                    label="Your Username"
                    required
                    value={userName}
                    onChange={this.onChangeUserName}
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
                      onClick={() => this.onChangeAvatarMethod({ target: { value: 'robohash' } })}
                      style={{borderRadius:"0.3em"}}
                    >
                      <img width="52px"  height="52px" src="/img/robohashCat.webp" alt="Robohash" />
                    </ButtonBase>
                    <ButtonBase
                      focusRipple
                      style={{borderRadius:"0.3em"}}
                      key="jdenticon"
                      className={`avatar-option ${avatarMethod === 'jdenticon' ? 'selected' : ''}`}
                      onClick={() => this.onChangeAvatarMethod({ target: { value: 'jdenticon' } })}
                    >
                      <img width="52px"   height="52px" src="/img/jdenticon.webp" alt="Jdenticon" />
                    </ButtonBase>
                  </div>
                  <TextField
                    required
                    placeholder="●●●●●●"
                    type={showPassword ? 'text' : 'password'}
                    label="Your Password"
                    value={password}
                    onFocus={this.onFocusHandler}
                    onBlur={this.onBlurHandler}
                    onChange={this.onChangePassword}
                    fullWidth
                    className="form-control"
                    variant="filled"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={this.togglePasswordVisibility}
                            edge="end"
                          >
                            {showPassword ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                          <IconButton>
                            <Tooltip title="You will not be able to reset your password."><Info /></Tooltip>
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />

                  <TextField
                    placeholder="V9FTGY"
                    label="Re-furr-al"
                    value={referralCode}
                    onFocus={this.onFocusHandler}
                    onBlur={this.onBlurHandler}
                    onChange={this.onChangeReferralCode}
                    fullWidth
                    className="form-control"
                    variant="filled"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={termsChecked}
                        onChange={this.handleCheckboxChange}
                        color="primary"
                      />
                    }
                    label={
                      <span>
                        I agree to the{' '}
                        <a onClick={this.handleOpenTermsModal}>
                          <Typography component="span" color="primary">
                            Terms and Conditions
                          </Typography>
                        </a>
                      </span>
                    }
                  />
                  <input type="hidden" name="recaptchaToken" value={this.state.recaptchaToken} />

                </form>

              </div>
              <div style={{ borderBottomLeftRadius: "0" }} className="modal-footer">
                <Button className="btn-submit" style={{margin: "20px 0 0"}} type="submit" form="signupForm">
                  Register&nbsp;<span className='roll-tag'>[ ↵ ]</span>
                </Button>
                <p className="m-0 sm-text-center">
                  GOT ACCOUNT?{' '}
                  <Button onClick={(e) => { closeModal(); openLoginModal(); }}>
                    LOGIN HERE →
                  </Button>
                </p>
              </div>
            </div>

          </div>
        </div>
        {this.state.showTermsModal && (
          <TermsModal
            modalIsOpen={this.state.showTermsModal}
            closeModal={this.handleCloseTermsModal}
            isDarkMode={this.props.isDarkMode}
          />
        )}
      </Modal>

    );
  }
}



const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,
  isActiveLoadingOverlay: state.logic.isActiveLoadingOverlay
});

const mapDispatchToProps = {
  userSignUp,
  setFocused
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SignupModal);
