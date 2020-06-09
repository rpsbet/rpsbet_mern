import React, { useEffect, useState } from 'react';
import { HepperLink } from '../../components/HepperLink';
import history from '../../redux/history';
import axios from '../../util/Api';

function ChangePasswordPage(props) {
  const [password, setPassword] = useState('');
  const [confirm_password, setConfirmPassword] = useState('');
  const [disable, setDisable] = useState(true);

  const params = window.location.pathname.split('/').pop();

  useEffect(() => {
    const handleDisableButton = () => {
        if (password.length >= 4) {
            if (password === confirm_password) {
                setDisable(false);
            } else {
                setDisable(true);
            }
        } else {
            setDisable(true);
        }
    };
    handleDisableButton();
  }, [password, confirm_password]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = { password, params };
    const result = await axios.post('/auth/resetPassword/', payload);

    if (password === '') {
        alert('please input new password.');
        return;
    }

    if (password !== confirm_password) {
        alert('Invalid value. Please try again.');
        setPassword('');
        setConfirmPassword('');
        return;
    }
    
    if (result.data.success) {
        alert('Password has been changed. Please log in now.');
        history.push('/signin');
    } else {
        alert(result.data.error);
    }
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
              <label>Password</label>
              <input type="password" className="form-control" placeholder="Password" name="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" className="form-control" placeholder="Confirm Password" name="confirm_password" value={confirm_password} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <button className={"btn btn-info btn-block " + disable}>Set Password</button>
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

export default ChangePasswordPage;