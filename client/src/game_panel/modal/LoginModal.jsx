import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import './Modals.css';
import { Button, TextField } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt } from '@fortawesome/free-solid-svg-icons';
import { setFocused, userSignIn, getUser, authenticateWithGoogle } from '../../redux/Auth/user.actions';
import { getMyGames, getMyHistory, getMyChat, getNotifications } from '../../redux/Logic/logic.actions';
import history from '../../redux/history';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    padding: 0,
    background: 'transparent',
    minWidth: '380px'
  }
};

class LoginModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: props.email,
      password: props.password,
      showVerificationModal: false
    };
  }

  onFocusHandler = () => {
    this.props.setFocused(true);
  }

  onBlurHandler = () => {
    this.props.setFocused(false);
  }

  onChangeEmail = e => {
    this.setState({ email: e.target.value });
  };

  onChangePassword = e => {
    this.setState({ password: e.target.value });
  };

  onKeyDownDocument = event => {
    const { key } = event;
    if (key === 'Enter') {
      event.preventDefault();
      this.onSubmitForm(event);
    }
  };

  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDownDocument);
    this.initializeGoogleSignIn();

    setTimeout(() => {
      const buttonElement = document.getElementById('googleSignInButton');
      this.initializeGoogleSignIn();
    }, 100);

  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDownDocument);
  }

  initializeGoogleSignIn = () => {
    setTimeout(() => {
      const buttonElement = document.getElementById('googleSignInButton');

      if (buttonElement) {

        google.accounts.id.initialize({
          client_id: '565609210873-2ajd0detnt4h6q8ufhrl5nvlv4h01ol0.apps.googleusercontent.com',
          callback: this.handleGoogleCredentialResponse
        });

        google.accounts.id.renderButton(
          buttonElement,
          { theme: 'outline', size: 'large' }
        );

        google.accounts.id.prompt(); // Display the One Tap prompt automatically
      } else {
        console.error('Google Sign-In button element not found');
      }
    }, 100); // 100 milliseconds delay, adjust as needed
  }


  handleGoogleCredentialResponse = response => {

    if (!response || !response.credential) {
      console.error('No credential found in response');
      return;
    }

    const jwt = response.credential;

    // Dispatch the authentication action
    this.props.authenticateWithGoogle({token: jwt})
      .then(result => {
        if (result.status === 'success') {

          this.props.closeModal();
          this.onSuccessfulLogin(result.user);
        } else {
          console.error('Login failed:', result.error);
        }
      })
      .catch(error => {
        console.error('Error during authentication:', error);
      });
  }

  onSubmitForm = async e => {
    e.preventDefault();
    const result = await this.props.userSignIn(this.state);
    if (result.status === 'success') {
      this.onSuccessfulLogin(result.user);
    }
  };

  onSuccessfulLogin = user => {
    this.props.initSocket();
    this.props.getNotifications();
    this.props.getMyHistory();
    this.props.getMyChat();
    history.push('/');
    this.props.closeModal();
  }

  render() {
    return (
      <Modal
        closeTimeoutMS={500}
        isOpen={this.props.modalIsOpen}
        style={customStyles}
        contentLabel={this.props.title}
      >
        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title">
              <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />
              LOGIN
            </h2>
            <Button className="btn-close" onClick={this.props.closeModal}>
              ×
            </Button>
          </div>
          <div className="modal-img">
            <img style={{ maxWidth: "95%", margin: "10px", overflow: "hidden" }} src="/img/giant-login.svg" alt="Login" />
          </div>
          <div className="modal-body" style={{ paddingTop: "0", paddingBottom: "5px" }}>
            <form onSubmit={this.onSubmitForm}>
              <TextField
                type="text"
                className="form-control"
                variant="filled"
                label="Username"
                onFocus={this.onFocusHandler}
                onBlur={this.onBlurHandler}
                id="email"
                value={this.state.email}
                onChange={this.onChangeEmail}
                autoComplete="on"
              />
              <TextField
                type="password"
                className="form-control"
                id="password"
                value={this.state.password}
                label="Password"
                variant="filled"
                onFocus={this.onFocusHandler}
                onBlur={this.onBlurHandler}
                autoComplete="new-password"
                onChange={this.onChangePassword}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    this.onSubmitForm(e);
                  }
                }}
              />
            </form>
          </div>
          <div className="modal-footer" style={{ margin: "flex", flexDirection: "column" }}>
            <div style={{ margin: "flex", flexDirection: "row", display:"flex", width: "calc(100% - 10px)", marginLeft:"-2.5px", justifyContent:"space-between"}}>

              <Button
                onClick={this.onSubmitForm} className="btn-submit login" style={{ marginTop: "0px", padding: "10px"}} >
                Login&nbsp;<span className='roll-tag'>[ ↵ ]</span>
              </Button>
            <div id="googleSignInButton"></div>
            </div>


            <Button
              style={{  width: "calc(100% - 10px)", margin: "10px 0 0 -10px" }}
              className="btn-back"
              onClick={e => {
                this.props.closeModal();
                this.props.openSignupModal();
              }}
            >
              NEWBIE?{' '}GET REGISTERED →
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
}

const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,
  email: state.auth.user.email,
  password: state.auth.user.password
});

const mapDispatchToProps = {
  userSignIn,
  getUser,
  getMyGames,
  getMyHistory,
  getMyChat,
  getNotifications,
  setFocused,
  authenticateWithGoogle
};

export default connect(mapStateToProps, mapDispatchToProps)(LoginModal);
