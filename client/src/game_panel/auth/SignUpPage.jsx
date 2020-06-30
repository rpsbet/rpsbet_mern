import React from 'react';
// import Avatar from '@material-ui/core/Avatar';
import { HepperLink } from '../../components/HepperLink';
import RegistrationForm from './Registration/RegistrationForm';
import PrivacyModal from '../modal/PrivacyModal';
import TermsModal from '../modal/TermsModal';

function SignUp() {

  return (
    <div className="site_wrapper">
      <div className="login_wrapper">
        <RegistrationForm />
        <TermsModal />
        <PrivacyModal />
        <div className="copyright">
        rpsbet.com © 2020 RPS Bet Ltd. 12175962, <a href="#privacy" id="privacy">Privacy</a> | <a href="#terms" id="terms">Terms</a>

      {/*
        *
        *
        *
          {'Copyright © RPS Bet, '}
          <HepperLink color="White" to="/">
            rpsbet.com
          </HepperLink>{' '}
          <HepperLink to="/">Privacy</HepperLink>{' | '}
          <HepperLink to="/">Terms</HepperLink>

         *
         *
         *
         */}

        </div>
      </div>
    </div>
  );
}
export default SignUp;
