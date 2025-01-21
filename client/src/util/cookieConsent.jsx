import React, { useState } from 'react';
import { connect } from 'react-redux';
import Button from '@mui/material/Button'; // Import Material-UI Button
import { showCookieConsent } from '../redux/Auth/user.actions'; // Adjust import as needed

const CookieConsent = ({ showCookieConsent }) => {
  const [isAccepted, setIsAccepted] = useState(false);

  const handleAccept = () => {
    setIsAccepted(true);
    showCookieConsent(false); // Dispatch action to update the Redux store
  };


  return (
    <div className={`cookie-banner ${isAccepted ? 'accepted' : ''}`}>
      {!isAccepted && (
        <>
          <h3 className="cookie-title">🍪 Want to power up your experience?</h3>
          <p>We use cookies to give you a better experience. Accept cookies to unlock smooth browsing!</p>

          <Button
            variant="contained"
            color='error'
            onClick={handleAccept}
          >
            Accept Cookies
          </Button>
          &nbsp;
          <Button
            variant="contained"
            onClick={handleAccept}
          >
            DECLINE
          </Button>
        </>
      )}
    </div>
  );
};

const mapDispatchToProps = {
  showCookieConsent,
};

export default connect(null, mapDispatchToProps)(CookieConsent);
