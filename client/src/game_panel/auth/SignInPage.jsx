import React, { useEffect, useState } from 'react';
// import Avatar from '@material-ui/core/Avatar';
import { connect } from 'react-redux';
import { userSignIn } from '../../redux/Auth/user.actions';
import PrivacyModal from '../modal/PrivacyModal';
import TermsModal from '../modal/TermsModal';

function SignInSide(props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [disable, setDisable] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleOpenPrivacyModal = event => {
    event.preventDefault();
    setShowPrivacyModal(true);
  };

  const handleClosePrivacyModal = event => {
    event.preventDefault();
    setShowPrivacyModal(false);
  };

  const handleOpenTermsModal = event => {
    event.preventDefault();
    setShowTermsModal(true);
  };

  const handleCloseTermsModal = event => {
    event.preventDefault();
    setShowTermsModal(false);
  };

  useEffect(() => {
    const handleDisableButton = () => {
      if (email.length >= 4) {
        if (password.length >= 3) {
          setDisable(false);
        } else {
          setDisable(true);
        }
      } else {
        setDisable(true);
      }
    };
    handleDisableButton();
  }, [email, password]);

  const handleSubmit = event => {
    event.preventDefault();
    const payload = { email, password };
    props.userSignIn(payload);
  };

  return (
    <div className="site_wrapper">
      <div className="login_wrapper">
        <div className="login_form">
          <div className="row">
            <img className="logo" src="/img/logo.png" alt="RPS Bet Logo"/>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username / Email</label>
              <input type="text" className="form-control" placeholder="cAse_SeNsItIvE" name="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" className="form-control" placeholder="password" name="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <button className={"btn btn-info btn-block " + disable}>Login</button>
              <a href="/signup" className="btn btn-block" id="btn_signup">Register</a>
            </div>
            <div>
              <input type="checkbox" name="keep" id="keep" defaultChecked/><label htmlFor="keep" >Keep Me Signed In</label>
            </div>
            <div className="text-center">
              <a href="/resetPassword" id="resetpwd"><u>Forgot your Password?</u></a>
            </div>
          </form>

        </div>
        <div className="copyright">
                All Rights Reserved, rpsbet.com © 2020 <a href="#privacy" onClick={handleOpenPrivacyModal} id="privacy">Privacy</a> | <a href="#terms" onClick={handleOpenTermsModal} id="terms">Terms</a>
        </div>
        <TermsModal modalIsOpen={showTermsModal} closeModal={handleCloseTermsModal} />
        <PrivacyModal modalIsOpen={showPrivacyModal} closeModal={handleClosePrivacyModal} />
      </div>
    </div>
  );
}

const mapDispatchToProps = {
  userSignIn
};

export default connect(
  null,
  mapDispatchToProps
)(SignInSide);
