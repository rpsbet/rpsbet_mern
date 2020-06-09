import React, { useEffect, useState } from 'react';
import { HepperLink } from '../../components/HepperLink';
import axios from '../../util/Api';

function ResetPasswordPage(props) {
  const [email, setemail] = useState('');
  const [disable, setDisable] = useState(true);

  useEffect(() => {
    const handleDisableButton = () => {
        if (email.length >= 4) {
            setDisable(false);
        } else {
            setDisable(true);
        }
    };
    handleDisableButton();
  }, [email]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = { email };
    const result = await axios.post('/auth/sendResetPasswordEmail/', payload);
    
    if (result.data.success) {
        alert('Please check your email.');
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
              <label>Email Address</label>
              <input type="text" className="form-control" placeholder="Email Address" name="email" value={email} onChange={e => setemail(e.target.value)} />
            </div>
            <div className="form-group">
                <button className={"btn btn-info btn-block " + disable}>Send Email</button>
              <a href="/signin" className="btn btn-block" id="btn_signup">Back</a>
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

export default ResetPasswordPage;
