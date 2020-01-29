import React from 'react';
// import Avatar from '@material-ui/core/Avatar';
import { HepperLink } from '../../components/HepperLink';
import RegistrationForm from './Registration/RegistrationForm';

function SignUp() {
  return (
    <div className="site_wrapper">
      <div className="login_wrapper">
        <RegistrationForm />
        <div className="copyright">
          {'Copyright © RPS Bet, '}
          <HepperLink color="White" to="/">
            rpsbet.com
          </HepperLink>{' '}
          <HepperLink to="/">Privacy</HepperLink>{' | '}
          <HepperLink to="/">Terms</HepperLink>
        </div>
      </div>
    </div>
  );
}
export default SignUp;
