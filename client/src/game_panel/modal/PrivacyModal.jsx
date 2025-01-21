import React from 'react';
import Modal from 'react-modal';
import { Button } from '@mui/material';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    background: 'transparent',
    padding: 0,
    border: 'none',
  },
};

const PrivacyModal = ({ modalIsOpen, closeModal, isDarkMode }) => {
  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={customStyles}
      contentLabel="Privacy Modal"
    >
      <div className={isDarkMode ? 'dark_mode' : ''}>
        <div className="modal-header">
          <h2 className="modal-title title">
            Privacy <span style={{ color: '#d81719' }}>RPS</span>
            <span style={{ color: '#ebddca' }}>Game</span>
          </h2>
          <Button className="btn-close" variant='text' color='error'  onClick={closeModal}>
            ×
          </Button>
        </div>
        <div className="modal-body edit-modal-body terms-modal-body">
          <div>
            <h2>Privacy Policy</h2>
            <br />
            <h5>Last updated: 3rd January 2025</h5>
            <br />
            “RPS GAME,” ("us", "we", or "our") operates https://rps.game (the "Site"). This page
            informs you of our policies regarding the collection, use and disclosure of Personal
            Information we receive from users of the Site. We use your Personal Information only for
            providing and improving the Site. By using the Site, you agree to the collection and use
            of information in accordance with this policy. If you do not want RPS Game to collect,
            store, use, or share your information in the ways described in this Privacy Policy, you
            may not play RPS Game games or use RPS Game’s other Services. For purposes of data
            protection laws, RPS Game is the “data controller” of your personal information.
            <br />
            <br />
            <h5>Information Collection And Use</h5>
            While using our Site, we may ask you to provide us with certain personally identifiable
            information that can be used to contact or identify you. This only includes your email
            address. Personally identifiable information may include, but is not limited to your name
            ("Personal Information"). We do not collect payment details as this is done through
            third-party payment merchants including PayPal (https://www.paypal.com/) and Stripe
            (https://.stripe.com/).
            <br />
            <br />
            <h5>Payment Information</h5>
            We’ll collect information related to any bets you make. For all bets on rps.game, our
            third-party payment processor will collect the billing and financial information it needs
            to process your charges. This may include your postal address, email address, and
            financial information. RPS Game’s payment processors do not share your financial
            information, like credit card numbers, with RPS Game, but they may share non-financial
            information with us related to your purchases, like your billing address, and the amount
            paid. For outgoing payments (‘Winnings’), we may collect your account-specific payment
            details in order to process payments to you.
            <br />
            <br />
            <h5>Customer Support Correspondence</h5>
            We’ll keep a record of any correspondence between us. When you ask for help from our
            Customer Support team, we will collect and store the contact information you give them
            (generally just your email address), information about your game play or activity on our
            Services, and your RPS Game username and/or social network ID number. We will also store
            the communications you have with our Customer Service team and any additional information
            in those communications in order to provide support and improve the Services.
            <br />
            <br />
            Information About You That We Get From Connected Third-Party Applications, Including
            Social Networks We’ll collect some information from other companies, including social
            networks, if you access our games through your accounts with those companies or you
            choose to connect your accounts with those companies to our games. If you play RPS Game
            or access any of our other Services on connected third-party applications or connect our
            Services to any third-party applications, including social networks like Facebook, RPS
            Game may receive certain information about you from the provider of the third-party
            application.
            <br />
            <br />
            <h5>Cookies and Other Automated Information Collection</h5>
            We’ll collect information about your device and how you use our Services, including using
            cookies. As further described in our Cookie Notice, we use cookies to recognize you
            and/or your device(s) on, off, and across different Services and devices.
            <br />
            <br />
            <h5>Changes To This Privacy Policy</h5>
            This Privacy Policy is effective as of 22nd August 2022 and will remain in effect except
            with respect to any changes in its provisions in the future, which will be in effect
            immediately after being posted on this page.
            <br />
            <br />
            <h5>Contact Us</h5>
            If you have any questions about this Privacy Policy, please contact support@rps.game.
            <br />
            <br />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PrivacyModal;