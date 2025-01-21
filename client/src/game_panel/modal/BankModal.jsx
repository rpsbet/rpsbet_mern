import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Button } from '@mui/material';
import Modal from 'react-modal';
import BankPage from '../../admin_panel/app/ProductPages/ProductSerchPage/BankPage';
import { Help } from '@mui/icons-material';
import MyLoansModal from '../modal/MyLoansModal';
import AttachMoney from '@mui/icons-material/AttachMoney';
import { warningMsgBar, infoMsgBar } from '../../redux/Notification/notification.actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faAdjust } from '@fortawesome/free-solid-svg-icons';

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

const BankModal = ({ modalIsOpen, closeModal, isDarkMode, remainingLoans }) => {
  const [showMyLoansModal, setShowMyLoansModal] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [invertFilter, setInvertFilter] = useState(false);

  const togglePopup = () => setShowPopup(!showPopup);
  const toggleInvertFilter = () => setInvertFilter(!invertFilter);

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={customStyles}
      contentLabel="CENTRAL BANK Modal"
    >
      <div className={`${isDarkMode ? 'dark_mode' : ''} big-modal`}>
        <div className="modal-header">
          <h2 className="modal-title title">
            <FontAwesomeIcon icon={faCoins} className="mr-2" />
            CENTRAL BANK
          </h2>
          <Button
            className="btn-close" variant='text' color='error'
            onClick={closeModal}
          >
            ×
          </Button>
        </div>

        <div className="modal-body edit-modal-body banking-modal-body">
          <div className="modal-content-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 className="modal-title title">PRIVATE LENDERS</h1>
              <div style={{ width: '50%', textAlign: 'right', padding: '20px' }}>
                <span>HELP</span>&nbsp;
                <Help
                  style={{ width: '16', marginTop: '-3px', cursor: 'pointer' }}
                  onClick={togglePopup}
                />
              </div>
            </div>

            <div className="modal-content-panel">
              <BankPage itemType="loanType" sortCriteria="sortCriteria" />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <Button variant='contained' color='secondary' onClick={() => setShowMyLoansModal(true)}>
            Manage Your Loans&nbsp; <AttachMoney />
          </Button>
        </div>
      </div>

      {showMyLoansModal && (
        <MyLoansModal
          modalIsOpen={showMyLoansModal}
          closeModal={() => setShowMyLoansModal(false)}
          remainingLoans={remainingLoans}
        />
      )}

      {showPopup && (
        <div className={`${isDarkMode ? 'popup-overlay dark_mode' : 'popup-overlay'}`}>
          <div className="popup title">
            <h2 className="modal-title title" style={{ textAlign: 'center', marginBottom: '20px' }}>
              Loan Information
            </h2>
            <div className="popup-content">
              <div style={{ position: 'relative' }}>
                <img
                  src="../img/loans.svg"
                  style={{
                    borderRadius: '20px',
                    border: '1px solid #aaa9',
                    overflow: 'hidden',
                    filter: invertFilter ? 'invert(1)' : 'none',
                  }}
                  alt="Loans"
                />
                <Button
                  onClick={toggleInvertFilter}
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    borderRadius: '100px',
                    padding: '0',
                  }}
                >
                  <FontAwesomeIcon icon={faAdjust} />
                </Button>
              </div>
              <h3
                style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  marginBottom: '15px',
                  textAlign: 'center',
                  letterSpacing: '0.5px',
                }}
              >
                Central Bank Overview
              </h3>
              <p
                style={{
                  fontSize: '16px',
                  lineHeight: '1.6',
                  marginBottom: '15px',
                  textAlign: 'justify',
                  padding: '0 20px',
                }}
              >
                The central bank is funded by private lenders, A.K.A Peer-to-peer lending (P2P). P2P
                lending connects borrowers directly with investors.
              </p>
              <h3
                style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  marginTop: '30px',
                  marginBottom: '15px',
                  textAlign: 'center',
                  letterSpacing: '0.5px',
                }}
              >
                Definitions
              </h3>
              <h4
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#16e100',
                  marginBottom: '10px',
                  padding: '0 20px',
                }}
              >
                Fractional Reserve Banking
              </h4>
              <p
                style={{
                  fontSize: '16px',
                  lineHeight: '1.6',
                  marginBottom: '15px',
                  textAlign: 'justify',
                  padding: '0 20px',
                }}
              >
                Fractional Reserve Banking is a system in which only a fraction of bank deposits are
                backed by actual cash on hand and available for withdrawal. The remainder is lent out
                to borrowers.
              </p>

              <Button
                style={{ display: 'block', margin: 'auto' }}
                onClick={togglePopup}
              >
                OK, GOT IT!
              </Button>
            </div>
            <button className="popup-close" onClick={togglePopup}>
              &times;
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
});

const mapDispatchToProps = {
  warningMsgBar,
  infoMsgBar,
};

export default connect(mapStateToProps, mapDispatchToProps)(BankModal);