import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button } from '@material-ui/core';
import Modal from 'react-modal';
import BankPage from '../../admin_panel/app/ProductPages/ProductSerchPage/BankPage';
import { Help } from '@material-ui/icons';
import MyLoansModal from '../modal/MyLoansModal';
import AttachMoney from '@material-ui/icons/AttachMoney';
import { warningMsgBar, infoMsgBar } from '../../redux/Notification/notification.actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins } from '@fortawesome/free-solid-svg-icons';
import { convertToCurrency } from '../../util/conversion';

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
  },
};

class BankModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showMyLoansModal: false,
      showPopup: false,
      sortCriteria: 'updated_at',
      loanType: 'standard',
    };
  }

  handleOpenMyLoansModal = () => {
    if (!this.state.showMyLoansModal) {
      this.setState({ showMyLoansModal: true, anchorEl: null });
    }
  };

  handleCloseMyLoansModal = () => {
    this.setState({ showMyLoansModal: false });
  };

  togglePopup = () => {
    this.setState({ showPopup: !this.state.showPopup });
  };

  render() {
    const { isDarkMode } = this.props;
    return (
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.props.closeModal}
        style={customStyles}
        contentLabel="P2P Lending Modal"
      >
        <div className={`${this.props.isDarkMode ? 'dark_mode' : ''} big-modal`}>
          <div className="modal-header">
            <h2 className="modal-title">
              <FontAwesomeIcon icon={faCoins} className="mr-2" />
              P2P Lending
            </h2>
            <Button className="btn-close" onClick={this.props.closeModal}>
              ×
            </Button>
          </div>

          <div className="modal-body edit-modal-body banking-modal-body">
            <div className="modal-content-wrapper">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className='modal-title'>ALL LOANS</h1>

                <div style={{ width: '50%', textAlign: 'right', padding: '20px' }}>
                  <span>HELP</span>&nbsp;
                  <span>
                    <Help style={{ width: '16', marginTop: '-3px', cursor: 'pointer' }} onClick={this.togglePopup} />
                  </span>
                </div>
              </div>

              <div className="modal-content-panel">
                <BankPage itemType='this.state.loanType' sortCriteria='this.state.sortCriteria' />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button className="btn-back" onClick={this.handleOpenMyLoansModal}>Manage Your Loans&nbsp; <AttachMoney /></Button>
          </div>
        </div>

        {this.state.showMyLoansModal && (
          <MyLoansModal
            modalIsOpen={this.state.showMyLoansModal}
            closeModal={this.handleCloseMyLoansModal}
          />
        )}

        {this.state.showPopup && (
          <div className={`${isDarkMode ? 'popup-overlay dark_mode' : 'popup-overlay'}`}>

            <div className="popup">
              <h2 className='modal-title' style={{ textAlign: 'center', marginBottom: "20px" }}>Loan Information</h2>
              <div className="popup-content">
                <img src='../img/loans.svg' style={{ borderRadius: '20px', border: '1px solid aaa9', overflow: 'hidden' }} alt="Loans" />
                <h3>Peer-to-Peer Loans Overview</h3>
                <p>Peer-to-peer lending, also known as P2P lending, connects borrowers directly with investors.</p>
                <p>Steps to get started with P2P lending:</p>
                <p>(As Loaner)</p>
                <ol>
                  <li>Go To 'Manage Your Loans'</li>
                  <li>Click 'Create New Loan'</li>
                  <li>Set 'Loan Type' (coming soon). Secured Loans guarantee repayments even if it's assets. Unsecured Loans do not.</li>
                  <li>Set an Interest Rate (APY), typically around 10%~30%</li>
                  <li>Earn returns as lenders repay their loans, including principal and interest.</li>
                </ol>
                <p>(As Lender)</p>
                <ol>
                  <li>Browse available loan listings by peers.</li>
                  <li>Click 'Loan' and <i>Check Eligibility</i></li>
                  <li>Check the criteria fits your circumstances (loaning period, APY)</li>
                  <li>Enter the amount you want to Loan and accept the debt.</li>
                  <li>Repay the loan by going to your wallet and clicking the red button that states your remaining debt.</li>
                  <li>Increase / Decrease credit score on repayment (failures).</li>
                </ol>
                <Button style={{ display: 'block', margin: 'auto' }} onClick={this.togglePopup}>OK, GOT IT!</Button>
              </div>
              <button className="popup-close" onClick={this.togglePopup}>&times;</button>
            </div>
          </div>
        )}
      </Modal>
    );
  }
}

const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,
});

const mapDispatchToProps = {
  warningMsgBar,
  infoMsgBar,
};

export default connect(mapStateToProps, mapDispatchToProps)(BankModal);
