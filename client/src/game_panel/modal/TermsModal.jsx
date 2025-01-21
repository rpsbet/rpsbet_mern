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

const TermsModal = ({ modalIsOpen, closeModal, isDarkMode }) => {
  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={customStyles}
      contentLabel="Terms Modal"
    >
      <div className={isDarkMode ? 'dark_mode' : ''}>
        <div className="modal-header">
          <h2 className="modal-title title">
            Terms <span style={{ color: '#d81719' }}>RPS</span> <span style={{ color: '#ebddca' }}>Game</span>
          </h2>
          <Button className="btn-close" variant='text' color='error'  onClick={closeModal}>
            ×
          </Button>
        </div>
        <div className="modal-body edit-modal-body terms-modal-body">
          <div>
            <h2 className="title">Terms of Service</h2>
            <br />
            <h5>Last updated: 3rd January 2025</h5>
            <br />
            <h5>Welcome to RPS GAME!</h5>
            <br />
            These terms and conditions outline the rules and regulations for the use of RPS Game's site, located at rps.game. By accessing this site we assume you accept these terms and conditions. Do not continue to use RPS Game if you do not agree to take all of the terms and conditions stated on this page. 
            <br />
            <br />
            <h5>1.0 General</h5>
            <h5>1.1 Cookies</h5>
            We employ the use of cookies. By accessing RPS Game, you agreed to use cookies in agreement with the RPS Game's Privacy Policy.
            <br />
            <br />
            <h5>1.2 License</h5>
            Unless otherwise stated, RPS Game and/or its licensors own the intellectual property rights for all material on RPS Game.
            <br />
            <br />
            <h5>1.3 Hyperlinking to our Content</h5>
            The following organizations may link to our site without prior written approval: government agencies, search engines, news organizations, and online directory distributors.
            <br />
            <br />
            <h5>1.4 iFrames</h5>
            Without prior approval and written permission, you may not create frames around our web pages that alter in any way the visual presentation or appearance of our site.
            <br />
            <br />
            <h5>1.5 Content Liability</h5>
            We shall not be held responsible for any content that appears on your site.
            <br />
            <br />
            <h5>2.0 Your Dealings With Other Players</h5>
            You are responsible for your interactions with other players. If you have a dispute with another player, you release RPS Game from responsibility, claims, demands, and/or damages.
            <br />
            <br />
            <h5>3.0 Payment Terms</h5>
            We provide a service in the form of holding payments between peers within a game of "Rock" - "Paper" - "Scissors".
            <br />
            <br />
            <h5>Contact Us</h5>
            If you have any questions about this Terms Policy, please contact <u>support@rps.game</u>.
          </div>

          <h5 className="mt-3">For All Enquiries</h5>
          <p>
            For any technical/general problems, please contact{' '}
            <u style={{ color: '#f5b22d' }}>support@rps.game</u>. We thank you for playing!
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default TermsModal;