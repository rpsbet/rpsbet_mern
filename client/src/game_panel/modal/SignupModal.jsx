import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import './Modals.css';
import { userSignUp } from '../../redux/Auth/user.actions';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { Button, TextField, Typography, ButtonBase, Checkbox, FormControlLabel } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import TermsModal from '../modal/TermsModal';
import { alertModal } from './ConfirmAlerts';
import ReCAPTCHA from "react-google-recaptcha";

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
      recaptchaValue: null,
    }
  }

  handleCheckboxChange = () => {
    this.setState((prevState) => ({ termsChecked: !prevState.termsChecked }));
  };

  onChangeReCAPTCHA = (value) => {
    // Update the state with the reCAPTCHA value
    this.setState({ recaptchaValue: value });
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
    this.setState({ userName: e.target.value });
  }

  onChangePassword = (e) => {
    this.setState({ password: e.target.value });
  }

  onChangeReferralCode = (e) => {
    this.setState({ referralCode: e.target.value });
  }

  onSubmitForm = async (e) => {
    e.preventDefault();
    if (!this.state.termsChecked) {
      alertModal(this.props.isDarkMode, 'Please agree to the Terms and Conditions.');
      return;
    }

    if (!this.state.recaptchaToken) {
      alertModal(this.props.isDarkMode, 'Please complete the captcha.');
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

  render() {
    const { modalIsOpen, closeModal, openLoginModal, isDarkMode } = this.props;
    const { userName, password, referralCode, avatarMethod, termsChecked } = this.state;

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
              <img className="giant-picture" src="/img/giant.webp" alt="Register" />
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
                    placeholder="CasE SeNsItIvE"
                    label="Your Username"
                    required
                    value={userName}
                    onChange={this.onChangeUserName}
                    fullWidth
                    className="form-control"
                    variant="outlined"
                  />

                  <div className="avatar-method-selection">
                    <Typography>CHOOSE DEFAULT AVATAR</Typography>
                    <ButtonBase
                      focusRipple
                      key="robohash"
                      className={`avatar-option ${avatarMethod === 'robohash' ? 'selected' : ''}`}
                      onClick={() => this.onChangeAvatarMethod({ target: { value: 'robohash' } })}
                    >
                      <img width="52px" height="52px" src="/img/robohashCat.webp" alt="Robohash" />
                    </ButtonBase>
                    <ButtonBase
                      focusRipple
                      key="jdenticon"
                      className={`avatar-option ${avatarMethod === 'jdenticon' ? 'selected' : ''}`}
                      onClick={() => this.onChangeAvatarMethod({ target: { value: 'jdenticon' } })}
                    >
                      <img width="52px" height="52px" src="/img/jdenticon.webp" alt="Jdenticon" />
                    </ButtonBase>
                  </div>
                  <TextField
                    required
                    placeholder="●●●●●●"
                    type="password"
                    label="Your Password"
                    value={password}
                    onChange={this.onChangePassword}
                    fullWidth
                    className="form-control"
                    variant="outlined"
                  />
                  <TextField
                    placeholder="V9FTGY"
                    label="Re-furr-al"
                    value={referralCode}
                    onChange={this.onChangeReferralCode}
                    fullWidth
                    className="form-control"
                    variant="outlined"
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
                  <ReCAPTCHA
                    sitekey="6LcE5kgpAAAAAGkmu6IJZfl-NxuR049R6a_Oy4nS"
                    onChange={this.onChangeReCAPTCHA}
                    size="invisible"
                    style={{display: "none"}}
                    />
                </form>

              </div>
              <div style={{ borderBottomLeftRadius: "0" }} className="modal-footer">
                <Button className="btn-submit" type="submit" form="signupForm">
                  Register
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
});

const mapDispatchToProps = {
  userSignUp
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SignupModal);
