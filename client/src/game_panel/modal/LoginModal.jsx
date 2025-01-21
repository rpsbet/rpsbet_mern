import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { Button, TextField } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

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
    minWidth: '380px',
    border: 'none'
  }
};

function LoginModal(props) {
  const { email: initialEmail, password: initialPassword } = props;

  // ------------------ LOCAL STATE ------------------
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState(initialPassword);
  const [isInvestorsPage, setIsInvestorsPage] = useState(
    window.location.pathname.startsWith('/investors')
  );

  // ------------------ HANDLERS ------------------
  const onFocusHandler = () => {
    props.setFocused(true);
  };

  const onBlurHandler = () => {
    props.setFocused(false);
  };

  const onChangeEmail = (e) => {
    setEmail(e.target.value);
  };

  const onChangePassword = (e) => {
    setPassword(e.target.value);
  };

  const onKeyDownDocument = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSubmitForm(event);
    }
  };

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

        google.accounts.id.prompt(); // Display the One Tap prompt automatically
      } else {
        console.error('Google Sign-In button element not found');
      }
    }, 100);
  };

  const handleGoogleCredentialResponse = (response) => {
    if (!response || !response.credential) {
      console.error('No credential found in response');
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
        console.error('Error during authentication:', error);
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

    // Check if the current URL is '/investors'
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/investors')) {
      history.push('/investors');
    } else {
      history.push('/');
    }

    props.closeModal();
  };

  // ------------------ LIFECYCLE: componentDidMount + WillUnmount ------------------
  useEffect(() => {
    document.addEventListener('keydown', onKeyDownDocument);
    initializeGoogleSignIn();

    // Re-initialize after short delay
    setTimeout(() => {
      const buttonElement = document.getElementById('googleSignInButton');
      initializeGoogleSignIn();
    }, 100);

    setIsInvestorsPage(window.location.pathname.startsWith('/investors'));

    // Cleanup (componentWillUnmount)
    return () => {
      document.removeEventListener('keydown', onKeyDownDocument);
    };
  }, []);

  // ------------------ RENDER ------------------
  return (
    <Modal
      closeTimeoutMS={500}
      isOpen={props.modalIsOpen}
      style={customStyles}
      contentLabel={props.title}
    >
      <div className={props.isDarkMode ? 'dark_mode' : ''}>
        <div className="modal-header">
          <h2 className="modal-title title">
            <FontAwesomeIcon icon={faSignInAlt} className="mr-2" />
            LOGIN
          </h2>
          <Button className="btn-close" variant='text' color='error'  onClick={props.closeModal}>
            ×
          </Button>
        </div>

        <div className="modal-img title">
          <img
            style={{ width: '100%', margin: '0px', overflow: 'hidden' }}
            src="/img/giant-login.svg"
            alt="Login"
          />
        </div>

        <div
          className="modal-body"
          style={{ paddingTop: '0', paddingBottom: '5px' }}
        >
          <form onSubmit={onSubmitForm}>
             <TextField color="secondary" 
              type="text"
              className="form-control"
              variant="filled"
              label="Username"
              onFocus={onFocusHandler}
              onBlur={onBlurHandler}
              id="email"
              value={email}
              onChange={onChangeEmail}
              autoComplete="on"
            />
             <TextField color="secondary" 
              type="password"
              className="form-control"
              id="password"
              value={password}
              label="Password"
              variant="filled"
              onFocus={onFocusHandler}
              onBlur={onBlurHandler}
              autoComplete="new-password"
              onChange={onChangePassword}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSubmitForm(e);
                }
              }}
            />
          </form>
        </div>

        <div
          className="modal-footer"
          style={{
            margin: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              margin: 'flex',
              flexDirection: 'row',
              display: 'flex',
              width: 'calc(100% - 10px)',
              marginLeft: '-2.5px',
              justifyContent: 'space-between'
            }}
          >
            <Button
              onClick={onSubmitForm}
              variant='contained'
              color='error'
              className="login"
              style={{ marginTop: '0px', padding: '10px' }}
            >
              Login&nbsp;<span className="roll-tag">[ ↵ ]</span>
            </Button>
            <div id="googleSignInButton"></div>
          </div>

          <Button
            style={{
              width: 'calc(100% - 10px)',
              margin: '10px 0 0 -10px'
            }}
            variant='contained' color='secondary'
            onClick={() => {
              props.closeModal();
              props.openSignupModal();
            }}
          >
            NEWBIE? GET REGISTERED →
          </Button>

          {!isInvestorsPage ? (
            <a
              style={{
                textAlign: 'center',
                padding: '5px',
                textDecoration: 'underline',
                color: '#ffd000',
                width: 'calc(100% - 10px)',
                margin: '10px 0 0 -10px'
              }}
              variant='contained' color='secondary'
              onClick={() => {
                props.closeModal();
                history.push('/investors');
              }}
            >
              INVESTOR? ($RPS PORTAL)&nbsp;
              <FontAwesomeIcon icon={faExternalLinkAlt} />
            </a>
          ) : (
            <a
              style={{
                textAlign: 'center',
                padding: '5px',
                textDecoration: 'underline',
                color: '#ffd000',
                width: 'calc(100% - 10px)',
                margin: '10px 0 0 -10px'
              }}
              variant='contained' color='secondary'
              onClick={() => {
                props.closeModal();
                history.push('/play');
              }}
            >
              Play RPS.Game&nbsp;<FontAwesomeIcon icon={faExternalLinkAlt} />
            </a>
          )}
        </div>
      </div>
    </Modal>
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