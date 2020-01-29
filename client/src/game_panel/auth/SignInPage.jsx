import React, { useEffect, useState } from 'react';
// import Avatar from '@material-ui/core/Avatar';
import { HepperLink } from '../../components/HepperLink';
import { connect } from 'react-redux';
import { userSignIn } from '../../redux/Auth/user.actions';

function SignInSide(props) {
  const [email, setemail] = useState('');
  const [password, setPassword] = useState('');
  const [disable, setDisable] = useState(true);

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
              <label>Email Address</label>
              <input type="text" className="form-control" placeholder="Email Address" name="email" value={email} onChange={e => setemail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" className="form-control" placeholder="Password" name="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <button className="btn btn-info btn-block">Login</button>
              <a href="/signup" className="btn btn-block" id="btn_signup">Register</a>
            </div>
            <div>
              <input type="checkbox" name="keep" id="keep"/><label htmlFor="keep">Keep Me Signed In</label>
            </div>
            <div className="text-center">
              <a href="/resetPassword" id="resetpwd"><u>Forgot your Password?</u></a>
            </div>
          </form>
        </div>
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

const mapDispatchToProps = {
  userSignIn
};

export default connect(
  null,
  mapDispatchToProps
)(SignInSide);
