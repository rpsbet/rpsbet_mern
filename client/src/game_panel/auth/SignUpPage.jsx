import React, { useEffect, useState } from 'react';
// import Avatar from '@material-ui/core/Avatar';
import { HepperLink } from '../../components/HepperLink';
import RegistrationForm from './Registration/RegistrationForm';
import PrivacyModal from '../modal/PrivacyModal';
import TermsModal from '../modal/TermsModal';

function SignUp() {
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

  return (
    <div className="site_wrapper">
      <div className="login_wrapper">
        <RegistrationForm />

        <TermsModal modalIsOpen={showTermsModal} closeModal={handleCloseTermsModal} />
        <PrivacyModal modalIsOpen={showPrivacyModal} closeModal={handleClosePrivacyModal} />

        <div className="copyright">
        rpsbet.com © 2020 RPS Bet Ltd. 12175962, <a href="#privacy" onClick={handleOpenPrivacyModal} id="privacy">Privacy</a> | <a href="#terms" onClick={handleOpenTermsModal} id="terms">Terms</a>
        </div>
      </div>
    </div>
  );
}
export default SignUp;
