import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { verifyEmail, resendVerificationEmail, userSignOut } from '../../redux/Auth/user.actions';
import PrivacyModal from '../modal/PrivacyModal';
import TermsModal from '../modal/TermsModal';

function VerificationPage(props) {
  const [verificationCode, setVerificationCode] = useState('');
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
      if (verificationCode.length === 4) {
          setDisable(false);
      } else {
        setDisable(true);
      }
    };
    handleDisableButton();
  }, [verificationCode]);

  const handleSubmit = event => {
    event.preventDefault();
    props.verifyEmail(verificationCode);
  };

  const resendEmail = event => {
    event.preventDefault();
    props.resendVerificationEmail();
  }

  return (
    <div className="site_wrapper">
      <div className="login_wrapper">
        <div className="login_form">
          <div className="row">
            <img className="logo" src="/img/logo.png" alt="RPS Bet Logo"/>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Verification Code</label>
              <input type="text" className="form-control" placeholder="Verification Code" name="verification_code" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} />
            </div>
            <div className="form-group">
              <button className={"btn btn-info btn-block " + disable}>Confirm</button>
              <button id="btn_goback" className={"btn btn-block " + disable} onClick={props.userSignOut}>Go Back</button>
            </div>
            <div className="text-center">
              <a href="#resend" onClick={resendEmail} id="resend"><u>Resend Verification Email</u></a>
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
  verifyEmail,
  resendVerificationEmail,
  userSignOut
};

export default connect(
  null,
  mapDispatchToProps
)(VerificationPage);
